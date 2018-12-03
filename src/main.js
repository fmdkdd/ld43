let DEBUG = false;
const STATES = {};

STATES.NewGame = {
  enter() {
    // Start by checking for matches as the random grid may have some
    // Free points!
    this.app.ecs.addSystem(this.app.game = new GameSystem(this.app));
    this.app.setState(STATES.CheckMatches);
  }
};

STATES.GameOver = {
  leave() {
    // Remove the previous game system properly
    this.app.game.destroySystem();
    this.app.ecs.removeSystem(this.app.game);
  },

  render(dt) {
    const ctx = this.app.renderingSystem.overlay;
    const w = this.app.width * this.app.scale;
    const h = this.app.height * this.app.scale;

    // Fill overlay background
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0, 0, w, h);

    ctx.font = '46px sans-serif';
    ctx.fillStyle = '#fff';

    let text = 'Game Over';
    let m = ctx.measureText(text);
    ctx.fillText(text, this.app.width/2 - m.width/2, this.app.height/2);

    text = 'Press ENTER for a new game';
    ctx.font = '20px sans-serif';
    m = ctx.measureText(text);
    ctx.fillText(text, this.app.width/2 - m.width/2, this.app.height/2 + 50);
  },

  keydown(event) {
    if (event.key === 'enter') {
      this.app.setState(STATES.NewGame);
    }
  },
};

STATES.Main = {
  enter() {
    // let music = this.app.music.play('happy-clouds', true);
    // this.app.music.setVolume(music, 0.2);
  },

  step(dt) {
    this.app.game.step(dt);
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

    if (event.key === 't')
      this.app.renderingSystem.shake(0.5, 10, 2);

    if (event.key === 'y')
      this.app.renderingSystem.fillTimer(0.1);
    if (event.key === 'u')
      this.app.renderingSystem.fillTimer(0.9);

    if (event.key === 'g')
      this.app.renderingSystem.animateGod(0);
    if (event.key === 'h')
      this.app.renderingSystem.animateGod(1);
    if (event.key === 'j')
      this.app.renderingSystem.animateGod(2);
    if (event.key === 'k')
      this.app.renderingSystem.animateGod(3);

    if (event.key === 'v')
      this.app.particleSystem.createParticles('fire', 0, 0, 3);
    if (event.key === 'b')
      this.app.particleSystem.createParticles('soul', 0, 0, 100000);

    if (event.key === 'q') {
      this.app.game.removeBottomRow();
    }
    if (event.key === 'n')
    {
      this.app.renderingSystem.highlightTile(0, 1, 2);
      this.app.renderingSystem.highlightTile(1, 3, 2);
      this.app.renderingSystem.highlightTile(2, 10, 2);
    }
  }
};

STATES.RemoveBottomRow = {
  enter() {
    this.app.renderingSystem.shake(0.5, 10, 2);
    this.app.renderingSystem.animateGod(3);
    this.delay = 1;
  },

  leave() {
    this.app.game.removeBottomRow();
    this.app.renderingSystem.fillTimer(this.app.game.timer);
  },

  step(dt) {
    if (this.delay === 0) {
      this.app.setState(STATES.Main);
    }
    this.delay = Math.max(0, this.delay - dt);
  },
};

STATES.Pause = {
  render(dt) {
    const ctx = this.app.renderingSystem.overlay;
    const w = this.app.width * this.app.scale;
    const h = this.app.height * this.app.scale;
    const t = this.app.renderingSystem.t

    // Fill overlay background
    ctx.fillStyle = 'rgba(0,0,0,0.8)';
    ctx.fillRect(0, 0, w, h);

    ctx.font = '46px sans-serif';
    ctx.fillStyle = '#fff';

    let text = 'PAUSE';
    let m = ctx.measureText(text);
    ctx.fillText(text,
                 this.app.width/2 - m.width/2,
                 this.app.height/2 + Math.sin(2*t) * 10);

    text = 'Press ENTER to continue';
    ctx.font = '20px sans-serif';
    m = ctx.measureText(text);
    ctx.fillText(text, this.app.width/2 - m.width/2, this.app.height/2 + 50);
  },

  keydown(event) {
    if (event.key === 'enter') {
      this.app.setState(STATES.Main);
    }
  },
};

STATES.Rotating = {
  enter() {
    this.delay = 0.06;
    this.delay_init = this.delay;
    this.app.rotationTheta = 0;
  },

  step(dt) {
    if (this.delay === 0) {
      this.app.setState(STATES.CheckMatches);
    }

    this.delay = Math.max(0, this.delay - dt);
    this.app.rotationTheta = 1 - (this.delay / this.delay_init);
  },
};

STATES.CheckMatches = {
  enter() {
    this.app.game.checkMatches();
  },

  step(dt) {
    // Go back to Main state on first occasion (checkMatches will put
    // us in the highlighting animation if there is any match)
    this.app.setState(STATES.Main);

    switch (this.app.game.currentCombo) {
    case 0: case 1: break;
    case 2: console.log("Combo"); break;
    case 3: console.log("Double combo!"); break;
    case 4: console.log("Triple combo!!"); break;
    default: console.log("Combo master!!!"); break;
    }

    this.app.game.currentCombo = 0;
  },
};

