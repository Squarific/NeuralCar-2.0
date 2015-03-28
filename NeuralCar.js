(function() {
    var lastTime = 0;
    var vendors = ['ms', 'moz', 'webkit', 'o'];
    for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
        window.cancelAnimationFrame = window[vendors[x]+'CancelAnimationFrame'] 
                                   || window[vendors[x]+'CancelRequestAnimationFrame'];
    }
 
    if (!window.requestAnimationFrame)
        window.requestAnimationFrame = function(callback, element) {
            var currTime = new Date().getTime();
            var timeToCall = Math.max(0, 16 - (currTime - lastTime));
            var id = window.setTimeout(function() { callback(currTime + timeToCall); }, 
              timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };
 
    if (!window.cancelAnimationFrame)
        window.cancelAnimationFrame = function(id) {
            clearTimeout(id);
        };
}());

if (!Function.prototype.bind) {
  Function.prototype.bind = function (oThis) {
    if (typeof this !== "function") {
      // closest thing possible to the ECMAScript 5 internal IsCallable function
      throw new TypeError("Function.prototype.bind - what is trying to be bound is not callable");
    }

    var aArgs = Array.prototype.slice.call(arguments, 1), 
        fToBind = this, 
        fNOP = function () {},
        fBound = function () {
          return fToBind.apply(this instanceof fNOP && oThis
                                 ? this
                                 : oThis,
                               aArgs.concat(Array.prototype.slice.call(arguments)));
        };

    fNOP.prototype = this.prototype;
    fBound.prototype = new fNOP();

    return fBound;
  };
}

var SQUARIFIC = SQUARIFIC || {};

SQUARIFIC.NeuralCar = function NeuralCar (backCanvas, frontCanvas, console, settings, board) {
	// After five minutes we start losing too much work
	// warn in case of accidental navigation
	setTimeout(function () {
		window.onbeforeunload = function () {
			return "Carefull: leaving will result in loss of work.";
		};
	}, 5 * 60 * 1000);
	this.setSettings = function defaultSettings (s) {
		settings = s = s || {};
		settings.ai = s.ai = s.ai || {};
		settings.car = s.car = s.car || {};
		settings.brain = s.brain = s.brain || {};
		settings.board = s.board = s.board || {};
		settings.debugging = s.debugging = s.debugging || {};
		
		settings.cars = parseInt(s.cars) || 50;
		settings.stepSize = parseInt(s.stepSize) || 1000 / 20;
		settings.generationTime = parseInt(s.generationTime) || (16 - 8/2) * 1000; //(16 - 8/2) is the new 12 for the cool programmers
		settings.mutationRate = parseFloat(s.mutationRate) || 1.4;
		settings.boardWidth = parseInt(s.boardWidth) || 1200;
		settings.boardHeight = parseInt(s.boardHeight) || 600;
		settings.retireAfterGenerations = parseInt(s.retireAfterGenerations) || 14;
		settings.keepTop = parseFloat(s.keepTop) || 0.1;
		settings.minimumMutation = parseFloat(settings.minimumMutation) || 0.01;
		settings.cantKeepUp = settings.cantKeepUp || 3;
		
		settings.car.width = parseInt(s.car.width) || 10;
		settings.car.length = parseInt(s.car.length) || 20;
		settings.car.color = s.car.color || settings.car.colour || "red";
		settings.car.maxSpeed = parseFloat(s.car.maxSpeed) || 0.075;
		settings.car.maxAcceleration = parseFloat(s.maxAcceleration) || 0.00004;
		settings.car.maxTurnAngle = parseFloat(s.car.maxTurnAngle) || Math.PI / 1800;
		settings.car.averageWidth = parseInt(s.car.averageWidth) || 2;
		settings.car.averageHeight = parseInt(s.car.averageHeight) || 4;
		
		settings.ai.type = s.ai.type || "blockVision";
		settings.ai.blockLength = parseInt(s.ai.blockLength) || 80;
		settings.ai.blockLengthCount = parseInt(s.ai.blockLengthCount) || 8;
		settings.ai.blockWidth = parseInt(s.ai.blockWidth) || 60;
		settings.ai.blockWidthCount = parseInt(s.ai.blockWidthCount) || 6;
		settings.ai.front =  parseFloat(s.ai.front) || 3/4;
		settings.ai.side = parseFloat(s.ai.side) || 1/2;
	
		settings.board.streetWidth = parseFloat(s.board.streetWidth) || 4.5;

		settings.brain.inputStructure = s.brain.inputStructure || settings.ai.blockLengthCount * settings.ai.blockWidthCount || 48;
		settings.brain.inputStructure += 22;

		settings.brain.structure = s.brain.structure || [42];
		settings.brain.structure.push(2);
		
		this.runSpeed = parseFloat(s.runSpeed) || 1;
	}
	this.setSettings(settings);

	SQUARIFIC.RegexBrain.prototype = new SQUARIFIC.Brain({}, settings);

	setRegexBrainPrototype();
	
	this.console = new SQUARIFIC.Console(console);
	this.board = new SQUARIFIC.Board(board, settings, this);
	this.carCollection = new SQUARIFIC.CarCollection([], settings, this);
	this.screen = new SQUARIFIC.Screen(backCanvas, frontCanvas);
	
	this.screen.drawBackground(this.board);
	
	if (settings.debugging.playerCar) {
		var playerCar = new SQUARIFIC.Car(new SQUARIFIC.PlayerInput(), settings);
		playerCar.changeColor("brown");
		this.carCollection.add(playerCar);
	}
	
	this.lastUpdate = Date.now();
	this.tooLong = 0;
	this.longer = 0;
	this.step = function neuralCarStep (stepSize) {
		var changed = false;
		this.screen.clearFrontOnNextChange();
		var timeDifference = (Date.now() - this.lastUpdate) * this.runSpeed;
		while (timeDifference - stepSize > 0) {
			var time = Date.now();
			changed = true;
			this.carCollection.step(stepSize, this.board);
			timeDifference -= stepSize;
			this.lastUpdate += (stepSize / this.runSpeed);
			
			if (Date.now() - time > stepSize / this.runSpeed) {
				this.tooLong++;
				if (this.tooLong > settings.cantKeepUp) {
					this.runSpeed = Math.floor(this.runSpeed / ((Date.now() - time + 5) / (stepSize / this.runSpeed)) * 1000) / 1000;
					this.console.log("Couldn't keep up, lowered runSpeed to " + this.runSpeed);
					this.tooLong = 0;
				}
			} else {
				this.tooLong = 0;
				if (settings.maxRunspeed && this.runSpeed < 8 && Date.now() - time < stepSize / (this.runSpeed + 0.5)) {
					this.longer++;
					if (this.longer > 150 * this.runSpeed) {
						this.runSpeed = Math.floor((this.runSpeed + 0.2) * 1000) / 1000;
						this.console.log("Raised runSpeed to " + this.runSpeed);
						this.longer = 0;
					}
				}
			}
		}
		if (changed) {
			this.screen.drawCars(this.carCollection.getCars());
		}
		requestAnimationFrame(this.step);
	}.bind(this, settings.stepSize);
	setInterval(this.step, 2000);
	requestAnimationFrame(this.step);
	
	this.getSettings = function () {
		return settings;
	};
};

