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



	/* Run all colonies, incl.  mining and industry */
	_.each(Game.rooms, room => {
		if (room.controller.my) {
			Sites.Colony(room.name);
			Sites.Mining(room.name, room.name);

			if (room.controller.level >= 6)
				Sites.Industry(room.name);
		}
	});

	

	/* Run end-tick Hive functions */
	Hive.processSpawnRequests();
	Hive.processSpawnRenewing();

	/* Finish the profiler cycle */
	_CPU.Finish();
};
