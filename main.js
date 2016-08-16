var siteColony = require('site.colony');
var siteMining = require('site.mining');
var siteReserve = require('site.reserve');

var utilHive = require('util.hive');

module.exports.loop = function () {

    /* TO DO:
        * add to utilCreep to try moveTo first, then moveTo(RoomPosition(25, 25, ''))
        * don't renew boosted creeps

        * task system:
            - add dismantle and combat tasks
            - cycle through all creeps, remove tasks from task list if already taken (immediately after compiling list!)            
            - utilCreep: add resource types to things like 'withdraw'
            - refactor 'reserver' to task system??
    */     

    
    // siteColony.run rmColony, lvlMultiplier, popWorker, popRepairer, popUpgrader, popSoldier, listLinks)
    // siteMining.run (rmColony, rmHarvest, tgtLevel, popBurrower, popCarrier, popMiner, popMultirole, popReserver, popExtractor)
    // siteReserve.run (rmColony, rmHarvest, tgtLevel, popReserver)

    /* Prepare hive functions/memory for this tick */
    utilHive.clearDeadMemory();
    utilHive.initMemory();
    utilHive.initTasks();

    /* Colonies and in-colony mining operations */
    siteColony.run('W18S43', 6, 2, 1, 0, 0,       // W16S43 colony #1
            [{id: '57a2465268244ab107a96d5e', role: 'send'},
             {id: '57a24a31e620955e29e63e27', role: 'send'},
             {id: '57a24f9cacbffcb869dc9d21', role: 'receive'},
             {id: '57a25c61958cffd536325056', role: 'receive'}]);
    siteColony.run('W16S43', 6, 1, 1, 0, 0);      // W16S43 colony #2
    siteColony.run('W19S42', 6, 4, 1, 0, 0,       // W19S42 colony #3
            [{id: '57a23067cf975f59293d8a28', role: 'send'},
             {id: '57a23201113c59e97f7e364e', role: 'receive'},
             {id: '57a6a9d62d673fac4f21a62a', role: 'receive'}]);    
    siteColony.run('W15S41', 6, 5, 1, 2, 0,       // W15S41 colony #4
            [{id: '57abd1d35c977d2d5fec0d0f', role: 'send'},            
             {id: '57abe33f4a8b4b5a2f1a2b85', role: 'receive'},
             {id: '57af99d528986c413c0a8f4c', role: 'receive'}]);

             // set all colonies to level 6 creeps

    siteMining.run('W18S43', 'W18S43', 6, 1, 2, 0, 0, 0, 0);    // W18S43 colony #1 mining
    siteMining.run('W16S43', 'W16S43', 5, 1, 1, 0, 0, 0, 0);    // W16S43 colony #2 mining
    siteMining.run('W19S42', 'W19S42', 6, 1, 2, 0, 0, 0, 0);    // W19S42 colony #3 mining
    siteMining.run('W15S41', 'W15S41', 6, 1, 2, 0, 0, 0, 0);    // W15S41 colony #4 mining
    
    /* All other mining operations */
    siteMining.run('W18S43', 'W17S43', 7, 1, 3, 0, 1, 1, 0);    // W17S43 mining operation (from Colony #1, W18S43)
    siteMining.run('W18S43', 'W19S43', 6, 1, 2, 0, 1, 1, 0);    // W19S43 mining operation (from Colony #1, W18S43)
    siteMining.run('W18S43', 'W17S42', 6, 1, 2, 0, 1, 1, 0);    // W17S42 mining operation (from Colony #1, W18S43)
    
    siteMining.run('W16S43', 'W16S42', 7, 1, 4, 0, 1, 1, 0);    // W16S42 mining operation (from Colony #2, W16S43)
    siteMining.run('W16S43', 'W14S43', 6, 1, 2, 0, 1, 1, 0);    // W14S43 mining operation (from Colony #2, W16S43)
    siteMining.run('W16S43', 'W15S43', 6, 1, 2, 0, 1, 1, 0);    // W15S43 mining operation (from Colony #2, W16S43)
    
    siteMining.run('W19S42', 'W18S42', 7, 1, 3, 0, 1, 1, 0);    // W18S42 mining operation (from Colony #3, W19S42)
    
    siteMining.run('W15S41', 'W15S42', 6, 1, 4, 0, 1, 1, 0);    // W15S42 mining operation (from Colony #4, W15S41)
    siteMining.run('W15S41', 'W14S42', 6, 1, 4, 0, 1, 1, 0);    // W15S42 mining operation (from Colony #4, W15S41)
    siteMining.run('W15S41', 'W16S41', 6, 1, 2, 0, 1, 1, 0);    // W16S41 mining operation (from Colony #4, W15S41)
    
    /* Reserve rooms for Atavus in W15S35 quad */
    siteReserve.run('W15S41', 'W15S39', 6, 1);
    
    /* Run end-tick hive functions */
    utilHive.processSpawnRequests();
    utilHive.processSpawnRenewing();
}