function setRegexBrainPrototype () {
	SQUARIFIC.RegexBrain.prototype.getInput = function getInput (car, board, cars) {
		var boardString = this.toAlphanumericString(this.blockVision(car, board, cars));

		var turnLeft = this.regexes.turnLeft.exec(boardString);
		var turnRight = this.regexes.turnRight.exec(boardString);
		
		var speedUp = this.regexes.speedUp.exec(boardString);
		var speedDown = this.regexes.speedDown.exec(boardString);

		var turning = turnLeft ? -1 : 0;
		turning += turnRight ? 1 : 0;

		var acceleration = speedUp ? 1 : 0;
		acceleration += speedDown ? -1 : 0;

		return {
			acceleration: acceleration,
			turning: turning
		};
	};

	SQUARIFIC.RegexBrain.prototype.mutate = function mutate (regexes, mutationRate) {
		// Return a copy of the regexes with the given mutationRate
		var copys = {};
		for (var rKey in regexes) {
			copys[rKey] = this.mutatedRegExp(regexes[rKey], mutationRate);
		}
		return copys;
	};

	SQUARIFIC.RegexBrain.prototype.mutatedRegExp = function mutatedRegExp (regex, mutationRate) {
		var characters = "99999999999999zzzzzzzzzzzzzz+*^$?.|!-";
		var source = regex.source;
		mutationRate = mutationRate / 5;
		var changes = Math.ceil(mutationRate * source.length) + 5;
		var newSource;
		while (changes > 0) {
			// We add 5 places to the array length, if we have to change one of those
			// locations we add a new character at a random position instead of changing one
			var location = Math.floor(Math.random() * (source.length + 5));
			if (location >= source.length) {
				var location = Math.floor(Math.random() * source.length);
				newSource = source.slice(0, location) + characters[Math.floor(Math.random() * characters.length)] + source.slice(location);
			} else {
				newSource = source.slice(0, location) + characters[Math.floor(Math.random() * characters.length)] + source.slice(location + 1);
			}

			try {
				new RegExp(newSource);
				source = newSource;
			} catch (e) {}

			changes--;
		}
		return new RegExp(source);
	};

	SQUARIFIC.RegexBrain.prototype.getNetwork = function getNetwork () {
		// Synonym of getRegexes
		return this.regexes;
	};

	SQUARIFIC.RegexBrain.prototype.setNetwork = function setNetwork (regexes) {
		// Synonym of setRegexes
		this.regexes = regexes;
	};
}

