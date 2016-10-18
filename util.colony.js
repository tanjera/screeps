module.exports = {

    getRoom_Level: function(room) {

		if (typeof(room) == "string") {
			room = Game["rooms"][room];
		}

        if (room.energyCapacityAvailable == 0)
			return 0;
		else if (room.energyCapacityAvailable < 550)      // lvl 1, 300 energy
            return 1;
        else if (room.energyCapacityAvailable < 800)      // lvl 2, 550 energy
            return 2;
        else if (room.energyCapacityAvailable < 1300)     // lvl 3, 800 energy
            return 3;
        else if (room.energyCapacityAvailable < 1800)     // lvl 4, 1300 energy
            return 4;
        else if (room.energyCapacityAvailable < 2300)     // lvl 5, 1800 energy
            return 5;
        else if (room.energyCapacityAvailable < 5600)     // lvl 6, 2300 energy
            return 6;
        else if (room.energyCapacityAvailable < 12900)    // lvl 7, 5600 energy
            return 7;
        else											  // lvl 8, 12900 energy
            return 8;
		},

    getWalls_targetHits: function(level) {
        let t = [ 0,
                    10000,
                    25000,
                    35000,
                    50000,
                    75000,
                    125000,
                    250000,
                    1000000 ];
        return t[level];
	},

    findByNeed_RepairCritical: function(room) {
        return room.find(FIND_STRUCTURES, {
			filter: (s) => {
				return (s.structureType == "rampart"
						&& s.hits < _.get(Memory, ["rooms", room.name, "structures", `${s.structureType}-${s.id}`, "targetHits"], this.getWalls_targetHits(this.getRoom_Level(room))) * 0.1)
					|| (s.structureType == "constructedWall"
						&& s.hits < _.get(Memory, ["rooms", room.name, "structures", `${s.structureType}-${s.id}`, "targetHits"], this.getWalls_targetHits(this.getRoom_Level(room))) * 0.1)
					|| (s.structureType == "container" && s.hits < s.hitsMax * 0.1)
					|| (s.structureType == "road" && s.hits < s.hitsMax * 0.1);
			}}).sort((a, b) => {return a.hits - b.hits});
    },

    findByNeed_RepairMaintenance: function(room) {
        return room.find(FIND_STRUCTURES, {
			filter: (s) => {
				return (s.structureType == "rampart"
						&& s.hits < _.get(Memory, ["rooms", room.name, "structures", `${s.structureType}-${s.id}`, "targetHits"], this.getWalls_targetHits(this.getRoom_Level(room))))
					|| (s.structureType == "constructedWall"
						&& s.hits < _.get(Memory, ["rooms", room.name, "structures", `${s.structureType}-${s.id}`, "targetHits"], this.getWalls_targetHits(this.getRoom_Level(room))))
					|| (s.structureType == "container" && s.hits < s.hitsMax * 0.8)
					|| (s.structureType == "road" && s.hits < s.hitsMax * 0.8)
					|| ((s.structureType == "spawn" || s.structureType == "extension" || s.structureType == "link" || s.structureType == "storage"
						|| s.structureType == "tower" || s.structureType == "observer" || s.structureType == "extractor" || s.structureType == "lab"
						|| s.structureType == "terminal" || s.structureType == "nuker" || s.structureType == "powerSpawn")
						&& s.hits < s.hitsMax);
			}}).sort((a, b) => {return a.hits - b.hits});
    }
};