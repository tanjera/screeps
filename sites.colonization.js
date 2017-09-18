require("populations");

let _CPU = require("util.cpu");
let Hive = require("hive");

module.exports = {

	Run: function(rmColony, rmTarget) {

		controller = _.get(Game, ["rooms", rmColony, "controller"]);
		if (controller == null || !_.get(controller, "my") || _.get(controller, "level") < 3)
			return;

		_CPU.Start(rmColony, `Colonization-${rmTarget}-init`);
		listRoute = _.get(Memory, ["sites", "colonization", rmTarget, "list_route"]);
		_CPU.End(rmColony, `Colonization-${rmTarget}-init`);

		_CPU.Start(rmColony, `Colonization-${rmTarget}-listCreeps`);
		let listCreeps = _.filter(Game.creeps, c => c.memory.room == rmTarget && c.memory.colony == rmColony);
		_CPU.End(rmColony, `Colonization-${rmTarget}-listCreeps`);

		if (isPulse_Spawn()) {
			_CPU.Start(rmColony, `Colonization-${rmTarget}-runPopulation`);
			this.runPopulation(rmColony, rmTarget, listCreeps);
			_CPU.End(rmColony, `Colonization-${rmTarget}-runPopulation`);
		}

		_CPU.Start(rmColony, `Colonization-${rmTarget}-runCreeps`);
		this.runCreeps(rmColony, rmTarget, listCreeps, listRoute);
		_CPU.End(rmColony, `Colonization-${rmTarget}-runCreeps`);
	},

	runPopulation: function(rmColony, rmTarget, listCreeps) {
		let popActual = new Object();
		_.set(popActual, "colonizer", _.filter(listCreeps, c => c.memory.role == "colonizer").length);

		let popTarget = _.clone(Population_Colonization);

		// Tally population levels for level scaling and statistics
		Hive.populationTally(rmColony, 
			_.sum(popTarget, p => { return _.get(p, "amount", 0); }), 
			_.sum(popActual));
			
		let Grafana = require("util.grafana");
		Grafana.populationTally(rmColony, popTarget, popActual);

		if (_.get(popActual, "colonizer") < _.get(popTarget, ["colonizer", "amount"])) {
			Memory["hive"]["spawn_requests"].push({ room: rmColony, listRooms: null, priority: 3, 
				level: popTarget["colonizer"]["level"],
				scale_level: _.get(popTarget, ["colonizer", "scale_level"], true),
				body: _.get(popTarget, ["colonizer", "body"], "reserver_at"),
				name: null, args: {role: "colonizer", room: rmTarget, colony: rmColony} });
		}
	},

	runCreeps: function(rmColony, rmTarget, listCreeps, listRoute) {
		let Roles = require("roles");

		_.each(listCreeps, creep => {
			_.set(creep, ["memory", "list_route"], listRoute);

			if (creep.memory.role == "colonizer") {
				Roles.Colonizer(creep);
			}
        });
	}
};