var utilColony = {

	requestSpawn: function(rmName, rmDistance, lvlPriority, cBody, cName, cArgs) {
        /*  lvlPriority is an integer rating priority, e.g.:
                0: Defense (active, imminent danger)
                1: Mining operations (critical)
                2: Mining operations (regular)
                3: Colony operation (critical)
                4: Colony operation (regular)
                5: ... ? scouting? passive defense?
                
            rmDistance is linear map distance from which a room (of equal or higher level) can spawn for this request
		*/

        var i = Object.keys(Memory['hive']['spawn_requests']).length;
        Memory['hive']['spawn_requests'][i] = {room: rmName, distance: rmDistance, priority: lvlPriority, body: cBody, name: cName, args: cArgs};
	},

    getSpawn_Level: function(spawn) {
        if (spawn.room.energyCapacityAvailable < 550)           // lvl 1, 300 energy
            return 1;
        else if (spawn.room.energyCapacityAvailable < 800)      // lvl 2, 550 energy
            return 2;
        else if (spawn.room.energyCapacityAvailable < 1300)     // lvl 3, 800 energy
            return 3;
        else if (spawn.room.energyCapacityAvailable < 1800)     // lvl 4, 1300 energy
            return 4;
        else if (spawn.room.energyCapacityAvailable < 2300)     // lvl 5, 1800 energy
            return 5;
        else if (spawn.room.energyCapacityAvailable < 5300)     // lvl 6, 2300 energy
            return 6;
        else if (spawn.room.energyCapacityAvailable < 12300)    // lvl 7, 5300 energy
            return 7;
        else if (spawn.room.energyCapacityAvailable == 12300)   // lvl 8, 12300 energy
            return 8;
		},

    getRoom_Level: function(room) {
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
        else if (room.energyCapacityAvailable < 5300)     // lvl 6, 2300 energy
            return 6;
        else if (room.energyCapacityAvailable < 12300)    // lvl 7, 5300 energy
            return 7;
        else if (room.energyCapacityAvailable == 12300)   // lvl 8, 12300 energy
            return 8;
		},

    repairWalls_Critical: function(level) {
        var t = [0, 
                    1000,
                    2500,
                    5000,
                    10000,
                    15000,
                    30000,
                    60000,
                    100000 ];
        return t[level];
		},

    repairWalls_Maintenance: function(level) {
        var t = [0, 
                    10000,
                    25000,
                    50000,
                    75000,
                    100000,
                    150000,
                    500000,
                    1000000 ];
        return t[level];
		},

    findByNeed_RepairCritical: function(room) {
        var list = room.find(FIND_STRUCTURES, {
                            filter: function(structure) {
                                return (structure.structureType == STRUCTURE_RAMPART && structure.hits < utilColony.repairWalls_Critical(utilColony.getRoom_Level(room)))
                                    || (structure.structureType == STRUCTURE_WALL && structure.hits < utilColony.repairWalls_Critical(utilColony.getRoom_Level(room)))
                                    || (structure.structureType == STRUCTURE_CONTAINER && structure.hits < structure.hitsMax / 5)
                                    || (structure.structureType == STRUCTURE_ROAD && structure.hits < structure.hitsMax / 5);
                            }}).sort(function(a, b) {return a.hits - b.hits});
        return (list.length > 0) ? list[0] : null;
    },
    
    findByNeed_RepairMaintenance: function(room) {
        var list = room.find(FIND_STRUCTURES, {
                            filter: function(structure) {
                                return (structure.structureType == STRUCTURE_RAMPART && structure.hits < utilColony.repairWalls_Maintenance(utilColony.getRoom_Level(room)))
                                    || (structure.structureType == STRUCTURE_WALL && structure.hits < utilColony.repairWalls_Maintenance(utilColony.getRoom_Level(room)))
                                    || (structure.structureType == STRUCTURE_CONTAINER && structure.hits < structure.hitsMax / 5)
                                    || (structure.structureType == STRUCTURE_ROAD && structure.hits < structure.hitsMax / 5);
                            }}).sort(function(a, b) {return a.hits - b.hits});
        return (list.length > 0) ? list[0] : null;
    },

    findByRange_RepairMaintenance: function(creep) {
        return creep.pos.findClosestByRange(FIND_STRUCTURES, {
                                filter: function(structure) {
                                    return (structure.structureType == STRUCTURE_ROAD && structure.hits < structure.hitsMax / 2)
                                        || (structure.structureType == STRUCTURE_CONTAINER && structure.hits < structure.hitsMax / 2)
                                        || (structure.structureType == STRUCTURE_RAMPART && structure.hits < utilColony.repairWalls_Maintenance(utilColony.getRoom_Level(creep.room)))
                                        || (structure.structureType == STRUCTURE_WALL && structure.hits < utilColony.repairWalls_Maintenance(utilColony.getRoom_Level(creep.room)));
                                } 
                        });
    }
};

module.exports = utilColony;
