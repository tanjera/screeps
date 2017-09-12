_Tasks = require("tasks");

module.exports = {

	compileTasks: function (rmName) {
		let room = Game.rooms[rmName];
		let am_owner = _.get(room, ["controller", "my"], false);
		let room_level = am_owner ? room.controller.level : 0;
		let is_safe = _.get(Memory, ["rooms", rmName, "is_safe"]);
		
		let all_structures = room.find(FIND_STRUCTURES);
		let my_structures = _.filter(all_structures, s => { return s.my; });
		let carry_capacity = [ 1000, 150, 200, 400, 650, 900, 1200, 1650, 1650 ];
		

		/* Room Controllers (upgrading, signing) */
		
		if (am_owner) {
			if (room.controller.ticksToDowngrade < 3500) {
				_Tasks.addTask(rmName,
					{   room: rmName,
						type: "work",
						subtype: "upgrade",
						id: room.controller.id,
						pos: room.controller.pos.getOpenTile_Range(2, true),
						key: `work:upgrade-${room.controller.id}`,
						timer: 30,
						creeps: 15,
						priority: 1
					});
			} else if (is_safe) {
				_Tasks.addTask(rmName,
					{   room: rmName,
						type: "work",
						subtype: "upgrade",
						id: room.controller.id,
						pos: room.controller.pos.getOpenTile_Range(2, true),
						key: `work:upgrade-${room.controller.id}`,
						timer: 30,
						creeps: 20,
						priority: 9
					});
			}

			let room_sign = _.get(Memory, ["hive", "signs", rmName]);
			let default_sign = _.get(Memory, ["hive", "signs", "default"]);
			if (is_safe && room_sign != null && _.get(room, ["controller", "sign", "text"]) != room_sign) {
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
			} else if (is_safe && room_sign == null && default_sign != null && _.get(room, ["controller", "sign", "text"]) != default_sign) {
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

		let repair_maintenance = room.findRepair_Maintenance();
		for (let i in repair_maintenance) {
			// Hits < 80% target, workers will assist repairers before upgrading;
			// Hit point cut-off prevents continual disruption to upgrading
			if (((repair_maintenance[i].hits / room.getWallTarget()) < 0.8)
				&& (repair_maintenance[i].structureType == "rampart" || repair_maintenance[i].structureType == "constructedWall")) {
					_Tasks.addTask(rmName,
						{   room: rmName,
							type: "work",
							subtype: "repair",
							id: repair_maintenance[i].id,
							pos: repair_maintenance[i].pos,
							key: `work:repair-${repair_maintenance[i].id}`,
							timer: 20,
							creeps: 2,
							priority: 8
						});
			} else if (is_safe && (am_owner || repair_maintenance[i].structureType == "road" || repair_maintenance[i].structureType == "container")) {
				_Tasks.addTask(rmName,
					{   room: rmName,
						type: "work",
						subtype: "repair",
						id: repair_maintenance[i].id,
						pos: repair_maintenance[i].pos,
						key: `work:repair-${repair_maintenance[i].id}`,
						timer: 20,
						creeps: 2,
						priority: 10
					});
			}
		}

		let repair_critical = room.findRepair_Critical();
		for (let i in repair_critical) {
			if (am_owner || repair_critical[i].structureType == "road" || repair_critical[i].structureType == "container") {
				_Tasks.addTask(rmName,
					{   room: rmName,
						type: "work",
						subtype: "repair",
						id: repair_critical[i].id,
						pos: repair_critical[i].pos,
						key: `work:repair-${repair_critical[i].id}`,
						timer: 20,
						creeps: 2,
						priority: 5
					});
			}
		}

		/* Construction sites */

		let sites = room.find(FIND_CONSTRUCTION_SITES, { filter: s => { return s.my; }});
		for (let i in sites) {

			let priority = 0;
			switch (sites[i].structureType) {
				case "spawn":		priority = 2; 	break;
				case "tower": 		priority = 3; 	break;
				case "extension":	priority = 4; 	break;
				case "storage":		priority = 5;	break;
				default:  			priority = 6;  	break;
				case "road":		priority = 7;	break;
			}

			if (sites[i].progress > 0)
				priority -= 1;

			_Tasks.addTask(rmName,
				{   room: rmName,
					type: "work",
					subtype: "build",
					id: sites[i].id,
					pos: sites[i].pos,
					key: `work:build-${sites[i].id}`,
					timer: 30,
					creeps: 10,
					priority: _.clone(priority)
				});
		}

		
		/* Dropped resources */
		
		if (is_safe) {
			let piles = room.find(FIND_DROPPED_RESOURCES);			
			for (let i in piles) {
				if (piles[i].resourceType == "energy" && piles[i].amount > carry_capacity[room_level] / 5) {
				_Tasks.addTask(rmName,
					{   room: rmName,
						type: "carry",
						subtype: "pickup",
						resource: "energy",
						id: piles[i].id,
						pos: piles[i].pos,
						key: `carry:pickup-${piles[i].id}`,
						timer: 20,
						creeps: Math.ceil(piles[i].amount / carry_capacity[room_level]),
						priority: 2,
					});
				} else if (piles[i].resourceType == "mineral") {
					_Tasks.addTask(rmName,
						{   room: rmName,
							type: "carry",
							subtype: "pickup",
							resource: "mineral",
							id: piles[i].id,
							pos: piles[i].pos,
							key: `carry:pickup-${piles[i].id}`,
							timer: 20,
							creeps: Math.ceil(piles[i].amount / carry_capacity[room_level]),
							priority: 1,
						});
					}
			}
		}


		/* Source mining */

		if (is_safe) {
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
						pos: (container != null ? container.pos : sources[i].pos.getOpenTile_Adjacent(false)),
						key: `mine:harvest-${sources[i].id}`,
						timer: 30,
						creeps: access_tiles,
						priority: 1
					});
			}
		}

		/* Mineral extraction */

		if (is_safe) {
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
						creeps: Math.ceil(containers[i].store["energy"] / carry_capacity[room_level]),
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
						creeps: Math.ceil(containers[i].store[res] / carry_capacity[room_level]),
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
						creeps: Math.ceil(storage.store["energy"] / carry_capacity[room_level]),
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
						creeps: Math.ceil(storage.store["energy"] / carry_capacity[room_level]),
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

		if (am_owner) {
			if (is_safe && Memory["rooms"][rmName]["links"] != null) {
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
							creeps: (room_level > 6 ? 1 : 2),
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

			let spawns_exts = _.filter(my_structures, s => {
				return (s.structureType == STRUCTURE_SPAWN && s.energy < s.energyCapacity * 0.85)
					|| (s.structureType == STRUCTURE_EXTENSION && s.energy < s.energyCapacity); });

			if (room.energyAvailable < room.energyCapacityAvailable * 0.75) {
				for (let i in spawns_exts) {
					_Tasks.addTask(rmName,
					{   room: rmName,
						type: "carry",
						subtype: "deposit",
						structure: spawns_exts[i].structureType,
						resource: "energy",
						id: spawns_exts[i].id,
						pos: spawns_exts[i].pos,
						key: `carry:deposit-${spawns_exts[i].id}`,
						timer: 20,
						creeps: 1,
						priority: 1
					});
				}
			} else {
				for (let i in spawns_exts) {
					_Tasks.addTask(rmName,
					{   room: rmName,
						type: "carry",
						subtype: "deposit",
						structure: spawns_exts[i].structureType,
						resource: "energy",
						id: spawns_exts[i].id,
						pos: spawns_exts[i].pos,
						key: `carry:deposit-${spawns_exts[i].id}`,
						timer: 20,
						creeps: 1,
						priority: 3
					});
				}
			}
		}
	}
}