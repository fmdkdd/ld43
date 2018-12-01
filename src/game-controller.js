// Implements controls bound to the GUI
class GameController {

  constructor(app) {
    if (!app) throw new Error('App is undefined');
    this.app = app;
    this.game = new Game(this.app);

    this.selectedColumn = 0;
    this.timer = 30;
    this.timer_max = 30;
  }

  step(dt) {
    this.timer -= dt;
    this.timer = Math.max(0, this.timer);

    if (this.timer === 0) {
      this.app.setState(STATES.GameOver);
    }
  }

  // Push current column down
  pushDown() {
    const out = this.game.pushDown(this.selectedColumn);

    if (out === RED) {
      this.timer += 1;
    } else {
      this.timer -= 1;
    }

    this.checkForMatches();
  }

  checkForMatches() {
    // Check for matches
    // If there is one, empty the cells,
    // then move all columns to fill holes after a pause
    const matches = this.game.checkAllMatches();
    if (matches.length > 0) {
      this.cellsInMatch = matches.reduce((acc, val) => acc.concat(val), []);
      this.app.setState(STATES.PreHighlightMatchCells);
    }
  }

  moveLeft() {
    this.selectedColumn = Math.max(0, this.selectedColumn - 1);
  }

  moveRight() {
    this.selectedColumn = Math.min(this.game.width-1, this.selectedColumn + 1);
  }

  removeMatchCells() {
    if (this.cellsInMatch) {
      for (let c of this.cellsInMatch) {
        this.game.removeCell(c);
      }

      this.cellsInMatch = undefined;
    }
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
    ctx.translate(this.selectedColumn * cell_width, 450);
    ctx.beginPath();
    ctx.moveTo(5, 0);
    ctx.lineTo(20, -20);
    ctx.lineTo(35, 0);
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
