import { cs, cw, ch } from './sizes'; // cell size, canvas width, canvas height
import { eq } from './coord-helpers';

export class Snake {
	setInitial(initialX, initialY, direction, color) {
		this.snakeLength = 5;
		this.headPosition = {
			'x': initialX,
			'y': initialY,
		}
		this.tail = [];
		this.direction = direction;
		this.speed = 200;
		this.status = 'in-game';
		this.color = color;
		this.field = undefined;
	}

	constructor(initialX, initialY, direction, color) {
		this.setInitial(initialX, initialY, direction, color);
	}

	move() {
		const headPosition = this.headPosition;
		const direction = this.direction;

		this.tail.unshift({ ...headPosition });

		if (this.tail.length >= this.snakeLength) {
			this.tail = this.tail.slice(0, this.snakeLength);
		}

		if (direction === 'up') {
			headPosition.y > 0 ?
				headPosition.y -= cs :
				headPosition.y = ch - cs;
		}

		if (direction === 'right') {
			headPosition.x < cw - cs ?
				headPosition.x += cs:
				headPosition.x = 0;
		}

		if (direction === 'down') {	
			headPosition.y < ch - cs ?
				headPosition.y += cs :
				headPosition.y = 0;
		}

		if (direction === 'left') {
			headPosition.x > 0 ?
				headPosition.x -= cs:
				headPosition.x = cw - cs;
		}

		this.checkFood(headPosition);

		if (this.isObstacle(headPosition)) {
			this.status = 'game-over';
		}
	}

	checkFood(coord) {
		const isFood = this.field.foods.find(food => eq(food, coord));
		if (isFood) {
			this.eatFood(coord);
		}
	}

	eatFood(coord) {
		this.snakeLength += 2;

		this.field.foods = this.field.foods.filter(food => !eq(food, coord));

		this.field.createFood();

		if (this.field.foods.length < 2) {
			this.field.createFood();
		}
	}

	isTail(coord) {
		return Boolean(this.tail.find(part => eq(part, coord)));
	}

	isObstacle(coord) {
		const didHitAnyTail = this.field.snakes.some(snake => {
			return snake.isTail(coord);
		});

		const didHitWall = this.field.obstacles.some(obstacle => eq(coord, obstacle)); 

		return didHitAnyTail || didHitWall;
	}

	reset() { this.setInitial(); }
}


