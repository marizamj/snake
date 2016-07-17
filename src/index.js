import { Snake } from './Snake';
import { SPlayfield } from './SPlayfield';
import { SGameView } from './SGameView';
import { cs, cw, ch } from './sizes'; // cell size, canvas width, canvas height

const snake1 = new Snake(40, 40, 'right', '#cf4f4f');
const snake2 = new Snake(740, 440, 'left', '#3FA4A5');
const field = new SPlayfield(snake1, snake2);
const view = new SGameView(field, document.querySelector('#canvas'));

fetch('/level1.txt').then(file => file.text()).then(level => {
	field.loadLevel(level);
	view.setupEvents();
	view.play();
});








