let _CPU = require("util.cpu");

let Hive = {

    isPulse_Main: function() {
        let minTicks = 5, maxTicks = 60;
		let range = maxTicks - minTicks;
		let lastTick = _.get(Memory, ["pulses", "main"]);

		if (lastTick == null
				|| Game.time == lastTick
				|| Game.time - Memory["pulses"]["main"] >= (minTicks + Math.floor((1 - (Game.cpu.bucket / 10000)) * range))) {
			_.set(Memory, ["pulses", "main"], Game.time);
			return true;
		} else {
			return false;
		}
    },

	isPulse_Spawn: function() {
		let minTicks = 10, maxTicks = 20;
		let range = maxTicks - minTicks;
		let lastTick = _.get(Memory, ["pulses", "spawn"]);

		if (lastTick == null
				|| Game.time == lastTick
				|| Game.time - lastTick >= (minTicks + Math.floor((1 - (Game.cpu.bucket / 10000)) * range))) {
			_.set(Memory, ["pulses", "spawn"], Game.time);
			return true;
		} else {
			return false;
		}
    },

	isPulse_Blueprint: function() {
		let minTicks = 500, maxTicks = 2000;
		let range = maxTicks - minTicks;
		let lastTick = _.get(Memory, ["pulses", "blueprint"]);

		if (lastTick == null
				|| Game.time == lastTick
				|| Game.time - lastTick >= (minTicks + Math.floor((1 - (Game.cpu.bucket / 10000)) * range))) {
			_.set(Memory, ["pulses", "blueprint"], Game.time);
			return true;
		} else {
			return false;
		}
    },

    moveReusePath: function() {
		let minTicks = 10, maxTicks = 60;
		let range = maxTicks - minTicks;

		return minTicks + Math.floor((1 - (Game.cpu.bucket / 10000)) * range);
    },

    clearDeadMemory: function() {
        // Clear dead creeps from Memory
        for (let n in Memory.creeps) {
            if (!Game.creeps[n]) {
				if (Memory.creeps[n]["task"] != null) {
					let task = Memory.creeps[n]["task"];
					if (_.has(Memory, ["rooms", task.room, "tasks_running", task.key]))
						delete Memory["rooms"][task.room]["tasks_running"][task.key][n];
				}

                delete Memory.creeps[n];
            }
        }
    },

    initMemory: function() {
        if (Memory["rooms"] == null) Memory["rooms"] = {};

        for (let r in Game["rooms"]) {
            if (Memory["rooms"][r] == null) Memory["rooms"][r] = {};
            if (Memory["rooms"][r]["tasks"] == null) Memory["rooms"][r]["tasks"] = {};
			Memory["rooms"][r]["population_balance"] = null;

        }

		Memory["spawn_requests"] = new Array();		

		if (Game.time % 1500 == 0)	// Periodically reset stockpile (removes old needs)
			_.each(Memory["rooms"], r => { _.set(r, ["stockpile"], new Object()); });

		let _Console = require("util.console");
		_Console.Init();
    },

    initTasks: function() {
        if (Hive.isPulse_Main()) {
			_CPU.Start("Hive", "initTasks");

			let _Compile = require("tasks.compile");
            for (let r in Game["rooms"]) {
                Memory["rooms"][r]["tasks"] = {};
                _Compile.compileTasks(r);
				Memory["rooms"][r]["tasks_running"] = {};
            }

			_CPU.End("Hive", "initTasks");
        }
    },

    populationTally: function(rmName, popTarget, popActual) {
        // Tallies the target population for a colony, to be used for spawn load balancing
        if (Memory["rooms"][rmName]["population_balance"] == null) {
            Memory["rooms"][rmName]["population_balance"] = {target: popTarget, actual: popActual, total: null};
        } else {
            Memory["rooms"][rmName]["population_balance"]["target"] += popTarget;
            Memory["rooms"][rmName]["population_balance"]["actual"] += popActual;
        }
    },

    processSpawnRequests: function() {
		/*  lvlPriority is an integer rating priority, e.g.:
                0: Defense (active, imminent danger)
                1: Mining operations (critical)
                2: Mining operations (regular)
                3: Colony operation (critical)
                4: Colony operation (regular)
                5: ... ? scouting? passive defense?

            tgtLevel is the target level of the creep"s body (per util.creep)
            spawnDistance is linear map distance from which a room (of equal or higher level) can spawn for this request
		*/

		if (!this.isPulse_Spawn())
			return;

		_CPU.Start("Hive", "processSpawnRequests");

        let listRequests = Object.keys(Memory["spawn_requests"]).sort((a, b) => {
            return Memory["spawn_requests"][a]["priority"] - Memory["spawn_requests"][b]["priority"]; } );
        let listSpawns = Object.keys(Game["spawns"]).filter((a) => { return Game["spawns"][a].spawning == null; });
        let _Creep = require("util.creep");

		for (let s in listSpawns) {
			for (let r in listRequests) {
                if (listSpawns[s] != null && listRequests[r] != null) {
					let spawn = Game["spawns"][listSpawns[s]];
                    let request = Memory["spawn_requests"][listRequests[r]];
                    if (Game.map.getRoomLinearDistance(spawn.room.name, request.room) <= request.distance) {

						Memory["rooms"][request.room]["population_balance"]["total"] =
							Memory["rooms"][request.room]["population_balance"]["actual"] / Memory["rooms"][request.room]["population_balance"]["target"];

						let _Colony = require("util.colony");
                        let level = (request.scale_level != null && request.scale_level == false) ? request.level
								: Math.max(1, Math.min(Math.ceil(Memory["rooms"][request.room]["population_balance"]["total"] * request.level),
									_Colony.getRoom_Level(spawn.room)));
						request.args["level"] = level;
						let body = _Creep.getBody(request.body, level);
						let name = request.name != null ? request.name
							: request.args["role"].substring(0, 4)
								+ (request.args["subrole"] == null ? "" : `-${request.args["subrole"].substring(0, 2)}`)
								+ ":xxxx".replace(/[xy]/g, (c) => {
										let r = Math.random()*16|0, v = c == "x" ? r : (r&0x3|0x8);
										return v.toString(16); });
                        let result = spawn.createCreep(body, name, request.args);

                        if (_.isString(result)) {							
							console.log(`<font color=\"#19C800\">[Spawns]</font> Spawning lvl ${level} / ${request.level} ${request.body}, `
								+ `${spawn.room.name} -> ${request.room}, `
								+ `${result} (${request.args["role"]}`
								+ `${request.args["subrole"] == null ? "" : ", " + request.args["subrole"]})`);

                            listSpawns[s] = null;
                            listRequests[r] = null;
                        }
                    }
                }
            }
        }

		_CPU.End("Hive", "processSpawnRequests");
	},

    processSpawnRenewing: function() {
		_CPU.Start("Hive", "processSpawnRenewing");

        let _Creep = require("util.creep");
        let listSpawns = Object.keys(Game["spawns"]).filter((a) => { return Game["spawns"][a].spawning == null; });
        for (let s in listSpawns) {
            let spawn = Game["spawns"][listSpawns[s]];
            let creeps = spawn.pos.findInRange(FIND_MY_CREEPS, 1);
            for (let c in creeps) {
                if (!creeps[c].isBoosted()) {
                    if (spawn.renewCreep(creeps[c]) == OK) {
                        break;
                    }
                }
            }
        }

		_CPU.End("Hive", "processSpawnRenewing");
    },

	sellExcessResources: function(overflow) {
		if (!Hive.isPulse_Main())
			return;

		_CPU.Start("Hive", "sellExcessResources");

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
			if (excess > 0 && _.get(Memory, ["terminal_orders", `overflow_${res}`]) == null) {
				let room = _.head(_.sortBy(Object.keys(resources[res]), r => { return -resources[res][r]; }));
				let order = _.head(_.sortBy(_.sortBy(Game.market.getAllOrders(
					o => { return o.type == "buy" && o.resourceType == res; }),
					o => { return Game.map.getRoomLinearDistance(o.roomName, room); }),
					o => { return -o.price; } ));

				if (order != null) {
					_.set(Memory, ["terminal_orders", `overflow_${res}`], { market_id: order.id, amount: excess, from: room, priority: 4 });
					console.log(`<font color=\"##DBA3FF\">[Hive]</font> Selling overflow resource to market: ${excess} of ${res} from ${room}`);
				}
			}
		}

		_CPU.End("Hive", "sellExcessResources");
	},

	moveExcessEnergy: function(limit) {
		if (!Hive.isPulse_Main())
			return;

		_CPU.Start("Hive", "moveExcessEnergy");

		let energy = new Object();

		_.forEach(_.filter(Game.rooms,
			r => { return r.terminal != null && r.terminal.my; } ),
			r => { energy[r.name] = _.get(r, ["storage", "store", "energy"], 0) + _.get(r, ["terminal", "store", "energy"], 0); } );

		let tgtRoom = _.head(_.sortBy(_.filter(Object.keys(energy),
			n => { return energy[n] < (limit * 0.95); } ),
			n => { return energy[n]; }));

		if (tgtRoom != null) {
			_.forEach(_.filter(Object.keys(energy), r => { return energy[r] > limit; } ), r => {
				_.set(Memory, ["terminal_orders", `overflow_energy_${r}`], { room: tgtRoom, resource: "energy", amount: energy[r] - limit, from: r, priority: 2 });
				console.log(`<font color=\"#DBA3FF\">[Hive]</font> Moving overflow energy: ${energy[r] - limit}, ${r} -> ${tgtRoom}`);
			});
		}

		_CPU.End("Hive", "moveExcessEnergy");
	}
};

module.exports = Hive;
