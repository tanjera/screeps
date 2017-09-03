let Roles = require("roles");
let Hive = require("hive");

let _CPU = require("util.cpu");

module.exports = {
	
	Run: function(rmColony, rmInvade) {
		if (_.get(Memory, ["rooms", rmColony, `invasion_${rmInvade}`]) == null)
			_.set(Memory, ["rooms", rmColony, `invasion_${rmInvade}`], { state: "spawning", time: Game.time });
		
		_CPU.Start(rmColony, "Invade-init");
		toOccupy = _.get(Memory, ["sites", "invasion", rmInvade, "occupy"]);
		listSpawnRooms = _.get(Memory, ["sites", "invasion", rmInvade, "spawn_assist"]);
		listArmy = _.get(Memory, ["sites", "invasion", rmInvade, "army"]);
		listTargets = _.get(Memory, ["sites", "invasion", rmInvade, "targets"]);
		posRally = _.get(Memory, ["sites", "invasion", rmInvade, "rally_point"]);
		listRoute = _.get(Memory, ["sites", "invasion", rmInvade, "route"]);
		_CPU.End(rmColony, "Invade-init");

		_CPU.Start(rmColony, `Invade-${rmInvade}-listCreeps`);
		let listCreeps = _.filter(Game.creeps, c => c.memory.room == rmInvade && c.memory.colony == rmColony);
		_CPU.End(rmColony, `Invade-${rmInvade}-listCreeps`);
		
		if (Hive.isPulse_Spawn()) {
			_CPU.Start(rmColony, `Invade-${rmInvade}-runPopulation`);
			this.runPopulation(rmColony, rmInvade, listCreeps, listSpawnRooms, listArmy);
			_CPU.End(rmColony, `Invade-${rmInvade}-runPopulation`);
		}
		
		_CPU.Start(rmColony, `Invade-${rmInvade}-runCreeps`);
		this.runCreeps(rmColony, rmInvade, toOccupy, listArmy, listCreeps, listTargets, posRally, listRoute);
		_CPU.End(rmColony, `Invade-${rmInvade}-runCreeps`);
	},
	
	
	runPopulation: function(rmColony, rmInvade, listCreeps, listSpawnRooms, listArmy) {		
		let memory = _.get(Memory, ["rooms", rmColony, `invasion_${rmInvade}`]);
        
		if (memory.state == "spawning") {
			let lSoldier  = _.filter(listCreeps, c => c.memory.role == "soldier");
			let lArcher  = _.filter(listCreeps, c => c.memory.role == "archer");
			let lHealer  = _.filter(listCreeps, c => c.memory.role == "healer");
			
			if (Game.time % 30 == 0) {
				console.log(`<font color=\"#FFA100\">[Invading]</font> ${rmInvade}: Spawning troops, `					
				+ `${lSoldier.length + lArcher.length + lHealer.length} spawned`);
			}
			
			if (listArmy["soldier"] != null && lSoldier.length < listArmy["soldier"]["amount"]) {				
				Memory["hive"]["spawn_requests"].push({ room: rmColony, listRooms: listSpawnRooms, priority: 0, level: listArmy["soldier"]["level"], 
					scale_level: listArmy["soldier"] == null ? true : listArmy["soldier"]["scale_level"],
					body: (listArmy["soldier"]["body"] || "soldier"), 
					name: null, args: {role: "soldier", room: rmInvade, colony: rmColony} });
			} else if (listArmy["archer"] != null && lArcher.length < listArmy["archer"]["amount"]) {				
				Memory["hive"]["spawn_requests"].push({ room: rmColony, listRooms: listSpawnRooms, priority: 0, level: listArmy["archer"]["level"], 
					scale_level: listArmy["archer"] == null ? true : listArmy["archer"]["scale_level"],
					body: "archer", name: null, args: {role: "archer", room: rmInvade, colony: rmColony} });
			} else if (listArmy["healer"] != null && lHealer.length < listArmy["healer"]["amount"]) {
				Memory["hive"]["spawn_requests"].push({ room: rmColony, listRooms: listSpawnRooms, priority: 0, level: listArmy["healer"]["level"], 
					scale_level: listArmy["healer"] == null ? true : listArmy["healer"]["scale_level"],
					body: "healer", name: null, args: {role: "healer", room: rmInvade, colony: rmColony} });
			} else if (memory.state == "spawning") {
				memory.state = "rallying";
			}
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