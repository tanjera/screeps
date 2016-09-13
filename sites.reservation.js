let Roles = require("roles");
let Hive = require("hive");


module.exports = {
	
	Run: function(rmColony, rmHarvest, spawnDistance, listPopulation, listRoute) {
        let lReserver  = _.filter(Game.creeps, (c) => c.memory.role == "reserver" && c.memory.room == rmHarvest && (c.ticksToLive == undefined || c.ticksToLive > 80));

        let popTarget = (listPopulation["reserver"] == null ? 0 : listPopulation["reserver"]["amount"]);
        let popActual = lReserver.length;
        Hive.populationTally(rmColony, popTarget, popActual);

        if (listPopulation["reserver"] != null && lReserver.length < listPopulation["reserver"]["amount"]) {            
			Memory["spawn_requests"].push({ room: rmColony, distance: spawnDistance, priority: 1, level: listPopulation["reserver"]["level"], 
				body: "reserver", name: null, args: {role: "reserver", room: rmHarvest, colony: rmColony} });
        }

        for (let n in Game.creeps) {
            let creep = Game.creeps[n];
            if (creep.memory.room != null && creep.memory.colony != null 
                    && creep.memory.room == rmHarvest && creep.memory.colony == rmColony) {
                creep.memory.listRoute = listRoute;
                if (creep.memory.role == "reserver") {
                    Roles.Reserver(creep);
                }
            }            
        } 
	}
};