let DEBUG = false;

// @Warning: Never NEVER call setState in a leave() function.  This totally
// confuses Playground and leads to blowing the stack.

const STATES = {};

STATES.TitleScreen = {
  enter() {
    this.app.renderingSystem.buildScene();
    this.app.ecs.addSystem(this.app.particleSystem = new ParticleSystem(this.app));
    // Start loading the game for the tutorial
    this.app.ecs.addSystem(this.app.game = new GameSystem(this.app));

    this.app.bgm = this.app.music.play('bg-abstraction', true);
    this.app.music.setVolume(this.app.bgm, 0.1);
  },

  keydown(event) {
    if (event.key === 'space') {
      this.app.setState(STATES.Tuto);
    }
  },

  render(dt) {
    const ctx = this.app.renderingSystem.overlay;
    const w = this.app.width * this.app.scale;
    const h = this.app.height * this.app.scale;

    // Fill overlay background
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, w, h);

    ctx.font = '50px sans-serif';
    ctx.fillStyle = '#fff';

    let text = 'QUELTRIS';
    let m = ctx.measureText(text);
    ctx.fillText(text, w/2 - m.width/2, h/2);

    text = 'Press SPACE';
    ctx.font = '20px sans-serif';
    m = ctx.measureText(text);
    ctx.fillText(text, w/2 - m.width/2, h/2 + 50);
  },
};

STATES.Tuto = {

  keydown(event) {
    if (event.key === 'space') {
      this.app.setState(STATES.Tuto2);
    }
  },

  render(dt) {
    const ctx = this.app.renderingSystem.overlay;
    const w = this.app.width * this.app.scale;
    const h = this.app.height * this.app.scale;

    // Fill overlay background
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = 'rgba(0,0,0,.8)';
    ctx.fillRect(0, 0, w, h);

    // Show gameplay elements
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillStyle = '#fff';

    ctx.beginPath();
    ctx.arc(241, 320, 50, 0, Math.PI*2);
    ctx.fill();

    // Tutorial text
    ctx.globalCompositeOperation = 'source-over';
    ctx.font = '25px sans-serif';

    let text ='Arrows move this';
    ctx.fillText(text, 160, 250);

    text ='Z or X to rotate';
    ctx.fillText(text, 170, 410);

    const t = this.app.renderingSystem.t
    text = 'Press SPACE to continue';
    let m = ctx.measureText(text);
    ctx.fillText(text, w/2 - m.width/2, 50 + Math.sin(t) * 6);
  },
};

STATES.Tuto2 = {

  keydown(event) {
    if (event.key === 'space') {
      // Start by checking for matches as the random grid may have some
      // Free points!
      this.app.setState(STATES.CheckMatches);
    }
  },

  leave() {
    this.app.music.setVolume(this.app.bgm, 0.2);
  },

  render(dt) {
    const ctx = this.app.renderingSystem.overlay;
    const w = this.app.width * this.app.scale;
    const h = this.app.height * this.app.scale;

    // Fill overlay background
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = 'rgba(0,0,0,.8)';
    ctx.fillRect(0, 0, w, h);

    // Show gameplay elements
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillStyle = '#fff';

    ctx.fillRect(480, 300, 300, 200);

    ctx.fillRect(480, 500, 300, 100);

    // Tutorial text
    ctx.globalCompositeOperation = 'source-over';
    ctx.font = '25px sans-serif';

    text = 'Match these shapes...';
    ctx.fillText(text, 480, 280);

    text = "... to fill this bar ...";
    ctx.fillText(text, 540, 500);

    text = "... and score points!";
    ctx.fillText(text, 250, 555);

    const t = this.app.renderingSystem.t
    text = 'Press SPACE to start';
    let m = ctx.measureText(text);
    ctx.fillText(text, w/2 - m.width/2, 50 + Math.sin(t) * 6);
  },
};

