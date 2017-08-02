require("blueprint.layouts");

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
			
			sites = Blueprint.iterateStructure(room, sites, structures, layout, "spawn");

			// Build the 1st base's spawn alone, as priority!
			if (_.filter(structures, s => { return s.structureType == "spawn"; }).length == 0)
				return;
					
			sites = Blueprint.iterateStructure(room, sites, structures, layout, "extension");
			

			if (level >= 3) {
				sites = Blueprint.iterateStructure(room, sites, structures, layout, "tower");
			}

			if (level >= 4) {
				sites = Blueprint.iterateStructure(room, sites, structures, layout, "storage");
			}

			if (level >= 6) {
				sites = Blueprint.iterateStructure(room, sites, structures, layout, "terminal");
				sites = Blueprint.iterateStructure(room, sites, structures, layout, "lab");

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
				sites = Blueprint.iterateStructure(room, sites, structures, layout, "nuker");
				sites = Blueprint.iterateStructure(room, sites, structures, layout, "observer");
				sites = Blueprint.iterateStructure(room, sites, structures, layout, "powerSpawn");
			}
			
			if (level >= 3) {
				sites = Blueprint.iterateStructure(room, sites, structures, layout, "rampart");
				sites = Blueprint.iterateStructure(room, sites, structures, layout, "constructedWall");
				
			}

			if (level >= 4) {
				sites = Blueprint.iterateStructure(room, sites, structures, layout, "road");
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

		return sites;
	}
};

module.exports = Blueprint;