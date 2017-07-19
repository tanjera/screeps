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
		{ worker:   {level: 3, amount: 3},
//		  repairer: {level: 3, amount: 1},
		  upgrader: {level: 3, amount: 3} });
	Sites.Mining("W7N4", "W7N4", null, false, 
		{ burrower:  {level: 3, amount: 1},
		  carrier:   {level: 3, amount: 2} });

	

	/* Run end-tick Hive functions */
	Hive.processSpawnRequests();
	Hive.processSpawnRenewing();

	/* Finish the profiler cycle */
	_CPU.Finish();
};