SQUARIFIC.Brain = function Brain (network, settings, neuralCarInstance) {
	function createNetwork (settings) {
		var net = [];
		for (var k = 0; k < settings.brain.structure.length; k++) {
			net[k] = [];
			for (var i = 0; i < parseInt(settings.brain.structure[k]); i++) {
				var sign = Math.random() < 0.5 ? -1 : 1;
				net[k][i] = {
					bias: sign * Math.random(),
					weights: []
				};
				if (!isNaN(parseInt(settings.brain.structure[k - 1]))) {
					var weights = parseInt(settings.brain.structure[k - 1]);
				} else {
					weights = settings.brain.inputStructure;
				}
				sign = Math.random() < 0.5 ? -1 : 1;
				for (var l = 0; l < weights; l++) {
					net[k][i].weights[l] = sign * Math.random();
				}
			}
		}
		return net;
	}
	if (typeof network !== "object") {
		network = createNetwork(settings);
	}
	this.getNetwork = function getNetwork () {
		return network;
	};
	this.setNetwork = function setNetwork (net) {
		network = net;
	};
	this.mutate = function mutate (network, rate) {
		// Return a copy of the given network mutated at the given rate
		var net = [];
		for (var k = 0; k < network.length; k++) {
			net[k] = [];
			for (var i = 0; i < network[k].length; i++) {
				net[k][i] = {
					bias: network[k][i].bias,
					weights: []
				};
				for (var l = 0; l < network[k][i].weights.length; l++) {
					net[k][i].weights[l] = network[k][i].weights[l];
				}
			}
		}
		network = net;
		for (var k = 0; k < network.length; k++) {
			for (var i = 0; i < network[k].length; i++) {
				var sign = Math.random() < 0.5 ? -1 : 1;
				network[k][i].bias += Math.max(network[k][i].bias, settings.minimumMutation) * sign * Math.random() * rate;
				for (var l = 0; l < network[k][i].weights.length; l++) {
					sign = Math.random() < 0.5 ? -1 : 1;
					network[k][i].weights[l] += Math.max(network[k][i].weights[l], settings.minimumMutation) * sign * Math.random() * rate;
				}
			}
		}
		return network;
	};
	
	this.runNetwork = function (inputNodes, network) {
		var layerCount = network.length;
		for (var layer = 0; layer < layerCount; layer++) {
			inputNodes = this.runLayer(inputNodes, network[layer]);
		}
		return inputNodes;
	};
	
	this.runLayer = function runLayer (inputNodes, layer) {
		var outputs = [],
			nodeCount = layer.length;
		for (var node = 0; node < nodeCount; node++) {
			outputs[node] = this.outputFromNode(inputNodes, layer[node]);
		}
		return outputs;
	};
	
	this.outputFromNode = function outputFromNode (inputNodes, node) {
		var sum = node.bias,
			weightCount = node.weights.length;
		for (var weight = 0; weight < weightCount; weight++) {
			sum += node.weights[weight] * inputNodes[weight];
		}
		return 1 / (1 + Math.exp(-sum));
	};
	
	this.getInput = function getInput (car, board, cars) {
		var nodes = this[settings.ai.type](car, board, cars);
		nodes = this.runNetwork(nodes, network);
		
		if (nodes[0] > 0.66) {
			nodes.acceleration = 1;
		} else if (nodes[0] < 0.33) {
			nodes.acceleration = -1;
		} else {
			nodes.acceleration = 0;
		}
		
		if (nodes[1] > 0.66) {
			nodes.turning = 1;
		} else if (nodes[1] < 0.33) {
			nodes.turning = -1;
		} else {
			nodes.turning = 0;
		}
		
		return nodes;
	};

	this.blockVision = function blockVision (car, board, cars) {
		var nodes = [];
		var pixels = [];
		var	width = car.image.width,
			height = car.image.height,
			startX = -settings.ai.side * settings.ai.blockWidth,
			startY = -settings.ai.front * settings.ai.blockLength - height / 2,
			xSteps = settings.ai.blockWidthCount,
			ySteps = settings.ai.blockLengthCount,
			xStep = settings.ai.blockWidth / (settings.ai.blockWidthCount - 1),
			yStep = settings.ai.blockLength / (settings.ai.blockLengthCount - 1),
			xmodAfter = car.x + width / 2,
			ymodAfter = car.y + height / 2,
			angleCos = car.angleCos,
			angleSin = car.angleSin;
		for (var x = 0; x < xSteps; x++) {
			for (var y = 0; y < ySteps; y++) {
				var coords = [startX + x * xStep, startY + y * yStep];
				var xCoord = coords[0];
				
				coords[0] = coords[0] * angleCos - coords[1] * angleSin;
				coords[1] = xCoord * angleSin + coords[1] * angleCos;
				coords[0] = Math.round(coords[0] + xmodAfter);
				coords[1] = Math.round(coords[1] + ymodAfter);
				
				coords[0] = board.ensureCoordInRange(coords[0], board.width);
				coords[1] = board.ensureCoordInRange(coords[1], board.height);
				
				pixels.push(coords);
				nodes.push(board.board[coords[0]][coords[1]]);
			}
		}
		if (settings.debugging.drawVisionPixels) {
			neuralCarInstance.screen.drawPixels(pixels, "#65BEC9", true);
		}
		
		if (settings.collision) {
			var carsCopy = [];
			var carsLength = cars.length;
			for (var k = 0; k < carsLength; k++) {
				carsCopy.push({car: cars[k]});
			}
			carsCopy.sort(function (a, b) {
				if (!a.dis) {
					var axdis = Math.abs(a.car.x - car.x),
						aydis = Math.abs(a.car.y - car.y);
					axdis = Math.min(axdis, board.width - axdis);
					aydis = Math.min(aydis, board.height - aydis);
					a.dis = Math.sqrt(axdis * axdis + aydis * aydis);
				}
				if (!b.dis) {
					var bxdis = Math.abs(b.car.x - car.x),
						bydis = Math.abs(b.car.y - car.y);
					bxdis = Math.min(bxdis, board.width - bxdis);
					bydis = Math.min(bydis, board.height - bydis);
					b.dis = Math.sqrt(bxdis * bxdis + bydis * bydis);
				}
				return a.dis - b.dis;
			});

			var carlength = Math.min(6, carsCopy.length);
			for (var k = 1; k < carlength; k++) {
				var axdis = carsCopy[k].car.x - car.x,
					aydis = carsCopy[k].car.y - car.y;
				var axdisa = board.width - Math.abs(axdis),
					aydisa = board.height - Math.abs(aydis);
				if (Math.abs(axdis) > axdisa) {
					if (axdis < 0) {
						axdis = axdisa;
					} else {
						axdis = -axdisa;
					}
				}
				if (Math.abs(aydis) > aydisa) {
					if (aydis < 0) {
						aydis = aydisa;
					} else {
						aydis = -aydisa;
					}
				}
				nodes.push(2 * (axdis) / board.width);
				nodes.push(2 * (aydis) / board.height);
				nodes.push((cars[k].angle % (Math.PI * 2)) / (Math.PI * 2));
				nodes.push(cars[k].velocity / cars[k].maxSpeed);
			}
			for (; k < 6; k++) {
				nodes.push(1);
				nodes.push(1);
				nodes.push(0);
				nodes.push(0);
			}
			
			nodes.push((car.angle % (Math.PI * 2)) / (Math.PI * 2));
			nodes.push(car.velocity / car.maxSpeed);
		} else {
			for (var k = 0; k < 22; k++) {
				nodes.push(0);
			}
		}
		
		return nodes;
	};

	this.toAlphanumericString = function toAlphanumericString (nodes) {
		var string = "";
		for (var k = 0; k < nodes.length; k++) {
			string += Math.round(nodes[k] * 35).toString(36);
		}
		return string;
	};
};

