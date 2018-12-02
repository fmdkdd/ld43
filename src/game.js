const DEBUG = true;

const RED = {};
const BLUE = {};
const YELLOW = {};
const GREEN = {};
const COLORS = [RED, BLUE, YELLOW, GREEN];

const MIN_MATCHES = 4;

const cell_width = 40;
const cell_height = 60;
const margin = 2;

class Game {
  constructor(app) {
    this.app = app;
    this.width = 7;
    this.height = 7;

    this.grid = new Grid(this.width, this.height);
    this.randomizeGrid();
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
      let color = this.grid.getUnchecked(0, y);
      let cur = [y * this.width];

      for (let x=1; x < this.width; ++x) {
        const xy = y * this.width + x;
        const c = this.grid.getUnchecked(x,y);

        if (c === color) {
          cur.push(xy);
        } else {
          if (cur.length > MIN_MATCHES) {
            matches.push(cur);
          }
          cur = [xy];
          color = c;
        }
      }
      if (cur.length > MIN_MATCHES) {
        matches.push(cur);
      }
    }

    return matches;
  }

  pushDown(column) {
    return this.grid.pushColumn(column, this.randomColor(), 0);
  }

  removeCell(cell) {
    const row = Math.floor(cell / this.width);
    const column = cell % this.width;
    this.grid.pushColumn(column, this.randomColor(), row);
  }

  randomColor() {
    return COLORS[Math.floor(Math.random() * 4)];
  }

  render(ctx, dt, options = {}) {
    for (let x=0; x < this.width; ++x) {
      for (let y=0; y < this.height; ++y) {
        // Pixel coordinates of lower left corner
        const px = x * cell_width + margin;
        const py = y * cell_height + margin;
        // Pixel width and height of cell
        const pw = cell_width - margin*2;
        const ph = cell_height - margin*2;

        switch (this.grid.getUnchecked(x, y)) {
        case RED    : ctx.fillStyle = '#f00'; break;
        case BLUE   : ctx.fillStyle = '#0f0'; break;
        case YELLOW : ctx.fillStyle = '#ff0'; break;
        case GREEN  : ctx.fillStyle = '#00f'; break;
        default     : ctx.fillStyle = '#000'; break;
        }

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
