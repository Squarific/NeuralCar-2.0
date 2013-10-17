var SQUARIFIC = SQUARIFIC || {};

SQUARIFIC.NeuralCarMapEditor = function (canvas, settings) {
	var board = [];
	canvas.width = settings.width;
	canvas.height = settings.height;
	board.width = settings.width;
	board.height = settings.height;
	board.colors = [{max: 0.5, r: 51, g: 133, b: 33}, {max: 1, r: 145, g: 140, b: 122}];
	this.size = settings.streetSize || 10;
	this.screen = new SQUARIFIC.Screen(canvas, canvas);
	this.board = board;
	
	canvas.addEventListener("click", function (event) {
		if (this.road) {
			if (this.road[0] === event.clientX && this.road[1] === event.clientY) {
				this.road[0]--;
				this.road[1]--;
			}
			var k = board.push([this.road, [event.clientX, event.clientY], this.size]);
			console.log(board[k - 1]);
			delete this.road;
			this.redraw();
		} else {
			this.road = [event.clientX, event.clientY];
			console.log(this.road)
		}
	}.bind(this));
	
	this.redraw = function () {
		this.screen.drawBackground(SQUARIFIC.neuralCarRoadBoardToPixelBoard(board));
	};
	
	this.redraw();
};