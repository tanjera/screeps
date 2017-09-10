require("populations");

let _CPU = require("util.cpu");
let Hive = require("hive");

module.exports = {

	Run: function(rmColony, rmHarvest) {
		_CPU.Start(rmColony, "Mining-init");

		// Ensure the room has a spawn or tower... rebuilding? Sacked? Unclaimed?
		if (rmColony == rmHarvest) {
			if (_.get(Game, ["rooms", rmColony, "controller", "my"]) != true) {
				delete Memory.sites.mining.rmHarvest;
				return;
			}
			
			if (_.filter(_.get(Game, ["spawns"]), s => { return s.room.name == rmColony; }).length < 1
					&& _.get(Memory, ["rooms", rmColony, "focus_defense"]) != true)
				return;

			if (_.get(Memory, ["rooms", rmColony, "focus_defense"]) == true
					&& _.get(Game, ["rooms", rmColony, "controller", "level"]) < 3)
				return;
		}
			
		if (Game.rooms[rmColony] == null && Game.time % 10 == 0) {
			console.log(`Attempt at remote mining failed, ${rmColony} not found in Game.rooms; colony destroyed?`);
			return;
		}
		
		listSpawnRooms = _.get(Memory, ["sites", "mining", rmHarvest, "spawn_assist", "rooms"]);
		listRoute = _.get(Memory, ["sites", "mining", rmHarvest, "route"]);
		listPopulation = _.get(Memory, ["sites", "mining", rmHarvest, "custom_population"]);
		hasKeepers = _.get(Memory, ["sites", "mining", rmHarvest, "has_keepers"], false);

		if (rmColony == rmHarvest 
				&& _.filter(_.get(Game, ["spawns"]), s => { return s.room.name == rmColony; }).length < 1) {
			listSpawnRooms = _.get(Memory, ["rooms", rmColony, "spawn_assist", "rooms"]);
			listRoute = _.get(Memory, ["rooms", rmColony, "spawn_assist", "route"]);
		}

		_CPU.End(rmColony, "Mining-init");

		_CPU.Start(rmColony, `Mining-${rmHarvest}-listCreeps`);
		let listCreeps = _.filter(Game.creeps, c => c.memory.room == rmHarvest && c.memory.colony == rmColony);
		_CPU.End(rmColony, `Mining-${rmHarvest}-listCreeps`);

		_CPU.Start(rmColony, `Mining-${rmHarvest}-surveyRoom`);
		if (Game.time % 3 == 0 || Game.time % 100 == 0)
			this.surveyRoom(rmColony, rmHarvest);
		_CPU.End(rmColony, `Mining-${rmHarvest}-surveyRoom`);

		if (isPulse_Spawn()) {
			_CPU.Start(rmColony, `Mining-${rmHarvest}-runPopulation`);
			this.runPopulation(rmColony, rmHarvest, listCreeps, listSpawnRooms, hasKeepers, listPopulation);
			_CPU.End(rmColony, `Mining-${rmHarvest}-runPopulation`);
		}

		_CPU.Start(rmColony, `Mining-${rmHarvest}-runCreeps`);
		this.runCreeps(rmColony, rmHarvest, listCreeps, hasKeepers, listRoute);
		_CPU.End(rmColony, `Mining-${rmHarvest}-runCreeps`);
	},

	surveyRoom: function(rmColony, rmHarvest) {
		let visible = _.keys(Game.rooms).includes(rmHarvest);
		_.set(Memory, ["sites", "mining", rmHarvest, "visible"], visible);
		_.set(Memory, ["sites", "mining", rmHarvest, "has_minerals"],
			visible ? Game.rooms[rmHarvest].find(FIND_MINERALS, {filter: (m) => { return m.mineralAmount > 0; }}).length > 0 : false);

		let amountHostiles = visible
			? Game.rooms[rmHarvest].find(FIND_HOSTILE_CREEPS, { filter: (c) => { return c.isHostile(); }}).length : 0;
		let is_safe = !visible || rmColony == rmHarvest || amountHostiles == 0;
		_.set(Memory, ["sites", "mining", rmHarvest, "is_safe"], is_safe);
		_.set(Memory, ["sites", "mining", rmHarvest, "amount_hostiles"], amountHostiles);

		if (visible && rmColony != rmHarvest && Game.time % 100 == 0) {
			// Record amount of dropped energy available (for adjusting carrier amounts)
			if (_.get(Memory, ["sites", "mining", rmHarvest, "energy_amounts"]) == null)
				_.set(Memory, ["sites", "mining", rmHarvest, "energy_amounts"], new Array());
			
			_.get(Memory, ["sites", "mining", rmHarvest, "energy_amounts"]).push( 
				{ tick: Game.time, amount: _.sum(_.filter(Game["rooms"][rmHarvest].find(FIND_DROPPED_RESOURCES), 
					res => { return res.resourceType == "energy"; }),
					res => { return res.amount; }) });
		}
	},

	runPopulation: function(rmColony, rmHarvest, listCreeps, listSpawnRooms, hasKeepers, listPopulation) {
		let hasMinerals = _.get(Memory, ["sites", "mining", rmHarvest, "has_minerals"]);
		let is_safe = _.get(Memory, ["sites", "mining", rmHarvest, "is_safe"]);
		let is_safe_colony = _.get(Memory, ["rooms", rmColony, "is_safe"]);
		let is_visible = _.get(Memory, ["sites", "mining", rmHarvest, "visible"]);
		let amountHostiles = _.get(Memory, ["sites", "mining", rmHarvest, "amount_hostiles"]);

		// If the colony is not safe (under siege?) pause spawning remote mining; frees colony spawns to make soldiers
		if (rmColony != rmHarvest && !is_safe_colony)
			return;

		// Is the room visible? If not, only spawn a scout to check the room out!
		if (rmColony != rmHarvest && !is_visible && !hasKeepers) {
			let lScout = _.filter(listCreeps, c => c.memory.role == "scout");

			if (lScout.length < 1) {
				Memory["hive"]["spawn_requests"].push({ room: rmColony, listRooms: listSpawnRooms, priority: 0, level: 1,
				scale_level: false, body: "scout", name: null, args: {role: "scout", room: rmHarvest, colony: rmColony} });
			}
			return;
		}

		let lPaladin = _.filter(listCreeps, c => c.memory.role == "paladin" && (c.ticksToLive == undefined || c.ticksToLive > 200));
		let lSoldier = _.filter(listCreeps, c => c.memory.role == "soldier" && (c.ticksToLive == undefined || c.ticksToLive > 200));
		let lHealer = _.filter(listCreeps, c => c.memory.role == "healer" && (c.ticksToLive == undefined || c.ticksToLive > 100));
		let lDredger = _.filter(listCreeps, c => c.memory.role == "dredger" && (c.ticksToLive == undefined || c.ticksToLive > 100));
		let lBurrower = _.filter(listCreeps, c => c.memory.role == "burrower" && (c.ticksToLive == undefined || c.ticksToLive > 160));
        let lCarrier = _.filter(listCreeps, c => c.memory.role == "carrier" && (c.ticksToLive == undefined || c.ticksToLive > 160));
        let lMiner = _.filter(listCreeps, c => c.memory.role == "miner" && (c.ticksToLive == undefined || c.ticksToLive > 160));
        let lMultirole = _.filter(listCreeps, c => c.memory.role == "multirole" && (c.ticksToLive == undefined || c.ticksToLive > 160));
        let lReserver = _.filter(listCreeps, c => c.memory.role == "reserver");
		let lExtractor = _.filter(listCreeps, c => c.memory.role == "extractor");

		if (listPopulation == null) {
			if (rmColony == rmHarvest)
				listPopulation = Population_Mining[`S${Game.rooms[rmHarvest].find(FIND_SOURCES).length}`][Game.rooms[rmColony].controller.level];
			else if (hasKeepers != true) {
				listPopulation = (is_visible && _.get(Game, ["rooms", rmHarvest]) != null)
			        ? Population_Mining[`R${Game.rooms[rmHarvest].find(FIND_SOURCES).length}`][Game.rooms[rmColony].controller.level]
					: Population_Mining["R1"][Game.rooms[rmColony].controller.level];
			} else if (hasKeepers == true)
				listPopulation = Population_Mining["SK"];
		}

		// If remote mining, adjust carrier amount according to average amount of dropped energy over last 1500 ticks
		let addCarrier = 0;
		if (rmHarvest != rmColony && _.get(listPopulation, ["carrier"]) != null
				&& _.get(Memory, ["sites", "mining", rmHarvest, "energy_amounts"]) != null) {
			let amount = 0;
			let array = _.get(Memory, ["sites", "mining", rmHarvest, "energy_amounts"]);

			for (let i = array.length - 1; i >= 0; i--) {
				if (_.get(array[i], "tick") < Game.time - 1500)
					Memory["sites"]["mining"][rmHarvest]["energy_amounts"].splice(i, 1);
				else
					amount += _.get(array[i], "amount");
			}
			
			let _Body = require("body");
			let dropped = Math.floor(amount / Memory["sites"]["mining"][rmHarvest]["energy_amounts"].length);
			let body = _Body.getBody((listPopulation["carrier"]["body"] || "carrier"), listPopulation["carrier"]["level"]);
			let cost = _Body.getBodyCost(body);
			
			if (cost < dropped) {				
				let round = Math.round(dropped / (cost * 5))
				addCarrier = round > 0 ? round : 1;
			}
		}

		let popTarget = _.sum(listPopulation, p => { return _.get(p, "amount"); });
		let popActual = lPaladin.length + lHealer.length + lDredger.length + lBurrower.length + lCarrier.length 
			+ lMiner.length + lMultirole.length + lReserver.length + lExtractor.length;
        Hive.populationTally(rmColony, popTarget, popActual);

		if (listPopulation["paladin"] != null && lPaladin.length < listPopulation["paladin"]["amount"]) {
			Memory["hive"]["spawn_requests"].push({ room: rmColony, listRooms: listSpawnRooms, priority: 0, level: listPopulation["paladin"]["level"],
				scale_level: listPopulation["paladin"] == null ? true : listPopulation["paladin"]["scale_level"],
				body: "paladin", name: null, args: {role: "paladin", room: rmHarvest, colony: rmColony} });
		}
		else if ((!hasKeepers && !is_safe && amountHostiles > lSoldier.length + lMultirole.length)
				|| (listPopulation["soldier"] != null && lSoldier.length < listPopulation["soldier"]["amount"])) {
			Memory["hive"]["spawn_requests"].push({ room: rmColony, listRooms: listSpawnRooms, priority: 0,
				level: listPopulation["soldier"] == null ? 8 : listPopulation["soldier"]["level"],
				scale_level: listPopulation["soldier"] == null ? true : listPopulation["soldier"]["scale_level"],
				body: "soldier", name: null, args: {role: "soldier", room: rmHarvest, colony: rmColony} });
		}
		else if (listPopulation["healer"] != null && lHealer.length < listPopulation["healer"]["amount"]) {
			Memory["hive"]["spawn_requests"].push({ room: rmColony, listRooms: listSpawnRooms, priority: 1, level: listPopulation["healer"]["level"],
					scale_level: listPopulation["healer"] == null ? true : listPopulation["healer"]["scale_level"],
					body: "healer", name: null, args: {role: "healer", room: rmHarvest, colony: rmColony} });
		}
		else if (listPopulation["multirole"] != null && lMultirole.length < listPopulation["multirole"]["amount"]) {
            Memory["hive"]["spawn_requests"].push({ room: rmColony, listRooms: listSpawnRooms, priority: 2, level: listPopulation["multirole"]["level"],
				scale_level: listPopulation["multirole"] == null ? true : listPopulation["multirole"]["scale_level"],
				body: (listPopulation["multirole"]["body"] || (hasKeepers == false ? "multirole" : "worker")),
				name: null, args: {role: "multirole", room: rmHarvest, colony: rmColony} });
        }
		else if (is_safe) {
			if (listPopulation["miner"] != null && lMiner.length < listPopulation["miner"]["amount"]) {
				Memory["hive"]["spawn_requests"].push({ room: rmColony, listRooms: listSpawnRooms, priority: 2, level: listPopulation["miner"]["level"],
					scale_level: listPopulation["miner"] == null ? true : listPopulation["miner"]["scale_level"],
					body: "worker", name: null, args: {role: "miner", room: rmHarvest, colony: rmColony} });
			}
			else if (listPopulation["dredger"] != null && lDredger.length < listPopulation["dredger"]["amount"]) {
				Memory["hive"]["spawn_requests"].push({ room: rmColony, listRooms: listSpawnRooms, priority: 1, level: listPopulation["dredger"]["level"],
					scale_level: false, body: "dredger", name: null, args: {role: "dredger", room: rmHarvest, colony: rmColony} });
			}
			else if (listPopulation["burrower"] != null && lBurrower.length < listPopulation["burrower"]["amount"]) {
				if (listPopulation["carrier"] != null && lCarrier.length < listPopulation["carrier"]["amount"] && lMiner.length == 0) { 
					// Possibly colony wiped? Need restart?
					Memory["hive"]["spawn_requests"].push({ room: rmColony, listRooms: listSpawnRooms, priority: 1, level: 1,
						scale_level: true, body: "worker", name: null, args: {role: "miner", room: rmHarvest, colony: rmColony} });
				} else {
					Memory["hive"]["spawn_requests"].push({ room: rmColony, listRooms: listSpawnRooms, priority: 2, level: listPopulation["burrower"]["level"],
						scale_level: listPopulation["burrower"] == null ? true : listPopulation["burrower"]["scale_level"],
						body: (listPopulation["burrower"]["body"] || "burrower"),
						name: null, args: {role: "burrower", room: rmHarvest, colony: rmColony} });
				}
			}
			else if (listPopulation["carrier"] != null && lCarrier.length < listPopulation["carrier"]["amount"] + addCarrier) {
				Memory["hive"]["spawn_requests"].push({ room: rmColony, listRooms: listSpawnRooms, priority: 2, level: listPopulation["carrier"]["level"],
					scale_level: listPopulation["carrier"] == null ? true : listPopulation["carrier"]["scale_level"],
					body: (listPopulation["carrier"]["body"] || "carrier"),
					name: null, args: {role: "carrier", room: rmHarvest, colony: rmColony} });
			}
			
			else if (listPopulation["reserver"] != null && lReserver.length < listPopulation["reserver"]["amount"]
						&& Game.rooms[rmHarvest] != null && Game.rooms[rmHarvest].controller != null
						&& (Game.rooms[rmHarvest].controller.reservation == null || Game.rooms[rmHarvest].controller.reservation.ticksToEnd < 2000)) {
				Memory["hive"]["spawn_requests"].push({ room: rmColony, listRooms: listSpawnRooms, priority: 2, level: listPopulation["reserver"]["level"],
					scale_level: listPopulation["reserver"] == null ? true : listPopulation["reserver"]["scale_level"],
					body: (listPopulation["reserver"]["body"] || "reserver"),
					name: null, args: {role: "reserver", room: rmHarvest, colony: rmColony} });
			}
			else if (listPopulation["extractor"] != null && lExtractor.length < listPopulation["extractor"]["amount"] && hasMinerals) {
				Memory["hive"]["spawn_requests"].push({ room: rmColony, listRooms: listSpawnRooms, priority: 4, level: listPopulation["extractor"]["level"],
					scale_level: listPopulation["extractor"] == null ? true : listPopulation["extractor"]["scale_level"],
					body: (listPopulation["extractor"]["body"] || "extractor"),
					name: null, args: {role: "extractor", room: rmHarvest, colony: rmColony} });
			}
		}
	},

	runCreeps: function(rmColony, rmHarvest, listCreeps, hasKeepers, listRoute) {
		let Roles = require("roles");
		let is_safe = _.get(Memory, ["sites", "mining", rmHarvest, "is_safe"]);

        _.each(listCreeps, creep => {
			creep.memory.listRoute = listRoute;

			switch (creep.memory.role) {
				case "scout": 		Roles.Scout(creep);					break;
				case "extractor": 	Roles.Extracter(creep, is_safe);	break;
				case "reserver": 	Roles.Reserver(creep);				break;
				case "healer": 		Roles.Healer(creep, true);			break;
				
				case "miner": case "burrower": case "carrier":
					Roles.Mining(creep, is_safe);
					break;
				
				case "dredger":
					Roles.Dredger(creep);
					break;

				case "soldier": case "paladin":
					Roles.Soldier(creep, false, true);
					break;
				
				case "multirole":
					if (hasKeepers || is_safe)
						Roles.Worker(creep, is_safe);
					else
						Roles.Soldier(creep, false, true);
					break;
			}
        });
	}
};
