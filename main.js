require("overload.creep");
require("overload.roomposition");

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



	/* Ally list <3 */
	Memory["allies"] = [
		"Pantek59", "king_lispi", "Atavus", "BlackLotus",
		"Moria", "Atlan", "Ashburnie", "seancl", "Finndibaen",
		"Klapaucius", "Hachima" ];

	/* Auto-sell excess stockpile */
	Hive.sellExcessResources({
		energy: 1750000,
		O: 250000, H: 250000,
		U: 150000, L: 150000, Z: 150000, K: 150000 });

	Hive.moveExcessEnergy(200000);


	/* Generic population definitions */

	let Population__Colony_RCL_Low =
			{ worker:   {level: 3, amount: 2},
			  repairer: {level: 3, amount: 1},
			  upgrader: {level: 3, amount: 1} };
	let Population__Colony_RCL_Mid =
			{ worker:   {level: 7, amount: 1},
			  repairer: {level: 5, amount: 1},
			  upgrader: {level: 7, amount: 2} };
	let Population__Colony_RCL8 =
			{ worker:   {level: 7, amount: 1, scale_level: false},
			  repairer: {level: 6, amount: 1} };

	let Population__Mining_RCL_Low =
			{ burrower:  {level: 5, amount: 1},
			  carrier:   {level: 3, amount: 2} };
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



	/* Forward Operating Base W6S49 */
	Sites.Colony("W6S49", ["W11S44"], 
			{ worker:   {level: 5, amount: 1, body: "worker_at"},
			  repairer: {level: 4, amount: 1, body: "worker_at"},
			  upgrader: {level: 5, amount: 2, body: "worker_at"} }, 
		null, 
		["W11S44", "W10S44", "W10S45", "W10S46", "W10S47", "W10S48", "W10S49", "W10S50", "W9S50", "W8S50", "W7S50", "W6S50", "W6S49"]);
	Sites.Mining("W6S49", "W6S49", ["W11S44"], false, 
			{ burrower:  {level: 5, amount: 1, body: "burrower_at"},
			  carrier:   {level: 3, amount: 2, body: "carrier_at"} },
		["W11S44", "W10S44", "W10S45", "W10S46", "W10S47", "W10S48", "W10S49", "W10S50", "W9S50", "W8S50", "W7S50", "W6S50", "W6S49"]);



	/* Colony W18S43 */
	Sites.Colony("W18S43", ["W19S42"], Population__Colony_RCL8,
			[ {id: "57a2465268244ab107a96d5e", role: "send"},
			  {id: "57a24f9cacbffcb869dc9d21", role: "receive"},
			  {id: "57a25c61958cffd536325056", role: "receive"} ] );
	Sites.Mining("W18S43", "W18S43", ["W19S42"], false, Population__Mining_2S_Colony);
	Sites.Industry("W18S43", ["W19S42"], Population__Industry,
			[ { action: "boost", mineral: "XGH2O", lab: "57d9e3f2ee1822544d1a22fb", role: "worker", subrole: null },
			  { action: "reaction", mineral: "G", amount: 25000,
				supply1: "57da4f4df77673f57f674b8e", supply2: "57da17db81f808d96870b7fb",
				reactors: [ "57d97c52cfda43d45247083e", "57d9cf9924d28b4e75fa36b0", "57da577ebc2f1b570771255e", "57da7b4e649fda0f692fad61",
							"57d8e922691ae2dd20b05ed0", "57d911d8021b52930f0ef841", "57d91a5c75599c3a719bbbea"] } ]);

	/* Colony W19S42 */
	Sites.Colony("W19S42", ["W18S43"], Population__Colony_RCL8,
			[ {id: "57a23067cf975f59293d8a28", role: "send"},
			  {id: "57a23201113c59e97f7e364e", role: "receive"},
			  {id: "57a6a9d62d673fac4f21a62a", role: "receive"}]);
	Sites.Mining("W19S42", "W19S42", ["W18S43"], false, Population__Mining_2S_Colony);
	Sites.Industry("W19S42", ["W18S43"], Population__Industry,
			[ { action: "boost", mineral: "XGH2O", lab: "57d9125375eff1b40a1c65e1", role: "worker", subrole: null },
			  { action: "reaction", mineral: "ZK", amount: 25000,
				supply1: "57d8e078691ae2dd20b05905", supply2: "57d9de60bce03e1b1a1f193a",
				reactors: [ "57d88a475797bae8438c0b79", "57d8b4aa3fc139b87f530540", "57d90f6bebd811df3152e8a1", "57d9667d968026fa32f224f2",
							"57d9ac42712b129b6c3515b3", "57d9b60063dc7662328df345", "57d87d22751a3e375ab487e8" ] } ]);

	/* Colony W15S41 */
	Sites.Colony("W15S41", ["W13S41"], Population__Colony_RCL8,
			[ {id: "57d8799179f192fc71374cf1", role: "send"},
			  {id: "57abe33f4a8b4b5a2f1a2b85", role: "receive"},
			  {id: "57af99d528986c413c0a8f4c", role: "receive"} ] );
	Sites.Mining("W15S41", "W15S41", ["W13S41"], false, Population__Mining_2S_Colony);
	Sites.Industry("W15S41", ["W13S41"], Population__Industry,
			[ { action: "boost", mineral: "XGH2O", lab: "57d8a65bab861d4e5a9d1c0b", role: "worker", subrole: null },
			  { action: "reaction", mineral: "GH", amount: 25000,
				supply1: "57d89720dce50fae29ef2a2f", supply2: "57d9447dd2ca5f470498bb39",
				reactors: [ "57d881c1379deeae5258a079", "57d88d54f20b92b65d7ab82f", "57d89f2ad4e23b6a2c92e17d", "57d8e3a2ea2796d33b4a5010",
							"57d96dfcaf7c4a4c5fb94601", "57d997a069779881436dbca0", "57d91ca57fcc818072da4b27" ] } ]);

	/* Colony W15S43 */
	Sites.Colony("W15S43", ["W18S43"], Population__Colony_RCL8,
			[ {id: "57dc9ffd9754877f17a191c5", role: "send"},
			  {id: "57dca2fcf52af188391d0a20", role: "receive"} ]);
	Sites.Mining("W15S43", "W15S43", ["W18S43"], false, Population__Mining_1S_Colony);
	Sites.Industry("W15S43", ["W18S43"], Population__Industry,
			[ { action: "reaction", mineral: "OH", amount: 25000,
				supply1: "57c3fdcc823703630339213d", supply2: "57e3ca388826ba8b794e669c",
				reactors: [ "57d904f43638e72938ab1a07", "57e3c25752f8ca0e2ab1bdd1", "57e3d8c34d38ad60307ea948", "57e3e76f43bae8a77e035d7a",
							"57d934dd5b1ce747079af503", "57c4a633e06148377d95b97d", "57c8dc805e86b05c1d5892e3" ] } ]);

	/* Colony W13S41 */
	Sites.Colony("W13S41", ["W15S41"], Population__Colony_RCL8,
			[ {id: "57cb35b4fea5b2332f74815a", role: "send"},
			  {id: "57cb36bd7d58704651710ab0", role: "send"},
			  {id: "57c06b8698040e1908490daf", role: "receive"},
			  {id: "57c3eabdc480f8a72a2cdb75", role: "receive"} ] );
	Sites.Mining("W13S41", "W13S41", ["W15S41"], false, Population__Mining_2S_Colony);
	Sites.Industry("W13S41", ["W15S41"], Population__Industry,
			[ { action: "reaction", mineral: "UL", amount: 25000,
				supply1: "57c5ab258a3658822748cc62", supply2: "57d974c8c6030b8452419739",
				reactors: [ "57d91151b7f80d630f82986c", "57c3ef8850ba39ec2725c182", "57e6acdbbeb0889921785212", "57e6cf4e6473741e42c27141",
							"57e8d0f4f1dd30b4337b8e03", "57e75953a0a3cd623e574cd5", "57cb34e3d80e43e128862a09" ] } ]);

	/* Colony W11S44 */
	Sites.Colony("W11S44", ["W11S45"], Population__Colony_RCL8,
		    [ {id: "57c8c4ae926658ea75161a21", role: "send"},
			  {id: "57c8ca7749e338931cf1fa66", role: "receive"},
			  {id: "57cda809a5db4ace37cb2672", role: "receive"} ]);
	Sites.Mining("W11S44", "W11S44", ["W11S45"], false, Population__Mining_2S_Colony);
	Sites.Industry("W11S44", ["W11S45"], Population__Industry,
			[ { action: "reaction", mineral: "GH2O", amount: 25000,
				supply1: "57db5e885cccb19c0906bd50", supply2: "57d92ba61555c2084275c953",
				reactors: [ "57db4c0f79dacb1478e2b3d9", "57fa00ba718e16f73f4a60e5", "57fa0dc2e961e13a70707225", "57db9d4c2c1ea9eb535f24ec",
							"57d9cbc11c4c10f41d9e57a8", "57f9f01e91f2d2e81bd32d5b", "57f9de4c3ceb7ced6b2e3e28" ] } ]);

	/* Colony W11S45 */
	Sites.Colony("W11S45", ["W11S44"], Population__Colony_RCL8,
			[ {id: "57d61ddf2ff0d3ea25976f78", role: "send"},
			  {id: "57ddb7390a699fdb6cc87b58", role: "receive"} ]);
	Sites.Mining("W11S45", "W11S45", ["W11S44"], false, Population__Mining_2S_Colony);
	Sites.Industry("W11S45", ["W11S44"], Population__Industry);

	/* Colony W18S41 */
	Sites.Colony("W18S41", null, Population__Colony_RCL8,
		    [ {id: "57f1c74616fb8a5a6b0bb386", role: "send"},
			  {id: "57f1f63bab48a7a015c15ccd", role: "receive"} ]);
	Sites.Mining("W18S41", "W18S41", null, false, Population__Mining_1S_Colony);
	Sites.Industry("W18S41", null, Population__Industry,
			[ { action: "boost", mineral: "XGH2O", lab: "57ec7be65dff746643b687dd", role: "worker", subrole: null },
			  { action: "reaction", mineral: "XGH2O", amount: -1,
				supply1: "57f1f4076a19548340f790c1", supply2: "580505c9e898605430de7c62",
				reactors: [ "57f1dc282328a5430803d75f", "57f6e31a8538cb68487ef987", "57f7a053df6f91e9697fd46c", "57f6e183bd1ef5dc2c7fd9a7",
							"5805317d877d581814f857e1", "58051875453185982dd5332a", "5804ee71702bae5a7d5276cd" ] } ]);

	/* Colony W16S43 */
	Sites.Colony("W16S43", ["W15S43", "W18S43"], Population__Colony_RCL_Mid);
	Sites.Mining("W16S43", "W16S43", ["W15S43", "W18S43"], false, Population__Mining_RCL_Low);



	/* Remote mining operations for W18S43 */
	Sites.Mining("W18S43", "W19S43", ["W19S42"], false, Population__Mining_1S_Remote);
	Sites.Mining("W18S43", "W17S43", ["W15S43"], false, Population__Mining_2S_Remote);

	/* Remote mining operations for W19S42 */
	Sites.Mining("W19S42", "W18S42", null, false, Population__Mining_2S_Remote);

	/* Remote mining operations for W15S41 */
	Sites.Mining("W15S41", "W15S42", null, false, Population__Mining_2S_Remote);
	Sites.Mining("W15S41", "W14S42", ["W15S43", "W13S41"], false, Population__Mining_2S_Remote);
	Sites.Mining("W15S41", "W16S42", ["W15S43"], false, Population__Mining_2S_Remote, ["W15S41", "W15S42", "W16S42"]);
	Sites.Mining("W15S41", "W17S41", ["W18S41"], false, Population__Mining_2S_Remote, ["W15S41", "W16S41", "W17S41"]);
	Sites.Mining("W15S41", "W16S41", null, false, Population__Mining_1S_Remote);

	/* Remote mining operations for W15S43 */
	Sites.Mining("W15S43", "W15S45", null, false,
			{ burrower:  {level: 6, amount: 2},
			  carrier:   {level: 7, amount: 7},
			  extractor: {level: 8, amount: 1, body: "extractor_rem"},
			  multirole: {level: 7, amount: 1} } );
	Sites.Mining("W15S43", "W15S44", null, true,
			{ paladin: 	 {level: 8, amount: 1, scale_level: false},
			  healer:	 {level: 5, amount: 1},
			  burrower:	 {level: 6, amount: 2},
			  carrier:   {level: 7, amount: 7},
			  extractor: {level: 8, amount: 1, body: "extractor_rem"},
			  multirole: {level: 6, amount: 1} } );

	/* Remote mining operations for W13S41 */
	Sites.Mining("W13S41", "W12S41", null, false, Population__Mining_2S_Remote);
	Sites.Mining("W13S41", "W13S42", null, false, Population__Mining_2S_Remote);
	Sites.Mining("W13S41", "W12S42", null, false, Population__Mining_2S_Remote, ["W13S41", "W13S42", "W12S42"] );

	/* Remote mining operations for W11S44 */
	Sites.Mining("W11S44", "W12S44", ["W11S45"], false, Population__Mining_2S_Remote);

	/* Remote mining operations for W11S45 */
	Sites.Mining("W11S45", "W11S46", ["W11S44"], false, Population__Mining_2S_Remote);

	/* Remote mining operations for W18S41 */
	Sites.Mining("W18S41", "W19S41", null, false, Population__Mining_2S_Remote);

	/* Remote mining operations for W16S43 */
	Sites.Mining("W15S43", "W16S44", null, true,	// Zookeeping by W15S43
			{ paladin: 	 {level: 8, amount: 1, scale_level: false},
			  healer:	 {level: 5, amount: 1},
			  //extractor: {level: 8, amount: 1, body: "extractor_rem"},
			  multirole: {level: 6, amount: 1} } );
	/*Sites.Mining("W16S43", "W16S44", ["W15S43", "W18S43"], true,
			{ burrower:	 {level: 6, amount: 2},
			  carrier:   {level: 7, amount: 7} } ); */



	/* Run end-tick Hive functions */
	Hive.processSpawnRequests();
	Hive.processSpawnRenewing();

	/* Finish the profiler cycle */
	_CPU.Finish();
};
