require("populations");

let _CPU = require("util.cpu");
let Hive = require("hive");

module.exports = {

	Run: function(rmColony, rmHarvest) {
		_CPU.Start(rmColony, "Mining-init");

		// Local mining: ensure the room has a spawn or tower... rebuilding? Sacked? Unclaimed?
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
			
		// Remote mining: colony destroyed? Stop mining :(
		if (Game.rooms[rmColony] == null) {
			delete Memory.sites.mining.rmHarvest;
			return;
		}
		
		let listSpawnRooms = _.get(Memory, ["sites", "mining", rmHarvest, "spawn_assist", "rooms"]);
		let listRoute = _.get(Memory, ["sites", "mining", rmHarvest, "list_route"]);
		let hasKeepers = _.get(Memory, ["sites", "mining", rmHarvest, "has_keepers"], false);
		if (rmColony == rmHarvest 
				&& _.filter(_.get(Game, ["spawns"]), s => { return s.room.name == rmColony; }).length < 1) {
			listSpawnRooms = _.get(Memory, ["rooms", rmColony, "spawn_assist", "rooms"]);
			listRoute = _.get(Memory, ["rooms", rmColony, "spawn_assist", "list_route"]);
		}

		let listCreeps = _.filter(Game.creeps, c => c.memory.room == rmHarvest && c.memory.colony == rmColony);

		_CPU.End(rmColony, "Mining-init");

		_CPU.Start(rmColony, `Mining-${rmHarvest}-surveyRoom`);
		if (isPulse_Defense())
			this.surveyRoom(rmColony, rmHarvest);
		_CPU.End(rmColony, `Mining-${rmHarvest}-surveyRoom`);

		if (isPulse_Spawn()) {
			_CPU.Start(rmColony, `Mining-${rmHarvest}-runPopulation`);
			this.runPopulation(rmColony, rmHarvest, listCreeps, listSpawnRooms, hasKeepers);
			_CPU.End(rmColony, `Mining-${rmHarvest}-runPopulation`);
		}

		_CPU.Start(rmColony, `Mining-${rmHarvest}-runCreeps`);
		this.runCreeps(rmColony, rmHarvest, listCreeps, hasKeepers, listRoute);
		_CPU.End(rmColony, `Mining-${rmHarvest}-runCreeps`);

		_CPU.Start(rmColony, `Mining-${rmHarvest}-buildContainers`);
		this.buildContainers(rmColony, rmHarvest);
		_CPU.End(rmColony, `Mining-${rmHarvest}-buildContainers`);
	},

	surveyRoom: function(rmColony, rmHarvest) {
		let visible = _.keys(Game.rooms).includes(rmHarvest);
		_.set(Memory, ["sites", "mining", rmHarvest, "survey", "visible"], visible);
		_.set(Memory, ["sites", "mining", rmHarvest, "survey", "has_minerals"],
			visible ? Game.rooms[rmHarvest].find(FIND_MINERALS, {filter: (m) => { return m.mineralAmount > 0; }}).length > 0 : false);

		let hostiles = visible 
			? _.filter(Game.rooms[rmHarvest].find(FIND_HOSTILE_CREEPS), 
				c => { return c.isHostile() && c.owner.username != "Source Keeper"; })
			: new Array();
		
		let is_safe = !visible || rmColony == rmHarvest || hostiles.length == 0;
		_.set(Memory, ["rooms", rmHarvest, "defense", "is_safe"], is_safe);
		_.set(Memory, ["sites", "mining", rmHarvest, "defense", "is_safe"], is_safe);
		_.set(Memory, ["sites", "mining", rmHarvest, "defense", "hostiles"], hostiles);
	},

	runPopulation: function(rmColony, rmHarvest, listCreeps, listSpawnRooms, hasKeepers) {
		let room_level = Game["rooms"][rmColony].getLevel();
		let has_minerals = _.get(Memory, ["sites", "mining", rmHarvest, "survey", "has_minerals"]);
		let threat_level = _.get(Memory, ["rooms", rmColony, "defense", "threat_level"]);
		let is_safe = _.get(Memory, ["sites", "mining", rmHarvest, "defense", "is_safe"]);		
		let hostiles = _.get(Memory, ["sites", "mining", rmHarvest, "defense", "hostiles"], new Array());
		
		let is_safe_colony = _.get(Memory, ["rooms", rmColony, "defense", "is_safe"], true);
		let is_visible = _.get(Memory, ["sites", "mining", rmHarvest, "survey", "visible"], true);

		// If the colony is not safe (under siege?) pause spawning remote mining; frees colony spawns to make soldiers
		if (rmColony != rmHarvest && !is_safe_colony)
			return;

		// Is the room visible? If not, only spawn a scout to check the room out!
		if (rmColony != rmHarvest && !is_visible) {
			let lScout = _.filter(listCreeps, c => c.memory.role == "scout");

			if (lScout.length < 1) {
				Memory["hive"]["spawn_requests"].push({ room: rmColony, listRooms: listSpawnRooms, priority: 0, level: 1,
				scale: false, body: "scout", name: null, args: {role: "scout", room: rmHarvest, colony: rmColony} });
			}
			return;
		}

		let popActual = new Object(); 
		_.each(listCreeps, c => {
			switch(_.get(c, ["memory", "role"])) {
				default: break;
				case "paladin": popActual["paladin"] = _.get(popActual, "paladin", 0) + 1; break;
				case "soldier": popActual["soldier"] = _.get(popActual, "soldier", 0) + 1; break;
				case "healer": popActual["healer"] = _.get(popActual, "healer", 0) + 1; break;
				case "dredger": popActual["dredger"] = _.get(popActual, "dredger", 0) + 1; break;
				case "burrower": popActual["burrower"] = _.get(popActual, "burrower", 0) + ((c.ticksToLive == undefined || c.ticksToLive > 100) ? 1 : 0); break;
				case "carrier": popActual["carrier"] = _.get(popActual, "carrier", 0) + ((c.ticksToLive == undefined || c.ticksToLive > 50) ? 1 : 0); break;
				case "miner": popActual["miner"] = _.get(popActual, "miner", 0) + 1; break;
				case "multirole": popActual["multirole"] = _.get(popActual, "multirole", 0) + 1; break;
				case "reserver": popActual["reserver"] = _.get(popActual, "reserver", 0) + 1; break;
				case "extractor": popActual["extractor"] = _.get(popActual, "extractor", 0) + 1; break;				
			}
		});

		let popTarget = new Object();
		let custom_population = _.get(Memory, ["sites", "mining", rmHarvest, "custom_population"]);
		if (custom_population)
			popTarget = _.cloneDeep(custom_population);
		else {
			if (rmColony == rmHarvest)
				popTarget = _.cloneDeep(Population_Mining[`S${Game.rooms[rmHarvest].find(FIND_SOURCES).length}`][Math.max(1, room_level)]);
			else if (hasKeepers != true) {
				popTarget = (is_visible && _.get(Game, ["rooms", rmHarvest]) != null)
			        ? _.cloneDeep(Population_Mining[`R${Game.rooms[rmHarvest].find(FIND_SOURCES).length}`][Math.max(1, room_level)])
					: _.cloneDeep(Population_Mining["R1"][Math.max(1, room_level)]);
			} else if (hasKeepers == true)
				popTarget = _.cloneDeep(Population_Mining["SK"]);
		}
		
		// Remote mining: adjust soldier levels based on threat level
		if (rmHarvest != rmColony && threat_level != NONE && hasKeepers == false) {						
			if (threat_level == LOW || threat_level == null) {
				_.set(popTarget, ["soldier", "amount"], _.get(popTarget, ["soldier", "amount"], 0) + 1);
				if (is_safe)
					_.set(popTarget, ["soldier", "level"], Math.max(2, room_level - 2));
			} else if (threat_level == MEDIUM) {
				_.set(popTarget, ["soldier", "amount"], _.get(popTarget, ["soldier", "amount"], 0) + 2);
				_.set(popTarget, ["healer", "amount"], _.get(popTarget, ["healer", "amount"], 0) + 1);
				if (is_safe) {
					_.set(popTarget, ["soldier", "level"], Math.max(2, room_level - 1));
					_.set(popTarget, ["healer", "level"], Math.max(2, room_level - 1));
				}
			} else if (threat_level == HIGH) {
				_.set(popTarget, ["soldier", "amount"], _.get(popTarget, ["soldier", "amount"], 0) + 4);
				_.set(popTarget, ["healer", "amount"], _.get(popTarget, ["healer", "amount"], 0) + 1);
			}
		}

		// Tally population levels for level scaling
		Hive.populationTally(rmColony, 
			_.sum(popTarget, p => { return _.get(p, "amount", 0); }), 
			_.sum(popActual));

		// Grafana population stats
		let Grafana = require("util.grafana");
		Grafana.populationTally(rmColony, popTarget, popActual);

		if (_.get(popActual, "paladin", 0) < _.get(popTarget, ["paladin", "amount"], 0)) {
			Memory["hive"]["spawn_requests"].push({ room: rmColony, listRooms: listSpawnRooms, 
				priority: 14, 
				level: popTarget["paladin"]["level"],
				scale: _.get(popTarget, ["paladin", "scale"], true),
				body: "paladin", name: null, args: {role: "paladin", room: rmHarvest, colony: rmColony} });
		}
		
		if (_.get(popActual, "ranger", 0) < _.get(popTarget, ["ranger", "amount"], 0)) {
			Memory["hive"]["spawn_requests"].push({ room: rmColony, listRooms: listSpawnRooms, 
				priority: 14, 
				level: popTarget["ranger"]["level"],
				scale: _.get(popTarget, ["ranger", "scale"], true),
				body: "ranger", name: null, args: {role: "ranger", room: rmHarvest, colony: rmColony} });
		}

		if ((!hasKeepers && !is_safe && hostiles.length > _.get(popActual, "soldier", 0))
				|| (_.get(popActual, "soldier", 0) < _.get(popTarget, ["soldier", "amount"], 0))) {
			Memory["hive"]["spawn_requests"].push({ room: rmColony, listRooms: listSpawnRooms, 
				priority: (!is_safe ? 3 : 14),
				level: _.get(popTarget, ["soldier", "level"], room_level),
				scale: _.get(popTarget, ["soldier", "scale"], true),
				body: "soldier", name: null, args: {role: "soldier", room: rmHarvest, colony: rmColony} });
		}
		
		if (_.get(popActual, "healer", 0) < _.get(popTarget, ["healer", "amount"], 0)) {
			Memory["hive"]["spawn_requests"].push({ room: rmColony, listRooms: listSpawnRooms, 
				priority: (!is_safe ? 4 : 15), 
				level: popTarget["healer"]["level"],
				scale: _.get(popTarget, ["healer", "scale"], true),
				body: "healer", name: null, args: {role: "healer", room: rmHarvest, colony: rmColony} });
		}
		
		if (_.get(popActual, "multirole", 0) < _.get(popTarget, ["multirole", "amount"], 0)) {
			Memory["hive"]["spawn_requests"].push({ room: rmColony, listRooms: listSpawnRooms, 
				priority: 19, 
				level: popTarget["multirole"]["level"],
				scale: _.get(popTarget, ["multirole", "scale"], true),
				body: _.get(popTarget, ["multirole", "body"], "worker"),
				name: null, args: {role: "multirole", room: rmHarvest, colony: rmColony} });
        }
		
		if (is_safe) {			
			if (_.get(popActual, "burrower", 0) < _.get(popTarget, ["burrower", "amount"], 0)) {
				Memory["hive"]["spawn_requests"].push({ room: rmColony, listRooms: listSpawnRooms, 
					priority: (rmColony == rmHarvest ? 12 : 15), 
					level: _.get(popTarget, ["burrower", "level"], 1),
					scale: _.get(popTarget, ["burrower", "scale"], true),
					body: _.get(popTarget, ["burrower", "body"], "burrower"),
					name: null, args: {role: "burrower", room: rmHarvest, colony: rmColony} });
			}
			
			if (_.get(popActual, "carrier", 0) < _.get(popTarget, ["carrier", "amount"], 0)) {
				Memory["hive"]["spawn_requests"].push({ room: rmColony, listRooms: listSpawnRooms, 
					priority: (rmColony == rmHarvest ? 13 : 16), 
					level: _.get(popTarget, ["carrier", "level"], 1),
					scale: _.get(popTarget, ["carrier", "scale"], true),
					body: _.get(popTarget, ["carrier", "body"], "carrier"),
					name: null, args: {role: "carrier", room: rmHarvest, colony: rmColony} });
			}

			if (_.get(popActual, "miner", 0) < 2 // Population stalling? Energy defecit? Replenish with miner group
				&& (_.get(popActual, "burrower", 0) < _.get(popTarget, ["burrower", "amount"], 0)
					&& _.get(popActual, "carrier", 0) < _.get(popTarget, ["carrier", "amount"], 0))) {
				Memory["hive"]["spawn_requests"].push({ room: rmColony, listRooms: listSpawnRooms, 
					priority: (rmColony == rmHarvest ? 11 : 14), 
					level: Math.max(1, Game["rooms"][rmColony].getLevel_Available()),
					scale: true, body: "worker", 
					name: null, args: {role: "miner", room: rmHarvest, colony: rmColony, spawn_renew: false} });
			}

			if (_.get(popActual, "miner", 0) < _.get(popTarget, ["miner", "amount"], 0)) {
				Memory["hive"]["spawn_requests"].push({ room: rmColony, listRooms: listSpawnRooms, 
					priority: (rmColony == rmHarvest ? 12 : 15), 
					level: _.get(popTarget, ["miner", "level"], 1),
					scale: _.get(popTarget, ["miner", "scale"], true),
					body: _.get(popTarget, ["miner", "body"], "worker"),
					name: null, args: {role: "miner", room: rmHarvest, colony: rmColony} });
			}
			
			if (_.get(popActual, "dredger", 0) < _.get(popTarget, ["dredger", "amount"], 0)) {
				Memory["hive"]["spawn_requests"].push({ room: rmColony, listRooms: listSpawnRooms, 
					priority: 19,
					level: _.get(popTarget, ["dredger", "level"], 1),
					scale: _.get(popTarget, ["dredger", "scale"], true), 
					body: _.get(popTarget, ["dredger", "body"], "dredger"),
					name: null, args: {role: "dredger", room: rmHarvest, colony: rmColony} });
			}

			if (_.get(popActual, "reserver", 0) < _.get(popTarget, ["reserver", "amount"], 0)
					&& Game.rooms[rmHarvest] != null && Game.rooms[rmHarvest].controller != null
					&& (Game.rooms[rmHarvest].controller.reservation == null || Game.rooms[rmHarvest].controller.reservation.ticksToEnd < 2000)) {
				Memory["hive"]["spawn_requests"].push({ room: rmColony, listRooms: listSpawnRooms, 
					priority: 17, 
					level: _.get(popTarget, ["reserver", "level"], 1),
					scale: _.get(popTarget, ["reserver", "scale"], true),
					body: _.get(popTarget, ["reserver", "body"], "reserver"),
					name: null, args: {role: "reserver", room: rmHarvest, colony: rmColony} });
			}
			
			let pause_extraction = _.get(Memory, ["hive", "pause", "extracting"], false);
			if (has_minerals && !pause_extraction 
					&& _.get(popActual, "extractor", 0) < _.get(popTarget, ["extractor", "amount"], 0)
					&& _.get(popActual, "extractor", 0) < _.sum(_.get(Memory, ["rooms", rmHarvest, "minerals"]), p => { return _.get(p, "access_tiles", 2); })) {
				Memory["hive"]["spawn_requests"].push({ room: rmColony, listRooms: listSpawnRooms, 
					priority: 18, 
					level: _.get(popTarget, ["extractor", "level"], 1),
					scale: _.get(popTarget, ["extractor", "scale"], true),
					body: _.get(popTarget, ["extractor", "body"], "extractor"),
					name: null, args: {role: "extractor", room: rmHarvest, colony: rmColony} });
			}
		}
	},

	runCreeps: function(rmColony, rmHarvest, listCreeps, hasKeepers, listRoute) {
		let Roles = require("roles");
		let is_safe = _.get(Memory, ["sites", "mining", rmHarvest, "defense", "is_safe"]);

        _.each(listCreeps, creep => {
			_.set(creep, ["memory", "list_route"], listRoute);

			switch (_.get(creep, ["memory", "role"])) {
				case "scout": 		Roles.Scout(creep);					break;
				case "extractor": 	Roles.Extractor(creep, is_safe);	break;
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

				case "ranger":
					Roles.Archer(creep, false, true);
					break;
				
				case "multirole":
					if (hasKeepers || is_safe)
						Roles.Worker(creep, is_safe);
					else
						Roles.Soldier(creep, false, true);
					break;
			}
        });
	},

	buildContainers: function(rmColony, rmHarvest) {
		hasKeepers = _.get(Memory, ["sites", "mining", rmHarvest, "has_keepers"], false);
		if (Game.time % 1500 != 0 || rmColony == rmHarvest || hasKeepers)
			return;		// Blueprint builds containers in colony rooms

		let room = Game["rooms"][rmHarvest];
		if (room == null)
			return;

		let sources = room.find(FIND_SOURCES);
		let containers = _.filter(room.find(FIND_STRUCTURES), s => { return s.structureType == "container"; });				
		_.each(sources, source => {
			if (source.pos.findInRange(containers, 1).length < 2) {
				let adj = source.pos.getBuildableTile_Adjacent();
				if (adj != null && adj.createConstructionSite("container") == OK)
					console.log(`<font color=\"#6065FF\">[Mining]</font> ${room.name} placing container at (${adj.x}, ${adj.y})`);					
			}
		});
	}
};
