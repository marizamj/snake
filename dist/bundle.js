(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

function EventEmitter() {
  this._events = this._events || {};
  this._maxListeners = this._maxListeners || undefined;
}
module.exports = EventEmitter;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
EventEmitter.defaultMaxListeners = 10;

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function(n) {
  if (!isNumber(n) || n < 0 || isNaN(n))
    throw TypeError('n must be a positive number');
  this._maxListeners = n;
  return this;
};

EventEmitter.prototype.emit = function(type) {
  var er, handler, len, args, i, listeners;

  if (!this._events)
    this._events = {};

  // If there is no 'error' event listener then throw.
  if (type === 'error') {
    if (!this._events.error ||
        (isObject(this._events.error) && !this._events.error.length)) {
      er = arguments[1];
      if (er instanceof Error) {
        throw er; // Unhandled 'error' event
      } else {
        // At least give some kind of context to the user
        var err = new Error('Uncaught, unspecified "error" event. (' + er + ')');
        err.context = er;
        throw err;
      }
    }
  }

  handler = this._events[type];

  if (isUndefined(handler))
    return false;

  if (isFunction(handler)) {
    switch (arguments.length) {
      // fast cases
      case 1:
        handler.call(this);
        break;
      case 2:
        handler.call(this, arguments[1]);
        break;
      case 3:
        handler.call(this, arguments[1], arguments[2]);
        break;
      // slower
      default:
        args = Array.prototype.slice.call(arguments, 1);
        handler.apply(this, args);
    }
  } else if (isObject(handler)) {
    args = Array.prototype.slice.call(arguments, 1);
    listeners = handler.slice();
    len = listeners.length;
    for (i = 0; i < len; i++)
      listeners[i].apply(this, args);
  }

  return true;
};

EventEmitter.prototype.addListener = function(type, listener) {
  var m;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events)
    this._events = {};

  // To avoid recursion in the case that type === "newListener"! Before
  // adding it to the listeners, first emit "newListener".
  if (this._events.newListener)
    this.emit('newListener', type,
              isFunction(listener.listener) ?
              listener.listener : listener);

  if (!this._events[type])
    // Optimize the case of one listener. Don't need the extra array object.
    this._events[type] = listener;
  else if (isObject(this._events[type]))
    // If we've already got an array, just append.
    this._events[type].push(listener);
  else
    // Adding the second element, need to change to array.
    this._events[type] = [this._events[type], listener];

  // Check for listener leak
  if (isObject(this._events[type]) && !this._events[type].warned) {
    if (!isUndefined(this._maxListeners)) {
      m = this._maxListeners;
    } else {
      m = EventEmitter.defaultMaxListeners;
    }

    if (m && m > 0 && this._events[type].length > m) {
      this._events[type].warned = true;
      console.error('(node) warning: possible EventEmitter memory ' +
                    'leak detected. %d listeners added. ' +
                    'Use emitter.setMaxListeners() to increase limit.',
                    this._events[type].length);
      if (typeof console.trace === 'function') {
        // not supported in IE 10
        console.trace();
      }
    }
  }

  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.once = function(type, listener) {
  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  var fired = false;

  function g() {
    this.removeListener(type, g);

    if (!fired) {
      fired = true;
      listener.apply(this, arguments);
    }
  }

  g.listener = listener;
  this.on(type, g);

  return this;
};

// emits a 'removeListener' event iff the listener was removed
EventEmitter.prototype.removeListener = function(type, listener) {
  var list, position, length, i;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events || !this._events[type])
    return this;

  list = this._events[type];
  length = list.length;
  position = -1;

  if (list === listener ||
      (isFunction(list.listener) && list.listener === listener)) {
    delete this._events[type];
    if (this._events.removeListener)
      this.emit('removeListener', type, listener);

  } else if (isObject(list)) {
    for (i = length; i-- > 0;) {
      if (list[i] === listener ||
          (list[i].listener && list[i].listener === listener)) {
        position = i;
        break;
      }
    }

    if (position < 0)
      return this;

    if (list.length === 1) {
      list.length = 0;
      delete this._events[type];
    } else {
      list.splice(position, 1);
    }

    if (this._events.removeListener)
      this.emit('removeListener', type, listener);
  }

  return this;
};

