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
    const dt = this.app.dt;
    const {people} = entity.components;
    const prevState = this.prevStates[entity.id];

    // if (people.state === 'idle')
    // {

    // }
    // else if (people.state === 'arriving')
    // {
    //   // Arrived at goal? -> switch to idle
    //   if (entity.components.crowdAgent)
    //   {
    //     const goalPosition = new THREE.Vector3(entity.components.crowdAgent.goalx, entity.components.crowdAgent.goaly, 0);
    //     const position = new THREE.Vector3(entity.components.pos.x, entity.components.pos.y, 0);

    //     if(goalPosition.distanceTo(position) < 0.1)
    //     {
    //       people.state = 'idle';
    //       entity.removeComponent('crowdAgent');
    //     }
    //   }
    // }
    // else if (people.state === 'fleeing')
    // {
    //   // Enable crowd movement when switching to 'flee' mode

    //   if (prevState !== people.state)
    //   {
    //     entity.addComponent('crowdAgent', {goalx: 10, goaly: 10});
    //   }

    //   // Delete the entity when the goal is reached

    //   const goalPosition = new THREE.Vector3(entity.components.crowdAgent.goalx, entity.components.crowdAgent.goaly, 0);
    //   const position = new THREE.Vector3(entity.components.pos.x, entity.components.pos.y, 0);

    //   if(goalPosition.distanceTo(position) < 0.1)
    //   {
    //     this.app.state.ecs.removeEntity(entity);
    //   }
    // }

    if (people.state === 'rotating') {
      const t = this.app.rotationTheta;

      if (t === 1) {
        people.state = 'idle';
        // Snap to end pos and clear the fields
        entity.components.pos.x = people.new_x;
        entity.components.pos.y = people.new_y;

        people.old_x = 0;
        people.old_y = 0;
        people.new_x = 0;
        people.new_y = 0;
      } else {
        const dx = people.new_x - people.old_x;
        entity.components.pos.x = people.old_x + dx * t;
        const dy = people.new_y - people.old_y;
        entity.components.pos.y = people.old_y + dy * t;
      }
    }

    this.prevStates[entity.id] = people.state;
  }
}