STATES.GameOver = {
  enter() {
    // Remove remaining rows
    this.app.game.emptyBottomRow();
    this.app.renderingSystem.makeTilesFall(++this.app.game.bottomRow, 1);
    this.app.game.emptyBottomRow();
    this.app.renderingSystem.makeTilesFall(++this.app.game.bottomRow, 1);
    this.app.game.emptyBottomRow();
    this.app.ecs.removeEntity(this.app.game.player);
  },

  leave() {
    // Remove the previous game system properly
    this.app.game.destroySystem();
    this.app.ecs.removeSystem(this.app.game);

    // Add the tiles back
    this.app.renderingSystem.buildTiles();
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
    ctx.fillText(text, w/2 - m.width/2, h/2);

    text = 'Press SPACE for a new game';
    ctx.font = '20px sans-serif';
    m = ctx.measureText(text);
    ctx.fillText(text, w/2 - m.width/2, h/2 + 50);
  },

  keydown(event) {
    if (event.key === 'space') {
      this.app.setState(STATES.NewGame);
    }
  },
};

STATES.NewGame = {
  enter() {
    this.app.ecs.addSystem(this.app.game = new GameSystem(this.app));
    this.app.setState(STATES.CheckMatches);
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

    if (event.key === 'enter' || event.key === 'space') {
      this.app.setState(STATES.Pause);
    }

    // if (event.key === 't')
    //   this.app.renderingSystem.shake(0.5, 10, 2);

    // if (event.key === 'y')
    //   this.app.renderingSystem.fillTimer(0.1);
    // if (event.key === 'u')
    //   this.app.renderingSystem.fillTimer(0.9);

    // if (event.key === 'g')
    //   this.app.renderingSystem.animateGod(0);
    // if (event.key === 'h')
    //   this.app.renderingSystem.animateGod(1);
    // if (event.key === 'j')
    //   this.app.renderingSystem.animateGod(2);
    // if (event.key === 'k')
    //   this.app.renderingSystem.animateGod(3);

    // if (event.key === 'v')
    //   this.app.particleSystem.createFire(-10, 0, 3);
    // if (event.key === 'b')
    // {
    //   const goal = this.app.renderingSystem.rune2.position;
    //   //this.app.particleSystem.createSoul(900, 10, 5,  goal.x, goal.y);

    //   this.app.particleSystem.createSoulFromTileToRune(5, 1);
    // }

    // if (event.key === 'n')
    // {
    //   this.app.renderingSystem.highlightTile(0, 1, 2);
    //   this.app.renderingSystem.highlightTile(1, 3, 2);
    //   this.app.renderingSystem.highlightTile(2, 10, 2);
    // }

    // if (event.key === 'm')
    //   this.app.renderingSystem.makeTilesFall(0, 1);

    // if (event.key === '1')
    //   this.app.renderingSystem.highlightRune(1);
    // if (event.key === '2')
    //   this.app.renderingSystem.flashTimer(true);
    // if (event.key === '3')
    //   this.app.renderingSystem.flashTimer(false);
  }
};

STATES.WrathOfGod = {
  enter() {
    this.app.renderingSystem.shake(0.5, 10, 2);
    this.app.renderingSystem.animateGod(3);
    this.app.playSound(`voice-scaled`);
    this.delay = 1;
  },

  leave() {
    this.app.renderingSystem.makeTilesFall(this.app.game.bottomRow, 1);
    this.app.renderingSystem.fillTimer(this.app.game.timer);
  },

  step(dt) {
    if (this.delay === 0) {
      this.app.setState(STATES.RemoveBottomRow);
    }
    this.delay = Math.max(0, this.delay - dt);
  },
};

STATES.RemoveBottomRow = {
  enter() {
    this.app.game.removeBottomRow();
  },

  step(dt) {
    this.app.setState(STATES.Main);
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
    ctx.fillText(text, w/2 - m.width/2, h/2 + Math.sin(2*t) * 10);

    text = 'Press SPACE to resume';
    ctx.font = '20px sans-serif';
    m = ctx.measureText(text);
    ctx.fillText(text, w/2 - m.width/2, h/2 + 50);
  },

  keydown(event) {
    if (event.key === 'space' || event.key === 'enter') {
      this.app.setState(STATES.Main);
    }
  },
};

