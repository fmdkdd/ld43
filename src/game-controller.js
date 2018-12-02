// Implements controls bound to the GUI
class GameController {

  constructor(app) {
    if (!app) throw new Error('App is undefined');
    this.app = app;
    this.game = new Game(this.app);

    this.selectedColumn = 0;
    this.timer = 30;
    this.timer_max = 30;

    this.selectedPoint = [1,3];
  }

  step(dt) {
    // this.timer -= 2 * dt;
    this.timer = Math.max(0, this.timer);

    if (this.timer === 0) {
      this.app.setState(STATES.GameOver);
    }
  }

  // Push current column down
  pushDown() {
    const out = this.game.pushDown(this.selectedColumn);

    // if (out === RED) {
    //   this.timer += 1;
    // } else {
    //   this.timer -= 1;
    // }

    this.checkForMatches();
  }

  checkForMatches() {
    // Check for matches
    // If there is one, empty the cells,
    // then move all columns to fill holes after a pause
    const matches = this.game.checkAllMatches();
    if (matches.length > 0) {

      // Check for RED matches
      matches
        .filter(m => this.game.grid.cells[m[0]] === RED)
        .forEach(m => this.timer += m.length * 2);
      this.timer = Math.min(this.timer, this.timer_max);

      this.cellsInMatch = matches.reduce((acc, val) => acc.concat(val), []);
      this.app.setState(STATES.PreHighlightMatchCells);
    }
  }

  moveUp() {
    this.selectedPoint[1] = Math.min(this.game.height - 1, this.selectedPoint[1] + 1);
  }

  moveDown() {
    this.selectedPoint[1] = Math.max(1, this.selectedPoint[1] - 1);
  }

  moveLeft() {
    this.selectedPoint[0] = Math.max(1, this.selectedPoint[0] - 1);
  }

  moveRight() {
    this.selectedPoint[0] = Math.min(this.game.width - 1, this.selectedPoint[0] + 1);
  }

  rotateLeft() {
    const [x,y] = this.selectedPoint;
    this.cellsInRotation = [
      [x, y],
      [x-1, y],
      [x-1, y-1],
      [x, y-1]
    ].map(([x,y]) => y * this.game.width + x);
    this.app.setState(STATES.RotateLeft);
  }

  rotateCellsLeft() {
    if (this.cellsInRotation) {
      const grid = this.game.grid.cells;
      const c = this.cellsInRotation;
      const bak = grid[c[0]];
      grid[c[0]] = grid[c[3]];
      grid[c[3]] = grid[c[2]];
      grid[c[2]] = grid[c[1]];
      grid[c[1]] = bak;
      this.cellsInRotation = undefined;
    }
  }

  rotateRight() {
    const [x,y] = this.selectedPoint;
    this.cellsInRotation = [
      [x, y],
      [x-1, y],
      [x-1, y-1],
      [x, y-1]
    ].map(([x,y]) => y * this.game.width + x);
    this.app.setState(STATES.RotateRight);
  }

  rotateCellsRight() {
    if (this.cellsInRotation) {
      const grid = this.game.grid.cells;
      const c = this.cellsInRotation;
      const bak = grid[c[0]];
      grid[c[0]] = grid[c[1]];
      grid[c[1]] = grid[c[2]];
      grid[c[2]] = grid[c[3]];
      grid[c[3]] = bak;
      this.cellsInRotation = undefined;
    }
  }

  removeMatchCells() {
    if (this.cellsInMatch) {
      this.columnsWithHoles = [];

      for (let c of this.cellsInMatch) {
        this.game.removeCell(c);
        const col = c % this.game.width;
        if (this.columnsWithHoles.indexOf(col) === -1) {
          this.columnsWithHoles.push(col);
        }
      }

      this.cellsInMatch = undefined;
    }
  }

  fillHoles() {
    for (let c of this.columnsWithHoles) {
      // Find first hole going up
      for (let y=0; y < this.game.height; ++y) {
        if (this.game.grid.get(c, y) === EMPTY) {
          this.game.pushDown(c, y);
          break;
        }
      }
    }

    // Are there any holes left?
    this.columnsWithHoles =
      this.columnsWithHoles
      .filter(c => {
        for (let y=0; y < this.game.height; ++y) {
          if (this.game.grid.get(c, y) === EMPTY) {
            return true;
          }
        }
        return false;
      });
  }

  render(dt, selected) {
    const ctx = this.app.renderer;

    ctx.save();
    // Flip Y to have it as a standard origin
    ctx.scale(1, -1);
    ctx.translate(0, -(this.app.height * this.app.scale));

    // Draw priest
    ctx.fillStyle = '#fff';
    ctx.save();
    ctx.translate(this.selectedPoint[0] * cell_width,
                  this.selectedPoint[1] * cell_height);
    ctx.beginPath();
    ctx.moveTo(-10,  0);
    ctx.lineTo(  0, 10);
    ctx.lineTo( 10,  0);
    ctx.lineTo(  0,-10);
    ctx.fill();
    ctx.restore();

    // Draw grid
    this.game.render(ctx, dt, selected);

    // Draw timer background
    const timer_width = 300;
    ctx.strokeStyle = '#533';
    ctx.lineWidth = 20;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(400, 100);
    ctx.lineTo(400 + timer_width, 100);
    ctx.stroke();

    // Draw timer fill
    const t = this.timer / this.timer_max;

    if (t > 0) {
      ctx.strokeStyle = '#a00';
      ctx.lineWidth = 12;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(400, 100);
      ctx.lineTo(400 + timer_width * t, 100);
      ctx.stroke();
    }

    ctx.restore();
  }
}
