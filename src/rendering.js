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
    this.objectPositions = {};

    // Init WebGL renderer
    this.renderer = new THREE.WebGLRenderer({
      //antialias: this.smoothing,
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
    this.camera.position.set(0, 0, 10);
    //this.camera.lookAt(0, 1, 0);

    var axes = new THREE.AxisHelper();
    this.scene.add( axes );

    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(5, 5, 5);
    light.target.position.set(0, 0, 0);
    light.castShadow = true;
    light.shadowCameraVisible = true;console.log(light);
    this.scene.add(light);

    var ground = new THREE.PlaneGeometry(50, 50, 32);
    var material = new THREE.MeshLambertMaterial();
    var plane = new THREE.Mesh( ground, material );
    plane.position.set(0, 0, 0)
    plane.receiveShadow = true;
    //this.scene.add(plane);

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

    box.traverse(o =>
    {
      o.material = new THREE.MeshLambertMaterial({color: 0xFF0000, side: THREE.DoubleSide});
      o.castShadow = true;
    });
    this.scene.add(box);

    this.objects[entity.id] = box;
  }

  exit(entity)
  {
  }

  update(entity)
  {
    const prevPosition = this.objects[entity.id].position.clone();

    const worldPos = gridtoWorld(entity.components.pos);
    this.objects[entity.id].position.setX(worldPos.x);
    this.objects[entity.id].position.setZ(worldPos.y);
    this.objects[entity.id].position.setY(0);

    // Look forward
    if (this.objects[entity.id].position.distanceTo(prevPosition) > 0.5)
    {
      const dir = this.objects[entity.id].position.clone().sub(prevPosition).normalize();
      //this.objects[entity.id].up.set(0, 0, 1);
      this.objects[entity.id].lookAt(this.objects[entity.id].position.clone().add(dir))
    }
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }
}
