let Roles = require("roles");
let Hive = require("hive");


module.exports = {
	
	Run: function(rmColony, rmOccupy, spawnDistance, listPopulation, listRoute) {
        let lSoldier  = _.filter(Game.creeps, (c) => c.memory.role == "soldier" && c.memory.room == rmOccupy && (c.ticksToLive == undefined || c.ticksToLive > 80));
        
        let popTarget = (listPopulation["soldier"] == null ? 0 : listPopulation["soldier"]["amount"]);
        let popActual = lSoldier.length;
        Hive.populationTally(rmColony, popTarget, popActual);

        if (listPopulation["soldier"] != null && lSoldier.length < listPopulation["soldier"]["amount"]) {
            Hive.requestSpawn(rmColony, spawnDistance, 1, listPopulation["soldier"]["level"], "soldier", 
                null, {role: "soldier", room: rmOccupy, colony: rmColony});            
        }

        for (let n in Game.creeps) {
            let creep = Game.creeps[n];
            if (creep.memory.room != null && creep.memory.colony != null 
                    && creep.memory.room == rmOccupy && creep.memory.colony == rmColony) {
                creep.memory.listRoute = listRoute;
                if (creep.memory.role == "soldier") {
                    Roles.Soldier(creep);
                }
            }            
        } 
	}
};