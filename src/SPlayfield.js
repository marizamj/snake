import { cs, cw, ch } from './sizes'; // cell size, canvas width, canvas height
import { eq, forEachCell } from './coord-helpers';

export class SPlayfield {
	constructor() {
		this.foods = [];
		this.snakes = [];
		this.obstacles = [];
	}

	isGameOver() {
		return this.snakes.every(snake => snake.status === 'game-over');
	}

	setSnakes(...snakes) {
		this.snakes.length = 0;

		snakes.forEach(snake => {
			this.snakes.push(snake);

			snake.reset();
			snake.field = this;
		});
	}

	loadLevel(level) {
		const splittedLevel = level.split('\n').map(row => row.split(''));

		forEachCell(splittedLevel, (cell, cellIndex, rowIndex) => {
			if (cell === '-' || cell === '+' || cell === '|') {
				this.obstacles.push({ 'x': cellIndex * cs, 'y': rowIndex * cs });
			}
		});
	}

	createFood() {
		const randomX = Math.floor(Math.random() * cw);
		const randomY = Math.floor(Math.random() * ch);
		const newFoodCoord = {
			x: randomX - (randomX % cs),
			y: randomY - (randomY % cs),
		}

		const isTail = this.snakes.some(snake => snake.isTail(newFoodCoord));
		const isObstacle = this.obstacles.some(obstacle => eq(newFoodCoord, obstacle));

		if (!isTail && !isObstacle) {
			this.foods.push(newFoodCoord);
		} else {
			this.createFood();
		}
	}

	getSnakeByName(snakeName) {
		return this.snakes.find(snake => snake.name === snakeName);
	}

	reset() {
		this.snakes.forEach(snake => {
			snake.reset();
			snake.field = this;
		});
	}
}
