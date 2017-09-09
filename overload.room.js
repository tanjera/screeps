Room.prototype.store = function store(resource) {
	return _.get(this, ["storage", "store", resource], 0) + _.get(this, ["terminal", "store", resource], 0);	
};


Room.prototype.getLevel = function getLevel() {
	if (this.energyCapacityAvailable == 0)
		return 0;
	else if (this.energyCapacityAvailable < 550)      // lvl 1, 300 energy
		return 1;
	else if (this.energyCapacityAvailable < 800)      // lvl 2, 550 energy
		return 2;
	else if (this.energyCapacityAvailable < 1300)     // lvl 3, 800 energy
		return 3;
	else if (this.energyCapacityAvailable < 1800)     // lvl 4, 1300 energy
		return 4;
	else if (this.energyCapacityAvailable < 2300)     // lvl 5, 1800 energy
		return 5;
	else if (this.energyCapacityAvailable < 5600)     // lvl 6, 2300 energy
		return 6;
	else if (this.energyCapacityAvailable < 12900)    // lvl 7, 5600 energy
		return 7;
	else											  // lvl 8, 12900 energy
		return 8;
},
	
Room.prototype.getWallTarget = function getWallTarget() {
	let level = this.getLevel();		
	let t = [ 0,
				10000,
				25000,
				50000,
				100000,
				500000,
				1000000,
				5000000,
				30000000 ];
	return t[level];
},
		
Room.prototype.getCriticalEnergy = function getCriticalEnergy() {
	let level = this.getLevel();
	let energy = [ 0,
		0,
		0,
		0,
		10000,
		30000,
		50000,
		75000,
		100000 ];
	return energy[level];
},
	
Room.prototype.getLowEnergy = function getLowEnergy() {
	let level = this.getLevel();
	let energy = [ 0,
		0,
		0,
		0,
		20000,
		60000,
		100000,
		150000,
		200000 ];
	return energy[level];
},
	
Room.prototype.findRepair_Critical = function findRepair_Critical() {
	return this.find(FIND_STRUCTURES, {
		filter: (s) => {
			return (s.structureType == "rampart"
					&& s.hits < _.get(Memory, ["rooms", this.name, "structures", `${s.structureType}-${s.id}`, "targetHits"], this.getWallTarget()) * 0.1)
				|| (s.structureType == "constructedWall"
					&& s.hits < _.get(Memory, ["rooms", this.name, "structures", `${s.structureType}-${s.id}`, "targetHits"], this.getWallTarget()) * 0.1)
				|| (s.structureType == "container" && s.hits < s.hitsMax * 0.1)
				|| (s.structureType == "road" && s.hits < s.hitsMax * 0.1);
		}}).sort((a, b) => {return a.hits - b.hits});
},

Room.prototype.findRepair_Maintenance = function findRepair_Maintenance() {
	return this.find(FIND_STRUCTURES, {
		filter: (s) => {
			return (s.structureType == "rampart"
					&& s.hits < _.get(Memory, ["rooms", this.name, "structures", `${s.structureType}-${s.id}`, "targetHits"], this.getWallTarget()))
				|| (s.structureType == "constructedWall"
					&& s.hits < _.get(Memory, ["rooms", this.name, "structures", `${s.structureType}-${s.id}`, "targetHits"], this.getWallTarget()))
				|| (s.structureType == "container" && s.hits < s.hitsMax * 0.8)
				|| (s.structureType == "road" && s.hits < s.hitsMax * 0.8)
				|| ((s.structureType == "spawn" || s.structureType == "extension" || s.structureType == "link" || s.structureType == "storage"
					|| s.structureType == "tower" || s.structureType == "observer" || s.structureType == "extractor" || s.structureType == "lab"
					|| s.structureType == "terminal" || s.structureType == "nuker" || s.structureType == "powerSpawn")
					&& s.hits < s.hitsMax);
		}}).sort((a, b) => {return a.hits - b.hits});
}
