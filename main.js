let Sites = require("sites");
let Hive = require("hive");
let _CPU = require("util.cpu");

module.exports.loop = function () {

	/* Prepare CPU profiler */
	_CPU.Init();

    /* Prepare memory for this tick */
    Hive.clearDeadMemory();
    Hive.initMemory();
    Hive.initTasks();

	

	/* Ally list <3 */
	Memory["allies"] = [
		"Pantek59", "king_lispi", "Atavus", "BlackLotus",
		"Moria", "Atlan", "Ashburnie", "seancl", "Finndibaen" ];

	/* Auto-sell excess stockpile */
	Hive.sellExcessResources({
		O: { limit: 250000 },
		H: { limit: 250000 },
		U: { limit: 150000 },
		L: { limit: 150000 },
		Z: { limit: 150000 },
		K: { limit: 150000 } });

	Hive.moveExcessEnergy(200000);

	
	/* Generic population definitions */
	let Population__Colony_RCL8 = 
			{ worker:   {level: 7, amount: 1, scale_level: false},
              repairer: {level: 5, amount: 1} };
	let Population__Colony_Grow = 
            { worker:   {level: 7, amount: 1},
              repairer: {level: 5, amount: 1},
              upgrader: {level: 7, amount: 2} };
			  
	let Population__Mining_1S_Colony =
			{ burrower:  {level: 5, amount: 1},
              carrier:   {level: 6, amount: 2},
			  extractor: {level: 8, amount: 1} };
	let Population__Mining_2S_Colony = 
			{ burrower:  {level: 6, amount: 1},
              carrier:   {level: 7, amount: 2},
			  extractor: {level: 8, amount: 1} };
	let Population__Mining_1S_Remote =
			{ burrower:  {level: 5, amount: 1},
              carrier:   {level: 7, amount: 2},
              multirole: {level: 6, amount: 1},
              reserver:  {level: 6, amount: 1} };
	let Population__Mining_2S_Remote =
			{ burrower:  {level: 6, amount: 1},
              carrier:   {level: 7, amount: 3},
              multirole: {level: 6, amount: 1},
              reserver:  {level: 6, amount: 1} };
			  
	let Population__Industry =
			{ courier:   {level: 5, amount: 1} };

	
	
    /* Colony #1, W18S43 */
    Sites.Colony("W18S43", 2, Population__Colony_RCL8,
            [ {id: "57a2465268244ab107a96d5e", role: "send"},
              {id: "57a24f9cacbffcb869dc9d21", role: "receive"},
              {id: "57a25c61958cffd536325056", role: "receive"} ] );
    Sites.Mining("W18S43", "W18S43", 1, false, Population__Mining_2S_Colony);
	Sites.Industry("W18S43", 2, Population__Industry,
			[ { action: "reaction", amount: 10000,
				reactor: {mineral: "G", lab: "57d97c52cfda43d45247083e"},
				supply1: {mineral: "UL", lab: "57da4f4df77673f57f674b8e"},
				supply2: {mineral: "ZK", lab: "57da17db81f808d96870b7fb"} },
			  { action: "reaction", amount: 10000,
				reactor: {mineral: "G", lab: "57d9cf9924d28b4e75fa36b0"},
				supply1: {mineral: "UL", lab: "57da4f4df77673f57f674b8e"},
				supply2: {mineral: "ZK", lab: "57da17db81f808d96870b7fb"} },
			  { action: "reaction", amount: 10000,
				reactor: {mineral: "G", lab: "57da577ebc2f1b570771255e"},
				supply1: {mineral: "UL", lab: "57da4f4df77673f57f674b8e"},
				supply2: {mineral: "ZK", lab: "57da17db81f808d96870b7fb"} }]);

    /* Colony #2, W19S42 */
    Sites.Colony("W19S42", 2, Population__Colony_RCL8,
            [ {id: "57a23067cf975f59293d8a28", role: "send"},
              {id: "57a23201113c59e97f7e364e", role: "receive"},
              {id: "57a6a9d62d673fac4f21a62a", role: "receive"}]);
    Sites.Mining("W19S42", "W19S42", 0, false, Population__Mining_2S_Colony);
	Sites.Industry("W19S42", 2, Population__Industry,
			[ { action: "reaction", amount: 10000,
				reactor: {mineral: "ZK", lab: "57d88a475797bae8438c0b79"},
				supply1: {mineral: "Z", lab: "57d8e078691ae2dd20b05905"},
				supply2: {mineral: "K", lab: "57d9de60bce03e1b1a1f193a"} },
			  { action: "reaction", amount: 10000,
				reactor: {mineral: "ZK", lab: "57d8b4aa3fc139b87f530540"},
				supply1: {mineral: "Z", lab: "57d8e078691ae2dd20b05905"},
				supply2: {mineral: "K", lab: "57d9de60bce03e1b1a1f193a"} },
			  { action: "reaction", amount: 10000,
				reactor: {mineral: "ZK", lab: "57d90f6bebd811df3152e8a1"},
				supply1: {mineral: "Z", lab: "57d8e078691ae2dd20b05905"},
				supply2: {mineral: "K", lab: "57d9de60bce03e1b1a1f193a"} }]);

    /* Colony #3, W15S41 */
    Sites.Colony("W15S41", 2, Population__Colony_RCL8,
            [ {id: "57d8799179f192fc71374cf1", role: "send"},
			  {id: "57abe33f4a8b4b5a2f1a2b85", role: "receive"},
              {id: "57af99d528986c413c0a8f4c", role: "receive"} ] );
    Sites.Mining("W15S41", "W15S41", 0, false, Population__Mining_2S_Colony);
	Sites.Industry("W15S41", 2, Population__Industry,
            [ { action: "reaction", amount: 10000,
				reactor: {mineral: "GH", lab: "57d8e3a2ea2796d33b4a5010"},
				supply1: {mineral: "G", lab: "57d89720dce50fae29ef2a2f"},
				supply2: {mineral: "H", lab: "57d89f2ad4e23b6a2c92e17d"} },
			  { action: "reaction", amount: 10000,
				reactor: {mineral: "GH", lab: "57d88d54f20b92b65d7ab82f"},
				supply1: {mineral: "G", lab: "57d89720dce50fae29ef2a2f"},
				supply2: {mineral: "H", lab: "57d89f2ad4e23b6a2c92e17d"} },
			  { action: "reaction", amount: 10000,
				reactor: {mineral: "GH", lab: "57d881c1379deeae5258a079"},
				supply1: {mineral: "G", lab: "57d89720dce50fae29ef2a2f"},
				supply2: {mineral: "H", lab: "57d89f2ad4e23b6a2c92e17d"} } ]);

    /* Colony #4, W15S43 */
    Sites.Colony("W15S43", 2, Population__Colony_RCL8,
            [ {id: "57dc9ffd9754877f17a191c5", role: "send"},
              {id: "57dca2fcf52af188391d0a20", role: "receive"} ]);
    Sites.Mining("W15S43", "W15S43", 0, false, Population__Mining_1S_Colony);
	Sites.Industry("W15S43", 2, Population__Industry,
            [ { action: "reaction", amount: 10000,
				reactor: {mineral: "OH", lab: "57c8cb46e9b21a95363affa3"},
				supply1: {mineral: "O", lab: "57c8dc805e86b05c1d5892e3"},
				supply2: {mineral: "H", lab: "57c3fdcc823703630339213d"} },
			  { action: "reaction", amount: 10000,
				reactor: {mineral: "OH", lab: "57c4a633e06148377d95b97d"},
				supply1: {mineral: "O", lab: "57c8dc805e86b05c1d5892e3"},
				supply2: {mineral: "H", lab: "57c3fdcc823703630339213d"} },
			  { action: "reaction", amount: 10000,
				reactor: {mineral: "OH", lab: "57d934dd5b1ce747079af503"},
				supply1: {mineral: "O", lab: "57c8dc805e86b05c1d5892e3"},
				supply2: {mineral: "H", lab: "57c3fdcc823703630339213d"} }]);

    /* Colony #5, W13S41 */
    Sites.Colony("W13S41", 2, Population__Colony_RCL8,
            [ {id: "57cb35b4fea5b2332f74815a", role: "send"},
			  {id: "57cb36bd7d58704651710ab0", role: "send"},
              {id: "57c06b8698040e1908490daf", role: "receive"},
			  {id: "57c3eabdc480f8a72a2cdb75", role: "receive"} ] );
    Sites.Mining("W13S41", "W13S41", 0, false, Population__Mining_2S_Colony);
  	Sites.Industry("W13S41", 2, Population__Industry,
			[ { action: "reaction", amount: 10000,
				reactor: {mineral: "UL", lab: "57c3ef8850ba39ec2725c182"},
				supply1: {mineral: "U", lab: "57d91151b7f80d630f82986c"},
				supply2: {mineral: "L", lab: "57d974c8c6030b8452419739"} },
			  { action: "reaction", amount: 10000,
				reactor: {mineral: "UL", lab: "57c5ab258a3658822748cc62"},
				supply1: {mineral: "U", lab: "57d91151b7f80d630f82986c"},
				supply2: {mineral: "L", lab: "57d974c8c6030b8452419739"} },
			  { action: "reaction", amount: 10000,
				reactor: {mineral: "UL", lab: "57cb34e3d80e43e128862a09"},
				supply1: {mineral: "U", lab: "57d91151b7f80d630f82986c"},
				supply2: {mineral: "L", lab: "57d974c8c6030b8452419739"} } ]);

    /* Colony #6, W11S44 */
    Sites.Colony("W11S44", 1, Population__Colony_Grow,
		    [ {id: "57c8c4ae926658ea75161a21", role: "send"},
			  {id: "57c8ca7749e338931cf1fa66", role: "receive"},
              {id: "57cda809a5db4ace37cb2672", role: "receive"} ]);
    Sites.Mining("W11S44", "W11S44", 0, false, Population__Mining_2S_Colony);
	Sites.Industry("W11S44", 1, Population__Industry,
			[ { action: "boost", mineral: "GH2O", lab: "57cdbb01297293a13858f822", role: "worker", subrole: "upgrader" },
			  { action: "reaction", amount: 10000,
				reactor: {mineral: "GH2O", lab: "57db4c0f79dacb1478e2b3d9"},
				supply1: {mineral: "GH", lab: "57db5e885cccb19c0906bd50"},
				supply2: {mineral: "OH", lab: "57d92ba61555c2084275c953"} },
			  { action: "reaction", amount: -1,
				reactor: {mineral: "GH2O", lab: "57db9d4c2c1ea9eb535f24ec"},
				supply1: {mineral: "GH", lab: "57db5e885cccb19c0906bd50"},
				supply2: {mineral: "OH", lab: "57d92ba61555c2084275c953"} },
			  { action: "reaction", amount: -1,
				reactor: {mineral: "GH2O", lab: "57d9cbc11c4c10f41d9e57a8"},
				supply1: {mineral: "GH", lab: "57db5e885cccb19c0906bd50"},
				supply2: {mineral: "OH", lab: "57d92ba61555c2084275c953"} }
			  ]);

	/* Colony #7, W11S45 */
    Sites.Colony("W11S45", 1, Population__Colony_Grow,
			[ {id: "57d61ddf2ff0d3ea25976f78", role: "send"},
			  {id: "57ddb7390a699fdb6cc87b58", role: "receive"},
              {id: "57d65b3a157ae32c0ec94734", role: "receive"} ]);
    Sites.Mining("W11S45", "W11S45", 0, false, Population__Mining_2S_Colony);
	Sites.Industry("W11S45", 1, Population__Industry,
			[ { action: "boost", mineral: "GH2O", lab: "57dbee7782321a415409788a", role: "worker", subrole: "upgrader" } ]);

	/* Colony #8, W18S41 */
    Sites.Colony("W18S41", 1, Population__Colony_Grow);
	Sites.Mining("W18S41", "W18S41", 0, false, Population__Mining_1S_Colony);
	Sites.Industry("W18S41", 1, Population__Industry,
			[ { action: "boost", mineral: "GH2O", lab: "57ec7be65dff746643b687dd", role: "worker", subrole: "upgrader" } ] );

			
			
    /* Remote mining operations for Colony #1, W18S43 */
	Sites.Mining("W18S43", "W19S43", 1, false, Population__Mining_1S_Remote);
    Sites.Mining("W18S43", "W17S43", 2, false, Population__Mining_2S_Remote);

    /* Remote mining operations for Colony #2, W19S42 */
    Sites.Mining("W19S42", "W18S42", 1, false, Population__Mining_2S_Remote);

    /* Remote mining operations for Colony #3, W15S41 */
    Sites.Mining("W15S41", "W15S42", 1, false, Population__Mining_2S_Remote);
    Sites.Mining("W15S41", "W14S42", 1, false, Population__Mining_2S_Remote);
	Sites.Mining("W15S41", "W16S42", 1, false, Population__Mining_2S_Remote, ["W15S41", "W15S42", "W16S42"]);
	Sites.Mining("W15S41", "W17S41", 1, false, Population__Mining_2S_Remote, ["W15S41", "W16S41", "W17S41"]);
	Sites.Mining("W15S41", "W16S41", 1, false, { multirole: {level: 6, amount: 1} } );

    /* Remote mining operations for Colony #4, W15S43 */
    Sites.Mining("W15S43", "W15S45", 0, false,
            { burrower:  {level: 6, amount: 3},
              carrier:   {level: 7, amount: 8},
              multirole: {level: 6, amount: 1} } );
	Sites.Mining("W15S43", "W15S44", 0, true,
			{ paladin: 	 {level: 8, amount: 1, scale_level: false},
			  healer:	 {level: 5, amount: 1},
			  burrower:	 {level: 6, amount: 3},
			  carrier:   {level: 7, amount: 8},
              multirole: {level: 6, amount: 1} } );

    /* Remote mining operations for Colony #5, W13S41 */
    Sites.Mining("W13S41", "W12S41", 0, false, Population__Mining_2S_Remote);
	Sites.Mining("W13S41", "W13S42", 0, false, Population__Mining_2S_Remote);
	Sites.Mining("W13S41", "W12S42", 0, false, Population__Mining_2S_Remote, ["W13S41", "W13S42", "W12S42"] );

	/* Remote mining operations for Colony #6, W11S44 */
    Sites.Mining("W11S44", "W12S44", 1, false, Population__Mining_2S_Remote);

	/* Remote mining operations for Colony #7, W11S45 */
    Sites.Mining("W11S45", "W11S46", 1, false, Population__Mining_2S_Remote);

	/* Remote mining operations for Colony #8, W18S41 */
    Sites.Mining("W18S41", "W19S41", 0, false, Population__Mining_2S_Remote);

			  
			  
    /* Run end-tick Hive functions */
    Hive.processSpawnRequests();
    Hive.processSpawnRenewing();

	/* Finish the profiler cycle */
	_CPU.Finish();
};
