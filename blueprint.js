require("blueprint.layouts");

let _CPU = require("util.cpu");
let _Hive = require("hive");

let Blueprint = {

	Init: function() {
		_Hive.Pulse_Blueprint();

		if (_.get(Memory, ["pulses", "blueprint", "room_list"]) == null 
				|| _.get(Memory, ["pulses", "blueprint", "room_current"]) == null)
			return;
		
		_CPU.Start("Hive", "Blueprint");

		let room;
		let room_list = _.get(Memory, ["pulses", "blueprint", "room_list"]);
		let room_current = _.get(Memory, ["pulses", "blueprint", "room_current"]);		
		room = Game.rooms[room_list[room_current]];

		if (room == null)
			return;

		console.log(`<font color=\"#6065FF\">[Blueprint]</font> Running blueprint for ${room.name}`);
		this.Run(room);

		if (room_current < (room_list.length - 1)) {
			_.set(Memory, ["pulses", "blueprint", "room_current"], (room_current + 1));
		} else {
			_.set(Memory, ["pulses", "blueprint", "room_list"], null);
			_.set(Memory, ["pulses", "blueprint", "room_current"], null);
		}
		
		_CPU.End("Hive", "Blueprint");
	},

	Run: function(room) {
		if (room.controller == null && !room.controller.my)
			return;

		let sites_per_room = 5;
		let level = room.controller.level;
		let origin = _.get(Memory, ["rooms", room.name, "layout", "origin"]);
		let layout = _.get(Memory, ["rooms", room.name, "layout", "name"]);
		let blocked_areas = _.get(Memory, ["rooms", room.name, "layout", "blocked_areas"]);

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
			case "default_compact":
				layout = Blueprint__Default_Compact;
				break;
			case "compact_horizontal":
				layout = Blueprint__Compact_Horizontal;
				break;
		}

		// Build the 1st base's spawn alone, as priority!
		sites = Blueprint.iterateStructure(room, sites, structures, layout, origin, sites_per_room, blocked_areas, "spawn");
		if (_.filter(structures, s => { return s.structureType == "spawn"; }).length == 0)
			return;
				
		// Order by priority; defense, then increased creep capacity
		sites = Blueprint.iterateStructure(room, sites, structures, layout, origin, sites_per_room, blocked_areas, "tower");
		sites = Blueprint.iterateStructure(room, sites, structures, layout, origin, sites_per_room, blocked_areas, "extension");
		
		if (level >= 3) {
			// Iterate sources, create one container adjacent to each source
			if (sites < sites_per_room) {
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
			}
			
			// Only build walls and ramparts after tower, containers
			sites = Blueprint.iterateStructure(room, sites, structures, layout, origin, sites_per_room, blocked_areas, "rampart");
			sites = Blueprint.iterateStructure(room, sites, all_structures, layout, origin, sites_per_room, blocked_areas, "constructedWall");				
		}

		// Ordered by priority; lower priority than defensive structures (in case high RCL rebuilding after attack)
		sites = Blueprint.iterateStructure(room, sites, structures, layout, origin, sites_per_room, blocked_areas, "storage");
		sites = Blueprint.iterateStructure(room, sites, structures, layout, origin, sites_per_room, blocked_areas, "terminal");
		if (sites < sites_per_room && this.atMaxStructureCount(room, structures, layout, "terminal") && this.atMaxStructureCount(room, structures, layout, "nuker"))
			sites = Blueprint.iterateStructure(room, sites, structures, layout, origin, sites_per_room, blocked_areas, "lab");
		
		sites = Blueprint.iterateStructure(room, sites, structures, layout, origin, sites_per_room, blocked_areas, "nuker");
		if (sites < sites_per_room && this.atMaxStructureCount(room, structures, layout, "nuker"))
			sites = Blueprint.iterateStructure(room, sites, structures, layout, origin, sites_per_room, blocked_areas, "observer");
		if (sites < sites_per_room && this.atMaxStructureCount(room, structures, layout, "observer"))
			sites = Blueprint.iterateStructure(room, sites, structures, layout, origin, sites_per_room, blocked_areas, "powerSpawn");

		if (level >= 4) {
			// Create roads leading from the base to sources, room controller
			if (sites < sites_per_room) {
				let target = room.controller.pos.findClosestByPath(ramparts);
				if (target != null)
					sites = this.createRoad(room, sites, sites_per_room, room.controller.pos, target.pos)
			}

			_.each(sources, source => {
				if (sites < sites_per_room) {
					let target = source.pos.findClosestByPath(ramparts);
					if (target != null)
						sites = this.createRoad(room, sites, sites_per_room, source.pos, target.pos)
				}
			});
		}

		if (level >= 5) {
			// Only build roads at level 5 to allow extensions, tower, and walls to be built
			sites = Blueprint.iterateStructure(room, sites, all_structures, layout, origin, sites_per_room, blocked_areas, "road");
		
			// Iterate sources, create one link within 2 tiles of each source and room controller
			if (sites < sites_per_room) {
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
		}

		if (level >= 6) {
			if (sites < sites_per_room) {
				let extractors = _.filter(structures, s => { return s.structureType == "extractor"; }).length;
				if (extractors < CONTROLLER_STRUCTURES["extractor"][level]) {
					let mineral = _.head(room.find(FIND_MINERALS));
					if (room.createConstructionSite(mineral.pos.x, mineral.pos.y, "extractor") == OK) {
						console.log(`<font color=\"#6065FF\">[Blueprint]</font> ${room.name} placing extractor at `
							+ `(${mineral.pos.x}, ${mineral.pos.y})`);
						sites += 1;
					}
				}
			}

			// Create roads leading from the base to extractor
			if (sites < sites_per_room) {
				let extractor = _.head(_.filter(structures, s => { return s.structureType == "extractor"; }));
				if (extractor != null) {
					let target = extractor.pos.findClosestByPath(ramparts);
					if (target != null)
						sites = this.createRoad(room, sites, sites_per_room, extractor.pos, target.pos)
				}
			}
		}

		if (level == 8) {
			// Build ramparts over major structures
			if (sites < sites_per_room) {
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
		}
	},

	atMaxStructureCount: function(room, structures, layout, structureType) {
		let count = _.filter(structures, s => { return s.structureType == structureType; }).length;
		return count == CONTROLLER_STRUCTURES[structureType][room.controller.level] || count == layout[structureType].length;
	},

	iterateStructure: function(room, sites, structures, layout, origin, sites_per_room, blocked_areas, structureType) {
		if (sites >= sites_per_room)
			return sites;
		
		for (let i = 0; sites < sites_per_room && i < CONTROLLER_STRUCTURES[structureType][room.controller.level] 
				&& i < layout[structureType].length; i++) {
			let x = origin.x + layout[structureType][i].x;
			let y = origin.y + layout[structureType][i].y;

			if (x < 1 || x > 48 || y < 1 || y > 48)
				continue;

			let blocked = false;

			if (blocked_areas != null) {
				for (let b = 0; b < blocked_areas.length; b++) {
					let area = blocked_areas[b];
					if (x >= _.get(area, ["start", "x"]) && x <= _.get(area, ["end", "x"])
							&& y >= _.get(area, ["start", "y"]) && y <= _.get(area, ["end", "y"])) {
						blocked = true;
					}
				}
			}

			if (blocked)
				continue;		

			let lookAt = room.lookForAt("structure", x, y);
			if (lookAt.length > 0 && _.findIndex(lookAt, s => { return s.structureType == structureType }) < 0)
				_.head(lookAt).destroy();

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

		let road = 0;
		let from_pos = new RoomPosition(from.x, from.y, room.name);
		let to_pos = new RoomPosition(to.x, to.y, room.name);
		let path = room.findPath(from_pos, to_pos, {ignoreCreeps: true});
		
		for (let i = 0; i < path.length; i++)
			road += (((sites + road) < sites_per_room && room.createConstructionSite(path[i].x, path[i].y, "road") == OK) ? 1 : 0);					
		
		if ((sites + road + 1) < sites_per_room) {
			road += (room.createConstructionSite(from_pos.x, from_pos.y, "road") == OK ? 1 : 0);
			road += (room.createConstructionSite(to_pos.x, to_pos.y, "road") == OK ? 1 : 0);			
		}

		if (road > 0) {
			console.log(`<font color=\"#6065FF\">[Blueprint]</font> ${room.name} placed ${road} construction sites for a road `
				+ `from (${from_pos.x}, ${from_pos.y}) to (${to_pos.x}, ${to_pos.y})`);
			sites += road;
		}
		return sites;
	}
};

module.exports = Blueprint;