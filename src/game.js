const DEBUG = false;

const RED = {};
const BLUE = {};
const YELLOW = {};
const GREEN = {};
const EMPTY = {};
const COLORS = [RED, BLUE, YELLOW, GREEN];

const MIN_MATCHES = 4;

const cell_width = 50;
const cell_height = 50;
const margin = 2;

const pattern_cell_width = 25;
const pattern_cell_height = 25;
const pattern_margin = 50;

class Game {
  constructor(app) {
    this.app = app;
    this.width = 7;
    this.height = 7;

    this.grid = new Grid(this.width, this.height);
    this.randomizeGrid();

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
  }

  // Put random colors in grid
  randomizeGrid() {
    for (let x=0; x < this.width; ++x) {
      for (let y=0; y < this.height; ++y) {
        this.grid.putAtUnchecked(this.randomColor(), x, y);
      }
    }
  }

  checkAllMatches() {
    const matches = [];

    for (let y=0; y < this.height; ++y) {
      for (let x=0; x < this.width; ++x) {
        for (let p of this.patterns) {
          const m = this.matchPatternAt(p, x, y);
          if (m.length > 0) {
            matches.push(m);
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
    if (x + w > this.width || y + h > this.height) {
      return [];
    }

    for (let yy=0; yy < h; ++yy) {
      for (let xx=0; xx < w; ++xx) {
        const c = this.grid.getUnchecked(x + xx, y + yy);
        const m = this.matchPatternChar(pattern[yy][xx], c);
        switch (m) {
          // no match
        case 0: return [];
          // include in match
        case 1: match.push((y + yy) * this.width + x + xx); break;
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
    case '0': return color === RED  ? 1 : 0;
    case '1': return color === BLUE ? 1 : 0;
    case '2': return color === YELLOW ? 1 : 0;
    case '3': return color === GREEN ? 1 : 0;
    case '.': return 2;
    default:  return 0;
    }
  }

  pushDown(column, row) {
    return this.grid.pushColumn(column, this.randomColor(), row);
  }

  removeCell(cell) {
    const row = Math.floor(cell / this.width);
    const column = cell % this.width;
    this.grid.putAtUnchecked(EMPTY, column, row);
  }

  randomColor() {
    return COLORS[Math.floor(Math.random() * 4)];
  }

  drawPattern(pattern, ctx, dt) {
    const h = pattern.length;
    const w = pattern[0].length;

    for (let y=0; y < h; ++y) {
      for (let x=0; x < w; ++x) {
        if (pattern[y][x] === '.') {
          continue;
        }

        const px = x * pattern_cell_width;
        const py = y * pattern_cell_height;

        switch (pattern[y][x]) {
        case '0': ctx.fillStyle = '#f00'; break;
        case '1': ctx.fillStyle = '#00f'; break;
        case '2': ctx.fillStyle = '#ff0'; break;
        case '3': ctx.fillStyle = '#0f0'; break;
        }

        ctx.fillRect(px, py, pattern_cell_width, pattern_cell_height);
      }
    }
  }

  render(ctx, dt, options = {}) {
    // Draw patterns
    let pattern_x = 0;
    for (let p of this.patterns) {
      const w = p[0].length;
      ctx.save();
      ctx.translate(400 + pattern_x, 200);
      pattern_x += pattern_cell_width * w + pattern_margin;
      this.drawPattern(p, ctx, dt);
      ctx.restore();
    }

    for (let x=0; x < this.width; ++x) {
      let hole_found = false;
      for (let y=0; y < this.height; ++y) {
        switch (this.grid.getUnchecked(x, y)) {
        case EMPTY  : hole_found = true; continue;
        case RED    : ctx.fillStyle = '#f00'; break;
        case BLUE   : ctx.fillStyle = '#00f'; break;
        case YELLOW : ctx.fillStyle = '#ff0'; break;
        case GREEN  : ctx.fillStyle = '#0f0'; break;
        default     : ctx.fillStyle = '#000'; break;
        }

        // Pixel coordinates of lower left corner
        const px = x * cell_width + margin;
        const py = y * cell_height + margin;
        // Pixel width and height of cell
        const pw = cell_width - margin*2;
        const ph = cell_height - margin*2;

        const xy = y * this.grid.width + x;
        if (options.skip && options.skip.indexOf(xy) > -1) {
          continue;
        }

        let off_x = 0;
        let off_y = 0;
        if (options.offset) {
          if (options.offset_rev) {
            switch (options.offset.indexOf(xy)) {
            case 0: off_y = -options.offset_value * cell_height; break;
            case 1: off_x =  options.offset_value * cell_width; break;
            case 2: off_y =  options.offset_value * cell_height; break;
            case 3: off_x = -options.offset_value * cell_width; break;
            }
          } else {
            switch (options.offset.indexOf(xy)) {
            case 0: off_x = -options.offset_value * cell_width; break;
            case 1: off_y = -options.offset_value * cell_height; break;
            case 2: off_x =  options.offset_value * cell_width; break;
            case 3: off_y =  options.offset_value * cell_height; break;
            }
          }
        }

        if (options.downward && options.downward.indexOf(x) > -1 && hole_found) {
          off_y = -options.offset_value * cell_height;
        }

        ctx.fillRect(px + off_x, py + off_y, pw, ph);

        if (options.highlight && options.highlight.indexOf(xy) > -1) {
          ctx.lineWidth = 8;
          ctx.strokeStyle = '#fff';
          ctx.strokeRect(px+4, py+4, pw-8, ph-8);
        }

        if (DEBUG) {
          ctx.save();
          ctx.translate(px, py);
          ctx.scale(1, -1);
          ctx.fillStyle = '#333';
          ctx.fillText(xy, pw/2, -ph/2);
          ctx.fillText(x + "," + y, pw/2, -ph/2 + 10);
          ctx.restore();
        }
      }
    }
  }
}

// The grid contains WIDTHxHEIGHT cells of different colors.
class Grid {
  constructor(width, height) {
    if (width < 0) throw new Error('width must be > 0');
    if (height < 0) throw new Error('height must be > 0');
    this.width = width;
    this.height = height;
    this.cells = new Array(width * height);
  }

  // Throw if coordinates are out of bounds
  checkBounds(x,y) {
    if (!this.inBounds(x,y)) {
      throw new Error(`(${x},${y}) out of bounds [${this.width},${this.height}[`);
    }
  }

  // Whether (x,y) is in bounds of this grid
  inBounds(x,y) {
    return (x >= 0 && x < this.width && y >= 0 && y < this.height);
  }

  // Return content of cell (x,y)
  get(x, y) {
    this.checkBounds(x, y);
    return this.getUnchecked(x, y);
  }

  getUnchecked(x, y) {
    return this.cells[y * this.width + x];
  }

  putAt(obj, x, y) {
    this.checkBounds(x, y);
    this.putAtUnchecked(obj, x, y);
  }

  putAtUnchecked(obj, x, y) {
    this.cells[y * this.width + x] = obj;
  }

  // Push all cells in COLUMN downward one unit, starting from ROW, and return
  // the cell that fell out.  NEW_CELL is added at the top.
  pushColumn(column, new_cell, row=0) {
    const out = this.get(column, row)

    let y=row;
    for (; y < this.height-1; ++y) {
      this.putAtUnchecked(this.getUnchecked(column, y+1), column, y);
    }
    this.putAtUnchecked(new_cell, column, y);

    return out;
  }
}
