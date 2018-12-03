const RED    = 0;
const BLUE   = 1;
const YELLOW = 2;
const GREEN  = 3;
const EMPTY  = 4;

class GameSystem extends ECS.System {
  constructor(app) {
    super();
    this.app = app;

    const player = createPlayer(1,1);
    this.app.ecs.addEntity(player);

    this.gridHeight = 10;
    this.gridWidth = 7;
    this.grid = new Array(this.gridWidth * this.gridHeight);
    for (let y = 0; y < this.gridHeight; ++y) {
      for (let x = 0; x < this.gridWidth; ++x) {
        const e = createPeople(x, y);
        this.app.ecs.addEntity(e);
        this.grid[y * this.gridWidth + x] = e.id;
      }
    }

    this.patterns = [
      "000\n"+
      ".0.",

      "11\n"+
      "1.\n"+
      "1.",

      ".22\n"+
      "22.",

      "33\n"+
      "33",
    ].map(p => p.split('\n').reverse());

    this.currentCombo = 0;
    this.columnsWithHoles = [];
  }

  test(entity) {
    return entity.components.player || entity.components.people;
  }

  enter(entity) {
  }

  update(entity) {
    if (entity.components.player) {
      this.updatePlayer(entity);
    } else if (entity.components.people) {
      this.updatePeople(entity);
    }
  }

  updatePlayer(entity) {
    if (entity.components.player.moveLeft)
      entity.components.pos.x--;
    if (entity.components.player.moveRight)
      entity.components.pos.x++;
    if (entity.components.player.moveUp)
      entity.components.pos.y++;
    if (entity.components.player.moveDown)
      entity.components.pos.y--;

    // Clamp position
    entity.components.pos.x = clamp(entity.components.pos.x, 1, this.gridWidth - 1);
    entity.components.pos.y = clamp(entity.components.pos.y, 1, this.gridHeight - 1);

    if (entity.components.player.rotateLeft)
      this.rotateLeft(entity);
    else if (entity.components.player.rotateRight)
      this.rotateRight(entity);
  }

  rotateLeft(entity) {
    const {x,y} = entity.components.pos;
    const c = [
      [x, y],
      [x-1, y],
      [x-1, y-1],
      [x, y-1]
    ].map(([x,y]) => y * this.gridWidth + x);

    const grid = this.grid;
    const bak = grid[c[0]];
    grid[c[0]] = grid[c[3]];
    grid[c[3]] = grid[c[2]];
    grid[c[2]] = grid[c[1]];
    grid[c[1]] = bak;

    for (let i=0; i < 4; ++i) {
      this.moveEntityTo(grid[c[i]], c[i]);
    }

    this.app.setState(STATES.Rotating);
  }

  rotateRight(entity) {
    const {x,y} = entity.components.pos;
    const c = [
      [x, y],
      [x-1, y],
      [x-1, y-1],
      [x, y-1]
    ].map(([x,y]) => y * this.gridWidth + x);

    const grid = this.grid;
    const bak = grid[c[0]];
    grid[c[0]] = grid[c[1]];
    grid[c[1]] = grid[c[2]];
    grid[c[2]] = grid[c[3]];
    grid[c[3]] = bak;

    for (let i=0; i < 4; ++i) {
      this.moveEntityTo(grid[c[i]], c[i]);
    }

    this.app.setState(STATES.Rotating);
  }

  moveEntityTo(entity_id, grid_xy) {
    const e = this.app.ecs.getEntityById(entity_id);
    const px = grid_xy % this.gridWidth;
    const py = Math.floor(grid_xy / this.gridWidth);
    e.components.people.old_x = e.components.pos.x;
    e.components.people.old_y = e.components.pos.y;
    e.components.pos.x = px;
    e.components.pos.y = py;
    e.components.people.state = 'rotating';
  }

  updatePeople(entity) {
    const {people} = entity.components;

    if (people.state === 'rotating') {
      const t = this.app.rotationTheta;

      if (t === 1) {
        people.state = 'idle';
        people.old_x = 0;
        people.old_y = 0;
      }
    }
  }

  checkMatches() {
    this.currentMatches = this.findMatches();
    if (this.currentMatches.length > 0) {
      this.cellsInMatch = this.currentMatches
        .reduce((acc, m) => acc.concat(m.cells), []);
      this.app.setState(STATES.PreHighlightMatchCells);
    }
  }

  findMatches() {
    const matches = [];

    for (let y=0; y < this.gridHeight; ++y) {
      for (let x=0; x < this.gridWidth; ++x) {
        for (let p=0; p < this.patterns.length; ++p) {
          const m = this.matchPatternAt(this.patterns[p], x, y);
          if (m.length > 0) {
            matches.push({pattern: p, cells: m});
          }
        }
      }
    }

    return matches;
  }

