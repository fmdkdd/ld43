const RED = {};
const BLUE = {};
const YELLOW = {};
const GREEN = {};
const COLORS = [RED, BLUE, YELLOW, GREEN];

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
          if (cur.length > 2) {
            matches.push(cur);
          }
          cur = [xy];
          color = c;
        }
      }
      if (cur.length > 2) {
        matches.push(cur);
      }
    }

    return matches;
  }

  // Return coordinate of cells that are in a match, after COLUMN was pushed
  // down, starting at ROW.
  checkMatchesInColumn(column, row = 0) {
    const matches = [];

    for (let y=row; y < this.height; ++y) {
      const m = this.checkMatchesInRow(column, y);
      if (m) {
        matches.push(m);
      }
    }

    return matches;
  }

  checkMatchesInRow(column, row) {
    const y = row;
    const cells = [y * this.width + column];
    const color = this.grid.get(column, y);

    // Look on the same row for cells of same color
    for (let x=column-1; x >= 0 && this.grid.get(x, y) == color; --x) {
      cells.push(y * this.width + x);
    }
    for (let x=column+1; x < this.width && this.grid.get(x, y) == color; ++x) {
      cells.push(y * this.width + x);
    }

    if (cells.length > 2) {
      return cells;
    } else {
      return undefined;
    }
  }

  pushDown(column) {
    this.grid.pushColumn(column, this.randomColor(), 0);
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

        ctx.fillRect(px, py, pw, ph);

        if (options.highlight && options.highlight.indexOf(xy) > -1) {
          ctx.lineWidth = 8;
          ctx.strokeStyle = '#fff';
          ctx.strokeRect(px+4, py+4, pw-8, ph-8);
        }

        // @Debug:
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
