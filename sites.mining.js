let _CPU = require("util.cpu");

module.exports = {
	
	Run: function(rmColony, rmHarvest, spawnDistance, hasKeepers, listPopulation, listRoute) {

		_CPU.Start(rmColony, `Mining-${rmHarvest}-runPopulation`);
		this.runPopulation(rmColony, rmHarvest, spawnDistance, hasKeepers, listPopulation);
		_CPU.End(rmColony, `Mining-${rmHarvest}-runPopulation`);
	
		_CPU.Start(rmColony, `Mining-${rmHarvest}-runCreeps`);
		this.runCreeps(rmColony, rmHarvest, hasKeepers, listRoute);
		_CPU.End(rmColony, `Mining-${rmHarvest}-runCreeps`);
	},
	
	
	runPopulation: function(rmColony, rmHarvest, spawnDistance, hasKeepers, listPopulation) {
		let Hive = require("hive");
		
		let lPaladin = _.filter(Game.creeps, c => c.memory.role == "paladin" && c.memory.room == rmHarvest && (c.ticksToLive == undefined || c.ticksToLive > 200));
		let lBurrower = _.filter(Game.creeps, c => c.memory.role == "burrower" && c.memory.room == rmHarvest && (c.ticksToLive == undefined || c.ticksToLive > 160));
        let lCarrier = _.filter(Game.creeps, c => c.memory.role == "carrier" && c.memory.room == rmHarvest && (c.ticksToLive == undefined || c.ticksToLive > 160));
        let lMiner = _.filter(Game.creeps, c => c.memory.role == "miner" && c.memory.room == rmHarvest && (c.ticksToLive == undefined || c.ticksToLive > 160));
        let lMultirole = _.filter(Game.creeps, c => c.memory.role == "multirole" && c.memory.room == rmHarvest);
        let lReserver = _.filter(Game.creeps, c => c.memory.role == "reserver" && c.memory.room == rmHarvest);
        let lExtractor = _.filter(Game.creeps, c => c.memory.role == "extractor" && c.memory.room == rmHarvest);

        let popTarget =
              (listPopulation["paladin"] == null ? 0 : listPopulation["paladin"]["amount"])
			+ (listPopulation["burrower"] == null ? 0 : listPopulation["burrower"]["amount"])
            + (listPopulation["carrier"] == null ? 0 : listPopulation["carrier"]["amount"])
            + (listPopulation["miner"] == null ? 0 : listPopulation["miner"]["amount"])
            + (listPopulation["multirole"] == null ? 0 : listPopulation["multirole"]["amount"])
            + (listPopulation["reserver"] == null ? 0 : listPopulation["reserver"]["amount"])
            + (listPopulation["extractor"] == null ? 0 : listPopulation["extractor"]["amount"]);
        let popActual = lPaladin.length + lBurrower.length + lCarrier.length + lMiner.length + lMultirole.length + lReserver.length + lExtractor.length;
        Hive.populationTally(rmColony, popTarget, popActual);

        if (listPopulation["paladin"] != null && lPaladin.length < listPopulation["paladin"]["amount"]) {
			Hive.requestSpawn(rmColony, 0, 1, listPopulation["paladin"]["level"], "paladin", 
				null, {role: "paladin", room: rmHarvest, colony: rmColony});
		} else if (hasKeepers == false && Object.keys(Game.rooms).includes(rmHarvest) && Game.rooms[rmHarvest].find(FIND_HOSTILE_CREEPS, 
                        {filter: (c) => { return !Object.keys(Memory["allies"]).includes(c.owner.username); }}).length > 0) {
            let lSoldier = _.filter(Game.creeps, (creep) => creep.memory.role == "soldier" && creep.memory.room == rmHarvest);
            if (lSoldier.length + lMultirole.length < Game.rooms[rmHarvest].find(FIND_HOSTILE_CREEPS, 
                        {filter: (c) => { return !Object.keys(Memory["allies"]).includes(c.owner.username); }}).length) {
                Hive.requestSpawn(rmColony, 0, 0, 8, "soldier", null, {role: "soldier", room: rmHarvest, colony: rmColony});
            }
        }
        else if (listPopulation["miner"] != null && lMiner.length < listPopulation["miner"]["amount"]) {
            if (lMiner.length == 0) { // Possibly colony wiped? Need restart?
                Hive.requestSpawn(rmColony, 0, 1, 1, "worker", null, {role: "miner", room: rmHarvest, colony: rmColony});
            } else {
                Hive.requestSpawn(rmColony, spawnDistance, 1, listPopulation["miner"]["level"], "worker", 
                    null, {role: "miner", room: rmHarvest, colony: rmColony});
            }    
        }
        else if (listPopulation["burrower"] != null && lBurrower.length < listPopulation["burrower"]["amount"]) {
            if (lCarrier.length == 0 && listPopulation["carrier"] != null && lMiner.length == 0) {// Possibly colony wiped? Need restart?
                Hive.requestSpawn(rmColony, 0, 1, 1, "worker", null, {role: "miner", room: rmHarvest, colony: rmColony});
            } else {
                Hive.requestSpawn(rmColony, spawnDistance, 1, listPopulation["burrower"]["level"], "burrower", 
                    null, {role: "burrower", room: rmHarvest, colony: rmColony});
            }
        }
        else if (listPopulation["carrier"] != null && lCarrier.length < listPopulation["carrier"]["amount"]) {
            if (listPopulation["carrier"]["body"] == null) {
                Hive.requestSpawn(rmColony, spawnDistance, 1, listPopulation["carrier"]["level"], "carrier", 
                    null, {role: "carrier", room: rmHarvest, colony: rmColony});
            } else if (listPopulation["carrier"]["body"] == "all-terrain") {
                Hive.requestSpawn(rmColony, spawnDistance, 1, listPopulation["carrier"]["level"], "carrier_at", 
                    null, {role: "carrier", room: rmHarvest, colony: rmColony});
            }
        }
        else if (listPopulation["multirole"] != null && lMultirole.length < listPopulation["multirole"]["amount"]) {
            Hive.requestSpawn(rmColony, spawnDistance, 2, listPopulation["multirole"]["level"], "multirole", 
                null, {role: "multirole", room: rmHarvest, colony: rmColony});
        }
        else if (listPopulation["reserver"] != null && lReserver.length < listPopulation["reserver"]["amount"] 
                    && Game.rooms[rmHarvest] != null && Game.rooms[rmHarvest].controller != null
                    && (Game.rooms[rmHarvest].controller.reservation == null || Game.rooms[rmHarvest].controller.reservation.ticksToEnd < 2000)) {
            Hive.requestSpawn(rmColony, 0, 2, listPopulation["reserver"]["level"], "reserver", 
                null, {role: "reserver", room: rmHarvest, colony: rmColony});            
        }
        else if (listPopulation["extractor"] != null && lExtractor.length < listPopulation["extractor"]["amount"] 
                    && Object.keys(Game.rooms).includes(rmHarvest)
                    && Game["rooms"][rmHarvest].find(FIND_MINERALS, {filter: (m) => { return m.mineralAmount > 0; }}).length > 0) {
            Hive.requestSpawn(rmColony, spawnDistance, 1, listPopulation["extractor"]["level"], "worker", 
                null, {role: "extractor", room: rmHarvest, colony: rmColony});    
        }
	},
	
	
	runCreeps: function(rmColony, rmHarvest, hasKeepers, listRoute) {
		let Roles = require("roles");
		
		let isSafe = !Object.keys(Game.rooms).includes(rmHarvest) || rmColony == rmHarvest 
					|| Game.rooms[rmHarvest].find(FIND_HOSTILE_CREEPS, { filter: (c) => 
						{ return !Object.keys(Memory["allies"]).includes(c.owner.username); }}).length == 0;
		
        for (let n in Game.creeps) {
            let creep = Game.creeps[n];                
            if (creep.memory.room != null && creep.memory.colony != null 
                    && creep.memory.room == rmHarvest && creep.memory.colony == rmColony) {
                
				creep.memory.listRoute = listRoute;
                
				if (hasKeepers == false) {
					if (isSafe == true) {
						if (creep.memory.role == "miner" || creep.memory.role == "burrower" || creep.memory.role == "carrier") {
							Roles.Mining(creep);
						} else if (creep.memory.role == "multirole") {
							Roles.Worker(creep);
						} else if (creep.memory.role == "reserver") {
							Roles.Reserver(creep);
						} else if (creep.memory.role == "extractor") {
							Roles.Extracter(creep);
						} 
					} else {
						if (creep.memory.role == "soldier" || creep.memory.role == "multirole") {
							Roles.Soldier(creep);
						}
					}
				} else if (hasKeepers == true) {
					if (creep.memory.role == "miner" || creep.memory.role == "burrower" || creep.memory.role == "carrier") {
						Roles.Mining(creep, true);
					} else if (creep.memory.role == "multirole") {
						Roles.Worker(creep, true);					
					} else if (creep.memory.role == "extractor") {
						Roles.Extracter(creep, true);
					} else if (creep.memory.role == "soldier" || creep.memory.role == "paladin") {
						Roles.Soldier(creep, false);
					}
				}
            }
        } 
	}
};