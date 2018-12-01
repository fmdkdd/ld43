function gridtoWorld(gridCoord)
{
  return {x: gridCoord.x * 3, y: gridCoord.y * 3};
}

class RenderingSystem extends ECS.System
{
  constructor(app)
  {
    super();

    this.app = app;
    this.objects = {};

    // Init WebGL renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: this.smoothing,
      alpha: true,
    });
    this.renderer.setClearColor(0x6dc2ca);
    this.renderer.shadowMap.enabled = true;
    this.renderer.setSize(this.app.width, this.app.height, false);
    this.renderer.domElement.style.width = this.app.width * this.app.scale + 'px';
    this.renderer.domElement.style.height = this.app.height * this.app.scale + 'px';
    this.renderer.domElement.id = 'canvas';

    this.container = document.getElementById('container');
    this.container.appendChild(this.renderer.domElement);
    this.container.style.width = this.app.width * this.app.scale + 'px';
    this.container.style.height = this.app.height * this.app.scale + 'px';

    // Init scene
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
    this.camera.position.z = 15;
    this.camera.position.x = 5;
    this.camera.position.y = 5;

    console.log('Renderer initialized');
  }

  test(entity)
  {
    return !!entity.components.pos && !!entity.components.model;
  }

  enter(entity)
  {
    console.log('RenderingSystem: new entity', entity);

    const assets = this.app.data['..']['assets'];
    const box = new THREE.ObjectLoader().parse(assets[entity.components.model.path]);
    this.scene.add(box);

    // Register in the system
    this.objects[entity.id] = box;
  }

  exit(entity)
  {
  }

  update(entity)
  {
    const worldPos = gridtoWorld(entity.components.pos);
    this.objects[entity.id].position.setX(worldPos.x);
    this.objects[entity.id].position.setY(worldPos.y);
    this.objects[entity.id].position.setZ(0);
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }
}
