let Blueprint__Default_Horizontal = {
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

let Blueprint = {

	Init: function() {
		if (!_Hive.isPulse_Blueprint())
			return;

		_.each(_.filter(Game.rooms, room => { return room.controller != null && room.controller.my; }), room => {

			let level = room.controller.level;
			let origin = _.get(Memory, ["rooms", room.name, "layout_origin"]);
			let layout = Blueprint__Default_Horizontal;
			let structures = room.find(FIND_MY_STRUCTURES);
			let sites = room.find(FIND_MY_CONSTRUCTION_SITES).length;
			let sites_per_room = 5;

			if (origin == null || sites >= sites_per_room)
				return;
			
			Blueprint.iterateStructure(room, sites, structures, layout, "spawn");

			// Build the 1st base's spawn alone, as priority!
			if (_.filter(structures, s => { return s.structureType == "spawn"; }).length == 0)
				return;
					
			Blueprint.iterateStructure(room, sites, structures, layout, "extension");
			

			if (level >= 3) {
				Blueprint.iterateStructure(room, sites, structures, layout, "tower");
			}

			if (level >= 4) {
				Blueprint.iterateStructure(room, sites, structures, layout, "storage");
			}

			if (level >= 6) {
				Blueprint.iterateStructure(room, sites, structures, layout, "terminal");
				Blueprint.iterateStructure(room, sites, structures, layout, "lab");

				let extractors = _.filter(structures, s => { return s.structureType == "extractor"; }).length;
				for (let i = extractors; 
						i < CONTROLLER_STRUCTURES.extractor[level] && i < layout["extractor"].length && sites < sites_per_room; 
						i++) {
					let mineral = _.head(room.find(FIND_MINERALS));
					if (room.createConstructionSite(mineral.pos.x, mineral.pos.y, "extractor") == OK) {
						console.log(`<font color=\"#6065FF\">[Blueprint]</font> ${room.name} placing extractor at `
							+ `(${mineral.pos.x}, ${mineral.pos.y})`);
						sites += 1;
					}
				}
			}

			if (level == 8) {
				Blueprint.iterateStructure(room, sites, structures, layout, "nuker");
				Blueprint.iterateStructure(room, sites, structures, layout, "observer");
				Blueprint.iterateStructure(room, sites, structures, layout, "powerSpawn");
			}
			
			if (level >= 3) {
				Blueprint.iterateStructure(room, sites, structures, layout, "rampart");
				Blueprint.iterateStructure(room, sites, structures, layout, "constructedWall");
				
			}

			if (level >= 4) {
				Blueprint.iterateStructure(room, sites, structures, layout, "road");
			}
		});
	},

	iterateStructure: function(room, sites, structures, layout, structureType) {
		
		let sites_per_room = 5;
		let origin = _.get(Memory, ["rooms", room.name, "layout_origin"]);
		let structureCount = _.filter(structures, s => { return s.structureType == structureType; }).length;

		for (let i = structureCount; 
				i < CONTROLLER_STRUCTURES[structureType][room.controller.level] && i < layout[structureType].length && sites < sites_per_room; 
				i++) {
			if (room.createConstructionSite(origin.x + layout[structureType][i].x, origin.y + layout[structureType][i].y, structureType) == OK) {
				console.log(`<font color=\"#6065FF\">[Blueprint]</font> ${room.name} placing ${structureType} at `
					+ `(${origin.x + layout[structureType][i].x}, ${origin.y + layout[structureType][i].y})`);
				sites += 1;
			}
		}
	}
};

module.exports = Blueprint;