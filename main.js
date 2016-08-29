let _Sites = require("_sites");
let _Hive = require("_hive");

const var __Logs = require("__logs");

module.exports.loop = function () {

    /* To do: 
		* Needs debugging!!!
			- Ensure spawn renewing still works (changed for(let i = 0; ...; i++) to for (let i in ...)
			- Memory["hive"] -> Memory... everything populating and reading properly?
				- Spawns all spawning properly??
				- Tasks populating and being accepted properly?
			- Terminal code working?
				- Terminal requests functioning?
				- Tasks being created for courier to fill terminals?
				- If functioning: uncomment terminal.send() so it"ll work!
			- Sites.Industry
				- action: empty running properly?
				- if lab has wrong mineral, task to empty lab functioning?
				- boosting works?? supplies lab properly? boosts creeps properly??
				- everything working as expected?
			- Game.__Logs work from console??!?
			        
		* _Hive.runEconomy
			- ensure a courier is available and working! May need to invoke a _Sites.Industry for it?
			- add standing terminal withdraw tasks (but don't overlap with orders!)
				- for (let resource in terminal.store) { create "withdraw" task for courier }
			
		* CPU management
            - add wait task for multirole!
			- implement creeps moving by path? e.g.:
				if (creep.moveByPath(creep.memory.path) == ERR_NOT_FOUND) {
					creep.memory.path = creep.pos.findPathTo(destination);
					creep.moveByPath(creep.memory.path)
				}

        * _Sites.Industry & _Tasks:
            - integrate boosting into regular tasks!
                - create task route (in _Tasks.assignTask and __Creep.runTask; type "boost", subtype "upgrade | heal")                
                - inject task via _Sites.Industry                            

        * _Tasks
            - add dismantle tasks
            - utilCreep: add resource types to all tasks? e.g. "withdraw"
			
		* screeps-profiler?
    */      


    /* Prepare _Hive functions/memory for this tick */
    _Hive.clearDeadMemory();
    _Hive.initMemory();
    _Hive.initTasks();
	//_Hive.processRequests();
	//_Hive.runEconomy();
	

    /* Colony #1, W18S43 */
    _Sites.Colony("W18S43", 2,
            { worker:   {level: 6, amount: 1},
              repairer: {level: 6, amount: 1},
              upgrader: {level: 7, amount: 1} },
            [{id: "57a2465268244ab107a96d5e", role: "send"},
             {id: "57a24a31e620955e29e63e27", role: "send"},
             {id: "57a24f9cacbffcb869dc9d21", role: "receive"},
             {id: "57a25c61958cffd536325056", role: "receive"}]);
    _Sites.Mining("W18S43", "W18S43", 2,
            { burrower:  {level: 7, amount: 1},
              carrier:   {level: 7, amount: 2} } );
    _Sites.Industry("W18S43", 2,
            { courier:   {level: 5, amount: 1} },
            { UH1:   { action: "reaction", 
                      reactor: {mineral: "UH",  lab: "57bc412f58d9edd776d1a39e"},
                      supply1: {mineral: "U",   lab: "57bc12855c9bd87c51d9abda"},
                      supply2: {mineral: "H",   lab: "57bc7f418cd23da102392560"} },
              UH2:   { action: "reaction", 
                      reactor: {mineral: "UH",  lab: "57a0539e25bdfd7a71d9a527"},
                      supply1: {mineral: "U",   lab: "57bc12855c9bd87c51d9abda"},
                      supply2: {mineral: "H",   lab: "57bc7f418cd23da102392560"} },
              UH2O:   { action: "reaction", 
                      reactor: {mineral: "UH2O",  lab: "579f9f2549708a4306732b3e"},
                      supply1: {mineral: "UH",   lab: "57bc412f58d9edd776d1a39e"},
                      supply2: {mineral: "OH",   lab: "57a02f90b712db3b1f1c399c"} } },
            { t_H:  {type: "industry", subtype: "withdraw", resource: "H", id: "57a03063c20303fd1e5e125a", timer: 10, creeps: 8, priority: 4 },
              t_en: {type: "industry", subtype: "withdraw", resource: "energy", id: "57a03063c20303fd1e5e125a", timer: 10, creeps: 8, priority: 4 } } );

    /* Colony #2, W19S42 */
    _Sites.Colony("W19S42", 2,
            { worker:   {level: 7, amount: 2},
              repairer: {level: 6, amount: 1},
              upgrader: {level: 6, amount: 1} },
            [{id: "57a23067cf975f59293d8a28", role: "send"},
             {id: "57a23201113c59e97f7e364e", role: "receive"},
             {id: "57a6a9d62d673fac4f21a62a", role: "receive"}]);    
    _Sites.Mining("W19S42", "W19S42", 2,
            { burrower:  {level: 6, amount: 1},
              carrier:   {level: 6, amount: 2},              
              extractor: {level: 6, amount: 1} } );

    /* Colony #3, W15S41 */
    _Sites.Colony("W15S41", 2,
            { worker:   {level: 6, amount: 2},
              repairer: {level: 6, amount: 1},
              upgrader: {level: 6, amount: 1} },
            [{id: "57abd1d35c977d2d5fec0d0f", role: "send"},
             {id: "57bcc544ee84657d138c5866", role: "send"},            
             {id: "57abe33f4a8b4b5a2f1a2b85", role: "receive"},
             {id: "57af99d528986c413c0a8f4c", role: "receive"}]);
    _Sites.Mining("W15S41", "W15S41", 2,
            { burrower:  {level: 6, amount: 1},
              carrier:   {level: 6, amount: 2},              
              extractor: {level: 6, amount: 2} } );

    /* Colony #4, W15S43 */
    _Sites.Colony("W15S43", 2,
            { worker:   {level: 6, amount: 2},
              repairer: {level: 5, amount: 1},
              upgrader: {level: 6, amount: 2} } );      
    _Sites.Mining("W15S43", "W15S43", 2,
            { burrower:  {level: 4, amount: 1},
              carrier:   {level: 5, amount: 2} } );
              
    /* Colony #5, W13S41 */
    _Sites.Colony("W13S41", 2,
            { worker:   {level: 4, amount: 4},
              repairer: {level: 4, amount: 1},
              upgrader: {level: 4, amount: 3} },              
            [{id: "57c04f3012c844604895d81f", role: "send"},             
             {id: "57c06b8698040e1908490daf", role: "receive"}]);      
    _Sites.Mining("W13S41", "W13S41", 3,
            { burrower:  {level: 4, amount: 2},
              carrier:   {level: 4, amount: 3} } );


    /* Remote mining operations for Colony #1, W18S43 */
    _Sites.Mining("W18S43", "W17S43", 2,
            { burrower:  {level: 7, amount: 1},
              carrier:   {level: 7, amount: 3},
              multirole: {level: 6, amount: 1},
              reserver:  {level: 6, amount: 1} } );
    _Sites.Mining("W18S43", "W19S43", 2,
            { burrower:  {level: 5, amount: 1},
              carrier:   {level: 5, amount: 2},
              multirole: {level: 5, amount: 1},
              reserver:  {level: 5, amount: 1} } );
    _Sites.Mining("W18S43", "W17S42", 2,
            { burrower:  {level: 5, amount: 1},
              carrier:   {level: 5, amount: 2},
              multirole: {level: 5, amount: 1},
              reserver:  {level: 5, amount: 1} } );
    
    /* Remote mining operations for Colony #2, W19S42 */
    _Sites.Mining("W19S42", "W18S42", 2,
            { burrower:  {level: 7, amount: 1},
              carrier:   {level: 7, amount: 3},
              multirole: {level: 6, amount: 1},
              reserver:  {level: 6, amount: 1} } );
    
    /* Remote mining operations for Colony #3, W15S41 */
    _Sites.Mining("W15S41", "W15S42", 1,
            { burrower:  {level: 5, amount: 1},
              carrier:   {level: 6, amount: 3},
              multirole: {level: 5, amount: 1},
              reserver:  {level: 5, amount: 1} } );
    _Sites.Mining("W15S41", "W14S42", 2,
            { burrower:  {level: 6, amount: 1},
              carrier:   {level: 6, amount: 3},
              multirole: {level: 5, amount: 1},
              reserver:  {level: 5, amount: 1} } );
    _Sites.Mining("W15S41", "W16S41", 2,
            { multirole: {level: 3, amount: 1} } );
    _Sites.Mining("W15S41", "W14S41", 2,
            { multirole: {level: 3, amount: 1} } );
    _Sites.Mining("W15S41", "W16S42", 3,
            { burrower:  {level: 6, amount: 1},
              carrier:   {level: 6, amount: 3},
              multirole: {level: 5, amount: 1},
              reserver:  {level: 5, amount: 1} },
            ["W15S41", "W16S41", "W16S42"]);
    
    /* Remote mining operations for Colony #4, W15S43 */
    _Sites.Mining("W15S43", "W15S45", 0,
            { burrower:  {level: 5, amount: 4},
              carrier:   {level: 5, amount: 12, body: "all-terrain"},
              multirole: {level: 5, amount: 1} } );

    /* Remote mining operations for Colony #5, W13S41 */
    _Sites.Mining("W13S41", "W12S41", 1,
            { burrower:  {level: 4, amount: 1},
              carrier:   {level: 4, amount: 3},
              multirole: {level: 4, amount: 1},
              reserver:  {level: 4, amount: 1} } );
    _Sites.Mining("W13S41", "W13S42", 2,
            { burrower:  {level: 4, amount: 1},
              carrier:   {level: 4, amount: 3},
              multirole: {level: 4, amount: 1},
              reserver:  {level: 4, amount: 1} } );

    /* Run end-tick _Hive functions */
    _Hive.processSpawnRequests();
    _Hive.processSpawnRenewing();
}
