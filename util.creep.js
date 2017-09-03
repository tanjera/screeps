let Hive = require("hive");
let _CPU = require("util.cpu");

module.exports = {

	finishedTask: function(creep) {
		let task = creep.memory.task;
		if (_.has(Memory, ["rooms", task.room, "tasks_running", task.key]))
			delete Memory["rooms"][task.room]["tasks_running"][task.key][creep.name];
		delete creep.memory.task;
	},

	returnTask: function(creep) {
		let task = creep.memory.task;
		if (_.has(Memory, ["rooms", task.room, "tasks_running", task.key]))
			delete Memory["rooms"][task.room]["tasks_running"][task.key][creep.name];
		task.creeps += 1;
		delete creep.memory.task;
	},

    runTaskTimer: function(creep) {
        if (creep.memory.task == null) {
            return false;
        }
        else if (creep.memory.task["timer"] != null) {
			let task = creep.memory.task;
            task["timer"] = task["timer"] - 1;
            if (task["timer"] <= 0) {

				// Prevent burrower from losing task on task refresh, getting blocked by workers
				if (creep.memory.role == "burrower" && task.subtype == "harvest" && task.resource == "energy"
						&& Game.getObjectById(task.id).energy > 0) {
					return true;
				}

				this.returnTask(creep);
                return false;
            }
        }

        return true;
	},

    runTask: function(creep) {
        switch (creep.memory.task["subtype"]) {
            case "wait":
                return;

			case "boost": {
				let lab = Game.getObjectById(creep.memory.task["id"]);
                if (!creep.pos.inRangeTo(lab, 1)) {
                    creep.moveTo(lab, {reusePath: Hive.moveReusePath()});
					return;
                } else {    // Wait out timer- should be boosted by then.
                    return;
                }
			}

            case "pickup": {
                let obj = Game.getObjectById(creep.memory.task["id"]);
                if (creep.pickup(obj) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(obj, {reusePath: Hive.moveReusePath()});
					return;
                } else {    // Action takes one tick... task complete... delete task...
                    this.finishedTask(creep);
                    return;
                }
            }

            case "withdraw": {
                let obj = Game.getObjectById(creep.memory.task["id"]);
                if (creep.withdraw(obj, creep.memory.task["resource"],
						(creep.memory.task["amount"] > creep.carryCapacity - _.sum(creep.carry) ? null : creep.memory.task["amount"]))
						== ERR_NOT_IN_RANGE) {
                    creep.moveTo(obj, {reusePath: Hive.moveReusePath()});
                    return;
                } else {    // Action takes one tick... task complete... delete task...
                    this.finishedTask(creep);
                    return;
                }
            }

            case "harvest": {
                let obj = Game.getObjectById(creep.memory.task["id"]);
                let pos = new RoomPosition(creep.memory.task["pos"].x, creep.memory.task["pos"].y, creep.memory.task["pos"].roomName);
				let result = creep.harvest(obj);
                if (result == ERR_NOT_IN_RANGE) {
					if (_.filter(pos.look(), n => n.type == "creep").length == 0)
						creep.moveTo(pos, {reusePath: Hive.moveReusePath()});
					else
						creep.moveTo(obj, {reusePath: Hive.moveReusePath()});
					return;
                } else if (result == OK || result == ERR_TIRED) {
					if (!creep.pos.isEqualTo(pos))
						creep.moveTo(pos, {reusePath: Hive.moveReusePath()});
                    return;
                } else {
					this.finishedTask(creep);
					return;
				}
            }

            case "upgrade": {
                let controller = Game.getObjectById(creep.memory.task["id"]);
                let result = creep.upgradeController(controller);
                if (result == ERR_NOT_IN_RANGE) {
                    creep.moveTo(controller, {reusePath: Hive.moveReusePath()});
                    return;
                } else if (result != OK) {
                    this.finishedTask(creep);
                    return;
                } else { return; }
            }

            case "sign": {
                let controller = Game.getObjectById(creep.memory.task["id"]);
                let message = creep.memory.task["message"];
                let result = creep.signController(controller, message);
                if (result == ERR_NOT_IN_RANGE) {
                    creep.moveTo(controller, {reusePath: Hive.moveReusePath()});
                    return;
                } else if (result != OK) {
                    this.finishedTask(creep);
                    return;
                } else { return; }
            }

            case "repair": {
                let structure = Game.getObjectById(creep.memory.task["id"]);
                let result = creep.repair(structure);
                if (result == ERR_NOT_IN_RANGE) {
                    creep.moveTo(structure, {reusePath: Hive.moveReusePath()});
					return;
                } else if (result != OK || structure.hits == structure.hitsMax) {
                    this.finishedTask(creep);
                    return;
                } else { return; }
            }

            case "build": {
                let structure = Game.getObjectById(creep.memory.task["id"]);
                let result = creep.build(structure);
                if (result == ERR_NOT_IN_RANGE) {
                    creep.moveTo(structure, {reusePath: Hive.moveReusePath()});
					return;
                } else if (result != OK) {
                    this.finishedTask(creep);
                    return;
                } else { return; }
            }

            case "deposit": {
				let target = Game.getObjectById(creep.memory.task["id"]);
				switch (creep.memory.task["resource"]) {

					default:
					case "energy":
						if (target != null && creep.transfer(target, creep.memory.task["resource"]) == ERR_NOT_IN_RANGE) {
							creep.moveTo(target, {reusePath: Hive.moveReusePath()});
							return;
						} else {
							this.finishedTask(creep);
							return;
						}
						return;

					case "mineral":		// All except energy
						for (let r = Object.keys(creep.carry).length; r > 0; r--) {
							let resourceType = Object.keys(creep.carry)[r - 1];
							if (resourceType == "energy") {
								continue;
							} else if (target != null && creep.transfer(target, resourceType) == ERR_NOT_IN_RANGE) {
								creep.moveTo(target, {reusePath: Hive.moveReusePath()});
								return;
							} else {
								this.finishedTask(creep);
								return;
							}
						}
						return;
				}
            }
        }
    },

    moveToRoom: function(creep, tgtRoom, forwardRoute) {
        if (creep.room.name == tgtRoom) {
            console.log("Error: trying to move creep " + creep.name + " to its own room... check logic!!!");
            return;
        }

		if (creep.memory.listRoute != null) {
            if (forwardRoute == true) {
                for (let i = 1; i < creep.memory.listRoute.length; i++) {
                    if (creep.room.name == creep.memory.listRoute[i - 1]) {
                        if (creep.moveTo(new RoomPosition(25, 25, creep.memory.listRoute[i]), {reusePath: Hive.moveReusePath()}) == ERR_NO_PATH)
                            creep.moveTo(new RoomPosition(25, 25, creep.memory.listRoute[i]), {maxOps: 5000, reusePath: Hive.moveReusePath()});
                        return;
                    }
                }
            } else if (forwardRoute == false) {
                for (let i = creep.memory.listRoute.length - 2; i >= 0; i--) {
                    if (creep.room.name == creep.memory.listRoute[i + 1]) {
                        if (creep.moveTo(new RoomPosition(25, 25, creep.memory.listRoute[i]), {reusePath: Hive.moveReusePath()}) == ERR_NO_PATH)
                            creep.moveTo(new RoomPosition(25, 25, creep.memory.listRoute[i]), {maxOps: 5000, reusePath: Hive.moveReusePath()});                        
                        return;
                    }
                }
            }
        }

		if (creep.memory.route == null || creep.memory.route.length == 0 || creep.memory.route == ERR_NO_PATH
                || creep.memory.route[0].room == creep.room.name || creep.memory.exit == null
                || creep.memory.exit.roomName != creep.room.name) {

            creep.memory.route = Game.map.findRoute(creep.room, tgtRoom);

            if (creep.memory.route == ERR_NO_PATH) {
                delete creep.memory.route;
                return;
            }
            creep.memory.exit = creep.pos.findClosestByPath(creep.memory.route[0].exit);
        }

        if (creep.memory.exit) {
            creep.moveTo(new RoomPosition(creep.memory.exit.x, creep.memory.exit.y, creep.memory.exit.roomName), {reusePath: Hive.moveReusePath()});
        }
	},

    moveFrom: function(creep, target) {
        let tgtDir = creep.pos.getDirectionTo(target);
        let moveDir;

        switch (tgtDir) {
            default:
            case TOP:           moveDir = BOTTOM;       break;
			case TOP_RIGHT:     moveDir = BOTTOM_LEFT;  break;
			case RIGHT:         moveDir = LEFT;         break;
			case BOTTOM_RIGHT:  moveDir = TOP_LEFT;     break;
			case BOTTOM:        moveDir = TOP;          break;
			case BOTTOM_LEFT:   moveDir = TOP_RIGHT;    break;
			case LEFT:          moveDir = RIGHT;        break;
			case TOP_LEFT:      moveDir = BOTTOM_RIGHT; break;
        }

        return creep.move(moveDir);
    },

    getBody: function(type, level) {
		_Body = require("util.creep.body");

        switch (type) {
            case "soldier": return _Body.getBody_Soldier(level);
			case "brawler": return _Body.getBody_Brawler(level);
            case "paladin": return _Body.getBody_Paladin(level);
            case "tank": return _Body.getBody_Tank(level);
            case "archer": return _Body.getBody_Archer(level);
            case "healer": return _Body.getBody_Healer(level);
            case "multirole": return _Body.getBody_Multirole(level);
            case "worker": return _Body.getBody_Worker(level);
			case "worker_at": return _Body.getBody_Worker_AT(level);
            case "burrower": return _Body.getBody_Burrower(level);
			case "burrower_at": return _Body.getBody_Burrower_AT(level);
			case "extractor": return _Body.getBody_Extractor(level);
			case "extractor_rem": return _Body.getBody_Extractor_REM(level);
            case "courier":
            case "carrier": return _Body.getBody_Carrier(level);
            case "carrier_at": return _Body.getBody_Carrier_AT(level);
            case "reserver": return _Body.getBody_Reserver(level);
			case "reserver_at": return _Body.getBody_Reserver_AT(level);
        }
	},
};
