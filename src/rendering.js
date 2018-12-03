const worldScale = 3;

function gridtoWorld(gridCoord)
{
  // Right: minus X!
  return {x: -worldScale * gridCoord.x, y: worldScale * gridCoord.y};
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
      antialias: this.smoothing,
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

    // 2D overlay

    const overlay = document.getElementById('overlay');
    overlay.width = this.app.width * this.app.scale;
    overlay.height = this.app.height * this.app.scale;
    this.overlay = overlay.getContext('2d');

    // Init scene

    this.scene = new THREE.Scene();

    const camw = 24;
    const camh = camw * this.app.height / this.app.width;
    this.camera = new THREE.OrthographicCamera(-camw, camw, camh, -camh, 1, 1000);
    this.camera.position.set(-17, 10, 5 * worldScale);
    this.camera.up = new THREE.Vector3(0, 0, 1);
    this.camera.lookAt(new THREE.Vector3(-17, 0, 5*worldScale));

    // Lighting

    const light = new THREE.PointLight(0xffffff, 0.5);
    light.position.set(0, -10, 0);
    light.distance = 100;
    light.castShadow = true;
    this.scene.add(light);

    //const skyLight = new THREE.HemisphereLight( 0x303655, 0x010c41, 1);
    const skyLight = new THREE.HemisphereLight( 0xFFFFFF, 0x333333, 0.75);
    this.scene.add(skyLight);

    // Ground

    const tileTexture = new THREE.TextureLoader().load('../assets/tile.png');

    const size = 5;
    for (let y = 0; y < 10; ++y)
      for (let x = 0; x < 7; ++x)
      {
        const box = new THREE.BoxGeometry(3, 0.5, 3);
        const material = new THREE.MeshLambertMaterial({map: tileTexture});
        const tile = new THREE.Mesh(box, material);
        tile.position.set(-x * 3, -0.25, y * 3)
        tile.receiveShadow = true;
        this.scene.add(tile);
      }

    // Background

    this.bgScene = new THREE.Scene();

    this.bgCamera = new THREE.OrthographicCamera(-camw, camw, camh, -camh, 1, 1000);
    this.bgCamera.position.set(1000, -5, 100);

    const bgTexture = new THREE.TextureLoader().load('../assets/bg.png');
    const bgNormalTexture = new THREE.TextureLoader().load('../assets/bg_normal.png');
    const bgNormalTexture2 = new THREE.TextureLoader().load('../assets/wall_normal.jpg');

    const loader = new THREE.GLTFLoader();
    loader.load('../assets/wall.glb', model =>
    {
      model.scene.position.set(1000, 0, 0);
      model.scene.rotation.x = 90;

      model.scene.traverse(o =>
      {
        o.material = new THREE.MeshPhongMaterial( {
          color: 0xFFFFFF,
          specular: 0xFFFFFF,
          shininess: 15,
          normalMap: bgNormalTexture2,
          normalScale: new THREE.Vector2(0.5, 0.5)
        });
        o.material.skinning = true;
      });

      this.bgScene.add(model.scene);

      if (!this.app.lowGraphics)
      {
        // Eyes
        this.eyeLight = new THREE.PointLight(0xff0000, 1, 5);
        model.scene.getObjectByName('eye1').add(this.eyeLight);
        this.eyeLight2 = new THREE.PointLight(0xff0000, 1, 5);
        model.scene.getObjectByName('eye2').add(this.eyeLight2);

        // Runes
        const runeColors  = [0xff0000, 0x00ff00, 0x0000ff, 0xffff00];
        for (let i = 1; i <= 4; ++i)
        {
          const light = this['runeLight' + i] = new THREE.PointLight(runeColors[i - 1], 1, 5);
          model.scene.getObjectByName('rune' + i).add(light);
        }

        // God anims

        console.log('animations', model.animations);

        const clips = model.animations;
        clips.forEach((clip) => {
          if (clip.validate()) clip.optimize();
        });

        const animNames = ['anim_talk', 'anim_teeth', 'anim_nod', 'anim_shout'];
        this.godMixer = new THREE.AnimationMixer(model.scene);
        var clip = THREE.AnimationClip.findByName( model.animations, animNames[3]);
        var action = this.godMixer.clipAction( clip );
        action.play();
      }
    });

    this.bgLight = new THREE.PointLight(0xffffff, 0.25);
    this.bgLight.position.set(1000, -100, 10);
    this.bgLight.castShadow = true;
    this.bgScene.add(this.bgLight);
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

      let color = 0;
      if (entity.components.people) {
        switch (entity.components.people.color) {
        case RED    : color = 0xFF0000; break;
        case BLUE   : color = 0x0000FF; break;
        case YELLOW : color = 0xFFFF00; break;
        case GREEN  : color = 0x00FF00; break;
        }
      }

      // Give a torch to the player
      if (entity.components.player)
      {
        // this.playerTorch = new THREE.PointLight(0xffffff, 5, 5);
        // model.scene.add(this.playerTorch);
      }

      model.scene.traverse(o => {
        o.material = new THREE.MeshLambertMaterial({color: color, side: THREE.DoubleSide});
        o.material.skinning = true;
        o.castShadow = true;
      });

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
    });
  }

  exit(entity)
  {
    this.scene.remove(this.objects[entity.id]);
    delete this.objects[entity.id];
  }

  update(entity)
  {
    const obj = this.objects[entity.id];

    // In case the model is not loaded yet
    if (!obj)
      return;

    const prevPosition = obj.position.clone();

    let {x, y} = entity.components.pos;

    if (DEBUG && !entity.components.player) {
      this.overlay.fillStyle = '#aaa';
      this.overlay.font = '18px sans-serif';
      const px = 100 + x * 50;
      const py = 545 - y * 50;
      const xy = y * this.app.game.gridWidth + x;
      this.overlay.fillText(xy, px, py);
    }

    // Rotating people use an interpolated coordinate between
    // their old place and the new one
    if (entity.components.people && entity.components.people.state === 'moving') {
      const t = this.app.rotationTheta;
      const prev_x = entity.components.people.old_x;
      x = prev_x + (x - prev_x) * t;
      const prev_y = entity.components.people.old_y;
      y = prev_y + (y - prev_y) * t;
    }

    // Offset player who moves between the grid cells
    if (entity.components.player) {
      x -= 0.5;
      y -= 0.5;
    }

    const worldPos = gridtoWorld({x,y});
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

    if (entity.components.people && entity.components.people.color_changed) {
      this.updateColor(entity);
      entity.components.people.color_changed = false;
    }
  }

  render(dt)
  {
    this.t += dt;

    TWEEN.update(this.t);

    if (!this.app.lowGraphics)
    {
      // Player's torch
      if (this.playerTorch)
        this.playerTorch.intensity = 1 + Math.abs(Math.sin(this.t*3)*Math.cos(this.t))*10;

      // BG light
      this.bgLight.position.setX(1000 + Math.sin(this.t)*10 - 3);
      this.bgLight.position.setZ(10 + Math.sin(this.t)*10 - 3);

      // Eyes
      if (this.eyeLight)
        this.eyeLight.intensity = 0.5 + Math.abs(Math.cos(this.t * 0.25));
      if (this.eyeLight2)
        this.eyeLight2.intensity = 0.5 + Math.abs(Math.cos(this.t * 0.3));

      // God anim
      this.godMixer.update(dt);
    }

    this.renderer.autoClear = false;
    this.renderer.clear();
    this.renderer.render(this.scene, this.camera);
    this.renderer.clearDepth();
    this.renderer.render(this.bgScene, this.bgCamera);
  }

  clearOverlay() {
    this.overlay.clearRect(0, 0,
                           this.app.width * this.app.scale,
                           this.app.height * this.app.scale);
  }

  shake(strength, duration)
  {
    new TWEEN.Tween(this.bgCamera.position)
      .to({x: 950}, 1)
      .to({x: 1000}, 1)
      .onUpdate(() => console.log(1))
      .start();
  }
}
