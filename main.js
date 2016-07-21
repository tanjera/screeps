var siteMining = require('site.mining');
var siteColony = require('site.colony');


module.exports.loop = function () {

    // Clear dead creeps from Memory
    for (var n in Memory.creeps) {
        if (!Game.creeps[n]) {
            delete Memory.creeps[n];
        }
    }


/* TO DO:
    bugs:
        - miners are still being made???
    
    scale colony and mining op body parts by room controller level...

*/     


    // siteColony.run(spawn, rmColony, popRepairer, popWorker, popSoldier)
    // siteMining.run(spawn, rmDeliver, rmHarvest, popBurrower, popCarrier, popMiner)

    siteColony.run(Game.spawns.Spawn1, 'W18S43', 1, 6, 1);     // W16S43 colony #1
    siteMining.run(Game.spawns.Spawn2, 'W18S43', 'W18S43', 2, 4, 0);    // W18S43 colony #1 mining
    siteMining.run(Game.spawns.Spawn2, 'W18S43', 'W17S43', 2, 5, 0);    // W17S43 mining operation (from Colony #1, W18S43)
    siteMining.run(Game.spawns.Spawn2, 'W18S43', 'W19S43', 1, 3, 0);    // W19S43 mining operation (from Colony #1, W18S43)
    siteMining.run(Game.spawns.Spawn2, 'W18S43', 'W17S44', 1, 2, 0);    // W17S44 mining operation (from Colony #1, W18S43)

    siteColony.run(Game.spawns.Spawn2, 'W16S43', 1, 4, 1);     // W16S43 colony #2
    siteMining.run(Game.spawns.Spawn2, 'W16S43', 'W16S43', 1, 2, 0);    // W16S43 colony #2 mining
    siteMining.run(Game.spawns.Spawn2, 'W16S43', 'W16S42', 2, 4, 0);    // W16S42 mining operation (from Colony #2, W16S43)
    siteMining.run(Game.spawns.Spawn2, 'W16S43', 'W17S42', 1, 4, 0);    // W17S42 mining operation (from Colony #2, W16S43)
    siteMining.run(Game.spawns.Spawn2, 'W16S43', 'W16S41', 1, 3, 0);    // W16S41 mining operation (from Colony #2, W16S43)
    
}
