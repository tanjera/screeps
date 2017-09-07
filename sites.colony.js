require("populations");

let _CPU = require("util.cpu");
let Hive = require("hive");

module.exports = {

	Run: function(rmColony) {

		_CPU.Start(rmColony, "Colony-init");
		listSpawnRooms = _.get(Memory, ["rooms", rmColony, "spawn_assist", "rooms"]);
		listSpawnRoute = _.get(Memory, ["rooms", rmColony, "spawn_assist", "route"]);
		listPopulation = _.get(Memory, ["rooms", rmColony, "custom_population"]);
		_CPU.End(rmColony, "Colony-init");

		_CPU.Start(rmColony, "Colony-listCreeps");
		let listCreeps = _.filter(Game.creeps, c => c.memory.room == rmColony);
		_CPU.End(rmColony, "Colony-listCreeps");

		_CPU.Start(rmColony, "Colony-surveyRoom");
		if (Game.time % 3 == 0) {
			this.surveyRoom(rmColony);		
			this.surveySafeMode(rmColony);
		}
		_CPU.End(rmColony, "Colony-surveyRoom");

		if (isPulse_Spawn()) {
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
		if (Game.time % 200 == 0 || _.has(Memory, ["hive", "pulses", "reset_links"])) {
			this.defineLinks(rmColony);
		}
		_CPU.End(rmColony, "Colony-defineLinks");

		_CPU.Start(rmColony, "Colony-runLinks");
		this.runLinks(rmColony);
        _CPU.End(rmColony, "Colony-runLinks");
	},

	surveyRoom: function(rmColony) {
		let __Colony = require("util.colony");

		let visible = _.keys(Game.rooms).includes(rmColony);
		_.set(Memory, ["rooms", rmColony, "has_minerals"],
			visible ? Game.rooms[rmColony].find(FIND_MINERALS, {filter: (m) => { return m.mineralAmount > 0; }}).length > 0 : false);

		let amountHostiles = visible
			? Game.rooms[rmColony].find(FIND_HOSTILE_CREEPS, { filter: 
				(c) => { return c.isHostile(); }}).length 
			: 0;
		let isSafe = !visible || amountHostiles == 0;
		_.set(Memory, ["rooms", rmColony, "is_safe"], isSafe);
		_.set(Memory, ["rooms", rmColony, "amount_hostiles"], amountHostiles);

		let storage = _.get(Game, ["rooms", rmColony, "storage"]);
		
		_.set(Memory, ["rooms", rmColony, "energy_low"], 
		(storage != null && storage.store["energy"] < __Colony.getLowStockpile(_.get(Game, ["rooms", rmColony, "controller", "level"]))));
		_.set(Memory, ["rooms", rmColony, "energy_critical"], 
			(storage != null && storage.store["energy"] < __Colony.getCriticalStockpile(_.get(Game, ["rooms", rmColony, "controller", "level"]))));
		
		let ticks_downgrade = _.get(Game, ["rooms", rmColony, "controller", "ticksToDowngrade"]);
		_.set(Memory, ["rooms", rmColony, "downgrade_critical"], (ticks_downgrade > 0 && ticks_downgrade < 3500))
	},

	surveySafeMode: function(rmColony) {
		let room = _.get(Game, ["rooms", rmColony]);
		let controller = _.get(room, "controller");
		let is_safe = _.get(Memory, ["rooms", rmColony, "is_safe"]);

		if (is_safe || room == null || controller == null || controller.safeMode > 0 
				|| controller.safeModeCooldown > 0 || controller.safeModeAvailable == 0)
			return;

		let hostiles = _.filter(room.find(FIND_HOSTILE_CREEPS), c => { 
			return c.isHostile() && c.owner.username != "Invader"; });
		let structures = _.filter(room.find(FIND_MY_STRUCTURES), s => {
			return s.structureType == "spawn" || s.structureType == "storage"
				|| s.structureType == "tower" || s.structureType == "terminal"
				|| s.structureType == "nuker"; });

		_.each(structures, s => {
			if (s.pos.findInRange(hostiles, 1).length > 0) {
				if (room.controller.activateSafeMode() == "OK")
					console.log(`<font color=\"#FF0000\">[Invasion]</font> Safe mode activated in ${rmColony}; enemy detected at key base structure!`);
			}
		});
	},

	runPopulation: function(rmColony, listCreeps, listSpawnRooms, listPopulation) {
		let roomLvl = _.get(Game, ["rooms", rmColony, "controller", "level"]);

		let is_safe = _.get(Memory, ["rooms", rmColony, "is_safe"]);
		let energy_low = _.get(Memory, ["rooms", rmColony, "energy_low"])
		let energy_critical = _.get(Memory, ["rooms", rmColony, "energy_critical"])
		let downgrade_critical = _.get(Memory, ["rooms", rmColony, "downgrade_critical"]);

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

		if (_.get(Game, ["rooms", rmColony, "controller", "safeMode"]) == null
			&& ((listPopulation["soldier"] != null && lSoldier.length < listPopulation["soldier"]["amount"])
			|| (lSoldier.length < _.get(Memory, ["rooms", rmColony, "amount_hostiles"])))) {
				Memory["hive"]["spawn_requests"].push({ room: rmColony, listRooms: listSpawnRooms, priority: 0,
					level: (listPopulation["soldier"] == null ? 8 : listPopulation["soldier"]["level"]),
					scale_level: listPopulation["soldier"] == null ? true : listPopulation["soldier"]["scale_level"],
					body: "soldier", name: null, args: {role: "soldier", room: rmColony} });
		} else if (listPopulation["worker"] != null 
			&& lWorker.length < ((is_safe && !energy_critical) ? listPopulation["worker"]["amount"] : 1)) {
				Memory["hive"]["spawn_requests"].push({ room: rmColony, listRooms: listSpawnRooms, priority: 3, 
					level: ((is_safe && !energy_critical) 
						? listPopulation["worker"]["level"]
						: Math.max(1, Math.floor(listPopulation["worker"]["level"] / 2))),
					scale_level: ((!is_safe || energy_critical || energy_low) ? false
						: (listPopulation["worker"] == null ? true : listPopulation["worker"]["scale_level"])),
					body: (listPopulation["worker"]["body"] || "worker"),
					name: null, args: {role: "worker", room: rmColony} });
		} else if (listPopulation["repairer"] != null && lRepairer.length < listPopulation["repairer"]["amount"]) {
				Memory["hive"]["spawn_requests"].push({ room: rmColony, listRooms: listSpawnRooms, priority: 4, level: listPopulation["repairer"]["level"],
					scale_level: listPopulation["repairer"] == null ? true : listPopulation["repairer"]["scale_level"],
					body: (listPopulation["repairer"]["body"] || "worker"),
					name: null, args: {role: "worker", subrole: "repairer", room: rmColony} });
		} else if (listPopulation["upgrader"] != null 
			&& lUpgrader.length < ((is_safe && !energy_critical && !energy_low) ? listPopulation["upgrader"]["amount"] : 1)) {
				Memory["hive"]["spawn_requests"].push({ room: rmColony, listRooms: listSpawnRooms, 
					priority: downgrade_critical ? 1 : 4, 
					level: ((!is_safe || energy_critical) ? 1
						: (energy_low ? Math.max(1, Math.floor(listPopulation["upgrader"]["level"] / 2)) 
							: listPopulation["upgrader"]["level"])),
					scale_level: ((!is_safe || energy_critical || energy_low) ? false
						: (listPopulation["upgrader"] == null ? true : listPopulation["upgrader"]["scale_level"])),
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

		if (!is_safe) {
		    _.set(Memory, ["rooms", rmColony, "target_heal"], null);
			this.towerAcquireAttack(rmColony);
			this.towerRunAttack(rmColony);
		} else {
		    _.set(Memory, ["rooms", rmColony, "target_attack"], null);
			this.towerAcquireHeal(rmColony);
			this.towerRunHeal(rmColony);
		}
	},

	towerAcquireAttack: function (rmColony) {
		let target = _.get(Memory, ["rooms", rmColony, "target_attack"]);

		// Check if existing target is still alive and in room... otherwise nullify and re-acquire
		if (target != null) {
			let hostile = Game.getObjectById(target);
			if (hostile == null) {
				target == null;
				_.set(Memory, ["rooms", rmColony, "target_attack"], null);
			}
		}
		
		// Acquire target if no target exists, or re-acquire target every 15 ticks
		if (target == null || Game.time % 15 == 0) {
			let base_structures = _.filter(Game.rooms[rmColony].find(FIND_STRUCTURES),
				s => { return s.structureType != "link" && s.structureType != "container" 
						&& s.structureType != "extractor" && s.structureType != "controller"
						&& s.structureType != "road"; });
			let spawns = _.filter(base_structures, s => { return s.structureType == "spawn"; });
			
			// Find the center of base by averaging position of all spawns
			let originX = 0, originY = 0;
			for (let i = 0; i < spawns.length; i++) {
				originX += spawns[i].pos.x; 
				originY += spawns[i].pos.y;
			}
			originX /= spawns.length;
			originY /= spawns.length;

			let my_creeps = Game.rooms[rmColony].find(FIND_MY_CREEPS);
			// Only attack creeps that are 1) not allies and 2) within 10 sq of base structures (or Invader within 5 sq of creeps)
			// Then sort by 1) if they have heal parts, and 2) sort by distance (attack closest)
			target = _.head(_.sortBy(_.filter(Game.rooms[rmColony].find(FIND_HOSTILE_CREEPS),
				c => { return !c.isAlly() && (c.pos.inRangeToListTargets(base_structures, 10) 
						|| (c.owner.username == "Invader" && c.pos.inRangeToListTargets(my_creeps, 3))); }),
				c => { return (c.getActiveBodyparts(HEAL) > 0
					? -100 + new RoomPosition(originX, originY, rmColony).getRangeTo(c.pos.x, c.pos.y)
					: new RoomPosition(originX, originY, rmColony).getRangeTo(c.pos.x, c.pos.y)); }));
			_.set(Memory, ["rooms", rmColony, "target_attack"], (target == null ? null : target.id));
		}
	},

	towerRunAttack: function (rmColony) {
		let hostile_id = _.get(Memory, ["rooms", rmColony, "target_attack"]);
		if (hostile_id != null) {
			let hostile = Game.getObjectById(hostile_id);
			if (hostile == null) {
				_.set(Memory, ["rooms", rmColony, "target_attack"], null);
			} else {
				_.each(_.filter(Game.rooms[rmColony].find(FIND_MY_STRUCTURES), 
					s => { return s.structureType == "tower"; }),
					t => { t.attack(hostile); });				
			}
		}
	},

	towerAcquireHeal: function (rmColony) {
		if (Game.time % 15 == 0 && _.get(Game, ["rooms", rmColony]) != null) {
			let injured = _.head(_.filter(Game.rooms[rmColony].find(FIND_MY_CREEPS), 
				c => { return c.hits < c.hitsMax; }));
			_.set(Memory, ["rooms", rmColony, "target_heal"], (injured == null ? null :injured.id));
		}
	},

	towerRunHeal: function (rmColony) {
		let injured_id = _.get(Memory, ["rooms", rmColony, "target_heal"]);
		if (injured_id != null) {
			let injured = Game.getObjectById(injured_id);
			if (injured == null || injured.hits == injured.hitsMax) {
				_.set(Memory, ["rooms", rmColony, "target_heal"], null);
			} else {
				_.each(Game.rooms[rmColony].find(FIND_MY_STRUCTURES, { filter: (s) => {
					return s.structureType == STRUCTURE_TOWER && s.energy > s.energyCapacity * 0.5; }}),
					t => { t.heal(injured) });				
			}
		}
	},


	defineLinks: function(rmColony) {
		let link_defs = _.get(Memory, ["rooms", rmColony, "links"]);
		let room = Game.rooms[rmColony];
		let structures = room.find(FIND_MY_STRUCTURES);
		let links = _.filter(structures, s => { return s.structureType == "link"; });
		
		// Check that link definitions are current with GameObject ID's
		if (link_defs != null && Object.keys(link_defs).length == links.length) {
			for (let i = 0; i < Object.keys(link_defs).length; i++) {
				if (_.filter(links, s => { return s.id == link_defs[i].id}).length == 0) {
					delete Memory["rooms"][rmColony]["links"];
				}
			}
		}

		// Define missing link definitions
		if (link_defs == null || Object.keys(link_defs).length != links.length) {
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
				link_defs.push({id: link.id, dir: "receive", role: "upgrade"});
			});

			Memory["rooms"][rmColony]["links"] = link_defs;
			console.log(`<font color=\"#D3FFA3\">[Console]</font> Links defined for ${rmColony}.`);
		}
		
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
						if (send != null && send.energy > send.energyCapacity * 0.1 && receive.energy < receive.energyCapacity * 0.9) {
							send.transferEnergy(receive);
						}
					}
                });
            });
        }
	}
};
