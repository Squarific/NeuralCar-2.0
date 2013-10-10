var SQUARIFIC = SQUARIFIC || {};

SQUARIFIC.NeuralCar = function NeuralCar (backCanvas, frontCanvas, settings, board) {
	settings = settings || {};
	settings.car = settings.car || {};
	settings.brain = settings.brain || {};
	
	settings.cars = settings.cars || 10;
	settings.stepSize = settings.stepSize || 1000 / 60;
	settings.generationTime = settings.generationTime || 10 * 1000;
	
	settings.car.width = settings.car.width || 10;
	settings.car.length = settings.car.length || 20;
	settings.car.color = settings.car.color || "red";
	
	settings.brain.structure = settings.brain.structure || [13];
	
	this.board = new SQUARIFIC.Board(board, settings);
	this.trainer = new SQUARIFIC.CarCollection([], settings);
	this.screen = new SQUARIFIC.Screen(backCanvas, frontCanvas);
	
	this.screen.drawBackground(this.board);
	this.step = function neuralCarStep (stepSize) {
		requestAnimationFrame(this.step);
	}.bind(this, settings.stepSize);
	requestAnimationFrame(this.step);
};

SQUARIFIC.Brain = function Brain (network, settings) {
	function createNetwork () {
		
	}
	if (typeof network !== "object") {
		network = createNetwork(settings);
	}
	this.getNetwork = function getNetwork () {
		return network;
	};
	this.mutate = function mutate (network, rate) {
		
	};
};

SQUARIFIC.Car = function Car (brain, settings) {
	this.score = 0;
	this.lastScore = 0;
	this.velocity = 0;
	this.acceleration = 0;
	this.x = Math.random() * settings.boardWidth;
	this.y = Math.random() * settings.boardHeight;
	this.directionX = 0;
	this.directionY = 0;
	this.color = settings.car.color || "red";
	
	this.image = document.createElement("canvas");
	this.image.width = settings.car.width;
	this.image.height = settings.car.length;
	
	this.step = function carStep (stepSize, board) {
		
	};
	
	this.changeColor = function changeColor (color) {
		this.color = color;
	};
	
	this.draw = function carDraw () {
		var ctx = this.image.getContext("2d");
		
		ctx.beginPath();
		ctx.drawRect(0, 0, settings.car.width, settings.car.height);
		ctx.fillStyle = this.color;
		ctx.fill();
		
		ctx.beginPath();
		ctx.drawRect(0, 0, settings.car.width / 4, Math.min(settings.car.height / 8, 40));
		ctx.drawRect(settings.car.width - settings.car.width / 4, 0, settings.car.width / 4, Math.min(settings.car.height / 8, 40));
		ctx.fillStyle = "yellow";
		ctx.fill();
	};
};

SQUARIFIC.CarCollection = function CarCollection (carArray, settings) {
	carArray = carArray || [];
	settings.cars = settings.cars || 10;
	this.add = function addCar (car) {
		carArray.push(car);
	};
	this.step = function carCollectionStep (stepSize, board) {
		for (var k = 0; k < carArray.length; k++) {
			carArray[k].step(stepSize, board);
		}
	};
	this.removeWorst = function removeWorst () {
		var worst;
		for (var k = 0; k < carArray.length; k++) {
			if (typeof worst !== "number" || carArray[worst].lastScore > carArray[k].lastScore) {
				worst = k;
			}
		}
		carArray.splice(k, 1);
	};
	this.getCars = function getCars () {
		return carArray;
	};
	for (var k = 0; k < settings.cars; k++) {
		carArray.push(new SQUARIFIC.Car(new SQUARIFIC.Brain(undefined, settings), settings));
	}
};

SQUARIFIC.Board = function Board (board, settings) {
	function createBoard (settings) {
		var board = [];
		
		settings = settings || {};
		board.width = board.width ||settings.boardWidth || 800;
		board.height = board.height || settings.boardHeight || 400;
		settings.car = settings.car || {};
		streetWidth = settings.car.width * 3 || 60;
		
		settings.board = settings.board || {};
		settings.board.colors = settings.board.colors || [{max: 0.3, r: 51, g: 133, b: 33}, {max: 1, r: 145, g: 140, b: 122}];
		
		for (var x = 0; x < board.width; x++) {
			for (var y = 0; y < board.height; y++) {
				board[x] = board[x] || {};
				if ((Math.floor(x / streetWidth) % 7) === 2 || (Math.floor(y / streetWidth) % 4) === 2) {
					board[x][y] = 1;
				} else {
					board[x][y] = 0.2;
				}
			}
		}
		
		return board;
	}
	
	if (typeof board !== "object") {
		board = createBoard(settings);
	}
	
	this.board = board;
	this.width = board.width || board.length || settings.boardWidth;
	this.height = board.height || board[0].length || settings.boardHeight;
	
	this.getXY = function getXY (x, y) {
		x = Math.abs(Math.round(x));
		y = Math.abs(Math.round(y));
		
		if (board[x]) {
			return board[x][y];
		}
		
		console.log("Unexisting x y requested: ", x, y);
		return 0;
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
	var backCanvasCtx = backCanvas.getContext("2d");
		//frontCanvasCtx = frontCanvas.getContext("2d");
	this.drawCars = function (carCollection) {
		
	};
	this.drawBackground = function (board) {
		backCanvas.width = board.width;
		backCanvas.height = board.height;
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

SQUARIFIC.Gui = function Gui (element) {
	this.message = function message (m) {
	};
};