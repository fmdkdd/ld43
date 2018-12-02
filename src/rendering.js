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
    this.renderer.setClearColor(0);
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

    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.camera.position.set(0, 10, 2);
    //this.camera.up.set(0, 1, 0);
    //this.camera.lookAt(0, 0, 0);

    this.camera.position.set(0,12,-5);
    this.camera.up = new THREE.Vector3(0,0,1);
    this.camera.lookAt(new THREE.Vector3(0,5,0));

    //var axes = new THREE.AxesHelper();
    //this.scene.add( axes );


   /*const _geometry = new THREE.BoxGeometry(4, 4, 4);
   const _geometry2 = new THREE.BoxGeometry(2, 2, 2);
   const _material = new THREE.MeshLambertMaterial({color: 0xff0000});
   const _material2 = new THREE.MeshLambertMaterial({color: 0x00ff00});
   const _mesh = new THREE.Mesh(_geometry, _material);
   const _mesh2 = new THREE.Mesh(_geometry2, _material2);
    _mesh2.position.set(0,2,0);
    this.scene.add(_mesh);
    this.scene.add(_mesh2);*/

    // Lighting

    const light = new THREE.PointLight(0xffffff, 0.5);
    light.position.set(0, 10, 0);
    //light.target.position.set(5, 0, 5);
    light.castShadow = true;
    //light.shadowCameraVisible = true;
    this.scene.add(light);

    const skyLight = new THREE.HemisphereLight( 0x303655, 0x010c41, 1);
    this.scene.add(skyLight);

    /*var ground = new THREE.PlaneGeometry(50, 50, 32);
    var material = new THREE.MeshLambertMaterial();
    var plane = new THREE.Mesh( ground, material );
    plane.position.set(0, 0, 0)
    plane.receiveShadow = true;
    this.scene.add(plane);*/

    // Ground

    const tileTexture = new THREE.TextureLoader().load('../assets/tile.png');

    const size = 5;
    for (let y = 0; y < size; ++y)
      for (let x = 0; x < size; ++x)
      {
        const box = new THREE.BoxGeometry(3, 0.5, 3);
        const material = new THREE.MeshLambertMaterial({map: tileTexture});
        const tile = new THREE.Mesh(box, material);
        tile.position.set(x * 3, -0.25, y * 3)
        tile.receiveShadow = true;
        this.scene.add(tile);
      }

    console.log('Renderer initialized');
  }

  test(entity)
  {
    return !!entity.components.pos && !!entity.components.model;
  }

  enter(entity)
  {
    console.log('RenderingSystem: new entity', entity);

    const loader = new THREE.GLTFLoader();
    loader.load('../assets/guy.glb', model =>
    {
      console.log('GLTF', model);

      // Add to scene

      this.scene.add(model.scene);
      this.objects[entity.id] = model.scene;

      model.scene.traverse(o =>
      {
        o.material = new THREE.MeshLambertMaterial({color: 0xFF0000, side: THREE.DoubleSide});
        o.material.skinning = true;
        o.castShadow = true;
        console.log(o.material)
      })

      // Setup anims

      const clips = model.animations;
      clips.forEach((clip) => {
        if (clip.validate()) clip.optimize();
      });

      const mixer = new THREE.AnimationMixer( model.scene );
      this.objects[entity.id].mixer = mixer;

      var clip = THREE.AnimationClip.findByName( model.animations, 'idle' );
      var action = mixer.clipAction( clip );
      action.play();

      this.objects[entity.id].animSpeed = Math.random() * 0.016;

      //var axes = new THREE.AxesHelper();
      //model.scene.add( axes );
    });


  }

  exit(entity)
  {
  }

  update(entity)
  {
    const obj = this.objects[entity.id];

    // In case the model is not loaded yet
    if (!obj)
      return;

    const prevPosition = obj.position.clone();

    const worldPos = gridtoWorld(entity.components.pos);
    obj.position.setX(worldPos.x);
    obj.position.setZ(worldPos.y);
    obj.position.setY(0);

    // Look forward
    if (obj.position.distanceTo(prevPosition) > 0.5)
    {
      const dir = obj.position.clone().sub(prevPosition).normalize();
      obj.lookAt(obj.position.clone().add(dir))
    }

    obj.mixer.update(obj.animSpeed);
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }
}
