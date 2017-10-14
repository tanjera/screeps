let Sites = require("sites");
let _CPU = require("util.cpu");

let Hive = {

	setPulse: function(key, minTicks, maxTicks) {
		let range = maxTicks - minTicks;
		let lastTick = _.get(Memory, ["hive", "pulses", key, "last_tick"]);

		if (lastTick == null
				|| Game.time == lastTick
				|| (Game.time - lastTick) >= (minTicks + Math.floor((1 - (Game.cpu.bucket / 10000)) * range))) {
			_.set(Memory, ["hive", "pulses", key, "last_tick"], Game.time);
			_.set(Memory, ["hive", "pulses", key, "active"], true);
		} else {
			_.set(Memory, ["hive", "pulses", key, "active"], false);
		}
	},

	moveReusePath: function() {
		let minTicks = 15, maxTicks = 60;
		let range = maxTicks - minTicks;
		return minTicks + Math.floor((1 - (Game.cpu.bucket / 10000)) * range);
	},

	moveRequestPath: function(creep) {
		// Note: needs to return odd number to traverse edge tiles
		// Also: Fluctuating tick amounts gets creeps stuck on edge tiles
		let minTicks = 3, maxTicks = 15;
		let role = _.get(creep, ["memory", "role"]);

		if (creep.pos.isEdge()) {
			minTicks = 3;
			maxTicks = 3;
		} else if ((role == "carrier" || role == "miner" || role == "burrower")
				&& (creep.room.name != _.get(creep, ["memory", "colony"], creep.room.name))) {
			// Remote mining operations outside of colony have increased wait time (CPU optimization)
			minTicks = 9;
			maxTicks = 25;
		}

		let range = maxTicks - minTicks;
		let value = minTicks + Math.floor((1 - (Game.cpu.bucket / 10000)) * range);
		return (value % 2 != 0 ? value : value + 1);
	},

	moveMaxOps: function() {
		let minOps = 2000, maxOps = 3000;
		let range = maxOps - minOps;
		return minOps + Math.floor((1 - (Game.cpu.bucket / 10000)) * range);
	},
	
	clearDeadMemory: function() {
		if (!isPulse_Short())
			return;

		if (Memory.creeps != null) {
			_.each(_.filter(Object.keys(Memory.creeps),
				c => { return !_.has(Game, ["creeps", c]); }),
				c => {
					if (Memory.creeps[c]["task"] != null) {
						let task = Memory.creeps[c]["task"];
						if (_.has(Memory, ["rooms", task.room, "tasks", "running", task.key]))
							delete Memory["rooms"][task.room]["tasks"]["running"][task.key][c];
					}
					delete Memory.creeps[c];
				});
		}

		if (Memory.rooms != null) {
			_.each(_.filter(Object.keys(Memory.rooms),
				r => { return !_.has(Game, ["rooms", r]); }),
				r => { delete Memory.rooms[r]; });
		}
	},

	initMemory: function() {
		_CPU.Start("Hive", "initMemory");

		this.setPulse("short", 10, 60);
		this.setPulse("mid", 20, 90);
		this.setPulse("long", 50, 200);
		this.setPulse("spawn", 15, 30);
		this.setPulse("lab", 2000, 2000);
		this.setPulse("blueprint", 100, 500);
			
		if (_.get(Memory, ["rooms"]) == null) _.set(Memory, ["rooms"], new Object());
		if (_.get(Memory, ["hive", "allies"]) == null) _.set(Memory, ["hive", "allies"], new Array());
		if (_.get(Memory, ["hive", "pulses"]) == null) _.set(Memory, ["hive", "pulses"], new Object());
		if (_.get(Memory, ["sites", "mining"]) == null) _.set(Memory, ["sites", "mining"], new Object());
		if (_.get(Memory, ["sites", "colonization"]) == null) _.set(Memory, ["sites", "colonization"], new Object());
		if (_.get(Memory, ["sites", "combat"]) == null) _.set(Memory, ["sites", "combat"], new Object());

		for (let r in Game["rooms"]) {
			if (_.get(Memory, ["rooms", r]) == null) _.set(Memory, ["rooms", r], new Object());
			_.set(Memory, ["rooms", r, "population"], null);
		}

		_.set(Memory, ["hive", "spawn_requests"], new Array());

		let _Console = require("util.console");
		_Console.Init();
		
		_CPU.End("Hive", "initMemory");
	},

	initTasks: function() {
		_CPU.Start("Hive", "initTasks");
		let _Compile = require("tasks.compile");

		// Initiates cycle structure if non-existant (between last finish and new start)
		if (_.get(Memory, ["hive", "pulses", "tasks", "cycle"]) == null)
			_.set(Memory, ["hive", "pulses", "tasks", "cycle"], {room_iter: 0, room_list: Object.keys(Game.rooms) });

		let room_list = _.get(Memory, ["hive", "pulses", "tasks", "cycle", "room_list"]);
		let room_iter = _.get(Memory, ["hive", "pulses", "tasks", "cycle", "room_iter"]);

		let room_name = _.get(room_list, room_iter);
		_.set(Memory, ["rooms", room_name, "tasks", "list"], new Object());
		_.set(Memory, ["rooms", room_name, "tasks", "running"], new Object());				
		if (room_name != null && _.get(Game, ["rooms", room_name]) != null)
			_Compile.compileTasks(room_name);

		// Iterate, then check if iteration is complete (and reset cycles)
		room_iter += 1;		
		if (room_iter == room_list.length)
			delete Memory["hive"]["pulses"]["tasks"]["cycle"];			
		else
			_.set(Memory, ["hive", "pulses", "tasks", "cycle", "room_iter"], room_iter);

		_CPU.End("Hive", "initTasks");
	
	},

	initVisuals: function() {
		let _Visuals = require("util.visuals");
		_Visuals.Init();
	},

	endMemory: function() {
		if (_.has(Memory, ["hive", "pulses", "reset_links"])) delete Memory["hive"]["pulses"]["reset_links"];
	},


	runColonies: function() {
		_.each(Game.rooms, room => {
			if (room.controller != null && room.controller.my) {
				Sites.Colony(room.name);
				if (_.get(Memory, ["sites", "mining", room.name]) == null)
					_.set(Memory, ["sites", "mining", room.name], { colony: room.name, has_keepers: false });

				if (room.controller.level >= 6)
					Sites.Industry(room.name);
			}
		});

		let mining = _.get(Memory, ["sites", "mining"]);
		_.each(Object.keys(mining), req => {
			if (_.get(mining, [req, "colony"]) != null)
				Sites.Mining(_.get(mining, [req, "colony"]), req);
		});
	},

	runColonizations: function() {
		_.each(_.get(Memory, ["sites", "colonization"]), req => {
			Sites.Colonization(_.get(req, "from"), _.get(req, "target"));
		});
	},

	runCombat: function() {
		for (let memory_id in _.get(Memory, ["sites", "combat"]))
			Sites.Combat(memory_id);
	},
	
	populationTally: function(rmName, popTarget, popActual) {
		// Tallies the target population for a colony, to be used for spawn load balancing
		_.set(Memory, ["rooms", rmName, "population", "target"], _.get(Memory, ["rooms", rmName, "population", "target"], 0) + popTarget);
		_.set(Memory, ["rooms", rmName, "population", "actual"], _.get(Memory, ["rooms", rmName, "population", "actual"], 0) + popActual);
	},

	processSpawnRequests: function() {
		/*  lvlPriority is an integer rating priority, e.g.:
				0: Defense (active attack)
				1: Mining (critical; miner, burrower)
				1-4: Industry (can bring in critical energy!)
				2-3: Defense (passive defense)
				3: Mining (regular), Colonization
				5: Colony (critical)
				6: Colony (regular)
				

			tgtLevel is the target level of the creep's body (per body.js)
			listRooms is an array of room names that would be acceptable to spawn the request (user defined)
		*/

		if (!isPulse_Spawn())
			return;

		_CPU.Start("Hive", "processSpawnRequests");

		let requests_group = _.groupBy(_.get(Memory, ["hive", "spawn_requests"]), 
			r => { return _.get(r, "room"); });
		let listRequests = new Array();
		
		_.each(requests_group, r => { 
			listRequests.push(_.head(_.sortBy(r, req => { return _.get(req, "priority"); })))
		});
		
		let listSpawns = _.filter(Object.keys(Game["spawns"]), s => { return Game["spawns"][s].spawning == null; });
		let _Body = require("body");
		
		for (let i = 0; i < listRequests.length; i++) {
			let request = listRequests[i];
			
			_.each(_.sortBy(Object.keys(listSpawns),
					s => { return request != null && _.get(Game, ["spawns", listSpawns[s], "room", "name"]) == _.get(request, ["room"]); }),
					s => {

				if (listSpawns[s] != null && listRequests[i] != null) {
					let spawn = Game["spawns"][listSpawns[s]];
					if (spawn.room.name == request.room || (request.listRooms != null && _.find(request.listRooms, r => { return r == spawn.room.name; }) != null)) {

						_.set(Memory, ["rooms", request.room, "population", "total"],
							(_.get(Memory, ["rooms", request.room, "population", "actual"]) / _.get(Memory, ["rooms", request.room, "population", "target"])));

						let level = (_.get(request, ["scale"], true) == false)
							? Math.min(request.level, spawn.room.getLevel())
							: Math.max(1, Math.min(Math.round(Memory["rooms"][request.room]["population"]["total"] * request.level),
								spawn.room.getLevel()));
						request.args["level"] = level;

						let body = _Body.getBody(request.body, level);
						let name = request.name != null ? request.name
							: request.args["role"].substring(0, 4)
								+ (request.args["subrole"] == null ? "" : `-${request.args["subrole"].substring(0, 2)}`)
								+ ":xxxx".replace(/[xy]/g, (c) => {
										let r = Math.random()*16|0, v = c == "x" ? r : (r&0x3|0x8);
										return v.toString(16); });
						let storage = _.get(spawn.room, "storage");
						let energies = storage == null ? null : _.sortBy(_.filter(spawn.room.find(FIND_MY_STRUCTURES), 
							s => { return s.isActive() && (s.structureType == "extension" || s.structureType == "spawn"); }),
							s => { return s.pos.getRangeTo(storage); });
						let result = energies == null 
							? spawn.spawnCreep(body, name, {memory: request.args})
							: spawn.spawnCreep(body, name, {memory: request.args, energyStructures: energies});

						if (result == OK) {
							console.log(`<font color=\"#19C800\">[Spawns]</font> Spawning `
								+ (spawn.room.name == request.room ? `${request.room}  ` : `${spawn.room.name} -> ${request.room}  `)
								+ `${level} / ${request.level}  ${name} : ${request.args["role"]}`
								+ `${request.args["subrole"] == null ? "" : ", " + request.args["subrole"]} `
								+ `(${request.body})`);

							listSpawns[s] = null;
							listRequests[i] = null;
						}
					}
				}
			});
		}

		_CPU.End("Hive", "processSpawnRequests");
	},

	processSpawnRenewing: function() {
		_CPU.Start("Hive", "processSpawnRenewing");

		let listSpawns = Object.keys(Game["spawns"]).filter((a) => 
			{ return Game.spawns[a].spawning == null && Game.spawns[a].room.energyAvailable > 300; });
		for (let s in listSpawns) {
			let spawn = Game["spawns"][listSpawns[s]];
			let creeps = _.filter(spawn.pos.findInRange(FIND_MY_CREEPS, 1),
				c => { return !c.isBoosted() && _.get(c, ["memory", "spawn_renew"], true); });
			for (let c in creeps) {
				if (spawn.renewCreep(creeps[c]) == OK)
					break;
			}
		}

		_CPU.End("Hive", "processSpawnRenewing");
	},

	
	sellExcessResources: function() {
		if (!isPulse_Mid())
			return;

		_CPU.Start("Hive", "sellExcessResources");

		overflow = _.get(Memory, ["resources", "to_market"]);
		if (overflow == null)
			return;

		let resources = new Object();

		_.each(Object.keys(overflow), res => {
			_.each(_.filter(Game.rooms, r => { return _.get(r, ["terminal", "my"], false); }), r => {
				let amount = _.get(r, ["storage", "store", res], 0) + _.get(r, ["terminal", "store", res], 0);
				if (amount > 0)
					_.set(resources, [res, r.name], amount);
			});
		});

		for (let res in resources) {
			let excess = _.sum(resources[res]) - overflow[res];
			if (excess > 100 && _.get(Memory, ["resources", "terminal_orders", `overflow_${res}`]) == null) {
				let room = _.head(_.sortBy(Object.keys(resources[res]), r => { return -resources[res][r]; }));
				let order = _.head(_.sortBy(_.sortBy(Game.market.getAllOrders(
					o => { return o.type == "buy" && o.resourceType == res; }),
					o => { return Game.map.getRoomLinearDistance(o.roomName, room); }),
					o => { return -o.price; } ));

				if (order != null) {
					if (_.get(Memory, ["resources", "terminal_orders", `overflow_${res}`]) != null)
						console.log(`<font color=\"#F7FF00\">[Hive]</font> Selling overflow resource to market: ${excess} of ${res} from ${room}`);
					_.set(Memory, ["resources", "terminal_orders", `overflow_${res}`], { market_id: order.id, amount: excess, from: room, priority: 4 });
					
				}
			}
		}

		_CPU.End("Hive", "sellExcessResources");
	},

	moveExcessEnergy: function() {
		if (!isPulse_Mid())
			return;

		_CPU.Start("Hive", "moveExcessEnergy");

		limit = _.get(Memory, ["resources", "to_overflow"]);
		if (limit == null)
			return;

		let energy = new Object();

		_.forEach(_.filter(Game.rooms,
			r => { return r.terminal != null && r.terminal.my; } ),
			r => { energy[r.name] = _.get(r, ["storage", "store", "energy"], 0) + _.get(r, ["terminal", "store", "energy"], 0); } );

		let tgtRoom = _.head(_.sortBy(_.filter(Object.keys(energy),
			n => { return energy[n] < (limit * 0.95); } ),
			n => { return energy[n]; }));

		if (tgtRoom != null) {
			_.forEach(_.filter(Object.keys(energy),
					r => { return !_.has(Memory, ["resources", "terminal_orders", `overflow_energy_${r}`]) && energy[r] - limit > 100; } ),
					r => {	// Terminal transfers: minimum quantity of 100.
				_.set(Memory, ["resources", "terminal_orders", `overflow_energy_${r}`], { room: tgtRoom, resource: "energy", amount: energy[r] - limit, from: r, priority: 2 });
				console.log(`<font color=\"#F7FF00\">[Hive]</font> Creating overflow energy transfer: ${energy[r] - limit}, ${r} -> ${tgtRoom}`);
			});
		}

		_CPU.End("Hive", "moveExcessEnergy");
	},
	
	
	initLabs: function() {
		if (!isPulse_Lab())
			return;

		// Reset stockpiles...
		_.each(Memory["rooms"], r => { _.set(r, ["stockpile"], new Object()); });
		
		// Reset automated terminal orders
		_.each(_.filter(_.keys(Memory["resources", "terminal_orders"]),
			o => { return _.get(Memory, ["terminal_orders", o, "automated"]) == true; }),
			o => { delete Memory["resources"]["terminal_orders"][o]; });
		
		// Reset reagent targets, prevents accidental reagent pileup
		_.each(_.filter(_.keys(_.get(Memory, ["resources", "labs", "targets"])), 
			t => { return _.get(Memory, ["resources", "labs", "targets", t, "is_reagent"]) == true; }), 
			t => delete Memory["resources"]["labs"]["targets"][t]);
		
		let targets = _.filter(_.get(Memory, ["resources", "labs", "targets"]), 
			t => {
				if (_.get(t, "amount") < 0)
					return true;
				
				let amount = 0;
				_.each(_.filter(Game.rooms, 
					r => { return r.controller != null && r.controller.my && (r.storage || r.terminal); }), 
					r => { amount += r.store(_.get(t, "mineral")); });
				return amount < _.get(t, "amount");				
			});
			
		_.each(targets, target => this.createReagentTargets(target));
	},
	
	createReagentTargets: function(target) {		
		_.each(getReagents(target.mineral), 
			reagent => {
				let amount = 0;
				_.each(_.filter(Game.rooms, 
					r => { return r.controller != null && r.controller.my && r.terminal; }), 
					r => { amount += r.store(reagent); });
				if (amount <= 1000 && !_.has(Memory, ["resources", "labs", "targets", reagent]) && getReagents(reagent) != null) {					
					console.log(`<font color=\"#A17BFF\">[Labs]</font> reagent ${reagent} missing for ${target.mineral}, creating target goal.`);
					Memory["resources"]["labs"]["targets"][reagent] = { amount: target.amount, priority: target.priority, mineral: reagent, is_reagent: true };
					this.createReagentTargets(Memory["resources"]["labs"]["targets"][reagent]);
				} 
			});		
	},
};

module.exports = Hive;
