let Blueprint = {
	spawn: [	{x: 2, y: 1}, {x: 2, y: 5}, {x: 2, y: 9} ],
	extension: [{x: 3, y: 3}, {x: 3, y: 7}, {x: 3, y: 11}, 
				{x: 4, y: 2}, {x: 4, y: 3}, {x: 4, y: 4}, {x: 4, y: 6}, {x: 4, y: 7}, 
				{x: 4, y: 8}, {x: 4, y: 10}, {x: 4, y: 11}, {x: 4, y: 12}, 
				{x: 5, y: 3}, {x: 5, y: 7}, {x: 5, y: 11}, 
				{x: 5, y: 1}, {x: 5, y: 5}, {x: 5, y: 9}, {x: 5, y: 13},
				{x: 6, y: 1}, {x: 6, y: 2}, {x: 6, y: 4}, {x: 6, y: 5}, {x: 6, y: 6}, 
				{x: 6, y: 8}, {x: 6, y: 9}, {x: 6, y: 10}, {x: 6, y: 12}, {x: 6, y: 13},
				{x: 7, y: 1}, {x: 7, y: 5}, {x: 7, y: 9}, {x: 7, y: 13},
				{x: 7, y: 3}, {x: 7, y: 7}, {x: 7, y: 11}, 
				{x: 8, y: 2}, {x: 8, y: 3}, {x: 8, y: 4}, {x: 8, y: 6}, {x: 8, y: 7}, 
				{x: 8, y: 8}, {x: 8, y: 10}, {x: 8, y: 11}, {x: 8, y: 12}, 
				{x: 9, y: 3}, {x: 9, y: 7}, {x: 9, y: 11}, 
				{x: 9, y: 5}, {x: 9, y: 9}, {x: 9, y: 13}, 
				{x: 10, y: 2}, {x: 10, y: 4}, {x: 10, y: 5}, {x: 10, y: 6}, {x: 10, y: 8}, 
				{x: 10, y: 9}, {x: 10, y: 10}, {x: 10, y: 12}, {x: 10, y: 13} ],
	storage: [	{x: 12, y: 3} ],
	tower: [	{x: 1, y: 3}, {x: 1, y: 7}, {x: 1, y: 11}, {x: 12, y: 10}, {x: 12, y: 13},
				{x: 14, y: 7} ],

	terminal: [	{x: 12, y: 1} ],
	lab: [		{x: 14, y: 3}, {x: 14, y: 4}, {x: 15, y: 2}, {x: 15, y: 4}, {x: 15, y: 5}, 
				{x: 16, y: 2}, {x: 16, y: 3}, {x: 16, y: 5}, {x: 17, y: 3}, {x: 17, y: 4} ],

	nuker: [	{x: 12, y: 5} ],
	observer: [	{x: 12, y: 7} ],
	powerSpawn: [{x: 2, y: 13} ],

	road: [],
	rampart: [	{x: -4, y: 6}, {x: -4, y: 7}, {x: -4, y: 8},
				{x: 1, y: -4}, {x: 2, y: -4}, {x: 3, y: -4},
				{x: 1, y: 18}, {x: 2, y: 19}, {x: 3, y: 20},
				{x: 10, y: -4}, {x: 11, y: -4}, {x: 12, y: -4},
				{x: 10, y: 18}, {x: 11, y: 18}, {x: 12, y: 18},
				{x: 22, y: 2}, {x: 22, y: 3}, {x: 22, y: 4} ],
	constructedWall: []
};

let _Hive = require("hive");