STATES.MovePlayer = {
  enter() {
    this.delay = .05;
    this.delay_init = this.delay;
    this.app.rotationTheta = 0;
  },

  leave() {
    this.app.game.stopPlayer();
  },

  step(dt) {
    if (this.delay === 0) {
      this.app.setState(STATES.Main);
    }
    this.delay = Math.max(0, this.delay - dt);
    this.app.rotationTheta = 1 - (this.delay / this.delay_init);
  },
};

STATES.Rotating = {
  enter() {
    this.delay = 0.06;
    this.delay_init = this.delay;
    this.app.rotationTheta = 0;
    this.app.playSound('move-scaled');
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

    if (this.app.game.currentCombo > 1) {
      this.app.renderingSystem.animateGod(2);
    }

    if (this.app.game.currentCombo > 3) {
      this.app.renderingSystem.shake(0.2, 3, .5);
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
    this.delay = .3;
    this.app.game.highlightMatchCells(this.delay);
    let sound = this.app.game.currentCombo + 1;
    sound = clamp(sound, 1, 6);
    this.app.playSound(`match-${sound}-scaled`);
  },

  step(dt) {
    if (this.delay === 0) {
      this.app.setState(STATES.RemoveMatchCells);
    }
    this.delay = Math.max(0, this.delay - dt);
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
    this.delay = 0.1;
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
//delete PLAYGROUND.LoadingScreen

window.addEventListener('DOMContentLoaded', function main() {
  new PLAYGROUND.Application({
    // dimensions of the WebGL buffer
    width: 800,
    height: 600,
    // scaled to screen dimensions
    scale: 1,

    smoothing: false,

    moveEasing: TWEEN.Easing.Linear.None,

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
      this.stats.dom.style.display = 'none';
      document.body.appendChild(this.stats.dom);

      //this.loadData('assets/box.json');
      //this.loadData('assets/guy.json');
    },

    create() {
      // MODELS.forEach(asset => this.loadData(asset));

      this.loadSounds('move');
      this.sound.alias('move-scaled', 'move', .2, 1);

      for (let i=1; i <= 6; ++i) {
        this.loadSounds('match-' + i);
        this.sound.alias('match-' + i + '-scaled', 'match-' + i, .2, 1);
      }

      this.loadSounds('voice-of-god');
      this.sound.alias('voice-scaled', 'voice-of-god', .8, 1);

      this.loadSounds('bg-abstraction');


      // Load textures
      this.loadTexture('assets/tile.png');
      this.loadTexture('assets/particle.png');
      this.loadTexture('assets/bg.png');
      this.loadTexture('assets/bg_normal.png');
      this.loadTexture('assets/wall_normal.jpg');
      this.loadTexture('assets/timer.png');

      // Load models
      // NOT WORKING: there is only one guy after that
      // this.loadGLTF('assets/guy.glb');
      // this.loadGLTF('assets/wall.glb');

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
    },

    loadTexture(path) {
      if (!this.textureLoader) {
        this.textureLoader = new THREE.TextureLoader();
        this.textures = {};
      }

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

    loadGLTF(path) {
      if (!this.GLTFLoader) {
        this.GLTFLoader = new THREE.GLTFLoader();
        this.GLTFModels = {};
      }

      this.GLTFLoader.load(
        path,
        model => {
          this.GLTFModels[path] = model;
        },
        function(){},
        function ( xhr ) {
          console.log(`Error loading GLTF model ${path}: ${xhr}`);
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

        ctx.fillStyle = '#aaa';

        // Timer speed
        ctx.fillText('speed: ' + this.game.timerSpeed, 450, 520);

        // Timere value
        ctx.fillText('timer: ' + this.game.timer, 450, 535);

        // Bottom row
        ctx.fillText('bottom row: ' + this.game.bottomRow, 10, 10);
      }

      if (this.game) {
        // Score
        ctx.font = '30px sans-serif';
        ctx.fillStyle = '#fff';
        ctx.fillText(Math.floor(this.game.displayScore), 620, 500);
      }
    },

    keyup(event) {
      if (event.key === 'f2') {
        DEBUG = !DEBUG;
        this.stats.dom.style.display = DEBUG ? 'block' : 'none';
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
      this.setState(STATES.TitleScreen);
    },

    // Record FPS through the prerender and postrender events
    postrender() { this.stats.update(); }
  })
})
