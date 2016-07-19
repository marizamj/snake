import { Snake } from './Snake';
import { SPlayfield } from './SPlayfield';
import { cs, cw, ch } from './sizes'; // cell size, canvas width, canvas height
import { forEachCell } from './coord-helpers';

export class SGameView {
	constructor(field, canvas) {
		this.field = field;
		this.snakes = field.snakes;
		this.canvas = canvas;
		this.context = canvas.getContext('2d');
		this.foodColor = '#54b78c';
		this.t = 0;
	}

	drawGrid(cs, cw, ch) {
		const { context } = this;

		context.strokeStyle = '#b3b3b3';

		for (let i = 0; i <= cw; i += cs) {
			context.beginPath();
      context.moveTo(i, 0);
      context.lineTo(i, ch);
      context.stroke();
		}

		for (let i = 0; i <= ch; i += cs) {
			context.beginPath();
      context.moveTo(0, i);
      context.lineTo(cw, i);
      context.stroke();
		}
	}

	drawLevel(cs) {
		const { context, field } = this;

		field.obstacles.forEach(obstacle => {
			context.fillStyle = '#777777';
	    context.fillRect(
	      obstacle.x,
	      obstacle.y,
	      cs,
	      cs
	    );
		});
	}

	setupKeys(event, snake, keys) {
		if (event.key === keys.up) {
			event.preventDefault();
			snake.directionQueue.push('up');
		}

		if (event.key === keys.right) {
			event.preventDefault();
			snake.directionQueue.push('right');
		}

		if (event.key === keys.down) {
			event.preventDefault();
			snake.directionQueue.push('down');
		}

		if (event.key === keys.left) {
			event.preventDefault();
			snake.directionQueue.push('left');
		}
	}

	setupEvents() {
		const { canvas }  = this;

		window.addEventListener('keydown', event => {
			const { snakes } = this;

			if (snakes.length === 2) {
				this.setupKeys(event, snakes[1], {
					up: 'ArrowUp',
					right: 'ArrowRight',
					down: 'ArrowDown',
					left: 'ArrowLeft'
				});
			}

			this.setupKeys(event, snakes[0], {
				up: 'w',
				right: 'd',
				down: 's',
				left: 'a'
			});
		});

		// canvas.addEventListener('click', event => {
		// 	if (this.game.status === 'over') {
		// 		this.game.reset();
		// 		this.play();
		// 	}
		// });
	}

	renderGame() {
		const { context, snakes, field } = this;
		// const game = this.game;

		context.clearRect(0, 0, cw, ch);

    // draw foods
    if (field.foods.length > 0) {
    	for (let i = 0; i < field.foods.length; i++) {
    		context.fillStyle = this.foodColor;
		    context.fillRect(
		      field.foods[i].x,
		      field.foods[i].y,
		      cs,
		      cs
		    );
    	}
    }

    //draw snakes
    snakes.forEach(snake => {
	    // draw tail
			const tail = snake.tail;

	    if (snake.snakeLength > 1) {
	    	for (let i = 0; i < snake.snakeLength - 1; i++) {
	    		let coord = tail[i] || snake.headPosition;

	    		context.fillStyle = snake.color;
			    context.fillRect(
			      coord.x,
			      coord.y,
			      cs,
			      cs
			    );
	    	}
	    }

			// draw head
			context.fillStyle = snake.color;
	    context.fillRect(
	      snake.headPosition.x,
	      snake.headPosition.y,
	      cs,
	      cs
	    );
    });

    this.drawLevel(cs);
		this.drawGrid(cs, cw, ch);

		const isGameOver = snakes.every(snake => snake.status === 'game-over');

		if (isGameOver) {
    	context.font = '32px serif';
	    context.textAlign = 'center';
	    context.fillStyle = 'black';
	    context.fillText('Game over!', cw / 2, ch / 4);
	    context.fillText('Click anywhere to start new game.', cw / 2, ch / 3);
		}
	}

	play() {
		this.field.createFood();
		this.field.createFood();
		this.renderGame();

		const loop = (t) => {
			this.renderGame();

			this.snakes.forEach(snake => {
				if (t - snake.t > (1 / snake.speed) * 5000) {
					if (snake.status === "game-over") {
						return;
					}
					snake.move();
					snake.t = t;
				}
			});

			window.requestAnimationFrame(loop);
		};

		loop(0);
	}
}

