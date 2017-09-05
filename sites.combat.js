let Roles = require("roles");
let Hive = require("hive");

let _CPU = require("util.cpu");

module.exports = {
	
/* Memory Structure
 *
 * sites.combat_id					<<< set by console command
 * sites.combat_id.tactic			<<< set by console command
 * 		- tactic.type		<< set by console command
 * 		- tactic.army		<< population list; set by setPopulation()
 * 	>> variable by tactic
 * 		- tactic.rally_pos
 * 		- tactic.target_all
 * 		- tactic.target_list
 * 	
 * sites.combat_id.colony			<<< set by console command
 * sites.combat_id.target_room		<<< set by console command
 * sites.combat_id.use_boosts		<<< T/F, set by console command
 * sites.combat_id.list_spawns		<<< set by console command
 * sites.combat_id.list_route		<<< set by console command
 * sites.combat_id.state_spawn		<<< set by tactic; spawning, constant, complete
 * sites.combat_id.state_combat		<<< spawning, attacking, etc; 
 * 
 * 
 * To Implement
 *  - runTactics()...
*/


	Run: function(combat_id) {
		if (_.get(Memory, ["sites", combat_id, "tactic"]) == null)
			return;
		
		if (Hive.isPulse_Spawn()) {
			_CPU.Start(rmColony, `Combat-${combat_id}-runPopulation`);
			this.setPopulation(combat_id);
			this.runPopulation(combat_id);
			_CPU.End(rmColony, `Combat-${combat_id}-runPopulation`);
		}
		
		_CPU.Start(rmColony, `Combat-${combat_id}-runTactic`);
		this.runTactic(combat_id);
		_CPU.End(rmColony, `Combat-${combat_id}-runTactic`);
	},
	
	setPopulation: function(combat_id) {
		let _Colony = require("util.colony");

		let combat = _.get(Memory, ["sites", combat_id]);
		let tacticType = _.get(combat, ["tactic", "type"]);
		let rmColony = _.get(combat, ["colony"]);
		let rmLevel = _Colony.getRoom_Level(rmColony);
		let army = new Object();

		switch(tacticType) {
			default:
			case "waves":			army = _.clone(Population_Combat__Waves);			break;
			case "trickle":			army = _.clone(Population_Combat__Trickle);			break;
			case "occupation":		army = _.clone(Population_Combat__Occupation);		break;
			case "tower_drain":		army = _.clone(Population_Combat__Tower_Drain);		break;
		}

		for (let each in army) {
			if (_.get(army[each], "level") == null)
				_.set(army[each], "level", rmLevel);
		}

		_.set(Memory, ["sites", combat_id, "tactic", "army"], _.clone(army));
	},
	
	runPopulation: function(combat_id) {
		let combat = _.get(Memory, ["sites", combat_id]);
		let state_spawn = _.get(combat, "state_spawn");
		let rmColony = _.get(combat, ["colony"]);
		
		if (state_spawn == null) {
			let tacticType = _.get(combat, ["tactic", "type"]);

			switch (tacticType) {
				case "waves":
				case "tower_drain":
					state_spawn = "spawning";
					break;

				case "trickle":	
				case "occupation":
					state_spawn = "constant";
					break;
			}

			_.set(Memory, ["sites", combat_id, "state_spawn"], state_spawn);
		}

		if (state_spawn == "spawning" || state_spawn == "constant") {
			let _Colony = require("util.colony");
			let listArmy = _.get(combat, ["tactic", "army"]);
			let rmColony = _.get(combat, ["colony"]);
			let rmLevel = _Colony.getRoom_Level(rmColony);
			let listSpawnRooms = _.get(combat, ["list_spawns"]);

			let listCreeps = _.filter(Game.creeps, c => { return _.get(c, ["memory", "combat_id"]) == combat_id; });

			for (let role in listArmy) {
				let listRole = _.filter(listCreeps, c => { return _.get(c, ["memory", "role"]) == role; });
				if (listRole.length < _.get(listArmy, [role, "amount"])) {
					Memory["hive"]["spawn_requests"].push({ 
						room: rmColony, 
						listRooms: listSpawnRooms, 
						priority: 0, 
						level: listArmy[role]["level"],
						scale_level: false,
						body: (listArmy[role]["body"] == null ? role : listArmy[role]["body"]), 
						name: null, 
						args: { role: role, combat_id: combat_id, 
								room: _.get(combat, "target_room") , colony: rmColony,
								listRoute: _.get(combat, "list_route") } });
				}
			}

			if (state_spawn == "spawning" && listCreeps.length == listArmy.length)
				_.set(Memory, ["sites", combat_id, "state_spawn"], "complete");
		}
	},
	
	runTactic: function(combat_id) {
		let combat = _.get(Memory, ["sites", combat_id]);
		let state_combat = _.get(combat, "state_combat");

		if (state_combat == null)
			_.set(Memory, ["sites", combat_id, "state_combat"], "spawning");

		switch (_.get(combat, ["tactic", "type"])) {
			case "waves": 			this.runTactic_Waves(combat_id, combat);				break;
			case "trickle":			this.runTactic_Trickle(combat_id, combat);				break;
			case "occupation":		this.runTactic_Occupation(combat_id, combat);			break;
			case "tower_drain":		this.runTactic_Tower_Drain(combat_id, combat);			break;
		}
	},

	runTactic_Waves: function(combat_id, combat) {
		// combat_id.tactic = { type: "waves", rally_pos: RoomPosition(), target_all: , target_list: [] }
		let tactic = _.get(combat, "tactic");
		let state_combat = _.get(combat, "state_combat");
		let listCreeps = _.filter(Game.creeps, c => { return _.get(c, ["memory", "combat_id"]) == combat_id; });
		
		switch (state_combat) {	
			case "spawning":
			case "rallying":
				let rally_range = 5;
				let rally_pos = _.get(tactic, "rally_pos");

                _.each(listCreeps, creep => {
					if (_.get(combat, "use_boosts") && this.creepBoost(creep))
						return;

					this.creepRally(creep, rally_pos);	
				});
				
				let creeps_rallied = _.filter(listCreeps, c => c.room.name == rally_pos.roomName && rally_pos.inRangeTo(c.pos, rally_range));
				if (state_combat == "rallying" && listCreeps.length > 0 && Game.time % 5 == 0) {
					if (creeps_rallied.length == listCreeps.length) {
						_.set(Memory, ["sites", combat_id, "state_combat"], "attacking");
						console.log(`<font color=\"#FFA100\">[Combat: Waves]</font> ${combat_id}: Launching attack!`);
					}
					
					if (Game.time % 50 == 0) {	
						console.log(`<font color=\"#FFA100\">[Combat: Waves]</font> ${combat_id}: Rallying troops, `
						+ `${creeps_rallied.length} of ${listCreeps.length} at rally point.`);
					}
				}

				return;
			
			case "attacking":
				let target_all = _.get(tactic, "target_all");
				let target_list = _.get(tactic, "target_list");

				_.each(listCreeps, creep => {
					if (creep.memory.role == "soldier") {
						Roles.Soldier(creep, target_all, target_all, target_list);
					} else if (creep.memory.role == "archer") {
						Roles.Archer(creep, target_all, target_all, target_list);
					} else if (creep.memory.role == "healer") {
						Roles.Healer(creep);
					}
				});
				
				// Evaluate victory or reset conditions
				if (Game.time % 10 == 0) {
					let state_spawn = _.get(combat, "state_spawn");
					if (listCreeps.length == 0 && state_spawn != "constant") {
						_.set(Memory, ["sites", combat_id, "state_combat"], "complete");
						return;
					} else if (listCreeps.length == 0 && state_spawn == "constant") {
						_.set(Memory, ["sites", combat_id, "state_combat"], "spawning");
						return;
					}

					let target_room = _.get(combat, "target_room");
					if (_.get(Game, ["rooms", target_room]) != null) {
						let room_structures = Game["rooms"][target_room].find(FIND_STRUCTURES);
						let owned_structures = _.filter(room_structures, s => {
							return s.owner != null && s.structureType != "rampart" });
						
						if (target_all && owned_structures.length == 0) {
							_.set(Memory, ["sites", combat_id, "state_combat"], "complete");
							return;	
						}

						if (target_list != null) {
							let targets_remaining = _.filter(room_structures, s => {
								return target_list.indexOf(s.id) >= 0; });
							
							if (targets_remaining.length == 0) {
								_.set(Memory, ["sites", combat_id, "state_combat"], "complete");
								return;
							}
						}
					}
				}
				return;
				
			case "complete":
				delete Memory["sites"][combat_id];				
				return;
		}
	},

	runTactic_Trickle: function(combat_id, combat) {
		
	},
	
	runTactic_Occupation: function(combat_id, combat) {
		
	},
	
	runTactic_Tower_Drain: function(combat_id, combat) {
		
	},
			
	
	creepBoost: function(creep) {
		let _Combat = require("roles.combat");

		if (creep.room.name == rmColony) {						
			if (creep.memory.boost == null && !creep.isBoosted()) {
				if (_Combat.seekBoost(creep))
					return true;
			} else if (creep.memory.boost != null && !creep.isBoosted()) {
				creep.moveTo(creep.memory.boost.pos.x, creep.memory.boost.pos.y);
				return true;
			}
		}

		return false;
	},

	creepRally: function(creep, posRally, rallyRange) {
		let _Creep = require("util.creep");

		if (creep.room.name != posRally.roomName)
			_Creep.moveToRoom(creep, posRally.roomName, true);
		else if (creep.room.name == posRally.roomName) {
			if (!posRally.inRangeTo(creep.pos, rallyRange))
				creep.moveTo(posRally);
			else {
				let hostile = _.head(creep.pos.findInRange(FIND_HOSTILE_CREEPS, 3, 
					{ filter: (c) => { return c.isHostile(); }}));
				if (hostile != null) {
					creep.rangedAttack(hostile);
					creep.attack(hostile);								
				}
				if (Game.time % 15 == 0)
					creep.moveTo(posRally);
			}
		}
	}
};