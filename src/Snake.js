import { cs, cw, ch } from './sizes'; // cell size, canvas width, canvas height
import { eq } from './coord-helpers';

export class Snake {
	setInitial(name, initialX, initialY, direction, color, speed) {
		this.name = name;
		this.snakeLength = 5;
		this.headPosition = {
			'x': initialX,
			'y': initialY,
		}
		this.tail = [];
		this.direction = direction;
		this.speed = speed;
		this.status = 'in-game';
		this.color = color;
		this.field = undefined;
		this.t = 0;
	}

	constructor(name, initialX, initialY, direction, color, speed = 200) {
		this.setInitial(name, initialX, initialY, direction, color, speed);
	}

	getNewHeadPosition(direction) {
		const { headPosition } = this;
		const newHeadPosition = { ...headPosition };

		if (direction === 'up') {
			headPosition.y > 0 ?
				newHeadPosition.y -= cs :
				newHeadPosition.y = ch - cs;
		}

		if (direction === 'right') {
			headPosition.x < cw - cs ?
				newHeadPosition.x += cs:
				newHeadPosition.x = 0;
		}

		if (direction === 'down') {
			headPosition.y < ch - cs ?
				newHeadPosition.y += cs :
				newHeadPosition.y = 0;
		}

		if (direction === 'left') {
			headPosition.x > 0 ?
				newHeadPosition.x -= cs:
				newHeadPosition.x = cw - cs;
		}

		return newHeadPosition;
	}

	move() {
		const { headPosition, direction } = this;
		const newHeadPosition = this.getNewHeadPosition(direction);

		this.checkFood(newHeadPosition);

		if (this.isObstacle(newHeadPosition)) {
			this.status = 'game-over';
		} else {
			this.tail.unshift({ ...headPosition });

			headPosition.x = newHeadPosition.x;
			headPosition.y = newHeadPosition.y;

			if (this.tail.length >= this.snakeLength) {
				this.tail = this.tail.slice(0, this.snakeLength);
			}
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
		this.speed += 1;

		this.field.foods = this.field.foods.filter(food => !eq(food, coord));

		this.field.createFood();

		if (this.field.foods.length < 2) {
			this.field.createFood();
		}
	}

	isTail(coord) {
		return Boolean(this.tail.find(part => eq(part, coord)));
	}

	isHead(coord) {
		return eq(this.headPosition, coord);
	}

	isObstacle(coord) {
		const didHitAnySnake = this.field.snakes.some(snake => {
			if (snake.name !== this.name) {
				return snake.isTail(coord) || snake.isHead(coord);
			} else {
				return snake.isTail(coord);
			}
		});

		const didHitWall = this.field.obstacles.some(obstacle => eq(coord, obstacle));

		return didHitAnySnake || didHitWall;
	}

	reset() { this.setInitial(); }
}


