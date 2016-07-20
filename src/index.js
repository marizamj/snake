import { Snake } from './Snake';
import { SPlayfield } from './SPlayfield';
import { SGameView } from './SGameView';
import { cs, cw, ch } from './sizes'; // cell size, canvas width, canvas height

const snake1 = new Snake('player1', 40, 40, 'right', '#ca0b03', 20);
const snake2 = new Snake('player2', 740, 440, 'left', '#0272a2', 20);

const field = new SPlayfield();
const view = new SGameView(field, document.querySelector('#canvas'));

window.field = field;

const mode = {
	'single-player': () => {
		field.setSnakes(snake1);
	},

	'two-players': () => {
		field.setSnakes(snake1, snake2);
	}
};

fetch('/level1.txt').then(file => file.text()).then(level => {

	document.querySelector('select').addEventListener('change', event => {
		const value = event.target.value;

		mode[value]();
	});

	mode['single-player']();

	field.loadLevel(level);

	view.setupEvents();

	view.play();
});
