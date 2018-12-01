class RenderingSystem extends ECS.System
{
  constructor(ctx)
  {
    super();

    this.objects = {};

    // Init WebGL renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: this.smoothing,
      alpha: true,
    });
    this.renderer.setClearColor(0x6dc2ca);
    this.renderer.shadowMap.enabled = true;
    this.renderer.setSize(320, 180, false);//(this.width, this.height, false);
    this.renderer.domElement.style.width = '320px';//this.width * this.scale + 'px';
    this.renderer.domElement.style.height = '180px';//this.height * this.scale + 'px';
    this.renderer.domElement.id = 'canvas';

    this.container = document.getElementById('container');
    this.container.appendChild(this.renderer.domElement);
    this.container.style.width = '320px';//this.width * this.scale + 'px';
    this.container.style.height = '180px';//this.height * this.scale + 'px';

    // Init scene
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
    this.camera.position.z = 5;

    console.log('Renderer initialized');
  }

  test(entity)
  {
    return !!entity.components.pos && !!entity.components.model;
  }

  enter(entity) {
    console.log('RenderingSystem: new entity', entity);

    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshBasicMaterial({ color: entity.components.color === 0 ? 0x00ff00 : 0xff0000 } );
    const cube = new THREE.Mesh( geometry, material );
    this.scene.add(cube);

    // Register in the system
    this.objects[entity.id] = cube;
  }

  exit(entity) {
  }

  update(entity)
  {
    //this.t = (this.t || 0) + 0.01;
    //entity.components.pos.x = Math.sin(this.t);
    this.objects[entity.id].position.setX(entity.components.pos.x * 3);
    this.objects[entity.id].position.setY(entity.components.pos.y * 3);
    this.objects[entity.id].position.setZ(0);
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }
}
