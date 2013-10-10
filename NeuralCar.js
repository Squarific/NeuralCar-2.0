SQUARIFIC = SQUARIFIC || {};

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
	
	this.add = function addCar () {
		
	};
	this.step = function carCollectionStep (stepSize, board) {
		for (var k = 0; k < carArray.length; k++) {
			carArray[k].step(stepSize, board);
		}
	};
	this.removeWorst = function removeWorst () {
		
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
		board.width = settings.boardWidth || 800;
		board.height = settings.boardHeight || 400;
		settings.car = settings.car || {};
		streetWidth = settings.car.width * 3 || 60;
		
		for (var x = 0; x < width; x++) {
			for (var y = 0; y < height; y++) {
				board[x] = board[x] || {};
				if (Math.round(x / streetWidth) % 3 || Math.round(y / streetWidth) % 3) {
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
	
	this.getXY = function getXY (x, y) {
		x = Math.abs(Math.round(x));
		y = Math.abs(Math.round(y));
		
		if (board[x]) {
			return board[x][y];
		}
		
		console.log("Unexisting x y requested: ", x, y);
		return 0;
	};
};

SQUARIFIC.Screen = function Screen (backCanvas, frontCanvas) {
	this.drawCars = function (carCollection) {
		
	};
	this.drawBackground = function (board) {
		
	};
};

SQUARIFIC.Gui = function Gui (element) {
	this.message = function message (m) {
	};
};