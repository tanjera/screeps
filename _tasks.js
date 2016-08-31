let _Tasks = {

    randomName: function() {
        return index = "xxxxxx-xxxxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
                let r = Math.random()*16|0, v = c == "x" ? r : (r&0x3|0x8);
                return v.toString(16);
            });
	},

    addTask: function (rmName, incTask) {
        /* Task format:
            type:       combat | work | mine | carry | energy | industry | wait
            subtype:    pickup | withdraw | deposit | harvest | upgrade | repair | dismantle | attack | defend | heal | wait            
            priority:   on a scale of 1-10; only competes with tasks of same type
            structure:  link | storage
            resource:   energy | mineral
            id:         target gameobject id
            pos:        room position
            timer:      run for x ticks
            goal:       e.g. hp goal for repairing, amount to deposit, etc.
            creeps:     maximum # of creeps to run this task
         */

        let index = incTask["type"] + "-" + incTask["subtype"] + "-" 
            + "xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
            let r = Math.random()*16|0, v = c == "x" ? r : (r&0x3|0x8);
            return v.toString(16);
            });

        Memory["_tasks"][rmName][index] = incTask;
	},

    giveTask: function(creep, task) {
        // Iterate the room"s task list to see if the room"s task needs updating
        for (let t in Memory["_tasks"][creep.room.name]) {
            if (Memory["_tasks"][creep.room.name][t] == task) {
                creep.memory.task = Memory["_tasks"][creep.room.name][t];                
                
                if (Memory["_tasks"][creep.room.name][t]["creeps"] != null) {
                    Memory["_tasks"][creep.room.name][t]["creeps"] -= 1;
                    if (Memory["_tasks"][creep.room.name][t]["creeps"] == 0) {
                        delete Memory["_tasks"][creep.room.name][t];
                    }
                }                
                return;
            }
        }

        // Task not found in the room task list? Possibly individualized task...
        creep.memory.task = task;
        return;
	},

    returnTask: function(creep, task) {
        task.creeps = 1;
        _Tasks.addTask(creep.room.name, task);
	},

    assignTask: function(creep, isRefueling) {
        if (creep.memory.task != null && Object.keys(creep.memory.task).length > 0) {            
            return;
        }
		
		// Assign a boost if needed and available
		let __creep = require("__creep");
		if (creep.ticksToLive > 1400 && !__creep.isBoosted(creep)) {
			let tasks = _.filter(Memory["_tasks"][creep.room.name], 
					(t) => { return t.type == "boost" && t.role == creep.memory.role && t.subrole == creep.memory.subrole; });				
			if (tasks.length > 0) {
				_Tasks.giveTask(creep, tasks[0]);
				return;
			}
		}

		// Assign role tasks
        switch (creep.memory.role) {
            default: 
                return;

            case "multirole":
            case "worker": 
                _Tasks.assignTask_Work(creep, isRefueling);
                return;

            case "courier":
                _Tasks.assignTask_Industry(creep, isRefueling);
                return;

            case "miner":
            case "burrower":
            case "carrier":
                _Tasks.assignTask_Mine(creep, isRefueling);
                return;

            case "extractor":
                _Tasks.assignTask_Extract(creep, isRefueling);
                return;
        }
	},

    assignTask_Work: function(creep, isRefueling) {
        let tasks;

        if (isRefueling) {            
            tasks = _.sortBy(_.sortBy(_.filter(Memory["_tasks"][creep.room.name], 
                    (t) => { return t.type == "energy"; }), 
                    (t) => { return creep.pos.getRangeTo(t.pos.x, t.pos.y); }), 
                    "priority");
            if (tasks.length > 0) {
                _Tasks.giveTask(creep, tasks[0]);
                return;
            }
                        
            tasks = _.sortBy(_.filter(Memory["_tasks"][creep.room.name], 
                    (t) => { return t.subtype == "pickup" && t.resource == "energy"; }), 
                    (t) => { return creep.pos.getRangeTo(t.pos.x, t.pos.y); });
            if (tasks.length > 0) {
                _Tasks.giveTask(creep, tasks[0]);
                return;
            }

            tasks = _.sortBy(_.filter(Memory["_tasks"][creep.room.name], 
                    (t) => { return t.type == "mine" && t.resource == "energy"; }), 
                    (t) => { return creep.pos.getRangeTo(t.pos.x, t.pos.y); });
            if (tasks.length > 0) {
                _Tasks.giveTask(creep, tasks[0]);
                return;
            }        
        } else {
            if (creep.memory.subrole == "repairer") {
                tasks = _.sortBy(_.sortBy(_.filter(Memory["_tasks"][creep.room.name], 
                        (t) => { return t.type == "work" && t.subtype == "repair"; }), 
                        (t) => { return creep.pos.getRangeTo(t.pos.x, t.pos.y); }),
                        "priority");
            }
            else if (creep.memory.subrole == "upgrader") {
                tasks = _.sortBy(_.filter(Memory["_tasks"][creep.room.name], function (t) { return t.type == "work" && t.subtype == "upgrade"; }), "priority");
            }
            
            if (tasks == null || tasks.length == 0) {
                tasks = _.sortBy(_.sortBy(_.filter(Memory["_tasks"][creep.room.name], 
                        (t) => { return t.type == "work"; }), 
                        (t) => { return creep.pos.getRangeTo(t.pos.x, t.pos.y); }),
                        "priority");
            }

            if (tasks != null && tasks.length > 0) {
                _Tasks.giveTask(creep, tasks[0]);        
                return;
            }
        }
	},

    assignTask_Industry: function(creep, isRefueling) {
        let tasks;
    
        if (isRefueling) {
            tasks = _.sortBy(_.sortBy(_.filter(Memory["_tasks"][creep.room.name], 
                    (t) => { return (t.type == "industry" && t.subtype == "withdraw"); }), 
                    (t) => { return creep.pos.getRangeTo(t.pos.x, t.pos.y); }),
                    "priority");
            if (tasks.length > 0) {
                _Tasks.giveTask(creep, tasks[0]);
                return;
            } else {    // If no tasks, then wait                
                _Tasks.giveTask(creep, {type: "wait", subtype: "wait", timer: 10});
                return;
            }
        } else {
            let resources = _.sortBy(Object.keys(creep.carry), (c) => { return -creep.carry[c]; });
            resources = Object.keys(resources).length > 0 ? resources[0] : "energy";                
            tasks = _.sortBy(_.sortBy(_.filter(Memory["_tasks"][creep.room.name], 
                    (t) => { return t.type == "industry" && t.subtype == "deposit" && t.resource == resources; }), 
                    (t) => { return creep.pos.getRangeTo(t.pos.x, t.pos.y); }),
                    "priority");            
            if (tasks.length > 0) {    
                _Tasks.giveTask(creep, tasks[0]);
                return;
            }

            // If stuck without a task... drop off energy/minerals in storage... or wait...
            if (Object.keys(creep.carry).includes("energy")) {
				tasks = _.sortBy(_.filter(Memory["_tasks"][creep.room.name], 
						(t) => { return t.type == "carry" && t.resource == "energy"; }), 
						(t) => { return creep.pos.getRangeTo(t.pos.x, t.pos.y); });
				if (tasks.length > 0) {
					_Tasks.giveTask(creep, tasks[0]);
					return;
				}
			} else if (Object.keys(creep.carry).length > 0) {
				tasks = _.sortBy(_.filter(Memory["_tasks"][creep.room.name], 
						(t) => { return t.type == "carry" && t.resource == "mineral"; }), 
						(t) => { return creep.pos.getRangeTo(t.pos.x, t.pos.y); });
				if (tasks.length > 0) {
					_Tasks.giveTask(creep, tasks[0]);
					return;
				}
            } else {
                _Tasks.giveTask(creep, {type: "wait", subtype: "wait", timer: 10});
                return;
            }
        }
	},

    assignTask_Mine: function(creep, isRefueling) {
        let tasks;

        if (isRefueling) {
            if (creep.room.name != creep.memory.room) {
                let __Creep = require("__creep");
                __Creep.moveToRoom(creep, creep.memory.room, isRefueling);
                return;
            } 

            if (creep.memory.role == "burrower") {
                tasks = _.sortBy(_.filter(Memory["_tasks"][creep.room.name], 
                        (t) => { return t.type == "mine" && t.resource == "energy"; }), 
                        (t) => { return creep.pos.getRangeTo(t.pos.x, t.pos.y); });
                if (tasks.length > 0) {
                    _Tasks.giveTask(creep, tasks[0]);
                    return;                
                }
            }
            else if (creep.memory.role == "miner" || creep.memory.role == "carrier") {
                tasks = _.sortBy(_.sortBy(_.filter(Memory["_tasks"][creep.room.name], 
                        (t) => { return (t.subtype == "pickup" && t.resource == "energy") || (t.type == "energy" && t.structure != "link"); }), 
                        (t) => { return creep.pos.getRangeTo(t.pos.x, t.pos.y); }),
                        "priority");
                if (tasks.length > 0) {
                    _Tasks.giveTask(creep, tasks[0]);
                    return;
                }

                if (creep.getActiveBodyparts("work") > 0) {
                    tasks = _.sortBy(_.filter(Memory["_tasks"][creep.room.name], 
                        (t) => { return t.type == "mine" && t.resource == "energy"; }), 
                        (t) => { return creep.pos.getRangeTo(t.pos.x, t.pos.y); });
                    if (tasks.length > 0) {
                        _Tasks.giveTask(creep, tasks[0]);
                        return;
                    }
                }
                
                if (creep.memory.task == null) {
                    // If there is no energy to get... deliver or wait.
                    if (_.sum(creep.carry) > creep.carryCapacity * 0.8) {
                        creep.memory.state = "delivering";
                        return;
                    } else {
                        _Tasks.giveTask(creep, {type: "wait", subtype: "wait", timer: 5});
                        return;
                    }
                }
            }
        } else {
            if (creep.room.name != creep.memory.colony) {
                let __Creep = require("__creep");
                __Creep.moveToRoom(creep, creep.memory.colony, isRefueling);
                return;
            }

            tasks = _.sortBy(_.sortBy(_.filter(Memory["_tasks"][creep.room.name], 
                    (t) => { return t.type == "carry" && t.subtype == "deposit" && t.resource == "energy"; }), 
                    (t) => { return creep.pos.getRangeTo(t.pos.x, t.pos.y); }),
                    "priority");
            if (tasks.length > 0) {
                _Tasks.giveTask(creep, tasks[0]);
                return;
            }
        }
	},

    assignTask_Extract: function(creep, isRefueling) {
        let tasks;

        if (isRefueling) {
            if (creep.room.name != creep.memory.room) {
                let __Creep = require("__creep");
                __Creep.moveToRoom(creep, creep.memory.room, isRefueling);
                return;
            } 

			tasks = _.sortBy(_.sortBy(_.filter(Memory["_tasks"][creep.room.name], 
				(t) => { return t.subtype == "pickup" && t.resource == "mineral"; }), 
				(t) => { return creep.pos.getRangeTo(t.pos.x, t.pos.y); }),
					"priority");
			if (tasks.length > 0) {
				_Tasks.giveTask(creep, tasks[0]);
				return;
			}
			
            tasks = _.sortBy(_.filter(Memory["_tasks"][creep.room.name], 
                (t) => { return t.type == "mine" && t.resource == "mineral"; }), 
                (t) => { return creep.pos.getRangeTo(t.pos.x, t.pos.y); });
            if (tasks.length > 0) {
                _Tasks.giveTask(creep, tasks[0]);
                return;
            }            

        } else {
            if (creep.room.name != creep.memory.colony) {
                let __Creep = require("__creep");
                __Creep.moveToRoom(creep, creep.memory.colony, isRefueling);
                return;
            }

            tasks = _.sortBy(_.filter(Memory["_tasks"][creep.room.name], 
                    (t) => { return t.type == "carry" && t.resource == "mineral"; }), 
                    (t) => { return creep.pos.getRangeTo(t.pos.x, t.pos.y); });
            if (tasks.length > 0) {
                _Tasks.giveTask(creep, tasks[0]);
                return;
            }
        }
	},

    compileTasks: function (rmName) {
        var structures;
        let __Colony = require("__colony");
        let room = Game.rooms[rmName];

        /* Worker-based tasks (upgrading controllers, building and maintaining structures) */
        if (room.controller != null && room.controller.level > 0) {
            if (room.controller.ticksToDowngrade < 3500) {
                _Tasks.addTask(rmName, 
                    {   type: "work",
                        subtype: "upgrade",
                        id: room.controller.id,
                        pos: room.controller.pos,
                        timer: 20,
                        creeps: 15,
                        priority: 1
                    });
            } else {
                _Tasks.addTask(rmName, 
                    {   type: "work",
                        subtype: "upgrade",
                        id: room.controller.id,
                        pos: room.controller.pos,
                        timer: 20,
                        creeps: 20,
                        priority: 5
                    });
            }
        }
        
        structures = __Colony.findByNeed_RepairCritical(room);
        for (let i in structures) {
            _Tasks.addTask(rmName, 
                {   type: "work",
                    subtype: "repair",
                    id: structures[i].id,
                    pos: structures[i].pos,
                    timer: 20,
                    creeps: 2,
                    priority: 2
                });                
        }
        
        structures = __Colony.findByNeed_RepairMaintenance(room);
        for (let i in structures) {
            _Tasks.addTask(rmName, 
                {   type: "work",
                    subtype: "repair",
                    id: structures[i].id,
                    pos: structures[i].pos,
                    timer: 20,
                    creeps: 2,
                    priority: 6
                });
        }
        
        structures = room.find(FIND_CONSTRUCTION_SITES);
        for (let i in structures) {
            _Tasks.addTask(rmName, 
                {   type: "work",
                    subtype: "build",
                    id: structures[i].id,
                    pos: structures[i].pos,
                    timer: 30,
                    creeps: 3,
                    priority: 3
                });            
        }

        /* Carrier-based tasks & energy supply for workers) */
        let piles = room.find(FIND_DROPPED_ENERGY);
        for (let i in piles) {			
            _Tasks.addTask(rmName, 
                {   type: "carry",
                    subtype: "pickup",
                    resource: piles[i].resourceType == "energy" ? "energy" : "mineral",
                    id: piles[i].id,
                    pos: piles[i].pos,
                    timer: 10, 
                    creeps: Math.ceil(piles[i].amount / 1000),
                    priority: 1
                });
        }

        let sources = room.find(FIND_SOURCES, { filter: (s) => { return s.energy > 0; }});
        for (let i in sources) {
            _Tasks.addTask(rmName, 
                {   type: "mine",
                    subtype: "harvest",
                    resource: "energy",
                    id: sources[i].id,
                    pos: sources[i].pos,
                    timer: 15,
                    creeps: 2,
                    priority: 1
                });
        }

        let minerals = room.find(FIND_MINERALS, { filter: (m) => { return m.mineralAmount > 0; }});
        for (let i in minerals) {
            let look = minerals[i].pos.look();
            for (let l = 0; l < look.length; l++) {
                if (look[l].structure != null && look[l].structure.structureType == "extractor") {
                    _Tasks.addTask(rmName, 
                        {   type: "mine",
                            subtype: "harvest",
                            resource: "mineral",
                            id: minerals[i].id,
                            pos: minerals[i].pos,
                            timer: 20,
                            creeps: 2,
                            priority: 2
                        }); 
                }
            }
        }

        let storages = room.find(FIND_STRUCTURES, { filter: (s) => { 
            return (s.structureType == STRUCTURE_STORAGE)
                || (s.structureType == STRUCTURE_CONTAINER); }});
        for (let i in storages) {            
            if (storages[i].store[RESOURCE_ENERGY] > 0) {
                _Tasks.addTask(rmName, 
                    {   type: "energy",
                        subtype: "withdraw",
                        structure: storages[i].structureType,
                        resource: "energy",
                        id: storages[i].id,
                        pos: storages[i].pos,
                        timer: 10,
                        creeps: 10,
                        priority: 3
                    });
            }
            if (_.sum(storages[i].store) < storages[i].storeCapacity) {
                _Tasks.addTask(rmName, 
                    {   type: "carry",
                        subtype: "deposit",
                        structure: storages[i].structureType,
                        resource: "energy",
                        id: storages[i].id,
                        pos: storages[i].pos,
                        timer: 20,
                        creeps: 10,
                        priority: 9
                    });
                _Tasks.addTask(rmName, 
                    {   type: "carry",
                        subtype: "deposit",
                        structure: storages[i].structureType,
                        resource: "mineral",
                        id: storages[i].id,
                        pos: storages[i].pos,
                        timer: 20,
                        creeps: 10,
                        priority: 9
                    });     
            }
        } 

        if (Memory["_rooms"][rmName]["links"] != null) {
            let links = Memory["_rooms"][rmName]["links"];
            for (let l in links) {
                let link = Game.getObjectById(links[l]["id"]);
                if (links[l]["role"] == "send" && link != null && link.energy < link.energyCapacity * 0.9) {
                    _Tasks.addTask(rmName, 
                    {   type: "carry",
                        subtype: "deposit",
                        structure: "link",
                        resource: "energy",
                        id: links[l]["id"],
                        pos: link.pos,
                        timer: 20,
                        creeps: 1,
                        priority: 3
                     });
                } else if (links[l]["role"] == "receive" && link != null && link.energy > 0) {
                    _Tasks.addTask(rmName, 
                    {   type: "energy",
                        subtype: "withdraw",
                        structure: "link",
                        resource: "energy",
                        id: links[l]["id"],
                        pos: link.pos,
                        timer: 5,
                        creeps: 2,
                        priority: 3
                    });
                }
            }
        }

        let towers = room.find(FIND_MY_STRUCTURES, { filter: (s) => {
            return s.structureType == STRUCTURE_TOWER; }});
        for (let i in towers) {
            if (towers[i].energy < towers[i].energyCapacity * 0.4) {
                _Tasks.addTask(rmName, 
                {   type: "carry",
                    subtype: "deposit",                    
                    resource: "energy",
                    id: towers[i].id,
                    pos: towers[i].pos,
                    structure: towers[i].structureType,
                    timer: 20,
                    creeps: 1,
                    priority: 1 
                });
            } else if (towers[i].energy < towers[i].energyCapacity) {
                _Tasks.addTask(rmName, 
                {   type: "carry",
                    subtype: "deposit",
                    resource: "energy",
                    id: towers[i].id,
                    pos: towers[i].pos,
                    structure: towers[i].structureType,
                    timer: 20,
                    creeps: 1,
                    priority: 5
                });
            }
        }

        structures = room.find(FIND_MY_STRUCTURES, { filter: (s) => {
            return (s.structureType == STRUCTURE_SPAWN && s.energy < s.energyCapacity * 0.85)
                || (s.structureType == STRUCTURE_EXTENSION && s.energy < s.energyCapacity); }});
        for (let i in structures) {
                _Tasks.addTask(rmName, 
                {   type: "carry",
                    subtype: "deposit",
                    resource: "energy",
                    id: structures[i].id,
                    pos: structures[i].pos,
                    structure: structures[i].structureType,
                    timer: 20,
                    creeps: 1,
                    priority: 2 
                });
        }

        /* Cycle through all creeps in the room- remove the task if it"s already taken */
		for (let t in Memory["_tasks"][rmName]) {
			let task = Memory["_tasks"][rmName][t];
			if (task["creeps"] != null) {
				for (let c in Game.creeps) {
					if (Game.creeps[c].room.name == rmName) {
						let creep = Game.creeps[c];
						if (creep.memory.task != null
								&& creep.memory.task.type == task.type && creep.memory.task.subtype == task.subtype
								&& creep.memory.task.id == task.id && creep.memory.task.structure == task.structure
								&& creep.memory.task.resource == task.resource) {
							task["creeps"] -= 1;
						}
					}
				}
				if (task["creeps"] <= 0) {
					delete Memory["_tasks"][rmName][t];
				}
			}
		}  
	}
}

module.exports = _Tasks;