EventEmitter.prototype.removeAllListeners = function(type) {
  var key, listeners;

  if (!this._events)
    return this;

  // not listening for removeListener, no need to emit
  if (!this._events.removeListener) {
    if (arguments.length === 0)
      this._events = {};
    else if (this._events[type])
      delete this._events[type];
    return this;
  }

  // emit removeListener for all listeners on all events
  if (arguments.length === 0) {
    for (key in this._events) {
      if (key === 'removeListener') continue;
      this.removeAllListeners(key);
    }
    this.removeAllListeners('removeListener');
    this._events = {};
    return this;
  }

  listeners = this._events[type];

  if (isFunction(listeners)) {
    this.removeListener(type, listeners);
  } else if (listeners) {
    // LIFO order
    while (listeners.length)
      this.removeListener(type, listeners[listeners.length - 1]);
  }
  delete this._events[type];

  return this;
};

EventEmitter.prototype.listeners = function(type) {
  var ret;
  if (!this._events || !this._events[type])
    ret = [];
  else if (isFunction(this._events[type]))
    ret = [this._events[type]];
  else
    ret = this._events[type].slice();
  return ret;
};

EventEmitter.prototype.listenerCount = function(type) {
  if (this._events) {
    var evlistener = this._events[type];

    if (isFunction(evlistener))
      return 1;
    else if (evlistener)
      return evlistener.length;
  }
  return 0;
};

EventEmitter.listenerCount = function(emitter, type) {
  return emitter.listenerCount(type);
};

function isFunction(arg) {
  return typeof arg === 'function';
}

function isNumber(arg) {
  return typeof arg === 'number';
}

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}

function isUndefined(arg) {
  return arg === void 0;
}

},{}],2:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.SGameView = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }(); // cell size, canvas width, canvas height


var _Snake = require('./Snake');

var _SPlayfield = require('./SPlayfield');

var _sizes = require('./sizes');

