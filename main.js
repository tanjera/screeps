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
	Memory["allies"] = [];

	/* Auto-sell excess stockpile */
	Hive.sellExcessResources({
		energy: 1750000,
		O: 250000, H: 250000,
		U: 200000, L: 200000, Z: 200000, K: 200000 });

	Hive.moveExcessEnergy(200000);

	
	/* PRIVATE SERVER */
	
	
	/* Colony W7N4 */
	Sites.Colony("W7N4", null, 
		{ worker:   {level: 4, amount: 2},
		  repairer: {level: 4, amount: 1},
		  upgrader: {level: 4, amount: 2} },
		[ {id: "8ebcd126a19cc8e", role: "worker", dir: "send"},
		  {id: "d6c1d15f1e215f0", role: "worker", dir: "receive"} ]);
	Sites.Mining("W7N4", "W7N4", null, false, Population__Mining_RCL_Low);

	

	/* Run end-tick Hive functions */
	Hive.processSpawnRequests();
	Hive.processSpawnRenewing();

	/* Finish the profiler cycle */
	_CPU.Finish();
};
