let _Creep = require("util.creep");
let Tasks = require("tasks");

module.exports = {
	
	checkTarget_Existing: function(creep) {
		if (creep.memory.target != null) {
			let target = Game.getObjectById(creep.memory.target);
			if (target == null)
				delete creep.memory.target;
		}
	},

	acquireTarget_ListTarget: function(creep, listTargets) {
		if (creep.memory.target == null) {
			for (let t in listTargets) {
				let target = Game.getObjectById(listTargets[t]);
				if (target != null) {
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
				c => { return c.pos.getRangeTo(creep.pos); }),
				c => { return -(c.getActiveBodyparts(ATTACK) + c.getActiveBodyparts(RANGED_ATTACK) + c.getActiveBodyparts(HEAL)); })),
				c => { return c.owner.username == "Source Keeper"; });
				
			if (target != null)
				creep.memory.target = target.id;
		}
	},
	
	acquireTarget_Structure: function(creep, destroyStructures) {
		if (creep.memory.target == null && destroyStructures != null && destroyStructures == true) {			
			let target = _.head(_.sortBy(_.sortBy(_.sortBy(creep.room.find(FIND_STRUCTURES, { filter:
				s => { return s.hits != null && s.hits > 0 && s.structureType != "storage"
					&& (s.owner != null && Memory["allies"].indexOf(s.owner.username) < 0); }}),
				s => { return creep.pos.getRangeTo(s.pos); } ),
				s => { return s.hits; } ),	// Sort by hits to prevent attacking massive ramparts/walls forever
				s => { return (s.structureType == "spawn" ? 0 : (s.structureType == "tower" ? 1 : 2)); }));
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