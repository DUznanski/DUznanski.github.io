function row_key(pile) {
	var voltorbs = 0;
	var points = 0;
	for (var k = 0; k < pile.length; k++) {
		if (pile[k] == 0) {
			voltorbs += 1;
		} else {
			points += pile[k];
		}
	}
	return `${points}/${voltorbs}`;
}

function visit_tuples(lengths, visit) {
	var pile = [];
	for (var k = 0; k < lengths.length; k++) {
		pile.push(0);
	}
	while (true) {
		visit(pile);
		var j = pile.length - 1;
		while (pile[j] + 1 == lengths[j]) {
			pile[j] = 0;
			j -= 1;
			if (j == -1) {
				return;
			}
		}
		pile[j] += 1;
	}
}

function bake_rows() {
	var lengths = [4,4,4,4,4];
	row_layouts = {};
	visit_tuples(lengths, function(pile) {
		var cloned_pile = pile.slice(0);
		var key = row_key(pile);
		if (!(key in row_layouts)) {
			row_layouts[key] = [];
		}
		row_layouts[key].push(cloned_pile);
	});
}

bake_rows();

function find_boards(rows, cols) {
	var row_piles = [];
	var row_lengths = [];
	// collect the possible piles of rows.
	for (var k = 0; k < rows.length; k++) {
		row_piles.push(row_layouts[rows[k]]);
		row_lengths.push(row_piles[k].length);
	}
	var boards = [];
	// build a board based on the rows
	visit_tuples(row_lengths, function(pile) {
		var board = [];
		for (var k = 0; k < pile.length; k++) {
			board.push(row_piles[k][pile[k]]);
		}

		// check to see if this board matches the column clues.
		var valid_board = true;
		for (var k = 0; k < board[0].length; k++) {
			var col = [];
			for (var j = 0; j < board.length; j++) {
				col.push(board[j][k])
			}
			if (row_key(col) != cols[k]) {
				valid_board = false;
				break;
			}
		}
		if (valid_board) {
			boards.push(board);
		}
	});
	return boards;
}

function board_stats(boards) {
	var stats = [];
	for (var k = 0; k < 5; k++) {
		var row = [];
		stats.push(row);
		for (var j = 0; j < 5; j++) {
			var cell = [];
			row.push(cell);
			for (var i = 0; i < 4; i++) {
				cell.push(0);
			}
		}
	}
	for (var b = 0; b < boards.length; b++) {
		var board = boards[b];
		for (var k = 0; k < 5; k++) {
			for (var j = 0; j < 5; j++) {
				stats[k][j][board[k][j]] += 1;
			}
		}
	}
	// normalize
	for (var k = 0; k < 5; k++) {
		for (var j = 0; j < 5; j++) {
			for (var i = 0; i < 4; i++) {
				stats[k][j][i] /= boards.length;
			}
		}
	}
	return stats;
}

function filter_by_cell(boards, row, col, val) {
	var new_boards = [];
	for (var b = 0; b < boards.length; b++) {
		if (boards[b][row][col] == val) {
			new_boards.push(boards[b]);
		}
	}
	return new_boards;
}

function fill_stats(stats) {

	var lowest_risk = 1;
	for (var k = 0; k < 5; k++) {
		for (var j = 0; j < 5; j++) {
			var found = false;
			for (var i = 0; i < 4; i++) {
				var stat = stats[k][j][i];
				if (stat == 1) {
					$(`#cell-${k}-${j}`).addClass('found').addClass(`found-${i}`);
					found = true;
				}
				var stat_string = stat.toFixed(3);
				$(`#p-${k}-${j}-${i}`).text(stat_string);
			}
			if (!found) {
				var risk = stats[k][j][0];
				if (risk < lowest_risk) {
					$('.safe').removeClass('safe');
					lowest_risk = risk;
					$(`#cell-${k}-${j}`).addClass('safe');
				} else if (risk == lowest_risk) {
					$(`#cell-${k}-${j}`).addClass('safe');
				}
			}
		}
	}
}

function read_clues() {
	var rows = [];
	var cols = [];
	for (var k = 0; k < 5; k++) {
		var row_voltorbs = $(`#voltorbs-r-${k}`).val();
		var row_score = $(`#score-r-${k}`).val();
		var row_key = `${row_score}/${row_voltorbs}`;
		rows.push(row_key);
		var col_voltorbs = $(`#voltorbs-c-${k}`).val();
		var col_score = $(`#score-c-${k}`).val();
		var col_key = `${col_score}/${col_voltorbs}`;
		cols.push(col_key);
	}
	return [rows, cols];
}

function create_board() {
	var clues = read_clues();
	current_boards = find_boards(clues[0], clues[1]);
	fill_stats(board_stats(current_boards));
}

function fix_cell(ev) {
	var cell = ev.currentTarget;
	var cell_id = cell.id;
	var row = cell_id[7];
	var col = cell_id[9];
	var val = cell_id[11];
	current_boards = filter_by_cell(current_boards, row, col, val);
	fill_stats(board_stats(current_boards));
}

$(function() {
	$('#go').click(create_board);
	$('#go').click();
	$('td td').click(fix_cell);
});