var _coordHelpers = require('./coord-helpers');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var SGameView = exports.SGameView = function () {
	function SGameView(field, canvas) {
		_classCallCheck(this, SGameView);

		this.field = field;
		this.snakes = field.snakes;
		this.canvas = canvas;
		this.context = canvas.getContext('2d');
		this.foodColor = '#54b78c';
		this.status = 'paused';
	}

	_createClass(SGameView, [{
		key: 'drawGrid',
		value: function drawGrid(cs, cw, ch) {
			var context = this.context;


			context.strokeStyle = '#b3b3b3';

			for (var i = 0; i <= cw; i += cs) {
				context.beginPath();
				context.moveTo(i, 0);
				context.lineTo(i, ch);
				context.stroke();
			}

			for (var _i = 0; _i <= ch; _i += cs) {
				context.beginPath();
				context.moveTo(0, _i);
				context.lineTo(cw, _i);
				context.stroke();
			}
		}
	}, {
		key: 'drawLevel',
		value: function drawLevel(cs) {
			var context = this.context;
			var field = this.field;


			field.obstacles.forEach(function (obstacle) {
				context.fillStyle = '#777777';
				context.fillRect(obstacle.x, obstacle.y, cs, cs);
			});
		}
	}, {
		key: 'handleKeys',
		value: function handleKeys(event, snake) {
			var keys = snake.controls;

			if (event.key === keys.up) {
				event.preventDefault();
				snake.directionQueue.push('up');
				snake.removePause();
			}

			if (event.key === keys.right) {
				event.preventDefault();
				snake.directionQueue.push('right');
				snake.removePause();
			}

			if (event.key === keys.down) {
				event.preventDefault();
				snake.directionQueue.push('down');
				snake.removePause();
			}

			if (event.key === keys.left) {
				event.preventDefault();
				snake.directionQueue.push('left');
				snake.removePause();
			}
		}
	}, {
		key: 'setupEvents',
		value: function setupEvents() {
			var _this = this;

			window.addEventListener('keydown', function (event) {
				_this.snakes.forEach(function (snake) {
					return _this.handleKeys(event, snake);
				});
			});

			this.canvas.addEventListener('click', function (event) {
				if (_this.field.isGameOver()) {
					_this.field.reset();
				}
			});
		}
	}, {
		key: 'renderGame',
		value: function renderGame() {
			var context = this.context;
			var snakes = this.snakes;
			var field = this.field;


			context.clearRect(0, 0, _sizes.cw, _sizes.ch);

			// draw foods
			if (field.foods.length > 0) {
				for (var i = 0; i < field.foods.length; i++) {
					context.fillStyle = this.foodColor;
					context.fillRect(field.foods[i].x, field.foods[i].y, _sizes.cs, _sizes.cs);
				}
			}

			//draw snakes
			snakes.forEach(function (snake) {
				// draw tail
				var tail = snake.tail;

				if (snake.snakeLength > 1) {
					for (var _i2 = 0; _i2 < snake.snakeLength - 1; _i2++) {
						var coord = tail[_i2] || snake.headPosition;

						context.fillStyle = snake.color;
						context.fillRect(coord.x, coord.y, _sizes.cs, _sizes.cs);
					}
				}

				// draw head
				context.fillStyle = snake.color;
				context.fillRect(snake.headPosition.x, snake.headPosition.y, _sizes.cs, _sizes.cs);
			});

			this.drawLevel(_sizes.cs);
			this.drawGrid(_sizes.cs, _sizes.cw, _sizes.ch);

			if (this.field.isGameOver()) {
				context.fillStyle = 'rgba(150, 150, 150, 0.5)';
				context.fillRect(0, 0, _sizes.cw, _sizes.ch);
				context.font = '32px serif';
				context.textAlign = 'center';
				context.fillStyle = 'black';
				context.fillText('Game over!', _sizes.cw / 2, _sizes.ch / 4);
				context.fillText('Click anywhere to start new game.', _sizes.cw / 2, _sizes.ch / 3);
			}
		}
	}, {
		key: 'play',
		value: function play() {
			var _this2 = this;

			this.field.createFood();
			this.field.createFood();
			this.renderGame();

			var loop = function loop(t) {
				_this2.renderGame();

				_this2.snakes.forEach(function (snake) {
					if (t - snake.t > 1 / snake.speed * 5000) {
						if (snake.status === "game-over") {
							return;
						}
						snake.move();
						snake.t = t;
					}
				});

				window.requestAnimationFrame(loop);
			};

			loop(0);
		}
	}]);

	return SGameView;
}();

},{"./SPlayfield":3,"./Snake":4,"./coord-helpers":6,"./sizes":8}],3:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.SPlayfield = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }(); // cell size, canvas width, canvas height


var _sizes = require('./sizes');

