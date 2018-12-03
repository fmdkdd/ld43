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

    const tileGeometry = new THREE.BoxGeometry(worldScale, 0.5, worldScale);

    this.tiles = [];

    for (let y = 0; y < 10; ++y)
      for (let x = 0; x < 7; ++x)
      {
        const tileMaterial = new THREE.MeshLambertMaterial({map: tileTexture,
                                                            emissive: 0xff0000,
                                                            emissiveIntensity: 0});
        const tile = new THREE.Mesh(tileGeometry, tileMaterial);
        tile.position.set(-x * worldScale, -0.25, y * worldScale)
        tile.receiveShadow = true;
        this.scene.add(tile);

        this.tiles.push(tile);
      }

    // Background

    this.bgScene = new THREE.Scene();

    this.bgCamera = new THREE.OrthographicCamera(-camw, camw, camh, -camh, 1, 1000);
    this.bgCamera.position.set(1000, -5, 100);
    this.bgCamera.lookAt(1000, -5, 10);

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
          specular: 0x002dff,
          shininess: 10,
          normalMap: bgNormalTexture2,
          normalScale: new THREE.Vector2(2, 2)
        });
        o.material.skinning = true;
        o.castShadow = true;
      });

      this.bgScene.add(model.scene);

      // Timer

      //this.timer = model.scene.getObjectByName('timer');
      //this.timer.material.emissive = 0.1;

      this.timerFill = model.scene.getObjectByName('timer_fill');
      this.timerFill.material = new THREE.MeshLambertMaterial({emissive: 0xdddddd});

      if (!this.app.lowGraphics)
      {
        // Eyes
        this.eyeLight = new THREE.PointLight(0xff0000, 1, 5);
        model.scene.getObjectByName('eye1').add(this.eyeLight);
        this.eyeLight2 = new THREE.PointLight(0xff0000, 1, 5);
        model.scene.getObjectByName('eye2').add(this.eyeLight2);

        // Runes
        const runeColors  = [0xff0000, 0x0000ff, 0xffff00, 0x00ff00];
        for (let i = 0; i < 4; ++i)
        {
          const rune = this['rune' + i] = model.scene.getObjectByName('rune' + i);

          //const light = this['runeLight' + i] = new THREE.PointLight(runeColors[i], 1, 5);
          //model.scene.getObjectByName('rune' + i).add(light);
          const runeBottom = this['runeBottom' + i] =  model.scene.getObjectByName('rune' + i + '_bottom');
          if (runeBottom)
          {
            runeBottom.material = new THREE.MeshLambertMaterial({
              emissive: runeColors[i],
              emissiveIntensity: 0.2
            });
          }

          new TWEEN.Tween(rune.position)
            .to({y: rune.position.y + 2 * Math.random()}, 2 + 5 * Math.random())
            .repeat(Infinity)
            .yoyo(true)
            .easing(TWEEN.Easing.Quadratic.InOut)
            .start(this.t);
        }

        // God light

        this.godPivot = model.scene.getObjectByName('head_pivot');
        const godLight = model.scene.getObjectByName('head_light');
        godLight.add(new THREE.PointLight(0xffffff, 0.3));

        this.godPivot2 = model.scene.getObjectByName('head_pivot2');
        const godLight2 = model.scene.getObjectByName('head_light2');
        godLight2.add(new THREE.PointLight(0x7c5d00, 0.3));

        // God anims

        //console.log('animations', model.animations);

        this.godClips = model.animations;
        this.godClips.forEach((clip) => {
          if (clip.validate()) clip.optimize();
        });

        this.godMixer = new THREE.AnimationMixer(model.scene);
      }
    });

    /*this.bgLight = new THREE.PointLight(0xffffff, 0.25);
    this.bgLight.position.set(1000, -100, 10);
    this.bgLight.castShadow = true;
    this.bgScene.add(this.bgLight);*/
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
        color = gameColorToHex(entity.components.people.color);
      }

      // Give a torch to the player
      if (entity.components.player)
      {
        // this.playerTorch = new THREE.PointLight(0xffffff, 5, 5);
        // model.scene.add(this.playerTorch);
      }

      const robe = model.scene.getObjectByName('robe');
      if (robe)
      {
        robe.material = new THREE.MeshLambertMaterial({color: color});
        robe.material.skinning = true;
        robe.castShadow = true;
      }

      const head = model.scene.getObjectByName('head');
      if (head)
      {
        head.material = new THREE.MeshLambertMaterial({color: 0xf0cd93});
      }

      const hair = model.scene.getObjectByName('hair');
      if (hair)
      {
        hair.material = new THREE.MeshLambertMaterial({color: 0x663F26});
      }

      // Setup anims

      const clips = model.animations;
      clips.forEach((clip) => {
        if (clip.validate()) clip.optimize();
      });
      this.objects[entity.id].clips = clips;

      //console.log(clips);
      const mixer = new THREE.AnimationMixer(model.scene);
      this.objects[entity.id].mixer = mixer;

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

    // Moving people use an interpolated coordinate between their old place and
    // the new one
    if (entity.components.people && entity.components.people.state === 'moving') {
      const t = this.app.rotationTheta;
      const ease = this.app.moveEasing;
      const prev_x = entity.components.people.old_x;
      x = prev_x + (x - prev_x) * ease(t);
      const prev_y = entity.components.people.old_y;
      y = prev_y + (y - prev_y) * ease(t);
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

    if (DEBUG && entity.components.people) {
      const ctx = this.overlay;
      ctx.fillStyle = '#aaa';
      ctx.font = '12px sans-serif';
      const px = 100 + x * 50;
      const py = 545 - y * 50;
      const xy = entity.components.pos.y * this.app.game.gridWidth +
            entity.components.pos.x;
      ctx.fillText(xy, px + 20, py);
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
      if (this.bgLight)
      {
        this.bgLight.position.setX(1000 + Math.sin(this.t)*10 - 3);
        this.bgLight.position.setZ(10 + Math.sin(this.t)*10 - 3);
      }

      // Eyes
      if (this.eyeLight)
        this.eyeLight.intensity = 1 + Math.abs(Math.cos(this.t * 0.5));
      if (this.eyeLight2)
        this.eyeLight2.intensity = 1 + Math.abs(Math.cos(this.t * 0.4));

      // God light
      if (this.godPivot)
        this.godPivot.rotation.y += dt * 0.4;
      if (this.godPivot2)
        this.godPivot2.rotation.y -= dt * 0.5;

      // God anim
      this.godMixer.update(dt);
    }

    this.renderer.autoClear = false;
    this.renderer.clear();
    this.renderer.render(this.scene, this.camera);
    this.renderer.clearDepth();
    this.renderer.render(this.bgScene, this.bgCamera);
  }

  // Shake the screen a distance of 'offset', 'shakes' times during 'duration' seconds
  shake(offset, shakes, duration)
  {
    const shakeDur = duration / shakes;

    //https://sole.github.io/tween.js/examples/03_graphs.html

    new TWEEN.Tween(this.bgCamera.position)
      .to({x: 1000 + offset, y: -5 - offset}, shakeDur / 2)
      .to({x: 1000 - offset, y: -5 - offset}, shakeDur / 2)
      .repeat(shakes)
      .easing(TWEEN.Easing.Bounce.InOut)
      .chain(new TWEEN.Tween(this.bgCamera.position).to({x: 1000, y: -5}, shakeDur / 2)) // Back to original pos
      .start(this.t);
  }

  fillTimer(t)
  {
    new TWEEN.Tween(this.timerFill.scale)
      .to({x: t}, 0.2)
      .easing(TWEEN.Easing.Quadratic.InOut)
      .start(this.t);
  }

  animateGod(clipIndex, repeat)
  {
    const clipNames = ['anim_talk', 'anim_teeth', 'anim_nod', 'anim_shout'];
    var clip = THREE.AnimationClip.findByName(this.godClips, clipNames[clipIndex]);

    this.godMixer.stopAllAction();
    const anim = this.godMixer.clipAction(clip);
    anim.setLoop( THREE.LoopOnce );
    anim.clampWhenFinished = true;
    anim.play()

    /*const s = 1.25;
    let a = this.scene.getObjectByName('Armature002')
    console.log(a);
    new TWEEN.Tween(a.scale)
      .to({x: s, y: s, z: s}, 0.2)
      .easing(TWEEN.Easing.Back.InOut)
      .repeat(1)
      .yoyo(true)
      .start(this.t);*/
  }

  animateGuy(entity, clipIndex, repeat)
  {
    const clips = this.objects[entity.id].clips;

    const clipNames = ['anim_pray', 'anim_offer', 'anim_arms', 'anim_arms2'];
    var clip = THREE.AnimationClip.findByName(clips, clipNames[clipIndex]);

    const mixer = this.objects[entity.id].mixer;
    mixer.stopAllAction();

    const anim = mixer.clipAction(clip);
    anim.setLoop( THREE.LoopOnce );
    anim.clampWhenFinished = true;
    anim.play()
  }

  highlightTile(tileIndex, flashes, duration, color)
  {
    const tile = this.tiles[tileIndex];

    const flashDur = duration / flashes;

    const flash = new TWEEN.Tween(tile.material)
          .to({emissiveIntensity: 1}, flashDur / 2)
          .yoyo(true)
          .repeat(flashes)
          .chain(new TWEEN.Tween(tile.material)
                 .to({emissiveIntensity: 0}, flashDur / 2)) // Back to original val
    //.easing(TWEEN.Easing.Quadratic.InOut)
          .start(this.t)
          .onStart(_ => {
            tile.material.emissive = new THREE.Color(color);
          })
  }

  highlightRune(runeIndex)
  {
    const rune = this['rune' + runeIndex];
    const runeBottom = this['runeBottom' + runeIndex];

    // Ghetto way to avoid multiple anims
    if (this['runeAnimInProgress' + runeIndex])
      return;

    this['runeAnimInProgress' + runeIndex] = true;

    //runeBottom.material.emissiveIntensity = 1;

    new TWEEN.Tween(runeBottom.material)
      .to({emissiveIntensity: 1}, 0.25)
      .easing(TWEEN.Easing.Back.InOut)
      .repeat(1)
      .yoyo(true)
      .onComplete(() =>
      {
        this['runeAnimInProgress' + runeIndex] = false;
      })
      .start(this.t);

    const s = 1.25;
    new TWEEN.Tween(rune.scale)
      .to({x: s, y: s, z: s}, 0.2)
      .easing(TWEEN.Easing.Back.InOut)
      .repeat(1)
      .yoyo(true)
      .start(this.t);

    const r = Math.random() * 0.8 - 0.4;
    new TWEEN.Tween(rune.rotation)
      .to({y: r}, 0.2)
      .repeat(1)
      .yoyo(true)
      .start(this.t);

    /*const pos = new THREE.Vector3();
    rune.getWorldPosition(pos);
    this.app.particleSystem.createRuneParticles(pos.x, pos.y, pos.z);*/
  }

  makeTilesFall(tileRow, duration)
  {
    const tileIndex = tileRow * 7;

    for (let i = 0; i < 7; ++i)
    {
      const tile = this.tiles[tileIndex + i];

      const progress = {t: 0};
      new TWEEN.Tween(progress)
        .delay(i * duration / 7)
        .to({t: 1}, duration)
        .easing(TWEEN.Easing.Quadratic.In)
        .onUpdate(function()
        {
          // Scale down
          tile.scale.setScalar(1 - progress.t);

          // Make disappear
          tile.material.transparent = true;
          tile.material.opacity = 1 - progress.t;
        })
        .start(this.t)
        .onComplete(_ => {
          this.scene.remove(tile);
          delete this.tiles[tileIndex + i];
        });

      // Also move to the center
      new TWEEN.Tween(this.tiles[tileIndex + i].position)
        .delay(i * duration / 7)
        .to({x: -3.5 * worldScale}, duration)
        .easing(TWEEN.Easing.Quadratic.In)
        .start(this.t);
    }
  }
}

function gameColorToHex(c) {
  switch (c) {
  case RED    : return 0xFF0000;
  case BLUE   : return 0x0000FF;
  case YELLOW : return 0xFFFF00;
  case GREEN  : return 0x00FF00;
  }
}
