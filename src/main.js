const STATES = {};

STATES.Main = {
  create() {
    this.app.ecs.addSystem(new GameSystem(this.app));
  },

  enter() {
    // let music = this.app.music.play('happy-clouds', true);
    // this.app.music.setVolume(music, 0.2);
  },

  render(dt) {
  },

  keydown(event) {
    // Use keycode for the key placement independent of user layout
    if (event.original) {
      this.app.controlsSystem.input(event.original.code);
    }

    if (event.key === 'enter') {
      this.app.setState(STATES.Pause);
    }
  }
};

STATES.Pause = {
  enter() {
    console.log('pause!');
  },

  leave() {
    console.log('unpause!');
  },

  keydown(event) {
    if (event.key === 'enter') {
      this.app.setState(STATES.Main);
    }
  },
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
    scale: 1,

    smoothing: false,

    preload() {
      console.info('-------------------------- Hello there! ---------------------------');
      console.info('If you find any bugs, please report them to https://github.com/fmdkdd/ld39/issue');
      console.info('---------------------------- Thanks! ------------------------------');
      // Put FPS counter to bottom right
      this.stats = new Stats();
      this.stats.dom.style.left = '';
      this.stats.dom.style.top = '';
      this.stats.dom.style.right = 0;
      this.stats.dom.style.bottom = 0;
      document.body.appendChild(this.stats.dom);

      //this.loadData('../assets/box.json');
      //this.loadData('../assets/guy.json');
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


      // Init ECS
      this.ecs = new ECS();

      //this.ecs.addSystem(new CrowdSystem(this.app));
      //this.ecs.addSystem(new PeopleSystem(this.app));
      this.ecs.addSystem(this.controlsSystem = new ControlsSystem(this));
      this.ecs.addSystem(this.renderingSystem = new RenderingSystem(this));
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

    step(dt) {
      this.ecs.update();
    },

    render(dt) {
      this.dt = dt;
      this.renderingSystem.render(dt);
    },

    ready() {

      if (!Detector.webgl) {
        // WebGL not supported: abort and report error
        this.container.appendChild(Detector.getWebGLErrorMessage());
        return;
      }

      // Prevent default scrolling
      window.addEventListener('keydown', ev => ev.preventDefault());

      // Go to default state
      this.setState(STATES.Main);
    },

    // Record FPS through the prerender and postrender events
    postrender() { this.stats.update(); }
  })
})