var _coordHelpers = require('./coord-helpers');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var SPlayfield = exports.SPlayfield = function () {
	function SPlayfield() {
		_classCallCheck(this, SPlayfield);

		this.foods = [];
		this.snakes = [];
		this.obstacles = [];
	}

	_createClass(SPlayfield, [{
		key: 'isGameOver',
		value: function isGameOver() {
			return this.snakes.every(function (snake) {
				return snake.status === 'game-over';
			});
		}
	}, {
		key: 'setSnakes',
		value: function setSnakes() {
			var _this = this;

			this.snakes.length = 0;

			for (var _len = arguments.length, snakes = Array(_len), _key = 0; _key < _len; _key++) {
				snakes[_key] = arguments[_key];
			}

			snakes.forEach(function (snake) {
				_this.snakes.push(snake);

				snake.reset();
				snake.field = _this;
			});
		}
	}, {
		key: 'loadLevel',
		value: function loadLevel(level) {
			var _this2 = this;

			var splittedLevel = level.split('\n').map(function (row) {
				return row.split('');
			});

			(0, _coordHelpers.forEachCell)(splittedLevel, function (cell, cellIndex, rowIndex) {
				if (cell === '-' || cell === '+' || cell === '|') {
					_this2.obstacles.push({ 'x': cellIndex * _sizes.cs, 'y': rowIndex * _sizes.cs });
				}
			});
		}
	}, {
		key: 'createFood',
		value: function createFood() {
			var randomX = Math.floor(Math.random() * _sizes.cw);
			var randomY = Math.floor(Math.random() * _sizes.ch);
			var newFoodCoord = {
				x: randomX - randomX % _sizes.cs,
				y: randomY - randomY % _sizes.cs
			};

			var isTail = this.snakes.some(function (snake) {
				return snake.isTail(newFoodCoord);
			});
			var isObstacle = this.obstacles.some(function (obstacle) {
				return (0, _coordHelpers.eq)(newFoodCoord, obstacle);
			});

			if (!isTail && !isObstacle) {
				this.foods.push(newFoodCoord);
			} else {
				this.createFood();
			}
		}
	}, {
		key: 'getSnakeByName',
		value: function getSnakeByName(snakeName) {
			return this.snakes.find(function (snake) {
				return snake.name === snakeName;
			});
		}
	}, {
		key: 'reset',
		value: function reset() {
			var _this3 = this;

			this.snakes.forEach(function (snake) {
				snake.reset();
				snake.field = _this3;
			});
		}
	}]);

	return SPlayfield;
}();

},{"./coord-helpers":6,"./sizes":8}],4:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.Snake = undefined;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _sizes = require('./sizes');

var _coordHelpers = require('./coord-helpers');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } // cell size, canvas width, canvas height


var EventEmitter = require('events');

