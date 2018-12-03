class ParticleSystem extends ECS.System
{
  constructor(app)
  {
    super();

    this.app = app;
    this.emitters = {}; // Particle emitters

    // Setup the engine

    this.engine = new Proton();
    this.engine.addRender(new Proton.SpriteRender(this.app.renderingSystem.scene));
  }

  test(entity)
  {
    return entity.components.particles && entity.components.particles;
  }

  enter(entity)
  {
    const particles = entity.components.particles;
    const position = entity.components.pos;

    if (particles.type === 'fire')
    {
      const material = new THREE.SpriteMaterial({
          map: this.app.textures["assets/particle.png"],
          color: 0xff0000,
          blending: THREE.AdditiveBlending,
          fog: true
      });
      const body = new THREE.Sprite(material);

      const emitter = new Proton.Emitter();
      emitter.rate = new Proton.Rate(new Proton.Span(10, 20), new Proton.Span(.1, .25));
      emitter.addInitialize(new Proton.Body(body));
      emitter.addInitialize(new Proton.Mass(1));
      emitter.addInitialize(new Proton.Radius(1));
      emitter.addInitialize(new Proton.Life(1, 3));
      emitter.addInitialize(new Proton.Velocity(20, new Proton.Vector3D(0, 1, 0), 10));
      emitter.addBehaviour(new Proton.Scale(1, 0.1));
      emitter.addBehaviour(new Proton.Color('#FF0026', ['#ffff00', '#ffff11'], Infinity, Proton.easeOutSine));
      emitter.p.x = position.x;
      emitter.p.y = position.z;
      emitter.p.z = position.y;
      emitter.emit();

      this.engine.addEmitter(emitter);

      this.emitters[entity.id] = emitter;
    }
    else if (particles.type === 'soul')
    {
      const material = new THREE.SpriteMaterial({
        map: this.app.textures["assets/particle.png"],
        color: 0xffffff,
        blending: THREE.AdditiveBlending,
        fog: true
      });
      const body = new THREE.Sprite(material);

      const emitter = new Proton.Emitter();
      emitter.rate = new Proton.Rate(new Proton.Span(1, 3), new Proton.Span(.01, .025));
      emitter.addInitialize(new Proton.Body(body));
      emitter.addInitialize(new Proton.Mass(1));
      emitter.addInitialize(new Proton.Radius(new Proton.Span(0.1, 0.6)));
      emitter.addInitialize(new Proton.Life(0.5, 2));
      emitter.addBehaviour(new Proton.Scale(1, 0.1));
      emitter.addBehaviour(new Proton.RandomDrift(0.1, 0.1, 0.1, .05));
      emitter.p.x = position.x;
      emitter.p.y = position.y;
      emitter.emit();

      entity.components.particles.velx = -Math.random() * 5;
      entity.components.particles.vely = Math.random() * 10 - 5;

      this.engine.addEmitter(emitter);

      this.emitters[entity.id] = emitter;
    }
    else if (particles.type === 'rune')
    {
      const material = new THREE.SpriteMaterial({
        map: this.app.textures["assets/particle.png"],
          color: 0xffffff,
          blending: THREE.AdditiveBlending,
          fog: true
      });
      const body = new THREE.Sprite(material);

      const emitter = new Proton.Emitter();
      emitter.rate = new Proton.Rate(new Proton.Span(1, 10), new Proton.Span(.1, .25));
      emitter.addInitialize(new Proton.Body(body));
      emitter.addInitialize(new Proton.Mass(1));
      emitter.addInitialize(new Proton.Radius(new Proton.Span(10, 20)));
      emitter.addInitialize(new Proton.Life(0.5, 2));
      emitter.addBehaviour(new Proton.Scale(1, 0.1));
      emitter.addBehaviour(new Proton.RandomDrift(0.1, 0.1, 0.1, .05));
      emitter.p.x = position.x;
      emitter.p.y = position.z;
      emitter.p.z = position.y;
      emitter.emit();

      this.engine.addEmitter(emitter);

      this.emitters[entity.id] = emitter;
    }
    else if (particles.type === 'torch')
    {
      const material = new THREE.SpriteMaterial({
          map: this.app.textures["assets/particle.png"],
          color: 0xff0000,
          blending: THREE.AdditiveBlending,
          fog: true
      });
      const body = new THREE.Sprite(material);

      const emitter = new Proton.Emitter();
      emitter.rate = new Proton.Rate(new Proton.Span(5, 5), new Proton.Span(.1, .25));
      emitter.addInitialize(new Proton.Body(body));
      emitter.addInitialize(new Proton.Radius(1));
      emitter.addInitialize(new Proton.Life(0.5, 1));
      emitter.addInitialize(new Proton.Velocity(10, new Proton.Vector3D(0, 1, 0), 10));
      emitter.addBehaviour(new Proton.Scale(1, 0.1));
      emitter.addBehaviour(new Proton.Color('#FF0026', ['#ffff00', '#ffff11'], Infinity, Proton.easeOutSine));
      emitter.emit();

      this.engine.addEmitter(emitter);

      this.emitters[entity.id] = emitter;
    }
    else
    {
      console.log('unknown particle type');
    }
  }

  exit(entity)
  {
    this.emitters[entity.id].destroy();
    delete this.emitters[entity.id];
  }

  update(entity)
  {
    const particles = entity.components.particles;
    const emitter = this.emitters[entity.id];
    const dt = this.app.dt;

    if (entity.components.particles.type === 'soul')
    {
      const dir = {
        x: particles.goalx - emitter.p.x,
        y: particles.goaly - emitter.p.y
      };
      const dir2 = new Proton.Vector3D(dir.x, dir.y);
      dir2.normalize();

      particles.velx = particles.velx * 0.95 + dir2.x * 0.05;
      particles.vely = particles.vely * 0.95 + dir2.y * 0.05;

      const vel2 = new Proton.Vector3D(particles.velx, particles.vely);
      vel2.normalize();

      emitter.p.x += vel2.x * 0.3;
      emitter.p.z += vel2.y * 0.3;

      //console.log(emitter.p.x, emitter.p.y)
    }
    // Torch: move the emitter on the torch
    else if (entity.components.particles.type === 'torch')
    {
      const posAbsolute = new THREE.Vector3();
      this.torchObject.getWorldPosition(posAbsolute);

      emitter.p.x = posAbsolute.x;
      emitter.p.y = posAbsolute.y;
      emitter.p.z = posAbsolute.z;
    }

    // Decrease lifetime

    particles.lifetime -= this.app.dt;
    if (entity.components.particles.lifetime < 0)
    {
      this.app.ecs.removeEntity(entity);
    }
  }

  render()
  {
    this.engine.update();
  }

  createFire(x, y, z, lifetime)
  {
    this.app.ecs.addEntity(createParticles('fire', x, y, z, lifetime));
  }

  createSoul(x, y, lifetime, gx, gy)
  {
    this.app.ecs.addEntity(createParticles('soul', x, y, 0, lifetime, gx, gy));
  }

  createSoulFromTileToRune(tileIndex, runeIndex)
  {
    // HACKY STUFF

//    const from = this.app.renderingSystem.tiles[tileIndex].position;
//    const to = this.app.renderingSystem['rune' + runeIndex].position;

    // Convert 'from' from world-space to the background camera space

    //const from_sceneCam = from.copy().sub(this.app.renderingSystem.camera);
    /*let x = from.clone().project(this.app.renderingSystem.camera);

    var p = new THREE.Vector3(from.x, from.y, from.z);
    var vector = p.project(this.app.renderingSystem.camera);
    vector.x = (vector.x + 1) * this.app.width * this.app.scale / 2;
    vector.y = -(vector.y - 1) * this.app.height * this.app.scale / 2;

    console.log(p, vector);*/

  //  this.createSoul(from.x, from.y, 10, to.x, to.y);
  }

  createRuneParticles(x, y, z)
  {
    //this.app.ecs.addEntity(createParticles('rune', x, y, z, 3));
  }

  createTorch(torchObject)
  {
    this.torchObject = torchObject; // lol hack again
    this.app.ecs.addEntity(createParticles('torch', 0, 0, 0, 10000000));
  }
}
