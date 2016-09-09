let _CPU = require("util.cpu");

module.exports = {
	
	/* For running a mining operation at a source or mineral guarded by source keepers.
	 * Note: Only burrowers and carriers are used- no miners, and no extractors.
	 * To extract minerals, run as if it were a regular source with the mineral's id as idSource.
	 */
	
	Run: function(rmColony, rmHarvest, spawnDistance, idSource, posRally, listPopulation, listRoute) {
		_CPU.Start(rmColony, `Mining-${idSource}-runPopulation`);
		this.runPopulation(rmColony, rmHarvest, spawnDistance, idSource, posRally, listPopulation);
		_CPU.End(rmColony, `Mining-${idSource}-runPopulation`);
	
		// Determine if operation is safe; if source keeper in 10 square range, then all to posRally! (except soldier)		
		let source = Game.getObjectById(idSource);
		let isSafe = source.room.find(FIND_HOSTILE_CREEPS, { filter: (c) => { 
					return !Object.keys(Memory["allies"]).includes(c.owner.username)
						&& c.pos.getRangeTo(source.pos.x, source.pos.y) < 10; }}).length == 0;
		
		_CPU.Start(rmColony, `Mining-${idSource}-runCreeps`);
		this.runCreeps(rmColony, rmHarvest, idSource, posRally, isSafe, listRoute);
		_CPU.End(rmColony, `Mining-${idSource}-runCreeps`);
	},
	
	
	runPopulation: function(rmColony, rmHarvest, spawnDistance, idSource, posRally, listPopulation) {
		
		let source = Game.getObjectById(idSource);
		if (source.mineralType != null && source.mineralAmount == 0)
			return;		
		
		let Hive = require("hive");
		
		let lSoldier = _.filter(Game.creeps, c => c.memory.role == "soldier_sk" && c.memory.room == rmHarvest 
				&& c.memory.source == idSource && (c.ticksToLive == undefined || c.ticksToLive > 160));
        let lBurrower = _.filter(Game.creeps, c => c.memory.role == "burrower_sk" && c.memory.room == rmHarvest 
				&& c.memory.source == idSource && (c.ticksToLive == undefined || c.ticksToLive > 160));
        let lCarrier = _.filter(Game.creeps, c => c.memory.role == "carrier_sk" && c.memory.room == rmHarvest 
				&& c.memory.source == idSource && (c.ticksToLive == undefined || c.ticksToLive > 160));        
        
        let popTarget = (
            listPopulation["soldier_sk"] == null ? 0 : listPopulation["soldier_sk"]["amount"])
			+ (listPopulation["burrower_sk"] == null ? 0 : listPopulation["burrower_sk"]["amount"])
            + (listPopulation["carrier_sk"] == null ? 0 : listPopulation["carrier_sk"]["amount"]);
        let popActual = lSoldier.length + lBurrower.length + lCarrier.length;
        Hive.populationTally(rmColony, popTarget, popActual);
        
        if (listPopulation["soldier_sk"] != null && lSoldier.length < listPopulation["soldier_sk"]["amount"]) {
			Hive.requestSpawn(rmColony, 0, 1, listPopulation["soldier_sk"]["level"], "soldier_sk", 
				null, {role: "soldier_sk", room: rmHarvest, colony: rmColony, source: idSource, rally: posRally});            
        }
        else if (listPopulation["burrower_sk"] != null && lBurrower.length < listPopulation["burrower_sk"]["amount"]) {
			Hive.requestSpawn(rmColony, spawnDistance, 1, listPopulation["burrower_sk"]["level"], "burrower", 
				null, {role: "burrower_sk", room: rmHarvest, colony: rmColony, source: idSource, rally: posRally});            
        }
        else if (listPopulation["carrier_sk"] != null && lCarrier.length < listPopulation["carrier_sk"]["amount"]) {
            if (listPopulation["carrier_sk"]["body"] == null) {
                Hive.requestSpawn(rmColony, spawnDistance, 1, listPopulation["carrier_sk"]["level"], "carrier", 
                    null, {role: "carrier_sk", room: rmHarvest, colony: rmColony, source: idSource, rally: posRally});
            } else if (listPopulation["carrier_sk"]["body"] == "all-terrain") {
                Hive.requestSpawn(rmColony, spawnDistance, 1, listPopulation["carrier_sk"]["level"], "carrier_at", 
                    null, {role: "carrier_sk", room: rmHarvest, colony: rmColony, source: idSource, rally: posRally});
            }
        }        
	},
	
	
	runCreeps: function(rmColony, rmHarvest, idSource, posRally, isSafe, listRoute) {
		let Roles = require("roles");
		
        for (let n in Game.creeps) {
            let creep = Game.creeps[n];
            if (creep.memory.room != null && creep.memory.colony != null && creep.memory.source != null
				&& creep.memory.room == rmHarvest && creep.memory.colony == rmColony && creep.memory.source == idSource) {
                
				creep.memory.listRoute = listRoute;
                
				if (creep.memory.role == "soldier_sk") {
					Roles.Soldier_SK(creep, isSafe);
				} else if (creep.memory.role == "burrower_sk" || creep.memory.role == "carrier_sk") {
					Roles.Mining_SK(creep, isSafe);
				}                 
            } 
        } 
	}
};