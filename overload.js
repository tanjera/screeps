getReagents = function getReagents(mineral) {
	for (let r1 in REACTIONS) {
		for (let r2 in REACTIONS[r1]) {
			if (REACTIONS[r1][r2] == mineral) {
				return [r1, r2];
			}
		}
	}
};