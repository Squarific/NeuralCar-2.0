var SQUARIFIC = SQUARIFIC || {};

SQUARIFIC.neuralCarRoadBoardToPixelBoard = function (board) {
	var returnBoard = {};
	returnBoard.board = [];
	board.width = board.width || 500;
	board.height = board.height || 500;
	returnBoard.width = board.width;
	returnBoard.height = board.height;
	returnBoard.colors = board.colors;
	returnBoard.numberToRGB = function (number) {
		for (var key = 0; key < this.colors.length; key++) {
			if (this.colors[key].max >= number) {
				return this.colors[key];
			}
		}
		return {r: 0, g: 0, b: 0};
	};
	
	function onLine (c, a, b, distance) {
		var ma = (a[1] - b[1]) / (a[0] - b[0]),
			mb = -1 / ma,
			crossX = (ma * a[0] - mb * c[0] - a[1] + c[1]) / (ma - mb),
			crossY;
		if (crossX >= Math.min(a[0], b[0]) && crossX <= Math.max(a[0], b[0])) {
			crossY = ma * crossX - ma * a[0] + a[1];
		} else {
			if (crossX > a[0] && crossX > b[0]) {
				if (a[0] > b[0]) {
					crossX = a[0];
					crossY = a[1];
				} else {
					crossX = b[0];
					crossY = b[1];
				}
			} else {
				if (a[0] < b[0]) {
					crossX = a[0];
					crossY = a[1];
				} else {
					crossX = b[0];
					crossY = b[1];
				}
			}
		}
		var d = Math.sqrt((crossX - c[0]) * (crossX - c[0]) + (crossY - c[1]) * (crossY - c[1]));
		return d <= distance;
	};
	
	for (var x = 0; x < board.width; x++) {
		returnBoard.board[x] = [];
		for (var y = 0; y < board.height; y++) {
			returnBoard.board[x][y] = 0.25;
			for (var key = 0; key < board.length; key++) {
				if (onLine([x, y], board[key][0], board[key][1], parseInt(board[key][2]))) {
					returnBoard.board[x][y] = 1;
					break;
				}
			}
		}
	}
	
	return returnBoard;
};