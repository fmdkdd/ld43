// See https://github.com/yagl/ecs

const Position =
{
  name: 'pos',
  defaults:
  {
    x: 0,
    y: 0
  }
};

const Model =
{
  name: 'model',
  defaults:
  {
    path: 'box',
    color: 0 // temp
  }
};

const Controllable =
{
  name: 'controllable'
};

const People =
{
  name: 'people',
  defaults:
  {
    color: 0, // temp
    state: 'idle' // 'arriving', 'idle', 'stepping', fleeing'
  }
};

const CrowdAgent =
{
  name: 'crowdAgent',
  defaults:
  {
    goalx: 0,
    goaly: 0
  }
};

const CrowdObstacle =
{
  name: 'crowdObstacle',
  defaults:
  {
    size: 1
  }
};
