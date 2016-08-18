var _Sites = require('_sites');
var _Hive = require('_hive');

module.exports.loop = function () {

    /* TO DO:
        * task system:
            - add dismantle and combat tasks            
            - utilCreep: add resource types to things like 'withdraw'
            - refactor 'reserver' to task system??
    */     


    // _Sites.Colony (rmColony, spawnDistance, tgtLevel, popWorker, popRepairer, popUpgrader, popSoldier, listLinks)
    // _Sites.Mining (rmColony, rmHarvest, spawnDistance, tgtLevel, popBurrower, popCarrier, popMiner, popMultirole, popReserver, popExtractor, listRoute)
    // _Sites.Reservation (rmColony, rmHarvest, spawnDistance, tgtLevel, popReserver, listRoute)
    // _Hive.requestSpawn (rmName, spawnDistance, lvlPriority, tgtLevel, cBody, cName, cArgs)


    /* Prepare _Hive functions/memory for this tick */
    _Hive.clearDeadMemory();
    _Hive.initMemory();
    _Hive.initTasks();

    /* Colonies and in-colony mining operations */
    _Sites.Colony('W18S43', 3, 6,  1, 1, 1, 0,       // W16S43 colony #1
            [{id: '57a2465268244ab107a96d5e', role: 'send'},
             {id: '57a24a31e620955e29e63e27', role: 'send'},
             {id: '57a24f9cacbffcb869dc9d21', role: 'receive'},
             {id: '57a25c61958cffd536325056', role: 'receive'}]);
    _Sites.Colony('W19S42', 3, 6,  4, 1, 1, 0,       // W19S42 colony #2
            [{id: '57a23067cf975f59293d8a28', role: 'send'},
             {id: '57a23201113c59e97f7e364e', role: 'receive'},
             {id: '57a6a9d62d673fac4f21a62a', role: 'receive'}]);    
    _Sites.Colony('W15S41', 3, 4,  2, 1, 2, 0,       // W15S41 colony #3
            [{id: '57abd1d35c977d2d5fec0d0f', role: 'send'},            
             {id: '57abe33f4a8b4b5a2f1a2b85', role: 'receive'},
             {id: '57af99d528986c413c0a8f4c', role: 'receive'}]);
    _Sites.Colony('W15S43', 3, 4,  6, 1, 1, 0);      // W15S43 colony #4

    _Sites.Mining('W18S43', 'W18S43', 2, 6,  1, 2, 0, 0, 0, 0);    // W18S43 colony #1 mining
    _Sites.Mining('W19S42', 'W19S42', 2, 6,  1, 2, 0, 0, 0, 0);    // W19S42 colony #2 mining
    _Sites.Mining('W15S41', 'W15S41', 2, 5,  1, 2, 0, 0, 0, 0);    // W15S41 colony #3 mining
    _Sites.Mining('W15S43', 'W15S43', 2, 4,  1, 1, 0, 0, 0, 0);    // W15S43 colony #2 mining
    
    /* All other mining operations */
    _Sites.Mining('W18S43', 'W17S43', 2, 6,  1, 3, 0, 1, 1, 0);    // W17S43 mining operation (from Colony #1, W18S43)
    _Sites.Mining('W18S43', 'W19S43', 2, 5,  1, 2, 0, 1, 1, 0);    // W19S43 mining operation (from Colony #1, W18S43)
    _Sites.Mining('W18S43', 'W17S42', 2, 5,  1, 2, 0, 1, 1, 0);    // W17S42 mining operation (from Colony #1, W18S43)
    
    _Sites.Mining('W19S42', 'W18S42', 2, 6,  1, 3, 0, 1, 1, 0);    // W18S42 mining operation (from Colony #2, W19S42)
    
    _Sites.Mining('W15S41', 'W15S42', 2, 3,  1, 2, 0, 1, 1, 0);    // W15S42 mining operation (from Colony #3, W15S41)
    _Sites.Mining('W15S41', 'W14S42', 2, 5,  1, 3, 0, 1, 1, 0);    // W15S42 mining operation (from Colony #3, W15S41)
    _Sites.Mining('W15S41', 'W16S41', 2, 3,  1, 2, 0, 1, 1, 0);    // W16S41 mining operation (from Colony #3, W15S41)
    _Sites.Mining('W15S41', 'W16S42', 2, 4,  1, 3, 0, 1, 1, 0,     // W16S42 mining operation (from Colony #4, W15S43)
            ['W15S41', 'W16S41', 'W16S42']);
    
    _Sites.Mining('W15S43', 'W16S43', 2, 6,  1, 2, 0, 1, 1, 0);    // W14S43 mining operation (from Colony #4, W15S43)
    _Sites.Mining('W15S43', 'W14S43', 2, 6,  1, 2, 0, 1, 1, 0);    // W15S43 mining operation (from Colony #4, W15S43)
    _Sites.Mining('W15S43', 'W15S45', 0, 6,  1, 4, 0, 1, 0, 0);    // W15S45 mining operation (from Colony #4, W15S43)

    /* Reserve rooms for Atavus in W15S35 quad */
    _Sites.Reservation('W15S41', 'W15S39', 0, 6,  1);
    _Sites.Reservation('W15S41', 'W13S39', 0, 6,  1,
            ['W15S41', 'W15S40', 'W14S40', 'W13S40', 'W13S39']);
    
    /* Run end-tick _Hive functions */
    _Hive.processSpawnRequests();
    _Hive.processSpawnRenewing();
}
