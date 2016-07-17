import { cs, cw, ch } from './sizes'; // cell size, canvas width, canvas height
import { forEachCell } from './coord-helpers';

export class SPlayfield {
	constructor(...snakes) {
		this.foods = [];
		this.snakes = snakes;
		this.obstacles = [];

		this.snakes.forEach(snake => {
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

		if (!isTail) {
			this.foods.push(newFoodCoord);
		} else {
			this.createFood();
		}
	}
}
