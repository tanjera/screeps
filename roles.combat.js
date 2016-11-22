let _Creep = require("util.creep");
let Tasks = require("tasks");

module.exports = {
	
	seekBoost: function(creep) {
		if (creep.isBoosted())
			return false;
		else {
			let task = _.head(_.filter(Memory["rooms"][creep.room.name]["tasks"],
				t => { 
				return t.type == "boost" 
					&& t.role == creep.memory.role 
					&& t.subrole == creep.memory.subrole
					&& t.dest == null ? true : t.dest == creep.memory.room; }));
				
			if (task != null) {
				creep.memory.boost = task;
				return true;
			} else
				return false;
		}
	},
	
	checkTarget_Existing: function(creep) {
		if (creep.memory.target != null) {
			let target = Game.getObjectById(creep.memory.target);
			if (target == null || Game.time % 10 == 0)	// Refresh target every 10 ticks...
				delete creep.memory.target;
		}
	},

	acquireTarget_ListTarget: function(creep, listTargets) {
		if (creep.memory.target == null) {
			for (let t in listTargets) {
				let target = Game.getObjectById(listTargets[t]);
				if (target != null && creep.moveTo(target) != ERR_NO_PATH) {
					creep.memory.target = target.id;
					return;
				}
			}
		}
	},
	
	acquireTarget_Creep: function(creep) {
		if (creep.memory.target == null) {
			let target = _.head(_.sortBy(_.sortBy(_.sortBy(creep.room.find(FIND_HOSTILE_CREEPS, 
				{ filter: (c) => { return Memory["allies"].indexOf(c.owner.username) < 0; }}),				
				c => { return -(c.getActiveBodyparts(ATTACK) + c.getActiveBodyparts(RANGED_ATTACK) + c.getActiveBodyparts(HEAL)); })),
				c => { return c.pos.getRangeTo(creep.pos); }),
				c => { return c.owner.username == "Source Keeper"; });
				
			if (target != null)
				creep.memory.target = target.id;
		}
	},
	
	acquireTarget_Structure: function(creep) {
		if (creep.memory.target == null) {			
			let target = _.head(_.sortBy(_.sortBy(_.sortBy(creep.room.find(FIND_STRUCTURES, { filter:
				s => { return s.hits != null && s.hits > 0 && s.hits < 20000 && s.structureType != "storage"
					&& (s.owner != null && !s.my && Memory["allies"].indexOf(s.owner.username) < 0); }}),
				s => { return creep.pos.getRangeTo(s.pos); } ),
				s => { return s.hits; } ),	// Sort by hits to prevent attacking massive ramparts/walls forever
				s => { switch (s.structureType) {
					case "spawn": return 0;
					case "tower": return 1;
					case "extension": return 2;
					default: return 3; 
				}}));
			if (target == null)
				target = _.head(_.sortBy(creep.room.find(FIND_CONSTRUCTION_SITES, { filter:
					s => { return s.owner == null || Memory["allies"].indexOf(s.owner.username) < 0; }}),
					s => { return creep.pos.getRangeTo(s.pos); } ));
				
			if (target != null)
				creep.memory.target = target.id;
		}
	},
	
	moveTo_SourceKeeperLair: function(creep) {
		let lair = _.head(_.sortBy(
			creep.room.find(FIND_STRUCTURES, { filter: s => { return s.structureType == "keeperLair"; }}),
			s => { return s.ticksToSpawn; } ));
		if (lair != null)
			creep.moveTo(lair);
	}
	
	
}