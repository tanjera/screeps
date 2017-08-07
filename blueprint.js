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
			let ramparts = _.filter(structures, s => { return s.structureType == "rampart" });

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

			// Build the 1st base's spawn alone, as priority!
			sites = Blueprint.iterateStructure(room, sites, structures, layout, origin, sites_per_room, "spawn");
			if (_.filter(structures, s => { return s.structureType == "spawn"; }).length == 0)
				return;
					
			// Order by priority; defense, then increased creep capacity
			sites = Blueprint.iterateStructure(room, sites, structures, layout, origin, sites_per_room, "tower");
			sites = Blueprint.iterateStructure(room, sites, structures, layout, origin, sites_per_room, "extension");
			
			if (level >= 3) {
				// Iterate sources, create one container adjacent to each source
				let containers = _.filter(all_structures, s => { return s.structureType == "container"; });				
				_.each(sources, source => {
					if (sites < sites_per_room && source.pos.findInRange(containers, 1).length == 0) {
						let adj = source.pos.getOpenTile_Adjacent();
						if (adj != null && adj.createConstructionSite("container") == OK) {							
							console.log(`<font color=\"#6065FF\">[Blueprint]</font> ${room.name} placing container at (${adj.x}, ${adj.y})`);
							sites += 1;
						}
					}						
				});			
				
				// Only build walls and ramparts after tower, containers
				sites = Blueprint.iterateStructure(room, sites, structures, layout, origin, sites_per_room, "rampart");
				sites = Blueprint.iterateStructure(room, sites, all_structures, layout, origin, sites_per_room, "constructedWall");				
			}

			// Ordered by priority; lower priority than defensive structures (in case high RCL rebuilding after attack)
			sites = Blueprint.iterateStructure(room, sites, structures, layout, origin, sites_per_room, "storage");
			sites = Blueprint.iterateStructure(room, sites, structures, layout, origin, sites_per_room, "terminal");
			sites = Blueprint.iterateStructure(room, sites, structures, layout, origin, sites_per_room, "lab");
			sites = Blueprint.iterateStructure(room, sites, structures, layout, origin, sites_per_room, "nuker");
			sites = Blueprint.iterateStructure(room, sites, structures, layout, origin, sites_per_room, "observer");
			sites = Blueprint.iterateStructure(room, sites, structures, layout, origin, sites_per_room, "powerSpawn");

			if (level >= 4) {
				// Create roads leading from the base to sources, room controller
				let target = room.controller.pos.findClosestByPath(ramparts);
				if (target != null)
					sites = this.createRoad(room, sites, sites_per_room, room.controller.pos, target.pos)

				_.each(sources, source => {
					let target = source.pos.findClosestByPath(ramparts);
					if (target != null)
						sites = this.createRoad(room, sites, sites_per_room, source.pos, target.pos)
				});

				// Only build roads at level 4 to allow extensions, tower, and walls to be built
				sites = Blueprint.iterateStructure(room, sites, all_structures, layout, origin, sites_per_room, "road");
			}

			if (level >= 5) {
				// Iterate sources, create one link within 2 tiles of each source and room controller
				let links = _.filter(structures, s => { return s.structureType == "link"; });
				
				_.each(sources, source => {
					if (sites < sites_per_room && source.pos.findInRange(links, 2).length == 0) {
						let adj = source.pos.getOpenTile_Range(2);
						if (adj != null && adj.createConstructionSite("link") == OK) {							
							console.log(`<font color=\"#6065FF\">[Blueprint]</font> ${room.name} placing link at (${adj.x}, ${adj.y})`);
							sites += 1;
						}
					}
				});

				if (sites < sites_per_room && room.controller.pos.findInRange(links, 2).length < 2) {
					let adj = room.controller.pos.getOpenTile_Range(2);
					if (adj != null && adj.createConstructionSite("link") == OK) {							
						console.log(`<font color=\"#6065FF\">[Blueprint]</font> ${room.name} placing link at (${adj.x}, ${adj.y})`);
						sites += 1;
					}
				}
			}

			if (level >= 6) {
				let extractors = _.filter(structures, s => { return s.structureType == "extractor"; }).length;
				if (sites < sites_per_room && extractors < CONTROLLER_STRUCTURES["extractor"][level]) {
					let mineral = _.head(room.find(FIND_MINERALS));
					if (room.createConstructionSite(mineral.pos.x, mineral.pos.y, "extractor") == OK) {
						console.log(`<font color=\"#6065FF\">[Blueprint]</font> ${room.name} placing extractor at `
							+ `(${mineral.pos.x}, ${mineral.pos.y})`);
						sites += 1;
					}
				}

				// Create roads leading from the base to extractor
				let extractor = _.head(_.filter(structures, s => { return s.structureType == "extractor"; }));
				if (extractor != null) {
					let target = extractor.pos.findClosestByPath(ramparts);
					if (target != null)
						sites = this.createRoad(room, sites, sites_per_room, extractor.pos, target.pos)
				}
			}

			if (level == 8) {
				// Build ramparts over major structures
				_.each(structures, structure => {
					if (sites < sites_per_room && structure.structureType == "spawn" || structure.structureType == "tower"
							|| structure.structureType == "storage" || structure.structureType == "terminal"
							|| structure.structureType == "nuker" || structure.structureType == "powerSpawn") {
						if (room.createConstructionSite(structure.pos.x, structure.pos.y, "rampart") == OK) {
							console.log(`<font color=\"#6065FF\">[Blueprint]</font> ${room.name} placing rampart over `
								+ `${structure.structureType} at (${structure.pos.x}, ${structure.pos.y})`);
							sites += 1;
						}
					}
				});
			}
		});
	},

	iterateStructure: function(room, sites, structures, layout, origin, sites_per_room, structureType) {
		for (let i = 0; sites < sites_per_room && i < CONTROLLER_STRUCTURES[structureType][room.controller.level] 
				&& i < layout[structureType].length; i++) {
			let x = origin.x + layout[structureType][i].x;
			let y = origin.y + layout[structureType][i].y;

			if (x < 1 || x > 48 || y < 1 || y > 48)
				continue;

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
		
		if ((sites + 1) < sites_per_room) {
			room.createConstructionSite(from_pos.x, from_pos.y, "road");
			room.createConstructionSite(to_pos.x, to_pos.y, "road");
			sites += 2;
		}

		return sites;
	}
};

module.exports = Blueprint;