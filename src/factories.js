function createPeople(x, y)
{
  const e = new ECS.Entity(null, [Position, Model, People]);
  e.components.pos.x = x;
  e.components.pos.y = y;
  e.components.model.path = 'guy';
  e.components.model.color = 1;
  return e;
}

function createSpawningPeople(x, y, gx, gy)
{
  const e = new ECS.Entity(null, [Position, Model, People, CrowdAgent]);

  e.components.pos.x = x;
  e.components.pos.y = y;

  e.components.model.path = 'guy';
  e.components.model.color = 1;

  e.components.people.state = 'arriving';

  e.components.crowdAgent.goalx = gx;
  e.components.crowdAgent.goaly = gy;

  return e;
}

function createPlayer(x)
{
  const e = new ECS.Entity(null, [Position, Model, Controllable]);
  e.components.pos.x = x + 0.5;
  e.components.pos.y = 0 + 0.5;
  e.components.model.path = 'guy';
  e.components.model.color = 0;
  return e;
}
