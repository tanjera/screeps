let _CPU = require("util.cpu");

let Hive = {

    isPulse: function() {
        if (Game.cpu.bucket > 9000) {
            return Game.time % 5 == 0;
        } else if (Game.cpu.bucket > 7000) {
            return Game.time % 10 == 0;
        } else if (Game.cpu.bucket > 5000) {
            return Game.time % 15 == 0;
        } else if (Game.cpu.bucket > 3000) {
            return Game.time % 30 == 0;
        } else if (Game.cpu.bucket > 1000) {
            return Game.time % 40 == 0;
        } else if (Game.cpu.bucket <= 1000) {
            return Game.time % 60 == 0;
        }
    },

    moveReusePath: function() {
        if (Game.cpu.bucket > 9000) {
            return 8;
        } else if (Game.cpu.bucket > 7000) {
            return 11;
        } else if (Game.cpu.bucket > 5000) {
            return 15;
        } else if (Game.cpu.bucket > 3000) {
            return 30;
        } else if (Game.cpu.bucket > 1000) {
            return 40;
        } else if (Game.cpu.bucket <= 1000) {
            return 60;
        }
    },

    clearDeadMemory: function() {
        // Clear dead creeps from Memory
        for (let n in Memory.creeps) {
            if (!Game.creeps[n]) {
                delete Memory.creeps[n];
            }
        }
    },

    initMemory: function() {
        if (Memory["rooms"] == null) Memory["rooms"] = {};        
        
        for (let r in Game["rooms"]) {            
            if (Memory["rooms"][r] == null) Memory["rooms"][r] = {};            
            if (Memory["rooms"][r]["tasks"] == null) Memory["rooms"][r]["tasks"] = {};            
			Memory["rooms"][r]["population_balance"] = null;
			
        }
		
		Memory["spawn_requests"] = new Array();
		
		if (Memory["request"] == null) Memory["request"] = {};		
		if (Memory["options"] == null) Memory["options"] = { console: "on" };
    },    

    initTasks: function() {		
        let Tasks = require("tasks");
        if (Hive.isPulse()) {			
			_CPU.Start("Hive", "initTasks");
			
            for (let r in Game["rooms"]) {            
                Memory["rooms"][r]["tasks"] = {};
                Tasks.compileTasks(r);
            }
			
			_CPU.End("Hive", "initTasks");
        }		
    },
	
	processRequests: function() {
		// To be used for injecting tasks or terminal order requests
		if (Memory["request"] != "") {
			switch (Memory["request"]) {
				
				default:
					console.log("Invalid request.")
					break;	

				case "reset-stockpiles": {					
					Memory["terminal_orders"] = new Object();
					for (var r in Memory["rooms"]) {
						Memory["rooms"][r]["stockpile"] = new Object();
					}
					
					console.log("All Memory.rooms.[r].stockpile reset!");
					break;
				}
					
				case "log-resources": {
					let _Logs = require("util.logs");
					_Logs.Resources();
					break;
				}
				
				case "log-storage": {
					let _Logs = require("util.logs");
					_Logs.Storage();
					break;
				}
				
				case "log-stockpile": {
					let _Logs = require("util.logs");
					_Logs.Stockpile();
					break;
				}
			}
		}
		
		Memory["request"] = "";
	},	
	
    populationTally: function(rmName, popTarget, popActual) {
        // Tallies the target population for a colony, to be used for spawn load balancing
        if (Memory["rooms"][rmName]["population_balance"] == null) {
            Memory["rooms"][rmName]["population_balance"] = {target: popTarget, actual: popActual, total: null};
        } else {
            Memory["rooms"][rmName]["population_balance"]["target"] += popTarget;
            Memory["rooms"][rmName]["population_balance"]["actual"] += popActual; 
        }
    },

    processSpawnRequests: function() {
		/*  lvlPriority is an integer rating priority, e.g.:
                0: Defense (active, imminent danger)
                1: Mining operations (critical)
                2: Mining operations (regular)
                3: Colony operation (critical)
                4: Colony operation (regular)
                5: ... ? scouting? passive defense?
                
            tgtLevel is the target level of the creep"s body (per util.creep)
            spawnDistance is linear map distance from which a room (of equal or higher level) can spawn for this request
		*/
		
		_CPU.Start("Hive", "processSpawnRequests");
		
        let listRequests = Object.keys(Memory["spawn_requests"]).sort((a, b) => { 
            return Memory["spawn_requests"][a]["priority"] - Memory["spawn_requests"][b]["priority"]; } );
        let listSpawns = Object.keys(Game["spawns"]).filter((a) => { return Game["spawns"][a].spawning == null; });
        let _Creep = require("util.creep");

		for (let s in listSpawns) {
			for (let r in listRequests) {
                if (listSpawns[s] != null && listRequests[r] != null) {
					let spawn = Game["spawns"][listSpawns[s]];
                    let request = Memory["spawn_requests"][listRequests[r]];
                    if (Game.map.getRoomLinearDistance(spawn.room.name, request.room) <= request.distance) {
						
						Memory["rooms"][request.room]["population_balance"]["total"] = 
							Memory["rooms"][request.room]["population_balance"]["actual"] / Memory["rooms"][request.room]["population_balance"]["target"];
						
						let _Colony = require("util.colony");
                        let level = (request.scale_level != null && request.scale_level == false) ? request.level
								: Math.max(1, Math.min(Math.ceil(Memory["rooms"][request.room]["population_balance"]["total"] * request.level), 
									_Colony.getRoom_Level(spawn.room)));
						let body = _Creep.getBody(request.body, level);
                        let result = spawn.createCreep(body, request.name, request.args);
						
                        if (_.isString(result)) {
							if (Memory["options"]["console"] == "on")
								console.log(`<font color=\"#19C800\">[Spawns]</font> Spawning lvl ${level} / ${request.level} ${request.body}, `
									+ `${spawn.room.name} -> ${request.room}, `
									+ `${result} (${request.args["role"]}`
									+ `${request.args["subrole"] == null ? "" : ", " + request.args["subrole"]})`);
							
                            listSpawns[s] = null;
                            listRequests[r] = null;
                        }
                    }
                }
            }
        }
		
		_CPU.End("Hive", "processSpawnRequests");
	},

    processSpawnRenewing: function() {
		_CPU.Start("Hive", "processSpawnRenewing");
		
        let _Creep = require("util.creep");
        let listSpawns = Object.keys(Game["spawns"]).filter((a) => { return Game["spawns"][a].spawning == null; });
        for (let s in listSpawns) {
            let spawn = Game["spawns"][listSpawns[s]];
            let creeps = spawn.pos.findInRange(FIND_MY_CREEPS, 1);
            for (let c in creeps) {
                if (!_Creep.isBoosted(creeps[c])) {
                    if (spawn.renewCreep(creeps[c]) == OK) {
                        break;
                    }
                }
            }
        }
		
		_CPU.End("Hive", "processSpawnRenewing");
    }
};

module.exports = Hive;
