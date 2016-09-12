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
		let state = Memory["rooms"][rmColony][`${rmInvade}`];
		state = "spawning";
		
        let lSoldier  = _.filter(Game.creeps, c => c.memory.role == "soldier" && c.memory.room == rmInvade && c.memory.colony == rmColony);
		let lArcher  = _.filter(Game.creeps, c => c.memory.role == "archer" && c.memory.room == rmInvade && c.memory.colony == rmColony);
		let lHealer  = _.filter(Game.creeps, c => c.memory.role == "healer" && c.memory.room == rmInvade && c.memory.colony == rmColony);
        
        /* Sites.Invasion() is meant to be used temporarily, transiently. 
		 * It will consume energy, spawn time, and probably lots of CPU...
		*/

        if (listPopulation["soldier"] != null && lSoldier.length < listPopulation["soldier"]["amount"]) {
            Hive.requestSpawn(rmColony, spawnDistance, 1, listPopulation["soldier"]["level"], "soldier", 
                null, {role: "soldier", room: rmInvade, colony: rmColony});            
        } else if (listPopulation["archer"] != null && lArcher.length < listPopulation["archer"]["amount"]) {
            Hive.requestSpawn(rmColony, spawnDistance, 1, listPopulation["archer"]["level"], "archer", 
                null, {role: "archer", room: rmInvade, colony: rmColony});            
        } else if (listPopulation["healer"] != null && lHealer.length < listPopulation["healer"]["amount"]) {
            Hive.requestSpawn(rmColony, spawnDistance, 1, listPopulation["healer"]["level"], "healer", 
                null, {role: "healer", room: rmInvade, colony: rmColony});            
        } else {
			state = "rallying";
		}
	},
	
	runCreeps: function(rmColony, rmInvade, listTargets, posRally, listRoute) {
		let state = Memory["rooms"][rmColony][`${rmInvade}`];
		let creeps = _.filter(Game.creeps, c => c.memory.room == rmInvade && c.memory.colony == rmColony);
		
		switch (state) {
			default:
				break;
				
			case "rallying":
			case "spawning":
				let _Creep = require("util.creep");
                for (var c in creeps) {					
					let creep = creeps[c];
					creep.memory.listRoute = listRoute;
					
					if (creep.room.name != posRally.roomName)
						_Creep.moveToRoom(creep, posRally.roomName);
					else if (creep.room.name == posRally.roomName && !posRally.inRangeTo(creep.pos, 5))
						creep.moveTo(posRally);
				}
				
				state = (_.filter(creeps, c => creep.room.name == posRally.roomName && posRally.inRangeTo(creep.pos, 5)).length == creeps.length)
					? "attacking" : state;
			
				break;			
			
			case "attacking":
				for (var c in creeps) {
					let creep = creeps[c];
					if (creep.memory.role == "soldier") {
						Roles.Soldier(creep, listTargets);
					} else if (creep.memory.role == "archer") {
						Roles.Archer(creep, listTargets);
					} else if (creep.memory.role == "healer") {
						Roles.Healer(creep);
					}
				}
				break;
		}		
	}
};