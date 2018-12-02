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
    return !!entity.components.pos && entity.components.controllable;
  }

  enter(entity)
  {
  }

  update(entity)
  {
    if (this.keys.left)
      entity.components.pos.x++;
    else if (this.keys.right)
      entity.components.pos.x--;
    else if (this.keys.down)
      entity.components.pos.y--;
    else if (this.keys.up)
      entity.components.pos.y++;

    this.keys = {};
  }

  input(keyboard)
  {
    if (keyboard.keys.down)
      this.keys.down = true;
    else if (keyboard.keys.up)
      this.keys.up = true;
    else if (keyboard.keys.left)
      this.keys.left = true;
    else if (keyboard.keys.right)
      this.keys.right = true;
    else if (keyboard.keys.z)
      this.keys.rotateLeft = true;
    else if (keyboard.keys.x)
      this.keys.rotateRight = true;
  }
}
