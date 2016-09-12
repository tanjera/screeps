let Sites = require("sites");
let Hive = require("hive");
let _CPU = require("util.cpu");

module.exports.loop = function () {

    /* To do:
		* Sites.Invasion()
			- Test machine state logic (memory-based)
			- Test filtering (let creeps = _.filter(Game.creeps, ...))
			
		* Overload Game.room?
			- room.resource(resource) return terminal + storage if has resource?
			
		- CPU Profiler
			- room_cycles always equals cycles in Math.max(room_cycles, cycles)
			
        * Tasks
            - add dismantle tasks
            - utilCreep: add resource types to all tasks? e.g. "withdraw"			
    */      


	/* Prepare memory profiler */
	_CPU.Init();
	
    /* Prepare memory for this tick */
    Hive.clearDeadMemory();
    Hive.initMemory();
    Hive.initTasks();
	Hive.processRequests();
	

	/*
	Sites.Invasion("W15S43", "W13S45", 2, 
	    { soldier:   {level: 7, amount: 5},
	      archer:    {level: 7, amount: 2},
	      healer:    {level: 7, amount: 3} },
	    [ "57c9165283debd8a0673f956",
	      "57c7ff53cfab4fcb74b265f0" ],
	      new RoomPosition(32, 27, "W14S45"),
	      ["W14S44", "W15S44", "W14S43", "W15S43", "W15S44", "W15S45", "W14S45", "W13S45"] );
	*/
	
    /* Colony #1, W18S43 */
    Sites.Colony("W18S43", 2,
            { worker:   {level: 7, amount: 1},
              repairer: {level: 5, amount: 1} },
            [ {id: "57a2465268244ab107a96d5e", role: "send"},
              {id: "57a24a31e620955e29e63e27", role: "send"},
              {id: "57a24f9cacbffcb869dc9d21", role: "receive"},
              {id: "57a25c61958cffd536325056", role: "receive"} ] );
    Sites.Mining("W18S43", "W18S43", 2, false,
            { burrower:  {level: 7, amount: 1},
              carrier:   {level: 7, amount: 2} } );
	Sites.Industry("W18S43", 2,
            { courier:   {level: 5, amount: 1} },            
            [ { action: "boost", mineral: "GH2O", lab: "57cab60bd4b9cf800582649b", role: "worker", subrole: null },
			  { action: "reaction", amount: 5000,
				reactor: {mineral: "G", lab: "57bc412f58d9edd776d1a39e"}, 
				supply1: {mineral: "UL", lab: "57ca9ba307e97e58106a3eeb"}, 
				supply2: {mineral: "ZK", lab: "57a0539e25bdfd7a71d9a527"} },
			  { action: "reaction", amount: 5000,
				reactor: {mineral: "G", lab: "57bc7f418cd23da102392560"}, 
				supply1: {mineral: "UL", lab: "57ca9ba307e97e58106a3eeb"}, 
				supply2: {mineral: "ZK", lab: "57a0539e25bdfd7a71d9a527"} },			  
			  { action: "reaction", amount: 5000,
				reactor: {mineral: "G", lab: "57a02f90b712db3b1f1c399c"}, 
				supply1: {mineral: "UL", lab: "57ca9ba307e97e58106a3eeb"}, 
				supply2: {mineral: "ZK", lab: "57a0539e25bdfd7a71d9a527"} },
			  { action: "reaction", amount: -1,
				reactor: {mineral: "GH2O", lab: "57cacae0efebf482762ccda8"}, 
				supply1: {mineral: "GH", lab: "57ca814fc399a295425001a0"}, 
				supply2: {mineral: "OH", lab: "57cae6e2ea11208817fa6f10"} },			  
			  { action: "reaction", amount: -1,
				reactor: {mineral: "GH2O", lab: "57caf9bcbf1f329f2edfb424"}, 
				supply1: {mineral: "GH", lab: "57ca814fc399a295425001a0"}, 
				supply2: {mineral: "OH", lab: "57cae6e2ea11208817fa6f10"} } ]);
			
    /* Colony #2, W19S42 */
    Sites.Colony("W19S42", 2,
            { worker:   {level: 7, amount: 1},
              repairer: {level: 5, amount: 1} },
            [ {id: "57a23067cf975f59293d8a28", role: "send"},
              {id: "57a23201113c59e97f7e364e", role: "receive"},
              {id: "57a6a9d62d673fac4f21a62a", role: "receive"}]);    
    Sites.Mining("W19S42", "W19S42", 2, false,
            { burrower:  {level: 6, amount: 1},
              carrier:   {level: 6, amount: 2},              
              extractor: {level: 6, amount: 1} } );
	Sites.Industry("W19S42", 2,
            { courier:   {level: 5, amount: 1} },
			[ { action: "boost", mineral: "GH2O", lab: "57a45a183e04cec61d7e0a37", role: "worker", subrole: null },
			  { action: "reaction", amount: 5000,
				reactor: {mineral: "ZK", lab: "57c5fe753e0f0b8a4bea3b20"}, 
				supply1: {mineral: "Z", lab: "57c5cac2cad5928e7395fd20"}, 
				supply2: {mineral: "K", lab: "57a4917b14b34a194adc9721"} },
			  { action: "reaction", amount: 5000,
				reactor: {mineral: "ZK", lab: "57a48664032cde75790b60f0"}, 
				supply1: {mineral: "Z", lab: "57c5cac2cad5928e7395fd20"}, 
				supply2: {mineral: "K", lab: "57a4917b14b34a194adc9721"} },			  
			  { action: "reaction", amount: 5000,
				reactor: {mineral: "ZK", lab: "57c6113e4f347e0c484670a3"}, 
				supply1: {mineral: "Z", lab: "57c5cac2cad5928e7395fd20"}, 
				supply2: {mineral: "K", lab: "57a4917b14b34a194adc9721"} } ]);

    /* Colony #3, W15S41 */
    Sites.Colony("W15S41", 2,
            { worker:   {level: 7, amount: 1},
              repairer: {level: 5, amount: 1} },
            [ {id: "57abd1d35c977d2d5fec0d0f", role: "send"},
              {id: "57bcc544ee84657d138c5866", role: "send"},            
              {id: "57abe33f4a8b4b5a2f1a2b85", role: "receive"},
              {id: "57af99d528986c413c0a8f4c", role: "receive"} ] );
    Sites.Mining("W15S41", "W15S41", 2, false,
            { burrower:  {level: 6, amount: 1},
              carrier:   {level: 6, amount: 2},              
              extractor: {level: 6, amount: 2} } );
	Sites.Industry("W15S41", 2,
            { courier:   {level: 5, amount: 1} },
            [ { action: "boost", mineral: "GH2O", lab: "57b2800ff68d846c1323e3d6", role: "worker", subrole: null },
			  { action: "reaction", amount: 5000,
				reactor: {mineral: "GH", lab: "57b27619ad1bf23613f2e881"}, 
				supply1: {mineral: "G", lab: "57c5a6b34d14be183f0a2d3a"}, 
				supply2: {mineral: "H", lab: "57c5b9b779a498330e74eb2d"} },
			  { action: "reaction", amount: 5000,
				reactor: {mineral: "GH", lab: "57b271ddc939eb5d4a418e12"}, 
				supply1: {mineral: "G", lab: "57c5a6b34d14be183f0a2d3a"}, 
				supply2: {mineral: "H", lab: "57c5b9b779a498330e74eb2d"} },			  
			  { action: "reaction", amount: 5000,
				reactor: {mineral: "GH", lab: "57c5f390539ef49836106e44"}, 
				supply1: {mineral: "G", lab: "57c5a6b34d14be183f0a2d3a"}, 
				supply2: {mineral: "H", lab: "57c5b9b779a498330e74eb2d"} } ]);
				
    /* Colony #4, W15S43 */
    Sites.Colony("W15S43", 2,
            { worker:   {level: 5, amount: 1},
              repairer: {level: 5, amount: 1},
              upgrader: {level: 7, amount: 3} } );      
    Sites.Mining("W15S43", "W15S43", 2, false,
            { burrower:  {level: 4, amount: 1},
              carrier:   {level: 5, amount: 2}, 
			  extractor: {level: 6, amount: 1} } );
	Sites.Industry("W15S43", 2,
            { courier:   {level: 4, amount: 1} },
            [ { action: "boost", mineral: "GH2O", lab: "57c8ef2b1d3d4c8e3969d068", role: "worker", subrole: "upgrader" },
			  { action: "reaction", amount: 5000,
				reactor: {mineral: "OH", lab: "57be56f1e02d93c93cf460c7"}, 
				supply1: {mineral: "O", lab: "57c8cb46e9b21a95363affa3"}, 
				supply2: {mineral: "H", lab: "57c8dc805e86b05c1d5892e3"} },
			  { action: "reaction", amount: 5000,
				reactor: {mineral: "OH", lab: "57c3fdcc823703630339213d"}, 
				supply1: {mineral: "O", lab: "57c8cb46e9b21a95363affa3"}, 
				supply2: {mineral: "H", lab: "57c8dc805e86b05c1d5892e3"} },			  
			  { action: "reaction", amount: 5000,
				reactor: {mineral: "OH", lab: "57c4a633e06148377d95b97d"}, 
				supply1: {mineral: "O", lab: "57c8cb46e9b21a95363affa3"}, 
				supply2: {mineral: "H", lab: "57c8dc805e86b05c1d5892e3"} } ] );
			  
    /* Colony #5, W13S41 */
    Sites.Colony("W13S41", 2,
            { worker:   {level: 5, amount: 1},
              repairer: {level: 4, amount: 1},
              upgrader: {level: 5, amount: 1} },              
            [ {id: "57cb35b4fea5b2332f74815a", role: "send"},
			  {id: "57cb36bd7d58704651710ab0", role: "send"},
              {id: "57c06b8698040e1908490daf", role: "receive"},
			  {id: "57c3eabdc480f8a72a2cdb75", role: "receive"} ] );
    Sites.Mining("W13S41", "W13S41", 2, false,
            { burrower:  {level: 4, amount: 2},
              carrier:   {level: 4, amount: 3},
			  extractor: {level: 6, amount: 2} } );
  	Sites.Industry("W13S41", 2,
            { courier:   {level: 5, amount: 1} },
            [ { action: "boost", mineral: "GH2O", lab: "57c3ef8850ba39ec2725c182", role: "worker", subrole: "upgrader" },
              { action: "reaction", amount: 5000,
				reactor: {mineral: "UL", lab: "57c5ab258a3658822748cc62"}, 
				supply1: {mineral: "U", lab: "57c5bdceb44f52600e9b2116"}, 
				supply2: {mineral: "L", lab: "57cb34e3d80e43e128862a09"} },
			  { action: "reaction", amount: 5000,
				reactor: {mineral: "UL", lab: "57cb2bb486c97a0557028d65"}, 
				supply1: {mineral: "U", lab: "57c5bdceb44f52600e9b2116"}, 
				supply2: {mineral: "L", lab: "57cb34e3d80e43e128862a09"} },			  
			  { action: "reaction", amount: 5000,
				reactor: {mineral: "UL", lab: "57cb1fd496dc10bb3b50728c"}, 
				supply1: {mineral: "U", lab: "57c5bdceb44f52600e9b2116"}, 
				supply2: {mineral: "L", lab: "57cb34e3d80e43e128862a09"} } ]);
              
    /* Colony #6, W11S44 */
    Sites.Colony("W11S44", 1,
            { worker:   {level: 5, amount: 1},
              repairer: {level: 5, amount: 1},
              upgrader: {level: 5, amount: 3} },
		    [ {id: "57c8c4ae926658ea75161a21", role: "send"},
			  {id: "57c8ca7749e338931cf1fa66", role: "receive"},
              {id: "57cda809a5db4ace37cb2672", role: "receive"} ]);
    Sites.Mining("W11S44", "W11S44", 1, false,
            { burrower:  {level: 5, amount: 1},
              carrier:   {level: 5, amount: 2},
			  extractor: {level: 6, amount: 2} } );
	Sites.Industry("W11S44", 1,
            { courier:   {level: 5, amount: 1} },
			[ { action: "boost", mineral: "GH2O", lab: "57cdbb01297293a13858f822", role: "worker", subrole: "upgrader" } ] );
			  
	/* Colony #7, W11S45 */
    Sites.Colony("W11S45", 1,
            { worker:   {level: 5, amount: 2},
              repairer: {level: 5, amount: 1},
              upgrader: {level: 5, amount: 2} });
    Sites.Mining("W11S45", "W11S45", 1, false,
            { burrower:  {level: 5, amount: 1},
			  carrier:   {level: 5, amount: 2} } );	
	          

    /* Remote mining operations for Colony #1, W18S43 */
    Sites.Mining("W18S43", "W17S43", 2, false,
            { burrower:  {level: 7, amount: 1},
              carrier:   {level: 7, amount: 3},
              multirole: {level: 6, amount: 1},
              reserver:  {level: 6, amount: 1} } );
    Sites.Mining("W18S43", "W19S43", 2, false,
            { burrower:  {level: 5, amount: 1},
              carrier:   {level: 5, amount: 2},
              multirole: {level: 5, amount: 1},
              reserver:  {level: 5, amount: 1} } );
    Sites.Mining("W18S43", "W17S42", 2, false,
            { burrower:  {level: 5, amount: 1},
              carrier:   {level: 5, amount: 2},
              multirole: {level: 5, amount: 1},
              reserver:  {level: 5, amount: 1} } );
    
    /* Remote mining operations for Colony #2, W19S42 */
    Sites.Mining("W19S42", "W18S42", 2, false,
            { burrower:  {level: 7, amount: 1},
              carrier:   {level: 7, amount: 3},
              multirole: {level: 6, amount: 1},
              reserver:  {level: 6, amount: 1} } );
    
    /* Remote mining operations for Colony #3, W15S41 */
    Sites.Mining("W15S41", "W15S42", 1, false,
            { burrower:  {level: 5, amount: 1},
              carrier:   {level: 6, amount: 3},
              multirole: {level: 5, amount: 1},
              reserver:  {level: 5, amount: 1} } );
    Sites.Mining("W15S41", "W14S42", 2, false,
            { burrower:  {level: 6, amount: 1},
              carrier:   {level: 6, amount: 3},
              multirole: {level: 5, amount: 1},
              reserver:  {level: 5, amount: 1} } );    
    Sites.Mining("W15S41", "W16S42", 3, false,
            { burrower:  {level: 6, amount: 1},
              carrier:   {level: 6, amount: 3},
              multirole: {level: 5, amount: 1},
              reserver:  {level: 5, amount: 1} },
            ["W15S41", "W16S41", "W16S42"]);
    
    /* Remote mining operations for Colony #4, W15S43 */
    Sites.Mining("W15S43", "W15S45", 0, false,
            { burrower:  {level: 5, amount: 4},
              carrier:   {level: 5, amount: 10},
              multirole: {level: 5, amount: 1} } );
	Sites.Mining("W15S43", "W15S44", 0, true,
			{ paladin: 	 {level: 8, amount: 1},
			  healer:	 {level: 4, amount: 1},
			  burrower:	 {level: 5, amount: 2},
			  carrier:   {level: 5, amount: 8},
              multirole: {level: 5, amount: 1} } );
	
		
    /* Remote mining operations for Colony #5, W13S41 */
    Sites.Mining("W13S41", "W12S41", 1, false,
            { burrower:  {level: 4, amount: 1},
              carrier:   {level: 4, amount: 3},
              multirole: {level: 4, amount: 1},
              reserver:  {level: 4, amount: 1} } );	
	/* Pause for CPU vvvv */
	Sites.Mining("W13S41", "W13S42", 2, false,
            { burrower:  {level: 4, amount: 1},
              carrier:   {level: 4, amount: 3},
              multirole: {level: 4, amount: 1},
              reserver:  {level: 4, amount: 1} } );		
	
	/* Remote mining operations for Colony #6, W11S44 */
    Sites.Mining("W11S44", "W12S44", 1, false,
            { burrower:  {level: 4, amount: 1},
              carrier:   {level: 4, amount: 3},
              multirole: {level: 4, amount: 1},
              reserver:  {level: 4, amount: 1} } );
    

    /* Run end-tick Hive functions */
    Hive.processSpawnRequests();
    Hive.processSpawnRenewing();
	
	/* Finish the profiler cycle */
	_CPU.Finish();
}