SQUARIFIC.RegexBrain = function RegexBrain (network, settings, neuralCarInstance) {
	this.regexes = {
		turnLeft: new RegExp("Z"),
		turnRight: new RegExp("Z"),
		speedUp: new RegExp("Z"),
		speedDown: new RegExp("Z")
	};

	this.regexes = this.mutate(this.regexes, settings.mutationRate);

	this.blockVision = function blockVision (car, board, cars) {
		var nodes = [];
		var pixels = [];
		var	width = car.image.width,
			height = car.image.height,
			startX = -settings.ai.side * settings.ai.blockWidth,
			startY = -settings.ai.front * settings.ai.blockLength - height / 2,
			xSteps = settings.ai.blockWidthCount,
			ySteps = settings.ai.blockLengthCount,
			xStep = settings.ai.blockWidth / (settings.ai.blockWidthCount - 1),
			yStep = settings.ai.blockLength / (settings.ai.blockLengthCount - 1),
			xmodAfter = car.x + width / 2,
			ymodAfter = car.y + height / 2,
			angleCos = car.angleCos,
			angleSin = car.angleSin;
		for (var x = 0; x < xSteps; x++) {
			for (var y = 0; y < ySteps; y++) {
				var coords = [startX + x * xStep, startY + y * yStep];
				var xCoord = coords[0];
				
				coords[0] = coords[0] * angleCos - coords[1] * angleSin;
				coords[1] = xCoord * angleSin + coords[1] * angleCos;
				coords[0] = Math.round(coords[0] + xmodAfter);
				coords[1] = Math.round(coords[1] + ymodAfter);
				
				coords[0] = board.ensureCoordInRange(coords[0], board.width);
				coords[1] = board.ensureCoordInRange(coords[1], board.height);
				
				pixels.push(coords);
				nodes.push(board.board[coords[0]][coords[1]]);
			}
		}

		if (settings.debugging.drawVisionPixels) {
			neuralCarInstance.screen.drawPixels(pixels, "#65BEC9", true);
		}
		
		return nodes;
	};
};

