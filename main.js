var siteMining = require('site.mining');
var siteColony = require('site.colony');

var utilHive = require('util.hive');

module.exports.loop = function () {

    /* TO DO:
        - is miner -> link functioning entirely?
        - don't renew boosted creeps
    */     

  
    
    // siteColony.run rmColony, lvlMultiplier, popWorker, popRepairer, popUpgrader, popSoldier, listLinks)
    // siteMining.run (rmColony, rmHarvest, lvlMultiplier, popBurrower, popCarrier, popMiner, popMultirole, popReserver, popExtractor)

    /* Prepare hive functions/memory for this tick */
    utilHive.clearDeadMemory();
    utilHive.prepareHiveMemory();

    /* Colonies and in-colony mining operations */
    siteColony.run('W18S43', 0.8, 1, 1, 0, 0,       // W16S43 colony #1
            [{id: '57a2465268244ab107a96d5e', role: 'send'},
             {id: '57a24a31e620955e29e63e27', role: 'send'},
             {id: '57a24f9cacbffcb869dc9d21', role: 'receive'},
             {id: '57a25c61958cffd536325056', role: 'receive'}]);
    siteColony.run('W16S43', 0.8, 1, 1, 0, 0);      // W16S43 colony #2
    siteColony.run('W19S42', 1.0, 4, 1, 0, 0,       // W19S42 colony #3
            [{id: '57a23067cf975f59293d8a28', role: 'send'},
             {id: '57a23201113c59e97f7e364e', role: 'receive'},
             {id: '57a6a9d62d673fac4f21a62a', role: 'receive'}]);    
    siteColony.run('W15S41', 1.0, 5, 2, 2, 0);      // W15S41 colony #4

    siteMining.run('W18S43', 'W18S43', 1.0, 1, 2, 0, 0, 0, 0);    // W18S43 colony #1 mining
    siteMining.run('W16S43', 'W16S43', 0.8, 1, 1, 0, 0, 0, 0);    // W16S43 colony #2 mining
    siteMining.run('W19S42', 'W19S42', 1.0, 1, 2, 0, 0, 0, 0);    // W19S42 colony #3 mining
    siteMining.run('W15S41', 'W15S41', 1.0, 1, 2, 0, 0, 0, 0);    // W15S41 colony #4 mining
    
    /* All other mining operations */
    siteMining.run('W18S43', 'W17S43', 1.0, 1, 3, 0, 1, 1, 0);    // W17S43 mining operation (from Colony #1, W18S43)
    siteMining.run('W18S43', 'W19S43', 1.0, 1, 2, 0, 1, 1, 0);    // W19S43 mining operation (from Colony #1, W18S43)
    siteMining.run('W18S43', 'W17S42', 1.0, 1, 2, 0, 1, 1, 0);    // W17S42 mining operation (from Colony #1, W18S43)
    
    siteMining.run('W16S43', 'W16S42', 1.0, 1, 4, 0, 1, 1, 0);    // W16S42 mining operation (from Colony #2, W16S43)
    siteMining.run('W16S43', 'W14S43', 1.0, 1, 2, 0, 1, 1, 0);    // W14S43 mining operation (from Colony #2, W16S43)
    siteMining.run('W16S43', 'W15S43', 1.0, 1, 2, 0, 1, 1, 0);    // W15S43 mining operation (from Colony #2, W16S43)
    
    siteMining.run('W19S42', 'W18S42', 1.0, 1, 3, 0, 1, 1, 0);    // W18S42 mining operation (from Colony #3, W19S42)
    
    siteMining.run('W15S41', 'W15S42', 1.0, 1, 3, 0, 1, 1, 0);    // W15S42 mining operation (from Colony #4, W15S41)
    siteMining.run('W15S41', 'W16S41', 1.0, 1, 2, 0, 1, 1, 0);    // W16S41 mining operation (from Colony #4, W15S41)
    
    
    /* Run end-tick hive functions */
    utilHive.processSpawnRequests();
    utilHive.processSpawnRenewing();
}
