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
		
		listSpawnRooms = _.get(Memory, ["sites", "mining", rmHarvest, "spawn_assist", "rooms"]);
		listRoute = _.get(Memory, ["sites", "mining", rmHarvest, "list_route"]);
		popTarget = _.get(Memory, ["sites", "mining", rmHarvest, "custom_population"]);
		hasKeepers = _.get(Memory, ["sites", "mining", rmHarvest, "has_keepers"], false);

		if (rmColony == rmHarvest 
				&& _.filter(_.get(Game, ["spawns"]), s => { return s.room.name == rmColony; }).length < 1) {
			listSpawnRooms = _.get(Memory, ["rooms", rmColony, "spawn_assist", "rooms"]);
			listRoute = _.get(Memory, ["rooms", rmColony, "spawn_assist", "list_route"]);
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
			this.runPopulation(rmColony, rmHarvest, listCreeps, listSpawnRooms, hasKeepers, popTarget);
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
		_.set(Memory, ["sites", "mining", rmHarvest, "visible"], visible);
		_.set(Memory, ["sites", "mining", rmHarvest, "has_minerals"],
			visible ? Game.rooms[rmHarvest].find(FIND_MINERALS, {filter: (m) => { return m.mineralAmount > 0; }}).length > 0 : false);

		let hostiles = visible 
			? _.filter(Game.rooms[rmHarvest].find(FIND_HOSTILE_CREEPS), 
				c => { return c.isHostile() && c.owner.username != "Source Keeper"; })
			: new Array();
		
		let is_safe = !visible || rmColony == rmHarvest || hostiles.length == 0;
		_.set(Memory, ["rooms", rmHarvest, "is_safe"], is_safe);
		_.set(Memory, ["sites", "mining", rmHarvest, "is_safe"], is_safe);
		_.set(Memory, ["sites", "mining", rmHarvest, "hostiles"], hostiles);
	},

	runPopulation: function(rmColony, rmHarvest, listCreeps, listSpawnRooms, hasKeepers, popTarget) {
		let room_level = Game["rooms"][rmColony].getLevel();
		let has_minerals = _.get(Memory, ["sites", "mining", rmHarvest, "has_minerals"]);
		let threat_level = _.get(Memory, ["rooms", rmColony, "threat_level"]);
		let is_safe = _.get(Memory, ["sites", "mining", rmHarvest, "is_safe"]);		
		let hostiles = _.get(Memory, ["sites", "mining", rmHarvest, "hostiles"], new Array());
		
		let is_safe_colony = _.get(Memory, ["rooms", rmColony, "is_safe"], true);
		let is_visible = _.get(Memory, ["sites", "mining", rmHarvest, "visible"], true);

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
		_.set(popActual, "paladin", _.filter(listCreeps, c => c.memory.role == "paladin" && (c.ticksToLive == undefined || c.ticksToLive > 200)).length);
		_.set(popActual, "soldier", _.filter(listCreeps, c => c.memory.role == "soldier").length);
		_.set(popActual, "healer", _.filter(listCreeps, c => c.memory.role == "healer").length);
		_.set(popActual, "dredger", _.filter(listCreeps, c => c.memory.role == "dredger" && (c.ticksToLive == undefined || c.ticksToLive > 100)).length);
		_.set(popActual, "burrower", _.filter(listCreeps, c => c.memory.role == "burrower" && (c.ticksToLive == undefined || c.ticksToLive > 100)).length);
        _.set(popActual, "carrier", _.filter(listCreeps, c => c.memory.role == "carrier" && (c.ticksToLive == undefined || c.ticksToLive > 50)).length);
        _.set(popActual, "miner", _.filter(listCreeps, c => c.memory.role == "miner").length);
        _.set(popActual, "multirole", _.filter(listCreeps, c => c.memory.role == "multirole").length);
        _.set(popActual, "reserver", _.filter(listCreeps, c => c.memory.role == "reserver").length);
		_.set(popActual, "extractor", _.filter(listCreeps, c => c.memory.role == "extractor").length);

		if (popTarget == null) {
			if (rmColony == rmHarvest)
				popTarget = _.clone(Population_Mining[`S${Game.rooms[rmHarvest].find(FIND_SOURCES).length}`][Math.max(1, room_level)]);
			else if (hasKeepers != true) {
				popTarget = (is_visible && _.get(Game, ["rooms", rmHarvest]) != null)
			        ? _.clone(Population_Mining[`R${Game.rooms[rmHarvest].find(FIND_SOURCES).length}`][Math.max(1, room_level)])
					: _.clone(Population_Mining["R1"][Math.max(1, room_level)]);
			} else if (hasKeepers == true)
				popTarget = _.clone(Population_Mining["SK"]);
		} else
			popTarget = _.clone(popTarget)

		// Remote mining: adjust soldier levels based on threat level
		if (rmHarvest != rmColony && threat_level != NONE) {						
			if (threat_level == LOW || threat_level == null) {
				_.set(popTarget, ["soldier", "amount"], _.get(popTarget, ["soldier", "amount"], 0) + Math.max(2, Math.round(room_level / 3)));
				if (is_safe)
					_.set(popTarget, ["soldier", "level"], Math.max(2, room_level - 2));				
			} else if (threat_level == MEDIUM) {
				_.set(popTarget, ["soldier", "amount"], _.get(popTarget, ["soldier", "amount"], 0) + Math.max(2, Math.round(room_level / 2)));
				_.set(popTarget, ["healer", "amount"], _.get(popTarget, ["healer", "amount"], 0) + Math.max(1, Math.floor(room_level / 5)));
				if (is_safe) {
					_.set(popTarget, ["soldier", "level"], Math.max(2, room_level - 1));
					_.set(popTarget, ["healer", "level"], Math.max(2, room_level - 1));
				}				
			} else if (threat_level == HIGH) {
				_.set(popTarget, ["soldier", "amount"], _.get(popTarget, ["soldier", "amount"], 0) + Math.max(5, room_level));
				_.set(popTarget, ["healer", "amount"], _.get(popTarget, ["healer", "amount"], 0) + Math.max(2, Math.round(room_level / 3)));
			}				
		}

		// Tally population levels for level scaling
		Hive.populationTally(rmColony, 
			_.sum(popTarget, p => { return _.get(p, "amount", 0); }), 
			_.sum(popActual));
		
		let Grafana = require("util.grafana");
		Grafana.populationTally(rmColony, popTarget, popActual);

		if (_.get(popActual, "paladin") < _.get(popTarget, ["paladin", "amount"])) {
			Memory["hive"]["spawn_requests"].push({ room: rmColony, listRooms: listSpawnRooms, priority: 1, 
				level: popTarget["paladin"]["level"],
				scale: _.get(popTarget, ["paladin", "scale"], true),
				body: "paladin", name: null, args: {role: "paladin", room: rmHarvest, colony: rmColony} });
		}
		
		if ((!hasKeepers && !is_safe && hostiles.length > _.get(popActual, "soldier") + _.get(popActual, "multirole"))
				|| (_.get(popActual, "soldier") < _.get(popTarget, ["soldier", "amount"]))) {
			Memory["hive"]["spawn_requests"].push({ room: rmColony, listRooms: listSpawnRooms, 
				priority: (is_safe ? 2 : 0),
				level: _.get(popTarget, ["soldier", "level"], room_level),
				scale: _.get(popTarget, ["soldier", "scale"], true),
				body: "soldier", name: null, args: {role: "soldier", room: rmHarvest, colony: rmColony} });
		}
		
		if (_.get(popActual, "healer") < _.get(popTarget, ["healer", "amount"])) {
			Memory["hive"]["spawn_requests"].push({ room: rmColony, listRooms: listSpawnRooms, 
				priority: (is_safe ? 3 : 1), 
				level: popTarget["healer"]["level"],
				scale: _.get(popTarget, ["healer", "scale"], true),
				body: "healer", name: null, args: {role: "healer", room: rmHarvest, colony: rmColony} });
		}
		
		if (_.get(popActual, "multirole") < _.get(popTarget, ["multirole", "amount"])) {
			Memory["hive"]["spawn_requests"].push({ room: rmColony, listRooms: listSpawnRooms, priority: 3, 
				level: popTarget["multirole"]["level"],
				scale: _.get(popTarget, ["multirole", "scale"], true),
				body: _.get(popTarget, ["multirole", "body"], (hasKeepers ? "worker" : "multirole")),
				name: null, args: {role: "multirole", room: rmHarvest, colony: rmColony} });
        }
		
		if (is_safe) {
			if (_.get(popActual, "miner") < 3 // Population stall? Energy defecit? Replenish with miner group
				&& ((_.get(popActual, "burrower") == 0 && _.get(popTarget, ["burrower", "amount"]) != null)
					|| (_.get(popActual, "miner") == 0 && _.get(popTarget, ["miner", "amount"]) != null))) {
				Memory["hive"]["spawn_requests"].push({ room: rmColony, listRooms: listSpawnRooms, 
					priority: (rmColony == rmHarvest ? 0 : 1), 
					level: Math.max(1, _.get(popActual, "miner")),
					scale: true, body: "worker", 
					name: null, args: {role: "miner", room: rmHarvest, colony: rmColony} });
			}

			if (_.get(popActual, "miner") < _.get(popTarget, ["miner", "amount"])) {
				Memory["hive"]["spawn_requests"].push({ room: rmColony, listRooms: listSpawnRooms, priority: 1, 
					level: _.get(popTarget, ["miner", "level"], 1),
					scale: _.get(popTarget, ["miner", "scale"], true),
					body: "worker", name: null, args: {role: "miner", room: rmHarvest, colony: rmColony} });
			}
			
			if (_.get(popActual, "dredger") < _.get(popTarget, ["dredger", "amount"])) {
				Memory["hive"]["spawn_requests"].push({ room: rmColony, listRooms: listSpawnRooms, priority: 1, 
					level: _.get(popTarget, ["dredger", "level"], 1),
					scale: _.get(popTarget, ["dredger", "scale"], true), 
					body: "dredger", name: null, args: {role: "dredger", room: rmHarvest, colony: rmColony} });
			}
			
			if (_.get(popActual, "burrower") < _.get(popTarget, ["burrower", "amount"])) {
				Memory["hive"]["spawn_requests"].push({ room: rmColony, listRooms: listSpawnRooms, priority: 1, 
					level: _.get(popTarget, ["burrower", "level"], 1),
					scale: _.get(popTarget, ["burrower", "scale"], true),
					body: _.get(popTarget, ["burrower", "body"], "burrower"),
					name: null, args: {role: "burrower", room: rmHarvest, colony: rmColony} });
			}
			
			if (_.get(popActual, "carrier") < _.get(popTarget, ["carrier", "amount"])) {
				Memory["hive"]["spawn_requests"].push({ room: rmColony, listRooms: listSpawnRooms, priority: 2, 
					level: _.get(popTarget, ["carrier", "level"], 1),
					scale: _.get(popTarget, ["carrier", "scale"], true),
					body: _.get(popTarget, ["carrier", "body"], "carrier"),
					name: null, args: {role: "carrier", room: rmHarvest, colony: rmColony} });
			}			
			
			if (_.get(popActual, "reserver") < _.get(popTarget, ["reserver", "amount"])
						&& Game.rooms[rmHarvest] != null && Game.rooms[rmHarvest].controller != null
						&& (Game.rooms[rmHarvest].controller.reservation == null || Game.rooms[rmHarvest].controller.reservation.ticksToEnd < 2000)) {
				Memory["hive"]["spawn_requests"].push({ room: rmColony, listRooms: listSpawnRooms, priority: 2, 
					level: _.get(popTarget, ["reserver", "level"], 1),
					scale: _.get(popTarget, ["reserver", "scale"], true),
					body: _.get(popTarget, ["reserver", "body"], "reserver"),
					name: null, args: {role: "reserver", room: rmHarvest, colony: rmColony} });
			}
			
			if (_.get(popActual, "extractor") < _.get(popTarget, ["extractor", "amount"]) && has_minerals) {
				Memory["hive"]["spawn_requests"].push({ room: rmColony, listRooms: listSpawnRooms, priority: 3, 
					level: _.get(popTarget, ["extractor", "level"], 1),
					scale: _.get(popTarget, ["extractor", "scale"], true),
					body: _.get(popTarget, ["extractor", "body"], "extractor"),
					name: null, args: {role: "extractor", room: rmHarvest, colony: rmColony} });
			}
		}
	},

	runCreeps: function(rmColony, rmHarvest, listCreeps, hasKeepers, listRoute) {
		let Roles = require("roles");
		let is_safe = _.get(Memory, ["sites", "mining", rmHarvest, "is_safe"]);

        _.each(listCreeps, creep => {
			_.set(creep, ["memory", "list_route"], listRoute);

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
	},

	buildContainers: function(rmColony, rmHarvest) {
		if (Game.time % 1500 != 0 || rmColony == rmHarvest)
			return;		// Blueprint builds containers in colony rooms

		let room = Game["rooms"][rmHarvest];
		if (room == null)
			return;

		let sources = room.find(FIND_SOURCES);
		let containers = _.filter(room.find(FIND_STRUCTURES), s => { return s.structureType == "container"; });				
		_.each(sources, source => {
			if (source.pos.findInRange(containers, 1).length == 0) {
				let adj = source.pos.getOpenTile_Adjacent();
				if (adj != null && adj.createConstructionSite("container") == OK)
					console.log(`<font color=\"#6065FF\">[Mining]</font> ${room.name} placing container at (${adj.x}, ${adj.y})`);					
			}
		});
	}
};
