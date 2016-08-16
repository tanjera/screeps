var utilTasks = require('util.tasks');

var utilHive = {

    clearDeadMemory: function() {
        // Clear dead creeps from Memory
        for (var n in Memory.creeps) {
            if (!Game.creeps[n]) {
                delete Memory.creeps[n];
            }
        }
    },

    initHiveMemory: function() {
        if (Memory['hive'] == null) { 
            Memory['hive'] = {}; 
        }
        if (Memory['hive']['rooms'] == null) { 
            Memory['hive']['rooms'] = {}; 
        }

        // Populate empty room memories
        for (var k = 0; k < Object.keys(Game['rooms']).length; k++) {
            var r = Object.keys(Game['rooms'])[k];
            if (Memory['hive']['rooms'][r] == null) {
                Memory['hive']['rooms'][r] = {};
            }
            if (Memory['hive']['rooms'][r]['tasks'] == null) {
                Memory['hive']['rooms'][r]['tasks'] = {};
            }
        }

        // Set allies
        Memory['hive']['allies'] = {    Pantek59: null,
                                        Atavus: null,
                                        BlackLotus: null,
                                        shedletsky: null };

        Memory['hive']['population_balance'] = {};  // Reset data for population balancing
        Memory['hive']['spawn_requests'] = {};      // Reset all spawn requests   
    },


    initTasks: function() {
        // Only compiles tasks for rooms with access!!
        for (var k = 0; k < Object.keys(Game['rooms']).length; k++) {
            utilTasks.compileTasks(Object.keys(Game['rooms'])[k]);
        }
    },


    populationTally: function(rmName, popTarget, popActual) {
        // Tallies the target population for a colony, to be used for spawn load balancing
        if (Memory['hive']['population_balance'][rmName] == null) {
            Memory['hive']['population_balance'][rmName] = {target: popTarget, actual: popActual, total: null};
        } else {
            Memory['hive']['population_balance'][rmName]['target'] += popTarget;
            Memory['hive']['population_balance'][rmName]['actual'] += popActual; 
        }
    },


    requestSpawn: function(rmName, rmDistance, lvlPriority, tgtLevel, cBody, cName, cArgs) {
        /*  lvlPriority is an integer rating priority, e.g.:
                0: Defense (active, imminent danger)
                1: Mining operations (critical)
                2: Mining operations (regular)
                3: Colony operation (critical)
                4: Colony operation (regular)
                5: ... ? scouting? passive defense?
                
            tgtLevel is the target level of the creep's body (per util.creep)
            rmDistance is linear map distance from which a room (of equal or higher level) can spawn for this request
		*/

        var i = Object.keys(Memory['hive']['spawn_requests']).length;
        Memory['hive']['spawn_requests'][i] = {room: rmName, distance: rmDistance, priority: lvlPriority, level: tgtLevel, body: cBody, name: cName, args: cArgs};
	},


    processSpawnRequests: function() {
        // Determine percentage each colony meets its target population
        for (var i = 0; i < Object.keys(Memory['hive']['population_balance']).length; i++) {
            var n = Object.keys(Memory['hive']['population_balance'])[i];
            Memory['hive']['population_balance'][n]['total'] = Memory['hive']['population_balance'][n]['actual'] / Memory['hive']['population_balance'][n]['target'];
        }

        var listRequests = Object.keys(Memory['hive']['spawn_requests']).sort(function(a, b) { 
            return Memory['hive']['spawn_requests'][a].priority - Memory['hive']['spawn_requests'][b].priority; } );
        var listSpawns = Object.keys(Game['spawns']).filter(function(a) { return Game['spawns'][a].spawning == null; });
        var utilCreep = require('util.creep');

        for (var r = 0; r < listRequests.length; r++) {
            for (var s = 0; s < listSpawns.length; s++) {
                if (listSpawns[s] != null && listRequests[r] != null) {
                    
                    var request = Memory['hive']['spawn_requests'][listRequests[r]];
                    
                    if (Game.map.getRoomLinearDistance(Game['spawns'][listSpawns[s]].room.name, request.room) <= request.distance) {
                        var level = request.level > utilHive.getRoom_Level(request.room) ? utilHive.getRoom_Level(request.room) : request.level; 
                        var body = utilCreep.getBody(request.body, Math.ceil(Memory['hive']['population_balance'][request.room]['total'] * level));
                        var result = Game['spawns'][listSpawns[s]].createCreep(body, request.name, request.args);

                        if (_.isString(result)) {
                            listSpawns[s] = null;
                            listRequests[r] = null;
                        }
                    }
                }
            }
        }
	},

    processSpawnRenewing: function() {
        var listSpawns = Object.keys(Game['spawns']).filter(function(a) { return Game['spawns'][a].spawning == null; });
        for (var s = 0; s < listSpawns.length; s++) {
            var spawn = Game['spawns'][listSpawns[s]];
            var creeps = spawn.pos.findInRange(FIND_MY_CREEPS, 1);
            for (var c = 0; c < creeps.length; c++) {
                if (spawn.renewCreep(creeps[c]) == OK) {
                    c = creeps.length;  // Break the inner for loop
                }
            }
        }
    },


    getRoom_Level: function(rmName) {
        if (Game['rooms'][rmName].energyCapacityAvailable < 550)           // lvl 1, 300 energy
            return 1;
        else if (Game['rooms'][rmName].energyCapacityAvailable < 800)      // lvl 2, 550 energy
            return 2;
        else if (Game['rooms'][rmName].energyCapacityAvailable < 1300)     // lvl 3, 800 energy
            return 3;
        else if (Game['rooms'][rmName].energyCapacityAvailable < 1800)     // lvl 4, 1300 energy
            return 4;
        else if (Game['rooms'][rmName].energyCapacityAvailable < 2300)     // lvl 5, 1800 energy
            return 5;
        else if (Game['rooms'][rmName].energyCapacityAvailable < 5300)     // lvl 6, 2300 energy
            return 6;
        else if (Game['rooms'][rmName].energyCapacityAvailable < 12300)    // lvl 7, 5300 energy
            return 7;
        else if (Game['rooms'][rmName].energyCapacityAvailable == 12300)   // lvl 8, 12300 energy
            return 8;
		},
};

module.exports = utilHive;
