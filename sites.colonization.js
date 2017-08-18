require("populations");

let _CPU = require("util.cpu");
let Hive = require("hive");

module.exports = {

	Run: function(rmColony, rmTarget) {

		controller = _.get(Game, ["rooms", rmColony, "controller"]);
		if (controller == null || !_.get(controller, "my") || _.get(controller, "level") < 3)
			return;

		_CPU.Start(rmColony, `Colonization-${rmTarget}-init`);
		listRoute = _.get(Memory, ["sites", "colonization", rmTarget, "listRoute"]);
		_CPU.End(rmColony, `Colonization-${rmTarget}-init`);

		_CPU.Start(rmColony, `Colonization-${rmTarget}-listCreeps`);
		let listCreeps = _.filter(Game.creeps, c => c.memory.room == rmTarget && c.memory.colony == rmColony);
		_CPU.End(rmColony, `Colonization-${rmTarget}-listCreeps`);

		if (Hive.isPulse_Spawn()) {
			_CPU.Start(rmColony, `Colonization-${rmTarget}-runPopulation`);
			this.runPopulation(rmColony, rmTarget, listCreeps);
			_CPU.End(rmColony, `Colonization-${rmTarget}-runPopulation`);
		}

		_CPU.Start(rmColony, `Colonization-${rmTarget}-runCreeps`);
		this.runCreeps(rmColony, rmTarget, listCreeps, listRoute);
		_CPU.End(rmColony, `Colonization-${rmTarget}-runCreeps`);
	},

	runPopulation: function(rmColony, rmTarget, listCreeps) {
		let lColonizer  = _.filter(listCreeps, c => c.memory.role == "colonizer" && (c.ticksToLive == undefined || c.ticksToLive > 0));

		let listPopulation = Population_Colonization;

		let popTarget = (listPopulation["colonizer"] == null ? 0 : listPopulation["colonizer"]["amount"]);
		let popActual = lColonizer.length;
		Hive.populationTally(rmColony, popTarget, popActual);

		if (listPopulation["colonizer"] != null && lColonizer.length < listPopulation["colonizer"]["amount"]) {
			Memory["hive"]["spawn_requests"].push({ room: rmColony, listRooms: null, priority: 3, level: listPopulation["colonizer"]["level"],
				scale_level: listPopulation["colonizer"] == null ? true : listPopulation["colonizer"]["scale_level"],
				body: (listPopulation["colonizer"]["body"] || "reserver_at"),
				name: null, args: {role: "colonizer", room: rmTarget, colony: rmColony} });
		}
	},

	runCreeps: function(rmColony, rmTarget, listCreeps, listRoute) {
		let Roles = require("roles");

		_.each(listCreeps, creep => {
			creep.memory.listRoute = listRoute;

			if (creep.memory.role == "colonizer") {
				Roles.Colonizer(creep);
			}
        });
	}
};