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

  input(keycode)
  {
    switch (keycode) {
    case 'ArrowLeft'  : this.keys.left = true; break;
    case 'ArrowRight' : this.keys.right = true; break;
    case 'ArrowUp'    : this.keys.up = true; break;
    case 'ArrowDown'  : this.keys.down = true; break;
    case 'KeyZ'       : this.keys.rotateLeft = true; break;
    case 'KeyX'       : this.keys.rotateLeft = true; break;
    }
  }
}
