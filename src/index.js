import { Snake } from './Snake';
import { SPlayfield } from './SPlayfield';
import { SGameView } from './SGameView';
import { cs, cw, ch } from './sizes'; // cell size, canvas width, canvas height



const snake1 = new Snake(20, 20, 'right', '#cf4f4f');
const snake2 = new Snake(200, 200, 'left', '#4fcfcf');
const field = new SPlayfield(snake1, snake2);
const view = new SGameView(field, document.querySelector('#canvas'));
view.setupEvents();
view.play();






