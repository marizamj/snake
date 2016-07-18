import { Snake } from './Snake';
import { SPlayfield } from './SPlayfield';
import { SGameView } from './SGameView';
import { cs, cw, ch } from './sizes'; // cell size, canvas width, canvas height

const snake1 = new Snake('player1', 40, 40, 'right', '#ca0b03', 40);
const snake2 = new Snake('player2', 740, 440, 'left', '#0272a2', 20);
const field = new SPlayfield(snake1, snake2);
const view = new SGameView(field, document.querySelector('#canvas'));

fetch('/level1.txt').then(file => file.text()).then(level => {
	field.loadLevel(level);
	view.setupEvents();
	view.play();
});








