require("overload");
require("overload.creep");
require("overload.room");
require("overload.roomposition");

require("populations");

let Sites = require("sites");
let Hive = require("hive");
let Blueprint = require("blueprint");
let _CPU = require("util.cpu");

module.exports.loop = function () {

	/* Init functions */
	_CPU.Init();
	Blueprint.Init();

	Hive.clearDeadMemory();
	Hive.initMemory();
	Hive.initTasks();
	Hive.initLabs();



	/* Ally list <3 */
	Memory["allies"] = [
		/* SUN */
		"Pantek59", "king_lispi", "Atavus", "BlackLotus", "Moria",
		"Atlan", "Ashburnie", "seancl", "Finndibaen", "Klapaucius",
		"Hachima", "ChaosDMG", "Calame", "Maxion", "Trepidimous",
		"Kenshi", "Plasticbag"];

	/* Auto-sell excess stockpile */
	Hive.sellExcessResources({
		energy: 1750000,
		O: 250000, H: 250000,
		U: 200000, L: 200000, Z: 200000, K: 200000 });

	Hive.moveExcessEnergy(200000);

		
		
	Sites.Invasion("W18S41", "W21S22", null, 
		{ soldier:	 {level: 8, amount: 3, scale_level: false},
			healer:	 {level: 8, amount: 2, scale_level: false} }, 
		["579a8297de4759b36aabcbe3", // rampart
			"5831f06f94f6c94e59eb03b4", "5831f2ecd33fb4361f29655d", "5831e2f1d597afb8326570d5", // towers
			"5831dedce16286677eccf79a", "58326d7728c02a5040a4dc65", "5831eefe5292df2071304bb1",	// towers
			"57aecb379a0c38767be44055", "5793cbcd2f92338c34ba219e", "57cc3ee0f598cc6728c79639"	//spawns
			], 
		new RoomPosition(18, 5, "W21S23"), 
		["W18S41", "W18S40", "W19S40", "W20S40", "W20S39", "W20S38", "W20S37", 
			"W20S36", "W20S35", "W20S34", "W20S33", "W20S32", "W20S31", "W20S30", 
			"W20S29", "W20S28", "W20S27", "W20S26", "W20S25", "W20S24", "W20S23", "W21S23" ])
		
		

	/* Colony W19S42 */
	Sites.Colony("W19S42", null, Population__Colony_RCL8,
			[ {id: "57a23067cf975f59293d8a28", role: "worker", dir: "send"},
			  {id: "5828408703623e8c6493d9e9", role: "worker", dir: "receive"},
			  {id: "58284ff45492887455d5536d", role: "miner", dir: "send"},
			  {id: "5828487db8fec9bc7739223d", role: "miner", dir: "send"},
			  {id: "582825f67465d1e12b1caca3", role: "miner", dir: "receive"},
			  {id: "58283362f63a601e13869abd", role: "miner", dir: "receive"} ]);
	Sites.Mining("W19S42", "W19S42", null, false, Population__Mining_2S_Colony);
	Sites.Industry("W19S42", null, Population__Industry,
			[ { action: "reaction", supply1: "5827cdeb16de9e4869377e4a", supply2: "5827f4b3a0ed8e9f6bf5ae3c",
				reactors: [ "5827988a4f975a7d696dba90", "5828280b74d604b04955e2f6", "58283338cc371cf674426315", "5827fcc4d448f67249f48185",
							"582825566948cb7d61593ab9", "58271f0e740746b259c029e9", "5827e49f0177f1ea2582a419" ] } ]);

	/* Colony W15S41 */
	Sites.Colony("W15S41", ["W13S41"], Population__Colony_RCL8,
			[ {id: "57d8799179f192fc71374cf1", role: "worker", dir: "send"},
			  {id: "57abe33f4a8b4b5a2f1a2b85", role: "worker", dir: "receive"},
			  {id: "581918c91126a09413c5faf7", role: "miner", dir: "send"},
			  {id: "58190e1c3013fc5776f4c143", role: "miner", dir: "send"},
			  {id: "5819069247ec517d2132c6db", role: "miner", dir: "send"},
			  {id: "5819028a7ecb02ec762c22e8", role: "miner", dir: "receive"} ]);
	Sites.Mining("W15S41", "W15S41", ["W13S41"], false, Population__Mining_2S_Colony);
	Sites.Industry("W15S41", ["W13S41"], Population__Industry,
			[ { action: "reaction", supply1: "57d89720dce50fae29ef2a2f", supply2: "57d9447dd2ca5f470498bb39",
				reactors: [ "57d881c1379deeae5258a079", "57d88d54f20b92b65d7ab82f", "57d89f2ad4e23b6a2c92e17d", "57d8e3a2ea2796d33b4a5010",
							"57d96dfcaf7c4a4c5fb94601", "57d997a069779881436dbca0", "57d91ca57fcc818072da4b27" ] } ]);

	/* Colony W15S43 */
	Sites.Colony("W15S43", ["W16S43"], Population__Colony_RCL8,
			[ {id: "57dc9ffd9754877f17a191c5", role: "worker", dir: "send"},
			  {id: "57dca2fcf52af188391d0a20", role: "worker", dir: "receive"},
			  {id: "58191ef00d7b9db812b5a915", role: "miner", dir: "send"},
			  {id: "581923f61ebbd0197b6ac8d1", role: "miner", dir: "send"},
			  {id: "58192ad0bdac69c44ad81367", role: "miner", dir: "send"},
			  {id: "58191134481a976449a2b7c3", role: "miner", dir: "receive"} ]);
	Sites.Mining("W15S43", "W15S43", ["W16S43"], false, Population__Mining_1S_Colony);
	Sites.Industry("W15S43", null, Population__Industry,
			[ //{ action: "boost", mineral: "UH2O", lab: "57c8cb46e9b21a95363affa3", role: "soldier", dest: "W15S45" },
			  { action: "reaction", supply1: "57c3fdcc823703630339213d", supply2: "57e3ca388826ba8b794e669c",
				reactors: [ "57d904f43638e72938ab1a07", "57e3c25752f8ca0e2ab1bdd1", "57e3d8c34d38ad60307ea948", "57e3e76f43bae8a77e035d7a",
							"57d934dd5b1ce747079af503", "57c4a633e06148377d95b97d", "57c8dc805e86b05c1d5892e3" ] } ]);

	/* Colony W13S41 */
	Sites.Colony("W13S41", ["W15S41"], Population__Colony_RCL8,
			[ {id: "582789b103223d6d6b2d9415", role: "worker", dir: "send"},
			  {id: "57c06b8698040e1908490daf", role: "worker", dir: "receive"},
			  {id: "58191492c6872c515e073e74", role: "miner", dir: "send"},
			  {id: "58190ff82fb231b90ea55d75", role: "miner", dir: "send"},
			  {id: "58270fbe947f8d632c6cdb5a", role: "miner", dir: "send"},
			  {id: "58278af414f7237b4e3436c7", role: "miner", dir: "receive"} ]);
	Sites.Mining("W13S41", "W13S41", ["W15S41"], false, Population__Mining_2S_Colony);
	Sites.Industry("W13S41", ["W15S41"], Population__Industry,
			[ { action: "reaction", supply1: "5826b22e4a6a7b4c7d2c629c", supply2: "58271581fe2aad886bead2a9",
				reactors: [ "582692e36081b9344f308da5", "5826cf408be4dec04ae8b37a", "58275f13a08de86368c10daa", "58278f632349607903e2722a",
							"582774bbe197dbc50564173a", "5826dfcd4146cbd310dceed2", "5826be1ca93e4d8d2b27a52c" ] } ]);

	/* Colony W11S44 */
	Sites.Colony("W11S44", null, Population__Colony_RCL8,
		    [ {id: "57c8c4ae926658ea75161a21", role: "worker", dir: "send"},
			  {id: "57c8ca7749e338931cf1fa66", role: "worker", dir: "receive"},
			  {id: "57cda809a5db4ace37cb2672", role: "miner", dir: "send"},
			  {id: "581983b0d3da32225167a5f6", role: "miner", dir: "send"},
			  {id: "581988becc912c342731f216", role: "miner", dir: "send"},
			  {id: "58190116886556886cbe070b", role: "miner", dir: "receive"} ]);
	Sites.Mining("W11S44", "W11S44", null, false, Population__Mining_2S_Colony);
	Sites.Industry("W11S44", null, Population__Industry,
			[ { action: "reaction", supply1: "57db5e885cccb19c0906bd50", supply2: "57d92ba61555c2084275c953",
				reactors: [ "57db4c0f79dacb1478e2b3d9", "57fa00ba718e16f73f4a60e5", "57fa0dc2e961e13a70707225", "57db9d4c2c1ea9eb535f24ec",
							"57d9cbc11c4c10f41d9e57a8", "57f9f01e91f2d2e81bd32d5b", "57f9de4c3ceb7ced6b2e3e28" ] } ]);

	/* Colony W18S41 */
	Sites.Colony("W18S41", null, Population__Colony_RCL8,
		    [ {id: "5828c54dc772ff61447e6733", role: "worker", dir: "send"},
			  {id: "57f1f63bab48a7a015c15ccd", role: "worker", dir: "receive"},
			  {id: "581984520b035f755541ed49", role: "miner", dir: "send"},
			  {id: "581917b21e938c4e127c7f0a", role: "miner", dir: "send"},
			  {id: "58190d13cbe177ac76d7849b", role: "miner", dir: "receive"} ]);
	Sites.Mining("W18S41", "W18S41", null, false, Population__Mining_1S_Colony);
	Sites.Industry("W18S41", null, Population__Industry,
			[ { action: "boost", mineral: "XUH2O", lab: "5827778b5192a0250c0856d6", role: "soldier", dest: "W21S22" },
			  { action: "boost", mineral: "XLHO2", lab: "5828d3510435d62a75a101c1", role: "healer", dest: "W21S22" }			
			/*{ action: "reaction", supply1: "5828e06fe94fc4e20b1b7a96", supply2: "5829168122d14b350cf588ec",
				reactors: [ "5827c4287906916957fe5d4e", "582902fb140901c84e508f68", "58291c28d4e8b2ae78430458", "58292fe9078393012ebce678",
							"5829247f6bb19ab26526cd7b", "5828f3131a73036237ee4727", "5828d3510435d62a75a101c1" ] }*/ ]);

	/* Colony W16S43 */
	Sites.Colony("W16S43", ["W15S43"], Population__Colony_RCL8,
		    [ {id: "58191258c536b3e437e910cd", role: "miner", dir: "send"},
			  {id: "581985891323f88531c79069", role: "miner", dir: "send"},
			  {id: "581980e1f0b65a7f31b7887c", role: "miner", dir: "send"},
			  {id: "5820eb4a4fd6267c4c9857cf", role: "miner", dir: "send"},
			  {id: "581906e947ec517d2132c715", role: "miner", dir: "receive"} ]);
	Sites.Mining("W16S43", "W16S43", ["W15S43"], false, Population__Mining_1S_Colony);
	Sites.Industry("W16S43", null, Population__Industry,
			[ { action: "reaction", supply1: "5811ce681182c40167698316", supply2: "5812c2b46bc0c4700c8e545b",
				reactors: [ "5811a238b1ebf1a374d8af5b", "5820989f86c629c73db16c4a", "5820cf538ad1cd10448ce6e3", "58214939fac4352f2d7ce349",
							"5820f0716e918dcb3cb46391", "5811f6520f5ad34c77fcf783", "5811e32d8ece24fd369be058" ] } ]);

	/* Colony W11S51 */
	Sites.Colony("W11S51", null, Population__Colony_RCL_Mid,
		    [ {id: "581715b2221c895e12dc8c56", role: "worker", dir: "send"},
			  {id: "581747ec106fbc836af982de", role: "worker", dir: "receive"},
			  {id: "582c0aef40e22df3062e3002", role: "miner", dir: "send"},
			  {id: "581d137128b6a987553442ce", role: "miner", dir: "receive"} ]);
	Sites.Mining("W11S51", "W11S51", null, false, Population__Mining_2S_Colony);
	Sites.Industry("W11S51", null, Population__Industry,
		[ { action: "boost", mineral: "GH2O", lab: "581e0fed63bbb3937a878657", role: "worker", subrole: "upgrader" } ]);

	/* Colony W6S37 */
	Sites.Colony("W6S37", null, Population__Colony_RCL_Mid,
		    [ {id: "581b325b9caefc6c0a88cae5", role: "worker", dir: "send"},
			  {id: "581b225def41da5416ef82ba", role: "worker", dir: "receive"} ]);
	Sites.Mining("W6S37", "W6S37", null, false, Population__Mining_2S_Colony);
	Sites.Industry("W6S37", null, Population__Industry,
		[ { action: "boost", mineral: "GH2O", lab: "5826f1df9a6706607faffe35", role: "worker", subrole: "upgrader" } ]);

	/* Colony E9S42 */
	Sites.Colony("E9S42", null, Population__Colony_Founding);
	Sites.Mining("E9S42", "E9S42", null, false, Population__Mining_RCL_Low);
	
	/* Colony W11S42 */
	Sites.Colony("W11S42", ["W13S41"], Population__Colony_RCL_Mid, null);
	Sites.Mining("W11S42", "W11S42", ["W13S41"], false, Population__Mining_RCL_Low);

	

	/* Remote mining operations for W19S42 */
	Sites.Mining("W19S42", "W18S42", null, false, Population__Mining_2S_Remote);
	Sites.Mining("W19S42", "W19S43", null, false, Population__Mining_1S_Remote);

	/* Remote mining operations for W15S41 */
	Sites.Mining("W15S41", "W15S42", null, false, Population__Mining_2S_Remote);
	Sites.Mining("W15S41", "W14S42", ["W15S43", "W13S41"], false, Population__Mining_2S_Remote);
	Sites.Mining("W15S41", "W16S42", ["W15S43"], false, Population__Mining_2S_Remote, ["W15S41", "W15S42", "W16S42"]);
	Sites.Mining("W15S41", "W17S41", null, false, Population__Mining_2S_Remote, ["W15S41", "W16S41", "W17S41"]);
	Sites.Mining("W15S41", "W16S41", null, false, Population__Maintenance);
	Sites.Mining("W15S41", "W15S39", null, false, Population__Mining_2S_Remote_AT);

	/* Remote mining operations for W15S43 */
	Sites.Mining("W15S43", "W14S43", ["W16S43"], false, Population__Mining_1S_Remote);
	Sites.Mining("W15S43", "W13S43", ["W16S43"], false, Population__Mining_1S_Remote,
		["W15S43", "W14S43", "W13S43"] );
	Sites.Mining("W15S43", "W12S43", ["W16S43"], false, Population__Mining_2S_Remote,
		["W15S43", "W14S43", "W13S43", "W12S43"] );
	Sites.Mining("W15S43", "W15S45", null, true,
			{ soldier:	 {level: 8, amount: 2, scale_level: false},
			  healer:	 {level: 5, amount: 1, scale_level: false},
			  burrower:  {level: 6, amount: 2},
			  carrier:   {level: 7, amount: 6},
			  extractor: {level: 8, amount: 2, body: "extractor_rem"},
			  multirole: {level: 7, amount: 1} } );
	Sites.Mining("W15S43", "W15S44", ["W16S43"], true,
			{ paladin: 	 {level: 8, amount: 2, scale_level: false},
			  healer:	 {level: 5, amount: 1, scale_level: false},
			  burrower:	 {level: 6, amount: 2},
			  carrier:   {level: 7, amount: 6},
			  extractor: {level: 8, amount: 2, body: "extractor_rem"},
			  multirole: {level: 7, amount: 1} } );

	/* Remote mining operations for W13S41 */
	Sites.Mining("W13S41", "W12S41", null, false, Population__Mining_2S_Remote);
	Sites.Mining("W13S41", "W13S42", null, false, Population__Mining_2S_Remote);
	Sites.Mining("W13S41", "W12S42", null, false, Population__Mining_2S_Remote,
		["W13S41", "W13S42", "W12S42"] );
	Sites.Mining("W13S41", "W14S39", null, false, Population__Mining_2S_Remote_AT,
		["W13S41", "W13S40", "W14S40", "W14S39"] );
	Sites.Mining("W13S41", "W12S39", null, false, Population__Mining_2S_Remote_AT,
		["W13S41", "W13S40", "W13S39", "W12S39"] );

	/* Remote mining operations for W11S44 */
	Sites.Mining("W11S44", "W12S44", null, false, Population__Mining_2S_Remote);
	Sites.Mining("W11S44", "W11S45", null, false, Population__Mining_2S_Remote);
	Sites.Mining("W11S44", "W11S46", null, false, Population__Mining_2S_Remote);
	Sites.Mining("W11S44", "W9S44", null, false, Population__Mining_2S_Remote_AT);
	Sites.Mining("W11S44", "W9S45", null, false, Population__Mining_2S_Remote_AT,
		["W11S44", "W10S44", "W9S44", "W9S45"] );

	/* Remote mining operations for W18S41 */
	Sites.Mining("W18S41", "W19S41", null, false, Population__Mining_2S_Remote);

	/* Remote mining operations for W16S43 */
	Sites.Mining("W16S43", "W17S43", ["W15S43"], false, Population__Mining_2S_Remote);
	Sites.Mining("W16S43", "W18S43", ["W15S43"], false, Population__Mining_2S_Remote);
	Sites.Mining("W16S43", "W16S44", ["W15S43"], true,
			{ paladin: 	 {level: 8, amount: 2, scale_level: false},
			  healer:	 {level: 5, amount: 1, scale_level: false},
			  burrower:	 {level: 6, amount: 2},
			  carrier:   {level: 7, amount: 6},
			  extractor: {level: 8, amount: 2, body: "extractor_rem"},
			  multirole: {level: 7, amount: 1} } );

	/* Remote mining operations for W11S51 */
	Sites.Mining("W11S51", "W12S51", null, false, Population__Mining_2S_Remote);
	Sites.Mining("W11S51", "W12S52", null, false, Population__Mining_2S_Remote,
		["W11S51", "W12S51", "W12S52"]);

	/* Remote mining operations for W6S37 */
	Sites.Mining("W6S37", "W6S38", null, false, Population__Mining_2S_Remote);

	/* Remote mining operations for W11S42 */
	Sites.Mining("W11S42", "W11S41", ["W13S41"], false, Population__Maintenance);
	Sites.Mining("W11S42", "W11S43", ["W13S41"], false, Population__Mining_1S_Remote);

	/* Run end-tick Hive functions */
	Hive.processSpawnRequests();
	Hive.processSpawnRenewing();

	/* Finish the profiler cycle */
	_CPU.Finish();
};