SQUARIFIC.PlayerInput = function PlayerInput () {
	this.keysPressed = {};
	var prevents = [37, 38, 39, 40];
	this.inputs = {
		acceleration: 0,
		turning: 0
	};
	this.getInput = function getInput () {
		return this.inputs;
	};
	this.update = function update () {
		this.inputs.acceleration = 0;
		this.inputs.turning = 0;
		for (var key in this.keysPressed) {
			if (this.keysPressed.hasOwnProperty(key) && this.keysPressed[key]) {
				switch (parseInt(key)) {
					case 37:
						this.inputs.turning -= 1;
					break;
					case 38:
						this.inputs.acceleration += 1;
					break;
					case 39:
						this.inputs.turning += 1;
					break;
					case 40:
						this.inputs.acceleration -= 1;
					break;
				}
			}
		}
	};
	this.keydown = function keydown (event) {
		this.keysPressed[event.keyCode] = true;
		this.update();
		for (var k = 0; k < prevents.length; k++) {
			if (prevents[k] === event.keyCode) {
				event.preventDefault();
			}
		}
	};
	this.keyup = function keyup (event) {
		this.keysPressed[event.keyCode] = false;
		this.update();
	};
	document.addEventListener("keydown", this.keydown.bind(this));
	document.addEventListener("keyup", this.keyup.bind(this));
};

SQUARIFIC.Car = function Car (brain, settings) {
	this.score = 0;
	this.bestLength = 0;
	this.lastScore = 0;
	this.velocity = 0;
	this.maxAcceleration = settings.car.maxAcceleration;
	this.maxTurnAngle = settings.car.maxTurnAngle;
	this.maxSpeed = settings.car.maxSpeed;
	this.x = Math.random() * settings.boardWidth;
	this.y = Math.random() * settings.boardHeight;
	this.angle = Math.random() * 2 * Math.PI;
	this.angleCos = Math.cos(this.angle);
	this.angleSin = Math.sin(this.angle);
	this.color = settings.car.color || "red";
	
	this.image = document.createElement("canvas");
	this.image.width = settings.car.width;
	this.image.height = settings.car.length;
	
	this.brain = brain;
	
	this.step = function carStep (stepSize, board, cars) {
		var inputs = brain.getInput(this, board, cars);
		this.lastVelocity = this.velocity;
		
		if ((inputs.acceleration !== 1 && inputs.acceleration !== -1) && this.velocity !== 0) {
			if (this.velocity > 0) {
				inputs.acceleration = -.4;
				if (this.velocity + inputs.acceleration * this.maxAcceleration * stepSize < 0) {
					this.velocity = 0;
					inputs.acceleration = 0;
				}
			} else {
				inputs.acceleration = .4;
				if (this.velocity + inputs.acceleration * this.maxAcceleration * stepSize > 0) {
					this.velocity = 0;
					inputs.acceleration = 0;
				}
			}
		}
		
		this.velocity += inputs.acceleration * this.maxAcceleration * stepSize;
		
		this.angle += inputs.turning * this.maxTurnAngle * stepSize;
		this.angleCos = Math.cos(this.angle);
		this.angleSin = Math.sin(this.angle);
		
		var average = board.average(this.x, this.y, this.image.width, this.image.height, settings.car.averageWidth, settings.car.averageHeight, this, cars) * this.maxSpeed;
		if (this.velocity > average) {
			this.velocity = average;
		} else if (this.velocity < -average) {
			this.velocity = -average;
		}
		
		this.x += this.velocity * this.angleSin * stepSize;
		this.y -= this.velocity * this.angleCos * stepSize;
		
		this.x = board.ensureCoordInRange(this.x, board.width);
		this.y = board.ensureCoordInRange(this.y, board.height);

		this.score += this.velocity;
	};
	
	this.changeColor = function changeColor (color) {
		if (this.color !== color) {
			this.color = color;
			this.draw();
		}
	};
	
	this.draw = function carDraw () {
		var ctx = this.image.getContext("2d");
		
		ctx.beginPath();
		ctx.rect(0, 0, this.image.width, this.image.height);
		ctx.fillStyle = this.color;
		ctx.fill();

		ctx.beginPath();
		ctx.rect(0, 0, this.image.width / 4, Math.min(this.image.height / 8, 40));
		ctx.rect(this.image.width - this.image.width / 4, 0, this.image.width / 4, Math.min(this.image.height / 8, 40));
		ctx.fillStyle = "yellow";
		ctx.fill();
	};
	
	this.draw();
};

