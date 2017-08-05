require("blueprint.layouts");

let _Hive = require("hive");

let Blueprint = {

	Init: function() {
		if (!_Hive.isPulse_Blueprint())
			return;

		_.each(_.filter(Game.rooms, room => { return room.controller != null && room.controller.my; }), room => {

			let sites_per_room = 5;
			let level = room.controller.level;
			let origin = _.get(Memory, ["rooms", room.name, "layout", "origin"]);
			let layout = _.get(Memory, ["rooms", room.name, "layout", "name"]);

			let sources = room.find(FIND_SOURCES);			
			let sites = room.find(FIND_MY_CONSTRUCTION_SITES).length;
			let all_structures = room.find(FIND_STRUCTURES);
			let structures = _.filter(all_structures, s => { return s.my; });

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
				if (extractors < CONTROLLER_STRUCTURES["extractor"][level] && sites < sites_per_room) {
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
				// Iterate sources, create one container adjacent to each source
				let containers = _.filter(all_structures, s => { return s.structureType == "container"; });				
				_.each(sources, source => {
					if (source.pos.findInRange(containers, 1).length == 0) {
						let adj = source.pos.getOpenTile_Adjacent();
						if (adj != null && adj.createConstructionSite("container") == OK) {							
							console.log(`<font color=\"#6065FF\">[Blueprint]</font> ${room.name} placing container at (${adj.x}, ${adj.y})`);
							sites += 1;
						}
					}						
				});			
				
				sites = Blueprint.iterateStructure(room, sites, structures, layout, origin, sites_per_room, "rampart");
				sites = Blueprint.iterateStructure(room, sites, all_structures, layout, origin, sites_per_room, "constructedWall");				
			}

			if (level >= 5) {
				// Iterate sources, create one link within 2 tiles of each source and room controller
				let links = _.filter(structures, s => { return s.structureType == "link"; });
				
				_.each(sources, source => {
					if (source.pos.findInRange(links, 2).length == 0) {
						let adj = source.pos.getOpenTile_Range(2);
						if (adj != null && adj.createConstructionSite("link") == OK) {							
							console.log(`<font color=\"#6065FF\">[Blueprint]</font> ${room.name} placing link at (${adj.x}, ${adj.y})`);
							sites += 1;
						}
					}
				});

				if (room.controller.pos.findInRange(links, 2).length < 2) {
					let adj = room.controller.pos.getOpenTile_Range(2);
					if (adj != null && adj.createConstructionSite("link") == OK) {							
						console.log(`<font color=\"#6065FF\">[Blueprint]</font> ${room.name} placing link at (${adj.x}, ${adj.y})`);
						sites += 1;
					}
				}
			}

			if (level >= 4) {
				// Create roads leading from the base to sources, room controller, and extractor
				let ramparts = _.filter(structures, s => { return s.structureType == "rampart" });
				
				let target = room.controller.pos.findClosestByPath(ramparts);
				if (target != null)
					sites = this.createRoad(room, sites, sites_per_room, room.controller.pos, target.pos)

				_.each(sources, source => {
					let target = source.pos.findClosestByPath(ramparts);
					if (target != null)
						sites = this.createRoad(room, sites, sites_per_room, source.pos, target.pos)
				});

				let extractor = _.head(_.filter(structures, s => { return s.structureType == "extractor"; }));
				if (extractor != null) {
					let target = extractor.pos.findClosestByPath(ramparts);
					if (target != null)
						sites = this.createRoad(room, sites, sites_per_room, extractor.pos, target.pos)
				}

				sites = Blueprint.iterateStructure(room, sites, all_structures, layout, origin, sites_per_room, "road");
			}
		});
	},

	iterateStructure: function(room, sites, structures, layout, origin, sites_per_room, structureType) {
		for (let i = 0; i < CONTROLLER_STRUCTURES[structureType][room.controller.level] 
				&& i < layout[structureType].length && sites < sites_per_room; i++) {
			let x = origin.x + layout[structureType][i].x;
			let y = origin.y + layout[structureType][i].y;
			let lookAt = _.head(room.lookForAt("structure", x, y));
			
			if(lookAt != null && lookAt.structureType != structureType)
				lookAt.destroy();

			if (room.createConstructionSite(x, y, structureType) == OK) {
				console.log(`<font color=\"#6065FF\">[Blueprint]</font> ${room.name} placing ${structureType} at `
					+ `(${origin.x + layout[structureType][i].x}, ${origin.y + layout[structureType][i].y})`);
				sites += 1;
			}
		}

		return sites;
	},

	createRoad: function(room, sites, sites_per_room, from, to) {

		if (from == null || to == null)
			return;

		let from_pos = new RoomPosition(from.x, from.y, room.name);
		let to_pos = new RoomPosition(to.x, to.y, room.name);
		let path = room.findPath(from_pos, to_pos, {ignoreCreeps: true});
		
		for (let i = 0; i < path.length; i++) {
			if (sites < sites_per_room && room.createConstructionSite(path[i].x, path[i].y, "road") == OK)
				sites += 1;
		}
			
		room.createConstructionSite(from_pos.x, from_pos.y, "road");
		room.createConstructionSite(to_pos.x, to_pos.y, "road");		
	}
};

module.exports = Blueprint;