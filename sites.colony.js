let _CPU = require("util.cpu");
let Hive = require("hive");

module.exports = {

	Run: function(rmColony, listSpawnRooms, listPopulation, listLinks, listRoute) {

		if (Hive.isPulse_Spawn()) {
			_CPU.Start(rmColony, "Colony-runPopulation");
			this.runPopulation(rmColony, listSpawnRooms, listPopulation);
			_CPU.End(rmColony, "Colony-runPopulation");
		}

		_CPU.Start(rmColony, "Colony-runCreeps");
		this.runCreeps(rmColony, listRoute);
        _CPU.End(rmColony, "Colony-runCreeps");

		_CPU.Start(rmColony, "Colony-runTowers");
		this.runTowers(rmColony);
        _CPU.End(rmColony, "Colony-runTowers");

		_CPU.Start(rmColony, "Colony-runLinks");
		this.runLinks(rmColony, listLinks);
        _CPU.End(rmColony, "Colony-runLinks");
	},


	runPopulation: function(rmColony, listSpawnRooms, listPopulation) {
		let lWorker = _.filter(Game.creeps, (creep) => creep.memory.role == "worker" && creep.memory.subrole == null && creep.memory.room == rmColony);
        let lRepairer = _.filter(Game.creeps, (creep) => creep.memory.role == "worker" && creep.memory.subrole == "repairer" && creep.memory.room == rmColony);
        let lUpgrader = _.filter(Game.creeps, (creep) => creep.memory.role == "worker" && creep.memory.subrole == "upgrader" && creep.memory.room == rmColony);
        let lSoldier = _.filter(Game.creeps, (creep) => creep.memory.role == "soldier" && creep.memory.room == rmColony);

        let popTarget =
            (listPopulation["worker"] == null ? 0 : listPopulation["worker"]["amount"])
            + (listPopulation["repairer"] == null ? 0 : listPopulation["repairer"]["amount"])
            + (listPopulation["upgrader"] == null ? 0 : listPopulation["upgrader"]["amount"])
            + (listPopulation["soldier"] == null ? 0 : listPopulation["soldier"]["amount"]);
        let popActual = lWorker.length + lRepairer.length + lUpgrader.length + lSoldier.length;
        Hive.populationTally(rmColony, popTarget, popActual);

        if ((listPopulation["soldier"] != null && lSoldier.length < listPopulation["soldier"]["amount"])
            || (lSoldier.length < Game.rooms[rmColony].find(FIND_HOSTILE_CREEPS, { filter: function(c) {
                        return Memory["allies"].indexOf(c.owner.username) < 0; }}).length)) {
			Memory["spawn_requests"].push({ room: rmColony, listRooms: listSpawnRooms, priority: 0,
				level: (listPopulation["soldier"] == null ? 8 : listPopulation["soldier"]["level"]),
				body: "soldier", name: null, args: {role: "soldier", room: rmColony} });
        } else if (listPopulation["worker"] != null && lWorker.length < listPopulation["worker"]["amount"]) {
			Memory["spawn_requests"].push({ room: rmColony, listRooms: listSpawnRooms, priority: 3, level: listPopulation["worker"]["level"],
				body: (listPopulation["worker"]["body"] || "worker"),
				name: null, args: {role: "worker", room: rmColony} });
        } else if (listPopulation["repairer"] != null && lRepairer.length < listPopulation["repairer"]["amount"]) {
			Memory["spawn_requests"].push({ room: rmColony, listRooms: listSpawnRooms, priority: 4, level: listPopulation["repairer"]["level"],
				body: (listPopulation["repairer"]["body"] || "worker"),
				name: null, args: {role: "worker", subrole: "repairer", room: rmColony} });
        } else if (listPopulation["upgrader"] != null && lUpgrader.length < listPopulation["upgrader"]["amount"]) {
			Memory["spawn_requests"].push({ room: rmColony, listRooms: listSpawnRooms, priority: 4, level: listPopulation["upgrader"]["level"],
				scale_level: listPopulation["upgrader"]["scale_level"] || "true",
				body: (listPopulation["upgrader"]["body"] || "worker"),
				name: null, args: {role: "worker", subrole: "upgrader", room: rmColony} });
        }
	},


	runCreeps: function (rmColony, listRoute) {
		let Roles = require("roles");

		for (let n in Game.creeps) {
            let creep = Game.creeps[n];
            if (creep.memory.room != null && creep.memory.room == rmColony) {

				creep.memory.listRoute = listRoute;

                if (creep.memory.role == "worker") {
                    Roles.Worker(creep);
                }
                else if (creep.memory.role == "soldier") {
                    Roles.Soldier(creep);
                }
            }
        }
	},


	runTowers: function (rmColony) {
		if (_.get(Memory, ["rooms", rmColony, "towers", "target_attack"]) == null) {
			if (Game.time % 2 == 0) {
				let hostile = _.head(Game.rooms[rmColony].find(FIND_HOSTILE_CREEPS, { filter: function(c) {
					return Memory["allies"].indexOf(c.owner.username) < 0; }}));
				if (hostile != null)
					_.set(Memory, ["rooms", rmColony, "towers", "target_attack"], hostile.id);
			}
		} else {
			let hostile = Game.getObjectById(_.get(Memory, ["rooms", rmColony, "towers", "target_attack"]));
			if (hostile == null) {
				_.set(Memory, ["rooms", rmColony, "towers", "target_attack"], null);
			} else {
				_.each(Game.rooms[rmColony].find(FIND_MY_STRUCTURES, { filter: (s) => { return s.structureType == STRUCTURE_TOWER; }}),
					t => { t.attack(hostile) });
				return;
			}
		}

		if (_.get(Memory, ["rooms", rmColony, "towers", "target_heal"]) == null) {
			if (Game.time % 2 == 0) {
				let injured = _.head(Game.rooms[rmColony].find(FIND_MY_CREEPS, { filter: function(c) { return c.hits < c.hitsMax; }}));
				if (injured != null)
					_.set(Memory, ["rooms", rmColony, "towers", "target_heal"], injured.id);
			}
		} else {
			let injured = Game.getObjectById(_.get(Memory, ["rooms", rmColony, "towers", "target_heal"]));
			if (injured == null) {
				_.set(Memory, ["rooms", rmColony, "towers", "target_heal"], null);
			} else {
				_.each(Game.rooms[rmColony].find(FIND_MY_STRUCTURES, { filter: (s) => { return s.structureType == STRUCTURE_TOWER; }}),
					t => { t.heal(injured) });
				return;
			}
		}
	},


	runLinks: function (rmColony, listLinks) {
		Memory["rooms"][rmColony]["links"] = listLinks;
		if (listLinks != null) {
            let linksSend = _.filter(listLinks, l => { return l["dir"] == "send"; });
            let linksReceive = _.filter(listLinks, l => { return l["dir"] == "receive"; });

            _.each(linksReceive, r => {
				let receive = Game.getObjectById(r["id"]);
                _.each(linksSend, s => {
					if (r["role"] == s["role"] && receive != null) {
						let send = Game.getObjectById(s["id"]);
						if (send != null && send.energy > send.energyCapacity * 0.25 && receive.energy < receive.energyCapacity * 0.9) {
							send.transferEnergy(receive);
						}
					}
                });
            });
        }
	}
};