let Roles = require("roles");
let Hive = require("hive");

let _CPU = require("util.cpu");

module.exports = {
	
	Run: function(rmColony, rmInvade, spawnDistance, listArmy, listTargets, posRally, listRoute) {
		_CPU.Start(rmColony, `Invade-${rmInvade}-runPopulation`);
		this.runPopulation(rmColony, rmInvade, spawnDistance, listArmy);
		_CPU.End(rmColony, `Invade-${rmInvade}-runPopulation`);
		
		_CPU.Start(rmColony, `Invade-${rmInvade}-runCreeps`);
		this.runCreeps(rmColony, rmInvade, listTargets, posRally, listRoute);
		_CPU.End(rmColony, `Invade-${rmInvade}-runCreeps`);
	},
	
	
	runPopulation: function(rmColony, rmInvade, spawnDistance, listArmy) {
		if (Memory["rooms"][rmColony][`invasion_${rmInvade}`] == null)
			Memory["rooms"][rmColony][`invasion_${rmInvade}`] = { state: "spawning" };
		let memory = Memory["rooms"][rmColony][`invasion_${rmInvade}`];		
        
		if (memory.state == "spawning") {
			let lSoldier  = _.filter(Game.creeps, c => c.memory.role == "soldier" && c.memory.room == rmInvade && c.memory.colony == rmColony);
			let lArcher  = _.filter(Game.creeps, c => c.memory.role == "archer" && c.memory.room == rmInvade && c.memory.colony == rmColony);
			let lHealer  = _.filter(Game.creeps, c => c.memory.role == "healer" && c.memory.room == rmInvade && c.memory.colony == rmColony);
			
			if (listArmy["soldier"] != null && lSoldier.length < listArmy["soldier"]["amount"]) {				
				Memory["spawn_requests"].push({ room: rmColony, distance: spawnDistance, priority: 0, level: listArmy["soldier"]["level"], 
					body: "soldier", name: null, args: {role: "soldier", room: rmInvade, colony: rmColony} });
			} else if (listArmy["archer"] != null && lArcher.length < listArmy["archer"]["amount"]) {				
				Memory["spawn_requests"].push({ room: rmColony, distance: spawnDistance, priority: 0, level: listArmy["archer"]["level"], 
					body: "archer", name: null, args: {role: "archer", room: rmInvade, colony: rmColony} });
			} else if (listArmy["healer"] != null && lHealer.length < listArmy["healer"]["amount"]) {
				Memory["spawn_requests"].push({ room: rmColony, distance: spawnDistance, priority: 0, level: listArmy["healer"]["level"], 
					body: "healer", name: null, args: {role: "healer", room: rmInvade, colony: rmColony} });
			} else if (memory.state == "spawning") {
				memory.state = "rallying";
			}
		}
	},
	
	runCreeps: function(rmColony, rmInvade, listTargets, posRally, listRoute) {
		let memory = Memory["rooms"][rmColony][`invasion_${rmInvade}`];
		let creeps = _.filter(Game.creeps, c => c.memory.room == rmInvade && c.memory.colony == rmColony);
		let rallyRange = 3;
		
		switch (memory.state) {
			default:
				break;
				
			case "rallying":
			case "spawning":
				let _Creep = require("util.creep");
                for (let c in creeps) {					
					let creep = creeps[c];
					creep.memory.listRoute = listRoute;
					
					if (creep.room.name != posRally.roomName)
						_Creep.moveToRoom(creep, posRally.roomName, true);
					else if (creep.room.name == posRally.roomName && !posRally.inRangeTo(creep.pos, rallyRange))
						creep.moveTo(posRally);
				}
				
				if (Game.time % 5 == 0) {
					memory.state = (_.filter(creeps, 
						c => c.room.name == posRally.roomName && posRally.inRangeTo(c.pos, rallyRange)).length == creeps.length)
						? "attacking" : memory.state;
				}			
				break;			
			
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
				
				break;
		}		
	}
};