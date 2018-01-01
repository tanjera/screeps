module.exports = {
	
	acquireBoost: function(creep) {
		if (creep.room.name == creep.memory.colony && creep.memory.boost != "complete") {
			if (creep.memory.boost == null) {
				if (this.seekBoost(creep)) {
					return true;
				} else {
					creep.memory.boost = "complete";
					return false;
				}
			} else if (creep.memory.boost != null) {
				if (!_.get(creep.memory, ["boost", "pos", "x"]) 
						|| !_.get(creep.memory, ["boost", "pos", "y"])
						|| !_.get(creep.memory, ["boost", "pos", "roomName"])) {
					delete creep.memory.boost;	
					return false;
				}

				let boost_pos = new RoomPosition(creep.memory.boost.pos.x, creep.memory.boost.pos.y, creep.memory.boost.pos.roomName);
				if (creep.pos.getRangeTo(boost_pos) > 1) {
					creep.travel(boost_pos);
					return true;
				} else {
					let boosted = creep.getBoosts();
					if (boosted.includes(creep.memory.boost.resource)) {
						delete creep.memory.boost;
						return true;	// True to re-run cycle, seek new boost next tick if available
					}
				}
			}
		} else 
			return false;
	},

	seekBoost: function(creep) {
		let boosted = creep.getBoosts();
		let boost = _.head(_.filter(_.get(Memory, ["rooms", creep.room.name, "industry", "boosts"]),
			t => { return t.active && t.role == creep.memory.role 
					&& (t.room == null ? true : t.room == creep.memory.room) 
					&& !boosted.includes(t.resource); }));

		if (boost != null) {
			creep.memory.boost = boost;
			return true;
		} else
			return false;
	},

	moveToDestination: function(creep, recheck_targets) {
		if (creep.memory.room != null && _.get(creep, ["memory", "target", "id"]) == null 
				&& creep.room.name != creep.memory.room) {
			creep.travelToRoom(creep.memory.room, true);
			// Evaluates for targets in this room every evaluate_targets ticks...
			return (recheck_targets == null || Game.time % recheck_targets != 0);
		}
		return false;
	},

	checkTarget_Existing: function(creep) {
		if (_.get(creep, ["memory", "target", "id"]) != null) {
			let target = Game.getObjectById(creep.memory.target.id);
			// Refresh target every 10 ticks...
			if (target == null || target.room.name != creep.room.name || Game.time % 10 == 0)
				_.set(creep, ["memory", "target", "id"], null);
		}
	},

	checkPartner_Existing: function(creep) {
		if (_.get(creep, ["memory", "partner", "id"]) != null) {
			let target = Game.getObjectById(creep.memory.partner.id);
			// Refresh target every 10 ticks...
			if (target == null || target.room.name != creep.room.name || Game.time % 10 == 0)
				_.set(creep, ["memory", "partner", "id"], null);
		}
	},

	acquireTarget_ListTarget: function(creep, listTargets) {
		if (_.get(creep, ["memory", "target", "id"]) == null && listTargets != null
				&& _.get(creep, ["memory", "target", "notarget_list"], 0) < Game.time - 10) {
			for (let t in listTargets) {
				let target = Game.getObjectById(listTargets[t]);
				if (target != null && creep.moveTo(target) != ERR_NO_PATH) {
					_.set(creep, ["memory", "target", "id"], target.id);
					return;
				}
			}

			if (_.get(creep, ["memory", "target", "id"]) != null)
				_.set(creep, ["memory", "target", "notarget_list"], Game.time);
		}
	},
	
	acquireTarget_Creep: function(creep) {
		if (_.get(creep, ["memory", "target", "id"]) == null 
				&& _.get(creep, ["memory", "target", "notarget_creep"], 0) < Game.time - 10) {
			if (_.get(Memory, ["rooms", creep.room.name, "defense", "targets", "attack"]) != null) {
				_.set(creep, ["memory", "target", "id"], _.get(Memory, ["rooms", creep.room.name, "defense", "targets", "attack"]));
				this.acquireRampart_Adjacent(creep);
				return;
			}

			let target = _.head(_.sortBy(_.sortBy(_.sortBy(creep.room.find(FIND_HOSTILE_CREEPS, 
				{ filter: (c) => { return c.isHostile(); }}),				
				c => { return -(c.hasPart("attack") + c.hasPart("ranged_attack") 
					+ c.hasPart("heal")) + c.hasPart("work"); })),
				c => { return c.pos.getRangeTo(creep.pos); }),
				c => { return c.owner.username == "Source Keeper"; });				
			if (target != null) {
				_.set(creep, ["memory", "target", "id"], target.id);
				this.acquireRampart_Adjacent(creep);
				return;
			} else {
				_.set(creep, ["memory", "target", "notarget_creep"], Game.time);
			}
		}
	},
	
	acquireTarget_Structure: function(creep) {
		if (_.get(creep, ["memory", "target", "id"]) == null
		&& _.get(creep, ["memory", "target", "notarget_structure"], 0) < Game.time - 10) {
			let target = _.head(_.sortBy(_.sortBy(_.sortBy(creep.room.find(FIND_STRUCTURES, { filter:
				s => { return s.hits != null && s.hits > 0
					&& ((s.owner == null && s.structureType != "container")
					|| (s.owner != null && !s.my && s.owner != "Source Keeper" && s.structureType != "controller"
						&& _.get(Memory, ["hive", "allies"]).indexOf(s.owner.username) < 0)); }}),
				s => { return creep.pos.getRangeTo(s.pos); } ),
				s => { return s.hits; } ),	// Sort by hits to prevent attacking massive ramparts/walls forever
				s => { switch (s.structureType) {
					case "spawn": return 0;
					case "tower": return 1;
					case "extension": return 2;
					default: return 3;
					case "rampart":
					case "constructedWall": return 4;
				}}));
			if (target == null)
				target = _.head(_.sortBy(creep.room.find(FIND_CONSTRUCTION_SITES, { filter:
					s => { return s.owner == null || (!s.my && _.get(Memory, ["hive", "allies"]).indexOf(s.owner.username) < 0); }}),
					s => { return creep.pos.getRangeTo(s.pos); } ));
				
			if (target != null) {
				_.set(creep, ["memory", "target", "id"], target.id);
			} else {
				_.set(creep, ["memory", "target", "notarget_structure"], Game.time);
			}
		}
	},

	acquireTarget_Heal: function(creep) {
		if (_.get(creep, ["memory", "target", "id"]) == null
				&& _.get(creep, ["memory", "target", "notarget_heal"], 0) < Game.time - 3) {				
			let target = creep.pos.findClosestByRange(FIND_MY_CREEPS, { filter:
				c => { return c.hits < c.hitsMax; }});

			if (target != null) {
				_.set(creep, ["memory", "target", "id"], target.id);
			} else {
				_.set(creep, ["memory", "target", "notarget_heal"], Game.time);
			}
		}
	},

	acquireTarget_Partner: function(creep) {
		if (_.get(creep, ["memory", "partner", "id"]) == null
				&& _.get(creep, ["memory", "partner", "notarget_partner"], 0) < Game.time - 10) {			
			let target = _.head(_.sortBy(_.filter(creep.pos.findInRange(FIND_MY_CREEPS, 5, { filter: c => { return c.memory.role != "healer" }}),
				c => c.memory.healer != null),
				c => c.pos.getRangeTo(creep)));

			if (target != null) {
				_.set(creep, ["memory", "partner", "id"], target.id);
				_.set(target, ["memory", "healer"], creep.id);
			} else {
				_.set(creep, ["memory", "partner", "notarget_partner"], Game.time);
			}
		}
	},

	acquireRampart_Adjacent: function(creep) {
		if (_.get(creep, ["memory", "target", "id"]) != null && _.get(creep, ["room", "controller", "my"])) {
			let target = Game.getObjectById(creep.memory.target.id);
			if (target instanceof Creep == false)
				return;

			let range = creep.hasPart("attack") ? 1 : 3;
			let rampart = _.head(_.sortBy(_.filter(creep.room.find(FIND_MY_STRUCTURES), 
				s => { return s.structureType == "rampart" && s.pos.inRangeTo(target, range) && s.pos.isWalkable(true); }),
				s => { return s.pos.getRangeTo(creep); }))			
			_.set(creep, ["memory", "target", "rampart"], _.get(rampart, "id"));
		} else {
			_.set(creep, ["memory", "target", "rampart"], null);
		}
	},

	acquireCamp: function(creep) {
		if (creep.memory.camp != null || Game.time % 10 != 0)
			return;

		if (creep.room.name == creep.memory.room) {
			if (_.get(Memory, ["rooms", creep.room.name, "camp"]) != null) {
				let camp = _.get(Memory, ["rooms", creep.room.name, "camp"]);
				let pos = new RoomPosition(_.get(camp, "x"), _.get(camp, "y"), _.get(camp, "roomName"));
				_.set(creep.memory, "camp", pos.getOpenTile_Range(2, true));
				return;
			}
			
			let lair = _.head(_.sortBy(_.filter(creep.room.find(FIND_STRUCTURES), 
				s => { return s.structureType == "keeperLair"; }),
				s => { return s.ticksToSpawn; }));		
			if (lair != null) {
				_.set(creep.memory, "camp", lair.id);
				return;
			} 
		
			let structures = creep.room.find(FIND_MY_STRUCTURES);
			let ramparts = _.filter(structures, 
				s => { return s.structureType == "rampart" 
						&& s.pos.lookFor(LOOK_CREEPS).length == 0
						&& s.pos.lookFor(LOOK_STRUCTURES).length == 1; });					
			let rampart = creep.pos.findClosestByPath(ramparts);
			if (rampart != null) {
				_.set(creep.memory, "camp", rampart.id);
				return;
			} 

			let controller = _.get(Game, ["rooms", creep.room.name, "controller"]);
			if (controller != null) {				
				_.set(creep.memory, "camp", controller.pos.getOpenTile_Range(3, true));
				return;
			}
		}
	},

	travelCamp: function(creep) {
		let camp = _.get(creep.memory, "camp");
		if (camp != null) {
			if (camp instanceof RoomPosition == true) {
				creep.travel(camp);
				return;
			} else if (_.get(camp, "x") != null && _.get(camp, "y") != null && _.get(camp, "roomName") != null) {
				creep.travel(new RoomPosition(camp.x, camp.y, camp.roomName));
			} else {
				let obj = Game.getObjectById(_.get(creep.memory, "camp"));
				if (obj == null)
					_.set(creep.memory, "camp", null);
				else
					creep.travel(obj);
			}
		} else {
			creep.travel(new RoomPosition(25, 25, creep.room.name));
		}
	},

	clearCamp: function(creep) {
		_.set(creep.memory, "camp", null);
	}
}