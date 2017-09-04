_Tasks = require("tasks");

module.exports = {

	compileTasks: function (rmName) {
		let __Colony = require("util.colony");
		let room = Game.rooms[rmName];
		let roomLvl = (room.controller == null || room.controller.level == 0) ? 8 : room.controller.level;
		let amOwner = (room.controller == null || room.controller.level == 0) ? false : room.controller.my;
		let is_safe = _.get(Memory, ["rooms", rmName, "is_safe"]);

		var structures;
		let all_structures = room.find(FIND_STRUCTURES);
		let my_structures = _.filter(all_structures, s => { return s.my; });
		
		

		/* Room Controllers (upgrading, signing) */
		
		if (amOwner) {
			if (room.controller.ticksToDowngrade < 3500) {
				_Tasks.addTask(rmName,
					{   room: rmName,
						type: "work",
						subtype: "upgrade",
						id: room.controller.id,
						pos: room.controller.pos,
						key: `work:upgrade-${room.controller.id}`,
						timer: 30,
						creeps: 15,
						priority: 1
					});
			} else if (_.get(Memory, ["hive", "pulses", "pause_upgrading", rmName]) == null) {
				_Tasks.addTask(rmName,
					{   room: rmName,
						type: "work",
						subtype: "upgrade",
						id: room.controller.id,
						pos: room.controller.pos,
						key: `work:upgrade-${room.controller.id}`,
						timer: 30,
						creeps: 20,
						priority: 9
					});
			}

			let room_sign = _.get(Memory, ["hive", "signs", rmName]);
			let default_sign = _.get(Memory, ["hive", "signs", "default"]);
			if (room_sign != null && _.get(room, ["controller", "sign", "text"]) != room_sign) {
				_Tasks.addTask(rmName,
					{   room: rmName,
						type: "work",
						subtype: "sign",
						message: room_sign,
						id: room.controller.id,
						pos: room.controller.pos,
						key: `sign-${room.controller.id}`,
						timer: 30,
						creeps: 1,
						priority: 2
					});
			} else if (room_sign == null && default_sign != null && _.get(room, ["controller", "sign", "text"]) != default_sign) {
				_Tasks.addTask(rmName,
					{   room: rmName,
						type: "work",
						subtype: "sign",
						message: default_sign,
						id: room.controller.id,
						pos: room.controller.pos,
						key: `sign-${room.controller.id}`,
						timer: 30,
						creeps: 1,
						priority: 2
					});
			}
		}

		
		/* Repairing- critical and maintenance */

		structures = __Colony.findByNeed_RepairMaintenance(room);
		for (let i in structures) {
			if (amOwner || structures[i].structureType == "road" || structures[i].structureType == "container") {
				_Tasks.addTask(rmName,
					{   room: rmName,
						type: "work",
						subtype: "repair",
						id: structures[i].id,
						pos: structures[i].pos,
						key: `work:repair-${structures[i].id}`,
						timer: 20,
						creeps: 2,
						priority: 8
					});
			}
		}

		structures = __Colony.findByNeed_RepairCritical(room);
		for (let i in structures) {
			if (amOwner || structures[i].structureType == "road" || structures[i].structureType == "container") {
				_Tasks.addTask(rmName,
					{   room: rmName,
						type: "work",
						subtype: "repair",
						id: structures[i].id,
						pos: structures[i].pos,
						key: `work:repair-${structures[i].id}`,
						timer: 20,
						creeps: 2,
						priority: 2
					});
			}
		}

		/* Construction sites */

		structures = room.find(FIND_CONSTRUCTION_SITES, { filter: s => { return s.my; }});
		for (let i in structures) {

			let priority = 0;
			switch (structures[i].structureType) {
				case "tower": 		priority = 4; 	break;
				case "spawn":		priority = 5; 	break;
				case "extension":	priority = 6; 	break;
				default:  			priority = 7;  	break;
			}

			if (structures[i].progress > 0)
				priority += 1;

			_Tasks.addTask(rmName,
				{   room: rmName,
					type: "work",
					subtype: "build",
					id: structures[i].id,
					pos: structures[i].pos,
					key: `work:build-${structures[i].id}`,
					timer: 30,
					creeps: 10,
					priority: _.clone(priority)
				});
		}

		
		/* Dropped resources */
		
		let piles = room.find(FIND_DROPPED_RESOURCES);
		for (let i in piles) {
			_Tasks.addTask(rmName,
				{   room: rmName,
					type: "carry",
					subtype: "pickup",
					resource: piles[i].resourceType == "energy" ? "energy" : "mineral",
					id: piles[i].id,
					pos: piles[i].pos,
					key: `carry:pickup-${piles[i].id}`,
					timer: 20,
					creeps: Math.ceil(piles[i].amount / 1000),
					priority: piles[i].resourceType == "energy" ? 2 : 1,
				});
		}


		/* Source mining */

		let sources = room.find(FIND_SOURCES, { filter: s => { return s.energy > 0; }});
		for (let i in sources) {
			let container = _.get(Memory, ["rooms", rmName, "sources", sources[i].id, "container"]);
			container = (container == null) ? null : Game.getObjectById(container);
			if (container == null) {
				container = _.head(sources[i].pos.findInRange(FIND_STRUCTURES, 1, { filter:
					s => { return s.structureType == "container"; } }));
				_.set(Memory, ["rooms", rmName, "sources", sources[i].id, "container"], container == null ? null : container.id);
			}

			let access_tiles = _.get(Memory, ["rooms", rmName, "sources", sources[i].id, "access_tiles"]);
			if (access_tiles == null) {
				access_tiles = sources[i].pos.getAccessAmount();
				_.set(Memory, ["rooms", rmName, "sources", sources[i].id, "access_tiles"], access_tiles);
			}

			_Tasks.addTask(rmName,
				{   room: rmName,
					type: "mine",
					subtype: "harvest",
					resource: "energy",
					id: sources[i].id,
					pos: (container != null ? container.pos : sources[i].pos),
					key: `mine:harvest-${sources[i].id}`,
					timer: 60,
					creeps: access_tiles,
					priority: 1
				});
		}


		/* Mineral extraction */

		let minerals = room.find(FIND_MINERALS, { filter: m => { return m.mineralAmount > 0; }});
		for (let i in minerals) {
			let look = minerals[i].pos.look();
			for (let l = 0; l < look.length; l++) {
				if (look[l].structure != null && look[l].structure.structureType == "extractor") {
					_Tasks.addTask(rmName,
						{   room: rmName,
							type: "mine",
							subtype: "harvest",
							resource: "mineral",
							id: minerals[i].id,
							pos: minerals[i].pos,
							key: `mine:harvest-${minerals[i].id}`,
							timer: 30,
							creeps: 2,
							priority: 2
						});
				}
			}
		}


		/* Containers */

		let containers = _.filter(all_structures, s => { return s.structureType == STRUCTURE_CONTAINER; });
		for (let i in containers) {
			if (containers[i].store["energy"] > 0) {
				_Tasks.addTask(rmName,
					{   room: rmName,
						type: "energy",
						subtype: "withdraw",
						structure: containers[i].structureType,
						resource: "energy",
						id: containers[i].id,
						pos: containers[i].pos,
						key: `energy:withdraw-energy-${containers[i].id}`,
						timer: 20,
						creeps: Math.ceil(containers[i].store["energy"] / (roomLvl * 180)),
						priority: 3
					});
			}
			if (_.sum(containers[i].store) < containers[i].storeCapacity) {
				_Tasks.addTask(rmName,
					{   room: rmName,
						type: "carry",
						subtype: "deposit",
						structure: containers[i].structureType,
						resource: "energy",
						id: containers[i].id,
						pos: containers[i].pos,
						key: `carry:deposit-energy-${containers[i].id}`,
						timer: 20,
						creeps: 10,
						priority: 9
					});
			}
			// Empty stray minerals from containers! type: "energy" for carriers (not an industry task!)
			_.each(_.filter(Object.keys(containers[i].store), res => { return res != "energy"; }), res => {
				_Tasks.addTask(rmName,
					{   room: rmName,
						type: "energy",
						subtype: "withdraw",
						structure: containers[i].structureType,
						resource: res,
						id: containers[i].id,
						pos: containers[i].pos,
						key: `energy:withdraw-energy-${containers[i].id}`,
						timer: 20,
						creeps: Math.ceil(containers[i].store[res] / (roomLvl * 180)),
						priority: 2
					});
			});
		}



		/* Storage */

		let storage = _.head(_.filter(my_structures, s => { return s.structureType == "storage"; }));
		if (storage != null) {
			if (storage.store["energy"] > 0 && _.get(Memory, ["rooms", rmName, "energy_critical"]) == true) {
				_Tasks.addTask(rmName,
					{   room: rmName,
						type: "energy-critical",
						subtype: "withdraw",
						structure: storage.structureType,
						resource: "energy",
						id: storage.id,
						pos: storage.pos,
						key: `energy:withdraw-energy-${storage.id}`,
						timer: 20,
						creeps: Math.ceil(storage.store["energy"] / (roomLvl * 180)),
						priority: 3
					});
			} else if (storage.store["energy"] > 0) {
				_Tasks.addTask(rmName,
					{   room: rmName,
						type: "energy",
						subtype: "withdraw",					
						structure: storage.structureType,
						resource: "energy",
						id: storage.id,
						pos: storage.pos,
						key: `energy:withdraw-energy-${storage.id}`,
						timer: 20,
						creeps: Math.ceil(storage.store["energy"] / (roomLvl * 180)),
						priority: 3
					});
			}
			if (_.sum(storage.store) < storage.storeCapacity) {
				_Tasks.addTask(rmName,
					{   room: rmName,
						type: "carry",
						subtype: "deposit",
						structure: storage.structureType,
						resource: "energy",
						id: storage.id,
						pos: storage.pos,
						key: `carry:deposit-energy-${storage.id}`,
						timer: 20,
						creeps: 10,
						priority: 8
					});
			}
			// Storages receive all minerals... industry tasks work from storage!
			_Tasks.addTask(rmName,
				{   room: rmName,
					type: "carry",
					subtype: "deposit",
					structure: storage.structureType,
					resource: "mineral",
					id: storage.id,
					pos: storage.pos,
					key: `carry:deposit-mineral-${storage.id}`,
					timer: 20,
					creeps: 10,
					priority: 9
				});
		}
		


		/* Links */

		if (amOwner) {
			if (Memory["rooms"][rmName]["links"] != null) {
				_.each(Memory["rooms"][rmName]["links"], l => {
					let link = Game.getObjectById(l["id"]);
					if (l["dir"] == "send" && link != null && link.energy < link.energyCapacity * 0.9) {
						_Tasks.addTask(rmName,
						{   room: rmName,
							type: "carry",
							subtype: "deposit",
							structure: "link",
							resource: "energy",
							id: l["id"],
							pos: link.pos,
							key: `carry:deposit-link:${l["id"]}`,
							timer: 20,
							creeps: 1,
							priority: (l["role"] == "miner" ? 2 : 3)
						 });
					} else if (l["dir"] == "receive" && link != null && link.energy > 0) {
						_Tasks.addTask(rmName,
						{   room: rmName,
							type: "energy",
							subtype: "withdraw",
							structure: "link",
							resource: "energy",
							role: l["role"],
							id: l["id"],
							pos: link.pos,
							key: `energy:withdraw-link:${l["id"]}-${l["role"]}`,
							timer: 20,
							creeps: (roomLvl > 6 ? 1 : 2),
							priority: 2
						});
					}
				});
			}


			/* Towers */

			let towers = room.find(FIND_MY_STRUCTURES, { filter: s => {
				return s.structureType == STRUCTURE_TOWER; }});
			for (let i in towers) {
				if (towers[i].energy < towers[i].energyCapacity * 0.25) {
					_Tasks.addTask(rmName,
					{   room: rmName,
						type: "carry",
						subtype: "deposit",
						structure: "tower",
						resource: "energy",
						id: towers[i].id,
						pos: towers[i].pos,
						key: `carry:deposit-${towers[i].id}`,
						timer: 30,
						creeps: 1,
						priority: 2
					});
				} else if (towers[i].energy < towers[i].energyCapacity) {
					_Tasks.addTask(rmName,
					{   room: rmName,
						type: "carry",
						subtype: "deposit",
						structure: "tower",
						resource: "energy",
						id: towers[i].id,
						pos: towers[i].pos,
						key: `carry:deposit-${towers[i].id}`,
						timer: 30,
						creeps: 1,
						priority: 4
					});
				}
			}


			/* Spawns and Extensions */

			structures = room.find(FIND_MY_STRUCTURES, { filter: s => {
				return (s.structureType == STRUCTURE_SPAWN && s.energy < s.energyCapacity * 0.85)
					|| (s.structureType == STRUCTURE_EXTENSION && s.energy < s.energyCapacity); }});

			if (room.energyAvailable < room.energyCapacityAvailable * 0.75) {
				for (let i in structures) {
					_Tasks.addTask(rmName,
					{   room: rmName,
						type: "carry",
						subtype: "deposit",
						structure: structures[i].structureType,
						resource: "energy",
						id: structures[i].id,
						pos: structures[i].pos,
						key: `carry:deposit-${structures[i].id}`,
						timer: 20,
						creeps: 1,
						priority: 1
					});
				}
			} else {
				for (let i in structures) {
					_Tasks.addTask(rmName,
					{   room: rmName,
						type: "carry",
						subtype: "deposit",
						structure: structures[i].structureType,
						resource: "energy",
						id: structures[i].id,
						pos: structures[i].pos,
						key: `carry:deposit-${structures[i].id}`,
						timer: 20,
						creeps: 1,
						priority: 3
					});
				}
			}
		}
	}
}