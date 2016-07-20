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
const selectNode = document.querySelector('select');

const setMode = (modeName) => {
	const updateUI = () => ui.update();
	location.hash = modeName;

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

	selectNode.value = modeName;
	updateUI();
};

fetch('/level3.txt').then(file => file.text()).then(level => {

	selectNode.addEventListener('change', event => {
		const value = event.target.value;

		setMode(value);
	});

	if (location.hash === '#two-players') {
		setMode('two-players');
	} else {
		setMode('single-player');
	}

	field.loadLevel(level);

	view.setupEvents();

	view.play();
});
