{	/* Constants */
	
	// Defensive alert states
	NONE = 10;
	LOW = 11;
	MEDIUM = 12;
    HIGH = 13;    
}

isPulse_Short = function () {
	return _.get(Memory, ["hive", "pulses", "main", "active"], true);
};

isPulse_Mid = function () {
	return _.get(Memory, ["hive", "pulses", "mid", "active"], true);
};

isPulse_Spawn = function () {
	return _.get(Memory, ["hive", "pulses", "spawn", "active"], true);
};

isPulse_Lab = function () {
	return _.get(Memory, ["hive", "pulses", "lab", "active"], true);
};


getReagents = function (mineral) {
	for (let r1 in REACTIONS) {
		for (let r2 in REACTIONS[r1]) {
			if (REACTIONS[r1][r2] == mineral) {
				return [r1, r2];
			}
		}
	}
};


Math.clamp = function (number, lower, upper) {
	return Math.max(lower, Math.min(number, upper));
};
