let Roles = require("roles");
let Hive = require("hive");

let _CPU = require("util.cpu");

module.exports = {
	
/* Memory Structure
 *
 * sites.memory_id
 * sites.memory_id.tactic			<<< set by console command
 * 		- tactic.type		<< set by console command
 * 		- tactic.army		<< population list; set by setPopulation()
 * sites.memory_id.colony			<<< set by console command
 * sites.memory_id.list_spawns		<<< set by console command
 * sites.memory_id.state_spawning	<<< set by tactic; spawning, constant, complete
 * sites.memory_id.state_combat		<<< spawning, attacking, etc; 
 * 
 * 
 * To Implement
 * 	- setPopulation(): set tactic.army
 *  - runTactics()...
*/


	Run: function(memory_id) {
		if (_.get(Memory, ["sites", memory_id, "tactic"]) == null)
			return;
		
		if (Hive.isPulse_Spawn()) {
			_CPU.Start(rmColony, `Combat-${memory_id}-runPopulation`);
			this.runPopulation(memory_id);
			_CPU.End(rmColony, `Combat-${memory_id}-runPopulation`);
		}
		
		_CPU.Start(rmColony, `Combat-${memory_id}-runTactic`);
		_CPU.End(rmColony, `Combat-${memory_id}-runTactic`);
	},
	
	
	runPopulation: function(memory_id, tactic) {
		let memory = _.get(Memory, ["sites", memory_id]);
		let spawn_state = _.get(memory, "spawn_state");
		
		if (spawn_state == "spawning" || spawn_state == "constant") {
			let _Colony = require("util.colony");
			let listArmy = _.get(memory, ["tactic", "army"]);
			let rmColony = _.get(memory, ["colony"]);
			let rmLevel = _Colony.getRoom_Level(rmColony);
			let listSpawnRooms = _.get(memory, ["list_spawns"]);

			let listCreeps = _.filter(Game.creeps, c => { return _.get(c, ["memory", "combat_id"]) == memory_id; });

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
						args: {role: role, combat_id: memory_id, room: null, colony: rmColony} });
				}
			}

			if (spawn_state == "spawning" && listCreeps.length == listArmy.length)
				_.set(memory, "spawn_state", "complete");
		}
	},
	
	runCreeps: function(rmColony, rmInvade, toOccupy, listArmy, listCreeps, listTargets, posRally, listRoute) {
		let memory = _.get(Memory, ["rooms", rmColony, `invasion_${rmInvade}`]);
		let rallyRange = 5;
		
		switch (memory.state) {
			default:
				return;
				
			case "rallying":
			case "spawning":
				let _Creep = require("util.creep");
				let _Combat = require("roles.combat");
                _.each(listCreeps, creep => {
					creep.memory.listRoute = listRoute;					
					
					if (creep.room.name == rmColony) {						
						if (creep.memory.boost == null && !creep.isBoosted()) {
							if (_Combat.seekBoost(creep))
								return;
						} else if (creep.memory.boost != null && !creep.isBoosted()) {
							creep.moveTo(creep.memory.boost.pos.x, creep.memory.boost.pos.y);
							return;
						}					
					} 
					
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
						
				});
				
				if (memory.state == "rallying" && Game.time % 30 == 0) {
					console.log(`<font color=\"#FFA100\">[Invading]</font> ${rmInvade}: Rallying troops, `					
					+ `${_.filter(listCreeps, c => c.room.name == posRally.roomName && posRally.inRangeTo(c.pos, rallyRange)).length} `
					+ `of ${listCreeps.length} at rally point.`);
				}
				
				if (Game.time % 5 == 0 && listCreeps.length > 0) {
					memory.state = (_.filter(listCreeps, 
						c => c.room.name == posRally.roomName && posRally.inRangeTo(c.pos, rallyRange)).length == listCreeps.length)
						? "attacking" : memory.state;
						
					if (memory.state == "attacking")
						console.log(`<font color=\"#FFA100\">[Invading]</font> ${rmInvade}: Launching attack!!!!`);
				}
				
				return;
			
			case "attacking":
				_.each(listCreeps, creep => {
					if (creep.memory.role == "soldier") {
						Roles.Soldier(creep, true, true, listTargets);
					} else if (creep.memory.role == "archer") {
						Roles.Archer(creep, true, true, listTargets);
					} else if (creep.memory.role == "healer") {
						Roles.Healer(creep);
					}
				});
				
				if (listCreeps.length == 0)
					memory.state = "complete";
				
				return;
				
			case "complete":
				_.set(Memory, ["rooms", rmColony, `invasion_${rmInvade}`], null);
				_.set(Memory, ["sites", "invasion", rmInvade], null);

				if (toOccupy == true) {
					_.set(Memory, ["sites", "occupation", rmTarget], { from: rmColony, target: rmInvade,
						spawn_assist: listSpawnRooms, army: listArmy, targets: listTargets, route: listRoute });
				}
				
				return;
		}		
	}
};