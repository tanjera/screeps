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

	/* OFFICIAL SCREEPS.COM SERVER */

	/* Colony W19S42 */
	Sites.Colony("W19S42", null, null);
	Sites.Mining("W19S42", "W19S42", null, false, null);
	
	

	/* Run end-tick Hive functions */
	Hive.processSpawnRequests();
	Hive.processSpawnRenewing();

	/* Finish the profiler cycle */
	_CPU.Finish();
};