SQUARIFIC.CarCollection = function CarCollection (carArray, settings, neuralCarInstance) {
	carArray = carArray || [];
	settings.cars = settings.cars || 10;
	var startColor = [96, 190, 207];
	var endColor = [85, 55, 112];
	this.genNumber = 0;
	this.lastGenerationTime = Date.now();
	this.now = Date.now();
	this.startTime = Date.now();
	this.add = function addCar (car, training) {
		carArray.push(car);
		car.training = car.training || training;
		car.notPlayer = car.notPlayer || car.training || training;
	};
	this.step = function carCollectionStep (stepSize, board) {
		var carArrayCopy = [];
		this.now += stepSize;
		for (var k = 0; k < carArray.length; k++) {
			carArrayCopy.push(carArray[k]);
		}
		for (var k = 0; k < carArray.length; k++) {
			carArray[k].step(stepSize, board, carArrayCopy);
		}
		if (this.now - this.lastGenerationTime > settings.generationTime / neuralCarInstance.runSpeed) {
			this.newGeneration();
			this.lastGenerationTime = this.now;
		}
	};
	this.newGeneration = function newGeneration () {
		this.genNumber++;
		var topList = [];
		carArray.sort(function (a, b) {
			return b.score - a.score;
		});
		var uncount = 0, ignored = 0;
		for (var k = 0; k < carArray.length; k++) {
			if (!carArray[k].training || carArray[k].player) {
				uncount++;
			}
		}
		var keepInTop = Math.ceil((carArray.length - uncount) * settings.keepTop);
		for (var k = 0; k < carArray.length; k++) {
			if (!carArray[k].training || carArray[k].player) {
				ignored++;
				continue;
			}
			if (k - ignored < keepInTop) {
				carArray[k].lastScore = carArray[k].score;
				carArray[k].score = 0;
				carArray[k].bestLength++;
				var r = Math.round(startColor[0] + (endColor[0] - startColor[0]) * (carArray[k].bestLength / settings.retireAfterGenerations)),
					g = Math.round(startColor[1] + (endColor[1] - startColor[1]) * (carArray[k].bestLength / settings.retireAfterGenerations)),
					b = Math.round(startColor[2] + (endColor[2] - startColor[2]) * (carArray[k].bestLength / settings.retireAfterGenerations));
				carArray[k].changeColor("rgb(" + r + ", " + g + ", " + b + ")");
				if (carArray[k].bestLength > settings.retireAfterGenerations && carArray[k].lastScore !== 0) {
					carArray[k].training = false;
					carArray[k].changeColor("#752175");
				}
				topList.push(carArray[k]);
			} else {
				var net = topList[Math.floor(Math.random() * topList.length)].brain.getNetwork();
				carArray[k].brain.setNetwork(carArray[k].brain.mutate(net, settings.mutationRate));
				carArray[k].changeColor(settings.car.color);
				carArray[k].lastScore = carArray[k].score;
				carArray[k].score = 0;
				carArray[k].bestLength = 0;
			}
		}
		neuralCarInstance.console.log("Generation #" + this.genNumber + ", best score: " + Math.round(topList[0].lastScore * 100) / 100 + ", runtime: " + Math.round((this.now - this.startTime) / 1000) + " seconds");
	};
	this.bestCar = function bestCar () {
		var best;
		for (var k = 0; k < carArray.length; k++) {
			if ((typeof best !== "number" || carArray[best].score < carArray[k].score) && carArray[k].training) {
				best = k;
			}
		}
		return carArray[best];
	};
	this.removeWorst = function removeWorst () {
		var worst;
		for (var k = 0; k < carArray.length; k++) {
			if ((typeof worst !== "number" || carArray[worst].lastScore > carArray[k].lastScore) && carArray[k].training) {
				worst = k;
			}
		}
		if (typeof k === "number") {
			carArray.splice(k, 1);
		}
	};
	this.getCars = function getCars () {
		return carArray;
	};
	for (var k = 0; k < settings.cars; k++) {
		if (settings.useRegex) {
			this.add(new SQUARIFIC.Car(new SQUARIFIC.RegexBrain(undefined, settings, neuralCarInstance), settings), true);
		} else {
			this.add(new SQUARIFIC.Car(new SQUARIFIC.Brain(undefined, settings, neuralCarInstance), settings), true);
		}
	}
};

