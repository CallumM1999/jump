new Vue({
	el: '#app',

	data: {
		w: 0,
		h: 0,

		canvas: null,
		ctx: null,

		fps: 1000 / 60,
		interval: null,

		speed: 3,
		max_speed: 12,
		acceleration: 0.0004,
		gravity: 0.1,
		jump_energy: 4,

		player: {
			x: 20,
			y: 0,
			w: 30,
			h: 30,
			energy: 0,

			isJumping: false,

			sprite: new Image(),
			sprite_POS: [0, 176, 0, 264],
			sprite_POS_DEAD: 352,
			sprite_POS_JUMP: 0,
			sprite_INDEX: 0
		},

		buttons: {},
		keys: {
			'SPACE': { '32': true }
		},

		horizon: {
			sprite: new Image(),
			pos: 0
		},

		// obstacles
		obs: {
			sh: {
				cacti: new Image(),
			},
			sprites: [],
			list: [],
			MIN_GAP: 160,

			generate(last) {
				const gap = last ? last.w : 0;
				return {
					...this.sprites[Math.floor(Math.random() * this.sprites.length)],
					x: 600 + gap + (Math.random() * this.MIN_GAP),
				};
			}
		},

		clouds: {
			i: new Image(),
			list: [],
			MIN_GAP: 60,
			generate(startPos = 600) {
				return {
					x: startPos + this.i.width + Math.floor(Math.random() * this.MIN_GAP * (Math.random() * 2 + 1)),
					y: Math.floor(Math.random() * 3 + 1) * 20
				};
			}
		},

		paused: false,
		gameStarted: false,

		SCORE: 0,
		H_SCORE: 0,

		DEAD: false,

	},

	mounted() {
		this.horizon.sprite.src = 'assets/horizon.png';
		this.obs.sh.cacti.src = 'assets/cacti.png';
		this.clouds.i.src = 'assets/cloud.png';
		this.player.sprite.src = 'assets/trex.png';

		this.canvas = this.$refs.canvas;
		this.ctx = this.canvas.getContext('2d');

		this.w = window.innerWidth > 620 ? 600 : window.innerWidth - 20;
		this.h = 150;

		this.obs.sprites.push(
			{ h: 40, w: 40, y: 150 - 40 - 6, i: this.obs.sh.cacti, i_pos: 0, dx: 32, dy: 70 },
			{ h: 32, w: 70, y: 150 - 32 - 6, i: this.obs.sh.cacti, i_pos: 35, dx: 64, dy: 70 },
			{ h: 22, w: 70, y: 150 - 22 - 6, i: this.obs.sh.cacti, i_pos: 100, dx: 106, dy: 72 },
		);

		const cloudSpace = this.clouds.i.width + this.clouds.MIN_GAP + 100;
		this.clouds.list = Array.apply(null, { length: Math.ceil(this.w / cloudSpace) }).map((undefined, index) => this.clouds.generate(index * cloudSpace));

		this.buttons.start = { x: this.w / 2 - 50, y: this.h / 2 + 20, w: 100, h: 30 };

		window.addEventListener('resize', this.handleResize);
		window.addEventListener('keypress', this.handleKeyPress);
		this.canvas.addEventListener('mouseup', this.handleClick);

		setTimeout(() => {
			this.displayStartMenu();
		}, 0);
	},

	methods: {
		handleResize() {
			this.w = window.innerWidth > 620 ? 600 : window.innerWidth - 20;
		},
		handleKeyPress({ keyCode }) {

			if (keyCode in this.keys['SPACE']) {
				// console.log('space');
				if (!this.player.isJumping && !this.paused) this.jump();
			}
		},
		handleClick(e) {
			// console.log('click', e.offsetX, e.offsetY);
			if (!this.gameStarted || this.DEAD) {
				if (
					e.offsetX >= this.buttons.start.x &&
                    e.offsetX <= this.buttons.start.x + this.buttons.start.w &&

                    e.offsetY >= this.buttons.start.y &&
                    e.offsetY <= this.buttons.start.y + this.buttons.start.h
				) {
					this.start();
				}
			}
		},

		togglePause() {
			if (this.gameStarted) {
				if (this.paused) this.startInterval();
				else this.stopInterval();

				this.paused = !this.paused;
			}
		},
		jump() {
			console.log('jump');
			this.player.energy += this.jump_energy;
			this.player.isJumping = true;
		},

		start() {
			this.gameStarted = true;
			this.player.y = 0;
			this.player.isJumping = false;
			this.player.energy = 0;

			this.SCORE = 0;
			this.speed = 2;

			this.DEAD = false;

			this.obs.list = [];

			this.startInterval();
		},
		startInterval() {
			if (this.interval) this.stopInterval();
			this.interval = setInterval(this.update, this.fps);
		},
		stopInterval() { clearInterval(this.interval); },
		update() {
			if (this.DEAD) {
				this.stopInterval();
				this.displayRestartMenu();
			} else {
				this.updateScore();
				this.updateSpeed();
				this.updatePlayer();
				this.updatePlayerSprite();
				this.updateClouds();
				this.updateObstacles();
				this.updateHorizon();
				this.checkCollisions();
				this.redraw();
			}
		},
		updateScore() {
			this.SCORE += .1;
			if (this.SCORE > this.h_SCORE) this.h_SCORE = this.SCORE;
		},
		updateSpeed() {
			this.speed += this.acceleration;
			if (this.speed > this.max_speed) this.speed = this.max_speed;
		},
		updatePlayer() {
			this.player.y -= this.player.energy;
			this.player.energy -= this.gravity;

			if (this.player.y > this.h - 6 - this.player.h) {
				this.player.isJumping = false;

				this.player.y = this.h - 6 - this.player.h;
				this.player.energy = 0;
			}
		},
		updatePlayerSprite() {
			this.player.sprite_INDEX += this.speed / 4;
			if (this.player.sprite_INDEX > this.player.sprite_POS.length) this.player.sprite_INDEX = 0;
		},
		updateClouds() {
			this.clouds.list = this.clouds.list.map(item => {
				item.x -= (this.speed / 2);
				return item;
			}).filter(item => item.x + this.clouds.i.width > 0);

			if (!this.obs.list.length || this.clouds.list[this.clouds.list.length - 1].x < this.w - this.clouds.MIN_GAP) {
				this.clouds.list.push(this.clouds.generate());
			}
		},
		updateObstacles() {
			this.obs.list = this.obs.list.map(item => {
				item.x -= this.speed;
				return item;
			}).filter((item => item.x + item.w > 0));

			if (!this.obs.list.length || this.obs.list[this.obs.list.length - 1].x < this.w - this.obs.MIN_GAP) {
				this.obs.list.push(
					this.obs.generate(this.obs.list[this.obs.list.length - 1])
				);
			}
		},
		updateHorizon() {
			this.horizon.pos -= this.speed;
			if (this.horizon.pos * -1 >= this.horizon.sprite.width) {
				this.horizon.pos = 0;
			}
		},
		redraw() {
			this.ctx.clearRect(0, 0, 1000, 1000);

			this.drawClouds();
			this.drawHorizon();
			this.drawObstacles();
			this.drawScore();
			this.drawPlayer();
		},
		drawClouds() {
			this.clouds.list.map(item => {
				this.ctx.drawImage(this.clouds.i, item.x, item.y);
			});
		},
		drawHorizon() {
			this.ctx.beginPath();
			this.ctx.drawImage(this.horizon.sprite, this.horizon.pos, this.h - 16);
			this.ctx.drawImage(this.horizon.sprite, this.horizon.pos + this.horizon.sprite.width, this.h - 16);
			this.ctx.stroke();
		},
		drawObstacles() {
			this.obs.list.map(item => {
				this.ctx.drawImage(item.i, item.i_pos, 0, item.dx, item.dy, item.x, item.y, item.w, item.h);
			});
		},
		formatScore(score) {
			const str = score.toString();
			return '0'.repeat(6 - str.length) + str;
		},
		drawScore() {
			this.ctx.font = '16px Arial';
			this.ctx.textAlign = 'right';
			this.ctx.fillStyle = '#000';
			this.ctx.fillText(
				this.h_SCORE ? `HI ${this.formatScore(Math.floor(this.h_SCORE))} ${this.formatScore(Math.floor(this.SCORE))}` : `${this.formatScore(Math.floor(this.SCORE))}`
				, this.w - 10, 30);
		},
		drawPlayer() {
			this.ctx.drawImage(
				this.player.sprite,
				this.DEAD ? this.player.sprite_POS_DEAD : this.player.isJumping ? this.player.sprite_POS_JUMP : this.player.sprite_POS[Math.floor(this.player.sprite_INDEX)],
				0,
				88,
				94,
				this.player.x,
				this.player.y,
				this.player.w,
				this.player.h
			);
		},
		checkCollisions() {
			const len = this.obs.list.length;
			for (let i = 0; i < len; i++) {
				if (this.player.x + this.player.w > this.obs.list[i].x &&
                    this.player.x < this.obs.list[i].x + this.obs.list[i].w &&
                    - this.player.y - this.player.h <= - this.obs.list[i].y
				) {
					this.DEAD = true;
					break;
				}
			}
		},
		drawPlayTriangle() {
			// draw play triangle
			this.ctx.beginPath();
			this.ctx.moveTo(this.buttons.start.x + 38, this.buttons.start.y + 4);
			this.ctx.lineTo(this.buttons.start.x + this.buttons.start.w - 38, this.buttons.start.y + (this.buttons.start.h / 2));
			this.ctx.lineTo(this.buttons.start.x + 38, this.buttons.start.y + this.buttons.start.h - 4);
			this.ctx.lineTo(this.buttons.start.x + 38, this.buttons.start.y + 4);
			this.ctx.stroke();
		},
		displayStartMenu() {
			this.ctx.font = '20px Arial';
			this.ctx.textAlign = 'center';

			this.ctx.beginPath();
			this.ctx.fillText('Start Game', this.w / 2, this.h / 2);
			this.ctx.strokeRect(this.buttons.start.x, this.buttons.start.y, this.buttons.start.w, this.buttons.start.h);
			this.drawPlayTriangle();
		},

		displayRestartMenu() {
			this.ctx.font = '20px Arial';
			this.ctx.textAlign = 'center';

			this.ctx.beginPath();
			this.ctx.fillStyle = '#000';
			this.ctx.fillText('You died', this.w / 2, this.h / 2);

			this.ctx.fillStyle = '#fff';
			this.ctx.rect(this.buttons.start.x, this.buttons.start.y, this.buttons.start.w, this.buttons.start.h);
			this.ctx.fill();
			this.ctx.stroke();

			this.drawPlayTriangle();
		},
	},
});