let Sites = require("sites");
let Hive = require("hive");

module.exports.loop = function () {

    /* To do:

		* Next room: W11S45 
			- has U
			- closer to several rooms with 2x sources
			- load balancing with W11S44
			- increased presence in area
	
		* Overload Game.room?
			- room.resource(resource) return terminal + storage if has resource?
			
		* CPU management
            - add wait task for multirole!
			- implement creeps moving by path? e.g.:
				if (creep.moveByPath(creep.memory.path) == ERR_NOT_FOUND) {
					creep.memory.path = creep.pos.findPathTo(destination);
					creep.moveByPath(creep.memory.path)
				}        

        * Tasks
            - add dismantle tasks
            - utilCreep: add resource types to all tasks? e.g. "withdraw"
			
		* Logs
			- CPU profiling of some sort??
    */      


    /* Prepare memory for this tick */
    Hive.clearDeadMemory();
    Hive.initMemory();
    Hive.initTasks();
	Hive.processRequests();
	

    /* Colony #1, W18S43 */
    Sites.Colony("W18S43", 2,
            { worker:   {level: 6, amount: 1},
              repairer: {level: 6, amount: 1} },
            [ {id: "57a2465268244ab107a96d5e", role: "send"},
              {id: "57a24a31e620955e29e63e27", role: "send"},
              {id: "57a24f9cacbffcb869dc9d21", role: "receive"},
              {id: "57a25c61958cffd536325056", role: "receive"} ] );
    Sites.Mining("W18S43", "W18S43", 2,
            { burrower:  {level: 7, amount: 1},
              carrier:   {level: 7, amount: 2} } );
	Sites.Industry("W18S43", 2,
            { courier:   {level: 5, amount: 1} },            
            [ { action: "reaction", 
                reactor: {mineral: "GH20", lab: "57a02f90b712db3b1f1c399c"}, 
                supply1: {mineral: "GH", lab: "57a0539e25bdfd7a71d9a527"}, 
                supply2: {mineral: "OH", lab: "57bc412f58d9edd776d1a39e"} },
              { action: "reaction", 
                reactor: {mineral: "GH", lab: "57bc7f418cd23da102392560"}, 
                supply1: {mineral: "GH", lab: "57a0539e25bdfd7a71d9a527"}, 
                supply2: {mineral: "OH", lab: "57bc412f58d9edd776d1a39e"} } ] );
			
    /* Colony #2, W19S42 */
    Sites.Colony("W19S42", 2,
            { worker:   {level: 7, amount: 2},
              repairer: {level: 6, amount: 1},
              upgrader: {level: 6, amount: 1} },
            [ {id: "57a23067cf975f59293d8a28", role: "send"},
              {id: "57a23201113c59e97f7e364e", role: "receive"},
              {id: "57a6a9d62d673fac4f21a62a", role: "receive"}]);    
    Sites.Mining("W19S42", "W19S42", 2,
            { burrower:  {level: 6, amount: 1},
              carrier:   {level: 6, amount: 2},              
              extractor: {level: 6, amount: 1} } );
	  Sites.Industry("W19S42", 2,
            { courier:   {level: 5, amount: 1} } );

    /* Colony #3, W15S41 */
    Sites.Colony("W15S41", 2,
            { worker:   {level: 6, amount: 1},
              repairer: {level: 6, amount: 1},
              upgrader: {level: 6, amount: 2} },
            [ {id: "57abd1d35c977d2d5fec0d0f", role: "send"},
              {id: "57bcc544ee84657d138c5866", role: "send"},            
              {id: "57abe33f4a8b4b5a2f1a2b85", role: "receive"},
              {id: "57af99d528986c413c0a8f4c", role: "receive"} ] );
    Sites.Mining("W15S41", "W15S41", 2,
            { burrower:  {level: 6, amount: 1},
              carrier:   {level: 6, amount: 2},              
              extractor: {level: 6, amount: 2} } );
	Sites.Industry("W15S41", 2,
            { courier:   {level: 5, amount: 1} },
            [ { action: "boost", mineral: "GH2O", lab: "57b27619ad1bf23613f2e881", role: "worker", subrole: "upgrader" },												
              { action: "reaction", 
                reactor: {mineral: "LH2O", lab: "57c5f390539ef49836106e44"}, 
                supply1: {mineral: "LH", lab: "57b271ddc939eb5d4a418e12"}, 
                supply2: {mineral: "OH", lab: "57c5b9b779a498330e74eb2d"} },
              { action: "reaction", 
                reactor: {mineral: "LH", lab: "57b271ddc939eb5d4a418e12"}, 
                supply1: {mineral: "L", lab: "57c5a6b34d14be183f0a2d3a"}, 
                supply2: {mineral: "H", lab: "57b2800ff68d846c1323e3d6"} } ] );
				
    /* Colony #4, W15S43 */
    Sites.Colony("W15S43", 2,
            { worker:   {level: 6, amount: 1},
              repairer: {level: 5, amount: 1},
              upgrader: {level: 6, amount: 0} } );      
    Sites.Mining("W15S43", "W15S43", 2,
            { burrower:  {level: 4, amount: 1},
              carrier:   {level: 5, amount: 2} } );
	Sites.Industry("W15S43", 2,
            { courier:   {level: 4, amount: 1} },
            [ { action: "reaction", 
                reactor: {mineral: "UH", lab: "57be56f1e02d93c93cf460c7"}, 
                supply1: {mineral: "U", lab: "57c8cb46e9b21a95363affa3"}, 
                supply2: {mineral: "H", lab: "57c8dc805e86b05c1d5892e3"} }, 
              { action: "reaction", 
                reactor: {mineral: "UH", lab: "57c3fdcc823703630339213d"}, 
                supply1: {mineral: "U", lab: "57c8cb46e9b21a95363affa3"}, 
                supply2: {mineral: "H", lab: "57c8dc805e86b05c1d5892e3"} }, 
              { action: "reaction", 
                reactor: {mineral: "UH2O", lab: "57c4a633e06148377d95b97d"}, 
                supply1: {mineral: "UH", lab: "57c3fdcc823703630339213d"}, 
                supply2: {mineral: "OH", lab: "57c8ef2b1d3d4c8e3969d068"} } ] );
			  
    /* Colony #5, W13S41 */
    Sites.Colony("W13S41", 2,
            { worker:   {level: 5, amount: 1},
              repairer: {level: 4, amount: 1},
              upgrader: {level: 5, amount: 3} },              
            [ {id: "57c04f3012c844604895d81f", role: "send"},
              {id: "57c06b8698040e1908490daf", role: "receive"},
			        {id: "57c3eabdc480f8a72a2cdb75", role: "receive"} ] );
    Sites.Mining("W13S41", "W13S41", 2,
            { burrower:  {level: 4, amount: 2},
              carrier:   {level: 4, amount: 3},
			        extractor: {level: 6, amount: 2} } );
  	Sites.Industry("W13S41", 2,
            { courier:   {level: 5, amount: 1} },
            [ { action: "boost", mineral: "GH2O", lab: "57c3ef8850ba39ec2725c182", role: "worker", subrole: "upgrader" } ] );
              
    /* Colony #6, W11S44 */
    Sites.Colony("W11S44", 1,
            { worker:   {level: 5, amount: 1},
              repairer: {level: 5, amount: 1},
              upgrader: {level: 5, amount: 1} });
    Sites.Mining("W11S44", "W11S44", 1,
            { burrower:  {level: 5, amount: 1},
              carrier:   {level: 5, amount: 2} },
            [ {id: "57c8c4ae926658ea75161a21", role: "send"},            
              {id: "57c8ca7749e338931cf1fa66", role: "receive"} ] );
              

    /* Remote mining operations for Colony #1, W18S43 */
    Sites.Mining("W18S43", "W17S43", 2,
            { burrower:  {level: 7, amount: 1},
              carrier:   {level: 7, amount: 3},
              multirole: {level: 6, amount: 1},
              reserver:  {level: 6, amount: 1} } );
    Sites.Mining("W18S43", "W19S43", 2,
            { burrower:  {level: 5, amount: 1},
              carrier:   {level: 5, amount: 2},
              multirole: {level: 5, amount: 1},
              reserver:  {level: 5, amount: 1} } );
    Sites.Mining("W18S43", "W17S42", 2,
            { burrower:  {level: 5, amount: 1},
              carrier:   {level: 5, amount: 2},
              multirole: {level: 5, amount: 1},
              reserver:  {level: 5, amount: 1} } );
    
    /* Remote mining operations for Colony #2, W19S42 */
    Sites.Mining("W19S42", "W18S42", 2,
            { burrower:  {level: 7, amount: 1},
              carrier:   {level: 7, amount: 3},
              multirole: {level: 6, amount: 1},
              reserver:  {level: 6, amount: 1} } );
    
    /* Remote mining operations for Colony #3, W15S41 */
    Sites.Mining("W15S41", "W15S42", 1,
            { burrower:  {level: 5, amount: 1},
              carrier:   {level: 6, amount: 3},
              multirole: {level: 5, amount: 1},
              reserver:  {level: 5, amount: 1} } );
    Sites.Mining("W15S41", "W14S42", 2,
            { burrower:  {level: 6, amount: 1},
              carrier:   {level: 6, amount: 3},
              multirole: {level: 5, amount: 1},
              reserver:  {level: 5, amount: 1} } );
    Sites.Mining("W15S41", "W16S41", 2,
            { multirole: {level: 3, amount: 1} } );
    Sites.Mining("W15S41", "W14S41", 2,
            { multirole: {level: 3, amount: 1} } );
    Sites.Mining("W15S41", "W16S42", 3,
            { burrower:  {level: 6, amount: 1},
              carrier:   {level: 6, amount: 3},
              multirole: {level: 5, amount: 1},
              reserver:  {level: 5, amount: 1} },
            ["W15S41", "W16S41", "W16S42"]);
    
    /* Remote mining operations for Colony #4, W15S43 */
    Sites.Mining("W15S43", "W15S45", 0,
            { burrower:  {level: 5, amount: 4},
              carrier:   {level: 5, amount: 12, body: "all-terrain"},
              multirole: {level: 5, amount: 1} } );

    /* Remote mining operations for Colony #5, W13S41 */
    Sites.Mining("W13S41", "W12S41", 1,
            { burrower:  {level: 4, amount: 1},
              carrier:   {level: 4, amount: 3},
              multirole: {level: 4, amount: 1},
              reserver:  {level: 4, amount: 1} } );
    Sites.Mining("W13S41", "W13S42", 2,
            { burrower:  {level: 4, amount: 1},
              carrier:   {level: 4, amount: 3},
              multirole: {level: 4, amount: 1},
              reserver:  {level: 4, amount: 1} } );

	/* Remote mining operations for Colony #6, W11S44 */
    Sites.Mining("W11S44", "W11S45", 1,
            { burrower:  {level: 4, amount: 1},
              carrier:   {level: 4, amount: 3},
              multirole: {level: 4, amount: 1},
              reserver:  {level: 4, amount: 1} } );
			  

    /* Run end-tick Hive functions */
    Hive.processSpawnRequests();
    Hive.processSpawnRenewing();
}
