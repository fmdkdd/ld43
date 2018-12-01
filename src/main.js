const STATES = {};

STATES.Main = {
  enter() {
    this.pointer = {x:0, y:0};
    // let music = this.app.music.play('happy-clouds', true);
    // this.app.music.setVolume(music, 0.2);

    // Init ECS
    this.ecs = new ECS();

    this.renderingSystem = new RenderingSystem();
    this.ecs.addSystem(this.renderingSystem);

    const e = new ECS.Entity(null, [Position, Model]);
    this.ecs.addEntity(e);
  },

  render(dt) {
    // this.gameController.render(dt);
    this.ecs.update();
    this.renderingSystem.render();
  },

  pointermove(event) {

    // Update position relative to the canvas
    this.pointer.x = window.pageXOffset + event.original.clientX - this.app.container.offsetLeft;
    this.pointer.y = window.pageYOffset + event.original.clientY - this.app.container.offsetTop;

    // this.gameController.pointermove(this.pointer);
  },

  pointerdown(event) {
    if (event.button == 'left') {
      // this.gameController.leftclick();
    } else if (event.button == 'right') {
      // this.gameController.rightclick();
    }
  },
};

// const MODELS = [
//   'windturbine.json',
//   'solarpanel.json',
//   'battery.json',
//   'rock.json',
//   'house.json'
// ];

// Skip the loading screen.  It always lasts at least 500ms, even without
// assets.
delete PLAYGROUND.LoadingScreen

window.addEventListener('DOMContentLoaded', function main() {
  new PLAYGROUND.Application({
    // dimensions of the WebGL buffer
    width: 320,
    height: 180,
    // scaled to screen dimensions
    scale: 3,

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
