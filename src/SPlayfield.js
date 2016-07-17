import { cs, cw, ch } from './sizes'; // cell size, canvas width, canvas height

export class SPlayfield {
	constructor(snakes) {
		this.foods = [];
		this.snakes = Array.from(arguments);

		this.snakes.forEach(snake => {
			snake.field = this;
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