class ControlsSystem extends ECS.System
{
  constructor(app)
  {
    super();

    this.app = app;
    this.keys = {};
  }

  test(entity)
  {
    return entity.components.player;
  }

  enter(entity)
  {
  }

  update(entity)
  {
    entity.components.player.moveLeft    = this.keys.left;
    entity.components.player.moveRight   = this.keys.right;
    entity.components.player.moveUp      = this.keys.up;
    entity.components.player.moveDown    = this.keys.down;
    entity.components.player.rotateLeft  = this.keys.rotateLeft;
    entity.components.player.rotateRight = this.keys.rotateRight;

    this.keys = {};
  }

  input(keyboard)
  {
    if (keyboard.keys.down)
      this.keys.down = true;
    if (keyboard.keys.up)
      this.keys.up = true;
    if (keyboard.keys.left)
      this.keys.left = true;
    if (keyboard.keys.right)
      this.keys.right = true;
    if (keyboard.keys.z)
      this.keys.rotateLeft = true;
    if (keyboard.keys.x)
      this.keys.rotateRight = true;
  }
}