var Snake = exports.Snake = function (_EventEmitter) {
	_inherits(Snake, _EventEmitter);

	_createClass(Snake, [{
		key: 'setInitial',
		value: function setInitial(name, initialX, initialY, direction, color, speed) {
			this.name = name;
			this.snakeLength = 5;
			this.headPosition = {
				'x': initialX,
				'y': initialY
			};
			this.tail = [];
			this.direction = direction;
			this.speed = speed;
			this.status = 'paused';
			this.color = color;
			this.field = undefined;
			this.t = 0;
			this.score = 0;
			this.health = 5;
			this.directionQueue = [];
		}
	}, {
		key: 'setControls',
		value: function setControls(controls) {
			this.controls = controls;
		}
	}]);

	function Snake(name, initialX, initialY, direction, color) {
		var speed = arguments.length <= 5 || arguments[5] === undefined ? 200 : arguments[5];

		_classCallCheck(this, Snake);

		var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(Snake).call(this));

		_this.reset = function () {
			return _this.setInitial(name, initialX, initialY, direction, color, speed);
		};

		_this.reset();
		return _this;
	}

	_createClass(Snake, [{
		key: 'getNewHeadPosition',
		value: function getNewHeadPosition(direction) {
			var headPosition = this.headPosition;

			var newHeadPosition = _extends({}, headPosition);

			if (direction === 'up') {
				headPosition.y > 0 ? newHeadPosition.y -= _sizes.cs : newHeadPosition.y = _sizes.ch - _sizes.cs;
			}

			if (direction === 'right') {
				headPosition.x < _sizes.cw - _sizes.cs ? newHeadPosition.x += _sizes.cs : newHeadPosition.x = 0;
			}

			if (direction === 'down') {
				headPosition.y < _sizes.ch - _sizes.cs ? newHeadPosition.y += _sizes.cs : newHeadPosition.y = 0;
			}

			if (direction === 'left') {
				headPosition.x > 0 ? newHeadPosition.x -= _sizes.cs : newHeadPosition.x = _sizes.cw - _sizes.cs;
			}

			return newHeadPosition;
		}
	}, {
		key: 'setDirection',
		value: function setDirection() {
			if (this.directionQueue.length === 0) {
				return;
			}

			var d = this.directionQueue.shift();

			if (this.isNextDirectionAvaliable(this.direction, d)) {
				this.direction = d;
			} else {
				this.setDirection();
			}
		}
	}, {
		key: 'isNextDirectionAvaliable',
		value: function isNextDirectionAvaliable(direction, nextDirection) {
			var isOpposite = function isOpposite(dir1, dir2) {
				var axis = [['left', 'right'], ['up', 'down']].find(function (direction) {
					return direction.includes(dir1);
				});

				return dir1 !== dir2 && axis.includes(dir2);
			};

			return !isOpposite(direction, nextDirection);
		}
	}, {
		key: 'removePause',
		value: function removePause() {
			if (this.status === 'paused') {
				this.status = 'in-game';
			}
		}
	}, {
		key: 'move',
		value: function move() {
			var headPosition = this.headPosition;


			if (this.status === 'paused') {
				return;
			}

			this.setDirection();

			if (!this.direction) {
				return;
			}

			var newHeadPosition = this.getNewHeadPosition(this.direction);

			this.checkFood(newHeadPosition);

			if (this.isObstacle(newHeadPosition)) {
				this.health -= 1;
				this.emit('update');

				this.status = 'paused';
				this.directionQueue = [];

				if (this.health <= 0) {
					this.status = 'game-over';
				}
			} else {
				this.tail.unshift(_extends({}, headPosition));

				headPosition.x = newHeadPosition.x;
				headPosition.y = newHeadPosition.y;

				if (this.tail.length >= this.snakeLength) {
					this.tail = this.tail.slice(0, this.snakeLength);
				}
			}
		}
	}, {
		key: 'checkFood',
		value: function checkFood(coord) {
			var isFood = this.field.foods.find(function (food) {
				return (0, _coordHelpers.eq)(food, coord);
			});
			if (isFood) {
				this.eatFood(coord);
			}
		}
	}, {
		key: 'eatFood',
		value: function eatFood(coord) {
			this.score += Math.floor(this.speed * this.snakeLength / 10);

			this.emit('update');

			this.snakeLength += 2;
			this.speed += 1;

			this.field.foods = this.field.foods.filter(function (food) {
				return !(0, _coordHelpers.eq)(food, coord);
			});

			this.field.createFood();

			if (this.field.foods.length < 2) {
				this.field.createFood();
			}
		}
	}, {
		key: 'isTail',
		value: function isTail(coord) {
			return Boolean(this.tail.find(function (part) {
				return (0, _coordHelpers.eq)(part, coord);
			}));
		}
	}, {
		key: 'isHead',
		value: function isHead(coord) {
			return (0, _coordHelpers.eq)(this.headPosition, coord);
		}
	}, {
		key: 'isObstacle',
		value: function isObstacle(coord) {
			var _this2 = this;

			var didHitAnySnake = this.field.snakes.some(function (snake) {
				if (snake.name !== _this2.name) {
					return snake.isTail(coord) || snake.isHead(coord);
				} else {
					return snake.isTail(coord);
				}
			});

			var didHitWall = this.field.obstacles.some(function (obstacle) {
				return (0, _coordHelpers.eq)(coord, obstacle);
			});

			return didHitAnySnake || didHitWall;
		}
	}, {
		key: 'reset',
		value: function reset() {
			this.setInitial();
		}
	}]);

	return Snake;
}(EventEmitter);

},{"./coord-helpers":6,"./sizes":8,"events":1}],5:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});
var ArrowControls = exports.ArrowControls = {
	up: 'ArrowUp',
	right: 'ArrowRight',
	down: 'ArrowDown',
	left: 'ArrowLeft'
};

var AWSDControls = exports.AWSDControls = {
	up: 'w',
	right: 'd',
	down: 's',
	left: 'a'
};

},{}],6:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.eq = eq;
exports.forEachCell = forEachCell;
function eq(coord1, coord2) {
	return coord1.x === coord2.x && coord1.y === coord2.y;
}

