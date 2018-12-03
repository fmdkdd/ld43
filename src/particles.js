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

    if (particles.type === 'fire')
    {
      const material = new THREE.SpriteMaterial({
          map: new THREE.TextureLoader().load("../assets/particle.png"),
          color: 0xff0000,
          blending: THREE.AdditiveBlending,
          fog: true
      });
      const body = new THREE.Sprite(material);

      const emitter = new Proton.Emitter();
      emitter.rate = new Proton.Rate(new Proton.Span(5, 10), new Proton.Span(.1, .25));
      emitter.addInitialize(new Proton.Body(body));
      emitter.addInitialize(new Proton.Mass(1));
      emitter.addInitialize(new Proton.Radius(1));
      emitter.addInitialize(new Proton.Life(2, 4));
      emitter.addInitialize(new Proton.Position(new Proton.BoxZone(10)));
      emitter.addInitialize(new Proton.Velocity(10, new Proton.Vector3D(0, 1, 1), 30));
      emitter.addBehaviour(new Proton.Rotate("random", "random"));
      emitter.addBehaviour(new Proton.Scale(1, 0.1));
      //emitter.addBehaviour(new Proton.Gravity(3));
      emitter.p.x = 0;
      emitter.p.y = 0;
      emitter.emit();

      this.engine.addEmitter(emitter);

      this.emitters[entity.id] = emitter;
    }
    else if (particles.type === 'soul')
    {
      const material = new THREE.SpriteMaterial({
          map: new THREE.TextureLoader().load("../assets/particle.png"),
          color: 0xffffff,
          blending: THREE.AdditiveBlending,
          fog: true
      });
      const body = new THREE.Sprite(material);

      const emitter = new Proton.Emitter();
      emitter.rate = new Proton.Rate(new Proton.Span(5, 10), new Proton.Span(.1, .25));
      emitter.addInitialize(new Proton.Body(body));
      emitter.addInitialize(new Proton.Mass(1));
      emitter.addInitialize(new Proton.Radius(1));
      emitter.addInitialize(new Proton.Life(2, 4));
      emitter.addInitialize(new Proton.Position(new Proton.BoxZone(10)));
      emitter.addInitialize(new Proton.Velocity(10, new Proton.Vector3D(0, 1, 1), 30));
      emitter.addBehaviour(new Proton.Rotate("random", "random"));
      emitter.addBehaviour(new Proton.Scale(1, 0.1));
      //emitter.addBehaviour(new Proton.Gravity(3));
      emitter.p.x = 0;
      emitter.p.y = 0;
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
    const dt = this.app.dt;

    const emitter = this.emitters[entity.id];

    entity.components.particles.lifetime -= this.app.dt;
    if (entity.components.particles.lifetime < 0)
    {
      this.app.ecs.removeEntity(entity);
    }
  }

  render()
  {
    this.engine.update();
  }

  createParticles(type, x, y, lifetime)
  {
    this.app.ecs.addEntity(createParticles(type, x, y, lifetime));
  }
}