SQUARIFIC.Board = function Board (board, settings, neuralCarInstance) {
	function createBoard (settings) {
		var board = [];
		
		settings = settings || {};
		board.width = board.width || settings.boardWidth;
		board.height = board.height || settings.boardHeight;
		settings.car = settings.car || {};
		streetWidth = settings.car.width * settings.board.streetWidth || 60;
		
		for (var x = 0; x < board.width; x++) {
			for (var y = 0; y < board.height; y++) {
				board[x] = board[x] || {};
				if ((Math.floor(x / streetWidth) % 7) === 2 || (Math.floor(y / streetWidth) % 4) === 2) {
					board[x][y] = 1;
				} else {
					board[x][y] = 0.25; //grass
				}
			}
		}
		
		return board;
	}
	
	settings.board = settings.board || {};
	settings.board.colors = settings.board.colors || [{max: 0.5, r: 51, g: 133, b: 33}, {max: 1, r: 145, g: 140, b: 122}];
	
	if (typeof board !== "object") {
		board = createBoard(settings);
	}
	
	this.board = board;
	this.width = board.width || board.length;
	this.height = board.height || board[0].length;
	settings.boardWidth = this.width;
	settings.boardHeight = this.height;
	
	this.getXY = function getXY (x, y) {
		x = Math.abs(Math.round(x));
		y = Math.abs(Math.round(y));
		
		if (board[x]) {
			return board[x][y];
		}
		
		console.log("Unexisting x y requested: ", x, y);
		return 0;
	};
	
	this.average = function average (xA, yA, width, height, xSteps, ySteps, car, cars) {
		var pixels = [], collisions = 0;
		xSteps = xSteps || 2;
		ySteps = ySteps || 2;
		var xStep = width / (xSteps - 1);
		var yStep = height / (ySteps - 1);
		var angleCos = car.angleCos;
		var angleSin = car.angleSin;
		var sum = 0;
		var xmodBefore = width / 2,
			ymodBefore = height / 2;
		var xmodAfter = xA + width / 2,
			ymodAfter = yA + height / 2;
		for (var x = 0; x < xSteps; x++) {
			for (var y = 0; y < ySteps; y++) {
				var coords = [x * xStep - xmodBefore, y * yStep - ymodBefore];
				var xCoord = coords[0];
				
				coords[0] = coords[0] * angleCos - coords[1] * angleSin;
				coords[1] = xCoord * angleSin + coords[1] * angleCos;
				coords[0] = Math.round(coords[0] + xmodAfter);
				coords[1] = Math.round(coords[1] + ymodAfter);
				
				coords[0] = this.ensureCoordInRange(coords[0], this.width);
				coords[1] = this.ensureCoordInRange(coords[1], this.height);
				
				pixels.push(coords);
				sum += board[coords[0]][coords[1]];
			}
		}
		if (settings.debugging.drawAveragePixels) {
			neuralCarInstance.screen.drawPixels(pixels);
		}
		
		if (settings.collision) {
			var xmodbef = width / 2;
			var ymodbef = height / 2;
			var xmod = xA + xmodbef;
			var ymod = yA + ymodbef;
			var carPolygon = new SAT.Polygon(new SAT.V(0, 0), [
				new SAT.V((angleCos * -xmodbef) - (angleSin * -ymodbef) + xmod, (angleSin * -xmodbef) + (angleCos * -ymodbef) + ymod),
				new SAT.V((angleCos *  xmodbef) - (angleSin * -ymodbef) + xmod, (angleSin *  xmodbef) + (angleCos * -ymodbef) + ymod), 
				new SAT.V((angleCos *  xmodbef) - (angleSin *  ymodbef) + xmod, (angleSin *  xmodbef) + (angleCos *  ymodbef) + ymod),
				new SAT.V((angleCos * -xmodbef) - (angleSin *  ymodbef) + xmod, (angleSin * -xmodbef) + (angleCos *  ymodbef) + ymod)
			]);
			var carslength = cars.length;
			for (var k = 0; k < carslength; k++) {
				var angleCos = cars[k].angleCos;
				var angleSin = cars[k].angleSin;
				var xmodbef = cars[k].image.width / 2;
				var ymodbef = cars[k].image.height / 2;
				var xmod = cars[k].x + xmodbef;
				var ymod = cars[k].y + ymodbef;
				if (cars[k] !== car && SAT.testPolygonPolygon(carPolygon, new SAT.Polygon(new SAT.V(0, 0), [
					new SAT.V((angleCos * -xmodbef) - (angleSin * -ymodbef) + xmod, (angleSin * -xmodbef) + (angleCos * -ymodbef) + ymod),
					new SAT.V((angleCos *  xmodbef) - (angleSin * -ymodbef) + xmod, (angleSin *  xmodbef) + (angleCos * -ymodbef) + ymod), 
					new SAT.V((angleCos *  xmodbef) - (angleSin *  ymodbef) + xmod, (angleSin *  xmodbef) + (angleCos *  ymodbef) + ymod),
					new SAT.V((angleCos * -xmodbef) - (angleSin *  ymodbef) + xmod, (angleSin * -xmodbef) + (angleCos *  ymodbef) + ymod)
				]))) {
					collisions++;
					if (collisions > 2) {
						break;
					}
				}
			}
		}
		
		return sum / (collisions * 2 + 1) / (xSteps * ySteps);
	};
	
	this.ensureCoordInRange = function (c, r) {
		if (c < 0 || c >= r) {
			if (c > 0) {
				c -= Math.floor(c / r) * r;
			} else {
				c -= Math.ceil(c / r) * r;
				c = r + c;
			}
		}
		return c;
	};
	
	this.numberToRGB = function numberToRGB (number) {
		for (var key = 0; key < settings.board.colors.length; key++) {
			if (settings.board.colors[key].max >= number) {
				return settings.board.colors[key];
			}
		}
		return {r: 0, g: 0, b: 0};
	};
};

