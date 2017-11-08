_Tasks = require("tasks");

module.exports = {

	compileTasks: function (rmName) {
		let room = Game.rooms[rmName];
		let am_owner = _.get(room, ["controller", "my"], false);
		let mining_colony = _.get(Memory, ["sites", "mining", rmName, "colony"]);
		let room_level = mining_colony == null || Game.rooms[mining_colony] == null
			? (am_owner ? room.controller.getLevel() : 0)
			: Game.rooms[mining_colony].getLevel();
		let is_safe = _.get(Memory, ["rooms", rmName, "defense", "is_safe"]);
		
		let all_structures = room.find(FIND_STRUCTURES);
		let my_structures = _.filter(all_structures, s => { return s.my; });
		let carry_capacity = (mining_colony == null || Game.rooms[mining_colony] == null)
			? [ 1000, 150, 200, 400, 650, 900, 1200, 1650, 1650 ]
			: [ 1000, 150, 200, 300, 500, 700, 900, 1250, 1250 ];
			





		
		/* Containers */

		let containers = _.filter(all_structures, s => { return s.structureType == STRUCTURE_CONTAINER; });
		
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
						timer: 60,
						creeps: 10,
						priority: 9
					});
			}


		/* Storage */

		let storage = _.head(_.filter(my_structures, s => { return s.structureType == "storage"; }));
		if (storage != null) {

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
						timer: 60,
						creeps: 60,
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
					timer: 60,
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
							timer: 60,
							creeps: 1,
							priority: 5
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
							timer: 60,
							creeps: (room_level > 6 ? 1 : 2),
							priority: 3
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
						timer: 60,
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
						timer: 60,
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
						timer: 60,
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
						timer: 60,
						creeps: 1,
						priority: 3
					});
				}
			}
		}
	}
}