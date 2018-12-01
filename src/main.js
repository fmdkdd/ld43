const STATES = {};

STATES.Main = {
  create() {
    this.app.gameController = new GameController(this.app);
    // this.pointer = {x:0, y:0};
    // let music = this.app.music.play('happy-clouds', true);
    // this.app.music.setVolume(music, 0.2);
  },

  enter() {
  },

  keyup(event) {
    this.upkey = event.key;
  },

  keydown(event) {
    this.upkey = undefined;
    if (event.original) {
      event.original.preventDefault();
    }
  },

  step(dt) {
    switch (this.upkey) {
    case 'down': this.app.gameController.pushDown(); break;
    case 'left': this.app.gameController.moveLeft(); break;
    case 'right': this.app.gameController.moveRight(); break;
    }
    this.upkey = undefined;

    this.app.gameController.step(dt);
  },

  render(dt) {
    this.app.renderer.clearRect(0,0, this.app.canvas.width, this.app.canvas.height);
    this.app.gameController.render(dt);
  },

  // pointermove(event) {

    // Update position relative to the canvas
    // this.pointer.x = window.pageXOffset + event.original.clientX - this.app.container.offsetLeft;
    // this.pointer.y = window.pageYOffset + event.original.clientY - this.app.container.offsetTop;

    // this.gameController.pointermove(this.pointer);
  // },

  // pointerdown(event) {
  //   if (event.button == 'left') {
  //     // this.gameController.leftclick();
  //   } else if (event.button == 'right') {
  //     // this.gameController.rightclick();
  //   }
  // },
};

STATES.GameOver = {
  render(dt) {
    this.app.renderer.clearRect(0,0, this.app.canvas.width, this.app.canvas.height);
    this.app.gameController.render(dt);

    const ctx = this.app.renderer;
    ctx.fillStyle = '#fff';
    ctx.font = '50px serif';
    ctx.fillText('Game Over!', this.app.canvas.width/2, this.app.canvas.height/2);
  }
}

STATES.PreHighlightMatchCells = {
  enter() {
    this.delay = 0.2;
  },

  step(dt) {
    this.delay -= dt;
    if (this.delay < 0) {
      this.app.setState(STATES.HighlightMatchCells);
    }
  },

  render(dt) {
    this.app.renderer.clearRect(0,0, this.app.canvas.width, this.app.canvas.height);
    this.app.gameController.render(dt);
  }
}

STATES.HighlightMatchCells = {
  enter() {
    this.delay = 0.3;
  },

  step(dt) {
    this.delay -= dt;
    if (this.delay < 0) {
      this.app.setState(STATES.RemoveMatchCells);
    }
  },

  render(dt) {
    this.app.renderer.clearRect(0,0, this.app.canvas.width, this.app.canvas.height);
    const cells = this.app.gameController.cellsInMatch;
    this.app.gameController.render(dt, {highlight: cells});
  }
};

STATES.RemoveMatchCells = {
  enter() {
    this.delay = 0.3;
  },

  leave() {
    this.app.gameController.removeMatchCells();
  },

  step(dt) {
    this.delay -= dt;
    if (this.delay < 0) {
      this.app.setState(STATES.CheckForCombos);
    }
  },

  render(dt) {
    this.app.renderer.clearRect(0,0, this.app.canvas.width, this.app.canvas.height);
    const cells = this.app.gameController.cellsInMatch;
    this.app.gameController.render(dt, {skip: cells});
  }
};

STATES.CheckForCombos = {
  enter() {
    // This might have created more matches, so loop until there are none
    this.app.gameController.checkForMatches();
  },

  step(dt) {
    this.app.setState(STATES.Main);
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
      console.info('If you find any bugs, please report them to https://github.com/fmdkdd/ld43/issue');
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
      if (Detector.webgl) {
        // Init WebGL renderer
        // this.renderer = new THREE.WebGLRenderer({
        //   antialias: this.smoothing,
        //   alpha: true,
        // });
        // this.renderer.setClearColor(0x6dc2ca);
        // this.renderer.shadowMap.enabled = true;
        // this.renderer.setSize(this.width, this.height, false);
        // this.renderer.domElement.style.width = this.width * this.scale + 'px';
        // this.renderer.domElement.style.height = this.height * this.scale + 'px';
        // this.renderer.domElement.id = 'canvas';

        this.canvas = document.createElement('canvas');
        window.addEventListener('keydown', ev => ev.preventDefault());

        this.canvas.width = this.width * this.scale;
        this.canvas.height = this.height * this.scale;
        this.renderer = this.canvas.getContext('2d');

        this.container = document.getElementById('container');
        // this.container.appendChild(this.renderer.domElement);
        this.container.appendChild(this.canvas);
        this.container.style.width = this.width * this.scale + 'px';
        this.container.style.height = this.height * this.scale + 'px';

        // Go to default state
        this.setState(STATES.Main);
      } else {
        // WebGL not supported: abort and report error
        this.container.appendChild(Detector.getWebGLErrorMessage());
      }
    },

    // Record FPS through the prerender and postrender events
    // postrender() { this.stats.update(); }
  })
})
