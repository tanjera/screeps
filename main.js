var siteMining = require('site.mining');
var siteColony = require('site.colony');

var utilHive = require('util.hive');

module.exports.loop = function () {

    /* TO DO:
        Add ranged attack to soldiers??

        Spawns can idly renew nearby creeps
    */     

    
    /* Prepare hive functions/memory for this tick */
    utilHive.clearDeadMemory();
    utilHive.prepareHiveMemory();

    /* Colonies and in-colony mining operations */
    siteColony.run('W18S43', 1, 2, 0);     // W16S43 colony #1
    siteColony.run('W16S43', 1, 2, 0);     // W16S43 colony #2
    siteColony.run('W19S42', 2, 4, 0);     // W19S42 colony #3    
    siteMining.run('W18S43', 'W18S43', 1, 2, 0, 0, 1);    // W18S43 colony #1 mining
    siteMining.run('W16S43', 'W16S43', 1, 3, 0, 0, 1);    // W16S43 colony #2 mining
    siteMining.run('W19S42', 'W19S42', 2, 2, 0, 0, 0);    // W19S42 colony #3 mining
    
    /* All other mining operations */
    siteMining.run('W18S43', 'W17S43', 1, 2, 0, 1, 0);    // W17S43 mining operation (from Colony #1, W18S43)
    siteMining.run('W18S43', 'W19S43', 1, 1, 0, 1, 0);    // W19S43 mining operation (from Colony #1, W18S43)
    siteMining.run('W18S43', 'W17S42', 1, 2, 0, 1, 0);    // W17S42 mining operation (from Colony #1, W18S43)
    
    siteMining.run('W16S43', 'W16S42', 1, 3, 0, 1, 0);    // W16S42 mining operation (from Colony #2, W16S43)
    siteMining.run('W16S43', 'W16S41', 1, 2, 0, 1, 0);    // W16S41 mining operation (from Colony #2, W16S43)
    
    /* Run end-tick hive functions */
    utilHive.processSpawnRequests();
}
