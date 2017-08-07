require("populations");

let _CPU = require("util.cpu");
let Hive = require("hive");

module.exports = {

	Run: function(rmColony, rmHarvest, listSpawnRooms, hasKeepers, listPopulation, listSpawnRoute) {

		_CPU.Start(rmColony, "Mining-init");
		if (listSpawnRooms == null) {
			listSpawnRooms = rmColony == rmHarvest
				? _.get(Memory, ["rooms", rmColony, "spawn_assist", "rooms"])
				: _.get(Memory, ["remote_mining", rmHarvest, "spawn_assist", "rooms"]);
		}
		if (listSpawnRoute == null) {
			listSpawnRoute = rmColony == rmHarvest
				? listSpawnRoute = _.get(Memory, ["rooms", rmColony, "spawn_assist", "route"])
				: _.get(Memory, ["remote_mining", rmHarvest, "spawn_assist", "route"]);
		}
		if (listPopulation == null) {
			listPopulation = rmColony == rmHarvest
				? _.get(Memory, ["rooms", rmColony, "custom_population"])
				: _.get(Memory, ["remote_mining", rmHarvest, "custom_population"]);
		}
		if (hasKeepers == null) {
			hasKeepers = rmColony == rmHarvest 
				? (_.get(Memory, ["rooms", rmColony, "has_keepers"]) == true ? true : false)
				: (_.get(Memory, ["remote_mining", rmHarvest, "has_keepers"]) == true ? true : false);
		}
		_CPU.End(rmColony, "Mining-init");

		_CPU.Start(rmColony, `Mining-${rmHarvest}-listCreeps`);
		let listCreeps = _.filter(Game.creeps, c => c.memory.room == rmHarvest && c.memory.colony == rmColony);
		_CPU.End(rmColony, `Mining-${rmHarvest}-listCreeps`);

		_CPU.Start(rmColony, `Mining-${rmHarvest}-surveyRoom`);
		if (Game.time % 3 == 0)
			this.surveyRoom(rmColony, rmHarvest);
		_CPU.End(rmColony, `Mining-${rmHarvest}-surveyRoom`);

		if (Hive.isPulse_Spawn()) {
			_CPU.Start(rmColony, `Mining-${rmHarvest}-runPopulation`);
			this.runPopulation(rmColony, rmHarvest, listCreeps, listSpawnRooms, hasKeepers, listPopulation);
			_CPU.End(rmColony, `Mining-${rmHarvest}-runPopulation`);
		}

		_CPU.Start(rmColony, `Mining-${rmHarvest}-runCreeps`);
		this.runCreeps(rmColony, rmHarvest, listCreeps, hasKeepers, listSpawnRoute);
		_CPU.End(rmColony, `Mining-${rmHarvest}-runCreeps`);
	},

	surveyRoom: function(rmColony, rmHarvest) {
		let visible = _.keys(Game.rooms).includes(rmHarvest);
		_.set(Memory, ["rooms", rmColony, `mining_${rmHarvest}`, "visible"], visible);
		_.set(Memory, ["rooms", rmColony, `mining_${rmHarvest}`, "has_minerals"],
			visible ? Game.rooms[rmHarvest].find(FIND_MINERALS, {filter: (m) => { return m.mineralAmount > 0; }}).length > 0 : false);

		let amountHostiles = visible
			? Game.rooms[rmHarvest].find(FIND_HOSTILE_CREEPS, { filter: (c) => { return Memory["allies"].indexOf(c.owner.username) < 0; }}).length : 0;
		let isSafe = !visible || rmColony == rmHarvest || amountHostiles == 0;
		_.set(Memory, ["rooms", rmColony, `mining_${rmHarvest}`, "is_safe"], isSafe);
		_.set(Memory, ["rooms", rmColony, `mining_${rmHarvest}`, "amount_hostiles"], amountHostiles);
	},

	runPopulation: function(rmColony, rmHarvest, listCreeps, listSpawnRooms, hasKeepers, listPopulation) {
		let hasMinerals = _.get(Memory, ["rooms", rmColony, `mining_${rmHarvest}`, "has_minerals"]);
		let isSafe = _.get(Memory, ["rooms", rmColony, `mining_${rmHarvest}`, "is_safe"]);
		let isVisible = _.get(Memory, ["rooms", rmColony, `mining_${rmHarvest}`, "visible"]);
		let amountHostiles = _.get(Memory, ["rooms", rmColony, `mining_${rmHarvest}`, "amount_hostiles"]);

		let lPaladin = _.filter(listCreeps, c => c.memory.role == "paladin" && (c.ticksToLive == undefined || c.ticksToLive > 200));
		let lSoldier = _.filter(listCreeps, c => c.memory.role == "soldier" && (c.ticksToLive == undefined || c.ticksToLive > 200));
		let lHealer = _.filter(listCreeps, c => c.memory.role == "healer" && (c.ticksToLive == undefined || c.ticksToLive > 100));
		let lBurrower = _.filter(listCreeps, c => c.memory.role == "burrower" && (c.ticksToLive == undefined || c.ticksToLive > 160));
        let lCarrier = _.filter(listCreeps, c => c.memory.role == "carrier" && (c.ticksToLive == undefined || c.ticksToLive > 160));
        let lMiner = _.filter(listCreeps, c => c.memory.role == "miner" && (c.ticksToLive == undefined || c.ticksToLive > 160));
        let lMultirole = _.filter(listCreeps, c => c.memory.role == "multirole" && (c.ticksToLive == undefined || c.ticksToLive > 160));
        let lReserver = _.filter(listCreeps, c => c.memory.role == "reserver" && c.memory.room == rmHarvest);
        let lExtractor = _.filter(listCreeps, c => c.memory.role == "extractor" && c.memory.room == rmHarvest);

		if (listPopulation == null) {
			if (rmColony == rmHarvest)
				listPopulation = Population_Mining[`S${Game.rooms[rmHarvest].find(FIND_SOURCES).length}`][Game.rooms[rmColony].controller.level];
			else
			    listPopulation = isVisible
			        ? Population_Mining[`R${Game.rooms[rmHarvest].find(FIND_SOURCES).length}`][Game.rooms[rmColony].controller.level]
			        : Population_Mining["R1"][Game.rooms[rmColony].controller.level];
		}

        let popTarget =
              (listPopulation["paladin"] == null ? 0 : listPopulation["paladin"]["amount"])
			+ (listPopulation["healer"] == null ? 0 : listPopulation["healer"]["amount"])
			+ (listPopulation["burrower"] == null ? 0 : listPopulation["burrower"]["amount"])
            + (listPopulation["carrier"] == null ? 0 : listPopulation["carrier"]["amount"])
            + (listPopulation["miner"] == null ? 0 : listPopulation["miner"]["amount"])
            + (listPopulation["multirole"] == null ? 0 : listPopulation["multirole"]["amount"])
            + (listPopulation["reserver"] == null ? 0 : listPopulation["reserver"]["amount"])
            + (listPopulation["extractor"] == null || !hasMinerals ? 0 : listPopulation["extractor"]["amount"]);

        let popActual = lPaladin.length + lHealer.length + lBurrower.length + lCarrier.length + lMiner.length + lMultirole.length + lReserver.length + lExtractor.length;
        Hive.populationTally(rmColony, popTarget, popActual);

        if (listPopulation["paladin"] != null && lPaladin.length < listPopulation["paladin"]["amount"]) {
			Memory["spawn_requests"].push({ room: rmColony, listRooms: listSpawnRooms, priority: 0, level: listPopulation["paladin"]["level"],
				scale_level: listPopulation["paladin"] == null ? true : listPopulation["paladin"]["scale_level"],
				body: "paladin", name: null, args: {role: "paladin", room: rmHarvest, colony: rmColony} });
		}
		else if ((!hasKeepers && !isSafe && amountHostiles > lSoldier.length + lMultirole.length)
				|| (listPopulation["soldier"] != null && lSoldier.length < listPopulation["soldier"]["amount"])) {
			Memory["spawn_requests"].push({ room: rmColony, listRooms: listSpawnRooms, priority: 0,
				level: listPopulation["soldier"] == null ? 8 : listPopulation["soldier"]["level"],
				scale_level: listPopulation["soldier"] == null ? true : listPopulation["soldier"]["scale_level"],
				body: "soldier", name: null, args: {role: "soldier", room: rmHarvest, colony: rmColony} });
		}
		else if (listPopulation["healer"] != null && lHealer.length < listPopulation["healer"]["amount"]) {
			Memory["spawn_requests"].push({ room: rmColony, listRooms: listSpawnRooms, priority: 1, level: listPopulation["healer"]["level"],
					scale_level: listPopulation["healer"] == null ? true : listPopulation["healer"]["scale_level"],
					body: "healer", name: null, args: {role: "healer", room: rmHarvest, colony: rmColony} });
        }
        else if (listPopulation["miner"] != null && lMiner.length < listPopulation["miner"]["amount"]) {
            if (lMiner.length == 0) { 
				// Possibly colony wiped? Need restart?
				Memory["spawn_requests"].push({ room: rmColony, listRooms: listSpawnRooms, priority: 1, level: 1,
					scale_level: true, body: "worker", name: null, args: {role: "miner", room: rmHarvest, colony: rmColony} });
			} else {
				Memory["spawn_requests"].push({ room: rmColony, listRooms: listSpawnRooms, priority: 1, level: listPopulation["miner"]["level"],
					scale_level: listPopulation["miner"] == null ? true : listPopulation["miner"]["scale_level"],
					body: "worker", name: null, args: {role: "miner", room: rmHarvest, colony: rmColony} });
            }
        }
        else if (listPopulation["burrower"] != null && lBurrower.length < listPopulation["burrower"]["amount"]) {
            if (listPopulation["carrier"] != null && lCarrier.length < listPopulation["carrier"]["amount"] && lMiner.length == 0) { 
				// Possibly colony wiped? Need restart?
				Memory["spawn_requests"].push({ room: rmColony, listRooms: listSpawnRooms, priority: 1, level: 1,
					scale_level: true, body: "worker", name: null, args: {role: "miner", room: rmHarvest, colony: rmColony} });
            } else {
				Memory["spawn_requests"].push({ room: rmColony, listRooms: listSpawnRooms, priority: 1, level: listPopulation["burrower"]["level"],
					scale_level: listPopulation["burrower"] == null ? true : listPopulation["burrower"]["scale_level"],
					body: (listPopulation["burrower"]["body"] || "burrower"),
					name: null, args: {role: "burrower", room: rmHarvest, colony: rmColony} });
            }
        }
        else if (listPopulation["carrier"] != null && lCarrier.length < listPopulation["carrier"]["amount"]) {
			Memory["spawn_requests"].push({ room: rmColony, listRooms: listSpawnRooms, priority: 1, level: listPopulation["carrier"]["level"],
				scale_level: listPopulation["carrier"] == null ? true : listPopulation["carrier"]["scale_level"],
				body: (listPopulation["carrier"]["body"] || "carrier"),
				name: null, args: {role: "carrier", room: rmHarvest, colony: rmColony} });
        }
        else if (listPopulation["multirole"] != null && lMultirole.length < listPopulation["multirole"]["amount"]) {
            Memory["spawn_requests"].push({ room: rmColony, listRooms: listSpawnRooms, priority: 2, level: listPopulation["multirole"]["level"],
				scale_level: listPopulation["multirole"] == null ? true : listPopulation["multirole"]["scale_level"],
				body: (listPopulation["multirole"]["body"] || (hasKeepers == false ? "multirole" : "worker")),
				name: null, args: {role: "multirole", room: rmHarvest, colony: rmColony} });
        }
        else if (listPopulation["reserver"] != null && lReserver.length < listPopulation["reserver"]["amount"]
                    && Game.rooms[rmHarvest] != null && Game.rooms[rmHarvest].controller != null
                    && (Game.rooms[rmHarvest].controller.reservation == null || Game.rooms[rmHarvest].controller.reservation.ticksToEnd < 2000)) {
			Memory["spawn_requests"].push({ room: rmColony, listRooms: listSpawnRooms, priority: 2, level: listPopulation["reserver"]["level"],
				scale_level: listPopulation["reserver"] == null ? true : listPopulation["reserver"]["scale_level"],
				body: (listPopulation["reserver"]["body"] || "reserver"),
				name: null, args: {role: "reserver", room: rmHarvest, colony: rmColony} });
        }
        else if (listPopulation["extractor"] != null && lExtractor.length < listPopulation["extractor"]["amount"] && hasMinerals) {
			Memory["spawn_requests"].push({ room: rmColony, listRooms: listSpawnRooms, priority: 2, level: listPopulation["extractor"]["level"],
				scale_level: listPopulation["extractor"] == null ? true : listPopulation["extractor"]["scale_level"],
				body: (listPopulation["extractor"]["body"] || "extractor"),
				name: null, args: {role: "extractor", room: rmHarvest, colony: rmColony} });
        }
	},

	runCreeps: function(rmColony, rmHarvest, listCreeps, hasKeepers, listSpawnRoute) {
		let Roles = require("roles");

		let isSafe = _.get(Memory, ["rooms", rmColony, `mining_${rmHarvest}`, "is_safe"]);

        _.each(listCreeps, creep => {
			creep.memory.listRoute = listSpawnRoute;

			if (creep.memory.role == "miner" || creep.memory.role == "burrower" || creep.memory.role == "carrier") {
				Roles.Mining(creep, isSafe);
			} else if (creep.memory.role == "extractor") {
				Roles.Extracter(creep, isSafe);
			} else if (creep.memory.role == "reserver") {
				Roles.Reserver(creep);
			} else if (creep.memory.role == "soldier" || creep.memory.role == "paladin") {
				Roles.Soldier(creep, false, true);
			} else if (creep.memory.role == "healer") {
				Roles.Healer(creep);
			} else if (creep.memory.role == "multirole") {
				if (hasKeepers || isSafe)
					Roles.Worker(creep, isSafe);
				else
					Roles.Soldier(creep, false, true);
			}
        });
	}
};