STATES.PreHighlightMatchCells = {
  enter() {
    this.delay = 0.2;
  },

  step(dt) {
    if (this.delay === 0) {
      this.app.setState(STATES.HighlightMatchCells);
    }
    this.delay = Math.max(0, this.delay - dt);
  },
}

STATES.HighlightMatchCells = {
  enter() {
    this.delay = 0.3;
  },

  step(dt) {
    if (this.delay === 0) {
      this.app.setState(STATES.RemoveMatchCells);
    }
    this.delay = Math.max(0, this.delay - dt);
  },

  render(dt) {
    // TODO: highlighting
  },
};

STATES.RemoveMatchCells = {
  enter() {
    this.app.game.removeMatchCells();
    this.delay = 0.1;
  },

  step(dt) {
    if (this.delay === 0) {
      this.app.setState(STATES.FillHoles);
    }

    this.delay = Math.max(0, this.delay - dt);
  },
};

STATES.FillHoles = {
  enter() {
    this.delay = 0.05;
    this.delay_init = this.delay;
    this.app.rotationTheta = 0;
    this.app.game.fillHoles();
  },

  step(dt) {
    if (this.delay === 0) {
      // Continue in FillHoles state if there are holes
      if (this.app.game.columnsWithHoles.length > 0) {
        this.app.setState(STATES.FillHoles);
      } else {
        // Otherwise go to CheckMatches
        this.app.setState(STATES.CheckMatches);
      }
    }

    this.delay = Math.max(0, this.delay - dt);
    this.app.rotationTheta = 1 - (this.delay / this.delay_init);
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

      const lowGraphicsStorage = localStorage.getItem('lowgraphics');
      this.lowGraphics = lowGraphicsStorage === 'true';

      const lowGraphicsCheckbox = document.getElementById('lowgraphics');
      lowGraphicsCheckbox.checked = this.lowGraphics;

      lowGraphicsCheckbox.addEventListener('change', (event) =>
      {
        this.lowGraphics = event.target.checked;
        localStorage.setItem('lowgraphics', event.target.checked)
      })

      // Init ECS
      this.ecs = new ECS();

      //this.ecs.addSystem(new CrowdSystem(this.app));
      // this.ecs.addSystem(new PeopleSystem(this));
      this.ecs.addSystem(this.controlsSystem = new ControlsSystem(this));
      this.ecs.addSystem(this.renderingSystem = new RenderingSystem(this));
      this.ecs.addSystem(this.particleSystem = new ParticleSystem(this));
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
      this.renderingSystem.overlay
        .clearRect(0, 0, this.width * this.scale, this.height * this.scale);

      this.ecs.update();
    },

    render(dt) {
      this.dt = dt;
      this.particleSystem.render(dt);
      this.renderingSystem.render(dt);

      const ctx = this.renderingSystem.overlay;
      if (DEBUG) {
        ctx.font = '12px sans-serif';
        ctx.save();
        ctx.translate(100, 545);

        for (let y=0; y < this.game.gridHeight; ++y) {
          for (let x=0; x < this.game.gridWidth; ++x) {
            // Cell coordinate
            const px =  x * 50;
            const py = -y * 50;
            const xy = y * this.game.gridWidth + x;
            ctx.fillStyle = '#aaa';
            ctx.fillText(xy, px, py);

            // Cell color
            const c = this.game.getXY(x, y);
            switch (c) {
            case RED: ctx.fillStyle = 'red'; break;
            case BLUE: ctx.fillStyle = 'blue'; break;
            case YELLOW: ctx.fillStyle = 'yellow'; break;
            case GREEN: ctx.fillStyle = 'green'; break;
            default: ctx.fillStyle = 'white'; break;
            }
            ctx.fillRect(px - 10, py + 20, 10, 10);
          }
        }

        ctx.restore();

        // Timer speed
        ctx.fillStyle = '#aaa';
        ctx.fillText('speed: ' + this.game.timerSpeed, 450, 520);

        // Bottom row
        ctx.fillText('bottom row: ' + this.game.bottomRow, 10, 10);
      }

      // Score
      ctx.font = '30px sans-serif';
      ctx.fillStyle = '#fff';
      ctx.fillText(Math.floor(this.game.displayScore), 500, 480);
    },

    keyup(event) {
      if (event.key === 'f2') {
        DEBUG = !DEBUG;
      }
    },

    ready() {

      if (!Detector.webgl) {
        // WebGL not supported: abort and report error
        this.container.appendChild(Detector.getWebGLErrorMessage());
        return;
      }

      // Prevent default scrolling
      window.addEventListener('keydown', ev => {
        if ([32, 37, 38, 39, 40].indexOf(ev.keyCode) > -1) {
          ev.preventDefault()
        }
      });

      // Start by checking for matches
      this.setState(STATES.NewGame);
    },

    // Record FPS through the prerender and postrender events
    postrender() { this.stats.update(); }
  })
})
