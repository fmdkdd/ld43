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
    path: 'cube.obj',
    color: 0 // temp
  }
};

const Controllable =
{
  name: 'controllable'
};

const Offering =
{
  name: 'offering',
  defaults:
  {
    color: 0
  }
};

const CrowdAgent =
{
  name: 'crowdAgent',
  defaults:
  {
    goal: new THREE.Vector3(),
    //dir: new THREE.Vector3()
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
