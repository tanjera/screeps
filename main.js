require("overload");
require("overload.creep");
require("overload.room");
require("overload.roomposition");

require("populations");
require("populations.combat")

let Hive = require("hive");
let Blueprint = require("blueprint");
let CPU = require("util.cpu");
let Grafana = require("util.grafana");

module.exports.loop = function () {

	CPU.Init();

	if (Hive.refillBucket()) {
		return;
	}

	Hive.clearDeadMemory();
	Hive.initMemory();
	Hive.initLabs();
	Hive.initVisuals();

	Hive.runColonies();
	Hive.runColonizations();
	Hive.runCombat();

	Hive.processSpawnRequests();
	Hive.processSpawnRenewing();

	if (hasCPU()) {
		Hive.sellExcessResources();
		Hive.moveExcessEnergy();
	}

	if (hasCPU()) {
		Blueprint.Init();
	}

	Hive.endMemory();
	Grafana.Run();

	CPU.Finish();
};
