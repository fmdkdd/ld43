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
      emitter.addInitialize(new Proton.Life(0.75));
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
      emitter.addInitialize(new Proton.Radius(new Proton.Span(0.25, 0.75)));
      emitter.addInitialize(new Proton.Life(0.5, 2));
      emitter.addBehaviour(new Proton.Scale(1, 0.1));
      emitter.addBehaviour(new Proton.RandomDrift(0.5, 0.5, 0.5, .05));
      emitter.p.x = position.x;
      emitter.p.y = position.y;
      emitter.p.z = position.z;
      emitter.emit();

      entity.components.particles.velx = -Math.random() * 5;
      entity.components.particles.vely = Math.random() * 10 - 5;
      entity.components.particles.velz = Math.random() * 10 - 5;

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
      emitter.addInitialize(new Proton.Radius(new Proton.Span(100, 200)));
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
      emitter.addInitialize(new Proton.Radius(0.1));
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
        y: particles.goaly - emitter.p.y,
        z: particles.goaly - emitter.p.z
      };
      const dist = new Proton.Vector3D(dir.x, dir.y, dir.z);
      const dir2 = new Proton.Vector3D(dir.x, dir.y, dir.z).normalize();

      particles.velx = particles.velx * 0.95 + dir2.x * 0.05;
      particles.vely = particles.vely * 0.95 + dir2.y * 0.05;
      particles.velz = particles.velz * 0.95 + dir2.z * 0.05;

      const vel2 = new Proton.Vector3D(particles.velx, particles.vely, particles.velz);
      vel2.normalize();

      emitter.p.x += vel2.x * 0.3;
      emitter.p.y += vel2.y * 0.3;
      emitter.p.z += vel2.z * 0.3;

      if (dist.length() < 0.5)
      {
        this.app.ecs.removeEntity(entity);
        return;
      }
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

  createSoul(x, y, z, lifetime, gx, gy, gz)
  {
    this.app.ecs.addEntity(createParticles('soul', x, y, z, lifetime, gx, gy, gz));
  }

  createSoulFromTileToTimer(tileIndex)
  {
    // HACKY STUFF

    const from = this.app.renderingSystem.tiles[tileIndex].position.clone();

    //const to = new THREE.Vector3();
    //this.app.renderingSystem['rune' + runeIndex].getWorldPosition(to);

    // Coordinates of the board in the second cam

    /*const bottomLeft = new THREE.Vector3(1000-17,-20,0);
    const topRight = new THREE.Vector3(1000+1,7,0);

    const tileSize = (topRight.y - bottomLeft.y) / 9;
    const tilex = tileIndex % 7;
    const tiley = Math.floor(tileIndex / 7);

    const from = bottomLeft.add(new THREE.Vector3(tilex * tileSize, 0, tiley * tileSize));*/

    // Coordinates of the timer in the first cam

    const left = new THREE.Vector3(-23, 0, 0);
    const right = new THREE.Vector3(-39, 0, 0);

    const to = left.lerp(right, this.app.game.timer);

    /*const ttt2 = new THREE.Mesh(new THREE.BoxGeometry(2,2,2), new THREE.MeshBasicMaterial());
    ttt2.position.copy(from);
    this.app.renderingSystem.bgScene.add(ttt2);

    const ttt = new THREE.Mesh(new THREE.BoxGeometry(2,2,2), new THREE.MeshBasicMaterial());
    ttt.position.copy(to);
    this.app.renderingSystem.bgScene.add(ttt);*/

    this.createSoul(from.x, from.y, from.z, 10, to.x, to.y, to.z);
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
