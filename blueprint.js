require("blueprint.layouts");

let _CPU = require("util.cpu");
let _Hive = require("hive");

let Blueprint = {

	Init: function() {
		// Process special blueprint requests (from console) immediately, effectively pausing cycles/pulses by 1 tick.
		if (_.get(Memory, ["hive", "pulses", "blueprint", "request"]) != null) {
			let room = Game.rooms[_.get(Memory, ["hive", "pulses", "blueprint", "request"])];

			if (room == null) {
				console.log(`<font color=\"#6065FF\">[Blueprint]</font> Blueprint() request for ${_.get(Memory, ["hive", "pulses", "blueprint", "request"])} failed; unable to find in Game.rooms.`);
			} else {
				_CPU.Start("Hive", "Blueprint-Run");
				console.log(`<font color=\"#6065FF\">[Blueprint]</font> Processing requested Blueprint() for ${room.name}`);
				this.Run(room);
				_CPU.End("Hive", "Blueprint-Run");
			}

			delete Memory["hive"]["pulses"]["blueprint"]["request"];
			return;
		}

		// Only proceed if it's a pulse tick
		if (!isPulse_Blueprint())
			return;

		// Initiates cycle structure if non-existant (between last finish and new start)
		if (_.get(Memory, ["hive", "pulses", "blueprint", "cycle"]) == null) {
			let rooms = _.filter(Object.keys(Game.rooms),
				n => { return Game.rooms[n].controller != null && Game.rooms[n].controller.my; });
			_.set(Memory, ["hive", "pulses", "blueprint", "cycle"], {room_iter: 0, room_list: rooms });
		}

		let room_list = _.get(Memory, ["hive", "pulses", "blueprint", "cycle", "room_list"]);
		let room_iter = _.get(Memory, ["hive", "pulses", "blueprint", "cycle", "room_iter"]);

		_CPU.Start("Hive", "Blueprint-Run");
		let room = (room_iter < room_list.length ? Game.rooms[room_list[room_iter]] : null);
		if (room != null) {
			console.log(`<font color=\"#6065FF\">[Blueprint]</font> ${room_iter + 1}/${room_list.length}: Running Blueprint() for ${room.name}`);
			this.Run(room);			// Run blueprinting for this room
		}

		// Iterate, then check if iteration is complete (and reset cycles)
		room_iter += 1;
		if (room_iter == room_list.length)
			delete Memory["hive"]["pulses"]["blueprint"]["cycle"];
		else
			_.set(Memory, ["hive", "pulses", "blueprint", "cycle", "room_iter"], room_iter);

		_CPU.End("Hive", "Blueprint-Run");
	},

	Run: function(room) {
		if (room.controller == null && !room.controller.my)
			return;

		let sites_per_room = 10;
		let level = room.controller.level;
		let origin = _.get(Memory, ["rooms", room.name, "layout", "origin"]);
		let layout = _.get(Memory, ["rooms", room.name, "layout", "name"]);
		let blocked_areas = _.get(Memory, ["rooms", room.name, "layout", "blocked_areas"]);

		let sources = room.find(FIND_SOURCES);
		let mineral = _.head(room.find(FIND_MINERALS));
		let sites = room.find(FIND_MY_CONSTRUCTION_SITES).length;
		let all_structures = room.find(FIND_STRUCTURES);
		let structures = _.filter(all_structures, s => { return s.my; });
		let ramparts = _.filter(structures, s => { return s.structureType == "rampart" });

		if (origin == null || sites >= sites_per_room)
			return;

		switch (layout) {
			default:
			case "def_hor":
				layout = Blueprint__Default_Horizontal;
				break;
			case "def_hor_w":
				layout = Blueprint__Default_Horizontal__Walled;
				break;
			case "def_vert":
				layout = Blueprint__Default_Vertical;
				break;
			case "def_vert_w":
				layout = Blueprint__Default_Vertical__Walled;
				break;
			case "def_comp":
				layout = Blueprint__Default_Compact;
				break;
			case "def_comp_w":
				layout = Blueprint__Default_Compact__Walled;
				break;
			case "comp_hor":
				layout = Blueprint__Compact_Horizontal;
				break;
			case "comp_hor_w":
				layout = Blueprint__Compact_Horizontal__Walled;
				break;
		}

		// Block areas around sources, minerals, and the room controller; prevents cycle of building and destroying.
		if (blocked_areas == null) Memory["rooms"][room.name]["layout"]["blocked_areas"] = [];

		_.each(sources, s => {
			if (_.filter(blocked_areas, a => {
					return _.get(a, ["start", "x"]) == s.pos.x -1 && _.get(a, ["start", "y"]) == s.pos.y - 1
					&& _.get(a, ["end", "x"]) == s.pos.x + 1 && _.get(a, ["end", "y"]) == s.pos.y + 1; }).length == 0) {
				Memory["rooms"][room.name]["layout"]["blocked_areas"].push(
					{start: {x: (s.pos.x - 1), y: (s.pos.y - 1)}, end: {x: (s.pos.x + 1), y: (s.pos.y + 1)}});
				console.log(`<font color=\"#6065FF\">[Blueprint]</font> Blocking area in ${room.name} for source around (${s.pos.x}, ${s.pos.y}).`);
			}
		});

		if (mineral != null && _.filter(blocked_areas, a => {
				return _.get(a, ["start", "x"]) == mineral.pos.x - 1 && _.get(a, ["start", "y"]) == mineral.pos.y - 1
				&& _.get(a, ["end", "x"]) == mineral.pos.x + 1 && _.get(a, ["end", "y"]) == mineral.pos.y + 1; }).length == 0) {
			Memory["rooms"][room.name]["layout"]["blocked_areas"].push(
				{start: {x: (mineral.pos.x - 1), y: (mineral.pos.y - 1)}, end: {x: (mineral.pos.x + 1), y: (mineral.pos.y + 1)}});
			console.log(`<font color=\"#6065FF\">[Blueprint]</font> Blocking area in ${room.name} for mineral around (${mineral.pos.x}, ${mineral.pos.y}).`);
		}

		if (_.filter(blocked_areas, a => {
				return _.get(a, ["start", "x"]) == room.controller.pos.x - 1 && _.get(a, ["start", "y"]) == room.controller.pos.y - 1
				&& _.get(a, ["end", "x"]) == room.controller.pos.x + 1 && _.get(a, ["end", "y"]) == room.controller.pos.y + 1; }).length == 0) {
			Memory["rooms"][room.name]["layout"]["blocked_areas"].push(
				{start: {x: (room.controller.pos.x - 1), y: (room.controller.pos.y - 1)}, end: {x: (room.controller.pos.x + 1), y: (room.controller.pos.y + 1)}});
			console.log(`<font color=\"#6065FF\">[Blueprint]</font> Blocking area in ${room.name} for room controller around (${room.controller.pos.x}, ${room.controller.pos.y}).`);
		}

		// If colonization focused on rapidly building defenses (RCL 3), don't place anything until tower is built
		if (level <= 3 && _.get(Memory, ["rooms", room.name, "focus_defense"]) == true) {
			sites = Blueprint.iterateStructure(room, sites, structures, layout, origin, sites_per_room, blocked_areas, "tower");
			if (level < 3 || !this.atMaxStructureCount(room, structures, layout, "tower"))
				return;
			else
				delete Memory["rooms"][room.name]["focus_defense"];
		}

		// Build the 1st base's spawn alone, as priority!
		sites = Blueprint.iterateStructure(room, sites, structures, layout, origin, sites_per_room, blocked_areas, "spawn");
		if (_.filter(structures, s => { return s.structureType == "spawn"; }).length == 0)
			return;

		// Order by priority; defense, then increased creep capacity
		sites = Blueprint.iterateStructure(room, sites, structures, layout, origin, sites_per_room, blocked_areas, "tower");
		sites = Blueprint.iterateStructure(room, sites, structures, layout, origin, sites_per_room, blocked_areas, "extension");

		if (level >= 3) {
			// Iterate sources, create two containers adjacent to each source
			if (sites < sites_per_room) {
				let containers = _.filter(all_structures, s => { return s.structureType == "container"; });
				_.each(sources, source => {
					if (sites < sites_per_room && source.pos.findInRange(containers, 1).length < 2) {
						let adj = source.pos.getBuildableTile_Adjacent();
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
		if (sites < sites_per_room && this.atMaxStructureCount(room, structures, layout, "extractor"))
			sites = Blueprint.iterateStructure(room, sites, structures, layout, origin, sites_per_room, blocked_areas, "terminal");
		if (sites < sites_per_room && this.atMaxStructureCount(room, structures, layout, "terminal")
				&& this.atMaxStructureCount(room, structures, layout, "nuker"))
			sites = Blueprint.iterateStructure(room, sites, structures, layout, origin, sites_per_room, blocked_areas, "lab");

		sites = Blueprint.iterateStructure(room, sites, structures, layout, origin, sites_per_room, blocked_areas, "nuker");
		if (sites < sites_per_room && this.atMaxStructureCount(room, structures, layout, "nuker"))
			sites = Blueprint.iterateStructure(room, sites, structures, layout, origin, sites_per_room, blocked_areas, "observer");
		if (sites < sites_per_room && this.atMaxStructureCount(room, structures, layout, "observer"))
			sites = Blueprint.iterateStructure(room, sites, structures, layout, origin, sites_per_room, blocked_areas, "powerSpawn");

		if (level >= 5) {
			/* Building links... order to build:
			 * RCL 5 (x2): 1 @ source; 1 @ storage
			 * RCL 6 (x3): 2 @ sources; 1 @ storage
			 * RCL 7 (x4): 2 @ sources; 1 @ storage; 1 @ controller
			 * RCL 8 (x6): 2 @ sources; 2 @ storage; 2 @ controller
			 * In 1 source rooms, start at controller at 1 RCL lower
			 */

			let links = _.filter(structures, s => { return s.structureType == "link"; });
			if (sites < sites_per_room) {
				// Build links near sources
				for (let i = 0; i < (level == 5 ? 1 : sources.length); i++) {
					let source = sources[i];
					if (sites < sites_per_room && source.pos.findInRange(links, 2).length == 0) {
						let adj = source.pos.getOpenTile_Path(2);
						if (adj != null && adj.createConstructionSite("link") == OK) {
							console.log(`<font color=\"#6065FF\">[Blueprint]</font> ${room.name} placing link at (${adj.x}, ${adj.y})`);
							sites += 1;
						}
					}
				};

				let cont_links;
				switch (level) {
					default: cont_links = 0; break;
					case 6: cont_links = (sources.length == 1 ? 1 : 0); break;
					case 7: cont_links = (sources.length == 1 ? 2 : 1); break;
					case 8: cont_links = 2; break;
				}

				// Build links near room controller
				if (sites < sites_per_room && room.controller.pos.findInRange(links, 2).length < cont_links) {
					let adj = room.controller.pos.getOpenTile_Path(2);
					if (adj != null && adj.createConstructionSite("link") == OK) {
						console.log(`<font color=\"#6065FF\">[Blueprint]</font> ${room.name} placing link at (${adj.x}, ${adj.y})`);
						sites += 1;
					}
				}
			}

			sites = Blueprint.iterateStructure(room, sites, structures, layout, origin, sites_per_room, blocked_areas, "link");

			// Only build roads at level 5 to allow extensions, tower, and walls to be built
			sites = Blueprint.iterateStructure(room, sites, all_structures, layout, origin, sites_per_room, blocked_areas, "road");
		}

		if (level >= 6) {
			if (sites < sites_per_room && mineral != null) {
				let extractors = _.filter(structures, s => { return s.structureType == "extractor"; }).length;
				if (extractors < CONTROLLER_STRUCTURES["extractor"][level]) {
					if (room.createConstructionSite(mineral.pos.x, mineral.pos.y, "extractor") == OK) {
						console.log(`<font color=\"#6065FF\">[Blueprint]</font> ${room.name} placing extractor at `
							+ `(${mineral.pos.x}, ${mineral.pos.y})`);
						sites += 1;
					}
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
		return count == CONTROLLER_STRUCTURES[structureType][room.controller.level]
			|| (layout[structureType] == null ? false : count == layout[structureType].length);
	},

	iterateStructure: function(room, sites, structures, layout, origin, sites_per_room, blocked_areas, structureType) {
		if (sites >= sites_per_room)
			return sites;

		let iterate_error = 0;
		for (let i = 0; sites < sites_per_room && i < CONTROLLER_STRUCTURES[structureType][room.controller.level] + iterate_error
				&& layout[structureType] != null && i < layout[structureType].length; i++) {
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

			let result = room.createConstructionSite(x, y, structureType);
			if (result == OK) {
				console.log(`<font color=\"#6065FF\">[Blueprint]</font> ${room.name} placing ${structureType} at `
					+ `(${origin.x + layout[structureType][i].x}, ${origin.y + layout[structureType][i].y})`);
				sites += 1;
			} else if (result == ERR_INVALID_TARGET) {
				let lookTerrain = room.lookForAt("terrain", x, y);
				if (lookTerrain == "wall") {
					iterate_error += 1;
					continue;
				}

				let lookStructure = room.lookForAt("structure", x, y);
				if (lookStructure.length > 0 && _.findIndex(lookStructure, s => { return s.structureType == structureType }) < 0) {
					_.head(lookStructure).destroy();
					i -= 1;
					continue;
				}
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