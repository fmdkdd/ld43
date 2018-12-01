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
    this.camera.position.y = 2;

    console.log('Renderer initialized');
  }

  test(entity)
  {
    return !!entity.components.pos && !!entity.components.model;
  }

  enter(entity) {
    console.log('RenderingSystem: new entity', entity);

    const assets = this.app.data['..']['assets'];
    const box = new THREE.ObjectLoader().parse(assets[entity.components.model.path]);

    //const geometry = new THREE.BoxGeometry(1, 1, 1);
    //const material = new THREE.MeshBasicMaterial({ color: entity.components.model.color === 0 ? 0x00ff00 : 0xff0000 } );
    //const cube = new THREE.Mesh( geometry, material );
    this.scene.add(box);

    // Register in the system
    this.objects[entity.id] = box;
  }

  exit(entity) {
  }

  update(entity)
  {
    this.objects[entity.id].position.setX(entity.components.pos.x);
    this.objects[entity.id].position.setY(entity.components.pos.y);
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }
}
