let Roles = require("roles");
let Hive = require("hive");

let _CPU = require("util.cpu");

module.exports = {

	Run: function(rmColony, rmOccupy) {

		_CPU.Start(rmColony, "Occupy-init");
		listSpawnRooms = _.get(Memory, ["sites", "occupation", rmOccupy, "spawn_assist"]);
		listArmy = _.get(Memory, ["sites", "occupation", rmOccupy, "army"]);
		listTargets = _.get(Memory, ["sites", "occupation", rmOccupy, "targets"]);
		listRoute = _.get(Memory, ["sites", "occupation", rmOccupy, "route"]);		
		_CPU.End(rmColony, "Occupy-init");

		_CPU.Start(rmColony, `Occupy-${rmOccupy}-listCreeps`);
		let listCreeps = _.filter(Game.creeps, c => c.memory.room == rmOccupy && c.memory.colony == rmColony);
		_CPU.End(rmColony, `Occupy-${rmOccupy}-listCreeps`);
		
		if (Hive.isPulse_Spawn()) {
			_CPU.Start(rmColony, `Occupy-${rmOccupy}-runPopulation`);
			this.runPopulation(rmColony, rmOccupy, listCreeps, listSpawnRooms, listArmy);
			_CPU.End(rmColony, `Occupy-${rmOccupy}-runPopulation`);
		}

		_CPU.Start(rmColony, `Occupy-${rmOccupy}-runCreeps`);
		this.runCreeps(rmColony, rmOccupy, listCreeps, listTargets, listRoute);
		_CPU.End(rmColony, `Occupy-${rmOccupy}-runCreeps`);
	},

	runPopulation: function(rmColony, rmOccupy, listCreeps, listSpawnRooms, listArmy) {
        let lSoldier  = _.filter(listCreeps, (c) => c.memory.role == "soldier" && (c.ticksToLive == undefined || c.ticksToLive > 80));
		let lArcher  = _.filter(listCreeps, (c) => c.memory.role == "archer" && (c.ticksToLive == undefined || c.ticksToLive > 80));
		let lHealer  = _.filter(listCreeps, (c) => c.memory.role == "healer" && (c.ticksToLive == undefined || c.ticksToLive > 80));

        let popTarget =
			(listArmy["soldier"] == null ? 0 : listArmy["soldier"]["amount"])
			+ (listArmy["archer"] == null ? 0 : listArmy["archer"]["amount"])
			+ (listArmy["healer"] == null ? 0 : listArmy["healer"]["amount"]);

        let popActual = lSoldier.length + lArcher.length + lHealer.length;
        Hive.populationTally(rmColony, popTarget, popActual);

        if (listArmy["soldier"] != null && lSoldier.length < listArmy["soldier"]["amount"]) {
			Memory["hive"]["spawn_requests"].push({ room: rmColony, listRooms: listSpawnRooms, priority: 1, level: listArmy["soldier"]["level"],
				scale_level: listArmy["soldier"] == null ? true : listArmy["soldier"]["scale_level"],
				body: "soldier", name: null, args: {role: "soldier", room: rmOccupy, colony: rmColony} });
        } else if (listArmy["archer"] != null && lArcher.length < listArmy["archer"]["amount"]) {
			Memory["hive"]["spawn_requests"].push({ room: rmColony, listRooms: listSpawnRooms, priority: 1, level: listArmy["archer"]["level"],
				scale_level: listArmy["archer"] == null ? true : listArmy["archer"]["scale_level"],
				body: "archer", name: null, args: {role: "archer", room: rmOccupy, colony: rmColony} });
        } else if (listArmy["healer"] != null && lHealer.length < listArmy["healer"]["amount"]) {
			Memory["hive"]["spawn_requests"].push({ room: rmColony, listRooms: listSpawnRooms, priority: 1, level: listArmy["healer"]["level"],
				scale_level: listArmy["healer"] == null ? true : listArmy["healer"]["scale_level"],
				body: "healer", name: null, args: {role: "healer", room: rmOccupy, colony: rmColony} });
        }
	},

	runCreeps: function(rmColony, rmOccupy, listCreeps, listTargets, listRoute) {
		_.each(listCreeps, creep => {
            creep.memory.listRoute = listRoute;
			let _Creep = require("util.creep");

			if (creep.room.name != rmOccupy)
				_Creep.moveToRoom(creep, rmOccupy, true);
			else {
				if (creep.memory.role == "soldier") {
					Roles.Soldier(creep, true, true, listTargets);
				} else if (creep.memory.role == "archer") {
					Roles.Archer(creep, true, listTargets);
				} else if (creep.memory.role == "healer") {
					Roles.Healer(creep);
				}
			}
        });
	}
};