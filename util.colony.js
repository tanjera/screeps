var utilColony = {

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
                    100000,
                    150000,
                    300000,
                    600000,
                    1000000 ];
        return t[level];
		}
};

module.exports = utilColony;
