const STATES = {};

STATES.Main = {
  enter() {
    this.pointer = {x:0, y:0};
    // let music = this.app.music.play('happy-clouds', true);
    // this.app.music.setVolume(music, 0.2);

    // Init ECS
    this.ecs = new ECS();

    this.ecs.addSystem(new CrowdSystem(this.app));
    this.ecs.addSystem(new PeopleSystem(this.app));
    this.ecs.addSystem(this.controlsSystem = new ControlsSystem(this.app));
    this.ecs.addSystem(this.renderingSystem = new RenderingSystem(this.app));

    /*
    for (let x = 0; x < 5; ++x)
    {
      const guy = new ECS.Entity(null, [Position, Model, People, CrowdAgent]);
      guy.components.pos.x = x;
      guy.components.pos.y = -5;
      guy.components.model.path = 'box';
      guy.components.model.color = 1;
      guy.components.crowdAgent.goal = new THREE.Vector3(3, 5, 0);
      this.ecs.addEntity(guy);
    }

    const guy = new ECS.Entity(null, [Position, Model, People, CrowdObstacle]);
    guy.components.pos.x = 3;
    guy.components.pos.y = 3;
    guy.components.model.path = 'box';
    guy.components.model.color = 1;
    guy.components.crowdObstacle.size = 2;
    this.ecs.addEntity(guy);*/

    const player = createPlayer(0);
    this.ecs.addEntity(player);

    const size = 5;
    for (let y = 0; y < size; ++y)
    {
      for (let x = 0; x < size; ++x)
      {
        const e = createSpawningPeople(Math.random() * 10 - 5, 10, x, y);
        this.ecs.addEntity(e);
      }
    }
  },

  render(dt) {
    // this.gameController.render(dt);
    this.ecs.update();
    this.renderingSystem.render();
  },

  pointerdown(event) {
    if (event.button == 'left') {
      // this.gameController.leftclick();
    } else if (event.button == 'right') {
      // this.gameController.rightclick();
    }
  },

  keyup(event) {
    this.controlsSystem.input(event.key);

    // temp
    if (event.key === 'space')
    {
      for (let i = 1; i < 25; i += 3)
        this.ecs.entities[i].components.people.state = 'fleeing';
    }
  }
};

// Skip the loading screen.  It always lasts at least 500ms, even without
// assets.
delete PLAYGROUND.LoadingScreen

window.addEventListener('DOMContentLoaded', function main() {
  new PLAYGROUND.Application({
    // dimensions of the WebGL buffer
    width: 800,
    height: 600,
    // scaled to screen dimensions
    //scale: 3,

    smoothing: false,

    preload() {
      console.info('-------------------------- Hello there! ---------------------------');
      console.info('If you find any bugs, please report them to https://github.com/fmdkdd/ld39/issue');
      console.info('---------------------------- Thanks! ------------------------------');
      // Put FPS counter to bottom right
      // this.stats = new Stats();
      // this.stats.dom.style.left = '';
      // this.stats.dom.style.top = '';
      // this.stats.dom.style.right = 0;
      // this.stats.dom.style.bottom = 0;
      // document.body.appendChild(this.stats.dom);

      this.loadData('../assets/box.json');
      this.loadData('../assets/guy.json');
    },

    create() {
      // MODELS.forEach(asset => this.loadData(asset));

      // this.loadSounds('pickup');
      // this.loadSounds('putdown');
      // this.loadSounds('rotate');
      // this.loadSounds('level-solved');
      // this.sound.alias('pickup-scaled', 'pickup', .03, 1);
      // this.sound.alias('putdown-scaled', 'putdown', .035, 1);
      // this.sound.alias('rotate-scaled', 'rotate', .02, 1);
      // this.sound.alias('level-solved-scaled', 'level-solved', .45, 1);
      // this.loadSounds('happy-clouds');

      // this.textureLoader = new THREE.TextureLoader();
      // this.textures = {};
      // this.loadTexture('data/dust.png');
      // this.loadTexture('data/smoke.png');
      // this.loadTexture('data/stars.png');
    },

    loadTexture(path) {
      this.textureLoader.load(
        path,
        texture => {
          this.textures[path] = texture;
        },
        function(){},
        function ( xhr ) {
          console.log(`Error loading texture ${path}: ${xhr}`);
	      }
      );
    },

    ready() {

      if (!Detector.webgl) {
        // WebGL not supported: abort and report error
        this.container.appendChild(Detector.getWebGLErrorMessage());
        return;
      }

      // Go to default state
      this.setState(STATES.Main);
    },

    // Record FPS through the prerender and postrender events
    // postrender() { this.stats.update(); }
  })
})
