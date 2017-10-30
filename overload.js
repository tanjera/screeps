{	/* Constants */
	
	// Defensive alert states
	NONE = 10;
	LOW = 11;
	MEDIUM = 12;
	HIGH = 13;
	
	// Energy level states
	CRITICAL = 10;
	LOW = 11;
	NORMAL = 12;
    EXCESS = 13;
}

hasCPU = function () {
	return Game.cpu.getUsed() < Game.cpu.limit;
};

isPulse_Defense = function () {
	return _.get(Memory, ["hive", "pulses", "defense", "active"], true);
};

isPulse_Short = function () {
	return _.get(Memory, ["hive", "pulses", "short", "active"], true);
};

isPulse_Mid = function () {
	return _.get(Memory, ["hive", "pulses", "mid", "active"], true);
};

isPulse_Long = function () {
	return _.get(Memory, ["hive", "pulses", "long", "active"], true);
};

isPulse_Spawn = function () {
	return _.get(Memory, ["hive", "pulses", "spawn", "active"], true);
};

isPulse_Lab = function () {
	return _.get(Memory, ["hive", "pulses", "lab", "active"], true);
};

isPulse_Blueprint = function () {
	return _.get(Memory, ["hive", "pulses", "blueprint", "active"], true);
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

Math.lerp = function (v1, v2, t) {
	t = Math.clamp(t, 0, 1);
	return v1 + (v2 - v1) * t;
};

Math.lerpSpawnPriority = function(lowPriority, highPriority, popActual, popTarget) {
	return Math.floor(Math.lerp(lowPriority, highPriority, popActual / Math.max(1, popTarget - 1)));
};