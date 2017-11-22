let Roles = require("roles");

let _CPU = require("util.cpu");

module.exports = {
	Run: function(combat_id) {
		if (_.get(Memory, ["sites", "combat", combat_id, "tactic"]) == null)
			return;

		let rmColony = _.get(Memory, ["sites", "combat", combat_id, "colony"]);
		
		if (isPulse_Spawn()) {
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
		let combat = _.get(Memory, ["sites", "combat", combat_id]);
		let tacticType = _.get(combat, ["tactic", "type"]);
		let rmColony = _.get(combat, ["colony"]);
		let rmLevel = Game["rooms"][rmColony].getLevel();
		let army = _.get(combat, ["tactic", "army"]);


		if (_.get(combat, ["tactic", "spawn_repeat"]) == null)
			_.set(Memory, ["sites", "combat", combat_id, "tactic", "spawn_repeat"], true);

		if (army != null)
			return;

		switch(tacticType) {
			default:
			case "waves":			army = _.cloneDeep(Population_Combat__Waves);			break;
			case "trickle":			army = _.cloneDeep(Population_Combat__Trickle);			break;
			case "occupy":			army = _.cloneDeep(Population_Combat__Occupy);			break;
			case "dismantle":		army = _.cloneDeep(Population_Combat__Dismantle);		break;
			case "tower_drain":		army = _.cloneDeep(Population_Combat__Tower_Drain);		break;
			case "controller":		army = _.cloneDeep(Population_Combat__Controller);		break;
		}

		for (let each in army) {
			if (_.get(army[each], "level") == null)
				_.set(army[each], "level", rmLevel);
		}

		_.set(Memory, ["sites", "combat", combat_id, "tactic", "army"], _.cloneDeep(army));
	},
	
	runPopulation: function(combat_id) {				
		if (_.get(Memory, ["sites", "combat", combat_id, "state_combat"]) == "spawning") {
			this.runPopulation_SpawnRequests(combat_id);
		}
	},

	runPopulation_SpawnRequests: function(combat_id) {
		if (!isPulse_Spawn())
			return;

		let combat = _.get(Memory, ["sites", "combat", combat_id]);		
		let listArmy = _.get(combat, ["tactic", "army"]);
		let lengthArmy = _.sum(listArmy, s => { return s.amount; });
		let rmColony = _.get(combat, ["colony"]);
		let rmLevel = Game["rooms"][rmColony].getLevel();
		let listSpawnRooms = _.get(combat, ["list_spawns"]);
		let listCreeps = _.filter(Game.creeps, c => { return _.get(c, ["memory", "combat_id"]) == combat_id; });

		for (let role in listArmy) {
			let listRole = _.filter(listCreeps, c => { return _.get(c, ["memory", "role"]) == role; });
			if (listRole.length < _.get(listArmy, [role, "amount"])) {
				Memory["hive"]["spawn_requests"].push({ 
					room: rmColony, 
					listRooms: listSpawnRooms, 
					priority: 20, 
					level: _.get(listArmy, [role, "level"], rmLevel),
					scale: false,
					body: _.get(listArmy, [role, "body"], role), 
					name: null, 
					args: { role: role, combat_id: combat_id, 
							room: _.get(combat, "target_room"), colony: rmColony,
							list_route: _.get(combat, "list_route") } });
			}
		}
	},
	
	runTactic: function(combat_id) {
		let combat = _.get(Memory, ["sites", "combat", combat_id]);
		let state_combat = _.get(combat, "state_combat");

		if (state_combat == null)
			_.set(Memory, ["sites", "combat", combat_id, "state_combat"], "spawning");

		switch (_.get(combat, ["tactic", "type"])) {
			case "waves": 			this.runTactic_Waves(combat_id, combat);				break;
			case "trickle":			this.runTactic_Trickle(combat_id, combat);				break;
			// Occupy tactic same as Trickle tactic using different army population.
			case "occupy":			this.runTactic_Trickle(combat_id, combat);				break;
			// Dismantle tactic same as Trickle tactic using different army population.
			case "dismantle":		this.runTactic_Trickle(combat_id, combat);				break;
			case "tower_drain":		this.runTactic_Tower_Drain(combat_id, combat);			break;
			case "controller":		this.runTactic_Controller(combat_id, combat);			break;
		}
	},

	runTactic_Waves: function(combat_id, combat) {
		let tactic = _.get(combat, "tactic");
		let state_combat = _.get(combat, "state_combat");
		let listCreeps = _.filter(Game.creeps, c => { return _.get(c, ["memory", "combat_id"]) == combat_id; });		
		let army = _.get(combat, ["tactic", "army"]);
		let army_amount = _.sum(army, s => { return s.amount; });
		
		switch (state_combat) {	
			case "spawning":
			case "rallying":
				let rally_range = 5;
				let rally_pos = _.get(tactic, "rally_pos");

                _.each(listCreeps, creep => {
					if (_.get(combat, "use_boosts") && this.creepBoost(creep, combat))
						return;
					this.creepRally(creep, rally_pos, rally_range);	
				});
				
				if (this.checkSpawnComplete_toRally(combat_id, combat, listCreeps, army_amount))
					return;
				if (this.checkRallyComplete_toAttack(combat_id, combat, listCreeps, rally_pos, rally_range, army_amount))
					return;
				return;
			
			case "attacking":
				// Run the creeps' base roles!
				this.creepRoles(listCreeps, tactic);

				// Evaluate victory or reset conditions
				if (Game.time % 10 == 0) {
					if (this.evaluateDefeat_CreepsWiped(combat_id, combat, listCreeps))
						return;
					else if (listCreeps.length == 0 && _.get(tactic, "spawn_repeat")) {
						_.set(Memory, ["sites", "combat", combat_id, "state_combat"], "spawning");
						return;
					}

					let target_room = Game["rooms"][_.get(combat, "target_room")];
					if (target_room != null) {
						let room_structures = target_room.find(FIND_STRUCTURES);
						if (this.evaluateVictory_TargetStructures(combat_id, combat, room_structures))
							return;
						if (this.evaluateVictory_TargetList(combat_id, combat, room_structures))
							return;
					}
				}
				return;
				
			case "complete":
				if (_.get(combat, ["tactic", "to_occupy"]))
					this.setOccupation(combat_id, combat, tactic);
				delete Memory["sites"]["combat"][combat_id];	
				console.log(`<font color=\"#FFA100\">[Combat: ${combat_id}]</font> Combat completed, removing from memory.`);			
				return;
		}
	},

	runTactic_Trickle: function(combat_id, combat) {
		let tactic = _.get(combat, "tactic");
		let state_combat = _.get(combat, "state_combat");
		let listCreeps = _.filter(Game.creeps, c => { return _.get(c, ["memory", "combat_id"]) == combat_id; });

		// Dismantle is a Trickle tactic with dismantler population targeting structures.
		if (_.get(tactic, "type") == "dismantle") {
			_.set(tactic, "target_creeps", false); 
			_.set(tactic, "target_structures", true);
			_.set(tactic, "to_occupy", false);
		}

		switch (state_combat) {	
			// Trickle tactic is a constant state of spawning and moving to trickle into destination room
			case "spawning":
                _.each(listCreeps, creep => {
					if (_.get(combat, "use_boosts") && this.creepBoost(creep, combat))
						return;
				});
				
				// Run the creeps' base roles!
				this.creepRoles(listCreeps, tactic);

				// Evaluate victory; occupations are never-ending
				if (Game.time % 10 == 0 && _.get(combat, ["tactic", "type"]) != "occupy") {
					let target_room = Game["rooms"][_.get(combat, "target_room")];
					if (target_room != null) {
						let room_structures = target_room.find(FIND_STRUCTURES);
						if (this.evaluateVictory_TargetStructures(combat_id, combat, room_structures))
							return;
						if (this.evaluateVictory_TargetList(combat_id, combat, room_structures))
							return;
					}
				}
				return;
				
			case "complete":
				if (_.get(combat, ["tactic", "to_occupy"], false))
					this.setOccupation(combat_id, combat, tactic);
				delete Memory["sites"]["combat"][combat_id];	
				console.log(`<font color=\"#FFA100\">[Combat: ${combat_id}]</font> Combat completed, removing from memory.`);
				return;
		}
	},
	
	runTactic_Tower_Drain: function(combat_id, combat) {
		let tactic = _.get(combat, "tactic");
		let state_combat = _.get(combat, "state_combat");
		let listCreeps = _.filter(Game.creeps, c => { return _.get(c, ["memory", "combat_id"]) == combat_id; });
		let army = _.get(combat, ["tactic", "army"]);
		let army_amount = _.sum(army, s => { return s.amount; });
		let rally_range = 3;
		let rally_pos = _.get(tactic, "rally_pos");
		let drain_pos = _.get(tactic, "drain_pos");
		
		switch (state_combat) {	
			case "spawning":
			case "rallying":
				_.each(listCreeps, creep => {
					if (_.get(combat, "use_boosts") && this.creepBoost(creep, combat))
						return;
					this.creepRally(creep, rally_pos, rally_range);	
				});
				
				if (this.checkSpawnComplete_toRally(combat_id, combat, listCreeps, army_amount))
					return;
				if (this.checkRallyComplete_toAttack(combat_id, combat, listCreeps, rally_pos, rally_range, army_amount))
					return;
				return;
			
			case "attacking":
				// Replenish any creeps that die
				this.runPopulation_SpawnRequests(combat_id);

				// Run the creeps' roles for griefing the room and draining the towers' energy
				let pos_rally = new RoomPosition(rally_pos.x, rally_pos.y, rally_pos.roomName);
				let pos_drain = new RoomPosition(drain_pos.x, drain_pos.y, drain_pos.roomName);

				_.each(listCreeps, creep => {
					if (creep.memory.role == "tank" || creep.memory.role == "dismantler") {
						if (creep.hits < (creep.hitsMax * 0.4) 
								|| (creep.memory.role == "dismantler" && !creep.hasPart("work")))
							_.set(creep, ["memory", "combat_state"], "rally");
						else if (creep.hits == creep.hitsMax)
							_.set(creep, ["memory", "combat_state"], "drain");
						
						if (_.get(creep, ["memory", "combat_state"]) == null)
							_.set(creep, ["memory", "combat_state"], "rally");

						if (_.get(creep, ["memory", "combat_state"]) == "rally")
							creep.moveTo(pos_rally, { reusePath: 0 });
						else if (_.get(creep, ["memory", "combat_state"]) == "drain") {
							if (creep.memory.role == "dismantler")
								Roles.Dismantler(creep, true, _.get(tactic, "target_list"));
							creep.moveTo(pos_drain, { reusePath: 0 });
						}
					} else if (creep.memory.role == "healer") {
						let wounded = _.head(_.filter(listCreeps, 
							c => { return c.hits < c.hitsMax && c.pos.roomName == pos_rally.roomName 
								&& c.pos.getRangeTo(pos_rally) <= rally_range; }));
						if (wounded != null) {
							if (creep.heal(wounded) == ERR_NOT_IN_RANGE) {
								creep.rangedHeal(wounded);
								creep.moveTo(wounded, { reusePath: 0 });
							}							
						} else {
							if (creep.hits < creep.hitsMax)
								creep.heal(creep);
							this.creepRally(creep, rally_pos, rally_range);
						}
					}
				});

				// Evaluate victory or reset conditions
				if (Game.time % 10 == 0) {
					if (this.evaluateDefeat_CreepsWiped(combat_id, combat, listCreeps))
						return;
					else if (listCreeps.length == 0 && _.get(tactic, "spawn_repeat")) {
						_.set(Memory, ["sites", "combat", combat_id, "state_combat"], "spawning");
						return;
					}

					let target_room = Game["rooms"][_.get(combat, "target_room")];
					if (target_room != null && _.filter(target_room.find(FIND_STRUCTURES), s => { return s.structureType == "tower"; }).length == 0) {						
						_.set(Memory, ["sites", "combat", combat_id, "state_combat"], "complete");
						console.log(`<font color=\"#FFA100\">[Combat: ${combat_id}]</font> No enemy towers detected! Completing tower drain combat.`);
						return;
					}
				}
				return;
				
			case "complete":				
				delete Memory["sites"]["combat"][combat_id];	
				console.log(`<font color=\"#FFA100\">[Combat: ${combat_id}]</font> Combat completed, removing from memory.`);
				return;
		}
	},

	runTactic_Controller: function(combat_id, combat) {
		let tactic = _.get(combat, "tactic");
		let state_combat = _.get(combat, "state_combat");
		let listCreeps = _.filter(Game.creeps, c => { return _.get(c, ["memory", "combat_id"]) == combat_id; });
		let target_room = Game["rooms"][_.get(combat, "target_room")];
		
		switch (state_combat) {	
			// Controller tactic is a constant state of spawning and moving to trickle into destination room
			case "spawning":
                _.each(listCreeps, creep => {
					if (_.get(combat, "use_boosts") && this.creepBoost(creep, combat))
						return;
				});
				
				if (target_room == null || target_room.controller.upgradeBlocked > 200)
					_.set(Memory, ["sites", "combat", combat_id, "tactic", "army"], 
						{ scout:  {amount: 1, level: 1} });
				else 
					_.set(Memory, ["sites", "combat", combat_id, "tactic", "army"], 
						{ reserver:  {amount: 1, level: 3, body: "reserver_at"} });
				
				// Run the creeps' base roles!
				this.creepRoles(listCreeps, tactic);

				// Evaluate victory
				if (Game.time % 10 == 0) {
					if (target_room != null) {
						if (this.evaluateVictory_Controller(combat_id, combat))
							return;
					}
				}
				return;
				
			case "complete":
				if (_.get(combat, ["tactic", "to_occupy"]))
					this.setOccupation(combat_id, combat, tactic);
				delete Memory["sites"]["combat"][combat_id];	
				console.log(`<font color=\"#FFA100\">[Combat: ${combat_id}]</font> Combat completed, removing from memory.`);
				return;
		}
	},
		
	checkSpawnComplete_toRally: function(combat_id, combat, listCreeps, army_amount) {
		if (_.get(combat, "state_combat") == "spawning" && army_amount > 0 && listCreeps.length == army_amount) {
			_.set(Memory, ["sites", "combat", combat_id, "state_combat"], "rallying");
			return true;
		}
		return false;
	},

	checkRallyComplete_toAttack: function(combat_id, combat, listCreeps, rally_pos, rally_range, army_amount) {
		let state_combat = _.get(combat, "state_combat");
		let posRally = new RoomPosition(rally_pos.x, rally_pos.y, rally_pos.roomName);
		let creeps_rallied = _.filter(listCreeps, c => c.room.name == rally_pos.roomName && posRally.inRangeTo(c.pos, rally_range));
		if (state_combat == "rallying" && listCreeps.length > 0 && Game.time % 5 == 0) {
			if (creeps_rallied.length == listCreeps.length) {
				_.set(Memory, ["sites", "combat", combat_id, "state_combat"], "attacking");
				console.log(`<font color=\"#FFA100\">[Combat: ${combat_id}]</font> All creeps at rally point. Launching attack!`);
				return true;
			}
		} else if (Game.time % 50 == 0) {	
			console.log(`<font color=\"#FFA100\">[Combat: ${combat_id}]</font> Spawning and rallying troops, `
			+ `${creeps_rallied.length} of ${army_amount} at rally point.`);
		}
		return false;
	},
	
	creepBoost: function(creep, combat) {
		let rmColony = _.get(combat, ["colony"]);
		let _Combat = require("roles.combat");
		if (creep.room.name == rmColony) {						
			if (creep.memory.boost == null && !creep.isBoosted()) {
				if (_Combat.seekBoost(creep))
					return true;
			} else if (creep.memory.boost != null && !creep.isBoosted()
					&& _.get(creep.memory, ["boost", "pos", "x"]) 
					&& _.get(creep.memory, ["boost", "pos", "y"])
					&& _.get(creep.memory, ["boost", "pos", "roomName"])) {
				creep.travel(new RoomPosition(creep.memory.boost.pos.x, creep.memory.boost.pos.y, creep.memory.boost.pos.roomName));
				return true;
			}
		}
		return false;
	},

	creepRally: function(creep, rally_pos, rallyRange) {
		let posRally = new RoomPosition(rally_pos.x, rally_pos.y, rally_pos.roomName);

		if (creep.room.name != posRally.roomName)
			creep.travelToRoom(posRally.roomName, true);
		else if (creep.room.name == posRally.roomName) {
			if (!posRally.inRangeTo(creep.pos, rallyRange)) {
				creep.moveTo(posRally);
			} else if (creep.hasPart("attack") || creep.hasPart("ranged_attack")) {
				let hostile = _.head(creep.pos.findInRange(FIND_HOSTILE_CREEPS, 3, 
					{ filter: (c) => { return c.isHostile(); }}));
				if (hostile != null) {
					creep.rangedAttack(hostile);
					creep.attack(hostile);
				}
			} else if (creep.hasPart("heal")) {
				let wounded = _.head(creep.pos.findInRange(FIND_MY_CREEPS, 3, 
					{ filter: (c) => { return c.hits < c.hitsMax; }}));
				if (wounded != null) {
					if (creep.pos.getRangeTo(wounded) <= 1)
						creep.heal(wounded);
					else
						creep.heal(wounded);
				}
			} 
			
			if (Game.time % 15 == 0 && posRally.inRangeTo(creep.pos, rallyRange)) {
				creep.moveTo(posRally);	
			}
		}
	},

	creepRoles: function(listCreeps, tactic) {
		let target_creeps = _.get(tactic, "target_creeps");
		let target_structures = _.get(tactic, "target_structures");
		let target_list = _.get(tactic, "target_list");

		_.each(listCreeps, creep => {
			if (creep.memory.role == "scout") {
				Roles.Scout(creep);
			} else if (creep.memory.role == "soldier" 
					|| creep.memory.role == "brawler" 
					|| creep.memory.role == "paladin") {
				Roles.Soldier(creep, target_structures, target_creeps, target_list);
			} else if (creep.memory.role == "archer") {
				Roles.Archer(creep, target_structures, target_creeps, target_list);
			} else if (creep.memory.role == "dismantler") {
				Roles.Dismantler(creep, target_structures, target_list);
			} else if (creep.memory.role == "healer") {
				Roles.Healer(creep, true);
			} else if (creep.memory.role == "reserver") {
				Roles.Reserver(creep);
			}
		});
	},

	evaluateDefeat_CreepsWiped: function(combat_id, combat, listCreeps) {
		if (listCreeps.length == 0 && _.get(combat, ["tactic", "spawn_repeat"]) != true) {
			_.set(Memory, ["sites", "combat", combat_id, "state_combat"], "complete");
			console.log(`<font color=\"#FFA100\">[Combat: ${combat_id}]</font> Defeat detected by all friendly creeps killed! Stopping attack.`);
			return true;
		}
		return false;
	},

	evaluateVictory_TargetStructures: function(combat_id, combat, room_structures) {
		if (_.get(Game, ["rooms", _.get(combat, "target_room")]) != null) {
			let attack_structures = _.filter(room_structures,
				s => { return s.hits != null && s.hits > 0
					&& ((s.owner == null && s.structureType != "container")
					|| (s.owner != null && !s.my && s.owner != "Source Keeper" && s.structureType != "controller"
						&& _.get(Memory, ["hive", "allies"]).indexOf(s.owner.username) < 0)); });
			if (_.get(combat, ["tactic", "target_structures"]) == true && attack_structures.length == 0) {
				_.set(Memory, ["sites", "combat", combat_id, "state_combat"], "complete");
				console.log(`<font color=\"#FFA100\">[Combat: ${combat_id}]</font> Victory detected by destroying all structures! Stopping attack.`);
				return true;	
			}
		}
		return false;
	},

	evaluateVictory_TargetList: function(combat_id, combat, room_structures) {
		let target_list = _.get(combat, ["tactic", "target_list"]);

		if (target_list != null && _.get(combat, ["tactic", "target_structures"]) != true
				&& _.get(Game, ["rooms", _.get(combat, "target_room")]) != null) {
			let targets_remaining = _.filter(room_structures, s => {
				return target_list.indexOf(s.id) >= 0; });
			
			if (targets_remaining.length == 0) {
				_.set(Memory, ["sites", "combat", combat_id, "state_combat"], "complete");
				console.log(`<font color=\"#FFA100\">[Combat: ${combat_id}]</font> Victory detected by destroying all targets on target list! Stopping attack.`);
				return true;
			}
		}
		return false;
	},

	evaluateVictory_Controller: function(combat_id, combat) {
		if (_.get(Game, ["rooms", _.get(combat, "target_room")]) != null
			&& _.get(Game, ["rooms", _.get(combat, "target_room"), "controller", "owner"]) == null) {
				_.set(Memory, ["sites", "combat", combat_id, "state_combat"], "complete");
				return true;
		}
		return false;
	},

	setOccupation: function(combat_id, combat, tactic) {
		console.log(`<font color=\"#FFA100\">[Combat: ${combat_id}]</font> ` 
			+ `Setting occupation request in Memory; combat_id ${combat_id}-occupy.`);
		_.set(Memory, ["sites", "combat", `${combat_id}-occupy`], 
			{ colony: combat.colony, target_room: combat.target_room, 
				list_spawns: combat.list_spawns, list_route: combat.list_route, 
				tactic: { type: "occupy", target_creeps: tactic.target_creeps, target_structures: tactic.target_structures, 
					target_list: tactic.target_list } });
	}
};