  // Whether a single PATTERN match starting at lower-left corner X,Y.
  // Return matching cells.
  matchPatternAt(pattern, x, y) {
    const h = pattern.length;
    const w = pattern[0].length;
    const match = [];

    // Bail if the pattern is too large to fit
    if (x + w > this.gridWidth || y + h > this.gridHeight) {
      return [];
    }

    for (let yy=0; yy < h; ++yy) {
      for (let xx=0; xx < w; ++xx) {
        const c = this.getXY(x + xx, y + yy);
        const m = this.matchPatternChar(pattern[yy][xx], c);
        switch (m) {
          // no match
        case 0: return [];
          // include in match
        case 1: match.push((y + yy) * this.gridWidth + x + xx); break;
          // don't include in match
        case 2: break;
        }
      }
    }

    return match;
  }

  // Whether COLOR matches pattern CHAR.
  matchPatternChar(char, color) {
    switch (char) {
    case '0': return color === RED ? 1 : 0;
    case '1': return color === BLUE ? 1 : 0;
    case '2': return color === YELLOW ? 1 : 0;
    case '3': return color === GREEN ? 1 : 0;
    case '.': return 2;
    default:  return 0;
    }
  }

  removeMatchCells() {
    if (this.cellsInMatch) {
      this.columnsWithHoles = [];

      for (let c of this.cellsInMatch) {
        this.removeCell(c);
        const col = c % this.gridWidth;
        if (this.columnsWithHoles.indexOf(col) === -1) {
          this.columnsWithHoles.push(col);
        }
      }

      this.cellsInMatch = undefined;

      // Look at matches and determine their type
      const m = groupSame(this.currentMatches
                          .map(m => m.pattern));

      if (Object.keys(m).length > 1) {
        console.log("Multi-match!");
      }

      for (let a in m) {
        switch (m[a]) {
        case 1: break;
        case 2: console.log("Double match"); break;
        case 3: console.log("Triple match!"); break;
        case 4: console.log("Quadruple match!!"); break;
        default: console.log("Amazing!!!"); break;
        }
      }

      this.currentCombo++;

      this.currentMatches = undefined;
    }
  }

  removeCell(cell) {
    const y = Math.floor(cell / this.gridWidth);
    const x = cell % this.gridWidth;
    this.removeXY(x, y);
  }

  fillHoles() {
    for (let c of this.columnsWithHoles) {
      // Find first hole going up
      for (let y=0; y < this.gridHeight; ++y) {
        if (this.getXY(c, y) === EMPTY) {
          this.pushDown(c, y);
          break;
        }
      }
    }

    // Are there any holes left?
    this.columnsWithHoles =
      this.columnsWithHoles
      .filter(c => {
        for (let y=0; y < this.gridHeight; ++y) {
          if (this.getXY(c, y) === EMPTY) {
            return true;
          }
        }
        return false;
      });
  }

  pushDown(x, y) {
    const out = this.getXY(x, y);

    for (; y < this.gridHeight - 1; ++y) {
      this.moveXYDown(x, y + 1);
    }
    this.addXY(x, y, randomColor());

    return out;
  }

  getXY(x, y) {
    const id = this.grid[y * this.gridWidth + x];
    const e = this.app.ecs.getEntityById(id);
    if (id === EMPTY) {
      return EMPTY;
    } else {
      return e.components.people.color;
    }
  }

  removeXY(x, y) {
    const xy = y * this.gridWidth + x;
    const id = this.grid[xy];
    this.app.ecs.removeEntityById(id);
    this.grid[xy] = EMPTY;
  }

  addXY(x, y, color) {
    const xy = y * this.gridWidth + x;
    const e = createPeople(x, y+1, color);
    this.app.ecs.addEntity(e);
    this.grid[xy] = e.id;
    this.moveEntityTo(e.id, xy);
  }

  moveXYDown(x, y) {
    // const from = (y+1) * this.gridWidth + x;
    // const up = this.grid[from];

    const xy = y * this.gridWidth + x;
    const down = xy - this.gridWidth;
    const id = this.grid[xy];

    if (id !== EMPTY) {
      this.grid[down] = id;
      //const e = this.app.ecs.getEntityById(id);
      // e.components.people.color = color;
      // e.components.people.color_changed = true;
      this.moveEntityTo(id, down);
    }
  }
}

// Return X clamped to [A,B].
function clamp(x, a, b) {
  if (x < a) return a;
  if (x > b) return b;
  return x;
}

// Group identical values of ARRAY.
function groupSame(array) {
  const bins = {};

  for (let i=0; i < array.length; ++i) {
    const x = array[i];
    if (bins[x] == null) {
      bins[x] = 1;
    } else {
      bins[x]++;
    }
  }

  return bins;
}

function randomColor() {
  return Math.floor(Math.random() * 4);
}
