var siteMining = require('site.mining');
var siteColony = require('site.colony');

var utilHive = require('util.hive');

module.exports.loop = function () {

    /* TO DO:
        add logic for:
            - don't renew boosted creeps
            - fix link loop, add conditions (don't send to already ~full links!)
        

        target healers first...?         
    */     

/*
    var cr = Game.creeps['Mia'];
    var res = RESOURCE_OXYGEN;
    var term = Game.getObjectById('57a03063c20303fd1e5e125a');
    var lab = Game.getObjectById('57a02f90b712db3b1f1c399c');
    
    if (_.sum(cr.carry) == 0 && cr.withdraw(term, res) == ERR_NOT_IN_RANGE) {
        cr.moveTo(term);
    } else if (_.sum(cr.carry) >= 1000 && cr.transfer(lab, res) == ERR_NOT_IN_RANGE) {
        cr.moveTo(lab);
    }
*/
  
/*
  var lab1 = Game.getObjectById('57a02f90b712db3b1f1c399c');
  var lab2 = Game.getObjectById('57a0539e25bdfd7a71d9a527');
  var lab3 = Game.getObjectById('579f9f2549708a4306732b3e');
  
  lab3.runReaction(lab1, lab2);
*/  
  
  
    
    // siteColony.run (rmColony, popWorker, popRepairer, popUpgrader, popSoldier, listLinks)
    // siteMining.run (rmColony, rmHarvest, popBurrower, popCarrier, popMiner, popReserver, popExtractor)

    /* Prepare hive functions/memory for this tick */
    utilHive.clearDeadMemory();
    utilHive.prepareHiveMemory();

    /* Colonies and in-colony mining operations */
    siteColony.run('W18S43', 2, 1, 0, 0,       // W16S43 colony #1
            [{id: '57a2465268244ab107a96d5e', role: 'send'},
             {id: '57a24a31e620955e29e63e27', role: 'send'},
             {id: '57a24f9cacbffcb869dc9d21', role: 'receive'},
             {id: '57a25c61958cffd536325056', role: 'receive'}]);
    siteColony.run('W16S43', 4, 1, 0, 0);      // W16S43 colony #2
    siteColony.run('W19S42', 5, 1, 0, 0,       // W19S42 colony #3
            [{id: '57a23067cf975f59293d8a28', role: 'send'},
             {id: '57a23201113c59e97f7e364e', role: 'receive'}]);    
    siteColony.run('W15S41', 4, 1, 1, 0);      // W15S41 colony #4
    siteMining.run('W18S43', 'W18S43', 1, 2, 0, 0, 0);    // W18S43 colony #1 mining
    siteMining.run('W16S43', 'W16S43', 1, 2, 0, 0, 1);    // W16S43 colony #2 mining
    siteMining.run('W19S42', 'W19S42', 1, 2, 0, 0, 1);    // W19S42 colony #3 mining
    siteMining.run('W15S41', 'W15S41', 2, 2, 0, 0, 0);    // W15S41 colony #4 mining
    
    /* All other mining operations */
    siteMining.run('W18S43', 'W17S43', 1, 3, 0, 1, 0);    // W17S43 mining operation (from Colony #1, W18S43)
    siteMining.run('W18S43', 'W19S43', 1, 2, 0, 1, 0);    // W19S43 mining operation (from Colony #1, W18S43)
    siteMining.run('W18S43', 'W17S42', 1, 2, 0, 1, 0);    // W17S42 mining operation (from Colony #1, W18S43)
    
    siteMining.run('W16S43', 'W16S42', 1, 3, 0, 1, 0);    // W16S42 mining operation (from Colony #2, W16S43)
    siteMining.run('W16S43', 'W16S41', 1, 2, 0, 1, 0);    // W16S41 mining operation (from Colony #2, W16S43)
    siteMining.run('W16S43', 'W15S43', 1, 2, 0, 1, 0);    // W15S43 mining operation (from Colony #2, W16S43)
    
    siteMining.run('W19S42', 'W18S42', 1, 3, 0, 1, 0);    // W18S42 mining operation (from Colony #3, W19S42)
    
    /* Run end-tick hive functions */
    utilHive.processSpawnRequests();
    utilHive.processSpawnRenewing();
}
