class PeopleSystem extends ECS.System
{
  constructor(app)
  {
    super();

    this.app = app;
    this.prevStates = {};

    console.log('People system initialized');
  }

  test(entity)
  {
    return !!entity.components.people;
  }

  enter(entity)
  {
    this.prevStates[entity.id] = entity.components.people.state;
  }

  exit(entity)
  {
    delete this.prevStates[entity.id];
  }

  update(entity)
  {
    const {people} = entity.components;
    const prevState = this.prevStates[entity.id];

    if (people.state === 'idle')
    {

    }
    else if (people.state === 'arriving')
    {
      // Arrived at goal? -> switch to idle
      if (entity.components.crowdAgent)
      {
        const goalPosition = new THREE.Vector3(entity.components.crowdAgent.goalx, entity.components.crowdAgent.goaly, 0);
        const position = new THREE.Vector3(entity.components.pos.x, entity.components.pos.y, 0);

        if(goalPosition.distanceTo(position) < 0.1)
        {
          people.state = 'idle';
          entity.removeComponent('crowdAgent');
        }
      }
    }
    else if (people.state === 'fleeing')
    {
      // Enable crowd movement when switching to 'flee' mode

      if (prevState !== people.state)
      {
        entity.addComponent('crowdAgent', {goalx: 10, goaly: 10});
      }

      // Delete the entity when the goal is reached

      const goalPosition = new THREE.Vector3(entity.components.crowdAgent.goalx, entity.components.crowdAgent.goaly, 0);
      const position = new THREE.Vector3(entity.components.pos.x, entity.components.pos.y, 0);

      if(goalPosition.distanceTo(position) < 0.1)
      {
        this.app.state.ecs.removeEntity(entity);
      }
    }

    this.prevStates[entity.id] = people.state;
  }
}
