require("populations");

let _CPU = require("util.cpu");
let Hive = require("hive");

module.exports = {

	Run: function(rmColony, listSpawnRooms, listPopulation, listSpawnRoute) {

		_CPU.Start(rmColony, "Colony-init");
		if (listSpawnRooms == null)
			listSpawnRooms = _.get(Memory, ["rooms", rmColony, "spawn_assist", "rooms"]);
		if (listSpawnRoute == null)
			listSpawnRoute = _.get(Memory, ["rooms", rmColony, "spawn_assist", "route"]);
		if (listPopulation == null)
			listPopulation = _.get(Memory, ["rooms", rmColony, "custom_population"]);
		_CPU.End(rmColony, "Colony-init");

		_CPU.Start(rmColony, "Colony-listCreeps");
		let listCreeps = _.filter(Game.creeps, c => c.memory.room == rmColony);
		_CPU.End(rmColony, "Colony-listCreeps");

		_CPU.Start(rmColony, "Colony-surveyRoom");
		if (Game.time % 3 == 0)
			this.surveyRoom(rmColony);
		_CPU.End(rmColony, "Colony-surveyRoom");

		if (Hive.isPulse_Spawn()) {
			_CPU.Start(rmColony, "Colony-runPopulation");
			this.runPopulation(rmColony, listCreeps, listSpawnRooms, listPopulation);
			_CPU.End(rmColony, "Colony-runPopulation");
		}

		_CPU.Start(rmColony, "Colony-runCreeps");
		this.runCreeps(rmColony, listCreeps, listSpawnRoute);
        _CPU.End(rmColony, "Colony-runCreeps");

		_CPU.Start(rmColony, "Colony-runTowers");
		this.runTowers(rmColony);
        _CPU.End(rmColony, "Colony-runTowers");
		
		_CPU.Start(rmColony, "Colony-defineLinks");
		if (Game.time % 200 == 0)
			this.defineLinks(rmColony);
		_CPU.End(rmColony, "Colony-defineLinks");

		_CPU.Start(rmColony, "Colony-runLinks");
		this.runLinks(rmColony);
        _CPU.End(rmColony, "Colony-runLinks");
	},

	surveyRoom: function(rmColony) {
		let visible = _.keys(Game.rooms).includes(rmColony);
		_.set(Memory, ["rooms", rmColony, "has_minerals"],
			visible ? Game.rooms[rmColony].find(FIND_MINERALS, {filter: (m) => { return m.mineralAmount > 0; }}).length > 0 : false);

		let amountHostiles = visible
			? Game.rooms[rmColony].find(FIND_HOSTILE_CREEPS, { filter: (c) => { return Memory["allies"].indexOf(c.owner.username) < 0; }}).length : 0;
		let isSafe = !visible || amountHostiles == 0;
		_.set(Memory, ["rooms", rmColony, "is_safe"], isSafe);
		_.set(Memory, ["rooms", rmColony, "amount_hostiles"], amountHostiles);
	},

	runPopulation: function(rmColony, listCreeps, listSpawnRooms, listPopulation) {
		let lWorker = _.filter(listCreeps, c => c.memory.role == "worker" && c.memory.subrole == null);
		let lRepairer = _.filter(listCreeps, c => c.memory.role == "worker" && c.memory.subrole == "repairer");
		let lUpgrader = _.filter(listCreeps, c => c.memory.role == "worker" && c.memory.subrole == "upgrader");
		let lSoldier = _.filter(listCreeps, c => c.memory.role == "soldier");

		if (listPopulation == null)
			listPopulation = Population_Colony[listSpawnRooms == null ? "Standalone" : "Assisted"][Game.rooms[rmColony].controller.level];

		let popTarget =
			(listPopulation["worker"] == null ? 0 : listPopulation["worker"]["amount"])
			+ (listPopulation["repairer"] == null ? 0 : listPopulation["repairer"]["amount"])
			+ (listPopulation["upgrader"] == null ? 0 : listPopulation["upgrader"]["amount"])
			+ (listPopulation["soldier"] == null ? 0 : listPopulation["soldier"]["amount"]);
		let popActual = lWorker.length + lRepairer.length + lUpgrader.length + lSoldier.length;
		Hive.populationTally(rmColony, popTarget, popActual);

		if ((listPopulation["soldier"] != null && lSoldier.length < listPopulation["soldier"]["amount"])
			|| (lSoldier.length < _.get(Memory, ["rooms", rmColony, "amount_hostiles"]))) {
				Memory["spawn_requests"].push({ room: rmColony, listRooms: listSpawnRooms, priority: 0,
					level: (listPopulation["soldier"] == null ? 8 : listPopulation["soldier"]["level"]),
					scale_level: listPopulation["soldier"] == null ? true : listPopulation["soldier"]["scale_level"],
					body: "soldier", name: null, args: {role: "soldier", room: rmColony} });
		} else if (listPopulation["worker"] != null && lWorker.length < listPopulation["worker"]["amount"]) {
				Memory["spawn_requests"].push({ room: rmColony, listRooms: listSpawnRooms, priority: 3, level: listPopulation["worker"]["level"],
					scale_level: listPopulation["worker"] == null ? true : listPopulation["worker"]["scale_level"],
					body: (listPopulation["worker"]["body"] || "worker"),
					name: null, args: {role: "worker", room: rmColony} });
		} else if (listPopulation["repairer"] != null && lRepairer.length < listPopulation["repairer"]["amount"]) {
				Memory["spawn_requests"].push({ room: rmColony, listRooms: listSpawnRooms, priority: 4, level: listPopulation["repairer"]["level"],
					scale_level: listPopulation["repairer"] == null ? true : listPopulation["repairer"]["scale_level"],
					body: (listPopulation["repairer"]["body"] || "worker"),
					name: null, args: {role: "worker", subrole: "repairer", room: rmColony} });
		} else if (listPopulation["upgrader"] != null && lUpgrader.length < listPopulation["upgrader"]["amount"]) {
				Memory["spawn_requests"].push({ room: rmColony, listRooms: listSpawnRooms, priority: 4, level: listPopulation["upgrader"]["level"],
					scale_level: listPopulation["upgrader"] == null ? true : listPopulation["upgrader"]["scale_level"],
					body: (listPopulation["upgrader"]["body"] || "worker"),
					name: null, args: {role: "worker", subrole: "upgrader", room: rmColony} });
		}
	},


	runCreeps: function (rmColony, listCreeps, listSpawnRoute) {
		let Roles = require("roles");

		_.each(listCreeps, creep => {
			creep.memory.listRoute = listSpawnRoute;

			if (creep.memory.role == "worker") {
				Roles.Worker(creep);
			}
			else if (creep.memory.role == "soldier") {
				Roles.Soldier(creep, false, true);
			}
        });
	},


	runTowers: function (rmColony) {
		let is_safe = (_.get(Memory, ["rooms", rmColony, "amount_hostiles"]) == 0);
		if (!is_safe && (_.get(Memory, ["rooms", rmColony, "towers", "target_attack"]) == null || Game.time % 10 == 0)) {
			let hostile = _.head(Game.rooms[rmColony].find(FIND_HOSTILE_CREEPS, { filter: function(c) {
				return Memory["allies"].indexOf(c.owner.username) < 0; }}));
			_.set(Memory, ["rooms", rmColony, "towers", "target_attack"], (hostile == null ? null : hostile.id));
		}

		let hostile_id = _.get(Memory, ["rooms", rmColony, "towers", "target_attack"]);
		if (hostile_id != null) {
			let hostile = Game.getObjectById(hostile_id);
			if (hostile == null) {
				_.set(Memory, ["rooms", rmColony, "towers", "target_attack"], null);
			} else {
				_.each(Game.rooms[rmColony].find(FIND_MY_STRUCTURES, 
						{ filter: (s) => { return s.structureType == STRUCTURE_TOWER; }}),
					t => { t.attack(hostile) });
				return;
			}
		}
		
		if (Game.time % 5 == 0 && _.get(Game, ["rooms", rmColony]) != null) {
			let injured = _.head(Game.rooms[rmColony].find(FIND_MY_CREEPS, { filter: function(c) { return c.hits < c.hitsMax; }}));
			_.set(Memory, ["rooms", rmColony, "towers", "target_heal"], (injured == null ? null :injured.id));
		}

		let injured_id = _.get(Memory, ["rooms", rmColony, "towers", "target_heal"]);
		if (injured_id != null) {
			let injured = Game.getObjectById(injured_id);
			if (injured == null || injured.hits == injured.hitsMax) {
				_.set(Memory, ["rooms", rmColony, "towers", "target_heal"], null);
			} else {
				_.each(Game.rooms[rmColony].find(FIND_MY_STRUCTURES, { filter: (s) => {
					return s.structureType == STRUCTURE_TOWER && s.energy > s.energyCapacity * 0.5; }}),
					t => { t.heal(injured) });
				return;
			}
		}
	},


	defineLinks: function(rmColony) {
		let link_defs = _.get(Memory, ["rooms", rmColony, "links"]);
		let room = Game.rooms[rmColony];
		let structures = room.find(FIND_MY_STRUCTURES);
		let links = _.filter(structures, s => { return s.structureType == "link"; });
		
		if (link_defs == null || link_defs < links.length) {
			link_defs = [];
			let sources = room.find(FIND_SOURCES);
			_.each(sources, source => { _.each(source.pos.findInRange(links, 2), link => {
				link_defs.push({id: link.id, dir: "send"});
			}); });

			_.each(_.filter(structures, s => { return s.structureType == "storage"; }), storage => {
				_.each(storage.pos.findInRange(links, 3), link => {
					link_defs.push({id: link.id, dir: "receive"});
				});
			});

			_.each(room.controller.pos.findInRange(links, 2), link => {
				link_defs.push({id: link.id, dir: "receive"});
			});
		}

		_.set(Memory, ["rooms", rmColony, "links"], link_defs);
	},

	runLinks: function (rmColony) {		
		let links = _.get(Memory, ["rooms", rmColony, "links"]);

		if (links != null) {
            let linksSend = _.filter(links, l => { return l["dir"] == "send"; });
            let linksReceive = _.filter(links, l => { return l["dir"] == "receive"; });

            _.each(linksReceive, r => {
				let receive = Game.getObjectById(r["id"]);
                _.each(linksSend, s => {
					if (receive != null) {
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
