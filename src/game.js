const RED    = 0;
const BLUE   = 1;
const YELLOW = 2;
const GREEN  = 3;
const EMPTY  = 4;

const NO_ID = -1;

class GameSystem extends ECS.System {
  constructor(app) {
    super();
    this.app = app;

    this.player = createPlayer(1,1);
    this.app.ecs.addEntity(this.player);

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

    this.score = 0;
    this.displayScore = 0;

    this.timer = 1;
    this.timerSpeed = .01;
    this.timerSpeedMax = .1;

    this.scoreIntoTimer = .001;
    this.scoreIntoTimerSpeed = .000001;

    this.bottomRow = 0;
  }

  highlightMatchCells(duration) {
    for (let c of this.cellsInMatch) {
      const id = this.grid[c];
      const e = this.app.ecs.getEntityById(id);
      const color = gameColorToHex(e.components.people.color);
      this.app.renderingSystem.highlightTile(c, 2, duration, color);
    }
  }

  step(dt) {
    if (this.timer === 0) {
      this.app.setState(STATES.RemoveBottomRow);
      this.timer = 1;
      return;
    }

    this.timer = Math.max(0, this.timer - this.timerSpeed * dt);
    if (this.app.renderingSystem.timerFill) {
      this.app.renderingSystem.timerFill.scale.x = this.timer;
    }
  }

  removeBottomRow() {
    // If there are fewer than 3 lines, you lose
    if (this.gridHeight - this.bottomRow <= 3) {
      this.app.setState(STATES.GameOver);
      return;
    }

    // Empty all cells, and remove entities of bottom row
    for (let x=0; x < this.gridWidth; ++x) {
      this.removeXY(x, this.bottomRow);
    }

    this.bottomRow++;
  }

  test(entity) {
    return entity.components.player || entity.components.people;
  }

  enter(entity) {
  }

  destroySystem() {
    for (let y=0; y < this.gridHeight; ++y) {
      for (let x=0; x < this.gridWidth; ++x) {
        this.removeXY(x, y);
      }
    }

    this.app.ecs.removeEntity(this.player);
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
    entity.components.pos.y = clamp(entity.components.pos.y, this.bottomRow + 1, this.gridHeight - 1);

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

    this.app.moveEasing = TWEEN.Easing.Linear.None;
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

    this.app.moveEasing = TWEEN.Easing.Linear.None;
  }

  moveEntityTo(entity_id, grid_xy) {
    const e = this.app.ecs.getEntityById(entity_id);
    const px = grid_xy % this.gridWidth;
    const py = Math.floor(grid_xy / this.gridWidth);
    e.components.people.old_x = e.components.pos.x;
    e.components.people.old_y = e.components.pos.y;
    e.components.pos.x = px;
    e.components.pos.y = py;
    e.components.people.state = 'moving';
  }

  updatePeople(entity) {
    const {people} = entity.components;

    if (people.state === 'moving') {
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

    for (let y=this.bottomRow; y < this.gridHeight; ++y) {
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

      let matchScore = 0;
      for (let a in m) {
        if (m[a] > 1) {
          matchScore += (m[a]-1) * 500;
        } else {
          matchScore += 100;
        }
      }
      // Match different patterns is a multiplier
      matchScore *= Object.keys(m).length;
      this.currentCombo++;
      matchScore *= this.currentCombo * 3;

      this.score += matchScore;

      new TWEEN.Tween(this)
        .to({displayScore: this.score}, .5)
        .easing(TWEEN.Easing.Quadratic.Out)
        .start(this.app.renderingSystem.t);

      // Refill timer
      this.timer += matchScore * this.scoreIntoTimer;
      this.timer = clamp(this.timer, 0, 1);
      this.app.renderingSystem.fillTimer(this.timer);

      // And increase speed of timer!
      this.timerSpeed += matchScore * this.scoreIntoTimerSpeed;
      this.timerSpeed = clamp(this.timerSpeed, 0, this.timerSpeedMax);

      this.currentMatches = undefined;
    }
  }

  removeCell(cell) {
    const y = Math.floor(cell / this.gridWidth);
    const x = cell % this.gridWidth;
    this.removeXY(x, y);
  }

  fillHoles() {
    this.app.moveEasing = TWEEN.Easing.Linear.None;

    for (let c of this.columnsWithHoles) {
      // Find first hole going up
      for (let y=this.bottomRow; y < this.gridHeight; ++y) {
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
        for (let y=this.bottomRow; y < this.gridHeight; ++y) {
          if (this.getXY(c, y) === EMPTY) {
            return true;
          }
        }
        return false;
      });
  }

  pushDown(x, y) {
    for (; y < this.gridHeight - 1; ++y) {
      this.moveXYDown(x, y + 1);
    }
    this.addXY(x, y, randomColor());
  }

  getXY(x, y) {
    const id = this.grid[y * this.gridWidth + x];
    const e = this.app.ecs.getEntityById(id);
    if (id === NO_ID) {
      return EMPTY;
    } else {
      return e.components.people.color;
    }
  }

  removeXY(x, y) {
    const xy = y * this.gridWidth + x;
    const id = this.grid[xy];

    if (id !== NO_ID) {
      this.app.ecs.removeEntityById(id);
      this.grid[xy] = NO_ID;
    }
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
    const id = this.grid[xy];

    if (id !== NO_ID) {
      const down = xy - this.gridWidth;
      this.grid[down] = id;
      this.grid[xy] = NO_ID;
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
