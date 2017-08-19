require("blueprint.layouts");

let _CPU = require("util.cpu");
let _Hive = require("hive");

let Blueprint = {

	Init: function() {
		/* Structure and rationale:
		 * Blueprint.Init() runs Blueprint.Pulse() which triggers between 200-1000 ticks (scales with CPU bucket). Blueprint.Init()
		 * runs on cycles, 5 total cycles, each cycle is iterated by Blueprint.Pulse() so that only 1 cycle runs per 200-1000 ticks.
		 * During each cycle, during successive ticks (tick_count), Blueprint.Run() is done on 1 room at a time, up to 5 rooms in a row
		 * (CPU intensive for high RCL rooms!!), Blueprinting all rooms is done across 5 cycles, 5 rooms at a time, mixing RCLs in each
		 * batch/cycle. This is to let the CPU bucket recover between each cycle.
		 */

		// Initiates cycle structure if non-existant (between last finish and new start); activates each cycle if pulse timer is up.
		this.Pulse();
		
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
		
		// Check if there is any cycle, or if the cycles are active/inactive
		if (_.get(Memory, ["hive", "pulses", "blueprint", "cycle"]) == null 
				|| _.get(Memory, ["hive", "pulses", "blueprint", "cycle", "active"]) == false)
			return;

		_CPU.Start("Hive", "Blueprint-Init");		

		let room_list = _.get(Memory, ["hive", "pulses", "blueprint", "cycle", "room_list"]);
		let cycle_count = _.get(Memory, ["hive", "pulses", "blueprint", "cycle", "cycle_count"]);
		let tick_count = _.get(Memory, ["hive", "pulses", "blueprint", "cycle", "tick_count"]);
		let current_room = cycle_count + (tick_count * 5);

		// Iteration has is through room_list, iterate cycle and check if all cycles are complete (then reset cycles)
		if (current_room >= room_list.length) {
			_.set(Memory, ["hive", "pulses", "blueprint", "cycle", "tick_count"], 0);
			_.set(Memory, ["hive", "pulses", "blueprint", "cycle", "cycle_count"], cycle_count + 1);
			_.set(Memory, ["hive", "pulses", "blueprint", "cycle", "active"], false);

			if ((cycle_count + 1) >= 5)
				delete Memory["hive"]["pulses"]["blueprint"]["cycle"];

			_CPU.End("Hive", "Blueprint-Init");
			return;			
		}

		let room = Game.rooms[room_list[current_room]];

		if (room == null) {
			_CPU.End("Hive", "Blueprint-Init");
			return;
		}

		_CPU.End("Hive", "Blueprint-Init");
		_CPU.Start("Hive", "Blueprint-Run");

		console.log(`<font color=\"#6065FF\">[Blueprint]</font> Cycle ${cycle_count + 1}: Running Blueprint() for ${room.name}`);
		this.Run(room);
		
		_CPU.End("Hive", "Blueprint-Run");

		Memory["hive"]["pulses"]["blueprint"]["cycle"]["tick_count"] = tick_count + 1;
	},

	Pulse: function() {
		let minTicks = 200, maxTicks = 1000;
		let range = maxTicks - minTicks;
		let lastTick = _.get(Memory, ["hive", "pulses", "blueprint", "last_tick"]);		

		if (lastTick == null
				|| Game.time == lastTick
				|| Game.time - lastTick >= (minTicks + Math.floor((1 - (Game.cpu.bucket / 10000)) * range))) {
			_.set(Memory, ["hive", "pulses", "blueprint", "last_tick"], Game.time); 

			if (_.get(Memory, ["hive", "pulses", "blueprint", "cycle"]) == null) {
				let rooms = _.sortBy(_.filter(Object.keys(Game.rooms), 
					n => { return Game.rooms[n].controller != null && Game.rooms[n].controller.my; }), 
					n => { return Game.rooms[n].controller.level; });
				_.set(Memory, ["hive", "pulses", "blueprint", "cycle"], {cycle_count: 0, tick_count: 0, room_list: rooms });
			} else {
				_.set(Memory, ["hive", "pulses", "blueprint", "cycle", "active"], true);
			}
		} 
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
				
				for (let i = 0; i < sources.length && i < (CONTROLLER_STRUCTURES["link"][room.controller.level] - 1); i++) {
					let source = sources[i];
					if (sites < sites_per_room && source.pos.findInRange(links, 2).length == 0) {
						let adj = source.pos.getOpenTile_Path(2);
						if (adj != null && adj.createConstructionSite("link") == OK) {							
							console.log(`<font color=\"#6065FF\">[Blueprint]</font> ${room.name} placing link at (${adj.x}, ${adj.y})`);
							links.push(new Object());
							sites += 1;
						}
					}
				};

				if (sites < sites_per_room && links.length < CONTROLLER_STRUCTURES["link"][room.controller.level]
						&& room.controller.pos.findInRange(links, 2).length < 2) {
					let adj = room.controller.pos.getOpenTile_Path(2);
					if (adj != null && adj.createConstructionSite("link") == OK) {							
						console.log(`<font color=\"#6065FF\">[Blueprint]</font> ${room.name} placing link at (${adj.x}, ${adj.y})`);
						links.push(new Object());
						sites += 1;
					}
				}
			}
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

		if (level >= 7) {
			// Builds links near storage last (facilitate upgrading controller before filling storage...)
			sites = Blueprint.iterateStructure(room, sites, structures, layout, origin, sites_per_room, blocked_areas, "link");
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
		
		for (let i = 0; sites < sites_per_room && i < CONTROLLER_STRUCTURES[structureType][room.controller.level] 
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
				let lookAt = room.lookForAt("structure", x, y);
				if (lookAt.length > 0 && _.findIndex(lookAt, s => { return s.structureType == structureType }) < 0)
					_.head(lookAt).destroy();
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