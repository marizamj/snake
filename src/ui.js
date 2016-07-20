import { capitalize } from './text-helpers';

class UI {
	constructor(field) {
		this.field = field;
	}

	forEachPlayerView(callback) {
		Array.from(document.querySelectorAll('.js-player-view')).forEach(node => {
			const playerName = node.dataset.player;

			callback({ playerName, node });
		});
	}

	toggleColumns() {
		this.forEachPlayerView(view => {
			const isPlaying = Boolean(this.field.getSnakeByName(view.playerName));

			view.node.classList.toggle(
				'player-view--hidden',
				!isPlaying
			);
		});
	}

	buildHTML(snake) {
		return (
			`
			<p>Health: ${snake.health}</p>
			<p>Score: ${snake.score}</p>
			<ul style="list-style: none; padding: 0; margin: 0;">
			${
				Object.keys(snake.controls).map(key =>
					`
					<li>
						${capitalize(key)} - ${snake.controls[key]}
					</li>
					`
				).join('\n')
			}
			</ul>
			`
		);
	}

	update() {
		this.toggleColumns();

		this.forEachPlayerView(view => {
			const snake = this.field.getSnakeByName(view.playerName);

			if (!snake) {
				return;
			}

			view.node.querySelector('.controls').innerHTML = this.buildHTML(snake);
		});
	}
}

export default UI;
