let Sites = require("sites");
let Hive = require("hive");
let _CPU = require("util.cpu");

module.exports.loop = function () {

    /* To do:
	N/A			
    */      


	/* Prepare memory profiler */
	_CPU.Init();
	
    /* Prepare memory for this tick */
    Hive.clearDeadMemory();
    Hive.initMemory();
    Hive.initTasks();
	Hive.processRequests();
	

    /* Exmaple Primary Control for W18S43 */
    /* Sites.Colony("W18S43", 2,
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
            [ { action: "reaction", amount: 5000,
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
      */

	Sites.Colony("W16S52", 2,
            { worker:   {level: 1, amount: 1},
              repairer: {level: 1, amount: 1} },
           /* [ {id: "57a2465268244ab107a96d5e", role: "send"},
              {id: "57a24a31e620955e29e63e27", role: "send"},
              {id: "57a24f9cacbffcb869dc9d21", role: "receive"},
              {id: "57a25c61958cffd536325056", role: "receive"} ]*/ );
	Sites.Mining("W16S52", "W16S52", 2, false,
            { burrower:  {level: 1, amount: 1},
              carrier:   {level: 1, amount: 2} } );
	/* Sites.Industry("W18S43", 2,
            { courier:   {level: 5, amount: 1} },            
            [ { action: "reaction", amount: 5000,
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
				supply2: {mineral: "OH", lab: "57cae6e2ea11208817fa6f10"} } ]); */
	          

    /* Example Support Control for W18S43 */
    /* Sites.Mining("W18S43", "W17S43", 2, false,
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
    */
    

    /* Run end-tick Hive functions */
    Hive.processSpawnRequests();
    Hive.processSpawnRenewing();
	
	/* Finish the profiler cycle */
	_CPU.Finish();
}
