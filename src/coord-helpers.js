export function eq(coord1, coord2) {
	return coord1.x === coord2.x && coord1.y === coord2.y;
}

export function forEachCell(level, callback) {
	level.forEach((row, rowIndex) => {
		row.forEach((cell, cellIndex) => {
			callback(cell, cellIndex, rowIndex);
		});
	});
}
