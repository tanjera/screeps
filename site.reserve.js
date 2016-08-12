var rolesMining = require('roles.mining');

var utilHive = require('util.hive');

var siteReserve = {

    run: function(rmColony, rmHarvest, lvlMultiplier, popReserver) {

        var lReserver  = _.filter(Game.creeps, (c) => c.memory.role == 'reserver' && c.memory.room == rmHarvest);
        
        var popTarget = popReserver;
        var popActual = lReserver.length;
        utilHive.populationTally(rmColony, popTarget, popActual);

        // Defend the mining op!
        if (lReserver.length < popReserver) {
            utilHive.requestSpawn(rmColony, 0, 2, lvlMultiplier, 'reserver', null, {role: 'reserver', room: rmHarvest});            
        }

        // Run roles!
        for (var n in Game.creeps) {
            var creep = Game.creeps[n];
                
            if (creep.memory.room != null && creep.memory.room == rmHarvest) {                
                if (creep.memory.role == 'reserver') {
                    rolesMining.Reserve(creep);
                } 
            }            
        }
    }
};

module.exports = siteReserve;
