require("overload");
require("overload.creep");
require("overload.room");
require("overload.roomposition");

require("populations");

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


	/* Auto-sell excess stockpile
	 * Fields in Memory.resources.[to_market, to_overflow]
	 * to_market: Object {} of resources and at what limit all colonies start overflowing stockpile to market 
	 * 		e.g. {energy: 10000, GH: 5000}
	 * to_overflow: Limit # of energy at which one room should start sending overflow to another room with 
	 * 		less energy e.g. to_overflow: 100000
	 * */
	Hive.sellExcessResources();
	Hive.moveExcessEnergy();


	/* Run all colonies, incl. local mining and industry
	 * Fields for colonies are in Memory.rooms.<roomname>.spawn_assist.[rooms, route] and Memory.rooms.<roomname>.[custom_population, link_definitions]
	 * spawn_assist.rooms: List [] of rooms to assist spawning from for the specified room e.g. ["W5S5", "W4S3"]
	 * spawn_assist.route: List [] of rooms to try to travel through for spawn_assist.rooms e.g. ["W5S5", "W4S5", "W4S4" "W4S3"]
	 * custom_population: Object {} to define a custom types/level/amount of creeps to populate a room with; see 
	 * 		populations.js for format; WARNING: If set, this field must include ALL POPULATION TYPES including colony, mining, and industry!!!
	 * */
	Hive.runColonies();
	Hive.runColonizationRequests();
	Hive.runInvasionRequests();
	Hive.runOccupationRequests();


	/* Run end-tick Hive functions */
	Hive.processSpawnRequests();
	Hive.processSpawnRenewing();
	Hive.endMemory();

	/* Finish the profiler cycle */
	_CPU.Finish();
};
