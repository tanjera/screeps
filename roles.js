module.exports = {

	moveToDestination: function(creep) {
		if (creep.memory.room != null && creep.room.name != creep.memory.room) {
			creep.travelToRoom(creep.memory.room, true);
			return true;
		} else
			return false;
	},

	goToRoom: function(creep, room_name, is_refueling) {
		if (creep.room.name != room_name) {
			creep.travelToRoom(room_name, is_refueling);
			return true;
		}
		return false;
	},

	Scout: function(creep) {
		if (creep.memory.room != null) {
			if (creep.room.name != creep.memory.room) {
				creep.travelToRoom(creep.memory.room, true);
			} else {
				let controller = _.get(Game, ["rooms", creep.memory.room, "controller"]);
				if (controller != null && !creep.pos.inRangeTo(controller, 3)) {
					creep.travel(controller);
					return;
				}

				if (controller == null && creep.pos.isEdge()) {
					creep.travel(new RoomPosition(25, 25, creep.room.name));
					return;
				}
			}
		}
	},

    Worker: function(creep, isSafe) {
        let hostile = isSafe ? null
			: _.head(creep.pos.findInRange(FIND_HOSTILE_CREEPS, 6, { filter:
				c => { return c.isHostile(); }}));

		if (hostile == null) {
			if (creep.memory.state == "refueling") {
				if (_.sum(creep.carry) == creep.carryCapacity) {
					creep.memory.state = "working";
					return;
				}

				if (this.goToRoom(creep, creep.memory.room, true))
					return;

				creep.memory.task = creep.memory.task || creep.getTask_Boost();
				creep.memory.task = creep.memory.task || creep.getTask_Withdraw_Link();
				creep.memory.task = creep.memory.task || creep.getTask_Withdraw_Storage("energy", 
				_.get(Memory, ["rooms", creep.room.name, "survey", "downgrade_critical"], false));
				creep.memory.task = creep.memory.task || creep.getTask_Withdraw_Container("energy", 
				_.get(Memory, ["rooms", creep.room.name, "survey", "downgrade_critical"], false));
				creep.memory.task = creep.memory.task || creep.getTask_Pickup("energy");
				creep.memory.task = creep.memory.task || creep.getTask_Mine();
				creep.memory.task = creep.memory.task || creep.getTask_Wait(10);

				creep.runTask(creep);
				return;

			} else if (creep.memory.state == "working") {
				if (creep.carry["energy"] == 0) {
					creep.memory.state = "refueling";
					return;
				}

				if (this.goToRoom(creep, creep.memory.room, false))
					return;

				creep.memory.task = creep.memory.task || creep.getTask_Upgrade(true);
				creep.memory.task = creep.memory.task || creep.getTask_Sign();
				creep.memory.task = creep.memory.task || creep.getTask_Repair(true);
				creep.memory.task = creep.memory.task || creep.getTask_Build();
				creep.memory.task = creep.memory.task || creep.getTask_Repair(false);
				creep.memory.task = creep.memory.task || creep.getTask_Upgrade(false);
				creep.memory.task = creep.memory.task || creep.getTask_Wait(10);

				creep.runTask(creep);
				return;

			} else {
				creep.memory.state = "refueling";
				return;
			}
		} else if (hostile != null) {			
			creep.moveFrom(creep, hostile);
			return;
		}
	},

    Mining: function(creep, isSafe) {
		let hostile = isSafe ? null
			: _.head(creep.pos.findInRange(FIND_HOSTILE_CREEPS, 6, { filter:
				c => { return c.isHostile(); }}));

		if (hostile == null) {
			if (creep.memory.state == "refueling") {
				if (creep.memory.role != "burrower" && creep.carryCapacity > 0 
						&& _.sum(creep.carry) == creep.carryCapacity) {
					creep.memory.state = "delivering";
					return;
				}

				if (this.goToRoom(creep, creep.memory.room, true))
					return;

				creep.memory.task = creep.memory.task || creep.getTask_Boost();

				if (creep.memory.role == "burrower") {
					creep.memory.task = creep.memory.task || creep.getTask_Mine();
					creep.memory.task = creep.memory.task || creep.getTask_Wait(10);

				} else if (creep.memory.role == "miner" || creep.memory.role == "carrier") {
					creep.memory.task = creep.memory.task || creep.getTask_Pickup("energy");
					creep.memory.task = creep.memory.task || creep.getTask_Withdraw_Link();

					let energy_level = _.get(Memory, ["rooms", creep.room.name, "survey", "energy_level"]);
					if (energy_level == CRITICAL || energy_level == LOW) {	
						creep.memory.task = creep.memory.task || creep.getTask_Withdraw_Container("energy", true);
						creep.memory.task = creep.memory.task || creep.getTask_Withdraw_Storage("energy", true);						
					} else {						
						creep.memory.task = creep.memory.task || creep.getTask_Withdraw_Storage("energy", true);
						creep.memory.task = creep.memory.task || creep.getTask_Withdraw_Container("energy", true);
					}
					
					if (creep.hasPart("work") > 0)
						creep.memory.task = creep.memory.task || creep.getTask_Mine();
					creep.memory.task = creep.memory.task || creep.getTask_Pickup("mineral");
					creep.memory.task = creep.memory.task || creep.getTask_Wait(10);
				}

				creep.runTask(creep);
				return;

			} else if (creep.memory.state == "delivering") {
				if (creep.carryCapacity == 0 || _.sum(creep.carry) == 0) {
					creep.memory.state = "refueling";
					return;
				}

				if (this.goToRoom(creep, creep.memory.colony, false))
					return;

				if (creep.room.energyAvailable < creep.room.energyCapacityAvailable * 0.75) {
					creep.memory.task = creep.memory.task || creep.getTask_Deposit_Spawns();
					creep.memory.task = creep.memory.task || creep.getTask_Deposit_Towers();
				} else {
					creep.memory.task = creep.memory.task || creep.getTask_Deposit_Towers();
					creep.memory.task = creep.memory.task || creep.getTask_Deposit_Spawns();
				}
				creep.memory.task = creep.memory.task || creep.getTask_Deposit_Link();
				creep.memory.task = creep.memory.task || creep.getTask_Deposit_Storage("mineral");
				creep.memory.task = creep.memory.task || creep.getTask_Deposit_Storage("energy");
				creep.memory.task = creep.memory.task || creep.getTask_Deposit_Container("energy");
				creep.memory.task = creep.memory.task || creep.getTask_Wait(10);

				creep.runTask(creep);
				return;

			} else {
				creep.memory.state = "refueling";
				return;
			}
		} else if (hostile != null) {
			creep.moveFrom(creep, hostile);
			return;
		}
	},

    Courier: function(creep) {
		if (this.moveToDestination(creep))
			return;
		
		if (creep.memory.state == "loading") {
            if (_.sum(creep.carry) > 0) {
                creep.memory.state = "delivering";
                return;
			}
			
			creep.memory.task = creep.memory.task || creep.getTask_Boost();
			creep.memory.task = creep.memory.task || creep.getTask_Industry_Withdraw();
			creep.memory.task = creep.memory.task || creep.getTask_Wait(10);

            creep.runTask(creep);
            return;

        } else if (creep.memory.state == "delivering") {
            if (_.sum(creep.carry) == 0) {
                    creep.memory.state = "loading";
                    return;
                }

			creep.memory.task = creep.memory.task || creep.getTask_Industry_Deposit();
			creep.memory.task = creep.memory.task || creep.getTask_Deposit_Storage("mineral");
			creep.memory.task = creep.memory.task || creep.getTask_Deposit_Storage("energy");
			creep.memory.task = creep.memory.task || creep.getTask_Wait(10);

            creep.runTask(creep);
            return;

        } else {
            creep.memory.state = "loading";
            return;
		} 
	},

    Extractor: function(creep, isSafe) {
		let hostile = isSafe ? null
			: _.head(creep.pos.findInRange(FIND_HOSTILE_CREEPS, 6, { filter:
				c => { return c.isHostile(); }}));

		if (hostile == null) {
			switch (creep.memory.state) {
				default:
				case "get_minerals":
					if (_.sum(creep.carry) == creep.carryCapacity
							|| _.get(Memory, ["rooms", creep.room.name, "survey", "has_minerals"], true) == false) {
						creep.memory.state = "deliver";
						return;
					}

					if (this.goToRoom(creep, creep.memory.room, true))
						return;

					creep.memory.task = creep.memory.task || creep.getTask_Boost();
					creep.memory.task = creep.memory.task || creep.getTask_Extract();
					creep.memory.task = creep.memory.task || creep.getTask_Wait(10);

					creep.runTask(creep);
					return;

				case "deliver":
					if (_.sum(creep.carry) == 0 
							&& _.get(Memory, ["rooms", creep.room.name, "survey", "has_minerals"], true)) {
						creep.memory.state = "get_minerals";
						return;
					}

					if (this.goToRoom(creep, creep.memory.colony, false))
						return;

					creep.memory.task = creep.memory.task || creep.getTask_Deposit_Storage("mineral");
					creep.memory.task = creep.memory.task || creep.getTask_Wait(10);

					creep.runTask(creep);
					return;
			}
		} else if (hostile != null) {
			creep.moveFrom(creep, hostile);
			return;
		}
	},

    Reserver: function(creep) {
		if (this.moveToDestination(creep))
			return;

		let result;
		if (_.get(creep.room, ["controller", "owner"]) != null && !creep.room.controller.my)
			result = creep.attackController(creep.room.controller);
		else
			result = creep.reserveController(creep.room.controller);

		if (result == ERR_NOT_IN_RANGE) {
			creep.travel(creep.room.controller)
			return;
		} else if (result == ERR_NO_BODYPART) {
			return;		// Reservers and colonizers with no "claim" parts prevent null body spawn locking
		} else if (result == OK) {
			if (Game.time % 50 == 0) {
				let room_sign = _.get(Memory, ["hive", "signs", creep.room.name]);
				let default_sign = _.get(Memory, ["hive", "signs", "default"]);
				if (room_sign != null && _.get(creep, ["room", "controller", "sign", "text"]) != room_sign)
					creep.signController(creep.room.controller, room_sign);
				else if (room_sign == null && default_sign != null && _.get(creep, ["room", "controller", "sign", "text"]) != default_sign)
					creep.signController(creep.room.controller, default_sign);
			}
			if (Game.time % 10 == 0)
				creep.moveFromSource();
			return;
		}
	},

	Colonizer: function(creep) {
		if (this.moveToDestination(creep))
			return;

		let result = creep.claimController(creep.room.controller);
		if (result == ERR_NOT_IN_RANGE) {
			creep.moveTo(creep.room.controller)
			return;
		} else if (result == ERR_NO_BODYPART) {
			return;		// Reservers and colonizers with no "claim" parts prevent null body spawn locking
		} else {
			let request = _.get(Memory, ["sites", "colonization", creep.memory.room]);			
			if (_.get(request, ["target"]) == creep.room.name && creep.room.controller.my) {
				delete Memory["sites"]["colonization"][creep.room.name];
				_.set(Memory, ["rooms", creep.room.name, "spawn_assist", "rooms"], [_.get(request, ["from"])]);
				_.set(Memory, ["rooms", creep.room.name, "spawn_assist", "list_route"], _.get(request, ["list_route"]));
				_.set(Memory, ["rooms", creep.room.name, "layout"], _.get(request, "layout"));
				_.set(Memory, ["rooms", creep.room.name, "focus_defense"], _.get(request, "focus_defense"));
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
		
		if (_Combat.acquireBoost(creep))
			return;
		if (_Combat.moveToDestination(creep, 10))
			return;
		
		_Combat.checkTarget_Existing(creep);
		_Combat.acquireTarget_ListTarget(creep, listTargets);
		
		if (targetCreeps)
			_Combat.acquireTarget_Creep(creep);		
		if (targetStructures && creep.room.name == creep.memory.room) 
			_Combat.acquireTarget_Structure(creep);

		if (_.get(creep, ["memory", "target", "id"]) != null) {
			_Combat.clearCamp(creep);
			let target = Game.getObjectById(creep.memory.target.id);

			creep.dismantle(target);
			creep.rangedAttack(target);
			let result = creep.attack(target);

			if (result == ERR_INVALID_TARGET && target instanceof ConstructionSite == true) {
				creep.moveTo(target, { reusePath: 0 });
			} else if (result == ERR_NOT_IN_RANGE) {
				creep.heal(creep);

				if (_.get(creep, ["memory", "target", "rampart"]) != null) {
					let rampart = Game.getObjectById(creep.memory.target.rampart);
					if (rampart != null)
						creep.moveTo(rampart, { reusePath: 0 });
					else
						creep.moveTo(target, { reusePath: 0 });
				} else
					creep.moveTo(target, { reusePath: 0 });
				return;
			} else if (result == OK) {
				return;
			} else {
				creep.heal(creep);
				return;
			}
		} else {
			creep.heal(creep);
			_Combat.acquireCamp(creep);
			_Combat.travelCamp(creep);					
			return;
		}
	},

	Archer: function(creep, targetStructures, targetCreeps, listTargets) {
		let _Combat = require("roles.combat");
		
		if (_Combat.acquireBoost(creep))
			return;
		if (_Combat.moveToDestination(creep, 10))
			return;

		_Combat.checkTarget_Existing(creep);
		_Combat.acquireTarget_ListTarget(creep, listTargets);
		
		if (targetCreeps)
			_Combat.acquireTarget_Creep(creep);		
		if (targetStructures && creep.room.name == creep.memory.room) 
			_Combat.acquireTarget_Structure(creep);

		if (_.get(creep, ["memory", "target", "id"]) != null) {
			_Combat.clearCamp(creep);
			let target = Game.getObjectById(creep.memory.target.id);
						
			creep.attack(target);
			creep.dismantle(target);
			let result = creep.rangedAttack(target);

			if (result == ERR_INVALID_TARGET && target instanceof ConstructionSite == true) {
				creep.moveTo(target, { reusePath: 0 });
			} else if (result == ERR_NOT_IN_RANGE) {
				creep.heal(creep);

				if (_.get(creep, ["memory", "target", "rampart"]) != null) {
					let rampart = Game.getObjectById(creep.memory.target.rampart);
					if (rampart != null)
						creep.moveTo(rampart, { reusePath: 0 });
					else
						creep.moveTo(target, { reusePath: 0 });
				} else
					creep.moveTo(target, { reusePath: 0 });
				return;
			} else if (result == OK && creep.pos.getRangeTo(target < 3)) {
				creep.moveFrom(creep, target);
				return;
			} else if (result == OK) {
				return;
			} else {
				creep.heal(creep);
				return;
			}
		} else {
			creep.heal(creep);
			_Combat.acquireCamp(creep);
			_Combat.travelCamp(creep);
			return;
		}
	},

	Dismantler: function(creep, targetStructures, listTargets) {
		let _Combat = require("roles.combat");
		
		if (_Combat.acquireBoost(creep))
			return;
		if (_Combat.moveToDestination(creep, null))
			return;
		
		_Combat.checkTarget_Existing(creep);
		_Combat.acquireTarget_ListTarget(creep, listTargets);
		
		if (targetStructures && creep.room.name == creep.memory.room) 
			_Combat.acquireTarget_Structure(creep);

		if (_.get(creep, ["memory", "target", "id"]) != null) {
			let target = Game.getObjectById(creep.memory.target.id);

			creep.rangedAttack(target);
			creep.attack(target);
			let result = creep.dismantle(target);

			if (result == ERR_INVALID_TARGET && target instanceof ConstructionSite == true) {
				creep.moveTo(target, { reusePath: 0 });
			} else if (result == ERR_NOT_IN_RANGE) {
				creep.heal(creep);
				creep.moveTo(target, { reusePath: 0 });
				return;
			} else if (result == OK) {
				return;
			} else {
				creep.heal(creep);
				return;
			}
		} else {
			creep.heal(creep);
			return;
		}
	},

    Healer: function(creep, to_partner) {
		let _Combat = require("roles.combat");

		if (_Combat.acquireBoost(creep))
			return;
		if (_Combat.moveToDestination(creep, 10))
			return;

		_Combat.checkTarget_Existing(creep);
		_Combat.acquireTarget_Heal(creep);
		
		if (_.get(creep, ["memory", "target", "id"]) != null) {
			_Combat.clearCamp(creep);
			let target = Game.getObjectById(creep.memory.target.id);
			let result = creep.heal(target);
			if (target == null || target.hits == target.hitsMax) {
				_.set(creep, ["memory", "target", "id"], null);
				return;
			} else if (result == OK) {
				return;
			} else if (result == ERR_NOT_IN_RANGE) {
				creep.rangedHeal(target);
				creep.moveTo(target);
				return;
			}
		}
		
		if (to_partner) {
			_Combat.checkPartner_Existing(creep);
			_Combat.acquireTarget_Partner(creep);

			if (_.get(creep, ["memory", "partner", "id"]) != null) {
				_Combat.clearCamp(creep);
				let target = Game.getObjectById(creep.memory.partner.id);
			
				if (target == null) {
					_.set(creep, ["memory", "target", "id"], null);
					_Combat.acquireCamp(creep);
					_Combat.travelCamp(creep);
				} else if (creep.pos.getRangeTo(p) > 1) {
					creep.moveTo(p, { reusePath: 0 });
					return;
				}
			}
		} else {
			_Combat.acquireCamp(creep);
			_Combat.travelCamp(creep);
		}
	},
};