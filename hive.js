let _CPU = require("util.cpu");

let Hive = {

	isPulse_Spawn: function() {      
		if (Game.cpu.bucket > 7000) {
            return Game.time % 5 == 0;
        } else {
            return Game.time % 10 == 0;
		}
    },

    isPulse_Main: function() {
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
				if (Memory.creeps[n]["task"] != null) {
					let task = Memory.creeps[n]["task"];
					if (Memory["rooms"][task.room]["tasks_running"] != null && Memory["rooms"][task.room]["tasks_running"][task.key] != null)
						delete Memory["rooms"][task.room]["tasks_running"][task.key][n];
				}

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
				
		if (Memory["options"] == null) Memory["options"] = { console: "on" };
		
		let _Console = require("util.console");
		_Console.Init();
    },    

    initTasks: function() {		        
        if (Hive.isPulse_Main()) {			
			_CPU.Start("Hive", "initTasks");
			
			let Tasks = require("tasks");
            for (let r in Game["rooms"]) {            
                Memory["rooms"][r]["tasks"] = {};
                Tasks.compileTasks(r);
				Memory["rooms"][r]["tasks_running"] = {};
            }
			
			_CPU.End("Hive", "initTasks");
        }		
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
		
		if (!this.isPulse_Spawn())
			return;
		
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
						let name = request.name != null ? request.name 
							: request.args["role"].substring(0, 4)
								+ (request.args["subrole"] == null ? "" : `-${request.args["subrole"].substring(0, 2)}`)
								+ ":xxxx".replace(/[xy]/g, (c) => {
										let r = Math.random()*16|0, v = c == "x" ? r : (r&0x3|0x8);
										return v.toString(16); });
                        let result = spawn.createCreep(body, name, request.args);
						
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
    },
	
	sellExcessResources: function(overflow) {
		if (!Hive.isPulse_Main())
			return;
		
		_CPU.Start("Hive", "sellExcessResources");
		
		let resources = new Object();		
				
		for (let res in overflow) {			
			for (let r in Game.rooms) {
				let room = Game.rooms[r];
				
				if (room.terminal != null && room.terminal.my) {	// Only count rooms with my terminals... 
					if (room.storage != null) {				
						if (room.storage.store[res] != null && room.storage.store[res] > 0) {
							if (resources[res] == null) 
								resources[res] = {};					
							
							resources[res][r] = room.storage.store[res];
						}
					}				
				
					if (room.terminal.store[res] != null && room.terminal.store[res] > 0) {
						if (resources[res] == null) 
							resources[res] = {};
						
						if (resources[res][r] == null)
							resources[res][r] = room.terminal.store[res];
						else
							resources[res][r] += room.terminal.store[res];
					}
				}
			}
		}
				
		for (let res in resources) {
			let excess = _.sum(resources[res]) - overflow[res]["limit"];
			if (excess > 0 && Memory["terminal_orders"][`overflow_${res}`] == null) {
				let room = _.head(_.sortBy(Object.keys(resources[res]), r => { return -resources[res][r]; }));				
				let order = _.head(_.sortBy(_.sortBy(Game.market.getAllOrders(
					o => { return o.type == "buy" && o.resourceType == res; }),
					o => { return Game.map.getRoomLinearDistance(o.roomName, room); }),
					o => { return -o.price; } ));
				
				if (order != null)
					_.set(Memory, ["terminal_orders", `overflow_${res}`], { market_id: order.id, amount: excess, from: room, priority: 4 });				
			}			
		}
		
		_CPU.End("Hive", "sellExcessResources");
	},
	
	moveExcessEnergy: function(limit) {
		if (!Hive.isPulse_Main())
			return;
		
		_CPU.Start("Hive", "moveExcessEnergy");
		
		let energy = new Object();		
					
		for (let r in Game.rooms) {
			let room = Game.rooms[r];
			
			if (room.terminal != null && room.terminal.my) {
				if (room.storage != null && room.storage.store["energy"] != null) {
					energy[r] = room.storage.store["energy"];				
				}
				
				if (room.terminal.store["energy"] != null && room.terminal.store["energy"] > 0) {					
					if (energy[r] == null)
						energy[r] = room.terminal.store["energy"];
					else
						energy[r] += room.terminal.store["energy"];			
				}
			}
		}
	
		for (let r in energy) {
			if (energy[r] > limit) {
				room = _.head(_.sortBy(_.filter(Object.keys(energy), 
					n => { return energy[n] < limit; } ),
					n => { return energy[n]; }));
				if (room != null)					
					_.set(Memory, ["terminal_orders", `overflow_energy_${r}`], { room: room, resource: "energy", amount: energy[r] - limit, from: r, priority: 2 });
			}
		}
		
		_CPU.End("Hive", "moveExcessEnergy");
	}	
};

module.exports = Hive;
