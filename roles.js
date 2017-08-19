let _Creep = require("util.creep");
let Tasks = require("tasks");

module.exports = {

    Worker: function(creep, isSafe) {
        let hostile = (isSafe == true)
			? _.head(creep.pos.findInRange(FIND_HOSTILE_CREEPS, 6, { filter:
				c => { return _.get(Memory, ["hive", "allies"]).indexOf(c.owner.username) < 0; }}))
			: null;

		if (hostile == null) {
			if (creep.memory.state == "refueling") {
				if (_.sum(creep.carry) == creep.carryCapacity) {
					creep.memory.state = "working";
					Tasks.returnTask(creep);
					return;
				}

				Tasks.assignTask(creep, true);
				if (_Creep.runTaskTimer(creep)) {
					_Creep.runTask(creep);
				}
				return;

			} else if (creep.memory.state == "working") {
				if (creep.carry[RESOURCE_ENERGY] == 0) {
						creep.memory.state = "refueling";
						Tasks.returnTask(creep);
						return;
					}

				Tasks.assignTask(creep, false);
				if (_Creep.runTaskTimer(creep)) {
					_Creep.runTask(creep);
				}
				return;

			} else {
				creep.memory.state = "refueling";
				return;
			}
		} else if (hostile != null) {
			let _Creep = require("util.creep");
			_Creep.moveFrom(creep, hostile);
			return;
		}
	},

    Mining: function(creep, isSafe) {
		let hostile = (isSafe == true)
			? _.head(creep.pos.findInRange(FIND_HOSTILE_CREEPS, 6, { filter:
				c => { return _.get(Memory, ["hive", "allies"]).indexOf(c.owner.username) < 0; }}))
			: null;

		if (hostile == null) {
			if (creep.memory.state == "refueling") {
				if (creep.carryCapacity > 0 && _.sum(creep.carry) == creep.carryCapacity) {
					creep.memory.state = "delivering";
					Tasks.returnTask(creep);
					return;
				}

				Tasks.assignTask(creep, true);
				if (_Creep.runTaskTimer(creep)) {
					_Creep.runTask(creep);
				}
				return;

			} else if (creep.memory.state == "delivering") {
				if (creep.carryCapacity == 0 || _.sum(creep.carry) == 0) {
					creep.memory.state = "refueling";
					Tasks.returnTask(creep);
					return;
				}

				Tasks.assignTask(creep, false);
				if (_Creep.runTaskTimer(creep)) {
					_Creep.runTask(creep);
				}
				return;

			} else {
				creep.memory.state = "refueling";
				return;
			}
		} else if (hostile != null) {
			let _Creep = require("util.creep");
			_Creep.moveFrom(creep, hostile);
			return;
		}
	},

    Courier: function(creep) {
        if (creep.memory.room != null && creep.room.name != creep.memory.room) {
            _Creep.moveToRoom(creep, creep.memory.room);
        }
        else if (creep.memory.state == "loading") {
            if (_.sum(creep.carry) > 0) {
                creep.memory.state = "delivering";
                Tasks.returnTask(creep);
                return;
            }

            Tasks.assignTask(creep, true);
            if (_Creep.runTaskTimer(creep)) {
                _Creep.runTask(creep);
            }
            return;

        } else if (creep.memory.state == "delivering") {
            if (_.sum(creep.carry) == 0) {
                    creep.memory.state = "loading";
                    Tasks.returnTask(creep);
                    return;
                }

            Tasks.assignTask(creep, false);
            if (_Creep.runTaskTimer(creep)) {
                _Creep.runTask(creep);
            }
            return;

        } else {
            creep.memory.state = "loading";
            return;
        } },

    Extracter: function(creep, isSafe) {
		let hostile = (isSafe == true)
			? _.head(creep.pos.findInRange(FIND_HOSTILE_CREEPS, 6, { filter:
				c => { return _.get(Memory, ["hive", "allies"]).indexOf(c.owner.username) < 0; }}))
			: null;

		if (hostile == null) {
			switch (creep.memory.state) {
				default:
				case "get_minerals":
					if (_.sum(creep.carry) == creep.carryCapacity) {
						creep.memory.state = "deliver";
						Tasks.returnTask(creep);
						return;
					}

					Tasks.assignTask(creep, true);
					if (_Creep.runTaskTimer(creep)) {
						_Creep.runTask(creep);
					}
				return;

				case "deliver":
					if (_.sum(creep.carry) == 0) {
						creep.memory.state = "get_minerals";
						Tasks.returnTask(creep);
						return;
					}

					Tasks.assignTask(creep, false);
					if (_Creep.runTaskTimer(creep)) {
						_Creep.runTask(creep);
					}
				return;
			}
		} else if (hostile != null) {
			let _Creep = require("util.creep");
			_Creep.moveFrom(creep, hostile);
			return;
		}
	},

    Reserver: function(creep) {
        if (creep.memory.room != null && creep.room.name != creep.memory.room) {
            _Creep.moveToRoom(creep, creep.memory.room, true);
            return;
        }

		let result = creep.reserveController(creep.room.controller);
		if (result == ERR_NOT_IN_RANGE) {
			creep.moveTo(creep.room.controller)
			return;
		} else if (result == OK) {

			if (Game.time % 50 == 0) {
				let room_sign = _.get(Memory, ["hive", "signs", creep.room.name]);
				let default_sign = _.get(Memory, ["hive", "signs", "default"]);
				if (room_sign != null && creep.room.controller.sign != room_sign)
					creep.signController(creep.room.controller, room_sign);
				else if (room_sign == null && default_sign != null && creep.room.controller.sign != default_sign)
					creep.signController(creep.room.controller, default_sign);
			}

			if (Game.time % 5 == 0) {  // Don't park next to a source (and possibly block it!)
				let sources = creep.pos.findInRange(FIND_SOURCES, 1);
				if (sources != null && sources.length > 0) {
					let __creep = require("util.creep");
					__creep.moveFrom(creep, sources[0]);
				}
			}
			return;
		}
	},

	Colonizer: function(creep) {
        if (creep.memory.room != null && creep.room.name != creep.memory.room) {
            _Creep.moveToRoom(creep, creep.memory.room, true);
            return;
        }

		let result = creep.claimController(creep.room.controller);
		if (result == ERR_NOT_IN_RANGE) {
			creep.moveTo(creep.room.controller)
			return;
		} else {
			let request = _.get(Memory, ["sites", "colonization", creep.memory.room]);			
			if (_.get(request, ["target"]) == creep.room.name && creep.room.controller.my) {
				delete Memory["sites"]["colonization"][creep.room.name];
				_.set(Memory, ["rooms", creep.room.name, "spawn_assist", "rooms"], [_.get(request, ["from"])]);
				_.set(Memory, ["rooms", creep.room.name, "spawn_assist", "route"], _.get(request, ["listRoute"]));
				_.set(Memory, ["rooms", creep.room.name, "layout"], _.get(request, "layout"));
				_.set(Memory, ["hive", "pulses", "blueprint", "request"], creep.room.name);
				creep.suicide();
			} else if (result != OK) {
				console.log(`<font color=\"#F0FF00\">[Colonization]</font> ${creep.name} unable to colonize ${_.get(request, ["target"])}; error ${result}`);
			}
			return;
		}
	},

    Soldier: function(creep, targetStructures, targetCreeps, listTargets) {
		let _Combat = require("roles.combat");
		
		if (creep.room.name == creep.memory.colony) {
			if (creep.memory.boost == null && !creep.isBoosted()) {
				if (_Combat.seekBoost(creep))
					return;
			} else if (creep.memory.boost != null && !creep.isBoosted()) {
				creep.moveTo(creep.memory.boost.pos.x, creep.memory.boost.pos.y);
				return;
			}
		}

		if (creep.memory.room != null && creep.room.name != creep.memory.room
				&& creep.memory.target == null) {	// Prevent room edge fighting from breaking logic...
			_Creep.moveToRoom(creep, creep.memory.room, true);
			return;
		}
		
		_Combat.checkTarget_Existing(creep);
		_Combat.acquireTarget_ListTarget(creep, listTargets);
		
		if (targetCreeps)
			_Combat.acquireTarget_Creep(creep);		
		if (targetStructures) 
			_Combat.acquireTarget_Structure(creep);

		if (creep.memory.target != null) {
			let target = Game.getObjectById(creep.memory.target);

			creep.rangedAttack(target);
			let result = creep.attack(target);

			if (result == ERR_NOT_IN_RANGE || (result == ERR_INVALID_TARGET && target instanceof ConstructionSite == true)) {
				creep.heal(creep);

				if (creep.memory.healer != null) {
					let healer = Game.getObjectById(creep.memory.healer);

					if (healer == null)
						creep.memory.healer = null;
					else if (creep.pos.getRangeTo(healer) > 1) {
						creep.moveTo(healer);
						return;
					}
				}

				creep.moveTo(target);
				return;
			} else if (result == OK) {
				return;
			} else {
				creep.heal(creep);
				return;
			}
		} else {
			_Combat.moveTo_SourceKeeperLair(creep);
			creep.heal(creep);
			return;
		}
	},

	Archer: function(creep, destroyStructures, listTargets) {
		if (creep.memory.room != null && creep.room.name != creep.memory.room) {
			_Creep.moveToRoom(creep, creep.memory.room);
			return;
        }

		let target;

		if (creep.memory.target != null) {
			target = Game.getObjectById(creep.memory.target);
			if (target == null)
				delete creep.memory.target;
		}

		if (creep.memory.target == null) {
			for (let t in listTargets) {
				target = Game.getObjectById(listTargets[t]);
				if (target != null) {
					creep.memory.target = target.id;
					break;
				}
			}
		}

		if (creep.memory.target == null) {
			target = creep.pos.findClosestByRange(FIND_HOSTILE_CREEPS, { filter:
				(c) => { return _.get(Memory, ["hive", "allies"]).indexOf(c.owner.username) < 0; }});
			if (target != null)
				creep.memory.target = target.id;
		}

		if (creep.memory.target == null && destroyStructures != null && destroyStructures == true) {
			target = _.head(_.sortBy(_.sortBy(_.sortBy(creep.room.find(FIND_STRUCTURES, { filter:
				s => { return s.hits != null && s.hits > 0
					&& (s.owner == null || _.get(Memory, ["hive", "allies"]).indexOf(s.owner.username) < 0); }}),
				s => { return creep.pos.getRangeTo(s.pos); } ),
				s => { return s.hits; } ),	// Sort by hits to prevent attacking massive ramparts/walls forever
				s => { 	if (s.structureType == "tower")
							return 0;
						else if (s.structureType == "spawn")
							return 1;
						else
							return 2;
				} ));

			if (target != null)
				creep.memory.target = target.id;
		}

		if (creep.memory.target != null) {
			target = Game.getObjectById(creep.memory.target);
			let result = creep.rangedAttack(target);
			if (result == ERR_NOT_IN_RANGE) {
				creep.heal(creep);
				creep.moveTo(target);
				return;
			} else if (result == OK && creep.pos.getRangeTo(target < 3)) {
				let _Creep = require("util.creep");
				_Creep.moveFrom(creep, target);
				return;
			} else if (result == OK) {
				return;
			} else {
				creep.heal(creep);
			}
		}
		else {
			creep.heal(creep);
			return;
		}
	},

    Healer: function(creep) {
		if (creep.memory.room != null && creep.room.name != creep.memory.room) {
            _Creep.moveToRoom(creep, creep.memory.room);
			return;
        }

		let wounded = creep.pos.findClosestByRange(FIND_MY_CREEPS, { filter:
			c => { return c.hits < c.hitsMax; }});
		if (wounded != null && creep.heal(wounded) == ERR_NOT_IN_RANGE) {
			creep.rangedHeal(wounded);
			creep.moveTo(wounded);
			return;
		}

		if (creep.hits < creep.hitsMax) {
			creep.heal(creep)
		}

		if (creep.memory.partner == null) {
			let p = _.head(_.sortBy(_.sortBy(creep.pos.findInRange(FIND_MY_CREEPS, 8, { filter: c => { return c.memory.role != "healer" }}),
				c => c.memory.healer != null),
				c => c.pos.getRangeTo(creep)));

			creep.memory.partner = _.get(p, "id", null);
			_.set(p, ["memory", "healer"], creep.id);
		} else {
			let p = Game.getObjectById(creep.memory.partner);
			if (p != null)
				creep.moveTo(p);
			else
				creep.memory.partner = null;
		}
	},
};