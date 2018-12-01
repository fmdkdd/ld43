class ControlsSystem extends ECS.System
{
  constructor(app)
  {
    super();

    this.app = app;
  }

  test(entity)
  {
    return !!entity.components.pos && entity.components.controllable;
  }

  enter(entity)
  {
    console.log('ControlsSystem: new entity', entity);
  }

  update(entity)
  {
    if (this.next === 'left')
      entity.components.pos.x--;
    else if (this.next === 'right')
      entity.components.pos.x++;
    else if (this.next === 'down')
      entity.components.pos.y--;
    else if (this.next === 'up')
      entity.components.pos.y++;

    this.next = null;
  }

  input(key)
  {
    this.next = key;
  }
}
