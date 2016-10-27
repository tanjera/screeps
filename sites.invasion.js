let Roles = require("roles");
let Hive = require("hive");

let _CPU = require("util.cpu");

module.exports = {
	
	Run: function(rmColony, rmInvade, listSpawnRooms, listArmy, listTargets, posRally, listRoute) {
		if (!_.has(Memory, ["rooms", rmColony, `invasion_${rmInvade}`]))
			_.set(Memory, ["rooms", rmColony, `invasion_${rmInvade}`], { state: "spawning", time: Game.time });
		
		if (Hive.isPulse_Spawn()) {
			_CPU.Start(rmColony, `Invade-${rmInvade}-runPopulation`);
			this.runPopulation(rmColony, rmInvade, listSpawnRooms, listArmy);
			_CPU.End(rmColony, `Invade-${rmInvade}-runPopulation`);
		}
		
		_CPU.Start(rmColony, `Invade-${rmInvade}-runCreeps`);
		this.runCreeps(rmColony, rmInvade, listTargets, posRally, listRoute);
		_CPU.End(rmColony, `Invade-${rmInvade}-runCreeps`);
	},
	
	
	runPopulation: function(rmColony, rmInvade, listSpawnRooms, listArmy) {		
		let memory = _.get(Memory, ["rooms", rmColony, `invasion_${rmInvade}`]);
        
		if (memory.state == "spawning") {
			let lSoldier  = _.filter(Game.creeps, c => c.memory.role == "soldier" && c.memory.room == rmInvade && c.memory.colony == rmColony);
			let lArcher  = _.filter(Game.creeps, c => c.memory.role == "archer" && c.memory.room == rmInvade && c.memory.colony == rmColony);
			let lHealer  = _.filter(Game.creeps, c => c.memory.role == "healer" && c.memory.room == rmInvade && c.memory.colony == rmColony);
			
			if (Game.time % 30 == 0) {
				console.log(`<font color=\"#FFA100\">[Invading]</font> ${rmInvade}: Spawning troops, `					
				+ `${lSoldier.length + lArcher.length + lHealer.length} spawned`);
			}
			
			if (listArmy["soldier"] != null && lSoldier.length < listArmy["soldier"]["amount"]) {				
				Memory["spawn_requests"].push({ room: rmColony, listRooms: listSpawnRooms, priority: 0, level: listArmy["soldier"]["level"], 
					body: "soldier", name: null, args: {role: "soldier", room: rmInvade, colony: rmColony} });
			} else if (listArmy["archer"] != null && lArcher.length < listArmy["archer"]["amount"]) {				
				Memory["spawn_requests"].push({ room: rmColony, listRooms: listSpawnRooms, priority: 0, level: listArmy["archer"]["level"], 
					body: "archer", name: null, args: {role: "archer", room: rmInvade, colony: rmColony} });
			} else if (listArmy["healer"] != null && lHealer.length < listArmy["healer"]["amount"]) {
				Memory["spawn_requests"].push({ room: rmColony, listRooms: listSpawnRooms, priority: 0, level: listArmy["healer"]["level"], 
					body: "healer", name: null, args: {role: "healer", room: rmInvade, colony: rmColony} });
			} else if (memory.state == "spawning") {
				memory.state = "rallying";
			}
		}
	},
	
	runCreeps: function(rmColony, rmInvade, listTargets, posRally, listRoute) {
		let memory = _.get(Memory, ["rooms", rmColony, `invasion_${rmInvade}`]);
		let creeps = _.filter(Game.creeps, c => c.memory.room == rmInvade && c.memory.colony == rmColony);
		let rallyRange = 5;
		
		switch (memory.state) {
			default:
				return;
				
			case "rallying":
			case "spawning":
				let _Creep = require("util.creep");
                for (let c in creeps) {					
					let creep = creeps[c];
					creep.memory.listRoute = listRoute;
					
					if (creep.room.name != posRally.roomName)
						_Creep.moveToRoom(creep, posRally.roomName, true);
					else if (creep.room.name == posRally.roomName) {
						if (!posRally.inRangeTo(creep.pos, rallyRange))
							creep.moveTo(posRally);
						else if (Game.time % 15 == 0)
							creep.moveTo(posRally);
					}
						
				}
				
				if (memory.state == "rallying" && Game.time % 30 == 0) {
					console.log(`<font color=\"#FFA100\">[Invading]</font> ${rmInvade}: Rallying troops, `					
					+ `${_.filter(creeps, c => c.room.name == posRally.roomName && posRally.inRangeTo(c.pos, rallyRange)).length} `
					+ `of ${creeps.length} at rally point.`);
				}
				
				if (Game.time % 5 == 0 && creeps.length > 0) {
					memory.state = (_.filter(creeps, 
						c => c.room.name == posRally.roomName && posRally.inRangeTo(c.pos, rallyRange)).length == creeps.length)
						? "attacking" : memory.state;
						
					if (memory.state == "attacking")
						console.log(`<font color=\"#FFA100\">[Invading]</font> ${rmInvade}: Launching attack!!!!`);
				}
				
				return;
			
			case "attacking":
				for (let c in creeps) {
					let creep = creeps[c];
					if (creep.memory.role == "soldier") {
						Roles.Soldier(creep, true, listTargets);
					} else if (creep.memory.role == "archer") {
						Roles.Archer(creep, true, listTargets);
					} else if (creep.memory.role == "healer") {
						Roles.Healer(creep);
					}
				}
				
				if (creeps.length == 0)
					memory.state = "complete";
				
				return;
				
			case "complete":
				if (Game.time == null || Game.time - memory.time > 2000)
					delete memory;
					
				return;
		}		
	}
};