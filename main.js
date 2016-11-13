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
		"Pantek59", "king_lispi", "Atavus", "BlackLotus",
		"Moria", "Atlan", "Ashburnie", "seancl", "Finndibaen",
		"Klapaucius", "Hachima", "ChaosDMG", "Calame",
		/* E5S55 Coalition */
		"Maxion", "Kenshi", "Plasticbag", "Trepidimous", "Nisou", "Remco"];

	/* Auto-sell excess stockpile */
	Hive.sellExcessResources({
		energy: 1750000,
		O: 250000, H: 250000,
		U: 200000, L: 200000, Z: 200000, K: 200000 });

	Hive.moveExcessEnergy(200000);

	Sites.Reservation("E3S49", "E9S47", null, 
	listPopulation, 
	["E3S49", "E3S50", "E4S50", "E5S50", "E6S50", "E7S50", "E8S50", "E8S49", "E8S48", "E9S48", "E9S47"])
	
	
	/* Forward Operating Base W4S49 */
	Sites.Colony("W4S49", null, Population__Colony_RCL_Mid__Boost);
	Sites.Mining("W4S49", "W4S49", null, false, Population__Mining_2S_Colony);
	Sites.Industry("W4S49", null, Population__Industry);	
	Sites.Mining("W4S49", "W3S49", null, false, Population__Mining_2S_Remote);
	
	/* Forward Operating Base E3S49 */
	Sites.Colony("E3S49", ["W4S49"], Population__Colony_RCL_Mid, null,
		["W4S49", "W4S50", "W3S50", "W2S50", "W1S50", "W0S50", "E0S50", "E1S50", "E2S50", "E3S50"]);
	Sites.Mining("E3S49", "E3S49", ["W4S49"], false, Population__Mining_RCL_Low__Distant,
		["W4S49", "W4S50", "W3S50", "W2S50", "W1S50", "W0S50", "E0S50", "E1S50", "E2S50", "E3S50"]);

		
		
	/* Colony W19S42 */
	Sites.Colony("W19S42", null, Population__Colony_RCL8,
			[ {id: "57a23067cf975f59293d8a28", role: "worker", dir: "send"},
			  {id: "57a23201113c59e97f7e364e", role: "worker", dir: "receive"},
			  {id: "58190bce172c6fb25ecfd584", role: "miner", dir: "send"},
			  {id: "5818ff8a5cf2637c068925e2", role: "miner", dir: "send"},
			  {id: "58190238ca6a63d506ae8597", role: "miner", dir: "receive"},
			  {id: "581904495a628395614bcd2b", role: "miner", dir: "receive"} ]);
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
			[ { action: "reaction", supply1: "57c3fdcc823703630339213d", supply2: "57e3ca388826ba8b794e669c",
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
		    [ {id: "57f1c74616fb8a5a6b0bb386", role: "worker", dir: "send"},
			  {id: "57f1f63bab48a7a015c15ccd", role: "worker", dir: "receive"},
			  {id: "581917b21e938c4e127c7f0a", role: "miner", dir: "send"},
			  {id: "581984520b035f755541ed49", role: "miner", dir: "send"},
			  {id: "58190d13cbe177ac76d7849b", role: "miner", dir: "receive"} ]);
	Sites.Mining("W18S41", "W18S41", null, false, Population__Mining_1S_Colony);
	Sites.Industry("W18S41", null, Population__Industry,
			[ /*{ action: "reaction", supply1: "", supply2: "",
				reactors: [ "", "", "", "",
							"", "", "" ] }*/ ]);

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
			  {id: "581747ec106fbc836af982de", role: "worker", dir: "receive"} ]);
	Sites.Mining("W11S51", "W11S51", null, false, Population__Mining_2S_Colony);
	Sites.Industry("W11S51", null, Population__Industry,
		[ { action: "boost", mineral: "XGH2O", lab: "581e0fed63bbb3937a878657", role: "worker", subrole: "upgrader" } ]);

	/* Colony W6S37 */
	Sites.Colony("W6S37", null, Population__Colony_RCL_Mid);
	Sites.Mining("W6S37", "W6S37", null, false, Population__Mining_2S_Colony);
	Sites.Industry("W6S37", null, Population__Industry,
		[ { action: "boost", mineral: "XGH2O", lab: "5826f1df9a6706607faffe35", role: "worker", subrole: "upgrader" } ]);



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
	Sites.Mining("W15S43", "W15S45", ["W16S43"], true,
			{ soldier:	 {level: 8, amount: 1},
			  burrower:  {level: 6, amount: 2},
			  carrier:   {level: 7, amount: 6},
			  extractor: {level: 8, amount: 2, body: "extractor_rem"},
			  multirole: {level: 7, amount: 1} } );
	Sites.Mining("W15S43", "W15S44", ["W16S43"], true,
			{ paladin: 	 {level: 8, amount: 2, scale_level: false},
			  healer:	 {level: 5, amount: 1},
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
			  healer:	 {level: 5, amount: 1},
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


	/* Run end-tick Hive functions */
	Hive.processSpawnRequests();
	Hive.processSpawnRenewing();

	/* Finish the profiler cycle */
	_CPU.Finish();
};
