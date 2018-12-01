// Implements controls bound to the GUI
class GameController {

  constructor(app) {
    if (!app) throw new Error('App is undefined');
    this.app = app;
    this.game = new Game(this.app);

    this.selectedColumn = 0;
  }

  step(dt) {

  }

  // Push current column down
  pushDown() {
    this.game.pushDown(this.selectedColumn);
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
    ctx.scale(1, -1);
    ctx.translate(0, -(this.app.height * this.app.scale));

    ctx.fillStyle = '#fff';
    ctx.save();
    ctx.translate(this.selectedColumn * cell_width, 450);
    ctx.beginPath();
    ctx.moveTo(5, 0);
    ctx.lineTo(20, -20);
    ctx.lineTo(35, 0);
    ctx.fill();
    ctx.restore();
    this.game.render(ctx, dt, selected);
    ctx.restore();
  }
}
