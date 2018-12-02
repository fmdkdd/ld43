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
    this.t = 0;
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
    this.camera = new THREE.PerspectiveCamera(110, window.innerWidth / window.innerHeight, 0.1, 1000);
    const camw = 24;
    const camh = camw * this.app.height / this.app.width;
    this.camera = new THREE.OrthographicCamera( -camw, camw, camh, -camh, 1, 1000);
    //this.camera.up.set(0, 1, 0);
    //this.camera.lookAt(0, 0, 0);

    this.camera.position.set(0,5,5*3);
    this.camera.up = new THREE.Vector3(0,0,1);
    this.camera.lookAt(new THREE.Vector3(0,0,5*3));

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
    //light.castShadow = true;
    //light.shadowCameraVisible = true;
    this.scene.add(light);

    //const skyLight = new THREE.HemisphereLight( 0x303655, 0x010c41, 1);
    const skyLight = new THREE.HemisphereLight( 0xFFFFFF, 0x333333, 1);
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
    for (let y = 0; y < 10; ++y)
      for (let x = 0; x < 7; ++x)
      {
        const box = new THREE.BoxGeometry(3, 0.5, 3);
        const material = new THREE.MeshLambertMaterial({map: tileTexture});
        const tile = new THREE.Mesh(box, material);
        tile.position.set(x * 3, -0.25, y * 3)
        tile.receiveShadow = true;
        this.scene.add(tile);
      }

    // Background

    this.bgCamera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.bgCamera.position.set(1000-10, 0, 10);

    const bgTexture = new THREE.TextureLoader().load('../assets/bg.png');
    const bgNormalTexture = new THREE.TextureLoader().load('../assets/bg_normal.png');

    const box = new THREE.BoxGeometry(10, 10, 0.1);
    const material = new THREE.MeshPhongMaterial( {
      map: bgTexture,
      specular: 0xFF00FF,
      shininess: 5,
      normalMap: bgNormalTexture
    });
    const bg = new THREE.Mesh(box, material);
    bg.position.set(1000, 0, 0);
    bg.receiveShadow = true;
    this.scene.add(bg);
/*
    const box2 = new THREE.BoxGeometry(1000, 1000, 0.1);
    const material2 = new THREE.MeshPhongMaterial( {
      map: bgTexture,
      specular: 0xFF00FF,
      shininess: 5,
      normalMap: bgNormalTexture
    });
    const bg2 = new THREE.Mesh(box2, material2);
    bg2.position.set(1000, 0, -0.01);
    bg2.receiveShadow = true;
    this.scene.add(bg2);
*/
    this.bgLight = new THREE.PointLight(0x00ff00, 1);
    this.bgLight.position.set(1000, 0, 5);
    //this.bgLight.castShadow = true;
    this.scene.add(this.bgLight);

  }

  test(entity)
  {
    return !!entity.components.pos && !!entity.components.model;
  }

  enter(entity)
  {

    const loader = new THREE.GLTFLoader();
    loader.load('../assets/guy.glb', model =>
    {
      // Add to scene

      this.scene.add(model.scene);
      this.objects[entity.id] = model.scene;

      const colors = [ 0xff0000, 0x00ff00, 0x0000FF, 0xFFFF00];
      const c = colors[Math.floor(Math.random()*4)];

      model.scene.traverse(o =>
      {
        o.material = new THREE.MeshLambertMaterial({color: c, side: THREE.DoubleSide});
        o.material.skinning = true;
        o.castShadow = true;
      })

      // Setup anims

      const clips = model.animations;
      clips.forEach((clip) => {
        if (clip.validate()) clip.optimize();
      });

      const mixer = new THREE.AnimationMixer( model.scene );
      this.objects[entity.id].mixer = mixer;

      //var clip = THREE.AnimationClip.findByName( model.animations, 'idle' );
      //var action = mixer.clipAction( clip );
      //action.play();

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

  render(dt)
  {
    this.t += dt;

    this.bgLight.position.setX(1000 + Math.sin(this.t)*6 - 3);
    this.bgLight.position.setY(0 + Math.cos(this.t)*4-2);

    this.renderer.autoClear = false;
    this.renderer.clear();
    this.renderer.render(this.scene, this.bgCamera);
    this.renderer.clearDepth();
    this.renderer.render(this.scene, this.camera);
  }
}
