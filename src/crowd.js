class CrowdSystem extends ECS.System
{
  constructor(app)
  {
    super();

    this.app = app;
    this.agents = {};
    this.obstacles = {};

    console.log('Crowd system initialized');
  }

  test(entity)
  {
    return !!entity.components.pos && (!!entity.components.crowdAgent || !!entity.components.crowdObstacle);
  }

  enter(entity)
  {
    console.log('CrowdSystem: entity entered', entity);

    // Agent
    if (!!entity.components.crowdAgent)
    {
      this.agents[entity.id] = entity;
    }
    // Obstacle
    else
    {
      this.obstacles[entity.id] = entity;
    }
  }

  exit(entity)
  {
    console.log('CrowdSystem: entity exited', entity);

    if (!!entity.components.crowdAgent)
    {
      delete this.agents[entity.id];
    }
    if (!!entity.components.crowdObstacle)
    {
      delete this.obstacles[entity.id];
    }
  }

  update(entity)
  {
    // Move agents away from other agents and obstacles
    if (!!entity.components.crowdAgent)
    {
      const position = new THREE.Vector3(entity.components.pos.x, entity.components.pos.y, 0);

      // Other agents influence

      const agentInfluence = new THREE.Vector3();

      for (let id in this.agents)
      {
        if (id === entity.id)
          continue;

        const agent = this.agents[id];
        const agentPosition = new THREE.Vector3(agent.components.pos.x, agent.components.pos.y, 0);
        const diff = position.clone().sub(agentPosition);

        if (diff.length() < 0.5)
        {
          const inf = position.clone().sub(agentPosition).normalize();
          agentInfluence.add(inf);
        }
      }

      // Obstacles influence

      const obstacleInfluence = new THREE.Vector3();

      for (let id in this.obstacles)
      {
        const obstacle = this.obstacles[id];
        const obstaclePosition = new THREE.Vector3(obstacle.components.pos.x, obstacle.components.pos.y, 0);
        const diff = position.clone().sub(obstaclePosition);

        if (diff.length() < obstacle.components.crowdObstacle.size)
        {
          const inf = position.clone().sub(obstaclePosition).normalize();
          obstacleInfluence.add(inf);
        }
      }

      // Goal influence

      const goalPosition = new THREE.Vector3(entity.components.crowdAgent.goalx, entity.components.crowdAgent.goaly, 0);
      const goalInfluence = goalPosition.clone().sub(position).normalize();

      // Combine and apply

      const influence = new THREE.Vector3()
        .add(agentInfluence.multiplyScalar(0.25))
        .add(obstacleInfluence.multiplyScalar(0.75))
        .add(goalInfluence.multiplyScalar(0.7));

      position.add(influence.multiplyScalar(0.1));
      entity.components.pos.x = position.x;
      entity.components.pos.y = position.y;
    }
  }
}
