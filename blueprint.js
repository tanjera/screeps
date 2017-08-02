require("blueprint.layouts");

let _Hive = require("hive");

let Blueprint = {

	Init: function() {
		if (!_Hive.isPulse_Blueprint())
			return;

		_.each(_.filter(Game.rooms, room => { return room.controller != null && room.controller.my; }), room => {

			let level = room.controller.level;
			let origin = _.get(Memory, ["rooms", room.name, "layout", "origin"]);
			let layout = _.get(Memory, ["rooms", room.name, "layout", "name"]);
			let structures = room.find(FIND_MY_STRUCTURES);
			let sites = room.find(FIND_MY_CONSTRUCTION_SITES).length;
			let sites_per_room = 5;

			if (origin == null || sites >= sites_per_room)
				return;
			
			switch (layout) {
				default:
				case "default_horizontal":
					layout = Blueprint__Default_Horizontal;
					break;
				case "default_vertical":
					layout = Blueprint__Default_Vertical;
					break;
			}


			sites = Blueprint.iterateStructure(room, sites, structures, layout, origin, sites_per_room, "spawn");

			// Build the 1st base's spawn alone, as priority!
			if (_.filter(structures, s => { return s.structureType == "spawn"; }).length == 0)
				return;
					
			sites = Blueprint.iterateStructure(room, sites, structures, layout, origin, sites_per_room, "extension");
			

			if (level >= 3) {
				sites = Blueprint.iterateStructure(room, sites, structures, layout, origin, sites_per_room, "tower");
			}

			if (level >= 4) {
				sites = Blueprint.iterateStructure(room, sites, structures, layout, origin, sites_per_room, "storage");
			}

			if (level >= 6) {
				sites = Blueprint.iterateStructure(room, sites, structures, layout, origin, sites_per_room, "terminal");
				sites = Blueprint.iterateStructure(room, sites, structures, layout, origin, sites_per_room, "lab");

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
				sites = Blueprint.iterateStructure(room, sites, structures, layout, origin, sites_per_room, "nuker");
				sites = Blueprint.iterateStructure(room, sites, structures, layout, origin, sites_per_room, "observer");
				sites = Blueprint.iterateStructure(room, sites, structures, layout, origin, sites_per_room, "powerSpawn");
			}
			
			if (level >= 3) {
				sites = Blueprint.iterateStructure(room, sites, structures, layout, origin, sites_per_room, "rampart");
				sites = Blueprint.iterateStructure(room, sites, structures, layout, origin, sites_per_room, "constructedWall");
				
			}

			if (level >= 4) {
				sites = Blueprint.iterateStructure(room, sites, structures, layout, origin, sites_per_room, "road");
			}
		});
	},

	iterateStructure: function(room, sites, structures, layout, origin, sites_per_room, structureType) {

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

		return sites;
	}
};

module.exports = Blueprint;