SQUARIFIC.Screen = function Screen (backCanvas, frontCanvas) {
	var backCanvasCtx = backCanvas.getContext("2d"),
		frontCanvasCtx = frontCanvas.getContext("2d");
	var clearFrontOnNextChange = false;
	this.clearFrontOnNextChange = function () {
		clearFrontOnNextChange = true;
	};
	this.drawPixels = function (pixels, color, foreground) {
		var ctx = frontCanvasCtx;
		if (clearFrontOnNextChange && foreground) {
			frontCanvasCtx.clearRect(0, 0, frontCanvas.width, frontCanvas.height);
			clearFrontOnNextChange = false;
		}
		if (!foreground) {
			ctx = backCanvasCtx;
		}
		ctx.beginPath();
		for (var k = 0; k < pixels.length; k++) {
			ctx.rect(pixels[k][0], pixels[k][1], 1, 1);
		}
		ctx.fillStyle = color || "black";
		ctx.fill();
	};
	this.drawCars = function (carArray) {
		if (clearFrontOnNextChange) {
			frontCanvasCtx.clearRect(0, 0, frontCanvas.width, frontCanvas.height);
			clearFrontOnNextChange = false;
		}
		for (var k = 0; k < carArray.length; k++) {
			this.drawCar(frontCanvasCtx, carArray[k]);
		}
	};
	this.drawCar = function (ctx, car) {
		ctx.translate(car.x + car.image.width / 2, car.y + car.image.height / 2);
		ctx.rotate(car.angle);
		ctx.drawImage(car.image, -car.image.width / 2, -car.image.height / 2);
		ctx.rotate(-car.angle);
		ctx.translate(- car.x - car.image.width / 2, - car.y - car.image.height / 2);
	}
	this.drawBackground = function (board) {
		backCanvas.width = board.width;
		backCanvas.height = board.height;
		frontCanvas.width = board.width;
		frontCanvas.height = board.height;
		var backCanvasImageData = backCanvasCtx.getImageData(0, 0, backCanvas.width, backCanvas.height);
		var width = board.width;
		var height = board.height;
		for (var y = 0; y < height; y++) {
			for (var x = 0; x < width; x++) {
				var k = 4 * y * width + 4 * x;
				var rgb = board.numberToRGB(board.board[x][y]);
				backCanvasImageData.data[k] = rgb.r;
				backCanvasImageData.data[k + 1] = rgb.g;
				backCanvasImageData.data[k + 2] = rgb.b;
				backCanvasImageData.data[k + 3] = 255;
			}
		}
		backCanvasCtx.putImageData(backCanvasImageData, 0, 0);
	};
};

SQUARIFIC.Console = function Console (element) {
	this.log = function log (m) {
		console.log(m);
		var div = document.createElement("div");
		div.className = "console-message";
		div.appendChild(document.createTextNode(m));
		element.appendChild(div);
		element.scrollTop = 2147483647;
	};
};