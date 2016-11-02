let _CPU = require("util.cpu");
let Hive = require("hive");

module.exports = {

	Run: function(rmColony, rmReserve, listSpawnRooms, listPopulation, listRoute) {

		_CPU.Start(rmColony, `Reserve-${rmReserve}-listCreeps`);
		let listCreeps = _.filter(Game.creeps, c => c.memory.room == rmReserve && c.memory.colony == rmColony);
		_CPU.End(rmColony, `Reserve-${rmReserve}-listCreeps`);

		if (Hive.isPulse_Spawn()) {
			_CPU.Start(rmColony, `Reserve-${rmReserve}-runPopulation`);
			this.runPopulation(rmColony, rmReserve, listCreeps, listSpawnRooms, listPopulation);
			_CPU.End(rmColony, `Reserve-${rmReserve}-runPopulation`);
		}

		_CPU.Start(rmColony, `Reserve-${rmReserve}-runCreeps`);
		this.runCreeps(rmColony, rmReserve, listCreeps, listRoute);
		_CPU.End(rmColony, `Reserve-${rmReserve}-runCreeps`);
	},

	runPopulation: function(rmColony, rmReserve, listCreeps, listSpawnRooms, listPopulation) {
		let lReserver  = _.filter(listCreeps, c => c.memory.role == "reserver" && (c.ticksToLive == undefined || c.ticksToLive > 80));

		let popTarget = (listPopulation["reserver"] == null ? 0 : listPopulation["reserver"]["amount"]);
		let popActual = lReserver.length;
		Hive.populationTally(rmColony, popTarget, popActual);

		if (listPopulation["reserver"] != null && lReserver.length < listPopulation["reserver"]["amount"]) {
			Memory["spawn_requests"].push({ room: rmColony, listRooms: listSpawnRooms, priority: 1, level: listPopulation["reserver"]["level"],
				body: (listPopulation["reserver"]["body"] || "reserver"),
				name: null, args: {role: "reserver", room: rmReserve, colony: rmColony} });
		}
	},

	runCreeps: function(rmColony, rmReserve, listCreeps, listRoute) {
		let Roles = require("roles");

		_.each(listCreeps, creep => {
			creep.memory.listRoute = listRoute;

			if (creep.memory.role == "reserver") {
				Roles.Reserver(creep);
			}
        });
	}
};