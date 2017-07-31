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
		if (!_Hive.isPulse_Blueprint())
			return;

		_.each(_.filter(Game.rooms, room => { return room.controller != null && room.controller.my; }), room => {

			let level = room.controller.level;
			let origin = _.get(Memory, ["rooms", room.name, "layout_origin"]);
			let structures = room.find(FIND_MY_STRUCTURES);
			let sites = room.find(FIND_MY_CONSTRUCTION_SITES).length;
			let sites_per_room = 5;

			if (origin == null || sites >= sites_per_room)
				return;
			
			let spawns = _.filter(structures, s => { return s.structureType == "spawn"; }).length;
			for (let i = spawns; i < CONTROLLER_STRUCTURES.spawn[level] && sites < sites_per_room; i++) {
				if (room.createConstructionSite(origin.x + Blueprint["spawn"][i].x, origin.y + Blueprint["spawn"][i].y, "spawn") == OK) {
					console.log(`<font color=\"#6065FF\">[Blueprint]</font> ${room.name} placing spawn at `
						+ `(${origin.x + Blueprint["spawn"][i].x}, ${origin.y + Blueprint["spawn"][i].y})`);
					sites += 1;
				}
			}
			if (spawns == 0)	// Build the 1st base's spawn alone, as priority!
				return;
		
			let extensions = _.filter(structures, s => { return s.structureType == "extension"; }).length;
			for (let i = extensions; i < CONTROLLER_STRUCTURES.extension[level] && sites < sites_per_room; i++) {
				if (room.createConstructionSite(origin.x + Blueprint["extension"][i].x, origin.y + Blueprint["extension"][i].y, "extension") == OK) {
					console.log(`<font color=\"#6065FF\">[Blueprint]</font> ${room.name} placing extension at `
						+ `(${origin.x + Blueprint["extension"][i].x}, ${origin.y + Blueprint["extension"][i].y})`);
					sites += 1;
				}
			}

			if (level >= 3) {
				let towers = _.filter(structures, s => { return s.structureType == "tower"; }).length;
				for (let i = towers; i < CONTROLLER_STRUCTURES.tower[level] && sites < sites_per_room; i++) {
					if (room.createConstructionSite(origin.x + Blueprint["tower"][i].x, origin.y + Blueprint["tower"][i].y, "tower") == OK) {
						console.log(`<font color=\"#6065FF\">[Blueprint]</font> ${room.name} placing tower at `
							+ `(${origin.x + Blueprint["tower"][i].x}, ${origin.y + Blueprint["tower"][i].y})`);
						sites += 1;
					}
				}
			}

			if (level >= 4) {
				let storages = _.filter(structures, s => { return s.structureType == "storage"; }).length;
				for (let i = storages; i < CONTROLLER_STRUCTURES.storage[level] && sites < sites_per_room; i++) {
					if (room.createConstructionSite(origin.x + Blueprint["storage"][i].x, origin.y + Blueprint["storage"][i].y, "storage") == OK) {
						console.log(`<font color=\"#6065FF\">[Blueprint]</font> ${room.name} placing storage at `
							+ `(${origin.x + Blueprint["storage"][i].x}, ${origin.y + Blueprint["storage"][i].y})`);
						sites += 1;
					}
				}
			}

			if (level >= 6) {
				let terminals = _.filter(structures, s => { return s.structureType == "terminal"; }).length;
				for (let i = terminals; i < CONTROLLER_STRUCTURES.terminal[level] && sites < sites_per_room; i++) {
					if (room.createConstructionSite(origin.x + Blueprint["terminal"][i].x, origin.y + Blueprint["terminal"][i].y, "terminal") == OK) {
						console.log(`<font color=\"#6065FF\">[Blueprint]</font> ${room.name} placing terminal at `
							+ `(${origin.x + Blueprint["terminal"][i].x}, ${origin.y + Blueprint["terminal"][i].y})`);
						sites += 1;
					}
				}
			
				let labs = _.filter(structures, s => { return s.structureType == "lab"; }).length;
				for (let i = labs; i < CONTROLLER_STRUCTURES.lab[level] && sites < sites_per_room; i++) {
					if (room.createConstructionSite(origin.x + Blueprint["lab"][i].x, origin.y + Blueprint["lab"][i].y, "lab") == OK) {
						console.log(`<font color=\"#6065FF\">[Blueprint]</font> ${room.name} placing lab at `
							+ `(${origin.x + Blueprint["lab"][i].x}, ${origin.y + Blueprint["lab"][i].y})`);
						sites += 1;
					}
				}


				let extractors = _.filter(structures, s => { return s.structureType == "extractor"; }).length;
				for (let i = extractors; i < CONTROLLER_STRUCTURES.extractor[level] && sites < sites_per_room; i++) {
					let mineral = _.head(room.find(FIND_MINERALS));
					if (room.createConstructionSite(mineral.pos.x, mineral.pos.y, "extractor") == OK) {
						console.log(`<font color=\"#6065FF\">[Blueprint]</font> ${room.name} placing extractor at `
							+ `(${mineral.pos.x}, ${mineral.pos.y})`);
						sites += 1;
					}
				}
			}

			if (level == 8) {
				let nukers = _.filter(structures, s => { return s.structureType == "nuker"; }).length;
				for (let i = nukers; i < CONTROLLER_STRUCTURES.nuker[level] && sites < sites_per_room; i++) {
					if (room.createConstructionSite(origin.x + Blueprint["nuker"][i].x, origin.y + Blueprint["nuker"][i].y, "nuker") == OK) {
						console.log(`<font color=\"#6065FF\">[Blueprint]</font> ${room.name} placing nuker at `
							+ `(${origin.x + Blueprint["nuker"][i].x}, ${origin.y + Blueprint["nuker"][i].y})`);
						sites += 1;
					}
				}

				let observers = _.filter(structures, s => { return s.structureType == "observer"; }).length;
				for (let i = observers; i < CONTROLLER_STRUCTURES.observer[level] && sites < sites_per_room; i++) {
					if (room.createConstructionSite(origin.x + Blueprint["observer"][i].x, origin.y + Blueprint["observer"][i].y, "observer") == OK) {
						console.log(`<font color=\"#6065FF\">[Blueprint]</font> ${room.name} placing observer at `
							+ `(${origin.x + Blueprint["observer"][i].x}, ${origin.y + Blueprint["observer"][i].y})`);
						sites += 1;
					}
				}
				
				let powerSpawns = _.filter(structures, s => { return s.structureType == "powerSpawn"; }).length;
				for (let i = powerSpawns; i < CONTROLLER_STRUCTURES.powerSpawn[level] && sites < sites_per_room; i++) {
					if (room.createConstructionSite(origin.x + Blueprint["powerSpawn"][i].x, origin.y + Blueprint["powerSpawn"][i].y, "powerSpawn") == OK) {
						console.log(`<font color=\"#6065FF\">[Blueprint]</font> ${room.name} placing power spawn at `
							+ `(${origin.x + Blueprint["powerSpawn"][i].x}, ${origin.y + Blueprint["powerSpawn"][i].y})`);
						sites += 1;
					}
				}
			}
			
			if (level >= 3) {
				let ramparts = _.filter(structures, s => { return s.structureType == "rampart"; }).length;
				for (let i = ramparts; i < CONTROLLER_STRUCTURES.rampart[level] && sites < sites_per_room; i++) {
					if (room.createConstructionSite(origin.x + Blueprint["rampart"][i].x, origin.y + Blueprint["rampart"][i].y, "rampart") == OK) {
						console.log(`<font color=\"#6065FF\">[Blueprint]</font> ${room.name} placing rampart at `
							+ `(${origin.x + Blueprint["rampart"][i].x}, ${origin.y + Blueprint["rampart"][i].y})`);
						sites += 1;
					}
				}

				let walls = _.filter(structures, s => { return s.structureType == "constructedWall"; }).length;
				for (let i = walls; i < CONTROLLER_STRUCTURES.constructedWall[level] && sites < sites_per_room; i++) {
					if (room.createConstructionSite(origin.x + Blueprint["constructedWall"][i].x, origin.y + Blueprint["constructedWall"][i].y, "constructedWall") == OK) {
						console.log(`<font color=\"#6065FF\">[Blueprint]</font> ${room.name} placing wall at `
							+ `(${origin.x + Blueprint["constructedWall"][i].x}, ${origin.y + Blueprint["constructedWall"][i].y})`);
						sites += 1;
					}
				}
			}

			if (level >= 4) {
				let roads = _.filter(structures, s => { return s.structureType == "road"; }).length;
				for (let i = roads; i < CONTROLLER_STRUCTURES.road[level] && sites < sites_per_room; i++) {
					if (room.createConstructionSite(origin.x + Blueprint["road"][i].x, origin.y + Blueprint["road"][i].y, "road") == OK) {
						console.log(`<font color=\"#6065FF\">[Blueprint]</font> ${room.name} placing road at `
							+ `(${origin.x + Blueprint["road"][i].x}, ${origin.y + Blueprint["road"][i].y})`);
						sites += 1;
					}
				}
			}
		});
	},
};