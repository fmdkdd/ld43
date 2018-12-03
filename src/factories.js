function createPeople(x, y, color = randomColor())
{
  const e = new ECS.Entity(null, [Position, Model, People]);
  e.components.pos.x = x;
  e.components.pos.y = y;
  e.components.model.path = 'guy';
  e.components.people.color = color;

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

function createPlayer(x, y)
{
  const e = new ECS.Entity(null, [Position, Model, Player]);
  e.components.pos.x = x;
  e.components.pos.y = y;
  e.components.model.path = 'guy';

  return e;
}

function createParticles(type, x, y, z, lifetime, gx, gy)
{
  const e = new ECS.Entity(null, [Position, Particles]);

  e.components.pos.x = x;
  e.components.pos.y = y;
  e.components.pos.z = z;

  e.components.particles.type = type;
  e.components.particles.lifetime = lifetime;
  e.components.particles.goalx = gx;
  e.components.particles.goaly = gy;

  return e;
}