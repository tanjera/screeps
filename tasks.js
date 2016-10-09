module.exports = {

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
			amount:		#
            id:         target gameobject id
            pos:        room position
            timer:      run for x ticks
            goal:       e.g. hp goal for repairing, amount to deposit, etc.
            creeps:     maximum # of creeps to run this task
         */

		if (incTask.key == null)
			console.log(`<font color=\"#FF0000">[Error]</font> Task missing key: ${incTask.room} ${incTask.type} ${incTask.subtype}`);

		if (Memory["rooms"][rmName]["tasks_running"] != null
				&& Memory["rooms"][rmName]["tasks_running"][incTask.key] != null)
			incTask.creeps = Math.max(0, incTask.creeps - Object.keys(Memory["rooms"][rmName]["tasks_running"][incTask.key]).length);

        Memory["rooms"][rmName]["tasks"][incTask.key] = incTask;
	},

	giveTask: function(creep, task) {
        creep.memory.task = task;

		_.set(Memory, ["rooms", task.room, "tasks_running", task.key, creep.name], true);

		if (task["creeps"] != null)
            task["creeps"] -= 1;

		return;
	},

	returnTask: function(creep) {
		let task = creep.memory.task;

		if (task == null)
		    return;

		if (Memory["rooms"][task.room]["tasks_running"] != null && Memory["rooms"][task.room]["tasks_running"][task.key])
			delete Memory["rooms"][task.room]["tasks_running"][task.key][creep.name];
		task.creeps += 1;
		delete creep.memory.task;
	},

    assignTask: function(creep, isRefueling) {
        if (creep.memory.task != null && Object.keys(creep.memory.task).length > 0) {
            return;
        }

		// Assign a boost if needed and available
		let __creep = require("util.creep");
		if (creep.ticksToLive > 1100 && !creep.isBoosted()) {
			let task = _.head(_.filter(Memory["rooms"][creep.room.name]["tasks"],
				t => { return t.type == "boost" && t.role == creep.memory.role && t.subrole == creep.memory.subrole; }));
			if (task != null) {
				this.giveTask(creep, task);
				return;
			}
		}

		// Assign role tasks
        switch (creep.memory.role) {
            default:
                return;

            case "multirole":
            case "worker":
                this.assignTask_Work(creep, isRefueling);
                return;

            case "courier":
                this.assignTask_Industry(creep, isRefueling);
                return;

            case "miner":
            case "burrower":
            case "carrier":
                this.assignTask_Mine(creep, isRefueling);
                return;

            case "extractor":
                this.assignTask_Extract(creep, isRefueling);
                return;
        }
	},

    assignTask_Work: function(creep, isRefueling) {
        let task;

        if (isRefueling) {
            task = _.head(_.sortBy(_.filter(Memory["rooms"][creep.room.name]["tasks"],
                    t => { return t.type == "energy" && (t.creeps == null || t.creeps > 0); }),
                    t => { return creep.pos.getRangeTo(t.pos.x, t.pos.y); }));
            if (task != null) {
				this.giveTask(creep, task);
                return;
            }

            task = _.head(_.sortBy(_.filter(Memory["rooms"][creep.room.name]["tasks"],
                    t => { return t.subtype == "pickup" && t.resource == "energy" && (t.creeps == null || t.creeps > 0); }),
                    t => { return creep.pos.getRangeTo(t.pos.x, t.pos.y); }));
            if (task != null) {
				this.giveTask(creep, task);
                return;
            }

            task = _.head(_.sortBy(_.filter(Memory["rooms"][creep.room.name]["tasks"],
                    t => { return t.type == "mine" && t.resource == "energy" && (t.creeps == null || t.creeps > 0); }),
                    t => { return creep.pos.getRangeTo(t.pos.x, t.pos.y); }));
            if (task != null) {
				this.giveTask(creep, task);
                return;
            }
        } else {
            if (creep.memory.subrole == "repairer") {
                task = _.head(_.sortBy(_.sortBy(_.filter(Memory["rooms"][creep.room.name]["tasks"],
                        t => { return t.type == "work" && t.subtype == "repair" && (t.creeps == null || t.creeps > 0); }),
                        t => { return creep.pos.getRangeTo(t.pos.x, t.pos.y); }),
                        "priority"));
            } else if (creep.memory.subrole == "upgrader") {
                task = _.head(_.sortBy(_.filter(Memory["rooms"][creep.room.name]["tasks"],
						t => { return t.type == "work" && t.subtype == "upgrade" && (t.creeps == null || t.creeps > 0); }),
						"priority"));
            } else {
                task = _.head(_.sortBy(_.sortBy(_.filter(Memory["rooms"][creep.room.name]["tasks"],
                        t => { return t.type == "work" && (t.creeps == null || t.creeps > 0); }),
                        t => { return creep.pos.getRangeTo(t.pos.x, t.pos.y); }),
                        "priority"));
            }

            if (task != null) {
                this.giveTask(creep, task);
                return;
            } else {
				this.giveTask(creep, {type: "wait", subtype: "wait", timer: 10});
                return;
			}
        }
	},

    assignTask_Industry: function(creep, isRefueling) {
        let task;

        if (isRefueling) {
            task = _.head(_.sortBy(_.sortBy(_.filter(Memory["rooms"][creep.room.name]["tasks"],
                    t => { return t.type == "industry" && t.subtype == "withdraw" && (t.creeps == null || t.creeps > 0); }),
                    t => { return creep.pos.getRangeTo(t.pos.x, t.pos.y); }),
                    "priority"));
            if (task != null) {
                    this.giveTask(creep, task);
                return;
            } else {    // If no tasks, then wait
                this.giveTask(creep, {type: "wait", subtype: "wait", timer: 10});
                return;
            }
        } else {
            let resources = _.sortBy(Object.keys(creep.carry), (c) => { return -creep.carry[c]; });
            resources = Object.keys(resources).length > 0 ? resources[0] : "energy";
            task = _.head(_.sortBy(_.sortBy(_.filter(Memory["rooms"][creep.room.name]["tasks"],
                    t => { return t.type == "industry" && t.subtype == "deposit" && t.resource == resources && (t.creeps == null || t.creeps > 0); }),
                    t => { return creep.pos.getRangeTo(t.pos.x, t.pos.y); }),
                    "priority"));
            if (task != null) {
                    this.giveTask(creep, task);
                return;
            }

            // If stuck without a task... drop off energy/minerals in storage... or wait...
            if (Object.keys(creep.carry).includes("energy")) {
				task = _.head(_.sortBy(_.filter(Memory["rooms"][creep.room.name]["tasks"],
						t => { return t.type == "carry" && t.resource == "energy" && (t.creeps == null || t.creeps > 0); }),
						t => { return creep.pos.getRangeTo(t.pos.x, t.pos.y); }));
				if (task != null) {
                    this.giveTask(creep, task);
					return;
				}
			} else if (Object.keys(creep.carry).length > 0) {
				task = _.head(_.sortBy(_.filter(Memory["rooms"][creep.room.name]["tasks"],
						t => { return t.type == "carry" && t.resource == "mineral" && (t.creeps == null || t.creeps > 0); }),
						t => { return creep.pos.getRangeTo(t.pos.x, t.pos.y); }));
				if (task != null) {
                    this.giveTask(creep, task);
					return;
				}
            } else {
                this.giveTask(creep, {type: "wait", subtype: "wait", timer: 10});
                return;
            }
        }
	},

    assignTask_Mine: function(creep, isRefueling) {
        let task;

        if (isRefueling) {
            if (creep.room.name != creep.memory.room) {
                let _Creep = require("util.creep");
                _Creep.moveToRoom(creep, creep.memory.room, isRefueling);
                return;
            }

            if (creep.memory.role == "burrower") {
                task = _.head(_.sortBy(_.filter(Memory["rooms"][creep.room.name]["tasks"],
                        t => { return t.type == "mine" && t.resource == "energy" && (t.creeps == null || t.creeps > 0); }),
                        t => { return creep.pos.getRangeTo(t.pos.x, t.pos.y); }));
                if (task != null) {
                    this.giveTask(creep, task);
                    return;
                }
            }
            else if (creep.memory.role == "miner" || creep.memory.role == "carrier") {
                task = _.head(_.sortBy(_.sortBy(_.filter(Memory["rooms"][creep.room.name]["tasks"],
                        t => { return ((t.subtype == "pickup" && t.resource == "energy") || (t.type == "energy" && t.structure != "link"))
							&& (t.creeps == null || t.creeps > 0); }),
                        t => { return creep.pos.getRangeTo(t.pos.x, t.pos.y); }),
                        "priority"));
                if (task != null) {
                    this.giveTask(creep, task);
                    return;
                }

                if (creep.getActiveBodyparts("work") > 0) {
                    task = _.head(_.sortBy(_.filter(Memory["rooms"][creep.room.name]["tasks"],
                        t => { return t.type == "mine" && t.resource == "energy" && (t.creeps == null || t.creeps > 0); }),
                        t => { return creep.pos.getRangeTo(t.pos.x, t.pos.y); }));
                    if (task != null) {
						this.giveTask(creep, task);
                        return;
                    }
                }

                if (creep.memory.task == null) {
                    // If there is no energy to get... deliver or wait.
                    if (_.sum(creep.carry) > creep.carryCapacity * 0.85) {
                        creep.memory.state = "delivering";
                        return;
                    } else {
                        this.giveTask(creep, {type: "wait", subtype: "wait", timer: 5});
                        return;
                    }
                }
            }
        } else {
            if (creep.room.name != creep.memory.colony) {
                let _Creep = require("util.creep");
                _Creep.moveToRoom(creep, creep.memory.colony, isRefueling);
                return;
            }

            task = _.head(_.sortBy(_.sortBy(_.filter(Memory["rooms"][creep.room.name]["tasks"],
                    t => { return t.type == "carry" && t.subtype == "deposit" && t.resource == "energy" && (t.creeps == null || t.creeps > 0); }),
                    t => { return creep.pos.getRangeTo(t.pos.x, t.pos.y); }),
                    "priority"));
            if (task != null) {
				this.giveTask(creep, task);
                return;
            }
        }
	},

    assignTask_Extract: function(creep, isRefueling) {
        let task;

        if (isRefueling) {
            if (creep.room.name != creep.memory.room) {
                let _Creep = require("util.creep");
                _Creep.moveToRoom(creep, creep.memory.room, isRefueling);
                return;
            }

			task = _.head(_.sortBy(_.sortBy(_.filter(Memory["rooms"][creep.room.name]["tasks"],
				t => { return t.subtype == "pickup" && t.resource == "mineral" && (t.creeps == null || t.creeps > 0); }),
				t => { return creep.pos.getRangeTo(t.pos.x, t.pos.y); }),
					"priority"));
			if (task != null) {
				this.giveTask(creep, task);
				return;
			}

            task = _.head(_.sortBy(_.filter(Memory["rooms"][creep.room.name]["tasks"],
                t => { return t.type == "mine" && t.resource == "mineral" && (t.creeps == null || t.creeps > 0); }),
                t => { return creep.pos.getRangeTo(t.pos.x, t.pos.y); }));
            if (task != null) {
				this.giveTask(creep, task);
                return;
            }

        } else {
            if (creep.room.name != creep.memory.colony) {
                let _Creep = require("util.creep");
                _Creep.moveToRoom(creep, creep.memory.colony, isRefueling);
                return;
            }

            task = _.head(_.sortBy(_.sortBy(_.filter(Memory["rooms"][creep.room.name]["tasks"],
				t => { return t.type == "carry" && t.resource == "mineral" && (t.creeps == null || t.creeps > 0); }),
				t => { return creep.pos.getRangeTo(t.pos.x, t.pos.y); }),
				"priority"));
            if (task != null) {
				this.giveTask(creep, task);
                return;
            }
        }
	},

    compileTasks: function (rmName) {
        var structures;
        let __Colony = require("util.colony");
        let room = Game.rooms[rmName];
		let amOwner = (room.controller == null || room.controller.level == 0) ? false : room.controller.my;

        /* Worker-based tasks (upgrading controllers, building and maintaining structures) */
        if (amOwner) {
            if (room.controller.ticksToDowngrade < 3500) {
                this.addTask(rmName,
                    {   room: rmName,
						type: "work",
                        subtype: "upgrade",
                        id: room.controller.id,
                        pos: room.controller.pos,
						key: `work:upgrade-${room.controller.id}`,
                        timer: 20,
                        creeps: 15,
                        priority: 1
                    });
            } else {
                this.addTask(rmName,
                    {   room: rmName,
						type: "work",
                        subtype: "upgrade",
                        id: room.controller.id,
                        pos: room.controller.pos,
						key: `work:upgrade-${room.controller.id}`,
                        timer: 20,
                        creeps: 20,
                        priority: 5
                    });
            }
        }

        structures = __Colony.findByNeed_RepairMaintenance(room);
        for (let i in structures) {
			if (amOwner || structures[i].structureType == "road" || structures[i].structureType == "container") {
				this.addTask(rmName,
					{   room: rmName,
						type: "work",
						subtype: "repair",
						id: structures[i].id,
						pos: structures[i].pos,
						key: `work:repair-${structures[i].id}`,
						timer: 20,
						creeps: 2,
						priority: 6
					});
			}
        }

		structures = __Colony.findByNeed_RepairCritical(room);
        for (let i in structures) {
			if (amOwner || structures[i].structureType == "road" || structures[i].structureType == "container") {
				this.addTask(rmName,
					{   room: rmName,
						type: "work",
						subtype: "repair",
						id: structures[i].id,
						pos: structures[i].pos,
						key: `work:repair-${structures[i].id}`,
						timer: 20,
						creeps: 2,
						priority: 2
					});
			}
        }

        structures = room.find(FIND_CONSTRUCTION_SITES, { filter: s => { return s.my; }});
        for (let i in structures) {
			this.addTask(rmName,
				{   room: rmName,
					type: "work",
					subtype: "build",
					id: structures[i].id,
					pos: structures[i].pos,
					key: `work:build-${structures[i].id}`,
					timer: 30,
					creeps: 3,
					priority: 3
				});			
        }

        /* Carrier-based tasks & energy supply for workers) */
        let piles = room.find(FIND_DROPPED_ENERGY);
        for (let i in piles) {
            this.addTask(rmName,
                {   room: rmName,
					type: "carry",
                    subtype: "pickup",
                    resource: piles[i].resourceType == "energy" ? "energy" : "mineral",
                    id: piles[i].id,
                    pos: piles[i].pos,
					key: `carry:pickup-${piles[i].id}`,
                    timer: 15,
                    creeps: Math.ceil(piles[i].amount / 1000),
                    priority: 1
                });
        }

        let sources = room.find(FIND_SOURCES, { filter: s => { return s.energy > 0; }});
        for (let i in sources) {
			let container = _.head(sources[i].pos.findInRange(FIND_STRUCTURES, 1, { filter:
				s => { return s.structureType == "container"; } }));
            this.addTask(rmName,
                {   room: rmName,
					type: "mine",
                    subtype: "harvest",
                    resource: "energy",
                    id: sources[i].id,
                    pos: (container != null ? container.pos : sources[i].pos),
					key: `mine:harvest-${sources[i].id}`,
                    timer: 60,
                    creeps: sources[i].pos.getAccessAmount(),
                    priority: 1
                });
        }

        let minerals = room.find(FIND_MINERALS, { filter: m => { return m.mineralAmount > 0; }});
        for (let i in minerals) {
            let look = minerals[i].pos.look();
            for (let l = 0; l < look.length; l++) {
                if (look[l].structure != null && look[l].structure.structureType == "extractor") {
                    this.addTask(rmName,
                        {   room: rmName,
							type: "mine",
                            subtype: "harvest",
                            resource: "mineral",
                            id: minerals[i].id,
                            pos: minerals[i].pos,
							key: `mine:harvest-${minerals[i].id}`,
                            timer: 20,
                            creeps: 2,
                            priority: 2
                        });
                }
            }
        }

        let storages = room.find(FIND_STRUCTURES, { filter: s => {
            return (s.structureType == STRUCTURE_STORAGE && s.my)
                || (s.structureType == STRUCTURE_CONTAINER); }});
        for (let i in storages) {
            if (storages[i].store["energy"] > 0) {
                this.addTask(rmName,
                    {   room: rmName,
						type: "energy",
                        subtype: "withdraw",
                        structure: storages[i].structureType,
                        resource: "energy",
                        id: storages[i].id,
                        pos: storages[i].pos,
						key: `energy:withdraw-energy-${storages[i].id}`,
                        timer: 10,
                        creeps: Math.ceil(storages[i].store["energy"] / 1000),
                        priority: 3
                    });
            }
            if (_.sum(storages[i].store) < storages[i].storeCapacity) {
                this.addTask(rmName,
                    {   room: rmName,
						type: "carry",
                        subtype: "deposit",
                        structure: storages[i].structureType,
                        resource: "energy",
                        id: storages[i].id,
                        pos: storages[i].pos,
						key: `carry:deposit-energy-${storages[i].id}`,
                        timer: 20,
                        creeps: 10,
                        priority: (storages[i].structureType == "storage" ? 8 : 9)
                    });
				if (storages[i].structureType == "storage") {
					this.addTask(rmName,
						{   room: rmName,
							type: "carry",
							subtype: "deposit",
							structure: storages[i].structureType,
							resource: "mineral",
							id: storages[i].id,
							pos: storages[i].pos,
							key: `carry:deposit-mineral-${storages[i].id}`,
							timer: 20,
							creeps: 10,
							priority: 9
						});
				}
            }
        }

		if (amOwner) {
			if (Memory["rooms"][rmName]["links"] != null) {
				let links = Memory["rooms"][rmName]["links"];
				for (let l in links) {
					let link = Game.getObjectById(links[l]["id"]);
					if (links[l]["role"] == "send" && link != null && link.energy < link.energyCapacity * 0.9) {
						this.addTask(rmName,
						{   room: rmName,
							type: "carry",
							subtype: "deposit",
							structure: "link",
							resource: "energy",
							id: links[l]["id"],
							pos: link.pos,
							key: `carry:deposit-${links[l]["id"]}`,
							timer: 20,
							creeps: 1,
							priority: 3
						 });
					} else if (links[l]["role"] == "receive" && link != null && link.energy > 0) {
						this.addTask(rmName,
						{   room: rmName,
							type: "energy",
							subtype: "withdraw",
							structure: "link",
							resource: "energy",
							id: links[l]["id"],
							pos: link.pos,
							key: `energy:withdraw-${links[l]["id"]}`,
							timer: 5,
							creeps: 2,
							priority: 3
						});
					}
				}
			}
			
			let towers = room.find(FIND_MY_STRUCTURES, { filter: s => {
				return s.structureType == STRUCTURE_TOWER; }});
			for (let i in towers) {
				if (towers[i].energy < towers[i].energyCapacity * 0.4) {
					this.addTask(rmName,
					{   room: rmName,
						type: "carry",
						subtype: "deposit",
						structure: "tower",
						resource: "energy",
						id: towers[i].id,
						pos: towers[i].pos,
						key: `carry:deposit-${towers[i].id}`,
						timer: 30,
						creeps: 1,
						priority: 1
					});
				} else if (towers[i].energy < towers[i].energyCapacity) {
					this.addTask(rmName,
					{   room: rmName,
						type: "carry",
						subtype: "deposit",
						structure: "tower",
						resource: "energy",
						id: towers[i].id,
						pos: towers[i].pos,
						key: `carry:deposit-${towers[i].id}`,
						timer: 30,
						creeps: 1,
						priority: 5
					});
				}
			}
			
			structures = room.find(FIND_MY_STRUCTURES, { filter: s => {
				return (s.structureType == STRUCTURE_SPAWN && s.energy < s.energyCapacity * 0.85)
					|| (s.structureType == STRUCTURE_EXTENSION && s.energy < s.energyCapacity); }});
			for (let i in structures) {
				this.addTask(rmName,
				{   room: rmName,
					type: "carry",
					subtype: "deposit",
					structure: structures[i].structureType,
					resource: "energy",
					id: structures[i].id,
					pos: structures[i].pos,
					key: `carry:deposit-${structures[i].id}`,
					timer: 20,
					creeps: 1,
					priority: 2
				});
			}
		}
	},	
}