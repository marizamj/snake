import { Snake } from './Snake';
import { SPlayfield } from './SPlayfield';
import { SGameView } from './SGameView';
import { cs, cw, ch } from './sizes'; // cell size, canvas width, canvas height

import { ArrowControls, AWSDControls } from './controls';

import UI from './ui';

const snake1 = new Snake('player1', 40, 40, 'right', '#ca0b03', 20);
const snake2 = new Snake('player2', 740, 440, 'left', '#0272a2', 20);

const field = new SPlayfield();
const view = new SGameView(field, document.querySelector('#canvas'));

window.field = field;

const ui = new UI(field);

const setMode = (modeName) => {
	const updateUI = () => ui.update();

	if (modeName === 'single-player') {
		field.setSnakes(snake1);
		snake1.setControls(ArrowControls);

		snake1.on('update', updateUI);
	}

	if (modeName === 'two-players') {
		field.setSnakes(snake1, snake2);
		snake1.setControls(AWSDControls);
		snake2.setControls(ArrowControls);

		snake1.on('update', updateUI);
		snake2.on('update', updateUI);
	}

	updateUI();
};

fetch('/level1.txt').then(file => file.text()).then(level => {

	document.querySelector('select').addEventListener('change', event => {
		const value = event.target.value;

		setMode(value);
	});

	setMode('single-player');

	field.loadLevel(level);

	view.setupEvents();

	view.play();
});
