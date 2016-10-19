let _CPU = require("util.cpu");
let Hive = require("hive");

module.exports = {
	
	Run: function(rmColony, listSpawnRooms, listPopulation, listLinks) {
		
		if (Hive.isPulse_Spawn()) {
			_CPU.Start(rmColony, "Colony-runPopulation");
			this.runPopulation(rmColony, listSpawnRooms, listPopulation);
			_CPU.End(rmColony, "Colony-runPopulation");
		}
		
		_CPU.Start(rmColony, "Colony-runCreeps");
		this.runCreeps(rmColony);
        _CPU.End(rmColony, "Colony-runCreeps");
		
		_CPU.Start(rmColony, "Colony-runTowers");
		this.runTowers(rmColony);
        _CPU.End(rmColony, "Colony-runTowers");
		
		_CPU.Start(rmColony, "Colony-runLinks");
		this.runLinks(rmColony, listLinks);
        _CPU.End(rmColony, "Colony-runLinks");
	},
	
	
	runPopulation: function(rmColony, listSpawnRooms, listPopulation) {		
		let lWorker = _.filter(Game.creeps, (creep) => creep.memory.role == "worker" && creep.memory.subrole == null && creep.memory.room == rmColony);
        let lRepairer = _.filter(Game.creeps, (creep) => creep.memory.role == "worker" && creep.memory.subrole == "repairer" && creep.memory.room == rmColony);
        let lUpgrader = _.filter(Game.creeps, (creep) => creep.memory.role == "worker" && creep.memory.subrole == "upgrader" && creep.memory.room == rmColony);
        let lSoldier = _.filter(Game.creeps, (creep) => creep.memory.role == "soldier" && creep.memory.room == rmColony);

        let popTarget = 
            (listPopulation["worker"] == null ? 0 : listPopulation["worker"]["amount"])
            + (listPopulation["repairer"] == null ? 0 : listPopulation["repairer"]["amount"])
            + (listPopulation["upgrader"] == null ? 0 : listPopulation["upgrader"]["amount"])
            + (listPopulation["soldier"] == null ? 0 : listPopulation["soldier"]["amount"]);        
        let popActual = lWorker.length + lRepairer.length + lUpgrader.length + lSoldier.length;
        Hive.populationTally(rmColony, popTarget, popActual);

        if ((listPopulation["soldier"] != null && lSoldier.length < listPopulation["soldier"]["amount"]) 
            || (lSoldier.length < Game.rooms[rmColony].find(FIND_HOSTILE_CREEPS, { filter: function(c) { 
                        return Memory["allies"].indexOf(c.owner.username) < 0; }}).length)) {                        
			Memory["spawn_requests"].push({ room: rmColony, listRooms: null, priority: 0, 
				level: (listPopulation["soldier"] == null ? 8 : listPopulation["soldier"]["level"]), 
				body: "soldier", name: null, args: {role: "soldier", room: rmColony} });
        } else if (listPopulation["worker"] != null && lWorker.length < listPopulation["worker"]["amount"]) {            
			Memory["spawn_requests"].push({ room: rmColony, listRooms: listSpawnRooms, priority: 3, level: listPopulation["worker"]["level"], 
				body: "worker", name: null, args: {role: "worker", room: rmColony} });
        } else if (listPopulation["repairer"] != null && lRepairer.length < listPopulation["repairer"]["amount"]) {            
			Memory["spawn_requests"].push({ room: rmColony, listRooms: listSpawnRooms, priority: 4, level: listPopulation["repairer"]["level"], 
				body: "worker", name: null, args: {role: "worker", subrole: "repairer", room: rmColony} });
        } else if (listPopulation["upgrader"] != null && lUpgrader.length < listPopulation["upgrader"]["amount"]) {            
			Memory["spawn_requests"].push({ room: rmColony, listRooms: listSpawnRooms, priority: 4, level: listPopulation["upgrader"]["level"], 
				scale_level: listPopulation["upgrader"]["scale_level"],
				body: "worker", name: null, args: {role: "worker", subrole: "upgrader", room: rmColony} });
        }
	},
	
	
	runCreeps: function (rmColony) {
		let Roles = require("roles");
		
		for (let n in Game.creeps) {
            let creep = Game.creeps[n];            
            if (creep.memory.room != null && creep.memory.room == rmColony) {
                if (creep.memory.role == "worker") {
                    Roles.Worker(creep);
                }
                else if (creep.memory.role == "soldier") {
                    Roles.Soldier(creep);
                }
            }
        }  
	},
	
	
	runTowers: function (rmColony) {
		let _Colony = require("util.colony");
		let towers = Game.rooms[rmColony].find(FIND_MY_STRUCTURES, { filter: (s) => { return s.structureType == STRUCTURE_TOWER; }});  
		
		let hostile = _.head(Game.rooms[rmColony].find(FIND_HOSTILE_CREEPS, { filter: function(c) {
				return Memory["allies"].indexOf(c.owner.username) < 0; }}));
		if (hostile != null) { // Anyone to attack?
			for (let t in towers) {
				towers[t].attack(hostile);
			}
			return;            
        }
            
		let injured = _.head(Game.rooms[rmColony].find(FIND_MY_CREEPS, { filter: function(c) { return c.hits < c.hitsMax; }}));
        if (injured != null) { // Anyone to heal?
			for (let t in towers) {
				if (towers[t].energy > towers[t].energyCapacity * 0.5) {
					towers[t].heal(injured);
				}
			}
			return;            
        }
			
		let structure = _Colony.findByNeed_RepairCritical(Game.rooms[rmColony]);
		if (structure != null) {
			for (let t in towers) {
				if (towers[t].energy > towers[t].energyCapacity * 0.5) { // Maintain structures with extra energy
					towers[t].repair(structure);
				}
			}
			return;
		}
	},
	
	
	runLinks: function (rmColony, listLinks) {
		Memory["rooms"][rmColony]["links"] = listLinks;
		if (listLinks != null) {
            let linksSend = _.filter(listLinks, (obj) => { return obj.id && obj["role"] == "send"; });
            let linksReceive = _.filter(listLinks, (obj) => { return obj.id && obj["role"] == "receive"; });

            for (let r = 0; r < linksReceive.length; r++) {
                for (let s = 0; s < linksSend.length; s++) {
                    let lSend = Game.getObjectById(linksSend[s]["id"]);
                    let lReceive = Game.getObjectById(linksReceive[r]["id"]);
                    if (lSend.energy > lSend.energyCapacity * 0.25 && lReceive.energy < lReceive.energyCapacity * 0.9) {
                        lSend.transferEnergy(lReceive);
                    }
                }
            }
        }		
	}
};