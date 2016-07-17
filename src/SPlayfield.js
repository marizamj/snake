import { cs, cw, ch } from './sizes'; // cell size, canvas width, canvas height

export class SPlayfield {
	constructor(...snakes) {
		this.foods = [];
		this.snakes = snakes;

		this.level = [];
		this.obstacles = [];

		this.snakes.forEach(snake => {
			snake.field = this;
		});
	}

	loadLevel(level) {
		this.level = level.split('\n').map(row => row.split(''));

		this.level.forEach((row, rowIndex) => {
			row.forEach((cell, cellIndex) => {
				if (cell === '-' || cell === '+' || cell === '|') {
					this.obstacles.push({ 'x': cellIndex * cs, 'y': rowIndex * cs });
				}
			});
		});
		// console.log(this.obstacles);
	}

	createFood() {
		const randomX = Math.floor(Math.random() * cw);
		const randomY = Math.floor(Math.random() * ch);
		const newFoodCoord = {
			x: randomX - (randomX % cs),
			y: randomY - (randomY % cs),
		}

		const isTail = this.snakes.some(snake => snake.isTail(newFoodCoord));

		if (!isTail) {
			this.foods.push(newFoodCoord);
		} else {
			this.createFood();
		}
	}
}
