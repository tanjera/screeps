var utilColony = {

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
