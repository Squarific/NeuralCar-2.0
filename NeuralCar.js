var SQUARIFIC = SQUARIFIC || {};

SQUARIFIC.NeuralCar = function NeuralCar (backCanvas, frontCanvas, settings, board) {
	settings = settings || {};
	settings.ai = settings.ai || {};
	settings.car = settings.car || {};
	settings.brain = settings.brain || {};
	settings.board = settings.board || {};
	settings.debugging = settings.debugging || {};
	
	settings.cars = settings.cars || 85;
	settings.stepSize = settings.stepSize || 1000 / 20;
	settings.generationTime = settings.generationTime || 12 * 1000;
	settings.mutationRate = settings.mutationRate || 1.37;
	settings.boardWidth = settings.boardWidth || 1200;
	settings.boardHeight = settings.boardHeight || 600;
	settings.retireAfterGenerations = settings.retireAfterGenerations || 9;
	settings.minimumMutation = settings.minimumMutation || 0.01;
	
	settings.car.width = settings.car.width || 10;
	settings.car.length = settings.car.length || 20;
	settings.car.color = settings.car.color || "red";
	settings.car.maxSpeed = settings.car.maxSpeed || 0.075;
	settings.car.maxAcceleration = settings.maxAcceleration || 0.00004;
	settings.car.maxTurnAngle = settings.car.maxTurnAngle || Math.PI / 1800;
	settings.car.averageWidth = settings.car.averageWidth || 2;
	settings.car.averageHeight = settings.car.averageHeight || 4;
	
	settings.ai.type = settings.ai.type || "blockVision";
	settings.ai.blockLength = settings.ai.blockLength || 80;
	settings.ai.blockLengthCount = settings.ai.blockLengthCount || 8;
	settings.ai.blockWidth = settings.ai.blockWidth || 60;
	settings.ai.blockWidthCount = settings.ai.blockWidthCount || 6;
	settings.ai.front =  settings.ai.front || 3/4;
	settings.ai.side = settings.ai.side || 1/2;
	
	settings.board.streetWidth = 4.5;

	settings.brain.inputStructure = settings.brain.inputStructure || 24;
	settings.brain.structure = settings.brain.structure || [26];
	settings.brain.structure.push(2);
	
	this.runSpeed = 1;
	
	this.console = new SQUARIFIC.Console();
	this.board = new SQUARIFIC.Board(board, settings, this);
	this.carCollection = new SQUARIFIC.CarCollection([], settings, this);
	this.screen = new SQUARIFIC.Screen(backCanvas, frontCanvas);
	
	this.screen.drawBackground(this.board);
	
	var playerCar = new SQUARIFIC.Car(new SQUARIFIC.PlayerInput(), settings);
	playerCar.changeColor("brown");
	this.carCollection.add(playerCar);
	
	this.lastUpdate = Date.now();
	this.step = function neuralCarStep (stepSize) {
		var changed = false;
		this.screen.clearFrontOnNextChange();
		var timeDifference = (Date.now() - this.lastUpdate) * this.runSpeed;
		while (timeDifference - stepSize > 0) {
			changed = true;
			this.carCollection.step(stepSize, this.board);
			timeDifference -= stepSize;
			this.lastUpdate += (stepSize / this.runSpeed);
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

SQUARIFIC.Brain = function Brain (network, settings, neuralCarInstance) {
	function createNetwork (settings) {
		var net = [];
		for (var k = 0; k < settings.brain.structure.length; k++) {
			net[k] = [];
			for (var i = 0; i < settings.brain.structure[k]; i++) {
				var sign = Math.random() < 0.5 ? -1 : 1;
				net[k][i] = {
					bias: sign * Math.random(),
					weights: []
				};
				if (typeof settings.brain.structure[k - 1] === "number") {
					var weights = settings.brain.structure[k - 1];
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
				if (network[k][i].bias === 0) {
					network[k][i].bias = Math.random();
				}
				network[k][i].bias += Math.max(network[k][i].bias, settings.minimumMutation) * sign * Math.random() * rate;
				for (var l = 0; l < network[k][i].weights.length; l++) {
					sign = Math.random() < 0.5 ? -1 : 1;
					network[k][i].weights[l] += Math.max(network[k][i].weights[l], settings.minimumMutation) * sign * Math.random() * rate;
				}
			}
		}
		return network;
	};
	this.getInput = function getInput (car, board) {
		var inputNodes = this[settings.ai.type](car, board);
		for (var k = 0; k < network.length; k++) {
			var outputs = [];
			for (var i = 0; i < network[k].length; i++) {
				var sum = network[k][i].bias;
				for (var l = 0; l < network[k][i].weights.length; l++) {
					sum += network[k][i].weights[l] * inputNodes[l];
				}
				outputs[i] = 1 / (1 + Math.exp(-sum));
			}
			inputNodes = outputs;
		}
		
		if (inputNodes[0] > 0.66) {
			inputNodes.acceleration = 1;
		} else if (inputNodes[0] < 0.33) {
			inputNodes.acceleration = -1;
		} else {
			inputNodes.acceleration = 0;
		}
		
		if (inputNodes[1] > 0.66) {
			inputNodes.turning = 1;
		} else if (inputNodes[1] < 0.33) {
			inputNodes.turning = -1;
		} else {
			inputNodes.turning = 0;
		}
		
		return inputNodes;
	};
	this.blockVision = function blockVision (car, board) {
		var nodes = [];
		var pixels = [];
		var	width = car.image.width,
			height = car.image.height,
			startX = width / 2 - settings.ai.side * settings.ai.blockWidth,
			startY = -settings.ai.front * settings.ai.blockLength,
			xSteps = settings.ai.blockWidthCount,
			ySteps = settings.ai.blockLengthCount,
			xStep = settings.ai.blockWidth / (settings.ai.blockWidthCount - 1),
			yStep = settings.ai.blockLength / (settings.ai.blockLengthCount - 1),
			angleCos = Math.cos(car.angle),
			angleSin = Math.sin(car.angle);
		for (var x = 0; x < xSteps; x++) {
			for (var y = 0; y < ySteps; y++) {
				var coords = [startX + x * xStep - width / 2, startY + y * yStep - height / 2];
				var xCoord = coords[0];
				
				coords[0] = coords[0] * angleCos - coords[1] * angleSin;
				coords[1] = xCoord * angleSin + coords[1] * angleCos;
				coords[0] = Math.round(coords[0] + car.x + width / 2);
				coords[1] = Math.round(coords[1] + car.y + height / 2);
				
				coords[0] = board.ensureCoordInRange(coords[0], board.width);
				coords[1] = board.ensureCoordInRange(coords[1], board.height);
				
				pixels.push(coords);
				try {
					nodes.push(board.board[coords[0]][coords[1]]);
				} catch (e) {
					console.log("Vision error", coords[0], coords[1]);
				}
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
		event.preventDefault();
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
	this.color = settings.car.color || "red";
	
	this.image = document.createElement("canvas");
	this.image.width = settings.car.width;
	this.image.height = settings.car.length;
	
	this.brain = brain;
	
	this.step = function carStep (stepSize, board) {
		var inputs = brain.getInput(this, board);
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
		
		var average = board.average(this.x, this.y, this.angle, this.image.width, this.image.height, settings.car.averageWidth, settings.car.averageHeight);
		if (Math.abs(this.velocity) > average * this.maxSpeed) {
			this.velocity = (this.velocity / Math.abs(this.velocity)) * average * this.maxSpeed;
		}
		
		this.x += this.velocity * Math.sin(this.angle) * stepSize;
		this.y -= this.velocity * Math.cos(this.angle) * stepSize;
		
		this.x = board.ensureCoordInRange(this.x, board.width);
		this.y = board.ensureCoordInRange(this.y, board.height);

		this.score += this.velocity;
	};
	
	this.changeColor = function changeColor (color) {
		this.color = color;
		this.draw();
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
	this.genNumber = 0;
	this.lastGenerationTime = Date.now();
	this.startTime = Date.now();
	this.add = function addCar (car, training) {
		carArray.push(car);
		car.training = car.training || training;
		car.notPlayer = car.notPlayer || car.training || training;
	};
	this.step = function carCollectionStep (stepSize, board) {
		for (var k = 0; k < carArray.length; k++) {
			carArray[k].step(stepSize, board);
		}
		if (Date.now() - this.lastGenerationTime > settings.generationTime / neuralCarInstance.runSpeed) {
			this.newGeneration();
			this.lastGenerationTime = Date.now();
		}
	};
	this.newGeneration = function newGeneration () {
		var best = this.bestCar();
		if (!best) {
			return;
		}
		var net = best.brain.getNetwork();
		this.genNumber++;
		for (var k = 0; k < carArray.length; k++) {
			if (carArray[k].training && carArray[k].score < best.score) {
				carArray[k].brain.setNetwork(carArray[k].brain.mutate(net, settings.mutationRate));
				carArray[k].changeColor("red");
				carArray[k].lastScore = carArray[k].score;
				carArray[k].score = 0;
				carArray[k].bestLength = 0;
			}
		}
		for (var k = 0; k < carArray.length; k++) {
			if (carArray[k].training && carArray[k].score !== 0) {
				carArray[k].lastScore = carArray[k].score;
				carArray[k].score = 0;
				carArray[k].changeColor("blue");
				carArray[k].bestLength++;
				if (carArray[k].bestLength > settings.retireAfterGenerations && carArray[k].lastScore !== 0) {
					carArray[k].training = false;
					carArray[k].changeColor("#752175");
				}
			}
		}
		neuralCarInstance.console.log("Generation #" + this.genNumber + ", best score: " + best.lastScore + ", runtime: " + Math.round((Date.now() - this.startTime) / 10) / 100 + " seconds");
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
		this.add(new SQUARIFIC.Car(new SQUARIFIC.Brain(undefined, settings, neuralCarInstance), settings), true);
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
		
		settings.board = settings.board || {};
		settings.board.colors = settings.board.colors || [{max: 0.5, r: 51, g: 133, b: 33}, {max: 1, r: 145, g: 140, b: 122}];
		
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
	
	this.average = function average (xA, yA, angle, width, height, xSteps, ySteps, debug) {
		var pixels = [];
		if (debug) {
			console.log("debug");
		}
		xSteps = Math.round(Math.abs(xSteps)) || 2;
		ySteps = Math.round(Math.abs(ySteps)) || 2;
		var xStep = Math.abs(width) / (xSteps - 1);
		var yStep = Math.abs(height) / (ySteps - 1);
		var angleCos = Math.cos(angle);
		var angleSin = Math.sin(angle);
		var sum = 0;
		for (var x = 0; x < xSteps; x++) {
			for (var y = 0; y < ySteps; y++) {
				var coords = [x * xStep - width / 2, y * yStep - height / 2];
				var xCoord = coords[0];
				
				coords[0] = coords[0] * angleCos - coords[1] * angleSin;
				coords[1] = xCoord * angleSin + coords[1] * angleCos;
				coords[0] = Math.round(coords[0] + xA + width / 2);
				coords[1] = Math.round(coords[1] + yA + height / 2);
				
				coords[0] = this.ensureCoordInRange(coords[0], this.width);
				coords[1] = this.ensureCoordInRange(coords[1], this.height);
				
				pixels.push(coords);
				try {
					sum += board[coords[0]][coords[1]];
				} catch (e) {
					console.log(coords[0], coords[1]);
				}
			}
		}
		if (debug) {
			return pixels;
		}
		if (settings.debugging.drawAveragePixels) {
			neuralCarInstance.screen.drawPixels(pixels);
		}
		return sum / (xSteps * ySteps);
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
			frontCanvasCtx.translate(carArray[k].x + carArray[k].image.width / 2, carArray[k].y + carArray[k].image.height / 2);
			frontCanvasCtx.rotate(carArray[k].angle);
			frontCanvasCtx.drawImage(carArray[k].image, -carArray[k].image.width / 2, -carArray[k].image.height / 2);
			frontCanvasCtx.rotate(-carArray[k].angle);
			frontCanvasCtx.translate(- carArray[k].x - carArray[k].image.width / 2, - carArray[k].y - carArray[k].image.height / 2);
		}
	};
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
	};
};