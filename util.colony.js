module.exports = {

    getRoom_Level: function(room) {
		
		if (typeof(room) == "string") {
			room = Game["rooms"][room];
		}
		
        if (room.energyCapacityAvailable < 550)           // lvl 1, 300 energy
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
        
    repairWalls_Critical: function(level) {
        let t = [ 0, 
                    2500,
                    10000,
                    10000,
                    15000,
                    20000,
                    30000,
                    75000,
                    250000 ];
        return t[level];
		},

    repairWalls_Maintenance: function(level) {
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
                                return (s.structureType == STRUCTURE_RAMPART && s.hits < this.repairWalls_Critical(this.getRoom_Level(room)))
                                    || (s.structureType == STRUCTURE_WALL && s.hits < this.repairWalls_Critical(this.getRoom_Level(room)))
                                    || (s.structureType == STRUCTURE_CONTAINER && s.hits < s.hitsMax * 0.2)
                                    || (s.structureType == STRUCTURE_ROAD && s.hits < s.hitsMax * 0.2);
                            }}).sort((a, b) => {return a.hits - b.hits});    
    },
    
    findByNeed_RepairMaintenance: function(room) {
        return room.find(FIND_STRUCTURES, {
                            filter: (s) => {
                                return (s.structureType == STRUCTURE_RAMPART && s.hits < this.repairWalls_Maintenance(this.getRoom_Level(room)))
                                    || (s.structureType == STRUCTURE_WALL && s.hits < this.repairWalls_Maintenance(this.getRoom_Level(room)))
                                    || (s.structureType == STRUCTURE_CONTAINER && s.hits < s.hitsMax * 0.8)
                                    || (s.structureType == STRUCTURE_ROAD && s.hits < s.hitsMax * 0.8);
                            }}).sort((a, b) => {return a.hits - b.hits});        
    },

    findByRange_RepairMaintenance: function(creep) {
        return creep.pos.findClosestByRange(FIND_STRUCTURES, {
                                filter: (s) => {
                                    return (s.structureType == STRUCTURE_ROAD && s.hits < s.hitsMax * 0.8)
                                        || (s.structureType == STRUCTURE_CONTAINER && s.hits < s.hitsMax * 0.8)
                                        || (s.structureType == STRUCTURE_RAMPART && s.hits < this.repairWalls_Maintenance(this.getRoom_Level(creep.room)))
                                        || (s.structureType == STRUCTURE_WALL && s.hits < this.repairWalls_Maintenance(this.getRoom_Level(creep.room)));
                                } 
                        });
    }
};