module.exports = {

	Init: function() {
		if (_Hive.isPulse_Blueprint()) {
			_.each(Game.rooms, room => {
				if (room.controller != null && room.controller.my) {

					let origin = _.get(Memory, ["rooms", rmColony, "layout_origin"]);
					let structures = room.find(FIND_MY_STRUCTURES);
					
					let spawns = _.filter(structures, s => { return s.structureType == "spawn"; }).length;
					for (let i = spawns; i < CONTROLLER_STRUCTURES.spawn[room.controller.level]; i++) {
						Room.createConstructionSite(origin.x + Blueprint["spawn"][i - 1].x, origin.y + Blueprint["spawn"][i - 1].y, "spawn");
					}
				
					let extensions = _.filter(structures, s => { return s.structureType == "extension"; }).length;
					for (let i = extensions; i < CONTROLLER_STRUCTURES.extension[room.controller.level]; i++) {
						Room.createConstructionSite(origin.x + Blueprint["extension"][i - 1].x, origin.y + Blueprint["extension"][i - 1].y, "extension");
					}

					let towers = _.filter(structures, s => { return s.structureType == "tower"; }).length;
					for (let i = towers; i < CONTROLLER_STRUCTURES.tower[room.controller.level]; i++) {
						Room.createConstructionSite(origin.x + Blueprint["tower"][i - 1].x, origin.y + Blueprint["tower"][i - 1].y, "tower");
					}
					
					let storages = _.filter(structures, s => { return s.structureType == "storage"; }).length;
					for (let i = storages; i < CONTROLLER_STRUCTURES.storage[room.controller.level]; i++) {
						Room.createConstructionSite(origin.x + Blueprint["storage"][i - 1].x, origin.y + Blueprint["storage"][i - 1].y, "storage");
					}

					let terminals = _.filter(structures, s => { return s.structureType == "terminal"; }).length;
					for (let i = terminals; i < CONTROLLER_STRUCTURES.terminal[room.controller.level]; i++) {
						Room.createConstructionSite(origin.x + Blueprint["terminal"][i - 1].x, origin.y + Blueprint["terminal"][i - 1].y, "terminal");
					}
					
					let labs = _.filter(structures, s => { return s.structureType == "lab"; }).length;
					for (let i = labs; i < CONTROLLER_STRUCTURES.lab[room.controller.level]; i++) {
						Room.createConstructionSite(origin.x + Blueprint["lab"][i - 1].x, origin.y + Blueprint["lab"][i - 1].y, "lab");
					}
					
					let observers = _.filter(structures, s => { return s.structureType == "observer"; }).length;
					for (let i = observers; i < CONTROLLER_STRUCTURES.observer[room.controller.level]; i++) {
						Room.createConstructionSite(origin.x + Blueprint["observer"][i - 1].x, origin.y + Blueprint["observer"][i - 1].y, "observer");
					}
					
					let powerSpawns = _.filter(structures, s => { return s.structureType == "powerSpawn"; }).length;
					for (let i = powerSpawns; i < CONTROLLER_STRUCTURES.powerSpawn[room.controller.level]; i++) {
						Room.createConstructionSite(origin.x + Blueprint["powerSpawn"][i - 1].x, origin.y + Blueprint["powerSpawn"][i - 1].y, "powerSpawn");
					}
					
					let ramparts = _.filter(structures, s => { return s.structureType == "rampart"; }).length;
					for (let i = ramparts; i < CONTROLLER_STRUCTURES.rampart[room.controller.level]; i++) {
						Room.createConstructionSite(origin.x + Blueprint["rampart"][i - 1].x, origin.y + Blueprint["rampart"][i - 1].y, "rampart");
					}

					let walls = _.filter(structures, s => { return s.structureType == "constructedWall"; }).length;
					for (let i = walls; i < CONTROLLER_STRUCTURES.constructedWall[room.controller.level]; i++) {
						Room.createConstructionSite(origin.x + Blueprint["constructedWall"][i - 1].x, origin.y + Blueprint["constructedWall"][i - 1].y, "constructedWall");
					}

					let roads = _.filter(structures, s => { return s.structureType == "road"; }).length;
					for (let i = roads; i < CONTROLLER_STRUCTURES.road[room.controller.level]; i++) {
						Room.createConstructionSite(origin.x + Blueprint["road"][i - 1].x, origin.y + Blueprint["road"][i - 1].y, "road");
					}
				}
			});
		}
	},
};