function forEachCell(level, callback) {
	level.forEach(function (row, rowIndex) {
		row.forEach(function (cell, cellIndex) {
			callback(cell, cellIndex, rowIndex);
		});
	});
}

},{}],7:[function(require,module,exports){
'use strict';

var _Snake = require('./Snake');

var _SPlayfield = require('./SPlayfield');

var _SGameView = require('./SGameView');

var _sizes = require('./sizes');

var _controls = require('./controls');

var _ui = require('./ui');

var _ui2 = _interopRequireDefault(_ui);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// cell size, canvas width, canvas height

var snake1 = new _Snake.Snake('player1', 40, 40, 'right', '#ca0b03', 20);
var snake2 = new _Snake.Snake('player2', 740, 440, 'left', '#0272a2', 20);

var field = new _SPlayfield.SPlayfield();
var view = new _SGameView.SGameView(field, document.querySelector('#canvas'));

window.field = field;

var ui = new _ui2.default(field);
var selectNode = document.querySelector('select');

var setMode = function setMode(modeName) {
	var updateUI = function updateUI() {
		return ui.update();
	};
	location.hash = modeName;

	if (modeName === 'single-player') {
		field.setSnakes(snake1);
		snake1.setControls(_controls.ArrowControls);

		snake1.on('update', updateUI);
	}

	if (modeName === 'two-players') {
		field.setSnakes(snake1, snake2);
		snake1.setControls(_controls.AWSDControls);
		snake2.setControls(_controls.ArrowControls);

		snake1.on('update', updateUI);
		snake2.on('update', updateUI);
	}

	selectNode.value = modeName;
	updateUI();
};

fetch('level3.txt').then(function (file) {
	return file.text();
}).then(function (level) {

	selectNode.addEventListener('change', function (event) {
		var value = event.target.value;

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

},{"./SGameView":2,"./SPlayfield":3,"./Snake":4,"./controls":5,"./sizes":8,"./ui":10}],8:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
var cs = exports.cs = 20; // cell size
var cw = exports.cw = 800; // canvas width
var ch = exports.ch = 500; // canvas height

},{}],9:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
var capitalize = exports.capitalize = function capitalize(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
};

},{}],10:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _textHelpers = require('./text-helpers');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var UI = function () {
	function UI(field) {
		_classCallCheck(this, UI);

		this.field = field;
	}

	_createClass(UI, [{
		key: 'forEachPlayerView',
		value: function forEachPlayerView(callback) {
			Array.from(document.querySelectorAll('.js-player-view')).forEach(function (node) {
				var playerName = node.dataset.player;

				callback({ playerName: playerName, node: node });
			});
		}
	}, {
		key: 'toggleColumns',
		value: function toggleColumns() {
			var _this = this;

			this.forEachPlayerView(function (view) {
				var isPlaying = Boolean(_this.field.getSnakeByName(view.playerName));

				view.node.classList.toggle('player-view--hidden', !isPlaying);
			});
		}
	}, {
		key: 'buildHTML',
		value: function buildHTML(snake) {
			return '\n\t\t\t<p>Health: ' + snake.health + '</p>\n\t\t\t<p>Score: ' + snake.score + '</p>\n\t\t\t<ul style="list-style: none; padding: 0; margin: 0;">\n\t\t\t' + Object.keys(snake.controls).map(function (key) {
				return '\n\t\t\t\t\t<li>\n\t\t\t\t\t\t' + (0, _textHelpers.capitalize)(key) + ' - ' + snake.controls[key] + '\n\t\t\t\t\t</li>\n\t\t\t\t\t';
			}).join('\n') + '\n\t\t\t</ul>\n\t\t\t';
		}
	}, {
		key: 'update',
		value: function update() {
			var _this2 = this;

			this.toggleColumns();

			this.forEachPlayerView(function (view) {
				var snake = _this2.field.getSnakeByName(view.playerName);

				if (!snake) {
					return;
				}

				view.node.querySelector('.controls').innerHTML = _this2.buildHTML(snake);
			});
		}
	}]);

	return UI;
}();

exports.default = UI;

},{"./text-helpers":9}]},{},[7]);
