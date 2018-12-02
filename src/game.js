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
  }

  test(entity) {
    return entity.components.player || entity.components.people;
  }

  enter(entity) {
  }

  update(entity) {

    if (entity.components.player) {
      this.updatePlayer(entity);
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
      this.updateEntityPos(grid[c[i]], c[i]);
    }
  }

  updateEntityPos(entity_id, grid_xy) {
    const e = this.app.ecs.getEntityById(this.grid[grid_xy]);
    const px = grid_xy % this.gridWidth;
    const py = Math.floor(grid_xy / this.gridWidth);
    e.components.pos.x = px;
    e.components.pos.y = py;
  }

  rotateRight(entity) {

  }
}

// Return X clamped to [A,B].
function clamp(x, a, b) {
  if (x < a) return a;
  if (x > b) return b;
  return x;
}
