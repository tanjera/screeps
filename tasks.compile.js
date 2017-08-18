_Tasks = require("tasks");

module.exports = {

	compileTasks: function (rmName) {
		var structures;
		let __Colony = require("util.colony");
		let room = Game.rooms[rmName];
		let roomLvl = (room.controller == null || room.controller.level == 0) ? 8 : room.controller.level;
		let amOwner = (room.controller == null || room.controller.level == 0) ? false : room.controller.my;

		/* Worker-based tasks (upgrading controllers, building and maintaining structures) */
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
			} else if (_.get(Memory, ["pulses", "pause_upgrading"]) == null) {
				_Tasks.addTask(rmName,
					{   room: rmName,
						type: "work",
						subtype: "upgrade",
						id: room.controller.id,
						pos: room.controller.pos,
						key: `work:upgrade-${room.controller.id}`,
						timer: 30,
						creeps: 20,
						priority: 5
					});
			}
		}

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
						priority: 6
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

		structures = room.find(FIND_CONSTRUCTION_SITES, { filter: s => { return s.my; }});
		for (let i in structures) {
			_Tasks.addTask(rmName,
				{   room: rmName,
					type: "work",
					subtype: "build",
					id: structures[i].id,
					pos: structures[i].pos,
					key: `work:build-${structures[i].id}`,
					timer: 30,
					creeps: 3,
					priority: 3
				});
		}

		/* Carrier-based tasks & energy supply for workers) */
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

		let storages = room.find(FIND_STRUCTURES, { filter: s => {
			return (s.structureType == STRUCTURE_STORAGE && s.my)
				|| (s.structureType == STRUCTURE_CONTAINER); }});
		for (let i in storages) {
			if (storages[i].store["energy"] > 0) {
				_Tasks.addTask(rmName,
					{   room: rmName,
						type: "energy",
						subtype: "withdraw",
						structure: storages[i].structureType,
						resource: "energy",
						id: storages[i].id,
						pos: storages[i].pos,
						key: `energy:withdraw-energy-${storages[i].id}`,
						timer: 20,
						creeps: Math.ceil(storages[i].store["energy"] / (roomLvl * 200)),
						priority: 3
					});
			}
			if (_.sum(storages[i].store) < storages[i].storeCapacity) {
				_Tasks.addTask(rmName,
					{   room: rmName,
						type: "carry",
						subtype: "deposit",
						structure: storages[i].structureType,
						resource: "energy",
						id: storages[i].id,
						pos: storages[i].pos,
						key: `carry:deposit-energy-${storages[i].id}`,
						timer: 20,
						creeps: 10,
						priority: (storages[i].structureType == "storage" ? 8 : 9)
					});
				if (storages[i].structureType == "storage") {
					// Storages receive all minerals... industry tasks work from storage!
					_Tasks.addTask(rmName,
						{   room: rmName,
							type: "carry",
							subtype: "deposit",
							structure: storages[i].structureType,
							resource: "mineral",
							id: storages[i].id,
							pos: storages[i].pos,
							key: `carry:deposit-mineral-${storages[i].id}`,
							timer: 20,
							creeps: 10,
							priority: 9
						});
				} else if (storages[i].structureType == "container") {
					// Empty stray minerals from containers! type: "energy" for carriers (not an industry task!)
					_.each(_.filter(Object.keys(storages[i].store), res => { return res != "energy"; }), res => {
						_Tasks.addTask(rmName,
							{   room: rmName,
								type: "energy",
								subtype: "withdraw",
								structure: storages[i].structureType,
								resource: res,
								id: storages[i].id,
								pos: storages[i].pos,
								key: `energy:withdraw-energy-${storages[i].id}`,
								timer: 20,
								creeps: Math.ceil(storages[i].store[res] / (roomLvl * 200)),
								priority: 2
							});
					});
				}
			}
		}

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

			let towers = room.find(FIND_MY_STRUCTURES, { filter: s => {
				return s.structureType == STRUCTURE_TOWER; }});
			for (let i in towers) {
				if (towers[i].energy < towers[i].energyCapacity * 0.4) {
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
						priority: 1
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
						priority: 5
					});
				}
			}

			structures = room.find(FIND_MY_STRUCTURES, { filter: s => {
				return (s.structureType == STRUCTURE_SPAWN && s.energy < s.energyCapacity * 0.85)
					|| (s.structureType == STRUCTURE_EXTENSION && s.energy < s.energyCapacity); }});
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
					priority: 2
				});
			}
		}
	}
}