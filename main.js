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
	 * 		populations.js for format
	 * link_definitions: List [] to define links in the room, which send and which receive, and whether 
	 * 		they are for workers (upgrading) or miners (moving minerals) e.g.
	 * 		[ {id: "57d8799179f192fc71374cf1", role: "worker", dir: "send"},
			  {id: "57abe33f4a8b4b5a2f1a2b85", role: "worker", dir: "receive"} ]
	 * */
	Hive.runColonies();
	Hive.runColonizationRequests();


	/* Run end-tick Hive functions */
	Hive.processSpawnRequests();
	Hive.processSpawnRenewing();

	/* Finish the profiler cycle */
	_CPU.Finish();
};
