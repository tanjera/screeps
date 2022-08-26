/* ***********************************************************
 *
 * Table of Contents:
 *
 * : [sec01a] General Overloads
 * : [sec01b] Overloads: Creep
 * : [sec01c] Overloads: Creep Tasks
 * : [sec01d] Overloads: Creep Travel
 * : [sec01e] Overloads: Lab
 * : [sec01f] Overloads: Room
 * : [sec01g] Overloads: RoomPosition
 *
 * : [sec02a] Definitions: Populations
 * : [sec02b] Definitions: Combat Populations
 *
 * : [sec03a] Creep Body
 * : [sec03b] Creep Roles
 * : [sec03c] Creep Combat Roles
 *
 * : [sec04a] Sites
 * : [sec05a] Hive Control
 *
 * : [sec06a] Blueprint
 * : [sec06b] Blueprint Layouts
 *
 * : [sec07a] Console Commands
 * : [sec08a] Visual Elements
 * : [sec09a] CPU Profiling
 * : [sec10a] Grafana Statistics
 *
 * : [sec11a] Main Loop
 *
 * *********************************************************** */



/* ***********************************************************
 *	[sec01a] GENERAL OVERLOADS
 * *********************************************************** */

{	/* Constants */

// Defensive alert states
	NONE = 10;
	LOW = 11;
	MEDIUM = 12;
	HIGH = 13;

	// Energy level states
	CRITICAL = 10;
	LOW = 11;
	NORMAL = 12;
	EXCESS = 13;
}

getUsername = function () {
	return _.find({...Game.structures, ...Game.creeps, ...Game.constructionSites}).owner.username;
}

hasCPU = function () {
	return Game.cpu.getUsed() < Game.cpu.limit;
};

isPulse_Defense = function () {
	return _.get(Memory, ["hive", "pulses", "defense", "active"], true);
};

isPulse_Short = function () {
	return _.get(Memory, ["hive", "pulses", "short", "active"], true);
};

isPulse_Mid = function () {
	return _.get(Memory, ["hive", "pulses", "mid", "active"], true);
};

isPulse_Long = function () {
	return _.get(Memory, ["hive", "pulses", "long", "active"], true);
};

isPulse_Spawn = function () {
	return _.get(Memory, ["hive", "pulses", "spawn", "active"], true);
};

isPulse_Lab = function () {
	return _.get(Memory, ["hive", "pulses", "lab", "active"], true);
};

isPulse_Blueprint = function () {
	return _.get(Memory, ["hive", "pulses", "blueprint", "active"], true);
};

getReagents = function (mineral) {
	for (let r1 in REACTIONS) {
		for (let r2 in REACTIONS[r1]) {
			if (REACTIONS[r1][r2] == mineral) {
				return [r1, r2];
			}
		}
	}
};


Math.clamp = function (number, lower, upper) {
	return Math.max(lower, Math.min(number, upper));
};

Math.lerp = function (v1, v2, t) {
	t = Math.clamp(t, 0, 1);
	return v1 + (v2 - v1) * t;
};

Math.lerpSpawnPriority = function (lowPriority, highPriority, popActual, popTarget) {
	return Math.floor(Math.lerp(lowPriority, highPriority, popActual / Math.max(1, popTarget - 1)));
};


/* ***********************************************************
 *	[sec01b] OVERLOADS: CREEP
 * *********************************************************** */

Creep.prototype.isBoosted = function isBoosted() {
	for (let b in this.body) {
		if (this.body[b].boost) {
			return true;
		}
	}
	return false;
};

Creep.prototype.getBoosts = function getBoosts() {
	let minerals = new Array();
	for (let b in this.body) {
		if (this.body[b].boost && !minerals.includes(this.body[b].boost))
			minerals.push(this.body[b].boost);
	}

	return minerals;
};

Creep.prototype.isAlly = function isAlly() {
	let allyList = _.get(Memory, ["hive", "allies"]);
	return this.my || (allyList != null && allyList.indexOf(this.owner.username) >= 0);
};


Creep.prototype.isHostile = function isHostile() {
	let allyList = _.get(Memory, ["hive", "allies"]);
	return !this.my && (allyList == null || allyList.indexOf(this.owner.username) < 0);
};

Creep.prototype.hasPart = function hasPart(part) {
	return this.getActiveBodyparts(part) > 0;
}


/* ***********************************************************
 *	[sec01c] OVERLOADS: CREEP TASKS
 * *********************************************************** */

Creep.prototype.runTask = function runTask() {
	if (this.memory.task == null) {
		return;
	} else if (this.memory.task["timer"] != null) {
		let task = this.memory.task;
		task["timer"] = task["timer"] - 1;
		if (task["timer"] <= 0) {
			delete this.memory.task;
			return;
		}
	}

	switch (this.memory.task["type"]) {
		case "wait":
			this.travelTask(null);
			return;

		case "boost": {
			let lab = Game.getObjectById(this.memory.task["id"]);
			if (!this.pos.inRangeTo(lab, 1)) {
				this.travelTask(lab);
				return;
			} else {    // Wait out timer- should be boosted by then.
				return;
			}
		}

		case "pickup": {
			let obj = Game.getObjectById(this.memory.task["id"]);
			if (this.pickup(obj) == ERR_NOT_IN_RANGE) {
				this.travelTask(obj);
				return;
			} else {    // Action takes one tick... task complete... delete task...
				delete this.memory.task;
				return;
			}
		}

		case "withdraw": {
			let obj = Game.getObjectById(this.memory.task["id"]);

			if (this.withdraw(obj, this.memory.task["resource"],
				(this.memory.task["amount"] > this.carryCapacity - _.sum(this.carry) ? null : this.memory.task["amount"]))
				== ERR_NOT_IN_RANGE) {
				this.travelTask(obj);
				return;
			} else {    // Action takes one tick... task complete... delete task...
				delete this.memory.task;
				return;
			}
		}

		case "harvest": {
			let obj = Game.getObjectById(this.memory.task["id"]);

			let result = this.harvest(obj);
			if (result == OK) {
				let interval = 3;
				if (Game.time % interval == 0) {
					// Burrower fill adjacent link if possible; also fill adjacent container
					if (this.memory.role == "burrower" && this.carry["energy"] > 0) {

						let link_id = _.get(this.memory, ["task", "dump_link"]);
						if (link_id != "unavailable" || Game.time % (interval * 5) == 0) {
							let link = Game.getObjectById(link_id);
							if (link == null || this.pos.getRangeTo(link) > 1 || link.energy == link.energyCapacity)
								link = _.head(this.pos.findInRange(FIND_STRUCTURES, 1, { filter: (s) => { return s.structureType == "link"; } }));
							if (link != null) {
								_.set(this.memory, ["task", "dump_link"], _.get(link, "id"));
								this.transfer(link, "energy");
								return;
							} else {
								_.set(this.memory, ["task", "dump_link"], "unavailable");
							}
						}

						let container_id = _.get(this.memory, ["task", "dump_container"]);
						if (container_id != "unavailable" || Game.time % (interval * 5) == 0) {
							let container = Game.getObjectById(container_id);
							if (container == null || this.pos.getRangeTo(container) > 1 || _.sum(container.store) == container.storeCapacity)
								container = _.head(this.pos.findInRange(FIND_STRUCTURES, 1, { filter: (s) => { return s.structureType == "container"; } }));
							if (container != null) {
								_.set(this.memory, ["task", "dump_container"], _.get(container, "id"));
								this.transfer(container, "energy");
								return;
							} else {
								_.set(this.memory, ["task", "dump_container"], "unavailable");
							}
						}

					}
				}
				return;
			} else if (result == ERR_NOT_IN_RANGE) {
				if (this.memory.role == "burrower" && this.carry["energy"] > 0)
					this.drop("energy");
				if (this.travelTask(obj) == ERR_NO_PATH)
					delete this.memory.task;
				return;
			} else {
				delete this.memory.task;
				return;
			}
		}

		case "upgrade": {
			let controller = Game.getObjectById(this.memory.task["id"]);
			let result = this.upgradeController(controller);
			if (result == OK) {
				if (Game.time % 10 == 0)
					this.travel(controller);
				return;
			} else if (result == ERR_NOT_IN_RANGE) {
				this.travelTask(controller);
				return;
			} else if (result != OK) {
				delete this.memory.task;
				return;
			} else { return; }
		}

		case "sign": {
			let controller = Game.getObjectById(this.memory.task["id"]);
			let message = this.memory.task["message"];
			let result = this.signController(controller, message);
			if (result == ERR_NOT_IN_RANGE) {
				this.travelTask(controller);
				return;
			} else if (result != OK) {
				delete this.memory.task;
				return;
			} else { return; }
		}

		case "repair": {
			let structure = Game.getObjectById(this.memory.task["id"]);
			let result = this.repair(structure);
			if (result == ERR_NOT_IN_RANGE) {
				this.travelTask(structure);
				return;
			} else if (result != OK || structure.hits == structure.hitsMax) {
				delete this.memory.task;
				return;
			} else { return; }
		}

		case "build": {
			let structure = Game.getObjectById(this.memory.task["id"]);
			let result = this.build(structure);
			if (result == ERR_NOT_IN_RANGE) {
				this.travelTask(structure);
				return;
			} else if (result != OK) {
				delete this.memory.task;
				return;
			} else { return; }
		}

		case "deposit": {
			let target = Game.getObjectById(this.memory.task["id"]);
			switch (this.memory.task["resource"]) {
				case "energy":
					if (target != null && this.transfer(target, this.memory.task["resource"]) == ERR_NOT_IN_RANGE) {
						if (_.get(target, "energy") != null && _.get(target, "energy") == _.get(target, "energyCapacity")) {
							delete this.memory.task;
							return;
						}

						this.travelTask(target);
						return;
					} else {
						delete this.memory.task;
						return;
					}
					return;

				default:
				case "mineral":		// All except energy
					for (let r = Object.keys(this.carry).length; r > 0; r--) {
						let resourceType = Object.keys(this.carry)[r - 1];
						if (resourceType == "energy") {
							continue;
						} else if (target != null && this.transfer(target, resourceType) == ERR_NOT_IN_RANGE) {
							this.travelTask(target);
							return;
						} else {
							delete this.memory.task;
							return;
						}
					}
					return;
			}
		}
	}
};


Creep.prototype.getTask_Boost = function getTask_Boost() {
	if (this.ticksToLive < 1350 || this.spawning)
		return null;

	let boosted = this.getBoosts();
	return _.head(_.filter(_.get(Memory, ["rooms", this.room.name, "industry", "boosts"]),
		t => {
			return t.active && t.role == this.memory.role
				&& (t.room == null ? true : t.room == this.memory.room)
				&& !boosted.includes(t.resource);
		}));
};

Creep.prototype.getTask_Withdraw_Link = function getTask_Withdraw_Link(distance) {
	if (!_.get(this.room, ["controller", "my"], false)
		|| !_.get(Memory, ["rooms", this.room.name, "defense", "is_safe"]))
		return;

	let link = _.head(_.filter(this.room.find(FIND_MY_STRUCTURES), s => {
		return s.structureType == "link" && s.energy > 0 && this.pos.getRangeTo(s.pos) <= distance
			&& _.some(_.get(Memory, ["rooms", this.room.name, "links"]),
				l => { return _.get(l, "id") == s.id && _.get(l, "dir") == "receive"; });
	}));

	if (link != null) {
		return {
			type: "withdraw",
			structure: "link",
			resource: "energy",
			id: link.id,
			timer: 60
		};
	}
};

Creep.prototype.getTask_Withdraw_Storage = function getTask_Withdraw_Storage(resource, is_critical) {
	if (!this.room.storage)
		return;

	resource = resource || "energy";
	is_critical = is_critical || false;

	if (resource != "energy" && _.get(this.room.storage, ["store", resource], 0) > 0) {
		return {
			type: "withdraw",
			resource: resource,
			id: this.room.storage.id,
			timer: 60
		};
	} else if (resource == "energy" && _.get(this.room.storage, ["store", "energy"], 0) > 0
		&& (_.get(Memory, ["rooms", this.room.name, "survey", "energy_level"]) != CRITICAL || is_critical)) {
		return {
			type: "withdraw",
			resource: resource,
			id: this.room.storage.id,
			timer: 60
		};
	} else
		return;
};

Creep.prototype.getTask_Withdraw_Container = function getTask_Withdraw_Container(resource, is_critical) {
	if (!_.get(Memory, ["rooms", this.room.name, "defense", "is_safe"], true))
		return;

	resource = resource || "energy";
	is_critical = is_critical || false;

	if (resource != "energy") {
		let cont = _.head(_.filter(this.room.find(FIND_STRUCTURES),
		s => { return s.structureType == STRUCTURE_CONTAINER && _.get(s, ["store", resource], 0) > 0; }));
		if (cont != null) {
			return {
				type: "withdraw",
				resource: resource,
				id: cont.id,
				timer: 60
			};
		}
	}

	if (resource == "energy"
		&& (_.get(Memory, ["rooms", this.room.name, "survey", "energy_level"]) != CRITICAL || is_critical)) {
		let am_owner = _.get(this.room, ["controller", "my"], false);
		let mining_colony = _.get(Memory, ["sites", "mining", this.room.name, "colony"]);
		let room_level = mining_colony == null || Game.rooms[mining_colony] == null
			? (am_owner ? this.room.getLevel() : 0)
			: Game.rooms[mining_colony].getLevel();
		let carry_amount = this.carryCapacity / 5;

		let cont = _.head(_.sortBy(_.filter(this.room.find(FIND_STRUCTURES),
			s => { return s.structureType == STRUCTURE_CONTAINER && _.get(s, ["store", "energy"], 0) > carry_amount; }),
			s => { return this.pos.getRangeTo(s.pos); }));

		if (cont != null) {
			return {
				type: "withdraw",
				resource: "energy",
				id: cont.id,
				timer: 60
			};
		}
	}
};

Creep.prototype.getTask_Withdraw_Source_Container = function getTask_Withdraw_Source_Container() {
	if (this.store.getFreeCapacity() == 0)
		return;

	if (this.memory.role == "burrower") {
		let source = _.head(_.filter(this.room.findSources(false), s => {
			return _.get(Memory, ["rooms", this.room.name, "sources", s.id, "burrower"]) == this.id;
		}));

		if (source == null)
			return;

		let container = _.head(_.filter(source.pos.findInRange(FIND_STRUCTURES, 1),
			s => { return s.structureType == "container" && s.store.energy > 0; } ));

		if (container != null) {
			return {
				type: "withdraw",
				resource: "energy",
				id: container.id,
				timer: 60
			};
		}
	}
};

Creep.prototype.getTask_Deposit_Link = function getTask_Deposit_Link() {
	if (_.get(Memory, ["rooms", this.room.name, "survey", "energy_level"]) == CRITICAL)
		return;

	if (this.carry["energy"] == 0)
		return;

	let link = _.head(_.filter(this.room.find(FIND_MY_STRUCTURES), s => {
		return s.structureType == "link" && s.energy < (s.energyCapacity * 0.8) && this.pos.getRangeTo(s.pos) < 3
			&& _.some(_.get(Memory, ["rooms", this.room.name, "links"]),
				l => { return _.get(l, "id") == s.id && _.get(l, "dir") == "send"; });
	}));

	if (link != null) {
		return {
			type: "deposit",
			resource: "energy",
			id: link.id,
			timer: 60,
		};
	}
};

Creep.prototype.getTask_Deposit_Source_Link = function getTask_Deposit_Source_Link() {
	if (this.store["energy"] == 0)
		return;

	if (this.memory.role == "burrower") {
		let source = _.head(_.filter(this.room.findSources(false), s => {
			return _.get(Memory, ["rooms", this.room.name, "sources", s.id, "burrower"]) == this.id;
		}));

		if (source == null)
			return;

		let link = _.head(_.filter(source.pos.findInRange(FIND_STRUCTURES, 2), s => {
			return s.structureType == "link" && s.energy < s.energyCapacity
				&& _.some(_.get(Memory, ["rooms", this.room.name, "links"]),
					l => { return _.get(l, "id") == s.id && _.get(l, "dir") == "send"; });
				 }));

		if (link != null) {
			return {
				type: "deposit",
				resource: "energy",
				id: link.id,
				timer: 60,
			};
		}
	}
};

Creep.prototype.getTask_Deposit_Storage = function getTask_Deposit_Storage(resource) {
	if (!this.room.storage || !_.get(this.room, ["controller", "my"], false))
		return;

	if (_.sum(this.room.storage.store) == this.room.storage.storeCapacity)
		return;

	if ((resource == null || resource != "energy") && _.sum(this.carry) - this.carry["energy"] > 0)
		resource = "mineral";
	else if ((resource == null || resource == "energy") && this.carry["energy"] > 0)
		resource = "energy";
	else
		return;

	return {
		type: "deposit",
		resource: resource,
		id: this.room.storage.id,
		timer: 60,
	};
};

Creep.prototype.getTask_Deposit_Container = function getTask_Deposit_Container(resource) {
	let cont = _.head(_.sortBy(_.filter(this.room.find(FIND_STRUCTURES),
		s => { return s.structureType == "container" && _.sum(s.store) < s.storeCapacity; }),
		s => { return this.pos.getRangeTo(s.pos); }));

	if ((resource == null || resource != "energy") && _.sum(this.carry) - this.carry["energy"] > 0)
		resource = "mineral";
	else if ((resource == null || resource == "energy") && this.carry["energy"] > 0)
		resource = "energy";
	else
		return;

	if (cont != null) {
		return {
			type: "deposit",
			resource: resource,
			id: cont.id,
			timer: 60,
		};
	}
};

Creep.prototype.getTask_Deposit_Towers = function getTask_Deposit_Towers() {
	if (!_.get(this.room, ["controller", "my"], false))
		return;

	let tower = _.head(_.sortBy(_.filter(this.room.find(FIND_MY_STRUCTURES),
		s => { return s.structureType == "tower" && s.energy < s.energyCapacity; }),
		s => { return s.energy; }));

	if (tower != null) {
		return {
			type: "deposit",
			structure: "tower",
			resource: "energy",
			id: tower.id,
			timer: 60
		};
	}
};

Creep.prototype.getTask_Deposit_Spawns = function getTask_Deposit_Spawns() {
	if (!_.get(this.room, ["controller", "my"], false))
		return;

	let spawn_ext = _.head(_.sortBy(_.filter(this.room.find(FIND_MY_STRUCTURES), s => {
		return (s.structureType == "spawn" && s.energy < s.energyCapacity * 0.85)
			|| (s.structureType == "extension" && s.energy < s.energyCapacity);
	}),
		s => { return this.pos.getRangeTo(s.pos); }));

	if (spawn_ext != null) {
		return {
			type: "deposit",
			resource: "energy",
			id: spawn_ext.id,
			timer: 60
		};
	}
};

Creep.prototype.getTask_Pickup = function getTask_Pickup(resource) {
	if (!_.get(Memory, ["rooms", this.room.name, "defense", "is_safe"]))
		return;

	let dropped_resources = this.room.find(FIND_DROPPED_RESOURCES);

	if (resource == null || resource != "energy") {
		let pile = _.head(_.sortBy(_.filter(dropped_resources,
			r => { return r.resourceType == "mineral"; }),
			r => { return -r.amount; }));

		if (pile != null) {
			return {
				type: "pickup",
				resource: "mineral",
				id: pile.id,
				timer: 30,
			};
		}
	}

	let am_owner = _.get(this.room, ["controller", "my"], false);
	let mining_colony = _.get(Memory, ["sites", "mining", this.room.name, "colony"]);
	let room_level = mining_colony == null || Game.rooms[mining_colony] == null
		? (am_owner ? this.room.getLevel() : 0)
		: Game.rooms[mining_colony].getLevel();
	let carry_amount = this.carryCapacity / 5;

	if (resource == null || resource == "energy") {
		let pile = _.head(_.sortBy(_.filter(dropped_resources,
			r => { return r.resourceType == "energy" && r.amount > carry_amount; }),
			r => { return -r.amount; }));

		if (pile != null) {
			return {
				type: "pickup",
				resource: "energy",
				id: pile.id,
				timer: 30,
			};
		}
	}

	let tombstone = _.head(_.sortBy(_.filter(this.room.find(FIND_TOMBSTONES),
		t => { return _.some(_.get(t, "store", null), s => { return s > carry_amount; }); }),
		t => { return -this.pos.getRangeTo(t.pos); }));

	if (tombstone != null) {
		return {
			type: "withdraw",	// Tombstones require creep.withdraw() ... not creep.pickup()
			resource: _.head(_.filter(_.keys(tombstone.store), s => { return tombstone.store[s] > carry_amount; })),
			id: tombstone.id,
			timer: _.get(tombstone, "ticksToDecay", 50)
		};
	}

	let ruin = _.head(_.sortBy(_.filter(this.room.find(FIND_RUINS),
		p => { return _.some(_.get(p, "store", null), p => { return p > carry_amount; }); }),
		p => { return -this.pos.getRangeTo(p.pos); }));

	if(ruin != null) {
		return {
			type: "withdraw",
			resource: _.head(_.filter(_.keys(ruin.store), q => { return ruin.store[q] > carry_amount; })),
			id: ruin.id,
			timer: 50	/*ruin sites from suicides seem to have long tick times,
						 sometimes 30k+.. just set to maxRoomLength */
		};
	}
};

Creep.prototype.getTask_Upgrade = function getTask_Upgrade(only_critical) {
	if (!_.get(this.room, ["controller", "my"], false))
		return;

	if ((only_critical || only_critical == null) && _.get(this.room, ["controller", "ticksToDowngrade"]) <= 3500) {
		return {
			type: "upgrade",
			id: this.room.controller.id,
			pos: this.room.controller.pos.getOpenTile_Range(2, true),
			timer: 60
		};
	}

	if ((!only_critical || only_critical == null) && _.get(this.room, ["controller", "ticksToDowngrade"]) > 3500) {
		return {
			type: "upgrade",
			id: this.room.controller.id,
			pos: this.room.controller.pos.getOpenTile_Range(2, true),
			timer: 60
		};
	}
};

Creep.prototype.getTask_Sign = function getTask_Sign() {
	if (!_.get(this.room, "controller", false))
		return;

	// Signs set by Screeps devs can't be changed- will report OK (0) but will fail to change
	if (_.get(this.room, ["controller", "sign", "username"]) == "Screeps")
		return;

	let sign_room = _.get(Memory, ["hive", "signs", this.room.name]);
	let sign_default = _.get(Memory, ["hive", "signs", "default"]);
	let is_safe = _.get(Memory, ["rooms", this.room.name, "defense", "is_safe"]);
	let room_sign = _.get(this.room, ["controller", "sign", "text"]);

	// Set for blank sign (empty string) and room sign is blank (undefined)
	if ((sign_room == null && sign_default == "" && room_sign == undefined)
		|| (sign_room == "" && room_sign == undefined))
		return;

	if (is_safe && sign_room != null && room_sign != sign_room) {
		return {
			type: "sign",
			message: sign_room,
			id: this.room.controller.id,
			timer: 60
		};
	} else if (is_safe && sign_room == null && sign_default != null && room_sign != sign_default) {
		return {
			type: "sign",
			message: sign_default,
			id: this.room.controller.id,
			timer: 60
		};
	}
};

Creep.prototype.getTask_Repair = function getTask_Repair(only_critical) {
	if (only_critical == null || only_critical == true) {
		let repair_critical = _.head(this.room.findRepair_Critical());
		if (repair_critical != null)
			return {
				type: "repair",
				id: repair_critical.id,
				timer: 60
			};
	}

	if (only_critical == null || only_critical == false) {
		let repair_maintenance = _.head(this.room.findRepair_Maintenance());
		if (repair_maintenance != null)
			return {
				type: "repair",
				id: repair_maintenance.id,
				timer: 60,
			};
	}
};

Creep.prototype.getTask_Build = function getTask_Build() {
	let site = _.head(_.sortBy(_.filter(this.room.find(FIND_CONSTRUCTION_SITES),
		s => { return s.my; }),
		s => {
			let p = 0;
			switch (s.structureType) {
				case "spawn": p = 2; break;
				case "tower": p = 3; break;
				case "extension": p = 4; break;
				case "storage": p = 5; break;
				default: p = 6; break;
				case "road": p = 7; break;
			}

			if (s.progress > 0)
				p -= 1;

			return p;
		}));

	if (site != null)
		return {
			type: "build",
			id: site.id,
			timer: 60
		};
};

Creep.prototype.getTask_Mine = function getTask_Mine() {
	if (!_.get(Memory, ["rooms", this.room.name, "defense", "is_safe"], true))
		return;

	/* Expected behavior:
	 * Burrowers: 1 burrower per source, stick to source, stand on container, mine; when source is empty, move
	 *   energy to nearby link (as new task).
	 * Miners: Move to any source that's not avoided and that has energy, harvest, then get new task
	 */

	let source = null;

	if (this.memory.role == "burrower") {
		let sources = this.room.findSources(false);

		// Burrower already has an assignment? Follow the assignment.
		source = _.head(_.filter(sources, s => {
			return _.get(Memory, ["rooms", this.room.name, "sources", s.id, "burrower"]) == this.id;
		}));

		// No burrower assignment? Need to iterate sources and update assignments
		if (source == null) {
			// List of existing burrower creeps
			let burrowers = _.filter(this.room.find(FIND_MY_CREEPS),
				c => { return c.memory.role == "burrower"; });

			_.forEach(sources, s => {
				let burrower = _.get(Memory, ["rooms", this.room.name, "sources", s.id, "burrower"]);
				// If burrower is assigned but there is no existing creep by that id (creep died?)
				if (burrower != null && _.filter(burrowers, b => { return b.id == burrower; }).length == 0)
					_.set(Memory, ["rooms", this.room.name, "sources", s.id, "burrower"], null);
			});

			// Assign this creep the 1st unassigned source
			source = _.head(_.filter(sources,
				s => { return _.get(Memory, ["rooms", this.room.name, "sources", s.id, "burrower"]) == null; }));

			if (source != null) {
				_.set(Memory, ["rooms", this.room.name, "sources", source.id, "burrower"], this.id);
			}
		}

		if (source == null || source.energy == 0)
			return;

	} else {
		// Find sources with energy, and that aren't marked as being avoided via path console functions
		source = _.head(_.sortBy(this.room.findSources(true),
		s => {
			if (this.memory.role == "burrower")
				return _.filter(s.pos.findInRange(FIND_MY_CREEPS, 1),
					c => { return c.memory.role == "burrower"; }).length;
			else // Sort by least crowded...
				return s.pos.findInRange(FIND_MY_CREEPS, 1).length > s.pos.getOpenTile_Adjacent(true);
		}));

		if (source == null)
			return;
	}

	let container = _.get(Memory, ["rooms", this.room.name, "sources", source.id, "container"]);
	container = (container == null) ? null : Game.getObjectById(container);

	if (container == null) {
		container = _.head(source.pos.findInRange(FIND_STRUCTURES, 1, {
			filter:
				s => { return s.structureType == "container"; }
		}));
		_.set(Memory, ["rooms", this.room.name, "sources", source.id, "container"], _.get(container, "id"));
	}

	let position = source.pos.getOpenTile_Adjacent(true);
	position = position || source.pos.getOpenTile_Adjacent(false);
	position = position || source.pos;

	return {
		type: "harvest",
		resource: "energy",
		id: source.id,
		pos: position,
		timer: 9999,
		container: _.get(container, "id", null)
	};
};

Creep.prototype.getTask_Extract = function getTask_Extract() {
	if (!_.get(Memory, ["rooms", this.room.name, "defense", "is_safe"], true))
		return;

	let mineral = _.head(_.filter(this.room.find(FIND_MINERALS), m => {
		return m.mineralAmount > 0
			&& _.some(m.pos.lookFor("structure"), s => { return s.structureType == "extractor"; });
	}));

	if (mineral != null) {
		return {
			type: "harvest",
			resource: "mineral",
			id: mineral.id,
			timer: 9999
		};
	}
};

Creep.prototype.getTask_Industry_Withdraw = function getTask_Industry_Withdraw() {
	return _.head(_.sortBy(_.filter(_.get(Memory, ["rooms", this.room.name, "industry", "tasks"]),
		t => { return t.type == "withdraw"; }),
		t => { return t.priority; }));
};

Creep.prototype.getTask_Industry_Deposit = function getTask_Industry_Deposit() {
	let res = _.head(_.sortBy(Object.keys(this.carry), (c) => { return -this.carry[c]; }));
	return _.head(_.sortBy(_.filter(_.get(Memory, ["rooms", this.room.name, "industry", "tasks"]),
		t => { return t.type == "deposit" && t.resource == res; }),
		t => { return t.priority; }));

};

Creep.prototype.getTask_Wait = function getTask_Wait(ticks) {
	return {
		type: "wait",
		timer: ticks || 10
	};
};


/* ***********************************************************
 *	[sec01d] OVERLOADS: CREEP TRAVEL
 * *********************************************************** */

Creep.prototype.travel = function travel(dest, ignore_creeps) {
	if (this.fatigue > 0)
		return ERR_TIRED;

	let pos_dest;
	if (_.get(dest, "x") != null && _.get(dest, "y") != null && _.get(dest, "roomName") != null)
		pos_dest = new RoomPosition(dest.x, dest.y, dest.roomName);
	else if (_.get(dest, "pos") != null)
		pos_dest = dest.pos;
	else
		return ERR_NO_PATH;

	if (this.pos.getRangeTo(pos_dest) == 0)
		return OK;

	// Only request a new path every X ticks (different from reusePath... this may be different task even)
	if (_.get(this, ["memory", "path", "travel_req"], 0) > (Game.time - Control.moveRequestPath(this)))
		return this.travelByPath();
	else
		_.set(this, ["memory", "path", "travel_req"], Game.time);

	if (_.get(this, ["memory", "path", "path_str"]) == null
		|| typeof (_.get(this, ["memory", "path", "path_str"])) != "string"
		|| _.get(this, ["memory", "path", "path_str"]).length == 0
		|| _.get(this, ["memory", "path", "destination"]) != pos_dest) {
		_.set(this, ["memory", "path", "destination"], pos_dest);

		let path_array;

		if (_.get(pos_dest, "roomName") == this.room.name) {
			// If the creep's destination is in the same room as the creep, prevent exiting the room to path
			path_array = this.pos.findPathTo(pos_dest, {
				maxOps: Control.moveMaxOps(), reusePath: Control.moveReusePath(),
				ignoreCreeps: ignore_creeps, costCallback: function (roomName, costMatrix) {
					_.each(_.get(Memory, ["hive", "paths", "prefer", "rooms", roomName]), p => {
						costMatrix.set(p.x, p.y, 1);
					});

					_.each(_.get(Memory, ["hive", "paths", "avoid", "rooms", roomName]), p => {
						costMatrix.set(p.x, p.y, 255);
					});

					// Set all edge tiles as impassable...
					for (let i = 0; i < 50; i++) {
						costMatrix.set(0, i, 255);
						costMatrix.set(i, 0, 255);
						costMatrix.set(49, i, 255);
						costMatrix.set(i, 49, 255);
					}
				}
			});
		} else {
			path_array = this.pos.findPathTo(pos_dest, {
				maxOps: Control.moveMaxOps(), reusePath: Control.moveReusePath(),
				ignoreCreeps: ignore_creeps, costCallback: function (roomName, costMatrix) {
					_.each(_.get(Memory, ["hive", "paths", "prefer", "rooms", roomName]), p => {
						costMatrix.set(p.x, p.y, 1);
					});

					_.each(_.get(Memory, ["hive", "paths", "avoid", "rooms", roomName]), p => {
						costMatrix.set(p.x, p.y, 255);
					});
				}
			});
		}



		let path_string = "";
		_.each(path_array, dir => {
			path_string = path_string.concat(_.get(dir, "direction"));
		});

		_.set(this, ["memory", "path", "path_str"], path_string);
	}

	return this.travelByPath();
};

Creep.prototype.travelByPath = function travelByPath() {
	let path = _.get(this, ["memory", "path", "path_str"]);

	if (path == null || typeof (path) != "string" || path.length == 0) {
		this.travelClear();
		return ERR_NO_PATH;
	}

	let tile = this.pos.getTileInDirection(path.substring(0, 1));
	if (tile != null && tile.isWalkable(true) == false && tile.isValid()) {
		let creep = _.get(_.head(_.filter(tile.look(), l => l.type == "creep")), "creep");
		if (creep != null && creep.my && this.travelSwap(creep) == OK) {
			_.set(this, ["memory", "path", "path_str"], this.memory.path.path_str.substring(1));
			return OK;
		} else {
			this.travelClear();
			return ERR_NO_PATH;
		}
	} else if (tile == null) {
		this.travelClear();
		return ERR_NO_PATH;
	}

	let result = this.move(path.substring(0, 1));
	if (result == OK) {
		_.set(this, ["memory", "path", "path_str"], this.memory.path.path_str.substring(1));
		return OK;
	} else if (result == ERR_BUSY || result == ERR_TIRED || result == ERR_NO_BODYPART) {
		return OK;
	} else {
		this.travelClear();
		return ERR_NO_PATH;
	}
};

Creep.prototype.travelToRoom = function travelToRoom(tgtRoom, forward) {
	if (this.room.name == tgtRoom)
		return ERR_NO_PATH;

	let list_route = _.get(this, ["memory", "list_route"]);
	if (list_route != null) {
		if (forward == true) {
			for (let i = 1; i < list_route.length; i++) {
				if (_.get(list_route, i) != null && this.room.name == _.get(list_route, i - 1)) {
					let result = this.travelToExitTile(list_route[i]);
					if (result == OK)
						return OK;
					else
						return this.travel(new RoomPosition(25, 25, list_route[i]));
				}
			}
		} else if (forward == false) {
			for (let i = list_route.length - 2; i >= 0; i--) {
				if (_.get(list_route, i) != null && this.room.name == _.get(list_route, i + 1)) {
					let result = this.travelToExitTile(list_route[i])
					if (result == OK)
						return OK;
					else
						return this.travel(new RoomPosition(25, 25, list_route[i]));
				}
			}
		}
	}

	if (_.get(this, ["memory", "path", "route"]) != null && _.get(this, ["memory", "path", "route", 0, "room"] == this.room.name))
		this.memory.path.route.splice(0, 1);

	if (_.get(this, ["memory", "path", "route"]) == null || this.memory.path.route.length == 0 || this.memory.path.route == ERR_NO_PATH
		|| _.get(this, ["memory", "path", "route", 0, "room"]) == this.room.name || _.get(this, ["memory", "path", "exit"]) == null
		|| _.get(this, ["memory", "path", "exit", "roomName"]) != this.room.name)
		_.set(this, ["memory", "path", "route"], Game.map.findRoute(this.room, tgtRoom));

	if (_.get(this, ["memory", "path", "route", 0, "room"]) != null) {
		let result = this.travelToExitTile(_.get(this, ["memory", "path", "route", 0, "room"]));
		if (result == OK)
			return OK;
		else {
			let exit = this.pos.findClosestByPath(_.get(this, ["memory", "path", "route", 0, "exit"]));
			_.set(this, ["memory", "path", "exit"], exit);
			if (exit != null)
				return this.travel(new RoomPosition(exit.x, exit.y, exit.roomName));
		}
	}

	return ERR_NO_PATH;
};

Creep.prototype.travelToExitTile = function travelToExitTile(target_name) {
	if (_.get(this, ["memory", "path", "exit_tile", "roomName"]) == this.room.name)
		return this.travel(_.get(this, ["memory", "path", "exit_tile"]));

	let room_exits = Game.map.describeExits(this.room.name);
	for (let i in room_exits) {
		if (room_exits[i] == target_name) {
			let exit_tiles = _.get(Memory, ["hive", "paths", "exits", "rooms", this.room.name]);
			if (exit_tiles == null)
				return ERR_NO_PATH;

			let tile = null;
			switch (i) {
				case '1': tile = _.head(_.sortBy(_.filter(exit_tiles, t => { return t.y == 0; }), t => { return this.pos.getRangeTo(t.x, t.y); })); break;
				case '3': tile = _.head(_.sortBy(_.filter(exit_tiles, t => { return t.x == 49; }), t => { return this.pos.getRangeTo(t.x, t.y); })); break;
				case '5': tile = _.head(_.sortBy(_.filter(exit_tiles, t => { return t.y == 49; }), t => { return this.pos.getRangeTo(t.x, t.y); })); break;
				case '7': tile = _.head(_.sortBy(_.filter(exit_tiles, t => { return t.x == 0; }), t => { return this.pos.getRangeTo(t.x, t.y); })); break;
			}

			if (tile != null) {
				let result = this.travel(new RoomPosition(tile.x, tile.y, tile.roomName));
				if (result == OK || result == ERR_TIRED) {
					_.set(this, ["memory", "path", "exit_tile"], tile);
					return OK;
				}
			}

			return ERR_NO_PATH;
		}
	}
}

Creep.prototype.travelSwap = function travelSwap(target) {
	// Swap tiles with another creep
	// Priorities to prevent endless loops: Burrowers 1st, target task is null 2nd

	if ((_.get(this, ["memory", "role"]) == "burrower" && _.get(target, ["memory", "role"]) != "burrower")
		|| (_.get(this, ["memory", "task"]) != null
			&& (_.get(target, ["memory", "task"]) == null || _.get(target, ["memory", "task", "type"]) == "wait"))) {
		if (_.get(this, ["path", "destination"]) == _.get(target, "pos"))
			return ERR_NO_PATH;

		if (this.pos.getRangeTo(target) > 1)
			return ERR_NO_PATH;

		this.move(this.pos.getDirectionTo(target));
		target.move(target.pos.getDirectionTo(this));
		return OK;
	} else {
		return ERR_NO_PATH;
	}
}

Creep.prototype.travelClear = function travelClear() {
	_.set(this, ["memory", "path", "destination"], null);
	_.set(this, ["memory", "path", "route"], null);
	_.set(this, ["memory", "path", "exit"], null);
	_.set(this, ["memory", "path", "path_str"], null);
};

Creep.prototype.travelTask = function travelTask(dest) {
	if (this.memory.task["subtype"] == "harvest" && this.memory.role == "burrower")
		return this.travelTask_Burrower();

	let pos = _.get(this, ["memory", "task", "pos"]) == null ? null
		: new RoomPosition(this.memory.task["pos"].x, this.memory.task["pos"].y, this.memory.task["pos"].roomName);
	if (pos != null)
		return this.travel(pos);
	else if (dest != null)
		return this.travel(dest);
	else if (_.get(this, ["memory", "task", "id"]) != null) {
		let obj = Game.getObjectById(_.get(this, ["memory", "task", "id"]));
		if (obj != null)
			return this.travel(obj);
	}

	return ERR_NO_PATH;
};

Creep.prototype.travelTask_Burrower = function travelTask_Burrower() {
	let result;

	if (_.get(this.memory.task, "container") != null) {
		let container = Game.getObjectById(this.memory.task["container"]);
		if (container != null) {
			let cont_cr = _.head(container.pos.lookFor(LOOK_CREEPS));
			if (_.get(cont_cr, ["memory", "role"]) != "burrower")
				result = this.travel(container.pos);
			if (result == OK)
				return result;
		}
	}

	let position = new RoomPosition(this.memory.task["pos"].x, this.memory.task["pos"].y, this.memory.task["pos"].roomName);
	let pos_cr = _.head(position.lookFor(LOOK_CREEPS));
	if (_.get(pos_cr, ["memory", "role"]) != "burrower")
		result = this.travel(position);
	if (result == OK)
		return OK;

	let source = Game.getObjectById(this.memory.task["id"]);
	return this.travel(source.pos);
};

Creep.prototype.moveFrom = function moveFrom(target) {
	let tgtDir = this.pos.getDirectionTo(target);
	let moveDir;

	switch (tgtDir) {
		default:
		case TOP: moveDir = BOTTOM; break;
		case TOP_RIGHT: moveDir = BOTTOM_LEFT; break;
		case RIGHT: moveDir = LEFT; break;
		case BOTTOM_RIGHT: moveDir = TOP_LEFT; break;
		case BOTTOM: moveDir = TOP; break;
		case BOTTOM_LEFT: moveDir = TOP_RIGHT; break;
		case LEFT: moveDir = RIGHT; break;
		case TOP_LEFT: moveDir = BOTTOM_RIGHT; break;
	}

	return this.move(moveDir);
};

Creep.prototype.moveFromSource = function moveFromSource() {
	let sources = this.pos.findInRange(FIND_SOURCES, 1);
	if (sources != null && sources.length > 0) {
		this.moveFrom(sources[0]);
	}
};



/* ***********************************************************
 *	[sec01e] OVERLOADS: LAB
 * *********************************************************** */

StructureLab.prototype.canBoost = function canBoost(mineral) {
	return this.energy > 20 && this.mineralAmount > 30
		&& (mineral == null || mineral == this.mineralType);
}



/* ***********************************************************
 *	[sec01f] OVERLOADS: ROOM
 * *********************************************************** */

Room.prototype.store = function store(resource) {
	let amount = (_.get(this, ["storage", "my"], false) ? _.get(this, ["storage", "store", resource], 0) : 0)
		+ (_.get(this, ["terminal", "my"], false) ? _.get(this, ["terminal", "store", resource], 0) : 0);
	return amount;
};


Room.prototype.getLevel = function getLevel() {
	if (this.energyCapacityAvailable == 0)
		return 0;
	else if (this.energyCapacityAvailable < 550)      // lvl 1, 300 energy
		return 1;
	else if (this.energyCapacityAvailable < 800)      // lvl 2, 550 energy
		return 2;
	else if (this.energyCapacityAvailable < 1300)     // lvl 3, 800 energy
		return 3;
	else if (this.energyCapacityAvailable < 1800)     // lvl 4, 1300 energy
		return 4;
	else if (this.energyCapacityAvailable < 2300)     // lvl 5, 1800 energy
		return 5;
	else if (this.energyCapacityAvailable < 5600)     // lvl 6, 2300 energy
		return 6;
	else if (this.energyCapacityAvailable < 12900)    // lvl 7, 5600 energy
		return 7;
	else											  // lvl 8, 12900 energy
		return 8;
},

	Room.prototype.getLevel_Available = function getLevel() {
		if (this.energyAvailable < 550)
			return 1;
		else if (this.energyAvailable < 800)
			return 2;
		else if (this.energyAvailable < 1300)
			return 3;
		else if (this.energyAvailable < 1800)
			return 4;
		else if (this.energyAvailable < 2300)
			return 5;
		else if (this.energyAvailable < 5600)
			return 6;
		else if (this.energyAvailable < 12900)
			return 7;
		else
			return 8;
	},

	Room.prototype.getWallTarget = function getWallTarget() {
		let level = this.getLevel();
		let t = [0,
			10000,
			25000,
			50000,
			100000,
			500000,
			1000000,
			2500000,
			5000000];
		return t[level];
	},

	Room.prototype.getLowEnergy = function getLowEnergy() {
		let level = this.getLevel();
		let energy = [0,
			0,
			0,
			0,
			20000,
			60000,
			100000,
			150000,
			200000];
		return energy[level];
	},

	Room.prototype.getCriticalEnergy = function getCriticalEnergy() {
		return this.getLowEnergy() / 2;
	},

	Room.prototype.getExcessEnergy = function getExcessEnergy() {
		return this.getLowEnergy() * 2;
	},

	Room.prototype.findRepair_Critical = function findRepair_Critical() {
		return this.find(FIND_STRUCTURES, {
			filter: (s) => {
				return (s.structureType == "rampart" && s.my
					&& s.hits < _.get(Memory, ["rooms", this.name, "defense", "wall_hp_target"], this.getWallTarget()) * 0.1)
					|| (s.structureType == "constructedWall" && s.hits < s.hitsMax
						&& s.hits < _.get(Memory, ["rooms", this.name, "defense", "wall_hp_target"], this.getWallTarget()) * 0.1)
					|| (s.structureType == "container" && s.hits < s.hitsMax * 0.1)
					|| (s.structureType == "road" && s.hits < s.hitsMax * 0.1);
			}
		}).sort((a, b) => { return a.hits - b.hits });
	},

	Room.prototype.findRepair_Maintenance = function findRepair_Maintenance() {
		return this.find(FIND_STRUCTURES, {
			filter: (s) => {
				return (s.structureType == "rampart" && s.my
					&& s.hits < _.get(Memory, ["rooms", this.name, "defense", "wall_hp_target"], this.getWallTarget()))
					|| (s.structureType == "constructedWall" && s.hits < s.hitsMax
						&& s.hits < _.get(Memory, ["rooms", this.name, "defense", "wall_hp_target"], this.getWallTarget()))
					|| (s.structureType == "container" && s.hits < s.hitsMax * 0.8)
					|| (s.structureType == "road" && s.hits < s.hitsMax * 0.8)
					|| ((s.structureType == "spawn" || s.structureType == "extension" || s.structureType == "link" || s.structureType == "storage"
						|| s.structureType == "tower" || s.structureType == "observer" || s.structureType == "extractor" || s.structureType == "lab"
						|| s.structureType == "terminal" || s.structureType == "nuker" || s.structureType == "powerSpawn")
						&& s.hits < s.hitsMax && s.my);
			}
		}).sort((a, b) => { return a.hits - b.hits });
	}

	Room.prototype.findSources = function findSources(checkEnergy = false) {
		return _.filter(this.find(FIND_SOURCES),
			s => { return !s.pos.isAvoided() && (checkEnergy == true ? s.energy > 0 : true) });
	}



/* ***********************************************************
 *	[sec01g] OVERLOADS: ROOMPOSITION
 * *********************************************************** */

RoomPosition.prototype.isAvoided = function isAvoided() {
	return _.findIndex(_.get(Memory, ["hive", "paths", "avoid", "rooms", this.roomName], null),
		p => { return p.x == this.x && p.y == this.y && p.roomName == this.roomName; }) >= 0;
}

RoomPosition.prototype.isBuildable = function isBuildable() {
	if (!this.isValid())
		return false;

	let look = this.look();

	let terrain = _.head(_.filter(look, l => l.type == "terrain"))["terrain"];
	if (terrain == "wall")
		return false;

	let structures = _.filter(look, l => l.type == "structure");
	for (let s in structures) {
		if (structures[s].structure.structureType != "road"
			&& (structures[s].structure.structureType != "rampart" || !structures[s].structure.my))
			return false;
	}

	return true;
};

RoomPosition.prototype.isEdge = function isEdge() {
	return (this.x == 0 || this.x == 49 || this.y == 0 || this.y == 49);
};

RoomPosition.prototype.isValid = function isValid() {
	return !(this.x < 0 || this.x > 49 || this.y < 0 || this.y > 49);
}

RoomPosition.prototype.isWalkable = function isWalkable(creeps_block) {
	if (!this.isValid())
		return false;

	let look = this.look();
	let terrain = _.head(_.filter(look, l => l.type == "terrain"))["terrain"];
	let structures = _.filter(look, l => l.type == "structure");

	if (terrain == "wall") {
		for (let s in structures)
			if (structures[s].structure.structureType == "road")
				return true;

		return false;
	}


	for (let s in structures) {
		if (structures[s].structure.structureType != "container" && structures[s].structure.structureType != "road"
			&& (structures[s].structure.structureType != "rampart" || !structures[s].structure.my))
			return false;
	}

	if (creeps_block) {
		let creeps = _.filter(look, l => l.type == "creep");
		if (creeps.length > 0)
			return false;
	}

	return true;
};

RoomPosition.prototype.getTileInDirection = function getTileInDirection(dir) {
	let nX = this.x;
	let nY = this.y;

	switch (dir) {
		case 0: case "0":
			break;

		case 1: case "1":
			nY = nY - 1;
			break;

		case 2: case "2":
			nX = nX + 1;
			nY = nY - 1;
			break;

		case 3: case "3":
			nX = nX + 1;
			break;

		case 4: case "4":
			nX = nX + 1;
			nY = nY + 1;
			break;

		case 5: case "5":
			nY = nY + 1;
			break;

		case 6: case "6":
			nX = nX - 1;
			nY = nY + 1;
			break;

		case 7: case "7":
			nX = nX - 1;
			break;

		case 8: case "8":
			nX = nX - 1;
			nY = nY - 1;
			break;
	}

	if (nX < 0 || nX > 49 || nY < 0 || nY > 49)
		return null;
	else
		return new RoomPosition (nX, nY, this.roomName);

};

RoomPosition.prototype.inRangeToListTargets = function inRangeToListTargets(listTargets, range) {
	for (let i = 0; i < listTargets.length; i++) {
		if (this.getRangeTo(listTargets[i].pos.x, listTargets[i].pos.y) < range)
			return true;
	}

	return false;
};

RoomPosition.prototype.getAccessAmount = function getAccessAmount(creeps_block) {
	let access = 0;

	access += new RoomPosition(this.x - 1, this.y - 1, this.roomName).isWalkable(creeps_block) ? 1 : 0;
	access += new RoomPosition(this.x, this.y - 1, this.roomName).isWalkable(creeps_block) ? 1 : 0;
	access += new RoomPosition(this.x + 1, this.y - 1, this.roomName).isWalkable(creeps_block) ? 1 : 0;
	access += new RoomPosition(this.x - 1, this.y, this.roomName).isWalkable(creeps_block) ? 1 : 0;
	access += new RoomPosition(this.x + 1, this.y, this.roomName).isWalkable(creeps_block) ? 1 : 0;
	access += new RoomPosition(this.x - 1, this.y + 1, this.roomName).isWalkable(creeps_block) ? 1 : 0;
	access += new RoomPosition(this.x, this.y + 1, this.roomName).isWalkable(creeps_block) ? 1 : 0;
	access += new RoomPosition(this.x + 1, this.y + 1, this.roomName).isWalkable(creeps_block) ? 1 : 0;

	return access;
};

RoomPosition.prototype.getOpenTile_Adjacent = function getOpenTile_Adjacent(creeps_block) {
	return (this.getOpenTile_Range(1, creeps_block));
};

RoomPosition.prototype.getBuildableTile_Adjacent = function getBuildableTile_Adjacent() {
	return (this.getBuildableTile_Range(1));
};

RoomPosition.prototype.getOpenTile_Range = function getOpenTile_Range(range, creeps_block) {
	for (let x = -range; x <= range; x++) {
		for (let y = -range; y <= range; y++) {
			let newPos = new RoomPosition(this.x + x, this.y + y, this.roomName);

			if (!newPos.isValid())
				continue;

			if (newPos.isWalkable(creeps_block))
				return newPos;
		}
	}

	return null;
};

RoomPosition.prototype.getBuildableTile_Range = function getBuildableTile_Range(range) {
	for (let x = -range; x <= range; x++) {
		for (let y = -range; y <= range; y++) {
			let newPos = new RoomPosition(this.x + x, this.y + y, this.roomName);

			if (!newPos.isValid())
				continue;

			if (newPos.isBuildable())
				return newPos;
		}
	}

	return null;
};

RoomPosition.prototype.getOpenTile_Path = function getOpenTile_Path(range, creeps_block) {
	for (let x = -range; x <= range; x++) {
		for (let y = -range; y <= range; y++) {
			let newPos = new RoomPosition(this.x + x, this.y + y, this.roomName);

			if (!newPos.isValid())
				continue;

			if (newPos.isWalkable(creeps_block)) {
				let path = this.findPathTo(newPos.x, newPos.y, { maxOps: 200, ignoreCreeps: true, ignoreRoads: true });
				if (path.length <= 2)
					return newPos;
			}
		}
	}

	return null;
};



/* ***********************************************************
 *	[sec02a] DEFINITIONS: POPULATIONS
 * *********************************************************** */

Population_Industry =
	{ courier: { level: 6, amount: 1 } };

Population_Colonization =
	{ colonizer: { level: 6, amount: 1, body: "reserver_at", scale: false } };


Population_Colony = {
	Standalone: {
		1: { worker: { level: 1, amount: 5, body: "worker_at" } },
		2: { worker: { level: 2, amount: 5, body: "worker_at" } },
		3: { worker: { level: 3, amount: 6, body: "worker_at" } },
		4: { worker: { level: 4, amount: 6, body: "worker_at" } },
		5: { worker: { level: 4, amount: 6, body: "worker_at" } },
		6: { worker: { level: 4, amount: 6 } },
		7: { worker: { level: 7, amount: 5 } },
		8: { worker: { level: 7, amount: 4 } }
	},

	Assisted: {
		1: { worker: { level: 3, amount: 4, body: "worker_at" } },
		2: { worker: { level: 3, amount: 4, body: "worker_at" } },
		3: { worker: { level: 4, amount: 6, body: "worker_at" } },
		4: { worker: { level: 5, amount: 6, body: "worker_at" } },
		5: { worker: { level: 6, amount: 6, body: "worker_at" } },
		6: { worker: { level: 6, amount: 6 } },
		7: { worker: { level: 7, amount: 5 } },
		8: { worker: { level: 7, amount: 4 } }
	}
};


Population_Mining = {
	S1: {
		1: { miner: { level: 1, amount: 2, body: "worker_at" } },
		2: {
			miner: { level: 2, amount: 2, body: "worker_at" },
			burrower: { level: 2, amount: 1, body: "burrower_at" },
			carrier: { level: 2, amount: 2, body: "carrier_at"}
		},
		3: {
			miner: { level: 2, amount: 2, body: "worker_at" },
			burrower: { level: 2, amount: 1, body: "burrower_at" },
			carrier: { level: 2, amount: 2, body: "carrier_at" }
		},
		4: {
			burrower: { level: 3, amount: 1, body: "burrower_at" },
			carrier: { level: 3, amount: 2, body: "carrier_at" }
		},
		5: {
			burrower: { level: 4, amount: 1, body: "burrower_at" },
			carrier: { level: 4, amount: 2, body: "carrier_at" }
		},
		6: {
			burrower: { level: 4, amount: 1 },
			carrier: { level: 4, amount: 2 },
			extractor: { level: 4, amount: 2 }
		},
		7: {
			burrower: { level: 7, amount: 1 },
			carrier: { level: 7, amount: 2 },
			extractor: { level: 7, amount: 2 }
		},
		8: {
			burrower: { level: 7, amount: 1 },
			carrier: { level: 7, amount: 2 },
			extractor: { level: 8, amount: 2 }
		}
	},

	S2: {
		1: { miner: { level: 1, amount: 2, body: "worker_at" } },
		2: {
			miner: { level: 2, amount: 2, body: "worker_at" },
			burrower: { level: 2, amount: 2, body: "burrower_at" },
			carrier: { level: 2, amount: 2, body: "carrier_at" }
		},
		3: {
			miner: { level: 2, amount: 2, body: "worker_at" },
			burrower: { level: 2, amount: 2, body: "burrower_at" },
			carrier: { level: 2, amount: 3, body: "carrier_at" }
		},
		4: {
			burrower: { level: 3, amount: 2, body: "burrower_at" },
			carrier: { level: 3, amount: 3, body: "carrier_at" }
		},
		5: {
			burrower: { level: 4, amount: 2, body: "burrower_at" },
			carrier: { level: 4, amount: 3, body: "carrier_at" }
		},
		6: {
			burrower: { level: 4, amount: 2 },
			carrier: { level: 4, amount: 3 },
			extractor: { level: 4, amount: 2 }
		},
		7: {
			burrower: { level: 7, amount: 2 },
			carrier: { level: 7, amount: 2 },
			extractor: { level: 7, amount: 2 }
		},
		8: {
			burrower: { level: 7, amount: 2 },
			carrier: { level: 6, amount: 3 },
			extractor: { level: 8, amount: 2 }
		}
	},
	R0: {
		1: { multirole: { level: 1, amount: 1 } },
		2: { multirole: { level: 2, amount: 1 } },
		3: { multirole: { level: 3, amount: 1 } },
		4: { multirole: { level: 4, amount: 1 } },
		5: { multirole: { level: 5, amount: 1 } },
		6: { multirole: { level: 5, amount: 1 } },
		7: { multirole: { level: 6, amount: 1 } },
		8: { multirole: { level: 6, amount: 1 } }
	},

	R1: {
		1: { miner: { level: 1, amount: 1, body: "worker_at" } },
		2: {
			burrower: { level: 2, amount: 2, body: "burrower_at" },
			carrier: { level: 2, amount: 2, body: "carrier_at" },
			multirole: { level: 2, amount: 1, body: "worker_at" }
		},
		3: {
			burrower: { level: 2, amount: 2, body: "burrower_at" },
			carrier: { level: 2, amount: 2, body: "carrier_at" },
			multirole: { level: 2, amount: 1, body: "worker_at" }
		},
		4: {
			burrower: { level: 3, amount: 1, body: "burrower_at" },
			carrier: { level: 3, amount: 2, body: "carrier_at" },
			multirole: { level: 3, amount: 1, body: "worker_at" },
			reserver: { level: 3, amount: 2, body: "reserver_at" }
		},
		5: {
			burrower: { level: 4, amount: 1, body: "burrower_at" },
			carrier: { level: 4, amount: 2, body: "carrier_at" },
			multirole: { level: 4, amount: 1, body: "worker_at" },
			reserver: { level: 4, amount: 2, body: "reserver_at" }
		},
		6: {
			burrower: { level: 4, amount: 1, body: "burrower_at" },
			carrier: { level: 4, amount: 2, body: "carrier_at" },
			multirole: { level: 4, amount: 1, body: "worker_at" },
			reserver: { level: 4, amount: 2, body: "reserver_at" }
		},
		7: {
			burrower: { level: 6, amount: 1, body: "burrower_at" },
			carrier: { level: 6, amount: 2, body: "carrier_at" },
			multirole: { level: 5, amount: 1, body: "worker_at" },
			reserver: { level: 7, amount: 1, body: "reserver_at" }
		},
		8: {
			burrower: { level: 6, amount: 1, body: "burrower_at" },
			carrier: { level: 7, amount: 2, body: "carrier_at" },
			multirole: { level: 5, amount: 1, body: "worker_at" },
			reserver: { level: 8, amount: 1, body: "reserver_at" }
		}
	},

	R2: {
		1: { miner: { level: 1, amount: 1, body: "worker_at" } },
		2: {
			burrower: { level: 2, amount: 2, body: "burrower_at" },
			carrier: { level: 2, amount: 4, body: "carrier_at" },
			multirole: { level: 2, amount: 1, body: "worker_at" }
		},
		3: {
			burrower: { level: 2, amount: 2, body: "burrower_at" },
			carrier: { level: 2, amount: 4, body: "carrier_at" },
			multirole: { level: 2, amount: 1, body: "worker_at" }
		},
		4: {
			burrower: { level: 3, amount: 1, body: "burrower_at" },
			carrier: { level: 3, amount: 4, body: "carrier_at" },
			multirole: { level: 3, amount: 1, body: "worker_at" },
			reserver: { level: 3, amount: 2, body: "reserver_at" }
		},
		5: {
			burrower: { level: 4, amount: 1, body: "burrower_at" },
			carrier: { level: 4, amount: 3, body: "carrier_at" },
			multirole: { level: 4, amount: 1, body: "worker_at" },
			reserver: { level: 4, amount: 2, body: "reserver_at" }
		},
		6: {
			burrower: { level: 4, amount: 1, body: "burrower_at" },
			carrier: { level: 4, amount: 3, body: "carrier_at" },
			multirole: { level: 4, amount: 1, body: "worker_at" },
			reserver: { level: 4, amount: 2, body: "reserver_at" }
		},
		7: {
			burrower: { level: 7, amount: 1, body: "burrower_at" },
			carrier: { level: 6, amount: 3, body: "carrier_at" },
			multirole: { level: 5, amount: 1, body: "worker_at" },
			reserver: { level: 7, amount: 1, body: "reserver_at" }
		},
		8: {
			burrower: { level: 7, amount: 1, body: "burrower_at" },
			carrier: { level: 7, amount: 3, body: "carrier_at" },
			multirole: { level: 5, amount: 1, body: "worker_at" },
			reserver: { level: 8, amount: 1, body: "reserver_at" }
		}
	},

	R3: {	// Sector center mining rooms
		1: {}, 2: {}, 3: {}, 4: {}, 5: {}, 6: {},
		7: {
			burrower: { level: 7, amount: 2, body: "burrower_at" },
			carrier: { level: 7, amount: 5, body: "carrier_at" },
			extractor: { level: 7, amount: 2, body: "extractor_rem" },
			multirole: { level: 5, amount: 1, body: "worker_at" }
		},
		8: {
			burrower: { level: 7, amount: 2, body: "burrower_at" },
			carrier: { level: 7, amount: 5, body: "carrier_at" },
			extractor: { level: 7, amount: 2, body: "extractor_rem" },
			multirole: { level: 5, amount: 1, body: "worker_at" }
		}
	},

	SK: {
		paladin: { level: 8, amount: 2, scale: false },
		healer: { level: 4, amount: 1, scale: false },
		burrower: { level: 7, amount: 2, body: "burrower_at" },
		carrier: { level: 7, amount: 5, body: "carrier_at" },
		extractor: { level: 7, amount: 2, body: "extractor_rem" }
	},

	SK_Alt: {
		ranger: { level: 8, amount: 2, scale: false },
		healer: { level: 4, amount: 1, scale: false },
		burrower: { level: 7, amount: 2, body: "burrower_at" },
		carrier: { level: 7, amount: 5, body: "carrier_at" },
		extractor: { level: 7, amount: 2, body: "extractor_rem" }
	}
};



/* ***********************************************************
 *	[sec02b] DEFINITIONS: COMBAT POPULATIONS
 * *********************************************************** */

Population_Combat__Waves = {
	soldier: { amount: 3 },
	healer: { amount: 3 }
};

Population_Combat__Trickle = {
	soldier: { amount: 5 }
};

Population_Combat__Occupy = {
	soldier: { amount: 3 },
	archer: { amount: 2 },
	healer: { amount: 1 }
};

Population_Combat__Dismantle = {
	dismantler: { amount: 3 }
};

Population_Combat__Tower_Drain = {
	tank: { amount: 3 },
	healer: { amount: 3 }
};

Population_Combat__Controller = {
	reserver: { amount: 1, level: 3, body: "reserver_at" }
};



/* ***********************************************************
 *	[sec03a] DEFINITIONS: CREEP BODY
 * *********************************************************** */

let Creep_Body = {

	getPartCount: function (body, part) {
		return _.filter(body, p => { return p == part; }).length;
	},

	getBodyCost: function (body) {
		let cost = 0;
		for (let p in body) {
			switch (body[p]) {
				case "move": cost += 50; break;
				case "work": cost += 100; break;
				case "carry": cost += 50; break;
				case "attack": cost += 80; break;
				case "ranged_attack": cost += 150; break;
				case "heal": cost += 250; break;
				case "claim": cost += 600; break;
				case "tough": cost += 10; break;
			}
		}
		return cost;
	},


	getBody: function (type, level) {
		switch (type) {
			case "scout": return this.getBody_Scout();
			case "soldier": return this.getBody_Soldier(level);
			case "brawler": return this.getBody_Brawler(level);
			case "paladin": return this.getBody_Paladin(level);
			case "tank": return this.getBody_Tank(level);
			case "archer": return this.getBody_Archer(level);
			case "ranger": return this.getBody_Ranger(level);
			case "healer": return this.getBody_Healer(level);
			case "dismantler": return this.getBody_Dismantler(level);
			case "bulldozer": return this.getBody_Bulldozer(level);

			case "multirole": return this.getBody_Multirole(level);
			case "burrower": return this.getBody_Burrower(level);
			case "burrower_at": return this.getBody_Burrower_AT(level);
			case "carrier": return this.getBody_Carrier(level);
			case "carrier_at": return this.getBody_Carrier_AT(level);
			case "extractor": return this.getBody_Extractor(level);
			case "extractor_rem": return this.getBody_Extractor_REM(level);
			case "reserver": return this.getBody_Reserver(level);
			case "reserver_at": return this.getBody_Reserver_AT(level);

			case "worker": return this.getBody_Worker(level);
			case "worker_at": return this.getBody_Worker_AT(level);
			case "courier": return this.getBody_Carrier(level);
		}
	},


	getBody_Scout: function () {
		return [ // 300 energy, 5x MOVE
			MOVE, MOVE, MOVE, MOVE, MOVE];
	},

	getBody_Soldier: function (level) {
		switch (level) {
			case 1:
				return [ // 130 energy, 1x ATTACK, 1x MOVE
					ATTACK, MOVE];
			case 2:
				return [ // 390 energy, 3x ATTACK, 3x MOVE
					ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE];
			case 3:
				return [ // 650 energy, 4x ATTACK, 4x MOVE
					ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE];
			case 4:
				return [ // 910 energy, 6x ATTACK, 6x MOVE
					ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE,
					ATTACK, MOVE];
			case 5:
				return [ // 1700 energy, 10x ATTACK, 12x MOVE, 2x RANGED_ATTACK
					MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK,
					MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK,
					MOVE, MOVE,
					RANGED_ATTACK, RANGED_ATTACK];
			case 6:
				return [ // 2160 energy, 12x ATTACK, 15x MOVE, 3x RANGED_ATTACK
					MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK,
					MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK,
					MOVE, ATTACK, MOVE, ATTACK,
					MOVE, MOVE, MOVE,
					RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK];
			case 7: case 8:
				return [ // 3700 energy, 25x MOVE, 20x ATTACK, 4x RANGED_ATTACK, 1x HEAL
					MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK,
					MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK,
					MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK,
					MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK,
					MOVE, MOVE, MOVE, MOVE, MOVE,
					RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK,
					HEAL];
		}
	},

	getBody_Brawler: function (level) {
		switch (level) {
			default:
				return this.getBody_Soldier(level)
			case 4:
				return [ // 1210 energy, 10 TOUGH, 6x ATTACK, 10x MOVE
					TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH,
					ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE,
					ATTACK, MOVE, MOVE, MOVE, MOVE, MOVE];
			case 5:
				return [ // 1700 energy, 11x ATTACK, 15x MOVE, 4x TOUGH
					TOUGH, TOUGH, TOUGH, TOUGH, MOVE, MOVE, MOVE, MOVE,
					ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE,
					ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE,
					ATTACK, MOVE];
			case 6:
				return [ // 2160 energy, 14x ATTACK, 19x MOVE, 5x TOUGH
					TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, MOVE, MOVE, MOVE, MOVE, MOVE,
					ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE,
					ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE,
					ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE];
			case 7: case 8:
				return [ // 2700 energy, 20x MOVE, 20x ATTACK, 10x TOUGH
					TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH,
					ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE,
					ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE,
					ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE,
					ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE];
		}
	},

	getBody_Paladin: function (level) {
		switch (level) {
			default:
				return this.getBody_Soldier(level);
			case 8:
				return [ // 4450 energy, 25x MOVE, 5x RANGED_ATTACK, 15x ATTACK, 5x HEAL
					MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE,
					MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE,
					MOVE, MOVE, MOVE, MOVE, MOVE,
					RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK,
					ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK,
					ATTACK, ATTACK, ATTACK, ATTACK, ATTACK,
					HEAL, HEAL, HEAL, HEAL, HEAL];
		}
	},

	getBody_Tank: function (level) {
		switch (level) {
			case 1:
				return [ // 240 energy, 4x TOUGH, 4x MOVE
					TOUGH, TOUGH, TOUGH, TOUGH,
					MOVE, MOVE, MOVE, MOVE];
			case 2:
				return [ // 480 energy, 8x TOUGH, 8x MOVE
					TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH,
					MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE];
			case 3:
				return [ // 480 energy, 12x TOUGH, 12x MOVE
					TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH,
					TOUGH, TOUGH,
					MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE,
					MOVE, MOVE];
			case 4: case 5: case 6: case 7: case 8:
				return [ // 1180 energy, 33x TOUGH, 17x MOVE
					TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH,
					TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH,
					TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH,
					TOUGH, TOUGH, TOUGH,
					MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE,
					MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE];
		}
	},

	getBody_Bulldozer: function (level) {
		switch (level) {
			case 1:
				return [ // 210
					TOUGH, WORK,
					MOVE, MOVE];
			case 2:
				return [ // 480
					TOUGH, TOUGH, TOUGH,
					WORK, WORK,
					MOVE, MOVE, MOVE, MOVE, MOVE];
			case 3:
				return [ // 780
					TOUGH, TOUGH, TOUGH,
					WORK, WORK, WORK, WORK,
					MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE];
			case 4:
				return [ // 1290
					TOUGH, TOUGH, TOUGH, TOUGH,
					WORK, WORK, WORK, WORK, WORK, WORK, WORK,
					MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE,
					MOVE];
			case 5:
				return [ // 1770
					TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH,
					WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK,
					MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE,
					MOVE, MOVE, MOVE, MOVE, MOVE, MOVE];
			case 6:
				return [ // 2220
					TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH,
					WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK,
					WORK, WORK,
					MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE,
					MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE];
			case 7: case 8:
				return [ // 2850
					TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH,
					WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK,
					WORK, WORK, WORK, WORK, WORK,
					MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE,
					MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE,
					MOVE, MOVE, MOVE, MOVE, MOVE];
		}
	},

	getBody_Archer: function (level) {
		switch (level) {
			default:
				console.log(`Error @ getBody_Archer, ${level} is not a proper number!`);
				return;
			case 1:
				return [ // 200 energy, 1x RANGED_ATTACK, 1x MOVE
					MOVE, RANGED_ATTACK];
			case 2:
				return [ // 460 energy, 1x TOUGH, 2x RANGED_ATTACK, 3x MOVE
					TOUGH,
					MOVE, MOVE, MOVE,
					RANGED_ATTACK, RANGED_ATTACK];
			case 3:
				return [ // 720 energy, 2x TOUGH, 3x RANGED_ATTACK, 5x MOVE
					TOUGH, TOUGH,
					MOVE, MOVE, MOVE, MOVE, MOVE,
					RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK];
			case 4:
				return [ // 1000 energy, 5x RANGED_ATTACK, 5x MOVE
					RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK,
					MOVE, MOVE, MOVE, MOVE, MOVE];
			case 5:
				return [ // 1600 energy, 8x RANGED_ATTACK, 8x MOVE
					RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK,
					RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK,
					MOVE, MOVE, MOVE, MOVE, MOVE,
					MOVE, MOVE, MOVE];
			case 6:
				return [ // 2000 energy, 10x RANGED_ATTACK, 10x MOVE
					RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK,
					RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK,
					MOVE, MOVE, MOVE, MOVE, MOVE,
					MOVE, MOVE, MOVE, MOVE, MOVE];
			case 7:
				return [ // 4000 energy, 20x RANGED_ATTACK, 20x MOVE
					RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK,
					RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK,
					RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK,
					RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK,
					MOVE, MOVE, MOVE, MOVE, MOVE,
					MOVE, MOVE, MOVE, MOVE, MOVE,
					MOVE, MOVE, MOVE, MOVE, MOVE,
					MOVE, MOVE, MOVE, MOVE, MOVE];
			case 8:
				return [ // 5000 energy, 25x RANGED_ATTACK, 25x MOVE
					RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK,
					RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK,
					RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK,
					RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK,
					RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK,
					MOVE, MOVE, MOVE, MOVE, MOVE,
					MOVE, MOVE, MOVE, MOVE, MOVE,
					MOVE, MOVE, MOVE, MOVE, MOVE,
					MOVE, MOVE, MOVE, MOVE, MOVE,
					MOVE, MOVE, MOVE, MOVE, MOVE];
		}
	},

	getBody_Ranger: function (level) {
		switch (level) {
			default:
				console.log(`Error @ getBody_Ranger, ${level} is not a proper number!`);
				return;
			case 1:
				return [ // 200 energy, 1x RANGED_ATTACK, 1x MOVE
					RANGED_ATTACK, MOVE];
			case 2:
				return [ // 460 energy, 1x TOUGH, 2x RANGED_ATTACK, 3x MOVE
					TOUGH,
					RANGED_ATTACK, RANGED_ATTACK,
					MOVE, MOVE, MOVE];
			case 3:
				return [ // 720 energy, 2x TOUGH, 3x RANGED_ATTACK, 5x MOVE
					TOUGH, TOUGH,
					RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK,
					MOVE, MOVE, MOVE, MOVE, MOVE];
			case 4:
				return [ // 1100 energy, 4x RANGED_ATTACK, 5x MOVE, 1x HEAL
					RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK,
					MOVE, MOVE, MOVE, MOVE, MOVE,
					HEAL];
			case 5:
				return [ // 1500 energy, 6x RANGED_ATTACK, 7x MOVE, 1x HEAL
					RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK,
					RANGED_ATTACK,
					MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE,
					HEAL];
			case 6:
				return [ // 1800 energy, 6x RANGED_ATTACK, 8x MOVE, 2x HEAL
					RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK,
					RANGED_ATTACK,
					MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE,
					HEAL, HEAL];
			case 7:
				return [ // 3600 energy, 12x RANGED_ATTACK, 16x MOVE, 4x HEAL
					RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK,
					RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK,
					RANGED_ATTACK, RANGED_ATTACK,
					MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE,
					MOVE, MOVE, MOVE, MOVE, MOVE, MOVE,
					HEAL, HEAL, HEAL, HEAL];
			case 8:
				return [ // 4800 energy, 5x TOUGH, 25x MOVE, 15x RANGED_ATTACK, 5x HEAL,
					TOUGH, TOUGH, TOUGH, TOUGH, TOUGH,
					MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE,
					MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE,
					MOVE, MOVE, MOVE, MOVE, MOVE,
					RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK,
					RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK,
					RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK,
					HEAL, HEAL, HEAL, HEAL, HEAL];
		}
	},

	getBody_Healer: function (level) {
		switch (level) {
			case 1: case 2:
				return [ // 300 energy, 1x HEAL, 1x MOVE
					HEAL, MOVE];
			case 3:
				return [ // 600 energy, 2x HEAL, 2x MOVE
					HEAL, MOVE, HEAL, MOVE];
			case 4:
				return [ // 1200 energy, 4x HEAL, 4x MOVE
					HEAL, MOVE, HEAL, MOVE, HEAL, MOVE, HEAL, MOVE];
			case 5:
				return [ // 1680 energy, 5x HEAL, 8x MOVE, 3x TOUGH
					TOUGH, TOUGH, TOUGH,
					MOVE, MOVE, MOVE,
					HEAL, MOVE, HEAL, MOVE, HEAL, MOVE, HEAL, MOVE, HEAL, MOVE];
			case 6:
				return [ // 2100 energy, 6x HEAL, 11x MOVE, 5x TOUGH
					TOUGH, TOUGH, TOUGH, TOUGH, TOUGH,
					MOVE, MOVE, MOVE, MOVE, MOVE,
					HEAL, MOVE, HEAL, MOVE, HEAL, MOVE, HEAL, MOVE, HEAL, MOVE,
					HEAL, MOVE];
			case 7:
				return [ // 4800 energy, 15x HEAL, 15x MOVE
					TOUGH, TOUGH, TOUGH, TOUGH, TOUGH,
					MOVE, MOVE, MOVE, MOVE, MOVE,
					HEAL, MOVE, HEAL, MOVE, HEAL, MOVE, HEAL, MOVE, HEAL, MOVE,
					HEAL, MOVE, HEAL, MOVE, HEAL, MOVE, HEAL, MOVE, HEAL, MOVE,
					HEAL, MOVE, HEAL, MOVE, HEAL, MOVE, HEAL, MOVE, HEAL, MOVE];
			case 8:
				return [ // 6300 energy, 20x HEAL, 5x TOUGH, 25x MOVE
					TOUGH, TOUGH, TOUGH, TOUGH, TOUGH,
					MOVE, MOVE, MOVE, MOVE, MOVE,
					HEAL, MOVE, HEAL, MOVE, HEAL, MOVE, HEAL, MOVE, HEAL, MOVE,
					HEAL, MOVE, HEAL, MOVE, HEAL, MOVE, HEAL, MOVE, HEAL, MOVE,
					HEAL, MOVE, HEAL, MOVE, HEAL, MOVE, HEAL, MOVE, HEAL, MOVE,
					HEAL, MOVE, HEAL, MOVE, HEAL, MOVE, HEAL, MOVE, HEAL, MOVE];
		}
	},

	getBody_Multirole: function (level) {
		switch (level) {
			case 1:
				return [ // 280 energy, 1x WORK, 1x CARRY, 1x MOVE, 1x ATTACK
					WORK, CARRY,
					MOVE,
					ATTACK];
			case 2:
				return [ // 430 energy, 1x WORK, 2x CARRY, 3x MOVE, 1x ATTACK
					WORK, CARRY, CARRY,
					MOVE, MOVE, MOVE,
					ATTACK];
			case 3:
				return [ // 730 energy, 2x WORK, 3x CARRY, 6x MOVE, 1x ATTACK
					WORK, WORK, CARRY, CARRY, CARRY,
					MOVE, MOVE, MOVE, MOVE, MOVE, MOVE,
					ATTACK];
			case 4:
				return [ // 1110 energy, 3x WORK, 5x CARRY, 8x MOVE, 2x ATTACK
					WORK, WORK, WORK,
					CARRY, CARRY, CARRY, CARRY, CARRY,
					MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE,
					ATTACK, ATTACK];
			case 5:
				return [ // 1690 energy, 4x WORK, 6x CARRY, 12x MOVE, 1x RANGED_ATTACK, 3x ATTACK
					WORK, WORK, WORK, WORK,
					CARRY, CARRY, CARRY, CARRY, CARRY, CARRY,
					MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE,
					MOVE, MOVE,
					RANGED_ATTACK,
					ATTACK, ATTACK, ATTACK];
			case 6:
				return [ // 2160 energy, 6x WORK, 8x CARRY, 14x MOVE, 2x RANGED_ATTACK, 2x ATTACK
					WORK, WORK, WORK, WORK, WORK, WORK,
					CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY,
					MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE,
					MOVE, MOVE, MOVE, MOVE,
					RANGED_ATTACK, RANGED_ATTACK,
					ATTACK, ATTACK];
			case 7: case 8:
				return [ // 3380 energy, 6x WORK, 10x CARRY, 25x MOVE, 4x RANGED_ATTACK, 5x ATTACK
					WORK, WORK, WORK, WORK, WORK, WORK,
					CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY,
					MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE,
					MOVE, MOVE, MOVE, MOVE, MOVE, MOVE,
					RANGED_ATTACK, MOVE, RANGED_ATTACK, MOVE, RANGED_ATTACK, MOVE, RANGED_ATTACK, MOVE,
					ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE];
		}
	},

	getBody_Worker: function (level) {
		switch (level) {
			case 1:
				return [ // 300 energy, 1x WORK, 2x CARRY, 2x MOVE
					WORK,
					CARRY, CARRY,
					MOVE, MOVE];
			case 2:
				return [ // 500 energy, 2x WORK, 2x CARRY, 4x MOVE
					WORK, WORK,
					CARRY, CARRY,
					MOVE, MOVE, MOVE, MOVE];
			case 3:
				return [ // 700 energy, 3x WORK, 4x CARRY, 4x MOVE
					WORK, WORK, WORK,
					CARRY, CARRY, CARRY, CARRY,
					MOVE, MOVE, MOVE, MOVE,];
			case 4:
				return [ // 1100 energy, 5x WORK, 6x CARRY, 6x MOVE
					WORK, WORK, WORK, WORK, WORK,
					CARRY, CARRY, CARRY, CARRY, CARRY, CARRY,
					MOVE, MOVE, MOVE, MOVE, MOVE, MOVE];
			case 5:
				return [ // 1600 energy, 8x WORK, 8x CARRY, 8x MOVE
					WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK,
					CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY,
					MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE];
			case 6:
				return [ // 2000 energy, 10x WORK, 10x CARRY, 10x MOVE
					WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK,
					CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY,
					MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE];
			case 7:
				return [ // 3000 energy, 15x WORK, 13x CARRY, 17x MOVE
					WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK,
					WORK, WORK, WORK, WORK, WORK,
					CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY,
					CARRY, CARRY, CARRY,
					MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE,
					MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE];
			case 8:
				return [ // 3500 energy, 20x WORK, 13x CARRY, 17 MOVE
					WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK,
					WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK,
					CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY,
					CARRY, CARRY, CARRY,
					MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE,
					MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE];
		}
	},

	getBody_Worker_AT: function (level) {
		switch (level) {
			case 1:
				return [ // 250 energy, 1x WORK, 1x CARRY, 2x MOVE
					WORK,
					CARRY,
					MOVE, MOVE];
			case 2:
				return [ // 400 energy, 2x WORK, 1x CARRY, 3x MOVE
					WORK, WORK,
					CARRY,
					MOVE, MOVE, MOVE];
			case 3:
				return [ // 700 energy, 3x WORK, 3x CARRY, 6x MOVE
					WORK, WORK, WORK,
					CARRY, CARRY, CARRY,
					MOVE, MOVE, MOVE, MOVE, MOVE, MOVE];
			case 4:
				return [ // 1150 energy, 5x WORK, 4x CARRY, 9x MOVE
					WORK, WORK, WORK, WORK, WORK,
					CARRY, CARRY, CARRY, CARRY,
					MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE];
			case 5:
				return [ // 1650 energy, 7x WORK, 6x CARRY, 13x MOVE
					WORK, WORK, WORK, WORK, WORK, WORK, WORK,
					CARRY, CARRY, CARRY, CARRY, CARRY, CARRY,
					MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE,
					MOVE, MOVE, MOVE];
			case 6:
				return [ // 2200 energy, 10x WORK, 7x CARRY, 17x MOVE
					WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK,
					CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY,
					MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE,
					MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE];
			case 7: case 8:
				return [ // 3100 energy, 15x WORK, 10x CARRY, 25x MOVE
					WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK,
					WORK, WORK, WORK, WORK, WORK,
					CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY,
					MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE,
					MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE,
					MOVE, MOVE, MOVE, MOVE, MOVE];
		}
	},

	getBody_Burrower: function (level) {
		switch (level) {
			case 1:
				return [ // 300 energy, 2x WORK, 2x MOVE
					WORK, MOVE, WORK, MOVE];
			case 2:
				return [ // 500 energy, 4x WORK, 2x MOVE
					WORK, WORK, WORK, WORK,
					MOVE, MOVE];
			case 3:
				return [ // 600 energy, 4x WORK, 1 CARRY, 3x MOVE
					WORK, WORK, WORK, WORK,
					CARRY,
					MOVE, MOVE, MOVE];
			case 4:
				return [ // 1100 energy, 8x WORK, 1x CARRY, 5x MOVE
					WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK,
					CARRY,
					MOVE, MOVE, MOVE, MOVE, MOVE];
			case 5:
				return [ // 1550 energy, 12x WORK, 1x CARRY, 7x MOVE
					WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK,
					WORK, WORK,
					CARRY,
					MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE];
			case 6:
				return [ // 1850 energy, 14x WORK, 1x CARRY, 8x MOVE
					WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK,
					WORK, WORK, WORK, WORK,
					CARRY,
					MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE];
			case 7:
				return [ // 2700 energy, 20x WORK, 2x CARRY, 12x MOVE
					WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK,
					WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK,
					CARRY, CARRY,
					MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE,
					MOVE, MOVE];
			case 8:
				return [ // 3900 energy, 28x WORK, 2x CARRY, 20x MOVE
					WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK,
					WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK,
					WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK,
					CARRY, CARRY,
					MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE,
					MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE];
		}
	},

	getBody_Burrower_AT: function (level) {
		switch (level) {
			case 1:
				return [ // 300 energy, 2x WORK, 2x MOVE
					WORK, MOVE, WORK, MOVE];
			case 2:
				return [ // 450 energy, 3x WORK, 3x MOVE
					WORK, MOVE, WORK, MOVE, WORK, MOVE];
			case 3:
				return [ // 600 energy, 4x WORK, 4x MOVE
					WORK, WORK, WORK, WORK,
					MOVE, MOVE, MOVE, MOVE];
			case 4:
				return [ // 1150 energy, 7x WORK, 1x CARRY, 8x MOVE
					WORK, WORK, WORK, WORK, WORK, WORK, WORK,
					CARRY,
					MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE];
			case 5:
				return [ // 1600 energy, 10x WORK, 1x CARRY, 11x MOVE
					WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK,
					CARRY,
					MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE,
					MOVE];
			case 6:
				return [ // 2050 energy, 13x WORK, 1x CARRY 14x MOVE
					WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK,
					WORK, WORK, WORK,
					CARRY,
					MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE,
					MOVE, MOVE, MOVE, MOVE];
			case 7:
				return [ // 2900 energy, 18x WORK, 2x CARRY, 20x MOVE
					WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK,
					WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK,
					CARRY, CARRY,
					MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE,
					MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE];
			case 8:
				return [ // 3650 energy, 23x WORK, 2x CARRY, 25x MOVE
					WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK,
					WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK,
					WORK, WORK, WORK,
					CARRY, CARRY,
					MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE,
					MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE,
					MOVE, MOVE, MOVE, MOVE, MOVE];
		}
	},

	getBody_Dredger: function (level) {
		switch (level) {
			default:
				return getBody_Burrower(level);
			case 7: case 8:
				return [ // 5250 energy, 10x WORK, 14x MOVE, 10x RANGED_ATTACK, 8X HEAL
					WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK,
					MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE,
					MOVE, MOVE, MOVE, MOVE,
					RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK,
					RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK,
					HEAL, HEAL, HEAL, HEAL, HEAL, HEAL, HEAL, HEAL];
		}
	},

	getBody_Dismantler: function (level) {
		switch (level) {
			default:
				return this.getBody_Burrower_AT(level);
			case 7: case 8:
				return [ // 3100 energy, 10x TOUGH, 20x WORK, 20x MOVE
					TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH,
					WORK, MOVE, WORK, MOVE, WORK, MOVE, WORK, MOVE, WORK, MOVE,
					WORK, MOVE, WORK, MOVE, WORK, MOVE, WORK, MOVE, WORK, MOVE,
					WORK, MOVE, WORK, MOVE, WORK, MOVE, WORK, MOVE, WORK, MOVE,
					WORK, MOVE, WORK, MOVE, WORK, MOVE, WORK, MOVE, WORK, MOVE];
		}
	},

	getBody_Extractor: function (level) {
		switch (level) {
			case 1:
				return [ // 300 energy, 1x WORK, 2x CARRY, 2x MOVE
					WORK,
					CARRY, CARRY,
					MOVE, MOVE];
			case 2:
				return [ // 450 energy, 2x WORK, 2x CARRY, 3x MOVE
					WORK, WORK,
					CARRY, CARRY,
					MOVE, MOVE, MOVE];
			case 3:
				return [ // 700 energy, 3x WORK, 4x CARRY, 4x MOVE
					WORK, WORK, WORK,
					CARRY, CARRY, CARRY, CARRY,
					MOVE, MOVE, MOVE, MOVE,];
			case 4:
				return [ // 1100 energy, 5x WORK, 6x CARRY, 6x MOVE
					WORK, WORK, WORK, WORK, WORK,
					CARRY, CARRY, CARRY, CARRY, CARRY, CARRY,
					MOVE, MOVE, MOVE, MOVE, MOVE, MOVE];
			case 5:
				return [ // 1600 energy, 8x WORK, 8x CARRY, 8x MOVE
					WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK,
					CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY,
					MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE];
			case 6:
				return [ // 2000 energy, 14x WORK, 4x CARRY, 8x MOVE
					WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK,
					WORK, WORK, WORK, WORK,
					CARRY, CARRY, CARRY, CARRY,
					MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE];
			case 7: case 8:
				return [ // 3750 energy, 25x WORK, 8x CARRY, 17x MOVE
					WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK,
					WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK,
					WORK, WORK, WORK, WORK, WORK,
					CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY,
					MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE,
					MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE];
		}
	},

	getBody_Extractor_REM: function (level) {
		switch (level) {
			case 1:
				return [ // 250 energy, 1x WORK, 1x CARRY, 2x MOVE
					WORK,
					CARRY,
					MOVE, MOVE];
			case 2:
				return [ // 400 energy, 2x WORK, 1x CARRY, 3x MOVE
					WORK, WORK,
					CARRY,
					MOVE, MOVE, MOVE];
			case 3:
				return [ // 700 energy, 4x WORK, 2x CARRY, 4x MOVE
					WORK, WORK, WORK, WORK,
					CARRY, CARRY,
					MOVE, MOVE, MOVE, MOVE,];
			case 4:
				return [ // 1050 energy, 6x WORK, 3x CARRY, 6x MOVE
					WORK, WORK, WORK, WORK, WORK, WORK,
					CARRY, CARRY, CARRY,
					MOVE, MOVE, MOVE, MOVE, MOVE, MOVE];
			case 5:
				return [ // 1550 energy, 9x WORK, 5x CARRY, 8x MOVE
					WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK,
					CARRY, CARRY, CARRY, CARRY, CARRY,
					MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE];
			case 6:
				return [ // 2150 energy, 14x WORK, 5x CARRY, 10x MOVE
					WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK,
					WORK, WORK, WORK, WORK,
					CARRY, CARRY, CARRY, CARRY, CARRY,
					MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE];
			case 7: case 8:
				return [ // 3650 energy, 23x WORK, 10x CARRY, 17x MOVE
					WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK,
					WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK,
					WORK, WORK, WORK,
					CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY,
					MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE,
					MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE];
		}
	},

	getBody_Carrier: function (level) {
		switch (level) {
			case 1:
				return [ // 300 energy, 3x CARRY, 3x MOVE
					CARRY, MOVE, CARRY, MOVE, CARRY, MOVE];
			case 2:
				return [ // 400 energy, 4x CARRY, 4x MOVE
					CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE];
			case 3:
				return [ // 600 energy, 8x CARRY, 4x MOVE
					CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY,
					MOVE, MOVE, MOVE, MOVE];
			case 4:
				return [ // 1000 energy, 13x CARRY, 7x MOVE
					CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY,
					CARRY, CARRY, CARRY,
					MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE];
			case 5:
				return [ // 1400 energy, 18x CARRY, 10x MOVE
					CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY,
					CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY,
					MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE];
			case 6:
				return [ // 1800 energy, 24x CARRY, 12 MOVE
					CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY,
					CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY,
					CARRY, CARRY, CARRY, CARRY,
					MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE,
					MOVE, MOVE];
			case 7: case 8:
				return [ // 2500 energy, 33x CARRY, 17x MOVE
					CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY,
					CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY,
					CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY,
					CARRY, CARRY, CARRY,
					MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE,
					MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE];
		}
	},

	getBody_Carrier_AT: function (level) {
		switch (level) {
			case 1:
				return [ // 300 energy, 3x CARRY, 3x MOVE
					CARRY, MOVE, CARRY, MOVE, CARRY, MOVE];
			case 2:
				return [ // 400 energy, 4x CARRY, 4x MOVE
					CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE];
			case 3:
				return [ // 600 energy, 6x CARRY, 6x MOVE
					CARRY, CARRY, CARRY, CARRY, CARRY, CARRY,
					MOVE, MOVE, MOVE, MOVE, MOVE, MOVE];
			case 4:
				return [ // 1000 energy, 10x CARRY, 10x MOVE
					CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY,
					MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE];
			case 5:
				return [ // 1400 energy, 14x CARRY, 14x MOVE
					CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY,
					CARRY, CARRY, CARRY, CARRY,
					MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE,
					MOVE, MOVE, MOVE, MOVE];
			case 6:
				return [ // 1800 energy, 18x CARRY, 18 MOVE
					CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY,
					CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY,
					MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE,
					MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE];
			case 7: case 8:
				return [ // 2500 energy, 25x CARRY, 25x MOVE
					CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY,
					CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY,
					CARRY, CARRY, CARRY, CARRY, CARRY,
					MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE,
					MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE,
					MOVE, MOVE, MOVE, MOVE, MOVE];
		}
	},

	getBody_Reserver: function (level) {
		switch (level) {
			case 1: case 2:
				return [ // Prevent spawn locking with null body
					MOVE];
			case 3: case 4:
				return [ // 650 energy, 1x CLAIM, 1x MOVE
					CLAIM, MOVE];
			case 5: case 6: case 7: case 8:
				return [ // 1300 energy, 2x CLAIM, 2x MOVE
					CLAIM, CLAIM, MOVE, MOVE];
		}
	},

	getBody_Reserver_AT: function (level) {
		switch (level) {
			case 1: case 2:
				return [ // Prevent spawn locking with null body
					MOVE];
			case 3:
				return [ // 750 energy, 1x CLAIM, 3x MOVE
					CLAIM, MOVE, MOVE, MOVE];
			case 4:
				return [ // 850 energy, 1x CLAIM, 5x MOVE
					CLAIM, MOVE, MOVE, MOVE, MOVE, MOVE];
			case 5: case 6: case 7: case 8:
				return [ // 1700 energy, 2x CLAIM, 10x MOVE
					CLAIM, CLAIM,
					MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE];
		}
	},
};



/* ***********************************************************
 *	[sec03b] DEFINITIONS: CREEP ROLES
 * *********************************************************** */

let Creep_Roles = {

	moveToDestination: function (creep) {
		if (creep.memory.room != null && creep.room.name != creep.memory.room) {
			creep.travelToRoom(creep.memory.room, true);
			return true;
		} else
			return false;
	},

	goToRoom: function (creep, room_name, is_refueling) {
		if (creep.room.name != room_name) {
			creep.travelToRoom(room_name, is_refueling);
			return true;
		}
		return false;
	},

	Scout: function (creep) {
		if (creep.memory.room != null) {
			if (creep.room.name != creep.memory.room) {
				creep.travelToRoom(creep.memory.room, true);
			} else {
				let controller = _.get(Game, ["rooms", creep.memory.room, "controller"]);
				if (controller != null && !creep.pos.inRangeTo(controller, 3)) {
					creep.travel(controller);
					return;
				}

				if (controller == null && creep.pos.isEdge()) {
					creep.travel(new RoomPosition(25, 25, creep.room.name));
					return;
				}
			}
		}
	},

	Worker: function (creep, isSafe) {
		let hostile = isSafe ? null
			: _.head(creep.pos.findInRange(FIND_HOSTILE_CREEPS, 5, {
				filter:
					c => { return c.isHostile(); }
			}));

		if (hostile == null) {
			if (creep.memory.state == "refueling") {
				if (_.sum(creep.carry) == creep.carryCapacity) {
					creep.memory.state = "working";
					delete creep.memory.task;
					return;
				}

				creep.memory.task = creep.memory.task || creep.getTask_Boost();

				if (!creep.memory.task && this.goToRoom(creep, creep.memory.room, true))
					return;

				creep.memory.task = creep.memory.task || creep.getTask_Withdraw_Link(15);
				creep.memory.task = creep.memory.task || creep.getTask_Withdraw_Storage("energy",
					_.get(Memory, ["rooms", creep.room.name, "survey", "downgrade_critical"], false));
				creep.memory.task = creep.memory.task || creep.getTask_Withdraw_Container("energy",
					_.get(Memory, ["rooms", creep.room.name, "survey", "downgrade_critical"], false));
				creep.memory.task = creep.memory.task || creep.getTask_Pickup("energy");
				creep.memory.task = creep.memory.task || creep.getTask_Mine();
				creep.memory.task = creep.memory.task || creep.getTask_Wait(10);

				creep.runTask(creep);
				return;

			} else if (creep.memory.state == "working") {
				if (creep.carry["energy"] == 0) {
					creep.memory.state = "refueling";
					delete creep.memory.task;
					return;
				}

				if (this.goToRoom(creep, creep.memory.room, false))
					return;

				creep.memory.task = creep.memory.task || creep.getTask_Upgrade(true);
				creep.memory.task = creep.memory.task || creep.getTask_Sign();
				creep.memory.task = creep.memory.task || creep.getTask_Repair(true);
				creep.memory.task = creep.memory.task || creep.getTask_Build();
				creep.memory.task = creep.memory.task || creep.getTask_Repair(false);
				creep.memory.task = creep.memory.task || creep.getTask_Upgrade(false);
				creep.memory.task = creep.memory.task || creep.getTask_Wait(10);

				creep.runTask(creep);
				return;

			} else {
				creep.memory.state = "refueling";
				return;
			}
		} else if (hostile != null) {
			creep.moveFrom(creep, hostile);
			return;
		}
	},

	Mining: function (creep, isSafe, canMine) {
		let hostile = isSafe ? null
			: _.head(creep.pos.findInRange(FIND_HOSTILE_CREEPS, 6, {
				filter:
					c => { return c.isHostile(); }
			}));

		if (hostile == null && canMine) {
			if (creep.memory.state == "refueling") {
				if (creep.memory.role != "burrower" && creep.carryCapacity > 0
					&& _.sum(creep.carry) == creep.carryCapacity) {
					creep.memory.state = "delivering";
					delete creep.memory.task;
					return;
				}

				creep.memory.task = creep.memory.task || creep.getTask_Boost();

				if (!creep.memory.task && this.goToRoom(creep, creep.memory.room, true))
					return;

				if (creep.memory.role == "burrower") {
					creep.memory.task = creep.memory.task || creep.getTask_Mine();
					creep.memory.task = creep.memory.task || creep.getTask_Withdraw_Source_Container();
					creep.memory.task = creep.memory.task || creep.getTask_Deposit_Source_Link();
					creep.memory.task = creep.memory.task || creep.getTask_Wait(10);

				} else if (creep.memory.role == "miner" || creep.memory.role == "carrier") {
					creep.memory.task = creep.memory.task || creep.getTask_Pickup("energy");
					creep.memory.task = creep.memory.task || creep.getTask_Withdraw_Link(15);

					let energy_level = _.get(Memory, ["rooms", creep.room.name, "survey", "energy_level"]);
					if (energy_level == CRITICAL || energy_level == LOW
						|| _.get(Memory, ["sites", "mining", creep.memory.room, "store_percent"], 0) > 0.25) {
						creep.memory.task = creep.memory.task || creep.getTask_Withdraw_Container("energy", true);
						creep.memory.task = creep.memory.task || creep.getTask_Withdraw_Storage("energy", true);
					} else {
						creep.memory.task = creep.memory.task || creep.getTask_Withdraw_Storage("energy", true);
						creep.memory.task = creep.memory.task || creep.getTask_Withdraw_Container("energy", true);
					}

					if (creep.hasPart("work") > 0)
						creep.memory.task = creep.memory.task || creep.getTask_Mine();
					creep.memory.task = creep.memory.task || creep.getTask_Pickup("mineral");
					creep.memory.task = creep.memory.task || creep.getTask_Wait(10);
				}

				creep.runTask(creep);
				return;

			} else if (creep.memory.state == "delivering") {
				if (creep.carryCapacity == 0 || _.sum(creep.carry) == 0) {
					creep.memory.state = "refueling";
					delete creep.memory.task;
					return;
				}

				if (this.goToRoom(creep, creep.memory.colony, false))
					return;

				if (creep.room.energyAvailable < creep.room.energyCapacityAvailable * 0.75) {
					creep.memory.task = creep.memory.task || creep.getTask_Deposit_Spawns();
					creep.memory.task = creep.memory.task || creep.getTask_Deposit_Towers();
				} else {
					creep.memory.task = creep.memory.task || creep.getTask_Deposit_Towers();
					creep.memory.task = creep.memory.task || creep.getTask_Deposit_Spawns();
				}
				creep.memory.task = creep.memory.task || creep.getTask_Deposit_Link();
				creep.memory.task = creep.memory.task || creep.getTask_Deposit_Storage("mineral");
				creep.memory.task = creep.memory.task || creep.getTask_Deposit_Storage("energy");
				creep.memory.task = creep.memory.task || creep.getTask_Deposit_Container("energy");
				creep.memory.task = creep.memory.task || creep.getTask_Wait(10);

				creep.runTask(creep);
				return;

			} else {
				creep.memory.state = "refueling";
				return;
			}
		} else if (hostile != null) {
			creep.moveFrom(creep, hostile);
			return;
		}
	},

	Courier: function (creep) {
		if (this.moveToDestination(creep))
			return;

		if (creep.memory.state == "loading") {
			if (_.sum(creep.carry) > 0) {
				creep.memory.state = "delivering";
				delete creep.memory.task;
				return;
			}

			creep.memory.task = creep.memory.task || creep.getTask_Boost();

			if (!creep.memory.task && this.goToRoom(creep, creep.memory.room, true))
				return;

			creep.memory.task = creep.memory.task || creep.getTask_Industry_Withdraw();
			creep.memory.task = creep.memory.task || creep.getTask_Withdraw_Link(50);
			creep.memory.task = creep.memory.task || creep.getTask_Wait(10);

			creep.runTask(creep);
			return;

		} else if (creep.memory.state == "delivering") {
			if (_.sum(creep.carry) == 0) {
				creep.memory.state = "loading";
				delete creep.memory.task;
				return;
			}

			creep.memory.task = creep.memory.task || creep.getTask_Industry_Deposit();
			creep.memory.task = creep.memory.task || creep.getTask_Deposit_Storage("mineral");
			creep.memory.task = creep.memory.task || creep.getTask_Deposit_Storage("energy");
			creep.memory.task = creep.memory.task || creep.getTask_Wait(10);

			creep.runTask(creep);
			return;

		} else {
			creep.memory.state = "loading";
			return;
		}
	},

	Extractor: function (creep, isSafe) {
		let hostile = isSafe ? null
			: _.head(creep.pos.findInRange(FIND_HOSTILE_CREEPS, 6, {
				filter:
					c => { return c.isHostile(); }
			}));

		if (hostile == null) {
			switch (creep.memory.state) {
				default:
				case "get_minerals":
					if (_.sum(creep.carry) == creep.carryCapacity
						|| _.get(Memory, ["rooms", creep.room.name, "survey", "has_minerals"], true) == false) {
						creep.memory.state = "deliver";
						delete creep.memory.task;
						return;
					}

					creep.memory.task = creep.memory.task || creep.getTask_Boost();

					if (!creep.memory.task && this.goToRoom(creep, creep.memory.room, true))
						return;

					creep.memory.task = creep.memory.task || creep.getTask_Extract();
					creep.memory.task = creep.memory.task || creep.getTask_Wait(10);

					creep.runTask(creep);
					return;

				case "deliver":
					if (_.sum(creep.carry) == 0
						&& _.get(Memory, ["rooms", creep.room.name, "survey", "has_minerals"], true)) {
						creep.memory.state = "get_minerals";
						delete creep.memory.task;
						return;
					}

					if (this.goToRoom(creep, creep.memory.colony, false))
						return;

					creep.memory.task = creep.memory.task || creep.getTask_Deposit_Storage("mineral");
					creep.memory.task = creep.memory.task || creep.getTask_Wait(10);

					creep.runTask(creep);
					return;
			}
		} else if (hostile != null) {
			creep.moveFrom(creep, hostile);
			return;
		}
	},

	Reserver: function (creep) {
		if (this.moveToDestination(creep))
			return;

		let controller = _.get(creep.room, "controller", null);

		if (creep.pos.getRangeTo(controller) > 1) {
			creep.travel(creep.room.controller)
			return;
		}

		let result;
		if (_.get(controller, "owner") != null && !creep.room.controller.my) {
			result = creep.attackController(creep.room.controller);
		} else if (_.get(controller, ["reservation", "username"], null) != null
			&& _.get(controller, ["reservation", "username"], null) != getUsername()) {
			result = creep.attackController(creep.room.controller);
		} else {
			result = creep.reserveController(creep.room.controller);
		}

		if (result == ERR_NOT_IN_RANGE) {
			creep.travel(creep.room.controller)
			return;
		} else if (result == ERR_NO_BODYPART) {
			return;		// Reservers and colonizers with no "claim" parts prevent null body spawn locking
		} else if (result == OK) {
			if (Game.time % 50 == 0) {
				let room_sign = _.get(Memory, ["hive", "signs", creep.room.name]);
				let default_sign = _.get(Memory, ["hive", "signs", "default"]);
				if (room_sign != null && _.get(creep, ["room", "controller", "sign", "text"]) != room_sign)
					creep.signController(creep.room.controller, room_sign);
				else if (room_sign == null && default_sign != null && _.get(creep, ["room", "controller", "sign", "text"]) != default_sign)
					creep.signController(creep.room.controller, default_sign);
			}
			if (Game.time % 10 == 0)
				creep.moveFromSource();
			return;
		}
	},

	Colonizer: function (creep) {
		if (this.moveToDestination(creep))
			return;

		let result = creep.claimController(creep.room.controller);
		if (result == ERR_NOT_IN_RANGE) {
			creep.moveTo(creep.room.controller)
			return;
		} else if (result == ERR_NO_BODYPART) {
			return;		// Reservers and colonizers with no "claim" parts prevent null body spawn locking
		} else {
			let request = _.get(Memory, ["sites", "colonization", creep.memory.room]);
			if (_.get(request, ["target"]) == creep.room.name && creep.room.controller.my) {
				delete Memory["sites"]["colonization"][creep.room.name];
				_.set(Memory, ["rooms", creep.room.name, "spawn_assist", "rooms"], [_.get(request, ["from"])]);
				_.set(Memory, ["rooms", creep.room.name, "spawn_assist", "list_route"], _.get(request, ["list_route"]));
				_.set(Memory, ["rooms", creep.room.name, "layout"], _.get(request, "layout"));
				_.set(Memory, ["rooms", creep.room.name, "focus_defense"], _.get(request, "focus_defense"));
				_.set(Memory, ["hive", "pulses", "blueprint", "request"], creep.room.name);
				creep.memory = {};
			} else if (result != OK) {
				console.log(`<font color=\"#F0FF00\">[Colonization]</font> ${creep.name} unable to colonize ${_.get(request, ["target"])}; error ${result}`);
			}
			return;
		}
	},

	Soldier: function (creep, targetStructures, targetCreeps, listTargets) {
		if (Creep_Roles_Combat.acquireBoost(creep))
			return;
		if (Creep_Roles_Combat.moveToDestination(creep, 10))
			return;

		Creep_Roles_Combat.checkTarget_Existing(creep);
		Creep_Roles_Combat.acquireTarget_ListTarget(creep, listTargets);

		if (targetCreeps)
			Creep_Roles_Combat.acquireTarget_Creep(creep);
		if (targetStructures && creep.room.name == creep.memory.room)
			Creep_Roles_Combat.acquireTarget_Structure(creep);

		Creep_Roles_Combat.acquireTarget_InvaderCore(creep);

		if (_.get(creep, ["memory", "target", "id"]) != null) {
			Creep_Roles_Combat.clearCamp(creep);
			let target = Game.getObjectById(creep.memory.target.id);

			creep.dismantle(target);
			creep.rangedAttack(target);
			let result = creep.attack(target);

			if (result == ERR_INVALID_TARGET && target instanceof ConstructionSite == true) {
				creep.moveTo(target, { reusePath: 0 });
			} else if (result == ERR_NOT_IN_RANGE) {
				creep.heal(creep);

				if (_.get(creep, ["memory", "target", "rampart"]) != null) {
					let rampart = Game.getObjectById(creep.memory.target.rampart);
					if (rampart != null)
						creep.moveTo(rampart, { reusePath: 0 });
					else
						creep.moveTo(target, { reusePath: 0 });
				} else
					creep.moveTo(target, { reusePath: 0 });
				return;
			} else if (result == OK) {
				return;
			} else {
				creep.heal(creep);
				return;
			}
		} else {
			creep.heal(creep);
			Creep_Roles_Combat.acquireCamp(creep);
			Creep_Roles_Combat.travelCamp(creep);
			return;
		}
	},

	Archer: function (creep, targetStructures, targetCreeps, listTargets) {
		if (Creep_Roles_Combat.acquireBoost(creep))
			return;
		if (Creep_Roles_Combat.moveToDestination(creep, 10))
			return;

		Creep_Roles_Combat.checkTarget_Existing(creep);
		Creep_Roles_Combat.acquireTarget_ListTarget(creep, listTargets);

		if (targetCreeps)
			Creep_Roles_Combat.acquireTarget_Creep(creep);
		if (targetStructures && creep.room.name == creep.memory.room)
			Creep_Roles_Combat.acquireTarget_Structure(creep);

		Creep_Roles_Combat.acquireTarget_InvaderCore(creep);

		if (_.get(creep, ["memory", "target", "id"]) != null) {
			Creep_Roles_Combat.clearCamp(creep);
			let target = Game.getObjectById(creep.memory.target.id);

			creep.attack(target);
			creep.dismantle(target);
			creep.heal(creep);
			let result = creep.rangedAttack(target);

			if (result == ERR_INVALID_TARGET && target instanceof ConstructionSite == true) {
				creep.moveTo(target, { reusePath: 0 });
			} else if (result == ERR_NOT_IN_RANGE) {
				if (_.get(creep, ["memory", "target", "rampart"]) != null) {
					let rampart = Game.getObjectById(creep.memory.target.rampart);
					if (rampart != null)
						creep.moveTo(rampart, { reusePath: 0 });
					else
						creep.moveTo(target, { reusePath: 0 });
				} else
					creep.moveTo(target, { reusePath: 0 });
				return;
			} else if (result == OK) {
				if (creep.pos.getRangeTo(target < 3))
					creep.moveFrom(creep, target);
				return;
			}
		} else {
			creep.heal(creep);
			Creep_Roles_Combat.acquireCamp(creep);
			Creep_Roles_Combat.travelCamp(creep);
			return;
		}
	},

	Dismantler: function (creep, targetStructures, listTargets) {
		if (Creep_Roles_Combat.acquireBoost(creep))
			return;
		if (Creep_Roles_Combat.moveToDestination(creep, null))
			return;

		Creep_Roles_Combat.checkTarget_Existing(creep);
		Creep_Roles_Combat.acquireTarget_ListTarget(creep, listTargets);

		if (targetStructures && creep.room.name == creep.memory.room)
			Creep_Roles_Combat.acquireTarget_Structure(creep);

		if (_.get(creep, ["memory", "target", "id"]) != null) {
			let target = Game.getObjectById(creep.memory.target.id);

			creep.rangedAttack(target);
			creep.attack(target);
			let result = creep.dismantle(target);

			if (result == ERR_INVALID_TARGET && target instanceof ConstructionSite == true) {
				creep.moveTo(target, { reusePath: 0 });
			} else if (result == ERR_NOT_IN_RANGE) {
				creep.heal(creep);
				creep.moveTo(target, { reusePath: 0 });
				return;
			} else if (result == OK) {
				return;
			} else {
				creep.heal(creep);
				return;
			}
		} else {
			creep.heal(creep);
			return;
		}
	},

	Healer: function (creep, to_partner) {
		if (Creep_Roles_Combat.acquireBoost(creep))
			return;
		if (Creep_Roles_Combat.moveToDestination(creep, 10))
			return;

		Creep_Roles_Combat.checkTarget_Existing(creep);
		Creep_Roles_Combat.acquireTarget_Heal(creep);

		if (_.get(creep, ["memory", "target", "id"]) != null) {
			Creep_Roles_Combat.clearCamp(creep);
			let target = Game.getObjectById(creep.memory.target.id);
			let result = creep.heal(target);
			if (target == null || target.hits == target.hitsMax) {
				_.set(creep, ["memory", "target", "id"], null);
				return;
			} else if (result == OK) {
				return;
			} else if (result == ERR_NOT_IN_RANGE) {
				creep.rangedHeal(target);
				creep.moveTo(target);
				return;
			}
		}

		if (to_partner) {
			Creep_Roles_Combat.checkPartner_Existing(creep);
			Creep_Roles_Combat.acquireTarget_Partner(creep);

			if (_.get(creep, ["memory", "partner", "id"]) != null) {
				Creep_Roles_Combat.clearCamp(creep);
				let target = Game.getObjectById(creep.memory.partner.id);

				if (target == null) {
					_.set(creep, ["memory", "target", "id"], null);
					Creep_Roles_Combat.acquireCamp(creep);
					Creep_Roles_Combat.travelCamp(creep);
				} else if (creep.pos.getRangeTo(target) > 1) {
					creep.moveTo(target, { reusePath: 0 });
					return;
				}
			} else {
				Creep_Roles_Combat.acquireCamp(creep);
				Creep_Roles_Combat.travelCamp(creep);
				return;
			}
		} else {
			Creep_Roles_Combat.acquireCamp(creep);
			Creep_Roles_Combat.travelCamp(creep);
			return;
		}
	},
};



/* ***********************************************************
 *	[sec03c] DEFINITIONS: CREEP COMBAT ROLES
 * *********************************************************** */

let Creep_Roles_Combat = {
	acquireBoost: function (creep) {
		if (creep.room.name == creep.memory.colony && creep.memory.boost != "complete") {
			if (creep.memory.boost == null) {
				if (this.seekBoost(creep)) {
					return true;
				} else {
					creep.memory.boost = "complete";
					return false;
				}
			} else if (creep.memory.boost != null) {
				if (!_.get(creep.memory, ["boost", "pos", "x"])
					|| !_.get(creep.memory, ["boost", "pos", "y"])
					|| !_.get(creep.memory, ["boost", "pos", "roomName"])) {
					delete creep.memory.boost;
					return false;
				}

				let boost_pos = new RoomPosition(creep.memory.boost.pos.x, creep.memory.boost.pos.y, creep.memory.boost.pos.roomName);
				if (creep.pos.getRangeTo(boost_pos) > 1) {
					creep.travel(boost_pos);
					return true;
				} else {
					let boosted = creep.getBoosts();
					if (boosted.includes(creep.memory.boost.resource)) {
						delete creep.memory.boost;
						return true;	// True to re-run cycle, seek new boost next tick if available
					}
				}
			}
		} else
			return false;
	},

	seekBoost: function (creep) {
		let boosted = creep.getBoosts();
		let boost = _.head(_.filter(_.get(Memory, ["rooms", creep.room.name, "industry", "boosts"]),
			t => {
				return t.active && t.role == creep.memory.role
					&& (t.room == null ? true : t.room == creep.memory.room)
					&& !boosted.includes(t.resource);
			}));

		if (boost != null) {
			creep.memory.boost = boost;
			return true;
		} else
			return false;
	},

	moveToDestination: function (creep, recheck_targets) {
		if (creep.memory.room != null && _.get(creep, ["memory", "target", "id"]) == null
			&& creep.room.name != creep.memory.room) {
			creep.travelToRoom(creep.memory.room, true);
			// Evaluates for targets in this room every evaluate_targets ticks...
			return (recheck_targets == null || Game.time % recheck_targets != 0);
		}
		return false;
	},

	checkTarget_Existing: function (creep) {
		if (_.get(creep, ["memory", "target", "id"]) != null) {
			let target = Game.getObjectById(creep.memory.target.id);
			// Refresh target every 10 ticks...
			if (target == null || target.room.name != creep.room.name || Game.time % 10 == 0)
				_.set(creep, ["memory", "target", "id"], null);
		}
	},

	checkPartner_Existing: function (creep) {
		if (_.get(creep, ["memory", "partner", "id"]) != null) {
			let target = Game.getObjectById(creep.memory.partner.id);
			// Refresh target every 10 ticks...
			if (target == null || target.room.name != creep.room.name || Game.time % 10 == 0)
				_.set(creep, ["memory", "partner", "id"], null);
		}
	},

	acquireTarget_ListTarget: function (creep, listTargets) {
		if (_.get(creep, ["memory", "target", "id"]) == null && listTargets != null
			&& _.get(creep, ["memory", "target", "notarget_list"], 0) < Game.time - 10) {
			for (let t in listTargets) {
				let target = Game.getObjectById(listTargets[t]);
				if (target != null && creep.moveTo(target) != ERR_NO_PATH) {
					_.set(creep, ["memory", "target", "id"], target.id);
					return;
				}
			}

			if (_.get(creep, ["memory", "target", "id"]) != null)
				_.set(creep, ["memory", "target", "notarget_list"], Game.time);
		}
	},

	acquireTarget_Creep: function (creep) {
		if (_.get(creep, ["memory", "target", "id"]) == null
			&& _.get(creep, ["memory", "target", "notarget_creep"], 0) < Game.time - 10) {
			if (_.get(Memory, ["rooms", creep.room.name, "defense", "targets", "attack"]) != null) {
				_.set(creep, ["memory", "target", "id"], _.get(Memory, ["rooms", creep.room.name, "defense", "targets", "attack"]));
				this.acquireRampart_Adjacent(creep);
				return;
			}

			let target = _.head(_.sortBy(_.sortBy(_.sortBy(creep.room.find(FIND_HOSTILE_CREEPS,
				{ filter: (c) => { return c.isHostile(); } }),
				c => {
					return -(c.hasPart("attack") + c.hasPart("ranged_attack")
						+ c.hasPart("heal")) + c.hasPart("work");
				})),
				c => { return c.pos.getRangeTo(creep.pos); }),
				c => { return c.owner.username == "Source Keeper"; });
			if (target != null) {
				_.set(creep, ["memory", "target", "id"], target.id);
				this.acquireRampart_Adjacent(creep);
				return;
			} else {
				_.set(creep, ["memory", "target", "notarget_creep"], Game.time);
			}
		}
	},

	acquireTarget_InvaderCore: function (creep) {
		if (_.get(creep, ["memory", "target", "id"]) == null
			&& _.get(creep, ["memory", "target", "notarget_invadercore"], 0) < Game.time - 10) {

			let target = _.head(_.filter(creep.room.find(FIND_STRUCTURES),
				s => s.structureType == "invaderCore"));

			if (target != null) {
				_.set(creep, ["memory", "target", "id"], target.id);
				this.acquireRampart_Adjacent(creep);
				return;
			} else {
				_.set(creep, ["memory", "target", "notarget_invadercore"], Game.time);
			}
		}
	},

	acquireTarget_Structure: function (creep) {
		if (_.get(creep, ["memory", "target", "id"]) == null
			&& _.get(creep, ["memory", "target", "notarget_structure"], 0) < Game.time - 10) {
			let target = _.head(_.sortBy(_.sortBy(_.sortBy(creep.room.find(FIND_STRUCTURES, {
				filter:
					s => {
						return s.hits != null && s.hits > 0
							&& ((s.owner == null && s.structureType != "container")
								|| (s.owner != null && !s.my && s.owner != "Source Keeper" && s.structureType != "controller"
									&& _.get(Memory, ["hive", "allies"]).indexOf(s.owner.username) < 0));
					}
			}),
				s => { return creep.pos.getRangeTo(s.pos); }),
				s => { return s.hits; }),	// Sort by hits to prevent attacking massive ramparts/walls forever
				s => {
					switch (s.structureType) {
						case "spawn": return 0;
						case "tower": return 1;
						case "extension": return 2;
						default: return 3;
						case "rampart":
						case "constructedWall": return 4;
					}
				}));
			if (target == null)
				target = _.head(_.sortBy(creep.room.find(FIND_CONSTRUCTION_SITES, {
					filter:
						s => { return s.owner == null || (!s.my && _.get(Memory, ["hive", "allies"]).indexOf(s.owner.username) < 0); }
				}),
					s => { return creep.pos.getRangeTo(s.pos); }));

			if (target != null) {
				_.set(creep, ["memory", "target", "id"], target.id);
			} else {
				_.set(creep, ["memory", "target", "notarget_structure"], Game.time);
			}
		}
	},

	acquireTarget_Heal: function (creep) {
		if (_.get(creep, ["memory", "target", "id"]) == null
			&& _.get(creep, ["memory", "target", "notarget_heal"], 0) < Game.time - 3) {
			let target = creep.pos.findClosestByRange(FIND_MY_CREEPS, {
				filter:
					c => { return c.hits < c.hitsMax; }
			});

			if (target != null) {
				_.set(creep, ["memory", "target", "id"], target.id);
			} else {
				_.set(creep, ["memory", "target", "notarget_heal"], Game.time);
			}
		}
	},

	acquireTarget_Partner: function (creep) {
		if (_.get(creep, ["memory", "partner", "id"]) == null
			&& _.get(creep, ["memory", "partner", "notarget_partner"], 0) < Game.time - 10) {
			let target = _.head(_.sortBy(_.filter(creep.room.find(FIND_MY_CREEPS),
				c => {
					return c.memory.role != "healer"
						&& _.get(c, ["memory", "room"]) == _.get(creep, ["memory", "room"])
						&& (c.memory.role == "soldier" || c.memory.role == "brawler"
							|| c.memory.role == "paladin" || c.memory.role == "archer"
							|| c.memory.role == "dismantler" || c.memory.role == "reserver");
				}),
				c => c.memory.healer != null),
				c => c.pos.getRangeTo(creep));

			if (target != null) {
				_.set(creep, ["memory", "partner", "id"], target.id);
				_.set(target, ["memory", "healer"], creep.id);
			} else {
				_.set(creep, ["memory", "partner", "notarget_partner"], Game.time);
			}
		}
	},

	acquireRampart_Adjacent: function (creep) {
		if (_.get(creep, ["memory", "target", "id"]) != null && _.get(creep, ["room", "controller", "my"])) {
			let target = Game.getObjectById(creep.memory.target.id);
			if (target instanceof Creep == false)
				return;

			let range = creep.hasPart("attack") ? 1 : 3;
			let rampart = _.head(_.sortBy(_.filter(creep.room.find(FIND_MY_STRUCTURES),
				s => { return s.structureType == "rampart" && s.pos.inRangeTo(target, range) && s.pos.isWalkable(true); }),
				s => { return s.pos.getRangeTo(creep); }))
			_.set(creep, ["memory", "target", "rampart"], _.get(rampart, "id"));
		} else {
			_.set(creep, ["memory", "target", "rampart"], null);
		}
	},

	acquireCamp: function (creep) {
		if (creep.memory.camp != null || Game.time % 10 != 0)
			return;

		if (creep.room.name == creep.memory.room) {
			if (_.get(Memory, ["rooms", creep.room.name, "camp"]) != null) {
				let camp = _.get(Memory, ["rooms", creep.room.name, "camp"]);
				let pos = new RoomPosition(_.get(camp, "x"), _.get(camp, "y"), _.get(camp, "roomName"));
				_.set(creep.memory, "camp", pos.getOpenTile_Range(2, true));
				return;
			}

			let lair = _.head(_.sortBy(_.filter(creep.room.find(FIND_STRUCTURES),
				s => { return s.structureType == "keeperLair"; }),
				s => { return s.ticksToSpawn; }));
			if (lair != null) {
				_.set(creep.memory, "camp", lair.id);
				return;
			}

			let structures = creep.room.find(FIND_MY_STRUCTURES);
			let ramparts = _.filter(structures,
				s => {
					return s.structureType == "rampart"
						&& s.pos.lookFor(LOOK_CREEPS).length == 0
						&& s.pos.lookFor(LOOK_STRUCTURES).length == 1;
				});
			let rampart = creep.pos.findClosestByPath(ramparts);
			if (rampart != null) {
				_.set(creep.memory, "camp", rampart.id);
				return;
			}

			let controller = _.get(Game, ["rooms", creep.room.name, "controller"]);
			if (controller != null) {
				_.set(creep.memory, "camp", controller.pos.getOpenTile_Range(3, true));
				return;
			}
		}
	},

	travelCamp: function (creep) {
		let camp = _.get(creep.memory, "camp");
		if (camp != null) {
			if (camp instanceof RoomPosition == true) {
				creep.travel(camp);
				return;
			} else if (_.get(camp, "x") != null && _.get(camp, "y") != null && _.get(camp, "roomName") != null) {
				creep.travel(new RoomPosition(camp.x, camp.y, camp.roomName));
			} else {
				let obj = Game.getObjectById(_.get(creep.memory, "camp"));
				if (obj == null)
					_.set(creep.memory, "camp", null);
				else
					creep.travel(obj);
			}
		} else {
			creep.travel(new RoomPosition(25, 25, creep.room.name));
		}
	},

	clearCamp: function (creep) {
		_.set(creep.memory, "camp", null);
	}
};



/* ***********************************************************
 *	[sec04a] DEFINITIONS: SITES
 * *********************************************************** */

let Sites = {
	Colony: function (rmColony) {
		let Colony = {

			Run: function (rmColony) {

				Stats_CPU.Start(rmColony, "Colony-init");
				listSpawnRooms = _.get(Memory, ["rooms", rmColony, "spawn_assist", "rooms"]);
				listSpawnRoute = _.get(Memory, ["rooms", rmColony, "spawn_assist", "list_route"]);

				if (_.get(Memory, ["rooms", rmColony, "defense", "threat_level"]) == null)
					_.set(Memory, ["rooms", rmColony, "defense", "threat_level"], LOW);

				let listCreeps = _.filter(Game.creeps, c => c.memory.room == rmColony);
				Stats_CPU.End(rmColony, "Colony-init");


				Stats_CPU.Start(rmColony, "Colony-surveyRoom");
				if (isPulse_Defense()) {
					this.surveyRoom(rmColony);
					this.surveySafeMode(rmColony, listCreeps);
				}
				Stats_CPU.End(rmColony, "Colony-surveyRoom");

				if (isPulse_Spawn()) {
					Stats_CPU.Start(rmColony, "Colony-runPopulation");
					this.runPopulation(rmColony, listCreeps, listSpawnRooms);
					Stats_CPU.End(rmColony, "Colony-runPopulation");
				}

				Stats_CPU.Start(rmColony, "Colony-runCreeps");
				this.runCreeps(rmColony, listCreeps, listSpawnRoute);
				Stats_CPU.End(rmColony, "Colony-runCreeps");

				Stats_CPU.Start(rmColony, "Colony-runTowers");
				this.runTowers(rmColony);
				Stats_CPU.End(rmColony, "Colony-runTowers");

				Stats_CPU.Start(rmColony, "Colony-defineLinks");
				if (isPulse_Long() || _.has(Memory, ["hive", "pulses", "reset_links"])) {
					this.defineLinks(rmColony);
				}
				Stats_CPU.End(rmColony, "Colony-defineLinks");

				Stats_CPU.Start(rmColony, "Colony-runLinks");
				this.runLinks(rmColony);
				Stats_CPU.End(rmColony, "Colony-runLinks");
			},

			surveyRoom: function (rmColony) {
				let visible = _.keys(Game.rooms).includes(rmColony);
				_.set(Memory, ["rooms", rmColony, "survey", "has_minerals"],
					!visible ? false
						: _.filter(Game.rooms[rmColony].find(FIND_MINERALS),
							m => { return m.mineralAmount > 0; }).length > 0 );

				if (_.get(Memory, ["rooms", rmColony, "survey", "source_amount"], 0) == 0)
					_.set(Memory, ["rooms", rmColony, "survey", "source_amount"],
						(visible ? Game.rooms[rmColony].findSources().length : 0));

				let hostiles = !visible ? new Array()
					: _.filter(Game.rooms[rmColony].find(FIND_HOSTILE_CREEPS), c => { return c.isHostile(); });
				_.set(Memory, ["rooms", rmColony, "defense", "hostiles"], hostiles);

				let is_safe = visible && hostiles.length == 0;
				_.set(Memory, ["rooms", rmColony, "defense", "is_safe"], is_safe);

				let storage = _.get(Game, ["rooms", rmColony, "storage"]);

				if (visible && storage != null && storage.store["energy"] < Game["rooms"][rmColony].getCriticalEnergy()) {
					_.set(Memory, ["rooms", rmColony, "survey", "energy_level"], CRITICAL);
				} else if (visible && storage != null && storage.store["energy"] < Game["rooms"][rmColony].getLowEnergy()) {
					_.set(Memory, ["rooms", rmColony, "survey", "energy_level"], LOW);
				} else if (visible && storage != null && storage.store["energy"] > Game["rooms"][rmColony].getExcessEnergy()) {
					_.set(Memory, ["rooms", rmColony, "survey", "energy_level"], EXCESS);
				} else {
					_.set(Memory, ["rooms", rmColony, "survey", "energy_level"], NORMAL);
				}

				let ticks_downgrade = _.get(Game, ["rooms", rmColony, "controller", "ticksToDowngrade"]);
				_.set(Memory, ["rooms", rmColony, "survey", "downgrade_critical"], (ticks_downgrade > 0 && ticks_downgrade < 3500))
			},

			surveySafeMode: function (rmColony, listCreeps) {
				let room = _.get(Game, ["rooms", rmColony]);
				let controller = _.get(room, "controller");
				let is_safe = _.get(Memory, ["rooms", rmColony, "defense", "is_safe"]);

				if (is_safe || room == null || controller == null || controller.safeMode > 0
					|| controller.safeModeCooldown > 0 || controller.safeModeAvailable == 0)
					return;

				let hostiles = _.get(Memory, ["rooms", rmColony, "defense", "hostiles"]);
				let threats = _.filter(hostiles, c => {
					return c.isHostile() && c.owner.username != "Invader"
						&& (c.hasPart("attack") || c.hasPart("ranged_attack") || c.hasPart("work"));
				});
				let structures = _.filter(room.find(FIND_MY_STRUCTURES), s => {
					return s.structureType == "spawn" || s.structureType == "extension"
						|| s.structureType == "tower" || s.structureType == "nuker"
						|| s.structureType == "storage" || s.structureType == "terminal";
				});

				for (let i = 0; i < structures.length; i++) {
					if (structures[i].pos.findInRange(threats, 3).length > 0) {
						if (room.controller.activateSafeMode() == OK)
							console.log(`<font color=\"#FF0000\">[Invasion]</font> Safe mode activated in ${rmColony}; enemy detected at key base structure!`);
						return;
					}
				}

				if (structures.length == 0) {
					for (let i = 0; i < listCreeps.length; i++) {
						if (listCreeps[i].pos.findInRange(threats, 3).length > 0) {
							if (room.controller.activateSafeMode() == OK)
								console.log(`<font color=\"#FF0000\">[Invasion]</font> Safe mode activated in ${rmColony}; no structures; enemy detected at creeps!`);
							return;
						}
					}
				}
			},

			runPopulation: function (rmColony, listCreeps, listSpawnRooms) {
				let room_level = Game["rooms"][rmColony].getLevel();
				let is_safe = _.get(Memory, ["rooms", rmColony, "defense", "is_safe"]);
				let hostiles = _.get(Memory, ["rooms", rmColony, "defense", "hostiles"], new Array());
				let threat_level = _.get(Memory, ["rooms", rmColony, "defense", "threat_level"]);
				let energy_level = _.get(Memory, ["rooms", rmColony, "survey", "energy_level"]);
				let downgrade_critical = _.get(Memory, ["rooms", rmColony, "survey", "downgrade_critical"]);

				let popActual = new Object();
				_.each(listCreeps, c => {
					switch (_.get(c, ["memory", "role"])) {
						default:
							let role = _.get(c, ["memory", "role"]);
							popActual[role] = _.get(popActual, role, 0) + 1;
							break;
					}
				});

				let popTarget = new Object();
				let popSetting = _.get(Memory, ["rooms", rmColony, "set_population"]);
				if (popSetting)
					popTarget = _.cloneDeep(popSetting);
				else
					popTarget = _.cloneDeep(Population_Colony[listSpawnRooms == null ? "Standalone" : "Assisted"][Math.max(1, room_level)]);

				// Adjust soldier amounts & levels based on threat level
				if (threat_level != NONE && _.get(Game, ["rooms", rmColony, "controller", "safeMode"]) == null) {
					if (threat_level == LOW || threat_level == null) {
						_.set(popTarget, ["ranger", "amount"], _.get(popTarget, ["ranger", "amount"], 0) + 1);
						if (is_safe)
							_.set(popTarget, ["ranger", "level"], Math.max(2, room_level - 1));
					} else if (threat_level == MEDIUM) {
						_.set(popTarget, ["soldier", "amount"], _.get(popTarget, ["soldier", "amount"], 0) + 1);
						_.set(popTarget, ["ranger", "amount"], _.get(popTarget, ["ranger", "amount"], 0) + 1);
						if (is_safe) {
							_.set(popTarget, ["soldier", "level"], Math.max(2, room_level - 1));
							_.set(popTarget, ["ranger", "level"], Math.max(2, room_level - 1));
						}
					} else if (threat_level == HIGH) {
						_.set(popTarget, ["soldier", "amount"], _.get(popTarget, ["soldier", "amount"], 0) + 6);
						_.set(popTarget, ["ranger", "amount"], _.get(popTarget, ["ranger", "amount"], 0) + 2);
					}
				}

				// Adjust worker amounts based on is_safe, energy_level
				if (!is_safe) {
					_.set(popTarget, ["worker", "level"], Math.max(1, Math.round(_.get(popTarget, ["worker", "level"]) * 0.5)))
				} else if (is_safe) {
					if (energy_level == CRITICAL) {
						_.set(popTarget, ["worker", "amount"], Math.max(1, Math.round(_.get(popTarget, ["worker", "amount"]) * 0.33)))
						_.set(popTarget, ["worker", "level"], Math.max(1, Math.round(_.get(popTarget, ["worker", "level"]) * 0.33)))
					} else if (energy_level == LOW) {
						_.set(popTarget, ["worker", "amount"], Math.max(1, Math.round(_.get(popTarget, ["worker", "amount"]) * 0.5)))
						_.set(popTarget, ["worker", "level"], Math.max(1, Math.round(_.get(popTarget, ["worker", "level"]) * 0.5)))
					} else if (energy_level == EXCESS && room_level < 8) {
						_.set(popTarget, ["worker", "amount"], Math.max(1, Math.round(_.get(popTarget, ["worker", "amount"]) * 2)))
					}
				}

				// Tally population levels for level scaling and statistics
				Control.populationTally(rmColony,
					_.sum(popTarget, p => { return _.get(p, "amount", 0); }),
					_.sum(popActual));

				// Grafana population stats
				Stats_Grafana.populationTally(rmColony, popTarget, popActual);

				if (_.get(Game, ["rooms", rmColony, "controller", "safeMode"]) == null
					&& ((_.get(popActual, "soldier", 0) < _.get(popTarget, ["soldier", "amount"], 0))
						|| (_.get(popActual, "soldier", 0) < hostiles.length))) {
					Memory["hive"]["spawn_requests"].push({
						room: rmColony, listRooms: listSpawnRooms,
						priority: (!is_safe ? 1 : 21),
						level: _.get(popTarget, ["soldier", "level"], room_level),
						scale: _.get(popTarget, ["soldier", "scale"], true),
						body: "soldier", name: null, args: { role: "soldier", room: rmColony }
					});
				}

				if (_.get(Game, ["rooms", rmColony, "controller", "safeMode"]) == null
					&& _.get(popActual, "healer", 0) < _.get(popTarget, ["healer", "amount"], 0)) {
					Memory["hive"]["spawn_requests"].push({
						room: rmColony, listRooms: listSpawnRooms,
						priority: (!is_safe ? 2 : 22),
						level: _.get(popTarget, ["healer", "level"], 1),
						scale: _.get(popTarget, ["healer", "scale"], true),
						body: "healer", name: null, args: { role: "healer", room: rmColony }
					});
				}

				if (_.get(popActual, "worker", 0) < _.get(popTarget, ["worker", "amount"], 0)) {
					Memory["hive"]["spawn_requests"].push({
						room: rmColony, listRooms: listSpawnRooms,
						priority: Math.lerpSpawnPriority(23, 25, _.get(popActual, "worker", 0), _.get(popTarget, ["worker", "amount"], 0)),
						level: _.get(popTarget, ["worker", "level"], 1),
						scale: _.get(popTarget, ["worker", "scale"], true),
						body: _.get(popTarget, ["worker", "body"], "worker"),
						name: null, args: { role: "worker", room: rmColony }
					});
				}
			},


			runCreeps: function (rmColony, listCreeps, listSpawnRoute) {
				_.each(listCreeps, creep => {
					_.set(creep, ["memory", "list_route"], listSpawnRoute);

					switch (_.get(creep, ["memory", "role"])) {
						case "worker": Creep_Roles.Worker(creep); break;
						case "healer": Creep_Roles.Healer(creep, true); break;

						case "soldier": case "paladin":
							Creep_Roles.Soldier(creep, false, true);
							break;

						case "ranger": case "archer":
							Creep_Roles.Archer(creep, false, true);
							break;
					}
				});
			},


			runTowers: function (rmColony) {
				let is_safe = (_.get(Memory, ["rooms", rmColony, "defense", "hostiles"], new Array()).length == 0);

				if (!is_safe) {
					_.set(Memory, ["rooms", rmColony, "defense", "targets", "heal"], null);
					_.set(Memory, ["rooms", rmColony, "defense", "targets", "repair"], null);

					this.towerAcquireAttack(rmColony);
					this.towerRunAttack(rmColony);
					return;
				} else {
					_.set(Memory, ["rooms", rmColony, "defense", "targets", "attack"], null);

					this.towerAcquireHeal(rmColony);
					if (_.get(Memory, ["rooms", rmColony, "defense", "targets", "heal"]) != null) {
						this.towerRunHeal(rmColony);
						return;
					}

					this.towerAcquireRepair(rmColony);
					if (_.get(Memory, ["rooms", rmColony, "defense", "targets", "repair"]) != null) {
						this.towerRunRepair(rmColony);
						return;
					}
				}
			},

			towerAcquireAttack: function (rmColony) {
				let target = _.get(Memory, ["rooms", rmColony, "defense", "targets", "attack"]);

				// Check if existing target is still alive and in room... otherwise nullify and re-acquire
				if (target != null) {
					let hostile = Game.getObjectById(target);
					if (hostile == null) {
						target == null;
						_.set(Memory, ["rooms", rmColony, "defense", "targets", "attack"], null);
					}
				}

				// Acquire target if no target exists, or re-acquire target every 15 ticks
				if (target == null || Game.time % 15 == 0) {
					let base_structures = _.filter(Game.rooms[rmColony].find(FIND_STRUCTURES),
						s => {
							return s.structureType != "link" && s.structureType != "container"
								&& s.structureType != "extractor" && s.structureType != "controller"
								&& s.structureType != "road";
						});
					let spawns = _.filter(base_structures, s => { return s.structureType == "spawn"; });

					// Find the center of base by averaging position of all spawns
					let originX = 0, originY = 0;
					for (let i = 0; i < spawns.length; i++) {
						originX += spawns[i].pos.x;
						originY += spawns[i].pos.y;
					}
					originX /= spawns.length;
					originY /= spawns.length;

					//Ensure we have a spawn, otherwise return 25, 25
					if(!originX || !originY)
					{
						console.log(`<font color=\"#FF0000\">[Invasion]</font> Could not detect any spawns in room ${rmColony}`);
						originX = 25;
						originY = 25;
					}

					let my_creeps = Game.rooms[rmColony].find(FIND_MY_CREEPS);
					// Only attack creeps that are 1) not allies and 2) within 10 sq of base structures (or Invader within 5 sq of creeps)
					// Then sort by 1) if they have heal parts, and 2) sort by distance (attack closest)
					target = _.head(_.sortBy(_.filter(Game.rooms[rmColony].find(FIND_HOSTILE_CREEPS),
						c => {
							return !c.isAlly() && (c.pos.inRangeToListTargets(base_structures, 10)
								|| (c.owner.username == "Invader" && c.pos.inRangeToListTargets(my_creeps, 3)));
						}),
						c => {
							return (c.hasPart("heal") > 0
								? -100 + new RoomPosition(originX, originY, rmColony).getRangeTo(c.pos.x, c.pos.y)
								: new RoomPosition(originX, originY, rmColony).getRangeTo(c.pos.x, c.pos.y));
						}));
					_.set(Memory, ["rooms", rmColony, "defense", "targets", "attack"], _.get(target, "id"));
				}
			},

			towerRunAttack: function (rmColony) {
				let hostile_id = _.get(Memory, ["rooms", rmColony, "defense", "targets", "attack"]);
				if (hostile_id != null) {
					let hostile = Game.getObjectById(hostile_id);
					if (hostile == null) {
						_.set(Memory, ["rooms", rmColony, "defense", "targets", "attack"], null);
					} else {
						_.each(_.filter(Game.rooms[rmColony].find(FIND_MY_STRUCTURES),
							s => { return s.structureType == "tower"; }),
							t => { t.attack(hostile); });
					}
				}
			},

			towerAcquireHeal: function (rmColony) {
				if (Game.time % 15 == 0 && _.get(Game, ["rooms", rmColony]) != null) {
					let injured = _.head(_.filter(Game.rooms[rmColony].find(FIND_MY_CREEPS),
						c => { return c.hits < c.hitsMax; }));
					_.set(Memory, ["rooms", rmColony, "defense", "targets", "heal"], _.get(injured, "id"));
				}
			},

			towerRunHeal: function (rmColony) {
				let injured_id = _.get(Memory, ["rooms", rmColony, "defense", "targets", "heal"]);
				if (injured_id != null) {
					let injured = Game.getObjectById(injured_id);
					if (injured == null || injured.hits == injured.hitsMax) {
						_.set(Memory, ["rooms", rmColony, "defense", "targets", "heal"], null);
					} else {
						_.each(Game.rooms[rmColony].find(FIND_MY_STRUCTURES, {
							filter: (s) => {
								return s.structureType == "tower" && s.energy > s.energyCapacity * 0.5;
							}
						}),
							t => { t.heal(injured) });
					}
				}
			},

			towerAcquireRepair: function (rmColony) {
				let energy_level = _.get(Memory, ["rooms", rmColony, "survey", "energy_level"]);
				if (energy_level == CRITICAL) {
					_.set(Memory, ["rooms", rmColony, "defense", "targets", "repair"], null);
					return;
				}

				if (Game.time % 15 == 0 && _.get(Game, ["rooms", rmColony]) != null) {
					let room = Game["rooms"][rmColony];

					let repair = _.head(_.sortBy(_.filter(room.findRepair_Maintenance(),
						r => {
							return ((r.structureType == "rampart" || r.structureType == "constructedWall") && r.hits / room.getWallTarget() < 1.05)
								|| ((r.structureType == "container" || r.structureType == "road") && r.hits / r.hitsMax < 0.9);
						}),
						r => {
							switch (r.structureType) {
								case "container": return 1;
								case "road": return 2;
								case "rampart":
								case "constructedWall": return 3;
							}
						}));

					_.set(Memory, ["rooms", rmColony, "defense", "targets", "repair"], _.get(repair, "id"));
				}
			},

			towerRunRepair: function (rmColony) {
				let repair_id = _.get(Memory, ["rooms", rmColony, "defense", "targets", "repair"]);
				if (repair_id != null) {
					let repair = Game.getObjectById(repair_id);
					if (repair == null) {
						_.set(Memory, ["rooms", rmColony, "defense", "targets", "repair"], null);
					} else {
						_.each(Game.rooms[rmColony].find(FIND_MY_STRUCTURES, {
							filter: (s) => {
								return s.structureType == "tower" && s.energy > s.energyCapacity * 0.8;
							}
						}),
							t => { t.repair(repair) });
					}
				}
			},

			defineLinks: function (rmColony) {
				let link_defs = _.get(Memory, ["rooms", rmColony, "links"]);
				let room = Game.rooms[rmColony];
				let structures = room.find(FIND_MY_STRUCTURES);
				let links = _.filter(structures, s => { return s.structureType == "link"; });

				// Check that link definitions are current with GameObject ID's
				if (link_defs != null && Object.keys(link_defs).length == links.length) {
					for (let i = 0; i < Object.keys(link_defs).length; i++) {
						if (_.filter(links, s => { return s.id == link_defs[i].id }).length == 0) {
							delete Memory["rooms"][rmColony]["links"];
						}
					}
				}

				// Define missing link definitions
				if (link_defs == null || Object.keys(link_defs).length != links.length) {
					link_defs = [];
					let sources = room.findSources();
					_.each(sources, source => {
						_.each(source.pos.findInRange(links, 2), link => {
							link_defs.push({ id: link.id, dir: "send" });
						});
					});

					_.each(_.filter(structures, s => { return s.structureType == "storage"; }), storage => {
						_.each(storage.pos.findInRange(links, 3), link => {
							link_defs.push({ id: link.id, dir: "receive" });
						});
					});

					_.each(room.controller.pos.findInRange(links, 2), link => {
						link_defs.push({ id: link.id, dir: "receive", role: "upgrade" });
					});

					Memory["rooms"][rmColony]["links"] = link_defs;
					console.log(`<font color=\"#D3FFA3\">[Console]</font> Links defined for ${rmColony}.`);
				}

			},

			runLinks: function (rmColony) {
				let links = _.get(Memory, ["rooms", rmColony, "links"]);

				if (links != null) {
					let linksSend = _.filter(links, l => { return l["dir"] == "send"; });
					let linksReceive = _.filter(links, l => { return l["dir"] == "receive"; });

					_.each(linksReceive, r => {
						let receive = Game.getObjectById(r["id"]);
						_.each(linksSend, s => {
							if (receive != null) {
								let send = Game.getObjectById(s["id"]);
								if (send != null && send.energy > send.energyCapacity * 0.1 && receive.energy < receive.energyCapacity * 0.9) {
									send.transferEnergy(receive);
								}
							}
						});
					});
				}
			}
		};

		Colony.Run(rmColony)
	},

	Mining: function (rmColony, rmHarvest) {
		let Mining = {

			Run: function (rmColony, rmHarvest) {
				Stats_CPU.Start(rmColony, "Mining-init");

				// Local mining: ensure the room has a spawn or tower... rebuilding? Sacked? Unclaimed?
				if (rmColony == rmHarvest) {
					if (_.get(Game, ["rooms", rmColony, "controller", "my"]) != true) {
						delete Memory.sites.mining.rmHarvest;
						return;
					}

					if (_.filter(_.get(Game, ["spawns"]), s => { return s.room.name == rmColony; }).length < 1
						&& _.get(Memory, ["rooms", rmColony, "focus_defense"]) != true)
						return;

					if (_.get(Memory, ["rooms", rmColony, "focus_defense"]) == true
						&& _.get(Game, ["rooms", rmColony, "controller", "level"]) < 3)
						return;
				}

				// Remote mining: colony destroyed? Stop mining :(
				if (Game.rooms[rmColony] == null) {
					delete Memory.sites.mining.rmHarvest;
					return;
				}

				let listSpawnRooms = _.get(Memory, ["sites", "mining", rmHarvest, "spawn_assist", "rooms"]);
				let listRoute = _.get(Memory, ["sites", "mining", rmHarvest, "list_route"]);
				let hasKeepers = _.get(Memory, ["sites", "mining", rmHarvest, "has_keepers"], false);
				if (rmColony == rmHarvest
					&& _.filter(_.get(Game, ["spawns"]), s => { return s.room.name == rmColony; }).length < 1) {
					listSpawnRooms = _.get(Memory, ["rooms", rmColony, "spawn_assist", "rooms"]);
					listRoute = _.get(Memory, ["rooms", rmColony, "spawn_assist", "list_route"]);
				}

				let listCreeps = _.filter(Game.creeps, c => c.memory.room == rmHarvest && c.memory.colony == rmColony);

				Stats_CPU.End(rmColony, "Mining-init");

				Stats_CPU.Start(rmColony, `Mining-${rmHarvest}-surveyRoom`);
				if (isPulse_Defense())
					this.surveyRoom(rmColony, rmHarvest);
				Stats_CPU.End(rmColony, `Mining-${rmHarvest}-surveyRoom`);

				if (isPulse_Spawn()) {
					Stats_CPU.Start(rmColony, `Mining-${rmHarvest}-runPopulation`);
					this.runPopulation(rmColony, rmHarvest, listCreeps, listSpawnRooms, hasKeepers);
					Stats_CPU.End(rmColony, `Mining-${rmHarvest}-runPopulation`);
				}

				Stats_CPU.Start(rmColony, `Mining-${rmHarvest}-runCreeps`);
				this.runCreeps(rmColony, rmHarvest, listCreeps, hasKeepers, listRoute);
				Stats_CPU.End(rmColony, `Mining-${rmHarvest}-runCreeps`);

				Stats_CPU.Start(rmColony, `Mining-${rmHarvest}-buildContainers`);
				this.buildContainers(rmColony, rmHarvest);
				Stats_CPU.End(rmColony, `Mining-${rmHarvest}-buildContainers`);
			},

			surveyRoom: function (rmColony, rmHarvest) {
				let visible = _.keys(Game.rooms).includes(rmHarvest);
				_.set(Memory, ["sites", "mining", rmHarvest, "survey", "visible"], visible);
				_.set(Memory, ["sites", "mining", rmHarvest, "survey", "has_minerals"],
					visible ? _.filter(Game.rooms[rmHarvest].find(FIND_MINERALS), m => { return m.mineralAmount > 0; }).length > 0 : false);
				if (_.get(Memory, ["sites", "mining", rmHarvest, "survey", "source_amount"], 0) == 0)
					_.set(Memory, ["sites", "mining", rmHarvest, "survey", "source_amount"],
						(visible ? Game.rooms[rmHarvest].findSources().length : 0));

				let hostiles = visible
					? _.filter(Game.rooms[rmHarvest].find(FIND_HOSTILE_CREEPS),
						c => { return c.isHostile() && c.owner.username != "Source Keeper"; })
					: new Array();

				let invaderCore = visible
					? _.head(_.filter(Game.rooms[rmHarvest].find(FIND_STRUCTURES),
						s => s.structureType == "invaderCore"))
					: null;

				let is_safe = visible && hostiles.length == 0 && invaderCore == null;
				_.set(Memory, ["rooms", rmHarvest, "defense", "is_safe"], is_safe);
				_.set(Memory, ["sites", "mining", rmHarvest, "defense", "is_safe"], is_safe);
				_.set(Memory, ["sites", "mining", rmHarvest, "defense", "hostiles"], hostiles);

				// Can only mine a site/room if it is not reserved, or is reserved by the player
				let reservation = _.get(Game, ["rooms", rmHarvest, "controller", "reservation"], null);
				let can_mine = visible && (reservation == null || _.get(reservation, "username", null) == getUsername())
				_.set(Memory, ["sites", "mining", rmHarvest, "can_mine"], can_mine);

				// Tally energy sitting in containers awaiting carriers to take to storage...
				if (_.get(Game, ["rooms", rmColony, "storage"], null) != null) {
					let containers = !visible ? null
						: _.filter(Game.rooms[rmHarvest].find(FIND_STRUCTURES),
							s => { return s.structureType == STRUCTURE_CONTAINER; });

					if (containers == null) {
						_.set(Memory, ["sites", "mining", rmHarvest, "store_total"], 0);
						_.set(Memory, ["sites", "mining", rmHarvest, "store_percent"], 0);
					} else {
						let store_energy = _.sum(containers, c => { return c.store["energy"]; });
						let store_capacity = containers.length * 2000;
						_.set(Memory, ["sites", "mining", rmHarvest, "store_total"], store_energy);
						_.set(Memory, ["sites", "mining", rmHarvest, "store_percent"], store_energy / store_capacity);
					}
				}

				_.set(Memory, ["sites", "mining", rmHarvest, "survey", "reserve_access"],
					(!visible || _.get(Game, ["rooms", rmHarvest, "controller", "pos"], null) == null) ? 0
						: Game.rooms[rmHarvest].controller.pos.getAccessAmount(false));
			},

			runPopulation: function (rmColony, rmHarvest, listCreeps, listSpawnRooms, hasKeepers) {
				let room_level = Game["rooms"][rmColony].getLevel();
				let has_minerals = _.get(Memory, ["sites", "mining", rmHarvest, "survey", "has_minerals"]);
				let threat_level = _.get(Memory, ["rooms", rmColony, "defense", "threat_level"]);
				let is_safe = _.get(Memory, ["sites", "mining", rmHarvest, "defense", "is_safe"]);
				let hostiles = _.get(Memory, ["sites", "mining", rmHarvest, "defense", "hostiles"], new Array());

				let is_safe_colony = _.get(Memory, ["rooms", rmColony, "defense", "is_safe"], true);
				let is_visible = _.get(Memory, ["sites", "mining", rmHarvest, "survey", "visible"], true);
				let can_mine = _.get(Memory, ["sites", "mining", rmHarvest, "can_mine"]);

				// If the colony is not safe (under siege?) pause spawning remote mining; frees colony spawns to make soldiers
				if (rmColony != rmHarvest && !is_safe_colony)
					return;

				// Is the room visible? If not, only spawn a scout to check the room out!
				if (rmColony != rmHarvest && !is_visible) {
					let lScout = _.filter(listCreeps, c => c.memory.role == "scout");

					if (lScout.length < 1) {
						Memory["hive"]["spawn_requests"].push({
							room: rmColony, listRooms: listSpawnRooms, priority: 0, level: 1,
							scale: false, body: "scout", name: null, args: { role: "scout", room: rmHarvest, colony: rmColony }
						});
					}
					return;
				}

				let popActual = new Object();
				_.each(listCreeps, c => {
					switch (_.get(c, ["memory", "role"])) {
						default:
							let role = _.get(c, ["memory", "role"]);
							popActual[role] = _.get(popActual, role, 0) + 1;
							break;

						case "paladin": popActual["paladin"] = _.get(popActual, "paladin", 0) + ((c.ticksToLive == undefined || c.ticksToLive > 200) ? 1 : 0); break;
						case "burrower": popActual["burrower"] = _.get(popActual, "burrower", 0) + ((c.ticksToLive == undefined || c.ticksToLive > 100) ? 1 : 0); break;
						case "carrier": popActual["carrier"] = _.get(popActual, "carrier", 0) + ((c.ticksToLive == undefined || c.ticksToLive > 50) ? 1 : 0); break;
					}
				});

				let popTarget = new Object();
				let popSetting = (rmColony == rmHarvest
					? _.get(Memory, ["rooms", rmHarvest, "set_population"])
					: _.get(Memory, ["sites", "mining", rmHarvest, "set_population"]));

				if (popSetting)
					popTarget = _.cloneDeep(popSetting);
				else {
					if (rmColony == rmHarvest)
						popTarget = _.cloneDeep(Population_Mining[`S${Game.rooms[rmHarvest].findSources().length}`][Math.max(1, room_level)]);
					else if (hasKeepers != true) {
						popTarget = (is_visible && _.get(Game, ["rooms", rmHarvest]) != null)
							? _.cloneDeep(Population_Mining[`R${Game.rooms[rmHarvest].findSources().length}`][Math.max(1, room_level)])
							: _.cloneDeep(Population_Mining["R1"][Math.max(1, room_level)]);
					} else if (hasKeepers == true)
						popTarget = _.cloneDeep(Population_Mining["SK"]);
				}

				// Remote mining: adjust soldier levels based on threat level
				if (rmHarvest != rmColony && threat_level != NONE && hasKeepers == false) {
					if (threat_level == LOW || threat_level == null) {
						_.set(popTarget, ["ranger", "amount"], _.get(popTarget, ["ranger", "amount"], 0) + 1);
						_.set(popTarget, ["soldier", "amount"], _.get(popTarget, ["soldier", "amount"], 0) + 1);
						if (is_safe) {
							_.set(popTarget, ["ranger", "level"], Math.max(2, room_level - 2));
							_.set(popTarget, ["soldier", "level"], Math.max(2, room_level - 2));
						}
					} else if (threat_level == MEDIUM) {
						_.set(popTarget, ["soldier", "amount"], _.get(popTarget, ["soldier", "amount"], 0) + 1);
						_.set(popTarget, ["ranger", "amount"], _.get(popTarget, ["ranger", "amount"], 0) + 1);
						if (is_safe) {
							_.set(popTarget, ["soldier", "level"], Math.max(2, room_level - 1));
							_.set(popTarget, ["ranger", "level"], Math.max(2, room_level - 1));
						}
					} else if (threat_level == HIGH) {
						_.set(popTarget, ["soldier", "amount"], _.get(popTarget, ["soldier", "amount"], 0) + 4);
						_.set(popTarget, ["ranger", "amount"], _.get(popTarget, ["ranger", "amount"], 0) + 1);
					}
				}

				// Adjust carrier population amounts based on amount of energy sitting in storage
				if (_.get(Memory, ["sites", "mining", rmHarvest, "store_percent"], 0) > 0.75) {
					_.set(popTarget, ["carrier", "amount"], _.get(popTarget, ["carrier", "amount"], 0) + 2);
				} else if (_.get(Memory, ["sites", "mining", rmHarvest, "store_percent"], 0) > 0.5) {
					_.set(popTarget, ["carrier", "amount"], _.get(popTarget, ["carrier", "amount"], 0) + 1);
				}

				// Tally population levels for level scaling
				Control.populationTally(rmColony,
					_.sum(popTarget, p => { return _.get(p, "amount", 0); }),
					_.sum(popActual));

				// Grafana population stats
				Stats_Grafana.populationTally(rmColony, popTarget, popActual);

				if (_.get(popActual, "paladin", 0) < _.get(popTarget, ["paladin", "amount"], 0)) {
					Memory["hive"]["spawn_requests"].push({
						room: rmColony, listRooms: listSpawnRooms,
						priority: 14,
						level: popTarget["paladin"]["level"],
						scale: _.get(popTarget, ["paladin", "scale"], true),
						body: "paladin", name: null, args: { role: "paladin", room: rmHarvest, colony: rmColony }
					});
				}
				if (_.get(popActual, "ranger", 0) < _.get(popTarget, ["ranger", "amount"], 0)) {
					Memory["hive"]["spawn_requests"].push({
						room: rmColony, listRooms: listSpawnRooms,
						priority: 14,
						level: _.get(popTarget, ["ranger", "level"], room_level),
						scale: _.get(popTarget, ["ranger", "scale"], true),
						body: "ranger", name: null, args: { role: "ranger", room: rmHarvest, colony: rmColony }
					});
				}

				if ((!hasKeepers && !is_safe && hostiles.length > _.get(popActual, "soldier", 0))
					|| (_.get(popActual, "soldier", 0) < _.get(popTarget, ["soldier", "amount"], 0))) {
					Memory["hive"]["spawn_requests"].push({
						room: rmColony, listRooms: listSpawnRooms,
						priority: (!is_safe ? 3 : 14),
						level: _.get(popTarget, ["soldier", "level"], room_level),
						scale: _.get(popTarget, ["soldier", "scale"], true),
						body: "soldier", name: null, args: { role: "soldier", room: rmHarvest, colony: rmColony }
					});
				}

				if (_.get(popActual, "healer", 0) < _.get(popTarget, ["healer", "amount"], 0)) {
					Memory["hive"]["spawn_requests"].push({
						room: rmColony, listRooms: listSpawnRooms,
						priority: (!is_safe ? 4 : 15),
						level: popTarget["healer"]["level"],
						scale: _.get(popTarget, ["healer", "scale"], true),
						body: "healer", name: null, args: { role: "healer", room: rmHarvest, colony: rmColony }
					});
				}

				if (_.get(popActual, "multirole", 0) < _.get(popTarget, ["multirole", "amount"], 0)) {
					Memory["hive"]["spawn_requests"].push({
						room: rmColony, listRooms: listSpawnRooms,
						priority: 19,
						level: popTarget["multirole"]["level"],
						scale: _.get(popTarget, ["multirole", "scale"], true),
						body: _.get(popTarget, ["multirole", "body"], "worker"),
						name: null, args: { role: "multirole", room: rmHarvest, colony: rmColony }
					});
				}

				if (is_safe) {
					if (_.get(popActual, "reserver", 0) < _.get(popTarget, ["reserver", "amount"], 0)
						&& Game.rooms[rmHarvest] != null && Game.rooms[rmHarvest].controller != null
						&& (Game.rooms[rmHarvest].controller.reservation == null
							|| Game.rooms[rmHarvest].controller.reservation.ticksToEnd < 2000)
						&& (_.get(Memory, ["sites", "mining", rmHarvest, "survey", "reserve_access"], null) == null
							|| _.get(popActual, "reserver", 0) < _.get(Memory, ["sites", "mining", rmHarvest, "survey", "reserve_access"], 0))) {
						Memory["hive"]["spawn_requests"].push({
							room: rmColony, listRooms: listSpawnRooms,
							priority: 17,
							level: _.get(popTarget, ["reserver", "level"], 1),
							scale: _.get(popTarget, ["reserver", "scale"], true),
							body: _.get(popTarget, ["reserver", "body"], "reserver"),
							name: null, args: { role: "reserver", room: rmHarvest, colony: rmColony }
						});
					}

					if (can_mine) {
						if (_.get(popActual, "burrower", 0) < _.get(popTarget, ["burrower", "amount"], 0)) {
							Memory["hive"]["spawn_requests"].push({
								room: rmColony, listRooms: listSpawnRooms,
								priority: (rmColony == rmHarvest ? 12 : 15),
								level: _.get(popTarget, ["burrower", "level"], 1),
								scale: _.get(popTarget, ["burrower", "scale"], true),
								body: _.get(popTarget, ["burrower", "body"], "burrower"),
								name: null, args: { role: "burrower", room: rmHarvest, colony: rmColony }
							});
						}

						if (_.get(popActual, "carrier", 0) < _.get(popTarget, ["carrier", "amount"], 0)) {
							Memory["hive"]["spawn_requests"].push({
								room: rmColony, listRooms: listSpawnRooms,
								priority: (rmColony == rmHarvest ? 13 : 16),
								level: _.get(popTarget, ["carrier", "level"], 1),
								scale: _.get(popTarget, ["carrier", "scale"], true),
								body: _.get(popTarget, ["carrier", "body"], "carrier"),
								name: null, args: { role: "carrier", room: rmHarvest, colony: rmColony }
							});
						}

						if (_.get(popActual, "miner", 0) < 2 // Population stalling? Energy defecit? Replenish with miner group
							&& (_.get(popActual, "burrower", 0) < _.get(popTarget, ["burrower", "amount"], 0)
								&& _.get(popActual, "carrier", 0) < _.get(popTarget, ["carrier", "amount"], 0))) {
							Memory["hive"]["spawn_requests"].push({
								room: rmColony, listRooms: listSpawnRooms,
								priority: (rmColony == rmHarvest ? 11 : 14),
								level: Math.max(1, Game["rooms"][rmColony].getLevel_Available()),
								scale: true, body: "worker",
								name: null, args: { role: "miner", room: rmHarvest, colony: rmColony, spawn_renew: false }
							});
						}

						if (_.get(popActual, "miner", 0) < _.get(popTarget, ["miner", "amount"], 0)) {
							Memory["hive"]["spawn_requests"].push({
								room: rmColony, listRooms: listSpawnRooms,
								priority: (rmColony == rmHarvest ? 12 : 15),
								level: _.get(popTarget, ["miner", "level"], 1),
								scale: _.get(popTarget, ["miner", "scale"], true),
								body: _.get(popTarget, ["miner", "body"], "worker"),
								name: null, args: { role: "miner", room: rmHarvest, colony: rmColony }
							});
						}

						if (_.get(popActual, "dredger", 0) < _.get(popTarget, ["dredger", "amount"], 0)) {
							Memory["hive"]["spawn_requests"].push({
								room: rmColony, listRooms: listSpawnRooms,
								priority: 19,
								level: _.get(popTarget, ["dredger", "level"], 1),
								scale: _.get(popTarget, ["dredger", "scale"], true),
								body: _.get(popTarget, ["dredger", "body"], "dredger"),
								name: null, args: { role: "dredger", room: rmHarvest, colony: rmColony }
							});
						}

						let pause_extraction = _.get(Memory, ["hive", "pause", "extracting"], false);
						if (has_minerals && !pause_extraction
							&& _.get(popActual, "extractor", 0) < _.get(popTarget, ["extractor", "amount"], 0)) {
							Memory["hive"]["spawn_requests"].push({
								room: rmColony, listRooms: listSpawnRooms,
								priority: 18,
								level: _.get(popTarget, ["extractor", "level"], 1),
								scale: _.get(popTarget, ["extractor", "scale"], true),
								body: _.get(popTarget, ["extractor", "body"], "extractor"),
								name: null, args: { role: "extractor", room: rmHarvest, colony: rmColony }
							});
						}
					}
				}
			},

			runCreeps: function (rmColony, rmHarvest, listCreeps, hasKeepers, listRoute) {
				let is_safe = _.get(Memory, ["sites", "mining", rmHarvest, "defense", "is_safe"]);
				let can_mine = _.get(Memory, ["sites", "mining", rmHarvest, "can_mine"]);

				_.each(listCreeps, creep => {
					_.set(creep, ["memory", "list_route"], listRoute);

					switch (_.get(creep, ["memory", "role"])) {
						case "scout": Creep_Roles.Scout(creep); break;
						case "extractor": Creep_Roles.Extractor(creep, is_safe); break;
						case "reserver": Creep_Roles.Reserver(creep); break;
						case "healer": Creep_Roles.Healer(creep, true); break;

						case "miner": case "burrower": case "carrier":
							Creep_Roles.Mining(creep, is_safe, can_mine);
							break;

						case "dredger":
							// This role hasn't been implemented yet...
							//Creep_Roles.Dredger(creep, can_mine);
							break;

						case "soldier": case "paladin":
							Creep_Roles.Soldier(creep, false, true);
							break;

						case "ranger": case "archer":
							Creep_Roles.Archer(creep, false, true);
							break;

						case "multirole":
							if (hasKeepers || (is_safe && can_mine))
								Creep_Roles.Worker(creep, is_safe);
							else
								Creep_Roles.Soldier(creep, false, true);
							break;
					}
				});
			},

			buildContainers: function (rmColony, rmHarvest) {
				hasKeepers = _.get(Memory, ["sites", "mining", rmHarvest, "has_keepers"], false);
				if (Game.time % 1500 != 0 || rmColony == rmHarvest || hasKeepers)
					return;		// Blueprint builds containers in colony rooms

				let room = Game["rooms"][rmHarvest];
				if (room == null)
					return;

				let sources = room.findSources();
				let containers = _.filter(room.find(FIND_STRUCTURES), s => { return s.structureType == "container"; });
				_.each(sources, source => {
					if (source.pos.findInRange(containers, 1).length < 1) {
						let adj = source.pos.getBuildableTile_Adjacent();
						if (adj != null && adj.createConstructionSite("container") == OK)
							console.log(`<font color=\"#6065FF\">[Mining]</font> ${room.name} placing container at (${adj.x}, ${adj.y})`);
					}
				});
			}
		};
		Mining.Run(rmColony, rmHarvest);
	},

	Industry: function (rmColony) {
		let Industry = {

			Run: function (rmColony) {
				// Expanded scope variables:
				labDefinitions = _.get(Memory, ["rooms", rmColony, "labs", "definitions"]);

				Stats_CPU.Start(rmColony, "Industry-listCreeps");
				let listCreeps = _.filter(Game.creeps, c => c.memory.room == rmColony);
				Stats_CPU.End(rmColony, "Industry-listCreeps");

				if (isPulse_Spawn()) {
					Stats_CPU.Start(rmColony, "Industry-runPopulation");
					this.runPopulation(rmColony, listCreeps);
					Stats_CPU.End(rmColony, "Industry-runPopulation");
				}

				Stats_CPU.Start(rmColony, "Industry-defineLabs");
				if (isPulse_Lab()) {
					this.defineLabs(rmColony);
				}
				Stats_CPU.End(rmColony, "Industry-defineLabs");

				Stats_CPU.Start(rmColony, "Industry-runLabs");
				this.runLabs(rmColony);
				Stats_CPU.End(rmColony, "Industry-runLabs");

				if (isPulse_Mid()) {
					// Reset task list for recompilation
					_.set(Memory, ["rooms", rmColony, "industry", "tasks"], new Array());
					_.set(Memory, ["rooms", rmColony, "industry", "boosts"], new Array());

					Stats_CPU.Start(rmColony, "Industry-loadNukers");
					this.loadNukers(rmColony);
					Stats_CPU.End(rmColony, "Industry-loadNukers");

					Stats_CPU.Start(rmColony, "Industry-createLabTasks");
					_.set(Memory, ["rooms", rmColony, "industry", "tasks", "list"], new Object());
					_.set(Memory, ["rooms", rmColony, "industry", "tasks", "running"], new Object());
					this.createLabTasks(rmColony);
					Stats_CPU.End(rmColony, "Industry-createLabTasks");

					Stats_CPU.Start(rmColony, "Industry-runTerminal");
					this.runTerminal(rmColony);
					Stats_CPU.End(rmColony, "Industry-runTerminal");
				}

				Stats_CPU.Start(rmColony, "Industry-runCreeps");
				this.runCreeps(rmColony, listCreeps);
				Stats_CPU.End(rmColony, "Industry-runCreeps");
			},


			runPopulation: function (rmColony, listCreeps) {
				let listSpawnRooms = _.get(Memory, ["rooms", rmColony, "spawn_assist", "rooms"]);

				let popActual = new Object();
				_.set(popActual, "courier", _.filter(listCreeps, (c) => c.memory.role == "courier" && (c.ticksToLive == undefined || c.ticksToLive > 80)).length);

				let popTarget = new Object();
				let popSetting = _.get(Memory, ["rooms", rmColony, "set_population"]);
				if (popSetting)
					popTarget = _.cloneDeep(popSetting)
				else
					popTarget = _.cloneDeep(Population_Industry);

				// Tally population levels for level scaling and statistics
				Control.populationTally(rmColony,
					_.sum(popTarget, p => { return _.get(p, "amount", 0); }),
					_.sum(popActual));

				// Grafana population stats
				Stats_Grafana.populationTally(rmColony, popTarget, popActual);

				if (_.get(Game, ["rooms", rmColony, "terminal"])
					&& _.get(popActual, "courier", 0) < _.get(popTarget, ["courier", "amount"], 0)) {
					Memory["hive"]["spawn_requests"].push({
						room: rmColony, listRooms: listSpawnRooms,
						priority: Math.lerpSpawnPriority(14, 16, _.get(popActual, "courier"), _.get(popTarget, ["courier", "amount"])),
						level: popTarget["courier"]["level"],
						scale: popTarget["courier"] == null ? true : popTarget["courier"]["scale"],
						body: "courier", name: null, args: { role: "courier", room: rmColony }
					});
				}
			},

			loadNukers: function (rmColony) {
				let nuker = _.head(Game.rooms[rmColony].find(FIND_STRUCTURES, { filter: (s) => { return s.structureType == "nuker"; } }));
				let storage = Game.rooms[rmColony].storage;

				if (nuker == null || storage == null)
					return;

				if (nuker.store[RESOURCE_ENERGY] < nuker.store.getCapacity(RESOURCE_ENERGY) && _.get(storage, ["store", "energy"], 0) > 0) {
					Memory.rooms[rmColony].industry.tasks.push(
						{ type: "withdraw", resource: "energy", id: storage.id, timer: 60, priority: 5 },
						{ type: "deposit", resource: "energy", id: nuker.id, timer: 60, priority: 5 });
				}
				if (nuker.store[RESOURCE_GHODIUM] < nuker.store.getCapacity(RESOURCE_GHODIUM)) {
					if (_.get(Memory, ["rooms", rmColony, "stockpile", "G"]) == null)
						_.set(Memory, ["rooms", rmColony, "stockpile", "G"], 500)
					if (_.get(storage, ["store", "G"], 0) > 0) {
						Memory.rooms[rmColony].industry.tasks.push(
							{ type: "withdraw", resource: "G", id: storage.id, timer: 60, priority: 5 },
							{ type: "deposit", resource: "G", id: nuker.id, timer: 60, priority: 5 });
					}
				}
			},

			assignReaction: function (rmColony) {
				if (_.filter(Game["rooms"][rmColony].find(FIND_MY_STRUCTURES), s => {
					return s.structureType == "lab"
						&& _.filter(labDefinitions, def => { return _.get(def, "action") == "boost" && _.get(def, "lab") == s.id; }).length == 0
				}).length < 3) {
					console.log(`<font color=\"#A17BFF\">[Labs]</font> Unable to assign a reaction to ${rmColony}- not enough labs available for reactions (labs boosting?).`);
					return;
				}

				let target = _.head(_.sortBy(_.sortBy(_.sortBy(_.filter(_.get(Memory, ["resources", "labs", "targets"]),
					t => {
						let amount = 0, r1_amount = 0, r2_amount = 0;
						let reagents = getReagents(_.get(t, "mineral"));
						_.each(_.filter(Game.rooms,
							r => { return r.controller != null && r.controller.my && r.terminal; }),
							r => {
								amount += r.store(_.get(t, "mineral"));
								r1_amount += r.store(reagents[0]);
								r2_amount += r.store(reagents[1]);
							});
						return (_.get(t, "amount") < 0 || amount < _.get(t, "amount")) && r1_amount >= 1000 && r2_amount >= 1000;
					}),
					t => _.get(t, "priority")),
					t => _.get(t, "is_reagent")),
					t => _.filter(_.get(Memory, ["resources", "labs", "reactions"]), r => { return _.get(r, "mineral") == _.get(t, "mineral"); }).length));

				if (target != null) {
					_.set(Memory, ["resources", "labs", "reactions", rmColony], { mineral: target.mineral, amount: target.amount });
					console.log(`<font color=\"#A17BFF\">[Labs]</font> Assigning ${rmColony} to create ${target.mineral}.`);
				} else {
					_.set(Memory, ["resources", "labs", "reactions", rmColony], { mineral: null, amount: null });
					console.log(`<font color=\"#A17BFF\">[Labs]</font> No reaction to assign to ${rmColony}, idling.`);
				}

			},

			defineLabs: function (rmColony) {
				// Clean up labDefinitions, remove duplicate "boosts", remove "empty" if already empty
				if (labDefinitions != null) {
					for (let i = labDefinitions.length - 1; i >= 0; i--) {
						if (_.get(labDefinitions[i], "action") == "boost") {
							if (_.get(labDefinitions[i], "expire") != null && _.get(labDefinitions[i], "expire") < Game.time)
								labDefinitions.splice(i, 1);

							for (let j = labDefinitions.length - 1; j >= 0; j--) {
								if (i != j && _.get(labDefinitions[i], "lab") == _.get(labDefinitions[j], "lab"))
									labDefinitions.splice(i, 1);
							}
						} else if (_.get(labDefinitions[i], "action") == "empty") {
							let labs = _.get(labDefinitions[i], "labs");
							for (let j = labs.length - 1; j >= 0; j--) {
								let lab = Game.getObjectById(labs[j]);
								if (lab == null || lab.mineralAmount == 0)
									labs.splice(j, 1);
							}

							if (labs.length == 0)
								labDefinitions.splice(i, 1)
							else
								_.set(labDefinitions[i], "labs", labs);
						}
					}
					_.set(Memory, ["rooms", rmColony, "labs", "definitions"], labDefinitions);
				}

				// Get labs able to process reactions (exclude labs defined to boost)
				let labs = _.filter(Game["rooms"][rmColony].find(FIND_MY_STRUCTURES), s => {
					return s.structureType == "lab"
						&& _.filter(labDefinitions, def => { return _.get(def, "action") == "boost" && _.get(def, "lab") == s.id; }).length == 0
				});

				// Not enough labs to support a reaction? Remove defined reactions, empty labs (if needed) and return
				if (labDefinitions != null && labs.length < 3) {
					for (let i = labDefinitions.length - 1; i >= 0; i--) {
						if (_.get(labDefinitions, [i, "action"]) == "reaction")
							labDefinitions.splice(i, 1)
					}

					for (let i = 0; i < labs.length; i++) {
						if (labs[i].mineralAmount > 0 && _.filter(labDefinitions, d => {
							return _.get(d, "action") == "empty"
								&& _.filter(_.get(d, "labs"), l => { return l == labs[i].id; }).length > 0
						}).length == 0) {

							labDefinitions.push({ action: "empty", labs: [labs[i].id] });
						}
					}

					_.set(Memory, ["rooms", rmColony, "labs", "definitions"], labDefinitions);
					return;
				}

				let terminal = _.get(Game, ["rooms", rmColony, "terminal"]);
				if (terminal == null)
					terminal = _.head(labs);

				labs = _.sortBy(labs, lab => { return lab.pos.getRangeTo(terminal.pos.x, terminal.pos.y); });
				let supply1 = _.get(labs, [0, "id"]);
				let supply2 = _.get(labs, [1, "id"]);
				let reactors = [];
				for (let i = 2; i < labs.length; i++)
					reactors.push(_.get(labs, [i, "id"]));

				// Clear existing "reaction" actions before adding new ones
				if (labDefinitions == null)
					labDefinitions = [];
				else {
					for (let i = labDefinitions.length - 1; i >= 0; i--) {
						if (_.get(labDefinitions, [i, "action"]) == "reaction")
							labDefinitions.splice(i, 1)
					}
				}

				labDefinitions.push({ action: "reaction", supply1: supply1, supply2: supply2, reactors: reactors });
				_.set(Memory, ["rooms", rmColony, "labs", "definitions"], labDefinitions);
				console.log(`<font color=\"#A17BFF\">[Labs]</font> Labs defined for ${rmColony}.`);
			},

			runLabs: function (rmColony) {
				/* Arguments for labDefinitions:

					Memory["rooms"][rmColony]["labs"]["definitions"]

					[ { action: "reaction", supply1: "5827cdeb16de9e4869377e4a", supply2: "5827f4b3a0ed8e9f6bf5ae3c",
						reactors: [ "5827988a4f975a7d696dba90", "5828280b74d604b04955e2f6", "58283338cc371cf674426315", "5827fcc4d448f67249f48185",
							"582825566948cb7d61593ab9", "58271f0e740746b259c029e9", "5827e49f0177f1ea2582a419" ] } ]);

					{ action: "boost", mineral: "", lab: "", role: "", subrole: "" }
					{ action: "reaction", amount: -1, mineral: "",
					  supply1: "", supply2: "",
					  reactors: ["", "", ...] }
					{ action: "empty", labs: ["", "", ...] }
				*/

				if (isPulse_Lab()) {
					this.assignReaction(rmColony);
				}

				for (let l in labDefinitions) {
					let listing = labDefinitions[l];
					switch (listing["action"]) {
						default:
							break;

						case "boost":
							let lab = Game.getObjectById(listing["lab"]);
							if (lab == null || (_.get(listing, "expire") != null && _.get(listing, "expire") < Game.time))
								break;

							if (!lab.canBoost(_.get(listing, "mineral"))) {
								_.each(_.filter(_.get(Memory, ["rooms", rmColony, "industry", "boosts"]),
									b => { return b.active && b.id == listing["lab"] && b.resource == listing["mineral"]; }),
									b => { b.active = false; });
							}

							let creep = _.head(lab.pos.findInRange(FIND_MY_CREEPS, 1, {
								filter: (c) => {
									return c.ticksToLive > 1250 && c.memory.role == listing["role"]
										&& (!listing["dest"] || c.memory.room == listing["dest"])
								}
							}));
							if (creep)
								lab.boostCreep(creep);

							break;

						case "reaction":
							let labSupply1 = Game.getObjectById(listing["supply1"]);
							let labSupply2 = Game.getObjectById(listing["supply2"]);

							if (labSupply1 == null && labSupply2 == null)
								break;

							let mineral = _.get(Memory, ["resources", "labs", "reactions", rmColony, "mineral"]);
							if (mineral == null)
								return;

							if (_.get(REACTIONS, [labSupply1.mineralType, labSupply2.mineralType]) != mineral)
								return;

							let amount = _.get(Memory, ["resources", "labs", "reactions", rmColony, "amount"], -1);
							if (amount > 0 && Game.rooms[rmColony].store(mineral) >= amount) {
								if (_.get(Memory, ["resources", "labs", "targets", mineral, "is_reagent"]))
									delete Memory["resources"]["labs"]["targets"][mineral];
								delete Memory["resources"]["labs"]["reactions"][rmColony];
								console.log(`<font color=\"#A17BFF\">[Labs]</font> ${rmColony} completed target for ${mineral}, re-assigning lab.`);
								delete Memory["hive"]["pulses"]["lab"];
								return;
							}

							_.forEach(listing["reactors"], r => {
								let labReactor = Game.getObjectById(r);
								if (labReactor != null)
									labReactor.runReaction(labSupply1, labSupply2);
							});

							break;
					}
				}
			},

			createLabTasks: function (rmColony) {
				/* Terminal task priorities:
				 * 2: emptying labs
				 * 3: filling labs
				 * 4: filling nuker
				 * 5: filling orders
				 * 6: emptying terminal
				 */

				for (let l in labDefinitions) {
					var lab, storage;
					let listing = labDefinitions[l];

					switch (listing["action"]) {
						default:
							break;

						case "boost":
							lab = Game.getObjectById(listing["lab"]);
							if (lab == null)
								break;

							if (_.get(Memory, ["rooms", rmColony, "stockpile", listing["mineral"]]) == null)
								_.set(Memory, ["rooms", rmColony, "stockpile", listing["mineral"]], 1000)

							// Minimum amount necessary to boost 1x body part: 30 mineral & 20 energy
							if (lab.mineralType == listing["mineral"] && lab.mineralAmount > 30 && lab.energy > 20) {
								Memory.rooms[rmColony].industry.boosts.push(
									{
										type: "boost", role: listing["role"], resource: listing["mineral"], dest: listing["dest"],
										id: lab.id, pos: lab.pos, timer: 30, active: true
									});
							}

							storage = Game.rooms[rmColony].storage;
							if (storage == null) break;

							if (lab.mineralType != null && lab.mineralType != listing["mineral"]) {
								Memory.rooms[rmColony].industry.tasks.push(
									{ type: "withdraw", resource: lab.mineralType, id: lab.id, timer: 60, priority: 2 });
							} else if (lab.energy < lab.energyCapacity * 0.75 && storage.store["energy"] > 0) {
								Memory.rooms[rmColony].industry.tasks.push(
									{ type: "withdraw", resource: "energy", id: storage.id, timer: 60, priority: 3 },
									{ type: "deposit", resource: "energy", id: lab.id, timer: 60, priority: 3 });
							} else if (lab.mineralAmount < lab.mineralCapacity * 0.75 && Object.keys(storage.store).includes(listing["mineral"])) {
								Memory.rooms[rmColony].industry.tasks.push(
									{ type: "withdraw", resource: listing["mineral"], id: storage.id, timer: 60, priority: 3 },
									{ type: "deposit", resource: listing["mineral"], id: lab.id, timer: 60, priority: 3 });
							}
							break;

						case "empty":
							storage = Game.rooms[rmColony].storage;
							if (storage == null) break;
							_.forEach(listing["labs"], l => {
								lab = Game.getObjectById(l);
								if (lab.mineralAmount > 0) {
									Memory.rooms[rmColony].industry.tasks.push(
										{ type: "withdraw", resource: lab.mineralType, id: lab.id, timer: 60, priority: 2 });
								}
							});
							break;

						case "reaction":
							storage = Game.rooms[rmColony].storage;
							if (storage == null) break;

							let mineral = _.get(Memory, ["resources", "labs", "reactions", rmColony, "mineral"]);
							if (mineral == null)
								return;

							let reagents = getReagents(mineral);
							let supply1_mineral = reagents[0];
							let supply2_mineral = reagents[1];
							_.set(Memory, ["rooms", rmColony, "stockpile", supply1_mineral], 1000)
							_.set(Memory, ["rooms", rmColony, "stockpile", supply2_mineral], 1000)


							lab = Game.getObjectById(listing["supply1"]);
							if (lab == null) {
								console.log(`<font color=\"#FF0000\">[Error]</font> Sites.Industry: Game.getObjectById(${listing["supply1"]}) is null.`);
								return;
							}
							else if (lab.mineralType != null && lab.mineralType != supply1_mineral) {
								Memory.rooms[rmColony].industry.tasks.push(
									{ type: "withdraw", resource: lab.mineralType, id: lab.id, timer: 60, priority: 2 });
							}
							else if (Object.keys(storage.store).includes(supply1_mineral)
								&& lab.mineralAmount < lab.mineralCapacity * 0.25) {
								Memory.rooms[rmColony].industry.tasks.push(
									{ type: "withdraw", resource: supply1_mineral, id: storage.id, timer: 60, priority: 3 },
									{ type: "deposit", resource: supply1_mineral, id: lab.id, timer: 60, priority: 3 });
							}

							lab = Game.getObjectById(listing["supply2"]);
							if (lab == null) {
								console.log(`<font color=\"#FF0000\">[Error]</font> Sites.Industry: Game.getObjectById(${listing["supply2"]}) is null.`);
								return;
							}
							else if (lab.mineralType != null && lab.mineralType != supply2_mineral) {
								Memory.rooms[rmColony].industry.tasks.push(
									{ type: "withdraw", resource: lab.mineralType, id: lab.id, timer: 60, priority: 2 });
							}
							else if (Object.keys(storage.store).includes(supply2_mineral)
								&& lab.mineralAmount < lab.mineralCapacity * 0.25) {
								Memory.rooms[rmColony].industry.tasks.push(
									{ type: "withdraw", resource: supply2_mineral, id: storage.id, timer: 60, priority: 3 },
									{ type: "deposit", resource: supply2_mineral, id: lab.id, timer: 60, priority: 3 });
							}

							_.forEach(listing["reactors"], r => {
								lab = Game.getObjectById(r);
								if (lab == null) {
									console.log(`<font color=\"#FF0000\">[Error]</font> Sites.Industry: Game.getObjectById(${r}) is null.`);
									return;
								}
								else if (lab.mineralType != null && lab.mineralType != mineral) {
									Memory.rooms[rmColony].industry.tasks.push(
										{ type: "withdraw", resource: lab.mineralType, id: lab.id, timer: 60, priority: 2 });
								} else if (lab.mineralAmount > lab.mineralCapacity * 0.2) {
									Memory.rooms[rmColony].industry.tasks.push(
										{ type: "withdraw", resource: mineral, id: lab.id, timer: 60, priority: 2 });
								}
							});

							break;
					}
				}
			},

			runTerminal: function (rmColony) {
				if (Game.rooms[rmColony].terminal != null && Game.rooms[rmColony].terminal.my) {

					if (_.get(Memory, ["resources", "terminal_orders"]) == null)
						_.set(Memory, ["resources", "terminal_orders"], new Object());
					if (_.get(Memory, ["rooms", rmColony, "stockpile"]) == null)
						_.set(Memory, ["rooms", rmColony, "stockpile"], new Object());

					let shortage = {};
					let room = Game.rooms[rmColony];
					let storage = Game.rooms[rmColony].storage;
					let terminal = Game.rooms[rmColony].terminal;
					let energy_level = room.store("energy");
					let energy_critical = room.getCriticalEnergy();

					// Create orders to request resources to meet per-room stockpile
					for (let res in _.get(Memory, ["rooms", rmColony, "stockpile"])) {
						shortage[res] = _.get(Memory, ["rooms", rmColony, "stockpile", res]) - room.store(res);

						if (shortage[res] > 0)
							_.set(Memory, ["resources", "terminal_orders", `${rmColony}-${res}`],
								{ room: rmColony, resource: res, amount: shortage[res], automated: true, priority: 2 });
					}

					// Set critical energy threshold to room's stockpile (to prevent sending to other rooms)
					if (_.get(Memory, ["rooms", rmColony, "stockpile", "energy"], 0) < energy_critical)
						_.set(Memory, ["rooms", rmColony, "stockpile", "energy"], energy_critical);

					// Create high priority order to fix critical shortage of energy in this room (include margins for error)
					if (energy_level < energy_critical) {
						let amount = Math.max((energy_critical * 1.25) - energy_level, 1000);

						if (amount > 0) {
							// Prevent spamming "new energy order creted" if it's just modifying the amount on an existing order...
							if (_.get(Memory, ["resources", "terminal_orders", `${rmColony}-energy_critical`]) == null)
								console.log(`<font color=\"#DC00FF\">[Terminals]</font> Creating critical energy order for ${rmColony} for ${amount} energy.`);
							_.set(Memory, ["resources", "terminal_orders", `${rmColony}-energy_critical`],
								{ room: rmColony, resource: "energy", amount: amount, automated: true, priority: 1 });

							// Prevent double energy orders (one for critical, one for regular stockpile)
							delete Memory["resources"]["terminal_orders"][`${rmColony}-energy`];
						}
					} else {
						delete Memory["resources"]["terminal_orders"][`${rmColony}-energy_critical`];
					}

					let filling = new Array();
					this.runTerminal_Orders(rmColony, storage, terminal, shortage, filling);
					this.runTerminal_Empty(rmColony, storage, terminal, filling);
				}
			},

			runTerminal_Orders: function (rmColony, storage, terminal, shortage, filling) {
				/* Priority list for terminal orders:
				 * 	1: console injected...
				 * 	2: filling a shortage (internal transfers)
				 * 	3: filling energy for an internal transfer
				 *	4: filling a market order
				 *	5: filling energy for a market order
				*/

				for (let o in _.get(Memory, ["resources", "terminal_orders"]))
					_.set(Memory, ["resources", "terminal_orders", o, "name"], o);

				let orders = _.sortBy(_.get(Memory, ["resources", "terminal_orders"]), "priority");

				for (let n in orders) {
					let order = orders[n];

					if (_.get(order, "active", true) == false)
						continue;

					if (this.runOrder_Sync(order, rmColony) == false)
						continue;

					if ((order["market_id"] == null && order["room"] != rmColony)
						|| (order["market_id"] != null && order["type"] == "buy" && order["from"] == rmColony)) {
						// Buy order means I'm selling...
						if (this.runOrder_Send(rmColony, order, storage, terminal, shortage, filling) == true)
							return;
					} else if (order["market_id"] != null && order["type"] == "sell" && order["to"] == rmColony) {
						// Sell order means I'm buying...
						if (this.runOrder_Receive(rmColony, order, storage, terminal, filling) == true)
							return;
					}
				}
			},

			runOrder_Sync: function (order, rmColony) {
				let o = order["name"];

				if (_.get(order, "market_id") != null) {	// Sync market orders, update/find new if expired...
					if (order["sync"] != Game.time) {
						order["sync"] = Game.time;
						let sync = Game.market.getOrderById(order["market_id"]);

						if (sync != null) {
							order["market_item"] = sync;
							order["type"] = sync.type;
							order["room"] = sync.roomName;
							order["resource"] = sync.resourceType;
						} else {
							let replacement = _.head(_.sortBy(Game.market.getAllOrders(
								obj => {
									return _.get(obj, "resourceType") == _.get(order, ["market_item", "resourceType"])
										&& _.get(obj, "type") == _.get(order, ["market_item", "type"])
										&& _.get(obj, "price") == _.get(order, ["market_item", "price"]);
								}),
								obj => { return Game.map.getRoomLinearDistance(rmColony, obj.roomName); }));

							if (replacement != null) {
								order["market_item"] = replacement;
								order["market_id"] = replacement.id;
								order["type"] = replacement.type;
								order["room"] = replacement.roomName;
								order["resource"] = replacement.resourceType;

								console.log(`<font color=\"#00F0FF\">[Market]</font> Replacement market order found for ${o}!`);
								return true;
							} else {
								console.log(`<font color=\"#00F0FF\">[Market]</font> No replacement market order found for ${o}; order deleted!`);

								delete Memory["resources"]["terminal_orders"][o];
								return false;
							}
						}
					}
				}

				return true;
			},

			runOrder_Send: function (rmColony, order, storage, terminal, shortage, filling) {
				/* Notes: Minimum transfer amount is 100.
				 *	 Don't try fulfilling orders with near-shortages- can cause an endless send loop and confuse couriers
				*/

				let o = order["name"];
				let res = order["resource"];
				let room = Game.rooms[rmColony];

				if (_.get(shortage, res, 0) < -2000 || (!_.keys(shortage).includes(res) && room.store(res) > 100)) {
					if (terminal.store[res] != null && ((res != "energy" && terminal.store[res] >= 100) || (res == "energy" && terminal.store[res] > 200))) {
						filling.push(res);
						filling.push("energy");

						let amount;
						if (res == "energy") {
							let calc_transfer = Game.market.calcTransactionCost(10000, rmColony, order["room"]);
							let calc_total = calc_transfer + 10000;
							let calc_coeff = (1 - calc_transfer / calc_total) * 0.95;
							amount = Math.floor(Math.clamp(terminal.store[res] * calc_coeff, 100, order["amount"]));
						} else {
							amount = Math.floor(Math.clamp(terminal.store[res], 100, order["amount"]));
						}

						let cost = Game.market.calcTransactionCost(amount, rmColony, order["room"]);

						if ((res != "energy" && terminal.store["energy"] >= cost)
							|| (res == "energy" && terminal.store["energy"] >= cost + amount)) {

							if (terminal.cooldown > 0)
								return false;

							let result = (order["market_id"] == null)
								? terminal.send(res, amount, order["room"])
								: Game.market.deal(order["market_id"], amount, rmColony);

							if (result == OK) {
								console.log(`<font color=\"#DC00FF\">[Terminals]</font> ${o}: ${amount} of ${res} sent, ${rmColony}`
									+ ` -> ${order["room"]}`);

								Memory["resources"]["terminal_orders"][o]["amount"] -= amount;
								if (_.get(Memory, ["resources", "terminal_orders", o, "amount"]) <= 0)
									delete Memory["resources"]["terminal_orders"][o];

								return true;

							} else {
								console.log(`<font color=\"#DC00FF\">[Terminals]</font> ${o}: failed to send, `
									+ `${amount} of ${res} ${rmColony} -> ${order["room"]} (code: ${result})`);
							}
						} else {
							if (storage != null && storage.store["energy"] > room.getCriticalEnergy()) {
								Memory.rooms[rmColony].industry.tasks.push(
									{ type: "withdraw", resource: "energy", id: storage.id, timer: 60, priority: 5 },
									{ type: "deposit", resource: "energy", id: terminal.id, timer: 60, priority: 5 });
							} else if (res != "energy") {
								shortage["energy"] = (shortage["energy"] == null) ? cost : shortage["energy"] + cost;
								_.set(Memory, ["resources", "terminal_orders", `${rmColony}-energy`],
									{ room: rmColony, resource: "energy", amount: cost, automated: true, priority: order["market_id"] == null ? 3 : 5 });
							}
						}
					} else if (storage != null && storage.store[res] != null) {
						filling.push(res);

						Memory.rooms[rmColony].industry.tasks.push(
							{
								type: "withdraw", resource: res, id: storage.id, timer: 60, priority: 5,
								amount: Object.keys(shortage).includes(res) ? Math.abs(shortage[res] + 100) : null
							},
							{ type: "deposit", resource: res, id: terminal.id, timer: 60, priority: 5 });
					}
				}

				return false;
			},

			runOrder_Receive: function (rmColony, order, storage, terminal, filling) {
				/* Notes: Minimum transfer amount is 100
				 * And always buy in small amounts! ~500-5000
				 */

				if (terminal.cooldown > 0)
					return false;

				let o = order["name"];
				let res = order["resource"];
				let room = Game.rooms[rmColony];
				let amount = Math.max(100, Math.min(_.get(Memory, ["resources", "terminal_orders", o, "amount"]), 5000));
				let cost = Game.market.calcTransactionCost(amount, rmColony, order["room"]);

				if (_.get(terminal, ["store", "energy"]) > cost) {
					let result = Game.market.deal(order["market_id"], amount, rmColony);

					if (result == OK) {
						console.log(`<font color=\"#DC00FF\">[Terminals]</font> ${o}: ${amount} of ${res} received, ${order["room"]}`
							+ ` -> ${rmColony} `);

						Memory["resources"]["terminal_orders"][o]["amount"] -= amount;
						if (_.get(Memory, ["resources", "terminal_orders", o, "amount"]) <= 0)
							delete Memory["resources"]["terminal_orders"][o];

						return true;
					} else {
						console.log(`<font color=\"#DC00FF\">[Terminals]</font> ${o}: failed to receive`
							+ ` ${amount} of ${res} ${order["room"]} -> ${rmColony} (code: ${result})`);
					}
				} else {
					if (_.get(storage, ["store", "energy"]) > room.getCriticalEnergy()) {
						filling.push("energy");

						Memory.rooms[rmColony].industry.tasks.push(
							{ type: "withdraw", resource: "energy", id: storage.id, timer: 60, priority: 5 },
							{ type: "deposit", resource: "energy", id: terminal.id, timer: 60, priority: 5 });
					} else if (res != "energy") {
						_.set(Memory, ["resources", "terminal_orders", `${rmColony}-energy`],
							{ room: rmColony, resource: "energy", amount: cost, automated: true, priority: 5 });
					}
				}

				return false;
			},

			runTerminal_Empty: function (rmColony, storage, terminal, filling) {
				// Create generic tasks for emptying terminal's minerals to storage
				let resource_list = [
					"energy",
					"H", "O", "U", "L", "K", "Z", "X", "G",
					"OH", "ZK", "UL",
					"UH", "UO", "KH", "KO", "LH", "LO", "ZH", "ZO", "GH", "GO",
					"UH2O", "UHO2", "KH2O", "KHO2", "LH2O", "LHO2", "ZH2O", "ZHO2", "GH2O", "GHO2",
					"XUH2O", "XUHO2", "XKH2O", "XKHO2", "XLH2O", "XLHO2", "XZH2O", "XZHO2", "XGH2O", "XGHO2"];

				for (let r in resource_list) {
					let res = resource_list[r];

					if (filling.includes(res)
						|| ((res != "energy" && (terminal.store[res] == null || terminal.store[res] == 0))
							|| (res == "energy" && terminal.store[res] == 0)))
						continue;

					Memory.rooms[rmColony].industry.tasks.push(
						{ type: "withdraw", resource: res, id: terminal.id, timer: 60, priority: 6 },
						{ type: "deposit", resource: res, id: storage.id, timer: 60, priority: 6 });
				}
			},

			runCreeps: function (rmColony, listCreeps) {
				_.each(listCreeps, creep => {
					if (creep.memory.role == "courier") {
						Creep_Roles.Courier(creep);
					}
				});
			}
		};

		Industry.Run(rmColony);
	},

	Colonization: function (rmColony, rmTarget) {
		let Colonization = {

			Run: function (rmColony, rmTarget) {

				controller = _.get(Game, ["rooms", rmColony, "controller"]);
				if (controller == null || !_.get(controller, "my") || _.get(controller, "level") < 3)
					return;

				Stats_CPU.Start(rmColony, `Colonization-${rmTarget}-init`);
				listRoute = _.get(Memory, ["sites", "colonization", rmTarget, "list_route"]);
				Stats_CPU.End(rmColony, `Colonization-${rmTarget}-init`);

				Stats_CPU.Start(rmColony, `Colonization-${rmTarget}-listCreeps`);
				let listCreeps = _.filter(Game.creeps, c => c.memory.room == rmTarget && c.memory.colony == rmColony);
				Stats_CPU.End(rmColony, `Colonization-${rmTarget}-listCreeps`);

				if (isPulse_Spawn()) {
					Stats_CPU.Start(rmColony, `Colonization-${rmTarget}-runPopulation`);
					this.runPopulation(rmColony, rmTarget, listCreeps);
					Stats_CPU.End(rmColony, `Colonization-${rmTarget}-runPopulation`);
				}

				Stats_CPU.Start(rmColony, `Colonization-${rmTarget}-runCreeps`);
				this.runCreeps(rmColony, rmTarget, listCreeps, listRoute);
				Stats_CPU.End(rmColony, `Colonization-${rmTarget}-runCreeps`);
			},

			runPopulation: function (rmColony, rmTarget, listCreeps) {
				let popActual = new Object();
				_.set(popActual, "colonizer", _.filter(listCreeps, c => c.memory.role == "colonizer").length);

				let popTarget = _.cloneDeep(Population_Colonization);

				// Tally population levels for level scaling and statistics
				Control.populationTally(rmColony,
					_.sum(popTarget, p => { return _.get(p, "amount", 0); }),
					_.sum(popActual));

				if (_.get(popActual, "colonizer", 0) < _.get(popTarget, ["colonizer", "amount"], 0)) {
					Memory["hive"]["spawn_requests"].push({
						room: rmColony, listRooms: null,
						priority: 21,
						level: _.get(popTarget, ["colonizer", "level"], 6),
						scale: _.get(popTarget, ["colonizer", "scale"], false),
						body: _.get(popTarget, ["colonizer", "body"], "reserver_at"),
						name: null, args: { role: "colonizer", room: rmTarget, colony: rmColony }
					});
				}
			},

			runCreeps: function (rmColony, rmTarget, listCreeps, listRoute) {
				_.each(listCreeps, creep => {
					_.set(creep, ["memory", "list_route"], listRoute);

					if (creep.memory.role == "colonizer") {
						Creep_Roles.Colonizer(creep);
					}
				});
			}
		};

		Colonization.Run(rmColony, rmTarget);
	},

	Combat: function (memory_id) {
		let Combat = {
			Run: function (combat_id) {
				if (_.get(Memory, ["sites", "combat", combat_id, "tactic"]) == null)
					return;

				let rmColony = _.get(Memory, ["sites", "combat", combat_id, "colony"]);

				if (isPulse_Spawn()) {
					Stats_CPU.Start(rmColony, `Combat-${combat_id}-runPopulation`);
					this.setPopulation(combat_id);
					this.runPopulation(combat_id);
					Stats_CPU.End(rmColony, `Combat-${combat_id}-runPopulation`);
				}

				Stats_CPU.Start(rmColony, `Combat-${combat_id}-runTactic`);
				this.runTactic(combat_id);
				Stats_CPU.End(rmColony, `Combat-${combat_id}-runTactic`);
			},

			setPopulation: function (combat_id) {
				let combat = _.get(Memory, ["sites", "combat", combat_id]);
				let tacticType = _.get(combat, ["tactic", "type"]);
				let rmColony = _.get(combat, ["colony"]);
				let rmLevel = Game["rooms"][rmColony].getLevel();
				let army = _.get(combat, ["tactic", "army"]);


				if (_.get(combat, ["tactic", "spawn_repeat"]) == null)
					_.set(Memory, ["sites", "combat", combat_id, "tactic", "spawn_repeat"], true);

				if (army != null)
					return;

				switch (tacticType) {
					default:
					case "waves": army = _.cloneDeep(Population_Combat__Waves); break;
					case "trickle": army = _.cloneDeep(Population_Combat__Trickle); break;
					case "occupy": army = _.cloneDeep(Population_Combat__Occupy); break;
					case "dismantle": army = _.cloneDeep(Population_Combat__Dismantle); break;
					case "tower_drain": army = _.cloneDeep(Population_Combat__Tower_Drain); break;
					case "controller": army = _.cloneDeep(Population_Combat__Controller); break;
				}

				for (let each in army) {
					if (_.get(army[each], "level") == null)
						_.set(army[each], "level", rmLevel);
				}

				_.set(Memory, ["sites", "combat", combat_id, "tactic", "army"], _.cloneDeep(army));
			},

			runPopulation: function (combat_id) {
				if (_.get(Memory, ["sites", "combat", combat_id, "state_combat"]) == "spawning") {
					this.runPopulation_SpawnRequests(combat_id);
				}
			},

			runPopulation_SpawnRequests: function (combat_id) {
				if (!isPulse_Spawn())
					return;

				let combat = _.get(Memory, ["sites", "combat", combat_id]);
				let listArmy = _.get(combat, ["tactic", "army"]);
				let lengthArmy = _.sum(listArmy, s => { return s.amount; });
				let rmColony = _.get(combat, ["colony"]);
				let rmLevel = Game["rooms"][rmColony].getLevel();
				let listSpawnRooms = _.get(combat, ["list_spawns"]);
				let listCreeps = _.filter(Game.creeps, c => { return _.get(c, ["memory", "combat_id"]) == combat_id; });

				for (let role in listArmy) {
					let listRole = _.filter(listCreeps, c => { return _.get(c, ["memory", "role"]) == role; });
					if (listRole.length < _.get(listArmy, [role, "amount"])) {
						Memory["hive"]["spawn_requests"].push({
							room: rmColony,
							listRooms: listSpawnRooms,
							priority: 20,
							level: _.get(listArmy, [role, "level"], rmLevel),
							scale: false,
							body: _.get(listArmy, [role, "body"], role),
							name: null,
							args: {
								role: role, combat_id: combat_id,
								room: _.get(combat, "target_room"), colony: rmColony,
								list_route: _.get(combat, "list_route")
							}
						});
					}
				}
			},

			runTactic: function (combat_id) {
				let combat = _.get(Memory, ["sites", "combat", combat_id]);
				let state_combat = _.get(combat, "state_combat");

				if (state_combat == null)
					_.set(Memory, ["sites", "combat", combat_id, "state_combat"], "spawning");

				switch (_.get(combat, ["tactic", "type"])) {
					case "waves": this.runTactic_Waves(combat_id, combat); break;
					case "trickle": this.runTactic_Trickle(combat_id, combat); break;
					// Occupy tactic same as Trickle tactic using different army population.
					case "occupy": this.runTactic_Trickle(combat_id, combat); break;
					// Dismantle tactic same as Trickle tactic using different army population.
					case "dismantle": this.runTactic_Trickle(combat_id, combat); break;
					case "tower_drain": this.runTactic_Tower_Drain(combat_id, combat); break;
					case "controller": this.runTactic_Controller(combat_id, combat); break;
				}
			},

			runTactic_Waves: function (combat_id, combat) {
				let tactic = _.get(combat, "tactic");
				let state_combat = _.get(combat, "state_combat");
				let listCreeps = _.filter(Game.creeps, c => { return _.get(c, ["memory", "combat_id"]) == combat_id; });
				let army = _.get(combat, ["tactic", "army"]);
				let army_amount = _.sum(army, s => { return s.amount; });

				switch (state_combat) {
					case "spawning":
					case "rallying":
						let rally_range = 5;
						let rally_pos = _.get(tactic, "rally_pos");

						_.each(listCreeps, creep => {
							if (_.get(combat, "use_boosts") && this.creepBoost(creep, combat))
								return;
							this.creepRally(creep, rally_pos, rally_range);
						});

						if (this.checkSpawnComplete_toRally(combat_id, combat, listCreeps, army_amount))
							return;
						if (this.checkRallyComplete_toAttack(combat_id, combat, listCreeps, rally_pos, rally_range, army_amount))
							return;
						return;

					case "attacking":
						// Run the creeps' base roles!
						this.creepRoles(listCreeps, tactic);

						// Evaluate victory or reset conditions
						if (Game.time % 10 == 0) {
							if (this.evaluateDefeat_CreepsWiped(combat_id, combat, listCreeps))
								return;
							else if (listCreeps.length == 0 && _.get(tactic, "spawn_repeat")) {
								_.set(Memory, ["sites", "combat", combat_id, "state_combat"], "spawning");
								return;
							}

							let target_room = Game["rooms"][_.get(combat, "target_room")];
							if (target_room != null) {
								let room_structures = target_room.find(FIND_STRUCTURES);
								if (this.evaluateVictory_TargetStructures(combat_id, combat, room_structures))
									return;
								if (this.evaluateVictory_TargetList(combat_id, combat, room_structures))
									return;
							}
						}
						return;

					case "complete":
						if (_.get(combat, ["tactic", "to_occupy"]))
							this.setOccupation(combat_id, combat, tactic);
						delete Memory["sites"]["combat"][combat_id];
						console.log(`<font color=\"#FFA100\">[Combat: ${combat_id}]</font> Combat completed, removing from memory.`);
						return;
				}
			},

			runTactic_Trickle: function (combat_id, combat) {
				let tactic = _.get(combat, "tactic");
				let state_combat = _.get(combat, "state_combat");
				let listCreeps = _.filter(Game.creeps, c => { return _.get(c, ["memory", "combat_id"]) == combat_id; });

				// Dismantle is a Trickle tactic with dismantler population targeting structures.
				if (_.get(tactic, "type") == "dismantle") {
					_.set(tactic, "target_creeps", false);
					_.set(tactic, "target_structures", true);
					_.set(tactic, "to_occupy", false);
				}

				switch (state_combat) {
					// Trickle tactic is a constant state of spawning and moving to trickle into destination room
					case "spawning":
						_.each(listCreeps, creep => {
							if (_.get(combat, "use_boosts") && this.creepBoost(creep, combat))
								return;
						});

						// Run the creeps' base roles!
						this.creepRoles(listCreeps, tactic);

						// Evaluate victory; occupations are never-ending
						if (Game.time % 10 == 0 && _.get(combat, ["tactic", "type"]) != "occupy") {
							let target_room = Game["rooms"][_.get(combat, "target_room")];
							if (target_room != null) {
								let room_structures = target_room.find(FIND_STRUCTURES);
								if (this.evaluateVictory_TargetStructures(combat_id, combat, room_structures))
									return;
								if (this.evaluateVictory_TargetList(combat_id, combat, room_structures))
									return;
							}
						}
						return;

					case "complete":
						if (_.get(combat, ["tactic", "to_occupy"], false))
							this.setOccupation(combat_id, combat, tactic);
						delete Memory["sites"]["combat"][combat_id];
						console.log(`<font color=\"#FFA100\">[Combat: ${combat_id}]</font> Combat completed, removing from memory.`);
						return;
				}
			},

			runTactic_Tower_Drain: function (combat_id, combat) {
				let tactic = _.get(combat, "tactic");
				let state_combat = _.get(combat, "state_combat");
				let listCreeps = _.filter(Game.creeps, c => { return _.get(c, ["memory", "combat_id"]) == combat_id; });
				let army = _.get(combat, ["tactic", "army"]);
				let army_amount = _.sum(army, s => { return s.amount; });
				let rally_range = 3;
				let rally_pos = _.get(tactic, "rally_pos");
				let drain_pos = _.get(tactic, "drain_pos");

				switch (state_combat) {
					case "spawning":
					case "rallying":
						_.each(listCreeps, creep => {
							if (_.get(combat, "use_boosts") && this.creepBoost(creep, combat))
								return;
							this.creepRally(creep, rally_pos, rally_range);
						});

						if (this.checkSpawnComplete_toRally(combat_id, combat, listCreeps, army_amount))
							return;
						if (this.checkRallyComplete_toAttack(combat_id, combat, listCreeps, rally_pos, rally_range, army_amount))
							return;
						return;

					case "attacking":
						// Replenish any creeps that die
						this.runPopulation_SpawnRequests(combat_id);

						// Run the creeps' roles for griefing the room and draining the towers' energy
						let pos_rally = new RoomPosition(rally_pos.x, rally_pos.y, rally_pos.roomName);
						let pos_drain = new RoomPosition(drain_pos.x, drain_pos.y, drain_pos.roomName);

						_.each(listCreeps, creep => {
							if (creep.memory.role == "tank" || creep.memory.role == "dismantler") {
								if (creep.hits < (creep.hitsMax * 0.4)
									|| (creep.memory.role == "dismantler" && !creep.hasPart("work")))
									_.set(creep, ["memory", "combat_state"], "rally");
								else if (creep.hits == creep.hitsMax)
									_.set(creep, ["memory", "combat_state"], "drain");

								if (_.get(creep, ["memory", "combat_state"]) == null)
									_.set(creep, ["memory", "combat_state"], "rally");

								if (_.get(creep, ["memory", "combat_state"]) == "rally")
									creep.moveTo(pos_rally, { reusePath: 0 });
								else if (_.get(creep, ["memory", "combat_state"]) == "drain") {
									if (creep.memory.role == "dismantler")
										Creep_Roles.Dismantler(creep, true, _.get(tactic, "target_list"));
									creep.moveTo(pos_drain, { reusePath: 0 });
								}
							} else if (creep.memory.role == "healer") {
								let wounded = _.head(_.filter(listCreeps,
									c => {
										return c.hits < c.hitsMax && c.pos.roomName == pos_rally.roomName
											&& c.pos.getRangeTo(pos_rally) <= rally_range;
									}));
								if (wounded != null) {
									if (creep.heal(wounded) == ERR_NOT_IN_RANGE) {
										creep.rangedHeal(wounded);
										creep.moveTo(wounded, { reusePath: 0 });
									}
								} else {
									if (creep.hits < creep.hitsMax)
										creep.heal(creep);
									this.creepRally(creep, rally_pos, rally_range);
								}
							}
						});

						// Evaluate victory or reset conditions
						if (Game.time % 10 == 0) {
							if (this.evaluateDefeat_CreepsWiped(combat_id, combat, listCreeps))
								return;
							else if (listCreeps.length == 0 && _.get(tactic, "spawn_repeat")) {
								_.set(Memory, ["sites", "combat", combat_id, "state_combat"], "spawning");
								return;
							}

							let target_room = Game["rooms"][_.get(combat, "target_room")];
							if (target_room != null && _.filter(target_room.find(FIND_STRUCTURES), s => { return s.structureType == "tower"; }).length == 0) {
								_.set(Memory, ["sites", "combat", combat_id, "state_combat"], "complete");
								console.log(`<font color=\"#FFA100\">[Combat: ${combat_id}]</font> No enemy towers detected! Completing tower drain combat.`);
								return;
							}
						}
						return;

					case "complete":
						delete Memory["sites"]["combat"][combat_id];
						console.log(`<font color=\"#FFA100\">[Combat: ${combat_id}]</font> Combat completed, removing from memory.`);
						return;
				}
			},

			runTactic_Controller: function (combat_id, combat) {
				let tactic = _.get(combat, "tactic");
				let state_combat = _.get(combat, "state_combat");
				let listCreeps = _.filter(Game.creeps, c => { return _.get(c, ["memory", "combat_id"]) == combat_id; });
				let target_room = Game["rooms"][_.get(combat, "target_room")];

				switch (state_combat) {
					// Controller tactic is a constant state of spawning and moving to trickle into destination room
					case "spawning":
						_.each(listCreeps, creep => {
							if (_.get(combat, "use_boosts") && this.creepBoost(creep, combat))
								return;
						});

						if (target_room == null || target_room.controller.upgradeBlocked > 200)
							_.set(Memory, ["sites", "combat", combat_id, "tactic", "army"],
								{ scout: { amount: 1, level: 1 } });
						else
							_.set(Memory, ["sites", "combat", combat_id, "tactic", "army"],
								{ reserver: { amount: 1, level: 3, body: "reserver_at" } });

						// Run the creeps' base roles!
						this.creepRoles(listCreeps, tactic);

						// Evaluate victory
						if (Game.time % 10 == 0) {
							if (target_room != null) {
								if (this.evaluateVictory_Controller(combat_id, combat))
									return;
							}
						}
						return;

					case "complete":
						if (_.get(combat, ["tactic", "to_occupy"]))
							this.setOccupation(combat_id, combat, tactic);
						delete Memory["sites"]["combat"][combat_id];
						console.log(`<font color=\"#FFA100\">[Combat: ${combat_id}]</font> Combat completed, removing from memory.`);
						return;
				}
			},

			checkSpawnComplete_toRally: function (combat_id, combat, listCreeps, army_amount) {
				if (_.get(combat, "state_combat") == "spawning" && army_amount > 0 && listCreeps.length == army_amount) {
					_.set(Memory, ["sites", "combat", combat_id, "state_combat"], "rallying");
					return true;
				}
				return false;
			},

			checkRallyComplete_toAttack: function (combat_id, combat, listCreeps, rally_pos, rally_range, army_amount) {
				let state_combat = _.get(combat, "state_combat");
				let posRally = new RoomPosition(rally_pos.x, rally_pos.y, rally_pos.roomName);
				let creeps_rallied = _.filter(listCreeps, c => c.room.name == rally_pos.roomName && posRally.inRangeTo(c.pos, rally_range));
				if (state_combat == "rallying" && listCreeps.length > 0 && Game.time % 5 == 0) {
					if (creeps_rallied.length == listCreeps.length) {
						_.set(Memory, ["sites", "combat", combat_id, "state_combat"], "attacking");
						console.log(`<font color=\"#FFA100\">[Combat: ${combat_id}]</font> All creeps at rally point. Launching attack!`);
						return true;
					}
				} else if (Game.time % 50 == 0) {
					console.log(`<font color=\"#FFA100\">[Combat: ${combat_id}]</font> Spawning and rallying troops, `
						+ `${creeps_rallied.length} of ${army_amount} at rally point.`);
				}
				return false;
			},

			creepBoost: function (creep, combat) {
				let rmColony = _.get(combat, ["colony"]);
				if (creep.room.name == rmColony) {
					if (creep.memory.boost == null && !creep.isBoosted()) {
						if (Creep_Roles_Combat.seekBoost(creep))
							return true;
					} else if (creep.memory.boost != null && !creep.isBoosted()
						&& _.get(creep.memory, ["boost", "pos", "x"])
						&& _.get(creep.memory, ["boost", "pos", "y"])
						&& _.get(creep.memory, ["boost", "pos", "roomName"])) {
						creep.travel(new RoomPosition(creep.memory.boost.pos.x, creep.memory.boost.pos.y, creep.memory.boost.pos.roomName));
						return true;
					}
				}
				return false;
			},

			creepRally: function (creep, rally_pos, rallyRange) {
				let posRally = new RoomPosition(rally_pos.x, rally_pos.y, rally_pos.roomName);

				if (creep.room.name != posRally.roomName)
					creep.travelToRoom(posRally.roomName, true);
				else if (creep.room.name == posRally.roomName) {
					if (!posRally.inRangeTo(creep.pos, rallyRange)) {
						creep.moveTo(posRally);
					} else if (creep.hasPart("attack") || creep.hasPart("ranged_attack")) {
						let hostile = _.head(creep.pos.findInRange(FIND_HOSTILE_CREEPS, 3,
							{ filter: (c) => { return c.isHostile(); } }));
						if (hostile != null) {
							creep.rangedAttack(hostile);
							creep.attack(hostile);
						}
					} else if (creep.hasPart("heal")) {
						let wounded = _.head(creep.pos.findInRange(FIND_MY_CREEPS, 3,
							{ filter: (c) => { return c.hits < c.hitsMax; } }));
						if (wounded != null) {
							if (creep.pos.getRangeTo(wounded) <= 1)
								creep.heal(wounded);
							else
								creep.heal(wounded);
						}
					}

					if (Game.time % 15 == 0 && posRally.inRangeTo(creep.pos, rallyRange)) {
						creep.moveTo(posRally);
					}
				}
			},

			creepRoles: function (listCreeps, tactic) {
				let target_creeps = _.get(tactic, "target_creeps");
				let target_structures = _.get(tactic, "target_structures");
				let target_list = _.get(tactic, "target_list");

				_.each(listCreeps, creep => {
					if (creep.memory.role == "scout") {
						Creep_Roles.Scout(creep);
					} else if (creep.memory.role == "soldier"
						|| creep.memory.role == "brawler"
						|| creep.memory.role == "paladin") {
						Creep_Roles.Soldier(creep, target_structures, target_creeps, target_list);
					} else if (creep.memory.role == "archer") {
						Creep_Roles.Archer(creep, target_structures, target_creeps, target_list);
					} else if (creep.memory.role == "dismantler") {
						Creep_Roles.Dismantler(creep, target_structures, target_list);
					} else if (creep.memory.role == "healer") {
						Creep_Roles.Healer(creep, true);
					} else if (creep.memory.role == "reserver") {
						Creep_Roles.Reserver(creep);
					}
				});
			},

			evaluateDefeat_CreepsWiped: function (combat_id, combat, listCreeps) {
				if (listCreeps.length == 0 && _.get(combat, ["tactic", "spawn_repeat"]) != true) {
					_.set(Memory, ["sites", "combat", combat_id, "state_combat"], "complete");
					console.log(`<font color=\"#FFA100\">[Combat: ${combat_id}]</font> Defeat detected by all friendly creeps killed! Stopping attack.`);
					return true;
				}
				return false;
			},

			evaluateVictory_TargetStructures: function (combat_id, combat, room_structures) {
				if (_.get(Game, ["rooms", _.get(combat, "target_room")]) != null) {
					let attack_structures = _.filter(room_structures,
						s => {
							return s.hits != null && s.hits > 0
								&& ((s.owner == null && s.structureType != "container")
									|| (s.owner != null && !s.my && s.owner != "Source Keeper" && s.structureType != "controller"
										&& _.get(Memory, ["hive", "allies"]).indexOf(s.owner.username) < 0));
						});
					if (_.get(combat, ["tactic", "target_structures"]) == true && attack_structures.length == 0) {
						_.set(Memory, ["sites", "combat", combat_id, "state_combat"], "complete");
						console.log(`<font color=\"#FFA100\">[Combat: ${combat_id}]</font> Victory detected by destroying all structures! Stopping attack.`);
						return true;
					}
				}
				return false;
			},

			evaluateVictory_TargetList: function (combat_id, combat, room_structures) {
				let target_list = _.get(combat, ["tactic", "target_list"]);

				if (target_list != null && _.get(combat, ["tactic", "target_structures"]) != true
					&& _.get(Game, ["rooms", _.get(combat, "target_room")]) != null) {
					let targets_remaining = _.filter(room_structures, s => {
						return target_list.indexOf(s.id) >= 0;
					});

					if (targets_remaining.length == 0) {
						_.set(Memory, ["sites", "combat", combat_id, "state_combat"], "complete");
						console.log(`<font color=\"#FFA100\">[Combat: ${combat_id}]</font> Victory detected by destroying all targets on target list! Stopping attack.`);
						return true;
					}
				}
				return false;
			},

			evaluateVictory_Controller: function (combat_id, combat) {
				if (_.get(Game, ["rooms", _.get(combat, "target_room")]) != null
					&& _.get(Game, ["rooms", _.get(combat, "target_room"), "controller", "owner"]) == null) {
					_.set(Memory, ["sites", "combat", combat_id, "state_combat"], "complete");
					return true;
				}
				return false;
			},

			setOccupation: function (combat_id, combat, tactic) {
				console.log(`<font color=\"#FFA100\">[Combat: ${combat_id}]</font> `
					+ `Setting occupation request in Memory; combat_id ${combat_id}-occupy.`);
				_.set(Memory, ["sites", "combat", `${combat_id}-occupy`],
					{
						colony: combat.colony, target_room: combat.target_room,
						list_spawns: combat.list_spawns, list_route: combat.list_route,
						tactic: {
							type: "occupy", target_creeps: tactic.target_creeps, target_structures: tactic.target_structures,
							target_list: tactic.target_list
						}
					});
			}
		};

		Combat.Run(memory_id);
	}

};



/* ***********************************************************
 *	[sec05a] DEFINITIONS: HIVE CONTROL
 * *********************************************************** */

let Control = {

	refillBucket: function () {
		if (Game.cpu.bucket >= 10000 && _.get(Memory, ["hive", "pause", "bucket"], false)) {
			_.set(Memory, ["hive", "pause", "bucket"], false);
			console.log(`<font color=\"#D3FFA3\">[Console]</font> Bucket full, resuming main.js.`);
		}

		return _.get(Memory, ["hive", "pause", "bucket"], false);
	},

	setPulse: function (key, minTicks, maxTicks) {
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

	moveReusePath: function () {
		let minTicks = 15, maxTicks = 60;
		let range = maxTicks - minTicks;
		return minTicks + Math.floor((1 - (Game.cpu.bucket / 10000)) * range);
	},

	moveRequestPath: function (creep) {
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

	moveMaxOps: function () {
		let minOps = 2000, maxOps = 3000;
		let range = maxOps - minOps;
		return minOps + Math.floor((1 - (Game.cpu.bucket / 10000)) * range);
	},

	clearDeadMemory: function () {
		if (!isPulse_Short())
			return;

		if (_.has(Memory, "creeps"))
			_.each(Object.keys(Memory.creeps), c => {
				if (!_.has(Game, ["creeps", c])) {
					delete Memory.creeps[c];
				}
			});

		if (_.has(Memory, "rooms"))
			_.each(Object.keys(Memory.rooms), r => {
				if (!_.has(Game, ["rooms", r]))
					delete Memory.rooms[r];
			});
	},

	initMemory: function () {
		Stats_CPU.Start("Hive", "initMemory");

		// Use odd intervals or odd numbers to prevent stacking multiple pulses on one tick
		this.setPulse("defense", 4, 8);
		this.setPulse("short", 9, 60);
		this.setPulse("mid", 19, 90);
		this.setPulse("long", 49, 200);
		this.setPulse("spawn", 14, 30);
		this.setPulse("lab", 1999, 2000);
		this.setPulse("blueprint", 99, 500);

		if (_.get(Memory, ["rooms"]) == null) _.set(Memory, ["rooms"], new Object());
		if (_.get(Memory, ["hive", "allies"]) == null) _.set(Memory, ["hive", "allies"], new Array());
		if (_.get(Memory, ["hive", "pulses"]) == null) _.set(Memory, ["hive", "pulses"], new Object());
		if (_.get(Memory, ["sites", "mining"]) == null) _.set(Memory, ["sites", "mining"], new Object());
		if (_.get(Memory, ["sites", "colonization"]) == null) _.set(Memory, ["sites", "colonization"], new Object());
		if (_.get(Memory, ["sites", "combat"]) == null) _.set(Memory, ["sites", "combat"], new Object());

		for (let r in Game["rooms"])
			_.set(Memory, ["rooms", r, "population"], null);
		_.set(Memory, ["hive", "spawn_requests"], new Array());

		Console.Init();

		Stats_CPU.End("Hive", "initMemory");
	},

	initVisuals: function () {
		Stats_Visual.Init();
	},

	endMemory: function () {
		if (_.has(Memory, ["hive", "pulses", "reset_links"]))
			delete Memory["hive"]["pulses"]["reset_links"];
	},


	runColonies: function () {
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

	runColonizations: function () {
		_.each(_.get(Memory, ["sites", "colonization"]), req => {
			Sites.Colonization(_.get(req, "from"), _.get(req, "target"));
		});
	},

	runCombat: function () {
		for (let memory_id in _.get(Memory, ["sites", "combat"]))
			Sites.Combat(memory_id);
	},

	populationTally: function (rmName, popTarget, popActual) {
		// Tallies the target population for a colony, to be used for spawn load balancing
		_.set(Memory, ["rooms", rmName, "population", "target"], _.get(Memory, ["rooms", rmName, "population", "target"], 0) + popTarget);
		_.set(Memory, ["rooms", rmName, "population", "actual"], _.get(Memory, ["rooms", rmName, "population", "actual"], 0) + popActual);
	},

	processSpawnRequests: function () {
		/*  lvlPriority is an integer rating priority, e.g.:
				01 - 10: Defense
				11 - 20: Mining, Industry
				21 - 30: Colony

				00: Active Defense

				11: Mining (critical; miner, burrower)
				14: Mining (carriers)
				14-16: Industry (can bring in critical energy!)

				20: Passive Defense
				21: Colonization
				22: Colony (critical)
				25: Colony (regular)


			tgtLevel is the target level of the creep's body (per body.js)
			listRooms is an array of room names that would be acceptable to spawn the request (user defined)
		*/

		if (!isPulse_Spawn())
			return;

		Stats_CPU.Start("Hive", "processSpawnRequests");

		let requests_group = _.groupBy(_.get(Memory, ["hive", "spawn_requests"]),
			r => { return _.get(r, "room"); });
		let listRequests = new Array();

		_.each(requests_group, r => {
			listRequests.push(_.head(_.sortBy(r, req => { return _.get(req, "priority"); })))
		});

		let listSpawns = _.filter(Object.keys(Game["spawns"]), s => { return Game["spawns"][s].spawning == null; });

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

							let body = Creep_Body.getBody(request.body, level);
							let name = request.name != null ? request.name
								: request.args["role"].substring(0, 4)
								+ (request.args["subrole"] == null ? "" : `-${request.args["subrole"].substring(0, 2)}`)
								+ ":xxxx".replace(/[xy]/g, (c) => {
									let r = Math.random() * 16 | 0, v = c == "x" ? r : (r & 0x3 | 0x8);
									return v.toString(16);
								});
							let storage = _.get(spawn.room, "storage");
							let energies = storage == null ? null : _.sortBy(_.filter(spawn.room.find(FIND_MY_STRUCTURES),
								s => { return s.isActive() && (s.structureType == "extension" || s.structureType == "spawn"); }),
								s => { return s.pos.getRangeTo(storage); });
							let result = energies == null
								? spawn.spawnCreep(body, name, { memory: request.args })
								: spawn.spawnCreep(body, name, { memory: request.args, energyStructures: energies });

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

		Stats_CPU.End("Hive", "processSpawnRequests");
	},

	processSpawnRenewing: function () {
		Stats_CPU.Start("Hive", "processSpawnRenewing");

		let listSpawns = Object.keys(Game["spawns"]).filter((a) => { return Game.spawns[a].spawning == null && Game.spawns[a].room.energyAvailable > 300; });

		for (let s in listSpawns) {
			let spawn = Game["spawns"][listSpawns[s]];
			let creeps = _.filter(spawn.pos.findInRange(FIND_MY_CREEPS, 1),
				c => { return !c.isBoosted() && _.get(c, ["memory", "spawn_renew"], true); });

			for (let c in creeps) {
				if (spawn.renewCreep(creeps[c]) == OK)
					break;
			}
		}

		Stats_CPU.End("Hive", "processSpawnRenewing");
	},


	sellExcessResources: function () {
		if (!isPulse_Mid())
			return;

		Stats_CPU.Start("Hive", "sellExcessResources");

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
					o => { return -o.price; }));

				if (order != null) {
					if (_.get(Memory, ["resources", "terminal_orders", `overflow_${res}`]) != null)
						console.log(`<font color=\"#F7FF00\">[Hive]</font> Selling overflow resource to market: ${excess} of ${res} from ${room}`);
					_.set(Memory, ["resources", "terminal_orders", `overflow_${res}`], { market_id: order.id, amount: excess, from: room, priority: 4 });

				}
			}
		}

		Stats_CPU.End("Hive", "sellExcessResources");
	},

	moveExcessEnergy: function () {
		if (!isPulse_Mid())
			return;

		Stats_CPU.Start("Hive", "moveExcessEnergy");

		limit = _.get(Memory, ["resources", "to_overflow"]);
		if (limit == null)
			return;

		let energy = new Object();

		_.forEach(_.filter(Game.rooms,
			r => { return r.terminal != null && r.terminal.my; }),
			r => { energy[r.name] = _.get(r, ["storage", "store", "energy"], 0) + _.get(r, ["terminal", "store", "energy"], 0); });

		let tgtRoom = _.head(_.sortBy(_.filter(Object.keys(energy),
			n => { return energy[n] < (limit * 0.95); }),
			n => { return energy[n]; }));

		if (tgtRoom != null) {
			_.forEach(_.filter(Object.keys(energy),
				r => { return !_.has(Memory, ["resources", "terminal_orders", `overflow_energy_${r}`]) && energy[r] - limit > 100; }),
				r => {	// Terminal transfers: minimum quantity of 100.
					_.set(Memory, ["resources", "terminal_orders", `overflow_energy_${r}`], { room: tgtRoom, resource: "energy", amount: energy[r] - limit, from: r, priority: 2 });
					console.log(`<font color=\"#F7FF00\">[Hive]</font> Creating overflow energy transfer: ${energy[r] - limit}, ${r} -> ${tgtRoom}`);
				});
		}

		Stats_CPU.End("Hive", "moveExcessEnergy");
	},


	initLabs: function () {
		if (!isPulse_Lab())
			return;

		// Reset stockpiles...
		_.each(Memory["rooms"], r => { _.set(r, ["stockpile"], new Object()); });

		// Reset automated terminal orders
		_.each(_.keys(_.get(Memory, ["resources", "terminal_orders"])), o => {
			if (_.get(Memory, ["resources", "terminal_orders", o, "automated"]))
				delete Memory["resources"]["terminal_orders"][o];
		});

		// Reset reagent targets, prevents accidental reagent pileup
		_.each(_.keys(_.get(Memory, ["resources", "labs", "targets"])), t => {
			if (_.get(Memory, ["resources", "labs", "targets", t, "is_reagent"]))
				delete Memory["resources"]["labs"]["targets"][t];
		});

		// Create new reagent targets
		_.each(_.get(Memory, ["resources", "labs", "targets"]), t => {
			if (_.get(t, "amount") < 0) {
				this.createReagentTargets(t);
				return;
			}

			let amount = 0;
			_.each(Game.rooms, r => {
				if (r.controller != null && r.controller.my && (r.storage || r.terminal))
					amount += r.store(_.get(t, "mineral"));
			});

			if (amount < _.get(t, "amount")) {
				this.createReagentTargets(t);
				return;
			}
		});
	},

	createReagentTargets: function (target) {
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



/* ***********************************************************
 *	[sec06a] DEFINITIONS: BLUEPRINT
 * *********************************************************** */

let Blueprint = {

	Init: function () {
		// Process special blueprint requests (from console) immediately, effectively pausing cycles/pulses by 1 tick.
		if (_.get(Memory, ["hive", "pulses", "blueprint", "request"]) != null) {
			let room = Game.rooms[_.get(Memory, ["hive", "pulses", "blueprint", "request"])];

			if (room == null) {
				console.log(`<font color=\"#6065FF\">[Blueprint]</font> Blueprint() request for ${_.get(Memory, ["hive", "pulses", "blueprint", "request"])} failed; unable to find in Game.rooms.`);
			} else {
				Stats_CPU.Start("Hive", "Blueprint-Run");
				console.log(`<font color=\"#6065FF\">[Blueprint]</font> Processing requested Blueprint() for ${room.name}`);
				this.Run(room);
				Stats_CPU.End("Hive", "Blueprint-Run");
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
			_.set(Memory, ["hive", "pulses", "blueprint", "cycle"], { room_iter: 0, room_list: rooms });
		}

		let room_list = _.get(Memory, ["hive", "pulses", "blueprint", "cycle", "room_list"]);
		let room_iter = _.get(Memory, ["hive", "pulses", "blueprint", "cycle", "room_iter"]);

		Stats_CPU.Start("Hive", "Blueprint-Run");
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

		Stats_CPU.End("Hive", "Blueprint-Run");
	},

	Run: function (room) {
		if (room.controller == null && !room.controller.my)
			return;

		let sites_per_room = 10;
		let level = room.controller.level;
		let origin = _.get(Memory, ["rooms", room.name, "layout", "origin"]);
		let layout = _.get(Memory, ["rooms", room.name, "layout", "name"]);
		let blocked_areas = _.get(Memory, ["rooms", room.name, "layout", "blocked_areas"]);

		let sources = room.findSources();
		let mineral = _.head(room.find(FIND_MINERALS));
		let sites = room.find(FIND_MY_CONSTRUCTION_SITES).length;
		let all_structures = room.find(FIND_STRUCTURES);
		let structures = _.filter(all_structures, s => { return s.my; });
		let ramparts = _.filter(structures, s => { return s.structureType == "rampart" });

		if (origin == null || sites >= sites_per_room)
			return;

		switch (layout) {
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
			case "comp_vert":
				layout = Blueprint__Compact_Vertical;
				break;
			case "comp_vert_w":
				layout = Blueprint__Compact_Vertical__Walled;
				break;
		}

		// Block areas around sources, minerals, and the room controller; prevents cycle of building and destroying.
		if (blocked_areas == null) Memory["rooms"][room.name]["layout"]["blocked_areas"] = [];

		_.each(sources, s => {
			if (_.filter(blocked_areas, a => {
				return _.get(a, ["start", "x"]) == s.pos.x - 1 && _.get(a, ["start", "y"]) == s.pos.y - 1
					&& _.get(a, ["end", "x"]) == s.pos.x + 1 && _.get(a, ["end", "y"]) == s.pos.y + 1;
			}).length == 0) {
				Memory["rooms"][room.name]["layout"]["blocked_areas"].push(
					{ start: { x: (s.pos.x - 1), y: (s.pos.y - 1) }, end: { x: (s.pos.x + 1), y: (s.pos.y + 1) } });
				console.log(`<font color=\"#6065FF\">[Blueprint]</font> Blocking area in ${room.name} for source around (${s.pos.x}, ${s.pos.y}).`);
			}
		});

		if (mineral != null && _.filter(blocked_areas, a => {
			return _.get(a, ["start", "x"]) == mineral.pos.x - 1 && _.get(a, ["start", "y"]) == mineral.pos.y - 1
				&& _.get(a, ["end", "x"]) == mineral.pos.x + 1 && _.get(a, ["end", "y"]) == mineral.pos.y + 1;
		}).length == 0) {
			Memory["rooms"][room.name]["layout"]["blocked_areas"].push(
				{ start: { x: (mineral.pos.x - 1), y: (mineral.pos.y - 1) }, end: { x: (mineral.pos.x + 1), y: (mineral.pos.y + 1) } });
			console.log(`<font color=\"#6065FF\">[Blueprint]</font> Blocking area in ${room.name} for mineral around (${mineral.pos.x}, ${mineral.pos.y}).`);
		}

		if (_.filter(blocked_areas, a => {
			return _.get(a, ["start", "x"]) == room.controller.pos.x - 1 && _.get(a, ["start", "y"]) == room.controller.pos.y - 1
				&& _.get(a, ["end", "x"]) == room.controller.pos.x + 1 && _.get(a, ["end", "y"]) == room.controller.pos.y + 1;
		}).length == 0) {
			Memory["rooms"][room.name]["layout"]["blocked_areas"].push(
				{ start: { x: (room.controller.pos.x - 1), y: (room.controller.pos.y - 1) }, end: { x: (room.controller.pos.x + 1), y: (room.controller.pos.y + 1) } });
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
			if (_.get(Memory, ["rooms", room.name, "layout", "place_defenses"], true) == true) {
				sites = Blueprint.iterateStructure(room, sites, structures, layout, origin, sites_per_room, blocked_areas, "rampart");
				sites = Blueprint.iterateStructure(room, sites, all_structures, layout, origin, sites_per_room, blocked_areas, "constructedWall");
			}
		}

		// Ordered by priority; lower priority than defensive structures (in case high RCL rebuilding after attack)
		sites = Blueprint.iterateStructure(room, sites, structures, layout, origin, sites_per_room, blocked_areas, "storage");
		if (sites < sites_per_room && this.atMaxStructureCount(room, structures, layout, "extractor"))
			sites = Blueprint.iterateStructure(room, sites, structures, layout, origin, sites_per_room, blocked_areas, "terminal");
		if (sites < sites_per_room && this.atMaxStructureCount(room, structures, layout, "terminal")
			&& this.atMaxStructureCount(room, structures, layout, "nuker"))
			sites = Blueprint.iterateStructure(room, sites, structures, layout, origin, sites_per_room, blocked_areas, "lab");
		if (sites < sites_per_room && this.atMaxStructureCount(room, structures, layout, "lab"))
			sites = Blueprint.iterateStructure(room, sites, structures, layout, origin, sites_per_room, blocked_areas, "factory");

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

	atMaxStructureCount: function (room, structures, layout, structureType) {
		let count = _.filter(structures, s => { return s.structureType == structureType; }).length;
		return count == CONTROLLER_STRUCTURES[structureType][room.controller.level]
			|| (layout[structureType] == null ? false : count == layout[structureType].length);
	},

	iterateStructure: function (room, sites, structures, layout, origin, sites_per_room, blocked_areas, structureType) {
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

			if (structureType == STRUCTURE_ROAD) {
				let lookTerrain = room.lookForAt("terrain", x, y);
				if (lookTerrain == "wall")
					continue;
			}

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

	createRoad: function (room, sites, sites_per_room, from, to) {
		if (from == null || to == null)
			return;

		let road = 0;
		let from_pos = new RoomPosition(from.x, from.y, room.name);
		let to_pos = new RoomPosition(to.x, to.y, room.name);
		let path = room.findPath(from_pos, to_pos, { ignoreCreeps: true });

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



/* ***********************************************************
 *	[sec06b] DEFINITIONS: BLUEPRINT LAYOUTS
 * *********************************************************** */

Blueprint__Default_Horizontal = { // Size (without walls) 13, 12 ; Defensive offset -3, -3, +3, +3
	spawn: [ {x: 0, y: 0}, {x: 0, y: 4}, {x: 0, y: 8} ],
	extension: [ {x: 3, y: 0}, {x: 4, y: 0}, {x: 5, y: 0}, {x: 2, y: 1}, {x: 4, y: 1}, {x: 6, y: 1}, {x: 8, y: 1},
		{x: 1, y: 2}, {x: 2, y: 2}, {x: 3, y: 2}, {x: 5, y: 2}, {x: 6, y: 2}, {x: 7, y: 2}, {x: 2, y: 3},
		{x: 4, y: 3}, {x: 6, y: 3}, {x: 8, y: 3}, {x: 3, y: 4}, {x: 4, y: 4}, {x: 5, y: 4}, {x: 7, y: 4},
		{x: 8, y: 4}, {x: 2, y: 5}, {x: 4, y: 5}, {x: 6, y: 5}, {x: 8, y: 5}, {x: 1, y: 6}, {x: 2, y: 6},
		{x: 3, y: 6}, {x: 5, y: 6}, {x: 6, y: 6}, {x: 7, y: 6}, {x: 2, y: 7}, {x: 4, y: 7}, {x: 6, y: 7},
		{x: 8, y: 7}, {x: 3, y: 8}, {x: 4, y: 8}, {x: 5, y: 8}, {x: 7, y: 8}, {x: 8, y: 8}, {x: 2, y: 9},
		{x: 4, y: 9}, {x: 6, y: 9}, {x: 8, y: 9}, {x: 1, y: 10}, {x: 2, y: 10}, {x: 3, y: 10}, {x: 5, y: 10},
		{x: 6, y: 10}, {x: 7, y: 10}, {x: 2, y: 11}, {x: 4, y: 11}, {x: 6, y: 11}, {x: 8, y: 11}, {x: 3, y: 12},
		{x: 4, y: 12}, {x: 5, y: 12}, {x: 7, y: 12}, {x: 8, y: 12} ],
	link: [ {x: 10, y: 5}, {x: 10, y: 6} ],
	storage: [ {x: 9, y: 4} ],
	tower: [ {x: 7, y: 0}, {x: 0, y: 2}, {x: 0, y: 11}, {x: 9, y: 11}, {x: 0, y: 12}, {x: 9, y: 12} ],
	terminal: [ {x: 9, y: 0} ],
	lab: [ {x: 11, y: 1}, {x: 12, y: 1}, {x: 10, y: 2}, {x: 12, y: 2}, {x: 13, y: 2}, {x: 10, y: 3}, {x: 11, y: 3},
		{x: 13, y: 3}, {x: 11, y: 4}, {x: 12, y: 4} ],
	factory: [ {x: 11, y: 0} ],
	nuker: [ {x: 9, y: 8} ],
	observer: [ {x: 9, y: 9} ],
	powerSpawn: [ {x: 9, y: 7} ],
	road: [ {x: -1, y: -2}, {x: 0, y: -2}, {x: 4, y: -2}, {x: 5, y: -2}, {x: 10, y: -2}, {x: 11, y: -2}, {x: 14, y: -2},
		{x: -2, y: -1}, {x: 0, y: -1}, {x: 3, y: -1}, {x: 4, y: -1}, {x: 5, y: -1}, {x: 6, y: -1}, {x: 7, y: -1},
		{x: 8, y: -1}, {x: 9, y: -1}, {x: 10, y: -1}, {x: 11, y: -1}, {x: 14, y: -1}, {x: -2, y: 0}, {x: -1, y: 0},
		{x: 1, y: 0}, {x: 2, y: 0}, {x: 6, y: 0}, {x: 8, y: 0}, {x: 10, y: 0}, {x: 12, y: 0}, {x: 13, y: 0},
		{x: 0, y: 1}, {x: 1, y: 1}, {x: 3, y: 1}, {x: 5, y: 1}, {x: 7, y: 1}, {x: 9, y: 1}, {x: 10, y: 1},
		{x: 13, y: 1}, {x: 14, y: 1}, {x: -1, y: 2}, {x: 4, y: 2}, {x: 8, y: 2}, {x: 9, y: 2}, {x: 11, y: 2},
		{x: 14, y: 2}, {x: 15, y: 2}, {x: 0, y: 3}, {x: 1, y: 3}, {x: 3, y: 3}, {x: 5, y: 3}, {x: 7, y: 3},
		{x: 9, y: 3}, {x: 12, y: 3}, {x: 14, y: 3}, {x: 15, y: 3}, {x: -1, y: 4}, {x: 1, y: 4}, {x: 2, y: 4},
		{x: 6, y: 4}, {x: 10, y: 4}, {x: 13, y: 4}, {x: 14, y: 4}, {x: -2, y: 5}, {x: 0, y: 5}, {x: 1, y: 5},
		{x: 3, y: 5}, {x: 5, y: 5}, {x: 7, y: 5}, {x: 9, y: 5}, {x: 11, y: 5}, {x: 12, y: 5}, {x: 13, y: 5},
		{x: -2, y: 6}, {x: 0, y: 6}, {x: 4, y: 6}, {x: 8, y: 6}, {x: 9, y: 6}, {x: 11, y: 6}, {x: 14, y: 6},
		{x: -2, y: 7}, {x: 0, y: 7}, {x: 1, y: 7}, {x: 3, y: 7}, {x: 5, y: 7}, {x: 7, y: 7}, {x: 10, y: 7},
		{x: 11, y: 7}, {x: -1, y: 8}, {x: 1, y: 8}, {x: 2, y: 8}, {x: 6, y: 8}, {x: 10, y: 8}, {x: 0, y: 9},
		{x: 1, y: 9}, {x: 3, y: 9}, {x: 5, y: 9}, {x: 7, y: 9}, {x: 10, y: 9}, {x: 0, y: 10}, {x: 4, y: 10},
		{x: 8, y: 10}, {x: 9, y: 10}, {x: -1, y: 11}, {x: 1, y: 11}, {x: 3, y: 11}, {x: 5, y: 11}, {x: 7, y: 11},
		{x: 10, y: 11}, {x: 11, y: 11}, {x: -2, y: 12}, {x: -1, y: 12}, {x: 1, y: 12}, {x: 2, y: 12}, {x: 6, y: 12},
		{x: 10, y: 12}, {x: 11, y: 12}, {x: -2, y: 13}, {x: 0, y: 13}, {x: 3, y: 13}, {x: 4, y: 13}, {x: 5, y: 13},
		{x: 7, y: 13}, {x: 8, y: 13}, {x: 9, y: 13}, {x: 11, y: 13}, {x: -1, y: 14}, {x: 0, y: 14}, {x: 4, y: 14},
		{x: 5, y: 14}, {x: 10, y: 14}, {x: 11, y: 14} ],
	rampart: [ {x: -3, y: -3}, {x: -2, y: -3}, {x: -1, y: -3}, {x: 0, y: -3}, {x: 1, y: -3}, {x: 2, y: -3}, {x: 3, y: -3},
		{x: 4, y: -3}, {x: 5, y: -3}, {x: 6, y: -3}, {x: 7, y: -3}, {x: 8, y: -3}, {x: 9, y: -3}, {x: 10, y: -3},
		{x: 11, y: -3}, {x: 12, y: -3}, {x: 13, y: -3}, {x: 14, y: -3}, {x: 15, y: -3}, {x: 16, y: -3}, {x: -3, y: -2},
		{x: 16, y: -2}, {x: -3, y: -1}, {x: 16, y: -1}, {x: -3, y: 0}, {x: 16, y: 0}, {x: -3, y: 1}, {x: 16, y: 1},
		{x: -3, y: 2}, {x: 16, y: 2}, {x: -3, y: 3}, {x: 16, y: 3}, {x: -3, y: 4}, {x: 16, y: 4}, {x: -3, y: 5},
		{x: 16, y: 5}, {x: -3, y: 6}, {x: 16, y: 6}, {x: -3, y: 7}, {x: 12, y: 7}, {x: 13, y: 7}, {x: 14, y: 7},
		{x: 15, y: 7}, {x: 16, y: 7}, {x: -3, y: 8}, {x: 12, y: 8}, {x: -3, y: 9}, {x: 12, y: 9}, {x: -3, y: 10},
		{x: 12, y: 10}, {x: -3, y: 11}, {x: 12, y: 11}, {x: -3, y: 12}, {x: 12, y: 12}, {x: -3, y: 13}, {x: 12, y: 13},
		{x: -3, y: 14}, {x: 12, y: 14}, {x: -3, y: 15}, {x: -2, y: 15}, {x: -1, y: 15}, {x: 0, y: 15}, {x: 1, y: 15},
		{x: 2, y: 15}, {x: 3, y: 15}, {x: 4, y: 15}, {x: 5, y: 15}, {x: 6, y: 15}, {x: 7, y: 15}, {x: 8, y: 15},
		{x: 9, y: 15}, {x: 10, y: 15}, {x: 11, y: 15}, {x: 12, y: 15} ],

};


Blueprint__Default_Horizontal__Walled = {
	spawn: [{ x: 0, y: 0 }, { x: 0, y: 4 }, { x: 0, y: 8 }],
	extension: [{ x: 3, y: 0 }, { x: 4, y: 0 }, { x: 5, y: 0 }, { x: 2, y: 1 }, { x: 4, y: 1 }, { x: 6, y: 1 }, { x: 8, y: 1 },
	{ x: 1, y: 2 }, { x: 2, y: 2 }, { x: 3, y: 2 }, { x: 5, y: 2 }, { x: 6, y: 2 }, { x: 7, y: 2 }, { x: 2, y: 3 },
	{ x: 4, y: 3 }, { x: 6, y: 3 }, { x: 8, y: 3 }, { x: 3, y: 4 }, { x: 4, y: 4 }, { x: 5, y: 4 }, { x: 7, y: 4 },
	{ x: 8, y: 4 }, { x: 2, y: 5 }, { x: 4, y: 5 }, { x: 6, y: 5 }, { x: 8, y: 5 }, { x: 1, y: 6 }, { x: 2, y: 6 },
	{ x: 3, y: 6 }, { x: 5, y: 6 }, { x: 6, y: 6 }, { x: 7, y: 6 }, { x: 2, y: 7 }, { x: 4, y: 7 }, { x: 6, y: 7 },
	{ x: 8, y: 7 }, { x: 3, y: 8 }, { x: 4, y: 8 }, { x: 5, y: 8 }, { x: 7, y: 8 }, { x: 8, y: 8 }, { x: 2, y: 9 },
	{ x: 4, y: 9 }, { x: 6, y: 9 }, { x: 8, y: 9 }, { x: 1, y: 10 }, { x: 2, y: 10 }, { x: 3, y: 10 }, { x: 5, y: 10 },
	{ x: 6, y: 10 }, { x: 7, y: 10 }, { x: 2, y: 11 }, { x: 4, y: 11 }, { x: 6, y: 11 }, { x: 8, y: 11 }, { x: 3, y: 12 },
	{ x: 4, y: 12 }, { x: 5, y: 12 }, { x: 7, y: 12 }, { x: 8, y: 12 }],
	link: [{ x: 10, y: 5 }, { x: 10, y: 6 }],
	storage: [{ x: 9, y: 4 }],
	tower: [{ x: 7, y: 0 }, { x: 0, y: 2 }, { x: 0, y: 11 }, { x: 9, y: 11 }, { x: 0, y: 12 }, { x: 9, y: 12 }],
	terminal: [{ x: 9, y: 0 }],
	lab: [{ x: 11, y: 1 }, { x: 12, y: 1 }, { x: 10, y: 2 }, { x: 12, y: 2 }, { x: 13, y: 2 }, { x: 10, y: 3 }, { x: 11, y: 3 },
	{ x: 13, y: 3 }, { x: 11, y: 4 }, { x: 12, y: 4 }],
	factory: [ {x: 11, y: 0} ],
	nuker: [{ x: 9, y: 8 }],
	observer: [{ x: 9, y: 9 }],
	powerSpawn: [{ x: 9, y: 7 }],
	road: [{ x: -1, y: -2 }, { x: 0, y: -2 }, { x: 4, y: -2 }, { x: 5, y: -2 }, { x: 10, y: -2 }, { x: 11, y: -2 }, { x: 14, y: -2 },
	{ x: -2, y: -1 }, { x: 0, y: -1 }, { x: 3, y: -1 }, { x: 4, y: -1 }, { x: 5, y: -1 }, { x: 6, y: -1 }, { x: 7, y: -1 },
	{ x: 8, y: -1 }, { x: 9, y: -1 }, { x: 10, y: -1 }, { x: 11, y: -1 }, { x: 14, y: -1 }, { x: -2, y: 0 }, { x: -1, y: 0 },
	{ x: 1, y: 0 }, { x: 2, y: 0 }, { x: 6, y: 0 }, { x: 8, y: 0 }, { x: 10, y: 0 }, { x: 11, y: 0 }, { x: 12, y: 0 },
	{ x: 13, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 3, y: 1 }, { x: 5, y: 1 }, { x: 7, y: 1 }, { x: 9, y: 1 },
	{ x: 10, y: 1 }, { x: 13, y: 1 }, { x: 14, y: 1 }, { x: -1, y: 2 }, { x: 4, y: 2 }, { x: 8, y: 2 }, { x: 9, y: 2 },
	{ x: 11, y: 2 }, { x: 14, y: 2 }, { x: 15, y: 2 }, { x: 0, y: 3 }, { x: 1, y: 3 }, { x: 3, y: 3 }, { x: 5, y: 3 },
	{ x: 7, y: 3 }, { x: 9, y: 3 }, { x: 12, y: 3 }, { x: 14, y: 3 }, { x: 15, y: 3 }, { x: -1, y: 4 }, { x: 1, y: 4 },
	{ x: 2, y: 4 }, { x: 6, y: 4 }, { x: 10, y: 4 }, { x: 13, y: 4 }, { x: 14, y: 4 }, { x: -2, y: 5 }, { x: 0, y: 5 },
	{ x: 1, y: 5 }, { x: 3, y: 5 }, { x: 5, y: 5 }, { x: 7, y: 5 }, { x: 9, y: 5 }, { x: 11, y: 5 }, { x: 12, y: 5 },
	{ x: 13, y: 5 }, { x: -2, y: 6 }, { x: 0, y: 6 }, { x: 4, y: 6 }, { x: 8, y: 6 }, { x: 9, y: 6 }, { x: 11, y: 6 },
	{ x: 14, y: 6 }, { x: -2, y: 7 }, { x: 0, y: 7 }, { x: 1, y: 7 }, { x: 3, y: 7 }, { x: 5, y: 7 }, { x: 7, y: 7 },
	{ x: 10, y: 7 }, { x: 11, y: 7 }, { x: -1, y: 8 }, { x: 1, y: 8 }, { x: 2, y: 8 }, { x: 6, y: 8 }, { x: 10, y: 8 },
	{ x: 0, y: 9 }, { x: 1, y: 9 }, { x: 3, y: 9 }, { x: 5, y: 9 }, { x: 7, y: 9 }, { x: 10, y: 9 }, { x: 0, y: 10 },
	{ x: 4, y: 10 }, { x: 8, y: 10 }, { x: 9, y: 10 }, { x: -1, y: 11 }, { x: 1, y: 11 }, { x: 3, y: 11 }, { x: 5, y: 11 },
	{ x: 7, y: 11 }, { x: 10, y: 11 }, { x: 11, y: 11 }, { x: -2, y: 12 }, { x: -1, y: 12 }, { x: 1, y: 12 }, { x: 2, y: 12 },
	{ x: 6, y: 12 }, { x: 10, y: 12 }, { x: 11, y: 12 }, { x: -2, y: 13 }, { x: 0, y: 13 }, { x: 3, y: 13 }, { x: 4, y: 13 },
	{ x: 5, y: 13 }, { x: 7, y: 13 }, { x: 8, y: 13 }, { x: 9, y: 13 }, { x: 11, y: 13 }, { x: -1, y: 14 }, { x: 0, y: 14 },
	{ x: 4, y: 14 }, { x: 5, y: 14 }, { x: 10, y: 14 }, { x: 11, y: 14 }],
	rampart: [{ x: -1, y: -3 }, { x: 0, y: -3 }, { x: 4, y: -3 }, { x: 5, y: -3 }, { x: 10, y: -3 }, { x: 11, y: -3 }, { x: 14, y: -3 },
	{ x: -3, y: -1 }, { x: -3, y: 0 }, { x: 16, y: 2 }, { x: 16, y: 3 }, { x: -3, y: 5 }, { x: -3, y: 6 }, { x: -3, y: 7 },
	{ x: 12, y: 7 }, { x: 14, y: 7 }, { x: 12, y: 11 }, { x: -3, y: 12 }, { x: 12, y: 12 }, { x: -3, y: 13 }, { x: 12, y: 13 },
	{ x: 12, y: 14 }, { x: -1, y: 15 }, { x: 0, y: 15 }, { x: 4, y: 15 }, { x: 5, y: 15 }, { x: 10, y: 15 }, { x: 11, y: 15 },
	{ x: 12, y: 15 }],
	constructedWall: [{ x: -3, y: -3 }, { x: -2, y: -3 }, { x: 1, y: -3 }, { x: 2, y: -3 }, { x: 3, y: -3 }, { x: 6, y: -3 }, { x: 7, y: -3 },
	{ x: 8, y: -3 }, { x: 9, y: -3 }, { x: 12, y: -3 }, { x: 13, y: -3 }, { x: 15, y: -3 }, { x: 16, y: -3 }, { x: -3, y: -2 },
	{ x: 16, y: -2 }, { x: 16, y: -1 }, { x: 16, y: 0 }, { x: -3, y: 1 }, { x: 16, y: 1 }, { x: -3, y: 2 }, { x: -3, y: 3 },
	{ x: -3, y: 4 }, { x: 16, y: 4 }, { x: 16, y: 5 }, { x: 16, y: 6 }, { x: 13, y: 7 }, { x: 15, y: 7 }, { x: 16, y: 7 },
	{ x: -3, y: 8 }, { x: 12, y: 8 }, { x: -3, y: 9 }, { x: 12, y: 9 }, { x: -3, y: 10 }, { x: 12, y: 10 }, { x: -3, y: 11 },
	{ x: -3, y: 14 }, { x: -3, y: 15 }, { x: -2, y: 15 }, { x: 1, y: 15 }, { x: 2, y: 15 }, { x: 3, y: 15 }, { x: 6, y: 15 },
	{ x: 7, y: 15 }, { x: 8, y: 15 }, { x: 9, y: 15 }]

};


Blueprint__Default_Vertical = {	// Size (without walls) 8, 16 ; Defensive offset -3, -3, +3, +3
	spawn: [{ x: 0, y: 0 }, { x: 0, y: 4 }, { x: 0, y: 8 }],
	extension: [{ x: 3, y: 0 }, { x: 4, y: 0 }, { x: 5, y: 0 }, { x: 2, y: 1 }, { x: 4, y: 1 }, { x: 6, y: 1 }, { x: 8, y: 1 },
	{ x: 1, y: 2 }, { x: 2, y: 2 }, { x: 3, y: 2 }, { x: 5, y: 2 }, { x: 6, y: 2 }, { x: 7, y: 2 }, { x: 2, y: 3 },
	{ x: 4, y: 3 }, { x: 6, y: 3 }, { x: 8, y: 3 }, { x: 3, y: 4 }, { x: 4, y: 4 }, { x: 5, y: 4 }, { x: 7, y: 4 },
	{ x: 8, y: 4 }, { x: 2, y: 5 }, { x: 4, y: 5 }, { x: 6, y: 5 }, { x: 8, y: 5 }, { x: 1, y: 6 }, { x: 2, y: 6 },
	{ x: 3, y: 6 }, { x: 5, y: 6 }, { x: 6, y: 6 }, { x: 7, y: 6 }, { x: 2, y: 7 }, { x: 4, y: 7 }, { x: 6, y: 7 },
	{ x: 8, y: 7 }, { x: 3, y: 8 }, { x: 4, y: 8 }, { x: 5, y: 8 }, { x: 7, y: 8 }, { x: 8, y: 8 }, { x: 2, y: 9 },
	{ x: 4, y: 9 }, { x: 6, y: 9 }, { x: 8, y: 9 }, { x: 1, y: 10 }, { x: 2, y: 10 }, { x: 3, y: 10 }, { x: 5, y: 10 },
	{ x: 6, y: 10 }, { x: 7, y: 10 }, { x: 2, y: 11 }, { x: 4, y: 11 }, { x: 6, y: 11 }, { x: 8, y: 11 }, { x: 3, y: 12 },
	{ x: 4, y: 12 }, { x: 5, y: 12 }, { x: 7, y: 12 }, { x: 8, y: 12 }],
	link: [{ x: 5, y: 15 }, { x: 5, y: 16 }],
	storage: [{ x: 6, y: 13 }],
	tower: [{ x: 7, y: 0 }, { x: 8, y: 0 }, { x: 0, y: 2 }, { x: 7, y: 15 }, { x: 8, y: 15 }, { x: 0, y: 16 }],
	terminal: [{ x: 4, y: 13 }],
	lab: [{ x: 1, y: 13 }, { x: 2, y: 13 }, { x: 0, y: 14 }, { x: 1, y: 14 }, { x: 3, y: 14 }, { x: 0, y: 15 }, { x: 2, y: 15 },
	{ x: 3, y: 15 }, { x: 1, y: 16 }, { x: 2, y: 16 }],
	factory: [ {x: 4, y: 16} ],
	nuker: [{ x: 0, y: 6 }],
	observer: [{ x: 0, y: 12 }],
	powerSpawn: [{ x: 0, y: 11 }],
	road: [{ x: -1, y: -2 }, { x: 0, y: -2 }, { x: 3, y: -2 }, { x: 4, y: -2 }, { x: 8, y: -2 }, { x: 9, y: -2 }, { x: -2, y: -1 },
	{ x: 0, y: -1 }, { x: 3, y: -1 }, { x: 4, y: -1 }, { x: 5, y: -1 }, { x: 7, y: -1 }, { x: 8, y: -1 }, { x: 10, y: -1 },
	{ x: -2, y: 0 }, { x: -1, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 6, y: 0 }, { x: 9, y: 0 }, { x: 10, y: 0 },
	{ x: 0, y: 1 }, { x: 1, y: 1 }, { x: 3, y: 1 }, { x: 5, y: 1 }, { x: 7, y: 1 }, { x: 9, y: 1 }, { x: -1, y: 2 },
	{ x: 4, y: 2 }, { x: 8, y: 2 }, { x: 9, y: 2 }, { x: 0, y: 3 }, { x: 1, y: 3 }, { x: 3, y: 3 }, { x: 5, y: 3 },
	{ x: 7, y: 3 }, { x: 9, y: 3 }, { x: -2, y: 4 }, { x: -1, y: 4 }, { x: 1, y: 4 }, { x: 2, y: 4 }, { x: 6, y: 4 },
	{ x: 9, y: 4 }, { x: 10, y: 4 }, { x: 0, y: 5 }, { x: 1, y: 5 }, { x: 3, y: 5 }, { x: 5, y: 5 }, { x: 7, y: 5 },
	{ x: 9, y: 5 }, { x: -1, y: 6 }, { x: 4, y: 6 }, { x: 8, y: 6 }, { x: 0, y: 7 }, { x: 1, y: 7 }, { x: 3, y: 7 },
	{ x: 5, y: 7 }, { x: 7, y: 7 }, { x: 9, y: 7 }, { x: -2, y: 8 }, { x: -1, y: 8 }, { x: 1, y: 8 }, { x: 2, y: 8 },
	{ x: 6, y: 8 }, { x: 9, y: 8 }, { x: 10, y: 8 }, { x: -2, y: 9 }, { x: 0, y: 9 }, { x: 1, y: 9 }, { x: 3, y: 9 },
	{ x: 5, y: 9 }, { x: 7, y: 9 }, { x: 9, y: 9 }, { x: 10, y: 9 }, { x: -1, y: 10 }, { x: 4, y: 10 }, { x: 8, y: 10 },
	{ x: -1, y: 11 }, { x: 1, y: 11 }, { x: 3, y: 11 }, { x: 5, y: 11 }, { x: 7, y: 11 }, { x: 9, y: 11 }, { x: -1, y: 12 },
	{ x: 1, y: 12 }, { x: 2, y: 12 }, { x: 6, y: 12 }, { x: 9, y: 12 }, { x: -2, y: 13 }, { x: 0, y: 13 }, { x: 3, y: 13 },
	{ x: 5, y: 13 }, { x: 7, y: 13 }, { x: 8, y: 13 }, { x: 10, y: 13 }, { x: -1, y: 14 }, { x: 2, y: 14 }, { x: 4, y: 14 },
	{ x: 5, y: 14 }, { x: 6, y: 14 }, { x: 7, y: 14 }, { x: 8, y: 14 }, { x: -1, y: 15 }, { x: 1, y: 15 }, { x: 4, y: 15 },
	{ x: 6, y: 15 }, { x: 9, y: 15 }, { x: -1, y: 16 }, { x: 3, y: 16 }, { x: 6, y: 16 }, { x: 7, y: 16 }, { x: 8, y: 16 },
	{ x: 10, y: 16 }, { x: -2, y: 17 }, { x: 0, y: 17 }, { x: 1, y: 17 }, { x: 2, y: 17 }, { x: 5, y: 17 }, { x: 7, y: 17 },
	{ x: 9, y: 17 }, { x: 10, y: 17 }, { x: -1, y: 18 }, { x: 0, y: 18 }, { x: 3, y: 18 }, { x: 4, y: 18 }, { x: 8, y: 18 },
	{ x: 9, y: 18 }],
	rampart: [{ x: -3, y: -3 }, { x: -2, y: -3 }, { x: -1, y: -3 }, { x: 0, y: -3 }, { x: 1, y: -3 }, { x: 2, y: -3 }, { x: 3, y: -3 },
	{ x: 4, y: -3 }, { x: 5, y: -3 }, { x: 6, y: -3 }, { x: 7, y: -3 }, { x: 8, y: -3 }, { x: 9, y: -3 }, { x: 10, y: -3 },
	{ x: 11, y: -3 }, { x: -3, y: -2 }, { x: 11, y: -2 }, { x: -3, y: -1 }, { x: 11, y: -1 }, { x: -3, y: 0 }, { x: 11, y: 0 },
	{ x: -3, y: 1 }, { x: 11, y: 1 }, { x: -3, y: 2 }, { x: 11, y: 2 }, { x: -3, y: 3 }, { x: 11, y: 3 }, { x: -3, y: 4 },
	{ x: 11, y: 4 }, { x: -3, y: 5 }, { x: 11, y: 5 }, { x: -3, y: 6 }, { x: 11, y: 6 }, { x: -3, y: 7 }, { x: 11, y: 7 },
	{ x: -3, y: 8 }, { x: 11, y: 8 }, { x: -3, y: 9 }, { x: 11, y: 9 }, { x: -3, y: 10 }, { x: 11, y: 10 }, { x: -3, y: 11 },
	{ x: 11, y: 11 }, { x: -3, y: 12 }, { x: 11, y: 12 }, { x: -3, y: 13 }, { x: 11, y: 13 }, { x: -3, y: 14 }, { x: 11, y: 14 },
	{ x: -3, y: 15 }, { x: 11, y: 15 }, { x: -3, y: 16 }, { x: 11, y: 16 }, { x: -3, y: 17 }, { x: 11, y: 17 }, { x: -3, y: 18 },
	{ x: 11, y: 18 }, { x: -3, y: 19 }, { x: -2, y: 19 }, { x: -1, y: 19 }, { x: 0, y: 19 }, { x: 1, y: 19 }, { x: 2, y: 19 },
	{ x: 3, y: 19 }, { x: 4, y: 19 }, { x: 5, y: 19 }, { x: 6, y: 19 }, { x: 7, y: 19 }, { x: 8, y: 19 }, { x: 9, y: 19 },
	{ x: 10, y: 19 }, { x: 11, y: 19 }]
};


Blueprint__Default_Vertical__Walled = {
	spawn: [{ x: 0, y: 0 }, { x: 0, y: 4 }, { x: 0, y: 8 }],
	extension: [{ x: 3, y: 0 }, { x: 4, y: 0 }, { x: 5, y: 0 }, { x: 2, y: 1 }, { x: 4, y: 1 }, { x: 6, y: 1 }, { x: 8, y: 1 },
	{ x: 1, y: 2 }, { x: 2, y: 2 }, { x: 3, y: 2 }, { x: 5, y: 2 }, { x: 6, y: 2 }, { x: 7, y: 2 }, { x: 2, y: 3 },
	{ x: 4, y: 3 }, { x: 6, y: 3 }, { x: 8, y: 3 }, { x: 3, y: 4 }, { x: 4, y: 4 }, { x: 5, y: 4 }, { x: 7, y: 4 },
	{ x: 8, y: 4 }, { x: 2, y: 5 }, { x: 4, y: 5 }, { x: 6, y: 5 }, { x: 8, y: 5 }, { x: 1, y: 6 }, { x: 2, y: 6 },
	{ x: 3, y: 6 }, { x: 5, y: 6 }, { x: 6, y: 6 }, { x: 7, y: 6 }, { x: 2, y: 7 }, { x: 4, y: 7 }, { x: 6, y: 7 },
	{ x: 8, y: 7 }, { x: 3, y: 8 }, { x: 4, y: 8 }, { x: 5, y: 8 }, { x: 7, y: 8 }, { x: 8, y: 8 }, { x: 2, y: 9 },
	{ x: 4, y: 9 }, { x: 6, y: 9 }, { x: 8, y: 9 }, { x: 1, y: 10 }, { x: 2, y: 10 }, { x: 3, y: 10 }, { x: 5, y: 10 },
	{ x: 6, y: 10 }, { x: 7, y: 10 }, { x: 2, y: 11 }, { x: 4, y: 11 }, { x: 6, y: 11 }, { x: 8, y: 11 }, { x: 3, y: 12 },
	{ x: 4, y: 12 }, { x: 5, y: 12 }, { x: 7, y: 12 }, { x: 8, y: 12 }],
	link: [{ x: 5, y: 15 }, { x: 5, y: 16 }],
	storage: [{ x: 6, y: 13 }],
	tower: [{ x: 7, y: 0 }, { x: 8, y: 0 }, { x: 0, y: 2 }, { x: 7, y: 15 }, { x: 8, y: 15 }, { x: 0, y: 16 }],
	terminal: [{ x: 4, y: 13 }],
	lab: [{ x: 1, y: 13 }, { x: 2, y: 13 }, { x: 0, y: 14 }, { x: 1, y: 14 }, { x: 3, y: 14 }, { x: 0, y: 15 }, { x: 2, y: 15 },
	{ x: 3, y: 15 }, { x: 1, y: 16 }, { x: 2, y: 16 }],
	factory: [ {x: 4, y: 16} ],
	nuker: [{ x: 0, y: 6 }],
	observer: [{ x: 0, y: 12 }],
	powerSpawn: [{ x: 0, y: 11 }],
	road: [{ x: -1, y: -2 }, { x: 0, y: -2 }, { x: 3, y: -2 }, { x: 4, y: -2 }, { x: 8, y: -2 }, { x: 9, y: -2 }, { x: -2, y: -1 },
	{ x: 0, y: -1 }, { x: 3, y: -1 }, { x: 4, y: -1 }, { x: 5, y: -1 }, { x: 7, y: -1 }, { x: 8, y: -1 }, { x: 10, y: -1 },
	{ x: -2, y: 0 }, { x: -1, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 6, y: 0 }, { x: 9, y: 0 }, { x: 10, y: 0 },
	{ x: 0, y: 1 }, { x: 1, y: 1 }, { x: 3, y: 1 }, { x: 5, y: 1 }, { x: 7, y: 1 }, { x: 9, y: 1 }, { x: -1, y: 2 },
	{ x: 4, y: 2 }, { x: 8, y: 2 }, { x: 9, y: 2 }, { x: 0, y: 3 }, { x: 1, y: 3 }, { x: 3, y: 3 }, { x: 5, y: 3 },
	{ x: 7, y: 3 }, { x: 9, y: 3 }, { x: -2, y: 4 }, { x: -1, y: 4 }, { x: 1, y: 4 }, { x: 2, y: 4 }, { x: 6, y: 4 },
	{ x: 9, y: 4 }, { x: 10, y: 4 }, { x: 0, y: 5 }, { x: 1, y: 5 }, { x: 3, y: 5 }, { x: 5, y: 5 }, { x: 7, y: 5 },
	{ x: 9, y: 5 }, { x: -1, y: 6 }, { x: 4, y: 6 }, { x: 8, y: 6 }, { x: 0, y: 7 }, { x: 1, y: 7 }, { x: 3, y: 7 },
	{ x: 5, y: 7 }, { x: 7, y: 7 }, { x: 9, y: 7 }, { x: -2, y: 8 }, { x: -1, y: 8 }, { x: 1, y: 8 }, { x: 2, y: 8 },
	{ x: 6, y: 8 }, { x: 9, y: 8 }, { x: 10, y: 8 }, { x: -2, y: 9 }, { x: 0, y: 9 }, { x: 1, y: 9 }, { x: 3, y: 9 },
	{ x: 5, y: 9 }, { x: 7, y: 9 }, { x: 9, y: 9 }, { x: 10, y: 9 }, { x: -1, y: 10 }, { x: 4, y: 10 }, { x: 8, y: 10 },
	{ x: -1, y: 11 }, { x: 1, y: 11 }, { x: 3, y: 11 }, { x: 5, y: 11 }, { x: 7, y: 11 }, { x: 9, y: 11 }, { x: -1, y: 12 },
	{ x: 1, y: 12 }, { x: 2, y: 12 }, { x: 6, y: 12 }, { x: 9, y: 12 }, { x: -2, y: 13 }, { x: 0, y: 13 }, { x: 3, y: 13 },
	{ x: 5, y: 13 }, { x: 7, y: 13 }, { x: 8, y: 13 }, { x: 10, y: 13 }, { x: -1, y: 14 }, { x: 2, y: 14 }, { x: 4, y: 14 },
	{ x: 5, y: 14 }, { x: 6, y: 14 }, { x: 7, y: 14 }, { x: 8, y: 14 }, { x: -1, y: 15 }, { x: 1, y: 15 }, { x: 4, y: 15 },
	{ x: 6, y: 15 }, { x: 9, y: 15 }, { x: -1, y: 16 }, { x: 3, y: 16 }, { x: 6, y: 16 }, { x: 7, y: 16 }, { x: 8, y: 16 },
	{ x: 10, y: 16 }, { x: -2, y: 17 }, { x: 0, y: 17 }, { x: 1, y: 17 }, { x: 2, y: 17 }, { x: 5, y: 17 }, { x: 7, y: 17 },
	{ x: 9, y: 17 }, { x: 10, y: 17 }, { x: -1, y: 18 }, { x: 0, y: 18 }, { x: 3, y: 18 }, { x: 4, y: 18 }, { x: 8, y: 18 },
	{ x: 9, y: 18 }],
	rampart: [{ x: -1, y: -3 }, { x: 0, y: -3 }, { x: 3, y: -3 }, { x: 4, y: -3 }, { x: 8, y: -3 }, { x: 9, y: -3 }, { x: -3, y: -1 },
	{ x: 11, y: -1 }, { x: -3, y: 0 }, { x: 11, y: 0 }, { x: -3, y: 4 }, { x: 11, y: 4 }, { x: -3, y: 8 }, { x: 11, y: 8 },
	{ x: -3, y: 9 }, { x: 11, y: 9 }, { x: -3, y: 13 }, { x: 11, y: 13 }, { x: 11, y: 16 }, { x: -3, y: 17 }, { x: 11, y: 17 },
	{ x: -1, y: 19 }, { x: 0, y: 19 }, { x: 3, y: 19 }, { x: 4, y: 19 }, { x: 8, y: 19 }, { x: 9, y: 19 }],
	constructedWall: [{ x: -3, y: -3 }, { x: -2, y: -3 }, { x: 1, y: -3 }, { x: 2, y: -3 }, { x: 5, y: -3 }, { x: 6, y: -3 }, { x: 7, y: -3 },
	{ x: 10, y: -3 }, { x: 11, y: -3 }, { x: -3, y: -2 }, { x: 11, y: -2 }, { x: -3, y: 1 }, { x: 11, y: 1 }, { x: -3, y: 2 },
	{ x: 11, y: 2 }, { x: -3, y: 3 }, { x: 11, y: 3 }, { x: -3, y: 5 }, { x: 11, y: 5 }, { x: -3, y: 6 }, { x: 11, y: 6 },
	{ x: -3, y: 7 }, { x: 11, y: 7 }, { x: -3, y: 10 }, { x: 11, y: 10 }, { x: -3, y: 11 }, { x: 11, y: 11 }, { x: -3, y: 12 },
	{ x: 11, y: 12 }, { x: -3, y: 14 }, { x: 11, y: 14 }, { x: -3, y: 15 }, { x: 11, y: 15 }, { x: -3, y: 16 }, { x: -3, y: 18 },
	{ x: 11, y: 18 }, { x: -3, y: 19 }, { x: -2, y: 19 }, { x: 1, y: 19 }, { x: 2, y: 19 }, { x: 5, y: 19 }, { x: 6, y: 19 },
	{ x: 7, y: 19 }, { x: 10, y: 19 }, { x: 11, y: 19 }]
};


Blueprint__Default_Compact = { // Size (without walls) 10, 13 ; Defensive offset -3, -3, +3, +3 ; No Labs!!
	spawn: [{ x: 0, y: 0 }, { x: 0, y: 4 }, { x: 0, y: 8 }],
	extension: [{ x: 3, y: 0 }, { x: 4, y: 0 }, { x: 5, y: 0 }, { x: 2, y: 1 }, { x: 4, y: 1 }, { x: 6, y: 1 }, { x: 8, y: 1 },
	{ x: 1, y: 2 }, { x: 2, y: 2 }, { x: 3, y: 2 }, { x: 5, y: 2 }, { x: 6, y: 2 }, { x: 7, y: 2 }, { x: 2, y: 3 },
	{ x: 4, y: 3 }, { x: 6, y: 3 }, { x: 8, y: 3 }, { x: 3, y: 4 }, { x: 4, y: 4 }, { x: 5, y: 4 }, { x: 7, y: 4 },
	{ x: 8, y: 4 }, { x: 2, y: 5 }, { x: 4, y: 5 }, { x: 6, y: 5 }, { x: 8, y: 5 }, { x: 1, y: 6 }, { x: 2, y: 6 },
	{ x: 3, y: 6 }, { x: 5, y: 6 }, { x: 6, y: 6 }, { x: 7, y: 6 }, { x: 2, y: 7 }, { x: 4, y: 7 }, { x: 6, y: 7 },
	{ x: 8, y: 7 }, { x: 3, y: 8 }, { x: 4, y: 8 }, { x: 5, y: 8 }, { x: 7, y: 8 }, { x: 8, y: 8 }, { x: 2, y: 9 },
	{ x: 4, y: 9 }, { x: 6, y: 9 }, { x: 8, y: 9 }, { x: 1, y: 10 }, { x: 2, y: 10 }, { x: 3, y: 10 }, { x: 5, y: 10 },
	{ x: 6, y: 10 }, { x: 7, y: 10 }, { x: 2, y: 11 }, { x: 4, y: 11 }, { x: 6, y: 11 }, { x: 8, y: 11 }, { x: 3, y: 12 },
	{ x: 4, y: 12 }, { x: 5, y: 12 }, { x: 7, y: 12 }, { x: 8, y: 12 }],
	link: [{ x: 9, y: 4 }, { x: 9, y: 5 }],
	storage: [{ x: 9, y: 2 }],
	tower: [{ x: 7, y: 0 }, { x: 0, y: 2 }, { x: 0, y: 11 }, { x: 9, y: 11 }, { x: 1, y: 12 }, { x: 9, y: 12 }],
	terminal: [{ x: 9, y: 0 }],
	nuker: [{ x: 9, y: 8 }],
	observer: [{ x: 9, y: 9 }],
	powerSpawn: [{ x: 9, y: 7 }],
	road: [{ x: -1, y: -2 }, { x: 0, y: -2 }, { x: 4, y: -2 }, { x: 5, y: -2 }, { x: 9, y: -2 }, { x: 10, y: -2 }, { x: -2, y: -1 },
	{ x: 0, y: -1 }, { x: 3, y: -1 }, { x: 4, y: -1 }, { x: 5, y: -1 }, { x: 7, y: -1 }, { x: 9, y: -1 }, { x: 10, y: -1 },
	{ x: 11, y: -1 }, { x: -2, y: 0 }, { x: -1, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 6, y: 0 }, { x: 8, y: 0 },
	{ x: 10, y: 0 }, { x: 11, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 3, y: 1 }, { x: 5, y: 1 }, { x: 7, y: 1 },
	{ x: 9, y: 1 }, { x: 10, y: 1 }, { x: -1, y: 2 }, { x: 4, y: 2 }, { x: 8, y: 2 }, { x: 10, y: 2 }, { x: 0, y: 3 },
	{ x: 1, y: 3 }, { x: 3, y: 3 }, { x: 5, y: 3 }, { x: 7, y: 3 }, { x: 9, y: 3 }, { x: 10, y: 3 }, { x: -1, y: 4 },
	{ x: 1, y: 4 }, { x: 2, y: 4 }, { x: 6, y: 4 }, { x: 9, y: 4 }, { x: 11, y: 4 }, { x: -2, y: 5 }, { x: 0, y: 5 },
	{ x: 1, y: 5 }, { x: 3, y: 5 }, { x: 5, y: 5 }, { x: 7, y: 5 }, { x: 9, y: 5 }, { x: 11, y: 5 }, { x: -2, y: 6 },
	{ x: 0, y: 6 }, { x: 4, y: 6 }, { x: 8, y: 6 }, { x: 9, y: 6 }, { x: 10, y: 6 }, { x: 11, y: 6 }, { x: -2, y: 7 },
	{ x: 0, y: 7 }, { x: 1, y: 7 }, { x: 3, y: 7 }, { x: 5, y: 7 }, { x: 7, y: 7 }, { x: 10, y: 7 }, { x: 11, y: 7 },
	{ x: -1, y: 8 }, { x: 1, y: 8 }, { x: 2, y: 8 }, { x: 6, y: 8 }, { x: 10, y: 8 }, { x: 0, y: 9 }, { x: 1, y: 9 },
	{ x: 3, y: 9 }, { x: 5, y: 9 }, { x: 7, y: 9 }, { x: 10, y: 9 }, { x: 0, y: 10 }, { x: 4, y: 10 }, { x: 8, y: 10 },
	{ x: 9, y: 10 }, { x: -1, y: 11 }, { x: 1, y: 11 }, { x: 3, y: 11 }, { x: 5, y: 11 }, { x: 7, y: 11 }, { x: 10, y: 11 },
	{ x: -2, y: 12 }, { x: -1, y: 12 }, { x: 0, y: 12 }, { x: 2, y: 12 }, { x: 6, y: 12 }, { x: 10, y: 12 }, { x: 11, y: 12 },
	{ x: -2, y: 13 }, { x: 0, y: 13 }, { x: 3, y: 13 }, { x: 4, y: 13 }, { x: 5, y: 13 }, { x: 7, y: 13 }, { x: 8, y: 13 },
	{ x: 9, y: 13 }, { x: 11, y: 13 }, { x: -1, y: 14 }, { x: 0, y: 14 }, { x: 4, y: 14 }, { x: 5, y: 14 }, { x: 9, y: 14 },
	{ x: 10, y: 14 }],
	rampart: [{ x: -3, y: -3 }, { x: -2, y: -3 }, { x: -1, y: -3 }, { x: 0, y: -3 }, { x: 1, y: -3 }, { x: 2, y: -3 }, { x: 3, y: -3 },
	{ x: 4, y: -3 }, { x: 5, y: -3 }, { x: 6, y: -3 }, { x: 7, y: -3 }, { x: 8, y: -3 }, { x: 9, y: -3 }, { x: 10, y: -3 },
	{ x: 11, y: -3 }, { x: 12, y: -3 }, { x: -3, y: -2 }, { x: 12, y: -2 }, { x: -3, y: -1 }, { x: 12, y: -1 }, { x: -3, y: 0 },
	{ x: 12, y: 0 }, { x: -3, y: 1 }, { x: 12, y: 1 }, { x: -3, y: 2 }, { x: 12, y: 2 }, { x: -3, y: 3 }, { x: 12, y: 3 },
	{ x: -3, y: 4 }, { x: 12, y: 4 }, { x: -3, y: 5 }, { x: 12, y: 5 }, { x: -3, y: 6 }, { x: 12, y: 6 }, { x: -3, y: 7 },
	{ x: 12, y: 7 }, { x: -3, y: 8 }, { x: 12, y: 8 }, { x: -3, y: 9 }, { x: 12, y: 9 }, { x: -3, y: 10 }, { x: 12, y: 10 },
	{ x: -3, y: 11 }, { x: 12, y: 11 }, { x: -3, y: 12 }, { x: 12, y: 12 }, { x: -3, y: 13 }, { x: 12, y: 13 }, { x: -3, y: 14 },
	{ x: 12, y: 14 }, { x: -3, y: 15 }, { x: -2, y: 15 }, { x: -1, y: 15 }, { x: 0, y: 15 }, { x: 1, y: 15 }, { x: 2, y: 15 },
	{ x: 3, y: 15 }, { x: 4, y: 15 }, { x: 5, y: 15 }, { x: 6, y: 15 }, { x: 7, y: 15 }, { x: 8, y: 15 }, { x: 9, y: 15 },
	{ x: 10, y: 15 }, { x: 11, y: 15 }, { x: 12, y: 15 }]
};


Blueprint__Default_Compact__Walled = {
	spawn: [{ x: 0, y: 0 }, { x: 0, y: 4 }, { x: 0, y: 8 }],
	extension: [{ x: 3, y: 0 }, { x: 4, y: 0 }, { x: 5, y: 0 }, { x: 2, y: 1 }, { x: 4, y: 1 }, { x: 6, y: 1 }, { x: 8, y: 1 },
	{ x: 1, y: 2 }, { x: 2, y: 2 }, { x: 3, y: 2 }, { x: 5, y: 2 }, { x: 6, y: 2 }, { x: 7, y: 2 }, { x: 2, y: 3 },
	{ x: 4, y: 3 }, { x: 6, y: 3 }, { x: 8, y: 3 }, { x: 3, y: 4 }, { x: 4, y: 4 }, { x: 5, y: 4 }, { x: 7, y: 4 },
	{ x: 8, y: 4 }, { x: 2, y: 5 }, { x: 4, y: 5 }, { x: 6, y: 5 }, { x: 8, y: 5 }, { x: 1, y: 6 }, { x: 2, y: 6 },
	{ x: 3, y: 6 }, { x: 5, y: 6 }, { x: 6, y: 6 }, { x: 7, y: 6 }, { x: 2, y: 7 }, { x: 4, y: 7 }, { x: 6, y: 7 },
	{ x: 8, y: 7 }, { x: 3, y: 8 }, { x: 4, y: 8 }, { x: 5, y: 8 }, { x: 7, y: 8 }, { x: 8, y: 8 }, { x: 2, y: 9 },
	{ x: 4, y: 9 }, { x: 6, y: 9 }, { x: 8, y: 9 }, { x: 1, y: 10 }, { x: 2, y: 10 }, { x: 3, y: 10 }, { x: 5, y: 10 },
	{ x: 6, y: 10 }, { x: 7, y: 10 }, { x: 2, y: 11 }, { x: 4, y: 11 }, { x: 6, y: 11 }, { x: 8, y: 11 }, { x: 3, y: 12 },
	{ x: 4, y: 12 }, { x: 5, y: 12 }, { x: 7, y: 12 }, { x: 8, y: 12 }],
	link: [{ x: 9, y: 4 }, { x: 9, y: 5 }],
	storage: [{ x: 9, y: 2 }],
	tower: [{ x: 7, y: 0 }, { x: 0, y: 2 }, { x: 0, y: 11 }, { x: 9, y: 11 }, { x: 1, y: 12 }, { x: 9, y: 12 }],
	terminal: [{ x: 9, y: 0 }],
	nuker: [{ x: 9, y: 8 }],
	observer: [{ x: 9, y: 9 }],
	powerSpawn: [{ x: 9, y: 7 }],
	road: [{ x: -1, y: -2 }, { x: 0, y: -2 }, { x: 4, y: -2 }, { x: 5, y: -2 }, { x: 9, y: -2 }, { x: 10, y: -2 }, { x: -2, y: -1 },
	{ x: 0, y: -1 }, { x: 3, y: -1 }, { x: 4, y: -1 }, { x: 5, y: -1 }, { x: 7, y: -1 }, { x: 9, y: -1 }, { x: 10, y: -1 },
	{ x: 11, y: -1 }, { x: -2, y: 0 }, { x: -1, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 6, y: 0 }, { x: 8, y: 0 },
	{ x: 10, y: 0 }, { x: 11, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 3, y: 1 }, { x: 5, y: 1 }, { x: 7, y: 1 },
	{ x: 9, y: 1 }, { x: 10, y: 1 }, { x: -1, y: 2 }, { x: 4, y: 2 }, { x: 8, y: 2 }, { x: 10, y: 2 }, { x: 0, y: 3 },
	{ x: 1, y: 3 }, { x: 3, y: 3 }, { x: 5, y: 3 }, { x: 7, y: 3 }, { x: 9, y: 3 }, { x: 10, y: 3 }, { x: -1, y: 4 },
	{ x: 1, y: 4 }, { x: 2, y: 4 }, { x: 6, y: 4 }, { x: 9, y: 4 }, { x: 11, y: 4 }, { x: -2, y: 5 }, { x: 0, y: 5 },
	{ x: 1, y: 5 }, { x: 3, y: 5 }, { x: 5, y: 5 }, { x: 7, y: 5 }, { x: 9, y: 5 }, { x: 11, y: 5 }, { x: -2, y: 6 },
	{ x: 0, y: 6 }, { x: 4, y: 6 }, { x: 8, y: 6 }, { x: 9, y: 6 }, { x: 10, y: 6 }, { x: 11, y: 6 }, { x: -2, y: 7 },
	{ x: 0, y: 7 }, { x: 1, y: 7 }, { x: 3, y: 7 }, { x: 5, y: 7 }, { x: 7, y: 7 }, { x: 10, y: 7 }, { x: 11, y: 7 },
	{ x: -1, y: 8 }, { x: 1, y: 8 }, { x: 2, y: 8 }, { x: 6, y: 8 }, { x: 10, y: 8 }, { x: 0, y: 9 }, { x: 1, y: 9 },
	{ x: 3, y: 9 }, { x: 5, y: 9 }, { x: 7, y: 9 }, { x: 10, y: 9 }, { x: 0, y: 10 }, { x: 4, y: 10 }, { x: 8, y: 10 },
	{ x: 9, y: 10 }, { x: -1, y: 11 }, { x: 1, y: 11 }, { x: 3, y: 11 }, { x: 5, y: 11 }, { x: 7, y: 11 }, { x: 10, y: 11 },
	{ x: -2, y: 12 }, { x: -1, y: 12 }, { x: 0, y: 12 }, { x: 2, y: 12 }, { x: 6, y: 12 }, { x: 10, y: 12 }, { x: 11, y: 12 },
	{ x: -2, y: 13 }, { x: 0, y: 13 }, { x: 3, y: 13 }, { x: 4, y: 13 }, { x: 5, y: 13 }, { x: 7, y: 13 }, { x: 8, y: 13 },
	{ x: 9, y: 13 }, { x: 11, y: 13 }, { x: -1, y: 14 }, { x: 0, y: 14 }, { x: 4, y: 14 }, { x: 5, y: 14 }, { x: 9, y: 14 },
	{ x: 10, y: 14 }],
	rampart: [{ x: -1, y: -3 }, { x: 0, y: -3 }, { x: 4, y: -3 }, { x: 5, y: -3 }, { x: 9, y: -3 }, { x: 10, y: -3 }, { x: -3, y: -1 },
	{ x: 12, y: -1 }, { x: -3, y: 0 }, { x: 12, y: 0 }, { x: 12, y: 4 }, { x: -3, y: 5 }, { x: 12, y: 5 }, { x: -3, y: 6 },
	{ x: 12, y: 6 }, { x: -3, y: 7 }, { x: 12, y: 7 }, { x: -3, y: 12 }, { x: 12, y: 12 }, { x: -3, y: 13 }, { x: 12, y: 13 },
	{ x: -1, y: 15 }, { x: 0, y: 15 }, { x: 4, y: 15 }, { x: 5, y: 15 }, { x: 9, y: 15 }, { x: 10, y: 15 }],
	constructedWall: [{ x: -3, y: -3 }, { x: -2, y: -3 }, { x: 1, y: -3 }, { x: 2, y: -3 }, { x: 3, y: -3 }, { x: 6, y: -3 }, { x: 7, y: -3 },
	{ x: 8, y: -3 }, { x: 11, y: -3 }, { x: 12, y: -3 }, { x: -3, y: -2 }, { x: 12, y: -2 }, { x: -3, y: 1 }, { x: 12, y: 1 },
	{ x: -3, y: 2 }, { x: 12, y: 2 }, { x: -3, y: 3 }, { x: 12, y: 3 }, { x: -3, y: 4 }, { x: -3, y: 8 }, { x: 12, y: 8 },
	{ x: -3, y: 9 }, { x: 12, y: 9 }, { x: -3, y: 10 }, { x: 12, y: 10 }, { x: -3, y: 11 }, { x: 12, y: 11 }, { x: -3, y: 14 },
	{ x: 12, y: 14 }, { x: -3, y: 15 }, { x: -2, y: 15 }, { x: 1, y: 15 }, { x: 2, y: 15 }, { x: 3, y: 15 }, { x: 6, y: 15 },
	{ x: 7, y: 15 }, { x: 8, y: 15 }, { x: 11, y: 15 }, { x: 12, y: 15 }]
};


Blueprint__Compact_Horizontal = { // Size (without walls) 13 x 8 ; Defensive offset -3, -3, +3, +3 ; No Labs!!
	spawn: [{ x: 0, y: 0 }, { x: 12, y: 0 }, { x: 12, y: 8 }],
	extension: [{ x: 2, y: 0 }, { x: 3, y: 0 }, { x: 4, y: 0 }, { x: 6, y: 0 }, { x: 7, y: 0 }, { x: 8, y: 0 }, { x: 1, y: 1 },
	{ x: 3, y: 1 }, { x: 5, y: 1 }, { x: 7, y: 1 }, { x: 9, y: 1 }, { x: 11, y: 1 }, { x: 1, y: 2 }, { x: 2, y: 2 },
	{ x: 4, y: 2 }, { x: 5, y: 2 }, { x: 6, y: 2 }, { x: 8, y: 2 }, { x: 9, y: 2 }, { x: 10, y: 2 }, { x: 1, y: 3 },
	{ x: 3, y: 3 }, { x: 5, y: 3 }, { x: 7, y: 3 }, { x: 9, y: 3 }, { x: 11, y: 3 }, { x: 2, y: 4 }, { x: 3, y: 4 },
	{ x: 4, y: 4 }, { x: 6, y: 4 }, { x: 7, y: 4 }, { x: 8, y: 4 }, { x: 10, y: 4 }, { x: 11, y: 4 }, { x: 1, y: 5 },
	{ x: 3, y: 5 }, { x: 5, y: 5 }, { x: 7, y: 5 }, { x: 9, y: 5 }, { x: 11, y: 5 }, { x: 0, y: 6 }, { x: 1, y: 6 },
	{ x: 2, y: 6 }, { x: 4, y: 6 }, { x: 5, y: 6 }, { x: 6, y: 6 }, { x: 8, y: 6 }, { x: 9, y: 6 }, { x: 10, y: 6 },
	{ x: 1, y: 7 }, { x: 3, y: 7 }, { x: 5, y: 7 }, { x: 7, y: 7 }, { x: 9, y: 7 }, { x: 2, y: 8 }, { x: 3, y: 8 },
	{ x: 4, y: 8 }, { x: 6, y: 8 }, { x: 7, y: 8 }, { x: 8, y: 8 }],
	link: [{ x: 12, y: 5 }, { x: 12, y: 6 }],
	storage: [{ x: 12, y: 4 }],
	tower: [{ x: 11, y: 0 }, { x: 0, y: 2 }, { x: 0, y: 4 }, { x: 0, y: 8 }, { x: 10, y: 8 }, { x: 11, y: 8 }],
	terminal: [{ x: 12, y: 2 }],
	nuker: [{ x: 10, y: 0 }],
	observer: [{ x: 12, y: 7 }],
	powerSpawn: [{ x: 11, y: 7 }],
	road: [{ x: -1, y: -2 }, { x: 0, y: -2 }, { x: 5, y: -2 }, { x: 6, y: -2 }, { x: 7, y: -2 }, { x: 12, y: -2 }, { x: 13, y: -2 },
	{ x: -2, y: -1 }, { x: 0, y: -1 }, { x: 2, y: -1 }, { x: 3, y: -1 }, { x: 4, y: -1 }, { x: 6, y: -1 }, { x: 7, y: -1 },
	{ x: 8, y: -1 }, { x: 10, y: -1 }, { x: 11, y: -1 }, { x: 12, y: -1 }, { x: 14, y: -1 }, { x: -2, y: 0 }, { x: -1, y: 0 },
	{ x: 1, y: 0 }, { x: 5, y: 0 }, { x: 9, y: 0 }, { x: 13, y: 0 }, { x: 14, y: 0 }, { x: 0, y: 1 }, { x: 2, y: 1 },
	{ x: 4, y: 1 }, { x: 6, y: 1 }, { x: 8, y: 1 }, { x: 10, y: 1 }, { x: 12, y: 1 }, { x: 13, y: 1 }, { x: -1, y: 2 },
	{ x: 3, y: 2 }, { x: 7, y: 2 }, { x: 11, y: 2 }, { x: 13, y: 2 }, { x: 0, y: 3 }, { x: 2, y: 3 }, { x: 4, y: 3 },
	{ x: 6, y: 3 }, { x: 8, y: 3 }, { x: 10, y: 3 }, { x: 12, y: 3 }, { x: 13, y: 3 }, { x: -2, y: 4 }, { x: -1, y: 4 },
	{ x: 1, y: 4 }, { x: 5, y: 4 }, { x: 9, y: 4 }, { x: 13, y: 4 }, { x: 14, y: 4 }, { x: 0, y: 5 }, { x: 2, y: 5 },
	{ x: 4, y: 5 }, { x: 6, y: 5 }, { x: 8, y: 5 }, { x: 10, y: 5 }, { x: 13, y: 5 }, { x: -1, y: 6 }, { x: 3, y: 6 },
	{ x: 7, y: 6 }, { x: 11, y: 6 }, { x: 13, y: 6 }, { x: 0, y: 7 }, { x: 2, y: 7 }, { x: 4, y: 7 }, { x: 6, y: 7 },
	{ x: 8, y: 7 }, { x: 10, y: 7 }, { x: -2, y: 8 }, { x: -1, y: 8 }, { x: 1, y: 8 }, { x: 5, y: 8 }, { x: 9, y: 8 },
	{ x: 13, y: 8 }, { x: 14, y: 8 }, { x: -2, y: 9 }, { x: 0, y: 9 }, { x: 2, y: 9 }, { x: 3, y: 9 }, { x: 4, y: 9 },
	{ x: 6, y: 9 }, { x: 7, y: 9 }, { x: 8, y: 9 }, { x: 10, y: 9 }, { x: 11, y: 9 }, { x: 12, y: 9 }, { x: 14, y: 9 },
	{ x: -1, y: 10 }, { x: 0, y: 10 }, { x: 5, y: 10 }, { x: 6, y: 10 }, { x: 7, y: 10 }, { x: 12, y: 10 }, { x: 13, y: 10 }],
	rampart: [{ x: -3, y: -3 }, { x: -2, y: -3 }, { x: -1, y: -3 }, { x: 0, y: -3 }, { x: 1, y: -3 }, { x: 2, y: -3 }, { x: 3, y: -3 },
	{ x: 4, y: -3 }, { x: 5, y: -3 }, { x: 6, y: -3 }, { x: 7, y: -3 }, { x: 8, y: -3 }, { x: 9, y: -3 }, { x: 10, y: -3 },
	{ x: 11, y: -3 }, { x: 12, y: -3 }, { x: 13, y: -3 }, { x: 14, y: -3 }, { x: 15, y: -3 }, { x: -3, y: -2 }, { x: 15, y: -2 },
	{ x: -3, y: -1 }, { x: 15, y: -1 }, { x: -3, y: 0 }, { x: 15, y: 0 }, { x: -3, y: 1 }, { x: 15, y: 1 }, { x: -3, y: 2 },
	{ x: 15, y: 2 }, { x: -3, y: 3 }, { x: 15, y: 3 }, { x: -3, y: 4 }, { x: 15, y: 4 }, { x: -3, y: 5 }, { x: 15, y: 5 },
	{ x: -3, y: 6 }, { x: 15, y: 6 }, { x: -3, y: 7 }, { x: 15, y: 7 }, { x: -3, y: 8 }, { x: 15, y: 8 }, { x: -3, y: 9 },
	{ x: 15, y: 9 }, { x: -3, y: 10 }, { x: 15, y: 10 }, { x: -3, y: 11 }, { x: -2, y: 11 }, { x: -1, y: 11 }, { x: 0, y: 11 },
	{ x: 1, y: 11 }, { x: 2, y: 11 }, { x: 3, y: 11 }, { x: 4, y: 11 }, { x: 5, y: 11 }, { x: 6, y: 11 }, { x: 7, y: 11 },
	{ x: 8, y: 11 }, { x: 9, y: 11 }, { x: 10, y: 11 }, { x: 11, y: 11 }, { x: 12, y: 11 }, { x: 13, y: 11 }, { x: 14, y: 11 },
	{ x: 15, y: 11 }]
};

Blueprint__Compact_Horizontal__Walled = {
	spawn: [{ x: 0, y: 0 }, { x: 12, y: 0 }, { x: 12, y: 8 }],
	extension: [{ x: 2, y: 0 }, { x: 3, y: 0 }, { x: 4, y: 0 }, { x: 6, y: 0 }, { x: 7, y: 0 }, { x: 8, y: 0 }, { x: 1, y: 1 },
	{ x: 3, y: 1 }, { x: 5, y: 1 }, { x: 7, y: 1 }, { x: 9, y: 1 }, { x: 11, y: 1 }, { x: 1, y: 2 }, { x: 2, y: 2 },
	{ x: 4, y: 2 }, { x: 5, y: 2 }, { x: 6, y: 2 }, { x: 8, y: 2 }, { x: 9, y: 2 }, { x: 10, y: 2 }, { x: 1, y: 3 },
	{ x: 3, y: 3 }, { x: 5, y: 3 }, { x: 7, y: 3 }, { x: 9, y: 3 }, { x: 11, y: 3 }, { x: 2, y: 4 }, { x: 3, y: 4 },
	{ x: 4, y: 4 }, { x: 6, y: 4 }, { x: 7, y: 4 }, { x: 8, y: 4 }, { x: 10, y: 4 }, { x: 11, y: 4 }, { x: 1, y: 5 },
	{ x: 3, y: 5 }, { x: 5, y: 5 }, { x: 7, y: 5 }, { x: 9, y: 5 }, { x: 11, y: 5 }, { x: 0, y: 6 }, { x: 1, y: 6 },
	{ x: 2, y: 6 }, { x: 4, y: 6 }, { x: 5, y: 6 }, { x: 6, y: 6 }, { x: 8, y: 6 }, { x: 9, y: 6 }, { x: 10, y: 6 },
	{ x: 1, y: 7 }, { x: 3, y: 7 }, { x: 5, y: 7 }, { x: 7, y: 7 }, { x: 9, y: 7 }, { x: 2, y: 8 }, { x: 3, y: 8 },
	{ x: 4, y: 8 }, { x: 6, y: 8 }, { x: 7, y: 8 }, { x: 8, y: 8 }],
	link: [{ x: 12, y: 5 }, { x: 12, y: 6 }],
	storage: [{ x: 12, y: 4 }],
	tower: [{ x: 11, y: 0 }, { x: 0, y: 2 }, { x: 0, y: 4 }, { x: 0, y: 8 }, { x: 10, y: 8 }, { x: 11, y: 8 }],
	terminal: [{ x: 12, y: 2 }],
	nuker: [{ x: 10, y: 0 }],
	observer: [{ x: 12, y: 7 }],
	powerSpawn: [{ x: 11, y: 7 }],
	road: [{ x: -1, y: -2 }, { x: 0, y: -2 }, { x: 5, y: -2 }, { x: 6, y: -2 }, { x: 7, y: -2 }, { x: 12, y: -2 }, { x: 13, y: -2 },
	{ x: -2, y: -1 }, { x: 0, y: -1 }, { x: 2, y: -1 }, { x: 3, y: -1 }, { x: 4, y: -1 }, { x: 6, y: -1 }, { x: 7, y: -1 },
	{ x: 8, y: -1 }, { x: 10, y: -1 }, { x: 11, y: -1 }, { x: 12, y: -1 }, { x: 14, y: -1 }, { x: -2, y: 0 }, { x: -1, y: 0 },
	{ x: 1, y: 0 }, { x: 5, y: 0 }, { x: 9, y: 0 }, { x: 13, y: 0 }, { x: 14, y: 0 }, { x: 0, y: 1 }, { x: 2, y: 1 },
	{ x: 4, y: 1 }, { x: 6, y: 1 }, { x: 8, y: 1 }, { x: 10, y: 1 }, { x: 12, y: 1 }, { x: 13, y: 1 }, { x: -1, y: 2 },
	{ x: 3, y: 2 }, { x: 7, y: 2 }, { x: 11, y: 2 }, { x: 13, y: 2 }, { x: 0, y: 3 }, { x: 2, y: 3 }, { x: 4, y: 3 },
	{ x: 6, y: 3 }, { x: 8, y: 3 }, { x: 10, y: 3 }, { x: 12, y: 3 }, { x: 13, y: 3 }, { x: -2, y: 4 }, { x: -1, y: 4 },
	{ x: 1, y: 4 }, { x: 5, y: 4 }, { x: 9, y: 4 }, { x: 13, y: 4 }, { x: 14, y: 4 }, { x: 0, y: 5 }, { x: 2, y: 5 },
	{ x: 4, y: 5 }, { x: 6, y: 5 }, { x: 8, y: 5 }, { x: 10, y: 5 }, { x: 13, y: 5 }, { x: -1, y: 6 }, { x: 3, y: 6 },
	{ x: 7, y: 6 }, { x: 11, y: 6 }, { x: 13, y: 6 }, { x: 0, y: 7 }, { x: 2, y: 7 }, { x: 4, y: 7 }, { x: 6, y: 7 },
	{ x: 8, y: 7 }, { x: 10, y: 7 }, { x: -2, y: 8 }, { x: -1, y: 8 }, { x: 1, y: 8 }, { x: 5, y: 8 }, { x: 9, y: 8 },
	{ x: 13, y: 8 }, { x: 14, y: 8 }, { x: -2, y: 9 }, { x: 0, y: 9 }, { x: 2, y: 9 }, { x: 3, y: 9 }, { x: 4, y: 9 },
	{ x: 6, y: 9 }, { x: 7, y: 9 }, { x: 8, y: 9 }, { x: 10, y: 9 }, { x: 11, y: 9 }, { x: 12, y: 9 }, { x: 14, y: 9 },
	{ x: -1, y: 10 }, { x: 0, y: 10 }, { x: 5, y: 10 }, { x: 6, y: 10 }, { x: 7, y: 10 }, { x: 12, y: 10 }, { x: 13, y: 10 }],
	rampart: [{ x: -1, y: -3 }, { x: 0, y: -3 }, { x: 5, y: -3 }, { x: 6, y: -3 }, { x: 7, y: -3 }, { x: 12, y: -3 }, { x: 13, y: -3 },
	{ x: -3, y: -1 }, { x: 15, y: -1 }, { x: -3, y: 0 }, { x: 15, y: 0 }, { x: -3, y: 4 }, { x: 15, y: 4 }, { x: -3, y: 8 },
	{ x: 15, y: 8 }, { x: -3, y: 9 }, { x: 15, y: 9 }, { x: -1, y: 11 }, { x: 0, y: 11 }, { x: 5, y: 11 }, { x: 6, y: 11 },
	{ x: 7, y: 11 }, { x: 12, y: 11 }, { x: 13, y: 11 }],
	constructedWall: [{ x: -3, y: -3 }, { x: -2, y: -3 }, { x: 1, y: -3 }, { x: 2, y: -3 }, { x: 3, y: -3 }, { x: 4, y: -3 }, { x: 8, y: -3 },
	{ x: 9, y: -3 }, { x: 10, y: -3 }, { x: 11, y: -3 }, { x: 14, y: -3 }, { x: 15, y: -3 }, { x: -3, y: -2 }, { x: 15, y: -2 },
	{ x: -3, y: 1 }, { x: 15, y: 1 }, { x: -3, y: 2 }, { x: 15, y: 2 }, { x: -3, y: 3 }, { x: 15, y: 3 }, { x: -3, y: 5 },
	{ x: 15, y: 5 }, { x: -3, y: 6 }, { x: 15, y: 6 }, { x: -3, y: 7 }, { x: 15, y: 7 }, { x: -3, y: 10 }, { x: 15, y: 10 },
	{ x: -3, y: 11 }, { x: -2, y: 11 }, { x: 1, y: 11 }, { x: 2, y: 11 }, { x: 3, y: 11 }, { x: 4, y: 11 }, { x: 8, y: 11 },
	{ x: 9, y: 11 }, { x: 10, y: 11 }, { x: 11, y: 11 }, { x: 14, y: 11 }, { x: 15, y: 11 }]

};

Blueprint__Compact_Vertical = {
	spawn: [ {x: 0, y: 0}, {x: 0, y: 10}, {x: 8, y: 10} ],
	extension: [ {x: 6, y: 0}, {x: 1, y: 1}, {x: 2, y: 1}, {x: 3, y: 1}, {x: 5, y: 1}, {x: 6, y: 1}, {x: 7, y: 1},
		{x: 0, y: 2}, {x: 2, y: 2}, {x: 4, y: 2}, {x: 6, y: 2}, {x: 8, y: 2}, {x: 0, y: 3}, {x: 1, y: 3},
		{x: 3, y: 3}, {x: 4, y: 3}, {x: 5, y: 3}, {x: 7, y: 3}, {x: 8, y: 3}, {x: 0, y: 4}, {x: 2, y: 4},
		{x: 4, y: 4}, {x: 6, y: 4}, {x: 8, y: 4}, {x: 1, y: 5}, {x: 2, y: 5}, {x: 3, y: 5}, {x: 5, y: 5},
		{x: 6, y: 5}, {x: 7, y: 5}, {x: 0, y: 6}, {x: 2, y: 6}, {x: 4, y: 6}, {x: 6, y: 6}, {x: 8, y: 6},
		{x: 0, y: 7}, {x: 1, y: 7}, {x: 3, y: 7}, {x: 4, y: 7}, {x: 5, y: 7}, {x: 7, y: 7}, {x: 8, y: 7},
		{x: 0, y: 8}, {x: 2, y: 8}, {x: 4, y: 8}, {x: 6, y: 8}, {x: 8, y: 8}, {x: 1, y: 9}, {x: 2, y: 9},
		{x: 3, y: 9}, {x: 5, y: 9}, {x: 6, y: 9}, {x: 7, y: 9}, {x: 2, y: 10}, {x: 4, y: 10}, {x: 6, y: 10},
		{x: 3, y: 11}, {x: 4, y: 11}, {x: 5, y: 11}, {x: 4, y: 12} ],
	link: [ {x: 0, y: 11}, {x: 2, y: 12} ],
	storage: [ {x: 1, y: 11} ],
	tower: [ {x: 2, y: 0}, {x: 4, y: 0}, {x: 8, y: 0}, {x: 8, y: 11}, {x: 0, y: 12}, {x: 8, y: 12} ],
	terminal: [ {x: 6, y: 12} ],
	observer: [ {x: 7, y: 12} ],
	powerSpawn: [ {x: 7, y: 11} ],
	road: [ {x: -1, y: -2}, {x: 0, y: -2}, {x: 1, y: -2}, {x: 6, y: -2}, {x: 7, y: -2}, {x: 8, y: -2}, {x: -2, y: -1},
		{x: 0, y: -1}, {x: 2, y: -1}, {x: 4, y: -1}, {x: 6, y: -1}, {x: 8, y: -1}, {x: 10, y: -1}, {x: -2, y: 0},
		{x: -1, y: 0}, {x: 1, y: 0}, {x: 3, y: 0}, {x: 5, y: 0}, {x: 7, y: 0}, {x: 9, y: 0}, {x: 10, y: 0},
		{x: 0, y: 1}, {x: 4, y: 1}, {x: 8, y: 1}, {x: -1, y: 2}, {x: 1, y: 2}, {x: 3, y: 2}, {x: 5, y: 2},
		{x: 7, y: 2}, {x: 9, y: 2}, {x: -2, y: 3}, {x: -1, y: 3}, {x: 2, y: 3}, {x: 6, y: 3}, {x: 9, y: 3},
		{x: 10, y: 3}, {x: -2, y: 4}, {x: -1, y: 4}, {x: 1, y: 4}, {x: 3, y: 4}, {x: 5, y: 4}, {x: 7, y: 4},
		{x: 9, y: 4}, {x: 10, y: 4}, {x: 0, y: 5}, {x: 4, y: 5}, {x: 8, y: 5}, {x: -1, y: 6}, {x: 1, y: 6},
		{x: 3, y: 6}, {x: 5, y: 6}, {x: 7, y: 6}, {x: 9, y: 6}, {x: -1, y: 7}, {x: 2, y: 7}, {x: 6, y: 7},
		{x: 9, y: 7}, {x: -2, y: 8}, {x: -1, y: 8}, {x: 1, y: 8}, {x: 3, y: 8}, {x: 5, y: 8}, {x: 7, y: 8},
		{x: 9, y: 8}, {x: 10, y: 8}, {x: -2, y: 9}, {x: 0, y: 9}, {x: 4, y: 9}, {x: 8, y: 9}, {x: 10, y: 9},
		{x: -1, y: 10}, {x: 1, y: 10}, {x: 3, y: 10}, {x: 5, y: 10}, {x: 7, y: 10}, {x: 9, y: 10}, {x: -1, y: 11},
		{x: 2, y: 11}, {x: 6, y: 11}, {x: 9, y: 11}, {x: -2, y: 12}, {x: -1, y: 12}, {x: 1, y: 12}, {x: 3, y: 12},
		{x: 5, y: 12}, {x: 9, y: 12}, {x: 10, y: 12}, {x: -2, y: 13}, {x: 0, y: 13}, {x: 2, y: 13}, {x: 4, y: 13},
		{x: 6, y: 13}, {x: 7, y: 13}, {x: 8, y: 13}, {x: 9, y: 13}, {x: 10, y: 13}, {x: -1, y: 14}, {x: 0, y: 14},
		{x: 1, y: 14}, {x: 6, y: 14}, {x: 7, y: 14}, {x: 8, y: 14} ],
	rampart: [ {x: -3, y: -3}, {x: -2, y: -3}, {x: -1, y: -3}, {x: 0, y: -3}, {x: 1, y: -3}, {x: 2, y: -3}, {x: 3, y: -3},
		{x: 4, y: -3}, {x: 5, y: -3}, {x: 6, y: -3}, {x: 7, y: -3}, {x: 8, y: -3}, {x: 9, y: -3}, {x: 10, y: -3},
		{x: 11, y: -3}, {x: -3, y: -2}, {x: 11, y: -2}, {x: -3, y: -1}, {x: 11, y: -1}, {x: -3, y: 0}, {x: 11, y: 0},
		{x: -3, y: 1}, {x: 11, y: 1}, {x: -3, y: 2}, {x: 11, y: 2}, {x: -3, y: 3}, {x: 11, y: 3}, {x: -3, y: 4},
		{x: 11, y: 4}, {x: -3, y: 5}, {x: 11, y: 5}, {x: -3, y: 6}, {x: 11, y: 6}, {x: -3, y: 7}, {x: 11, y: 7},
		{x: -3, y: 8}, {x: 11, y: 8}, {x: -3, y: 9}, {x: 11, y: 9}, {x: -3, y: 10}, {x: 11, y: 10}, {x: -3, y: 11},
		{x: 11, y: 11}, {x: -3, y: 12}, {x: 11, y: 12}, {x: -3, y: 13}, {x: 11, y: 13}, {x: -3, y: 14}, {x: 11, y: 14},
		{x: -3, y: 15}, {x: -2, y: 15}, {x: -1, y: 15}, {x: 0, y: 15}, {x: 1, y: 15}, {x: 2, y: 15}, {x: 3, y: 15},
		{x: 4, y: 15}, {x: 5, y: 15}, {x: 6, y: 15}, {x: 7, y: 15}, {x: 8, y: 15}, {x: 9, y: 15}, {x: 10, y: 15},
	{x: 11, y: 15} ],
};

Blueprint__Compact_Vertical__Walled = {
	spawn: [ {x: 0, y: 0}, {x: 0, y: 10}, {x: 8, y: 10} ],
	extension: [ {x: 6, y: 0}, {x: 1, y: 1}, {x: 2, y: 1}, {x: 3, y: 1}, {x: 5, y: 1}, {x: 6, y: 1}, {x: 7, y: 1},
		{x: 0, y: 2}, {x: 2, y: 2}, {x: 4, y: 2}, {x: 6, y: 2}, {x: 8, y: 2}, {x: 0, y: 3}, {x: 1, y: 3},
		{x: 3, y: 3}, {x: 4, y: 3}, {x: 5, y: 3}, {x: 7, y: 3}, {x: 8, y: 3}, {x: 0, y: 4}, {x: 2, y: 4},
		{x: 4, y: 4}, {x: 6, y: 4}, {x: 8, y: 4}, {x: 1, y: 5}, {x: 2, y: 5}, {x: 3, y: 5}, {x: 5, y: 5},
		{x: 6, y: 5}, {x: 7, y: 5}, {x: 0, y: 6}, {x: 2, y: 6}, {x: 4, y: 6}, {x: 6, y: 6}, {x: 8, y: 6},
		{x: 0, y: 7}, {x: 1, y: 7}, {x: 3, y: 7}, {x: 4, y: 7}, {x: 5, y: 7}, {x: 7, y: 7}, {x: 8, y: 7},
		{x: 0, y: 8}, {x: 2, y: 8}, {x: 4, y: 8}, {x: 6, y: 8}, {x: 8, y: 8}, {x: 1, y: 9}, {x: 2, y: 9},
		{x: 3, y: 9}, {x: 5, y: 9}, {x: 6, y: 9}, {x: 7, y: 9}, {x: 2, y: 10}, {x: 4, y: 10}, {x: 6, y: 10},
		{x: 3, y: 11}, {x: 4, y: 11}, {x: 5, y: 11}, {x: 4, y: 12} ],
	link: [ {x: 0, y: 11}, {x: 2, y: 12} ],
	storage: [ {x: 1, y: 11} ],
	tower: [ {x: 2, y: 0}, {x: 4, y: 0}, {x: 8, y: 0}, {x: 8, y: 11}, {x: 0, y: 12}, {x: 8, y: 12} ],
	terminal: [ {x: 6, y: 12} ],
	observer: [ {x: 7, y: 12} ],
	powerSpawn: [ {x: 7, y: 11} ],
	road: [ {x: -1, y: -2}, {x: 0, y: -2}, {x: 1, y: -2}, {x: 6, y: -2}, {x: 7, y: -2}, {x: 8, y: -2}, {x: -2, y: -1},
		{x: 0, y: -1}, {x: 2, y: -1}, {x: 4, y: -1}, {x: 6, y: -1}, {x: 8, y: -1}, {x: 10, y: -1}, {x: -2, y: 0},
		{x: -1, y: 0}, {x: 1, y: 0}, {x: 3, y: 0}, {x: 5, y: 0}, {x: 7, y: 0}, {x: 9, y: 0}, {x: 10, y: 0},
		{x: 0, y: 1}, {x: 4, y: 1}, {x: 8, y: 1}, {x: -1, y: 2}, {x: 1, y: 2}, {x: 3, y: 2}, {x: 5, y: 2},
		{x: 7, y: 2}, {x: 9, y: 2}, {x: -2, y: 3}, {x: -1, y: 3}, {x: 2, y: 3}, {x: 6, y: 3}, {x: 9, y: 3},
		{x: 10, y: 3}, {x: -2, y: 4}, {x: -1, y: 4}, {x: 1, y: 4}, {x: 3, y: 4}, {x: 5, y: 4}, {x: 7, y: 4},
		{x: 9, y: 4}, {x: 10, y: 4}, {x: 0, y: 5}, {x: 4, y: 5}, {x: 8, y: 5}, {x: -1, y: 6}, {x: 1, y: 6},
		{x: 3, y: 6}, {x: 5, y: 6}, {x: 7, y: 6}, {x: 9, y: 6}, {x: -1, y: 7}, {x: 2, y: 7}, {x: 6, y: 7},
		{x: 9, y: 7}, {x: -2, y: 8}, {x: -1, y: 8}, {x: 1, y: 8}, {x: 3, y: 8}, {x: 5, y: 8}, {x: 7, y: 8},
		{x: 9, y: 8}, {x: 10, y: 8}, {x: -2, y: 9}, {x: 0, y: 9}, {x: 4, y: 9}, {x: 8, y: 9}, {x: 10, y: 9},
		{x: -1, y: 10}, {x: 1, y: 10}, {x: 3, y: 10}, {x: 5, y: 10}, {x: 7, y: 10}, {x: 9, y: 10}, {x: -1, y: 11},
		{x: 2, y: 11}, {x: 6, y: 11}, {x: 9, y: 11}, {x: -2, y: 12}, {x: -1, y: 12}, {x: 1, y: 12}, {x: 3, y: 12},
		{x: 5, y: 12}, {x: 9, y: 12}, {x: 10, y: 12}, {x: -2, y: 13}, {x: 0, y: 13}, {x: 2, y: 13}, {x: 4, y: 13},
		{x: 6, y: 13}, {x: 7, y: 13}, {x: 8, y: 13}, {x: 9, y: 13}, {x: 10, y: 13}, {x: -1, y: 14}, {x: 0, y: 14},
		{x: 1, y: 14}, {x: 6, y: 14}, {x: 7, y: 14}, {x: 8, y: 14} ],
	rampart: [ {x: -1, y: -3}, {x: 0, y: -3}, {x: 1, y: -3}, {x: 6, y: -3}, {x: 7, y: -3}, {x: 8, y: -3}, {x: -3, y: -1},
		{x: 11, y: -1}, {x: -3, y: 0}, {x: 11, y: 0}, {x: -3, y: 3}, {x: 11, y: 3}, {x: -3, y: 4}, {x: 11, y: 4},
		{x: -3, y: 8}, {x: 11, y: 8}, {x: -3, y: 9}, {x: 11, y: 9}, {x: -3, y: 12}, {x: 11, y: 12}, {x: -3, y: 13},
		{x: 11, y: 13}, {x: -1, y: 15}, {x: 0, y: 15}, {x: 1, y: 15}, {x: 6, y: 15}, {x: 7, y: 15}, {x: 8, y: 15} ],
	constructedWall: [ {x: -3, y: -3}, {x: -2, y: -3}, {x: 2, y: -3}, {x: 3, y: -3}, {x: 4, y: -3}, {x: 5, y: -3}, {x: 9, y: -3},
		{x: 10, y: -3}, {x: 11, y: -3}, {x: -3, y: -2}, {x: 11, y: -2}, {x: -3, y: 1}, {x: 11, y: 1}, {x: -3, y: 2},
		{x: 11, y: 2}, {x: -3, y: 5}, {x: 11, y: 5}, {x: -3, y: 6}, {x: 11, y: 6}, {x: -3, y: 7}, {x: 11, y: 7},
		{x: -3, y: 10}, {x: 11, y: 10}, {x: -3, y: 11}, {x: 11, y: 11}, {x: -3, y: 14}, {x: 11, y: 14}, {x: -3, y: 15},
		{x: -2, y: 15}, {x: 2, y: 15}, {x: 3, y: 15}, {x: 4, y: 15}, {x: 5, y: 15}, {x: 9, y: 15}, {x: 10, y: 15},
		{x: 11, y: 15} ]

};



/* ***********************************************************
 *	[sec07a] DEFINITIONS: CONSOLE COMMANDS
 * *********************************************************** */

let Console = {
	Init: function () {
		let help_main = new Array();
		let help_allies = new Array();
		let help_blueprint = new Array();
		let help_empire = new Array();
		let help_labs = new Array();
		let help_log = new Array();
		let help_path = new Array();
		let help_pause = new Array();
		let help_profiler = new Array();
		let help_resources = new Array();
		let help_visuals = new Array();



		/* Main help() list */
		help_main.push("List of help() arguments, e.g. help(blueprint):");
		help_main.push(`- "allies" \t Manage ally list`);
		help_main.push(`- "blueprint" \t Settings for automatic base building`);
		help_main.push(`- "empire" \t Miscellaneous empire and colony management`);
		help_main.push(`- "labs" \t Management of lab functions/reactions`);
		help_main.push(`- "log" \t Logs for statistical output`);
		help_main.push(`- "path" \t Utilities for enhancing creep pathfinding abilities`);
		help_main.push(`- "pause" \t Utilities for pausing specific creep or colony functions`);
		help_main.push(`- "profiler" \t Built-in CPU profiler`);
		help_main.push(`- "resources" \t Management of resources, empire-wide sharing and/or selling to market`);
		help_main.push(`- "visuals" \t Manage visual objects (RoomVisual class)`);
		help_main.push("");


		help_profiler.push("profiler.run(cycles)");
		help_profiler.push("profiler.stop()");



		help_allies.push("allies.add(ally)");

		allies = new Object();
		allies.add = function (ally) {
			if (_.get(Memory, ["hive", "allies"]) == null) _.set(Memory["hive", "allies"], []);
			Memory["hive"]["allies"].push(ally);
			return `<font color=\"#D3FFA3\">[Console]</font> Player ${ally} added to ally list.`
		};

		help_allies.push("allies.add_list([ally1, ally2, ...])");

		allies.add_list = function (allyList) {
			Array.prototype.push.apply(Memory["hive"]["allies"], allyList);
			return `<font color=\"#D3FFA3\">[Console]</font> Players added to ally list.`
		};

		help_allies.push("allies.remove(ally)");

		allies.remove = function (ally) {
			let index = _.get(Memory, ["hive", "allies"]).indexOf(ally);
			if (index >= 0) {
				Memory["hive"]["allies"].splice(index, 1);
				return `<font color=\"#D3FFA3\">[Console]</font> Player ${ally} removed from ally list.`
			} else {
				return `<font color=\"#D3FFA3\">[Console]</font> Error: Player ${ally} not found in ally list.`
			}
		};

		help_allies.push("allies.clear()");
		allies.clear = function () {
			_.set(Memory, ["hive", "allies"], []);
			return `<font color=\"#D3FFA3\">[Console]</font> Ally list cleared.`
		};


		blueprint = new Object();
		help_blueprint.push("blueprint.set_layout(rmName, originX, originY, layoutName)");

		blueprint.set_layout = function (rmName, originX, originY, layoutName) {
			_.set(Memory, ["rooms", rmName, "layout"], { origin: { x: originX, y: originY }, name: layoutName });
			return `<font color=\"#D3FFA3\">[Console]</font> Blueprint layout set for ${rmName}.`;
		};

		help_blueprint.push("blueprint.block(rmName, x, y)");

		blueprint.block = function (rmName, x, y) {
			if (_.get(Memory, ["rooms", rmName, "layout", "blocked_areas"]) == null)
				Memory["rooms"][rmName]["layout"]["blocked_areas"] = [];
			Memory["rooms"][rmName]["layout"]["blocked_areas"].push({ start: { x: x, y: y }, end: { x: x, y: y } });
			return `<font color=\"#D3FFA3\">[Console]</font> Blueprint position blocked for ${rmName} at (${x}, ${y}).`;
		};

		help_blueprint.push("blueprint.block_area(rmName, startX, startY, endX, endY)");

		blueprint.block_area = function (rmName, startX, startY, endX, endY) {
			if (endX == null)
				endX = startX;
			if (endY == null)
				endY = startY;

			if (_.get(Memory, ["rooms", rmName, "layout", "blocked_areas"]) == null)
				Memory["rooms"][rmName]["layout"]["blocked_areas"] = [];
			Memory["rooms"][rmName]["layout"]["blocked_areas"].push({ start: { x: startX, y: startY }, end: { x: endX, y: endY } });
			return `<font color=\"#D3FFA3\">[Console]</font> Blueprint area blocked for ${rmName} from (${startX}, ${startY}) to (${endX}, ${endY}).`;
		};

		help_blueprint.push("blueprint.request(rmName)");

		blueprint.request = function (rmName) {
			_.set(Memory, ["hive", "pulses", "blueprint", "request"], rmName);
			return `<font color=\"#D3FFA3\">[Console]</font> Setting Blueprint() request for ${rmName}; Blueprint() will run this request next tick.`;
		};

		help_blueprint.push("blueprint.reset()");
		blueprint.reset = function () {
			if (_.get(Memory, ["hive", "pulses", "blueprint"], null) != null)
				delete Memory.hive.pulses.blueprint;				
			return `<font color=\"#D3FFA3\">[Console]</font> Resetting Blueprint() cycles; Blueprint() will initiate next tick.`;
		};

		help_blueprint.push("blueprint.redefine_links()");
		blueprint.redefine_links = function () {
			_.each(_.filter(Game.rooms, r => { return (r.controller != null && r.controller.my); }), r => {
				if (_.has(Memory, ["rooms", r.name, "links"]))
					delete Memory["rooms"][r.name]["links"];
			});

			_.set(Memory, ["hive", "pulses", "reset_links"], true);
			return `<font color=\"#D3FFA3\">[Console]</font> Resetting all link definitions; will redefine next tick.`;
		};

		help_blueprint.push("blueprint.toggle_walls(rmName)");

		blueprint.toggle_walls = function (rmName) {
			// For manual disabling of whether passive defensive will be placed (useful in order to prioritize RCL)
			if (_.get(Memory, ["rooms", rmName, "layout", "place_defenses"], false) == true)
				_.set(Memory, ["rooms", rmName, "layout", "place_defenses"], false)
			else
				_.set(Memory, ["rooms", rmName, "layout", "place_defenses"], true)

			return `<font color=\"#D3FFA3\">[Console]</font> Blueprint placing defensive walls and ramparts: ${_.get(Memory, ["rooms", rmName, "layout", "place_defenses"], true)}`;
		};


		log = new Object();

		help_log.push("log.all()");

		log.all = function () {
			this.nukers();
			this.labs();
			this.controllers();
			this.resources();
			return `<font color=\"#D3FFA3\">[Console]</font> Main logs printed.`;
		}

		help_log.push("log.can_build()");

		log.can_build = function () {
			let rooms = _.filter(Game.rooms, n => { return n.controller != null && n.controller.my; });
			console.log("<font color=\"#D3FFA3\">[Console]</font> Buildable structures:");
			for (let r in rooms) {
				room = rooms[r];

				let output = `${room.name}: `;
				for (let s in CONTROLLER_STRUCTURES) {
					if (s == "road" || s == "constructedWall" || s == "rampart")
						continue;

					let amount = CONTROLLER_STRUCTURES[s][room.controller.level]
						- room.find(FIND_STRUCTURES, { filter: t => { return t.structureType == s; } }).length;
					output += amount < 1 ? "" : `${amount} x ${s};  `;
				}
				console.log(output);
			}
			return "<font color=\"#D3FFA3\">[Console]</font> Report generated";
		};

		help_log.push("log.controllers()");

		log.controllers = function () {
			console.log("<font color=\"#D3FFA3\">[Console]</font> Room Controllers:");
			let output = "<table>";
			_.each(_.sortBy(_.sortBy(_.filter(Game.rooms,
				r => { return r.controller != null && r.controller.my; }),
				r => { return -r.controller.progress; }),
				r => { return -r.controller.level; }), r => {
					output += `<tr><td><font color=\"#D3FFA3\">${r.name}:</font>  (${r.controller.level})  </td> `
						+ `<td>${r.controller.progress}  </td><td>  /  </td><td>${r.controller.progressTotal}    </td> `
						+ `<td>(${(r.controller.progress / r.controller.progressTotal * 100).toFixed()} %)</td></tr>`;
				});
			console.log(`${output}</table>`);
			return "<font color=\"#D3FFA3\">[Console]</font> Report generated";
		};

		help_log.push("log.populations()");

		log.populations = function () {
			console.log("<font color=\"#D3FFA3\">[Console]</font> Populations for Colonies and Mining Sites (default and set_population):");

			let colonies = _.keys(_.filter(Game.rooms, room => { return (room.controller != null && room.controller.my); }));
			let mining = _.keys(_.get(Memory, ["sites", "mining"]));
			let rooms = _.keys(_.get(Memory, "rooms"));
			let output = "<table>";

			for (let i = 0; i < rooms.length; i++) {
				if (_.indexOf(colonies, rooms[i]) >= 0 || _.indexOf(mining, rooms[i]) >= 0) {
					if (_.has(Memory, ["rooms", rooms[i], "set_population"])) {
						output += `<tr><td><font color=\"#D3FFA3\">${(rooms[i])}</font>: \t</td>`;
						let populations = _.keys(Memory["rooms"][rooms[i]]["set_population"]);
						for (let j = 0; j < populations.length; j++) {
							output += `<td>${populations[j]}: </td> `
							+ `<td>lvl ${_.get(Memory, ["rooms", rooms[i], "set_population", populations[j], "level"])}</td>`
							+ `<td> x ${_.get(Memory, ["rooms", rooms[i], "set_population", populations[j], "amount"])} \t</td>  `;
						}
						output += `</tr>`;
					} else {
						output += `<tr><td><font color=\"#D3FFA3\">${(rooms[i])}</font>: \t</td>`
							+`<td>default</td></tr>`;
					}
				}
			}
			console.log(`${output}</table>`);
			return "<font color=\"#D3FFA3\">[Console]</font> Report generated";
		}

		help_log.push("log.labs()");

		log.labs = function () {
			let output = "<font color=\"#D3FFA3\">[Console]</font> Lab Report<br>"
				+ "<table><tr><th>Room \t</th><th>Mineral \t</th><th>Amount \t</th><th>Target Amount \t</th><th>Reagent #1 \t</th><th>Reagent #2</th></tr>";

			_.each(_.keys(_.get(Memory, ["resources", "labs", "reactions"])), r => {
				let rxn = Memory["resources"]["labs"]["reactions"][r];

				let amount = 0;
				_.each(_.filter(Game.rooms,
					r => { return r.controller != null && r.controller.my && (r.storage || r.terminal); }),
					r => { amount += r.store(_.get(rxn, "mineral")); });

				let reagents = "";
				_.each(getReagents(_.get(rxn, "mineral")),
					reagent => {

						let r_amount = 0;
						_.each(_.filter(Game.rooms,
							r => { return r.controller != null && r.controller.my && (r.storage || r.terminal); }),
							r => { r_amount += r.store(reagent); });
						reagents += `<td>${reagent}: \t${r_amount}</td>`;
					});

				output += `<tr><td>${r}</td><td>${_.get(rxn, "mineral")}</td><td>${amount}</td><td>(${_.get(rxn, "amount")})${reagents}</tr>`
			});

			console.log(`${output}</table>`);
			return "<font color=\"#D3FFA3\">[Console]</font> Report generated";
		};

		help_log.push("log.resources()");

		log.resources = function (resource = null, limit = 1) {
			let resource_list = resource != null ? [resource] : RESOURCES_ALL;
			let room_list = _.filter(Game.rooms, r => { return r.controller != null && r.controller.my && (r.storage || r.terminal); });

			let output = `<font color=\"#FFF"><tr><th>Resource\t</th><th>Total \t\t</th>`;
			_.each(room_list, r => { output += `<th><font color=\"#${r.terminal ? "5DB65B" : "B65B5B"}\">${r.name}</font> \t</th>`; });

			_.each(resource_list, res => {
				let amount = 0;
				let output_rooms = "";

				_.each(room_list, r => {
					let a = r.store(res);
					amount += a;
					output_rooms += `<td>${a}</td>`
				});

				if (amount >= limit)
					output += `<tr><td>${res}</td><td>${amount}</td> ${output_rooms} </tr>`;
			});

			console.log(`<font color=\"#D3FFA3">log.resources</font> <table>${output}</table>`);
			return "<font color=\"#D3FFA3\">[Console]</font> Report generated";
		};

		help_log.push("log.remote_mining()");

		log.remote_mining = function () {
			let output = "";
			let remote = _.get(Memory, ["sites", "mining"]);

			_.each(_.filter(Game.rooms, r => { return r.controller != null && r.controller.my; }), r => {
				output += `<tr><td>${r.name}</td><td>  ->  </td>`;
				_.each(_.filter(Object.keys(remote), rem => { return rem != r.name && _.get(remote[rem], "colony") == r.name; }), rem => { output += `<td>  ${rem}  </td>`; });
				output += `</tr>`;
			});

			console.log(`<font color=\"#D3FFA3">log.mining</font><table>${output}</table>`);
			return "<font color=\"#D3FFA3\">[Console]</font> Report generated";
		};

		help_log.push("log.spawn_assist()");

		log.spawn_assist = function () {
			console.log("<font color=\"#D3FFA3\">[Console]</font> Active Spawn Assists:");

			let rooms = _.filter(Game.rooms, room => { return (room.controller != null && room.controller.my); });
			let output = "<table><tr><th>Colony \t\t</th><th>Assisted By:</th></tr>";
			for (let i = 0; i < rooms.length; i++) {
				let room = rooms[i].name;
				let spawn_rooms = _.get(Memory, ["rooms", room, "spawn_assist", "rooms"], null);
				if (spawn_rooms != null) {
					output += `<tr><td><font color=\"#D3FFA3\">${(room)}</font>: \t</td>`;
					_.each(spawn_rooms, r => { output += `<td>${r} \t</td>`; });
					output += `</tr>`;
				} else {
					output += `<tr><td><font color=\"#D3FFA3\">${(room)}</font>: \t</td>`
						+`<td>inactive</td></tr>`;
				}
			}
			console.log(`${output}</table>`);
			return "<font color=\"#D3FFA3\">[Console]</font> Report generated";
		}

		help_log.push("log.storage()");

		log.storage = function () {
			console.log(`<font color=\"#D3FFA3">log-storage</font>`);

			for (let i = 0; i < Object.keys(Game.rooms).length; i++) {
				let room = Game.rooms[Object.keys(Game.rooms)[i]];
				if (room.storage != null) {
					if (_.sum(room.storage) == 0) {
						console.log(`${room.name} storage: empty`);
					} else {
						let output = `<font color=\"#D3FFA3\">${room.name}</font> storage (${parseInt(_.sum(room.storage.store) / room.storage.storeCapacity * 100)}%): `;
						for (let res in room.storage.store) {
							if (room.storage.store[res] > 0)
								output += `<font color=\"#D3FFA3\">${res}</font>: ${_.floor(room.storage.store[res] / 1000)}k;  `;
						}
						console.log(output);
					}
				}

				if (room.terminal != null) {
					if (_.sum(room.terminal) == 0) {
						console.log(`${room.name} terminal: empty`);
					} else {
						let output = `<font color=\"#D3FFA3\">${room.name}</font> terminal (${parseInt(_.sum(room.terminal.store) / room.terminal.storeCapacity * 100)}%): `;
						for (let res in room.terminal.store) {
							if (room.terminal.store[res] > 0)
								output += `<font color=\"#D3FFA3\">${res}</font>: ${_.floor(room.terminal.store[res] / 1000)}k;  `;
						}
						console.log(output);
					}
				}
			}
			return "<font color=\"#D3FFA3\">[Console]</font> Report generated";
		};

		help_log.push("log.nukers()");

		log.nukers = function () {
			console.log("<font color=\"#D3FFA3\">[Console]</font> Nukers:");
			_.each(_.filter(Game.rooms, r => { return r.controller != null && r.controller.my; }), r => {
				let nuker = _.head(r.find(FIND_STRUCTURES, { filter: (s) => { return s.structureType == "nuker"; } }));
				if (nuker != null) {
					console.log(`<font color=\"#D3FFA3\">${r.name}:</font> `
						+ `<font color=\"#${nuker.cooldown == 0 ? "47FF3E" : "FF3E3E"}\">`
						+ `cooldown: ${nuker.cooldown};</font>  `
						+ `<font color=\"#${nuker.energy == nuker.energyCapacity ? "47FF3E" : "FF3E3E"}\">`
						+ `energy: ${nuker.energy} (${parseFloat(nuker.energy / nuker.energyCapacity * 100).toFixed(0)}%);</font>  `
						+ `<font color=\"#${nuker.ghodium == nuker.ghodiumCapacity ? "47FF3E" : "FF3E3E"}\">`
						+ `ghodium: ${nuker.ghodium} (${parseFloat(nuker.ghodium / nuker.ghodiumCapacity * 100).toFixed(0)}%)</font>`);
				}
			});
			return "<font color=\"#D3FFA3\">[Console]</font> Report generated";
		};


		help_labs.push("labs.set_reaction(mineral, amount, priority)");

		labs = new Object();
		labs.set_reaction = function (mineral, amount, priority) {
			_.set(Memory, ["resources", "labs", "targets", mineral], { mineral: mineral, amount: amount, priority: priority });
			return `<font color=\"#D3FFA3\">[Console]</font> ${mineral} reaction target set to ${amount} (priority ${priority}).`;
		};

		help_labs.push("labs.set_boost(labID, mineral, role, destination, ticks)");

		labs.set_boost = function (labID, mineral, role, destination, ticks) {
			let lab = Game.getObjectById(labID);
			let rmName = lab.pos.roomName;
			let labDefinitions = _.get(Memory, ["rooms", rmName, "labs", "definitions"]);
			if (lab == null) return;

			if (labDefinitions == null)
				labDefinitions = [];

			labDefinitions.push(
				{
					action: "boost", mineral: mineral, lab: labID, role: role, dest: destination,
					expire: (ticks == null ? null : Game.time + ticks)
				});

			_.set(Memory, ["rooms", rmName, "labs", "definitions"], labDefinitions);
			delete Memory["hive"]["pulses"]["lab"];
			return `<font color=\"#D3FFA3\">[Console]</font> Boost added for ${mineral} to ${role} from ${labID}`;
		};

		help_labs.push("labs.clear_reactions()");

		labs.clear_reactions = function () {
			_.set(Memory, ["resources", "labs", "targets"], new Object());
			delete Memory["hive"]["pulses"]["lab"];
			return `<font color=\"#D3FFA3\">[Console]</font> All lab mineral targets cleared.`;
		};

		help_labs.push("labs.clear_boosts(rmName)");

		labs.clear_boosts = function (rmName) {
			delete Memory["rooms"][rmName]["labs"]["definitions"];
			delete Memory["hive"]["pulses"]["lab"];
			return `<font color=\"#D3FFA3\">[Console]</font> All boosts cleared for ${rmName}`;
		};

		help_labs.push("labs.renew_assignments()");

		labs.renew_assignments = function () {
			delete Memory["hive"]["pulses"]["lab"];
			return `<font color=\"#D3FFA3\">[Console]</font> Labs will renew definitions and reaction assignments next tick.`;
		};

		help_labs.push("labs.clear_assignments()");

		labs.clear_assignments = function () {
			delete Memory["resources"]["labs"]["reactions"];
			return `<font color=\"#D3FFA3\">[Console]</font> Lab reaction assignments cleared- will reassign next lab pulse.`;
		};


		help_resources.push("resources.overflow_cap(capAmount)");

		resources = new Object();
		resources.overflow_cap = function (amount) {
			_.set(Memory, ["resources", "to_overflow"], amount);
			return `<font color=\"#D3FFA3\">[Console]</font> Energy overflow cap set to ${amount}.`;
		};

		help_resources.push("resources.market_cap(resource, capAmount)");

		resources.market_cap = function (resource, amount) {
			_.set(Memory, ["resources", "to_market", resource], amount);
			return `<font color=\"#D3FFA3\">[Console]</font> ${resource} market overflow set to ${amount}.`;
		};

		help_resources.push("resources.send(orderName, rmFrom, rmTo, resource, amount)");

		resources.send = function (orderName, rmFrom, rmTo, resource, amount) {
			_.set(Memory, ["resources", "terminal_orders", orderName], { room: rmTo, from: rmFrom, resource: resource, amount: amount, priority: 1 });
			return `<font color=\"#D3FFA3\">[Console]</font> Order set at Memory["resources"]["terminal_orders"][${orderName}]; delete from Memory to cancel.`;
		};

		help_resources.push("resources.market_sell(orderName, marketOrderID, rmFrom, amount)");

		resources.market_sell = function (orderName, marketOrderID, rmFrom, amount) {
			_.set(Memory, ["resources", "terminal_orders", orderName], { market_id: marketOrderID, amount: amount, from: rmFrom, priority: 4 });
			return `<font color=\"#D3FFA3\">[Console]</font> Order set at Memory["resources"]["terminal_orders"][${orderName}]; delete from Memory to cancel.`;
		};

		help_resources.push("resources.market_buy(orderName, marketOrderID, rmTo, amount)");

		resources.market_buy = function (orderName, marketOrderID, rmTo, amount) {
			_.set(Memory, ["resources", "terminal_orders", orderName], { market_id: marketOrderID, amount: amount, to: rmTo, priority: 4 });
			return `<font color=\"#D3FFA3\">[Console]</font> Order set at Memory["resources", "terminal_orders"][${orderName}]; delete from Memory to cancel.`;
		};

		help_resources.push("resources.clear_market_cap()");

		resources.clear_market_cap = function () {
			_.set(Memory, ["resources", "to_market"], new Object());
			return `<font color=\"#D3FFA3\">[Console]</font> Market overflow limits deleted; existing transactions can be deleted with resources.clear_transactions().`;
		};

		help_resources.push("resources.clear_transactions()");

		resources.clear_transactions = function () {
			_.set(Memory, ["resources", "terminal_orders"], new Object());
			return `<font color=\"#D3FFA3\">[Console]</font> All terminal transactions cleared.`;
		};


		empire = new Object();

		help_empire.push("empire.combat(combatID, rmColony, rmTarget, listSpawnRooms, listRoute, tactic)");
		help_empire.push(" - tactic 'waves': { type: 'waves', spawn_repeat: t/f, rally_pos: new RoomPosition(rallyX, rallyY, rallyRoom), target_creeps: t/f, target_structures: t/f, target_list: [], to_occupy: t/f }");
		help_empire.push(" - tactic 'trickle': { type: 'trickle', target_creeps: t/f, target_structures: t/f, target_list: [], to_occupy: t/f }");
		help_empire.push(" - tactic 'occupy': { type: 'occupy', target_creeps: t/f, target_structures: t/f, target_list: [] }");
		help_empire.push(" - tactic 'dismantle': { type: 'dismantle', target_list: [] }");
		help_empire.push(" - tactic 'tower_drain': { type: 'tower_drain', rally_pos: new RoomPosition(rallyX, rallyY, rallyRoom), drain_pos: new RoomPosition(drainX, drainY, drainRoom) }");
		help_empire.push(" - tactic 'controller': { type: 'controller', to_occupy: t/f }");

		empire.combat = function (combat_id, colony, target_room, list_spawns, list_route, tactic) {
			_.set(Memory, ["sites", "combat", combat_id],
				{
					colony: colony, target_room: target_room, list_spawns: list_spawns,
					list_route: list_route, tactic: tactic
				});
			return `<font color=\"#D3FFA3\">[Console]</font> Combat request added to Memory.sites.combat.${combat_id} ... to cancel, delete the entry.`;
		};

		help_empire.push("");

		help_empire.push("empire.set_threat(roomName, level)  ... NONE, LOW, MEDIUM, HIGH")
		empire.set_threat = function (room_name, level) {
			_.set(Memory, ["rooms", room_name, "defense", "threat_level"], level);
			return `<font color=\"#D3FFA3\">[Console]</font> Threat level for room ${room_name} set.`;
		};

		help_empire.push("empire.set_threat_all(level)  ... NONE, LOW, MEDIUM, HIGH")
		empire.set_threat_all = function (level) {
			for (let i in Memory.rooms)
				_.set(Memory, ["rooms", i, "defense", "threat_level"], level);
			return `<font color=\"#D3FFA3\">[Console]</font> Threat level for all rooms set.`;
		};

		help_empire.push("empire.wall_target(hitpoints)  ... hitpoints can be null to reset")
		empire.wall_target = function (hitpoints) {
			if (hitpoints == null) {
				for (let i in Memory.rooms)
					if (_.has(Memory, ["rooms", i, "defense", "wall_hp_target"]))
						delete Memory["rooms"][i]["defense"]["wall_hp_target"];
				return `<font color=\"#D3FFA3\">[Console]</font> Wall/rampart hitpoint target reset to default for all rooms.`;
			} else {
				for (let i in Memory.rooms)
					_.set(Memory, ["rooms", i, "defense", "wall_hp_target"], hitpoints);
				return `<font color=\"#D3FFA3\">[Console]</font> Wall/rampart hitpoint target set for all rooms.`;
			}
		};

		help_empire.push("empire.set_camp(room_pos)")
		empire.set_camp = function (room_pos) {
			_.set(Memory, ["rooms", room_pos.roomName, "camp"], room_pos);
			return `<font color=\"#D3FFA3\">[Console]</font> Defensive camp set for room ${room_pos.roomName}.`;
		};

		help_empire.push("");
		help_empire.push("empire.colonize(rmFrom, rmTarget, {origin: {x: baseX, y: baseY}, name: layoutName}, focusDefense, [listRoute])");

		empire.colonize = function (from, target, layout, focus_defense, list_route) {
			_.set(Memory, ["sites", "colonization", target], { from: from, target: target, layout: layout, focus_defense: focus_defense, list_route: list_route });
			return `<font color=\"#D3FFA3\">[Console]</font> Colonization request added to Memory.sites.colonization.${target} ... to cancel, delete the entry.`;
		};

		help_empire.push("empire.spawn_assist(rmToAssist, [listRooms], [listRoute])");
		empire.spawn_assist = function (room_assist, list_rooms, list_route) {
			_.set(Memory, ["rooms", room_assist, "spawn_assist"], { rooms: list_rooms, list_route: list_route });
			return `<font color=\"#D3FFA3\">[Console]</font> Spawn assist added to Memory.rooms.${room_assist}.spawn_assist ... to cancel, delete the entry.`;
		};

		help_empire.push("empire.remote_mining(rmColony, rmHarvest, hasKeepers, [listRoute], [listSpawnAssistRooms], {customPopulation})");
		empire.remote_mining = function (rmColony, rmHarvest, hasKeepers, listRoute, listSpawnAssistRooms, customPopulation) {
			if (rmColony == null || rmHarvest == null)
				return `<font color=\"#D3FFA3\">[Console]</font> Error, invalid entry for remote_mining()`;

			_.set(Memory, ["sites", "mining", rmHarvest], { colony: rmColony, has_keepers: hasKeepers, list_route: listRoute, spawn_assist: listSpawnAssistRooms, population: customPopulation });
			return `<font color=\"#D3FFA3\">[Console]</font> Remote mining added to Memory.sites.mining.${rmHarvest} ... to cancel, delete the entry.`;
		};

		help_empire.push("empire.set_sign(message)")
		help_empire.push("empire.set_sign(message, rmName)")
		empire.set_sign = function (message, rmName) {
			/* Sorting algorithm for left -> right, top -> bottom (in SW sector!! Reverse sortBy() for other sectors...
				* Ensure quote.length == room.length!! Place in main.js

				let quote = [];
				let rooms = _.sortBy(_.sortBy(_.filter(Game.rooms,
					r => {return r.controller != null && r.controller.my}),
					r => {return 0 - r.name.substring(1).split("S")[0]}),
					r => {return r.name.substring(1).split("S")[1]});
				for (let i = 0; i < rooms.length; i++) {
					set_sign(quote[i], rooms[i].name);
				}
			*/

			if (rmName != null) {
				_.set(Memory, ["hive", "signs", rmName], message);
				return `<font color=\"#D3FFA3\">[Console]</font> Message for ${rmName} set.`;
			} else {
				_.set(Memory, ["hive", "signs", "default"], message);
				return `<font color=\"#D3FFA3\">[Console]</font> Default message set.`;
			}
		}

		help_empire.push("");
		help_empire.push("empire.clear_deprecated_memory()")
		empire.clear_deprecated_memory = function () {

			_.each(Memory.rooms, r => {
				delete r.tasks;
				delete r.structures;
			});

			return `<font color=\"#D3FFA3\">[Console]</font> Deleted deprecated Memory objects.`;
		};

		path = new Object();
		help_path.push("path.road(rmName, startX, startY, endX, endY)");

		path.road = function (rmName, startX, startY, endX, endY) {
			let room = Game.rooms[rmName];
			if (room == null)
				return `<font color=\"#D3FFA3\">[Console]</font> Error, ${rmName} not found.`;

			let from = new RoomPosition(startX, startY, rmName);
			let to = new RoomPosition(endX, endY, rmName);
			let path = room.findPath(from, to, { ignoreCreeps: true });
			for (let i = 0; i < path.length; i++)
				room.createConstructionSite(path[i].x, path[i].y, "road");
			room.createConstructionSite(startX, startY, "road");
			room.createConstructionSite(endX, endY, "road");

			return `<font color=\"#D3FFA3\">[Console]</font> Construction sites placed in ${rmName} for road from (${startX}, ${startY}) to (${endX}, ${endY}).`;
		};

		help_path.push("path.exit_tile(exit_pos)");

		path.exit_tile = function (exit_pos) {
			// Specifies preferred exit tiles to assist inter-room pathfinding
			if (!(exit_pos.x == 0 || exit_pos.x == 49 || exit_pos.y == 0 || exit_pos.y == 49)) {
				return `<font color=\"#D3FFA3\">[Console]</font> Invalid preferred exit tile position; must be an exit tile!`;
			}

			if (_.get(Memory, ["hive", "paths", "exits", "rooms", exit_pos.roomName]) == null)
				_.set(Memory, ["hive", "paths", "exits", "rooms", exit_pos.roomName], new Array());
			Memory["hive"]["paths"]["exits"]["rooms"][exit_pos.roomName].push(exit_pos);
			return `<font color=\"#D3FFA3\">[Console]</font> Preferred exit tile position added to Memory.hive.paths.exits.rooms.${exit_pos.roomName}`;
		};

		help_path.push("path.exit_area(roomName, startX, startY, endX, endY)");

		path.exit_area = function (room_name, start_x, start_y, end_x, end_y) {
			for (let x = start_x; x <= end_x; x++) {
				for (let y = start_y; y <= end_y; y++) {
					path.exit_tile(new RoomPosition(x, y, room_name));
				}
			}

			return `<font color=\"#D3FFA3\">[Console]</font> Preferred exit tile position added to Memory.hive.paths.exits.rooms.${room_name}`;
		};

		help_path.push("path.prefer(prefer_pos)");

		path.prefer = function (prefer_pos) {
			// Lowers the cost of specific tiles (e.g. swamp), so creeps take shorter paths through swamps rather than ERR_NO_PATH
			if (_.get(Memory, ["hive", "paths", "prefer", "rooms", prefer_pos.roomName]) == null)
				_.set(Memory, ["hive", "paths", "prefer", "rooms", prefer_pos.roomName], new Array());
			Memory["hive"]["paths"]["prefer"]["rooms"][prefer_pos.roomName].push(prefer_pos);
			return `<font color=\"#D3FFA3\">[Console]</font> Preference position added to Memory.hive.paths.prefer.rooms.${prefer_pos.roomName}`;
		};

		help_path.push("path.prefer_area(roomName, startX, startY, endX, endY)");

		path.prefer_area = function (room_name, start_x, start_y, end_x, end_y) {
			if (_.get(Memory, ["hive", "paths", "prefer", "rooms", room_name]) == null)
				_.set(Memory, ["hive", "paths", "prefer", "rooms", room_name], new Array());

			for (let x = start_x; x <= end_x; x++) {
				for (let y = start_y; y <= end_y; y++) {
					Memory["hive"]["paths"]["prefer"]["rooms"][room_name].push(new RoomPosition(x, y, room_name));
				}
			}

			return `<font color=\"#D3FFA3\">[Console]</font> Preference positions added to Memory.hive.paths.prefer.rooms.${room_name}`;
		};

		help_path.push("path.avoid(avoid_pos)");

		path.avoid = function (avoid_pos) {
			if (_.get(Memory, ["hive", "paths", "avoid", "rooms", avoid_pos.roomName]) == null)
				_.set(Memory, ["hive", "paths", "avoid", "rooms", avoid_pos.roomName], new Array());
			Memory["hive"]["paths"]["avoid"]["rooms"][avoid_pos.roomName].push(avoid_pos);
			return `<font color=\"#D3FFA3\">[Console]</font> Avoid position added to Memory.hive.paths.avoid.rooms.${avoid_pos.roomName}`;
		};

		help_path.push("path.avoid_area(roomName, startX, startY, endX, endY)");

		path.avoid_area = function (room_name, start_x, start_y, end_x, end_y) {
			if (_.get(Memory, ["hive", "paths", "avoid", "rooms", room_name]) == null)
				_.set(Memory, ["hive", "paths", "avoid", "rooms", room_name], new Array());

			for (let x = start_x; x <= end_x; x++) {
				for (let y = start_y; y <= end_y; y++) {
					Memory["hive"]["paths"]["avoid"]["rooms"][room_name].push(new RoomPosition(x, y, room_name));
				}
			}

			return `<font color=\"#D3FFA3\">[Console]</font> Avoid positions added to Memory.hive.paths.avoid.rooms.${room_name}`;
		};

		help_path.push("path.avoid_radius(roomName, centerX, centerY, radius)");

		path.avoid_radius = function (room_name, center_x, center_y, radius) {
			if (_.get(Memory, ["hive", "paths", "avoid", "rooms", room_name]) == null)
				_.set(Memory, ["hive", "paths", "avoid", "rooms", room_name], new Array());

			for (let x = Math.max(center_x - radius, 0); x <= Math.min(center_x + radius, 49); x++) {
				for (let y = Math.max(center_y - radius, 0); y <= Math.min(center_y + radius, 49); y++) {
					Memory["hive"]["paths"]["avoid"]["rooms"][room_name].push(new RoomPosition(x, y, room_name));
				}
			}

			return `<font color=\"#D3FFA3\">[Console]</font> Avoid positions added to Memory.hive.paths.avoid.rooms.${room_name}`;
		};

		help_path.push("path.reset(roomName)");

		path.reset = function (room_name) {
			delete Memory["hive"]["paths"]["avoid"]["rooms"][room_name];
			delete Memory["hive"]["paths"]["prefer"]["rooms"][room_name];
			delete Memory["hive"]["paths"]["exits"]["rooms"][room_name];
			return `<font color=\"#D3FFA3\">[Console]</font> Path modifiers reset for ${room_name}`;
		};


		visuals = new Object();
		help_visuals.push("visuals.toggle_path()");

		visuals.toggle_path = function () {
			if (_.get(Memory, ["hive", "visuals", "show_path"], false) == true)
				_.set(Memory, ["hive", "visuals", "show_path"], false)
			else
				_.set(Memory, ["hive", "visuals", "show_path"], true)

			return `<font color=\"#D3FFA3\">[Console]</font> Visuals for paths toggled to be shown: ${_.get(Memory, ["hive", "visuals", "show_path"], false)}`;
		};

		help_visuals.push("visuals.toggle_repair()");

		visuals.toggle_repair = function () {
			if (_.get(Memory, ["hive", "visuals", "show_repair"], false) == true)
				_.set(Memory, ["hive", "visuals", "show_repair"], false)
			else
				_.set(Memory, ["hive", "visuals", "show_repair"], true)

			return `<font color=\"#D3FFA3\">[Console]</font> Visuals for repairs toggled to be shown: ${_.get(Memory, ["hive", "visuals", "show_repair"], false)}`;
		};


		pause = new Object();

		help_pause.push("pause.mineral_extraction()")
		pause.mineral_extraction = function () {
			_.set(Memory, ["hive", "pause", "extracting"], true);
			return `<font color=\"#D3FFA3\">[Console]</font> Pausing mineral extraction- delete Memory.hive.pause.extracting to resume.`;
		};

		help_pause.push("pause.refill_bucket()")
		pause.refill_bucket = function () {
			_.set(Memory, ["hive", "pause", "bucket"], true);
			return `<font color=\"#D3FFA3\">[Console]</font> Pausing main.js to refill bucket.`;
		};



		help = function (submenu) {
			let menu = new Array()
			if (submenu == null)
				menu = help_main;
			else {
				switch (submenu.toString().toLowerCase()) {
					case "allies": menu = help_allies; break;
					case "blueprint": menu = help_blueprint; break;
					case "empire": menu = help_empire; break;
					case "labs": menu = help_labs; break;
					case "log": menu = help_log; break;
					case "path": menu = help_path; break;
					case "pause": menu = help_pause; break;
					case "profiler": menu = help_profiler; break;
					case "resources": menu = help_resources; break;
					case "visuals": menu = help_visuals; break;
				}
			}

			console.log(`<font color=\"#D3FFA3\">Command list:</font> <br>${menu.join("<br>")}<br><br>`);
			return `<font color=\"#D3FFA3\">[Console]</font> Help("${submenu}") list complete`;
		};
	}
};



/* ***********************************************************
 *	[sec08a] DEFINITIONS: VISUAL ELEMENTS
 * *********************************************************** */

let Stats_Visual = {

	Init: function () {
		if (_.get(Memory, ["hive", "visuals", "show_path"], false) == true)
			this.Show_Path();

		if (_.get(Memory, ["hive", "visuals", "show_repair"], false) == true) {
			this.Show_Repair();
			if (isPulse_Long() || _.keys(Memory.hive.visuals.repair_levels).length == 0)
				this.Compile_Repair();
		} else {
			_.set(Memory, ["hive", "visuals", "repair_levels"], null);
		}
	},

	Show_Path: function () {
		// Display pathfinding visuals
		_.each(_.keys(_.get(Memory, ["hive", "paths", "prefer", "rooms"])), r => {
			_.each(_.get(Memory, ["hive", "paths", "prefer", "rooms", r]), p => {
				new RoomVisual(r).circle(p, { fill: "green", stroke: "green", radius: 0.15, opacity: 0.25 });
			});
		});
		_.each(_.keys(_.get(Memory, ["hive", "paths", "avoid", "rooms"])), r => {
			_.each(_.get(Memory, ["hive", "paths", "avoid", "rooms", r]), p => {
				new RoomVisual(r).circle(p, { fill: "red", stroke: "red", radius: 0.15, opacity: 0.25 });
			});
		});
		_.each(_.keys(_.get(Memory, ["hive", "paths", "exits", "rooms"])), r => {
			_.each(_.get(Memory, ["hive", "paths", "exits", "rooms", r]), p => {
				new RoomVisual(r).circle(p, { fill: "green", radius: 0.4, opacity: 0.25 });
			});
		});
		_.each(_.keys(Memory.rooms), r => {
			if (_.get(Memory, ["rooms", r, "camp"]) != null)
				new RoomVisual(r).circle(_.get(Memory, ["rooms", r, "camp"]),
					{ fill: "orange", stroke: "pink", radius: 0.3, opacity: 0.25 });
		});
	},

	Show_Repair: function () {
		// Display repair levels for ramparts and walls
		_.each(_.get(Memory, ["hive", "visuals", "repair_levels"]), l => {
			if (_.get(l, ["pos", "roomName"]) != null && _.get(l, "percent") != null) {
				let percent = new String(l["percent"]);
				new RoomVisual(l["pos"]["roomName"]).text(
					`${percent.substr(0, percent.indexOf('.'))}%`,
					l["pos"], { font: (percent < 80 ? 0.45 : 0.35), color: "white" });
			}
		});
	},

	Compile_Repair: function () {
		// Compile repair levels for ramparts and walls
		_.set(Memory, ["hive", "visuals", "repair_levels"], new Array());
		_.each(_.filter(Game.rooms, r => { return r.controller != null && r.controller.my }), r => {
			_.each(_.filter(r.find(FIND_STRUCTURES),
				s => { return s.structureType == "constructedWall" || s.structureType == "rampart"; }), w => {
					let p = w.hits / _.get(Memory, ["rooms", r.name, "structures", `${w.structureType}-${w.id}`, "targetHits"], r.getWallTarget()) * 100;
					Memory["hive"]["visuals"]["repair_levels"].push({ pos: w.pos, percent: p });
				})
		});
	}
};



/* ***********************************************************
 *	[sec09a] DEFINITIONS: CPU PROFILING
 * *********************************************************** */

let Stats_CPU = {

	Init: function () {
		profiler = new Object();
		profiler.run = function (cycles) {
			_.set(Memory, ["hive", "profiler", "cycles"], (cycles == null) ? 1 : cycles);
			_.set(Memory, ["hive", "profiler", "cycles_total"], (cycles == null) ? 1 : cycles);
			_.set(Memory, ["hive", "profiler", "status"], "on");
			_.set(Memory, ["hive", "profiler", "pulses"], new Object());
			return "<font color=\"#D3FFA3\">[CPU]</font> Profiler started"
		};

		profiler.stop = function () {
			_.set(Memory, ["hive", "profiler", "cycles"], 0);
			return "<font color=\"#D3FFA3\">[CPU]</font> Profiler stopped"
		};

		if (_.get(Memory, ["hive", "profiler"]) == null)
			_.set(Memory, ["hive", "profiler"], new Object());

		if (_.get(Memory, ["hive", "profiler", "status"]) == null)
			_.set(Memory, ["hive", "profiler", "status"], "off");

		if (_.get(Memory, ["hive", "profiler", "status"]) != "on")
			return;

		if (_.get(Memory, ["hive", "profiler", "cycles"]) == null)
			_.set(Memory, ["hive", "profiler", "cycles"], 0);
		else
			_.set(Memory, ["hive", "profiler", "cycles"], _.get(Memory, ["hive", "profiler", "cycles"]) - 1);

		if (_.get(Memory, ["hive", "profiler", "current"]) == null)
			_.set(Memory, ["hive", "profiler", "current"], new Object());

		if (isPulse_Short())
			_.set(Memory, ["hive", "profiler", "pulses", "short"], _.get(Memory, ["hive", "profiler", "pulses", "short"], 0) + 1);
		if (isPulse_Mid())
			_.set(Memory, ["hive", "profiler", "pulses", "mid"], _.get(Memory, ["hive", "profiler", "pulses", "mid"], 0) + 1);
		if (isPulse_Long())
			_.set(Memory, ["hive", "profiler", "pulses", "long"], _.get(Memory, ["hive", "profiler", "pulses", "long"], 0) + 1);
		if (isPulse_Spawn())
			_.set(Memory, ["hive", "profiler", "pulses", "spawn"], _.get(Memory, ["hive", "profiler", "pulses", "spawn"], 0) + 1);
		if (isPulse_Lab())
			_.set(Memory, ["hive", "profiler", "pulses", "lab"], _.get(Memory, ["hive", "profiler", "pulses", "lab"], 0) + 1);
	},

	Start: function (room, name) {
		if (_.get(Memory, ["hive", "profiler", "status"]) != "on")
			return;

		_.set(Memory, ["hive", "profiler", "current", room, name,
			_.get(Memory, ["hive", "profiler", "cycles"]),
			"start"], Game.cpu.getUsed());
	},

	End: function (room, name) {
		if (_.get(Memory, ["hive", "profiler", "status"]) != "on")
			return;

		let cycle = Memory["hive"]["profiler"]["cycles"];
		_.set(Memory, ["hive", "profiler", "current", room, name, cycle, "used"],
			Game.cpu.getUsed() - _.get(Memory, ["hive", "profiler", "current", room, name, cycle, "start"]));
	},

	Finish: function () {
		if (_.get(Memory, ["hive", "profiler", "status"]) != "on")
			return;

		if (_.get(Memory, ["hive", "profiler", "cycles"]) <= 0) {
			let total_cycles = _.get(Memory, ["hive", "profiler", "cycles_total"]);

			console.log(`<font color=\"#D3FFA3">Pulses during profiling: \n`
				+ `Short:\t ${_.get(Memory, ["hive", "profiler", "pulses", "short"], 0)} \n`
				+ `Mid:\t ${_.get(Memory, ["hive", "profiler", "pulses", "mid"], 0)} \n`
				+ `Long:\t ${_.get(Memory, ["hive", "profiler", "pulses", "long"], 0)} \n`
				+ `Spawn:\t ${_.get(Memory, ["hive", "profiler", "pulses", "spawn"], 0)} \n`
				+ `Lab:\t ${_.get(Memory, ["hive", "profiler", "pulses", "lab"], 0)} \n`);

			for (let r in _.get(Memory, ["hive", "profiler", "current"])) {
				let output = "";
				let room_used = 0, room_cycles = 0;

				for (let n in _.get(Memory, ["hive", "profiler", "current", r])) {
					let used = 0;
					let cycles = Object.keys(_.get(Memory, ["hive", "profiler", "current", r, n])).length;
					_.forEach(_.get(Memory, ["hive", "profiler", "current", r, n]), c => { used += _.get(c, "used", 0); });
					used = ((used > 0 == true) ? used : 0);
					output += `<tr><td>(${parseFloat(used).toFixed(2)} / ${cycles})</td><td>${parseFloat(used / cycles).toFixed(2)}</td><td>${n}</td></tr>`;

					room_used += used;
					if (typeof (room_cycles) != "number")
						room_cycles = 0;
					room_cycles = Math.max(room_cycles, cycles);
				}

				console.log(`<font color=\"#D3FFA3">CPU report for ${r} \n`
					+ `Room Total: ${parseFloat(room_used).toFixed(2)} : `
					+ `Room Mean: ${parseFloat(room_used / total_cycles).toFixed(2)}</font> `
					+ `<table><tr><th>Total / Cycles\t  </th><th>Mean\t  </th><th>Function</th></tr>`
					+ `${output}</table>`);
			}

			_.set(Memory, ["hive", "profiler", "status"], "off");
			_.set(Memory, ["hive", "profiler", "current"], new Object());	// Wipe for the next use
		} else if (_.get(Memory, ["hive", "profiler", "cycles"]) % 5 == 0) {
			console.log(`<font color=\"#D3FFA3\">[CPU]</font> Profiler running, ${_.get(Memory, ["hive", "profiler", "cycles"])} ticks remaining.`);
		}
	}
};



/* ***********************************************************
 *	[sec10a] DEFINITIONS: GRAFANA STATISTICS
 * *********************************************************** */

let Stats_Grafana = {

	Run: function () {
		// Periodically reset to remove unused keys or interval data
		if (Game.time % 100 == 0) {
			_.each(_.filter(Game.rooms,
				room => { return room.controller != null && room.controller.my; }),
				room => { _.set(Memory, ["stats", "colonies", room.name, "population"], new Object()); });
		}

		if (Game.time % 500 == 0)
			_.set(Memory, "stats", new Object());


		_.set(Memory, ["stats", "cpu", "tick"], Game.time);
		_.set(Memory, ["stats", "cpu", "bucket"], Game.cpu.bucket);
		_.set(Memory, ["stats", "cpu", "used"], Game.cpu.getUsed());

		if (Game.time % 5 == 0) {
			_.set(Memory, ["stats", "gcl", "level"], Game.gcl.level);
			_.set(Memory, ["stats", "gcl", "progress"], Game.gcl.progress);
			_.set(Memory, ["stats", "gcl", "progress_total"], Game.gcl.progressTotal);
			_.set(Memory, ["stats", "gcl", "progress_percent"], (Game.gcl.progress / Game.gcl.progressTotal * 100));

			_.set(Memory, ["stats", "creeps", "total"], _.keys(Game.creeps).length);

			_.each(_.get(Game, "spawns"), s => {
				_.set(Memory, ["stats", "colonies", s.room.name, "spawns", s.name],
					s.spawning == null ? 0 : 1);
			});
		}

		if (Game.time % 50 == 0) {
			let colonies = _.filter(Game.rooms, room => { return room.controller != null && room.controller.my; });
			let remote_mining = _.get(Memory, ["sites", "mining"]);

			_.set(Memory, ["stats", "resources"], new Object());
			_.set(Memory, ["stats", "gcl", "colonies"], (colonies == null ? 0 : colonies.length));

			// Iterate all colonies for statistics
			_.each(colonies,
				room => {
					// Report colony levels
					_.set(Memory, ["stats", "colonies", room.name, "rcl", "level"], room.controller.level);
					_.set(Memory, ["stats", "colonies", room.name, "rcl", "progress"], room.controller.progress);
					_.set(Memory, ["stats", "colonies", room.name, "rcl", "progress_total"], room.controller.progressTotal);
					_.set(Memory, ["stats", "colonies", room.name, "rcl", "progress_percent"], (room.controller.progress / room.controller.progressTotal * 100));

					// Report colony population stats
					_.set(Memory, ["stats", "colonies", room.name, "population"], new Object());

					// Tally resources for individual colony
					let storage = _.get(Game, ["rooms", room.name, "storage"]);
					let terminal = _.get(Game, ["rooms", room.name, "terminal"]);
					_.set(Memory, ["stats", "colonies", room.name, "storage", "store"], _.get(storage, "store"));
					_.set(Memory, ["stats", "colonies", room.name, "terminal", "store"], _.get(terminal, "store"));

					// Tally resources for entire country
					for (let res in _.get(storage, "store"))
						_.set(Memory, ["stats", "resources", res],
							_.get(Memory, ["stats", "resources", res], 0)
							+ _.get(storage, ["store", res], 0)
							+ _.get(terminal, ["store", res], 0));

					// Tally remote mining sites active
					let source_total = 0;
					let remote_list = _.filter(Object.keys(remote_mining), rem => { return rem != room.name && _.get(remote_mining[rem], "colony") == room.name; });
					_.set(Memory, ["stats", "colonies", room.name, "remote_mining", "rooms"], remote_list.length);

					_.each(remote_list, rem => { source_total = source_total + _.get(Memory, ["sites", "mining", room.name, "survey", "source_amount"], 0); });
					_.set(Memory, ["stats", "colonies", room.name, "remote_mining", "sources"], source_total);
					_.set(Memory, ["stats", "colonies", room.name, "mining_sources"], source_total + _.get(Memory, ["rooms", room.name, "survey", "source_amount"], 0));

					// Set alerts (e.g. spawn_assist active)
					if (_.get(Memory, ["rooms", room.name, "spawn_assist", "rooms"], null) != null)
						_.set(Memory, ["stats", "colonies", room.name, "alerts"], "spawn_assist active!;");
			});

			// Iterate mining sites for statistics
			_.each(_.filter(_.keys(_.get(Memory, ["sites", "mining"])),
				rmName => { return _.get(Game, ["rooms", rmName], null) != null; }),
				rmName => {
					_.set(Memory, ["stats", "mining", rmName, "store_percent"],
						_.get(Memory, ["sites", "mining", rmName, "store_percent"], 0));
			});
		}
	},

	populationTally: function (room_name, pop_target, pop_actual) {
		// Deprecated function!! Comment 'return;' if you would still like to use.
		return;

		for (let i in pop_target) {
			_.set(Memory, ["stats", "colonies", room_name, "population", "target", i],
				_.get(pop_target, [i, "amount"]) + _.get(Memory, ["stats", "colonies", room_name, "population", "target", i], 0));
			_.set(Memory, ["stats", "colonies", room_name, "population", "actual", i],
				_.get(pop_actual, [i]) + _.get(Memory, ["stats", "colonies", room_name, "population", "actual", i], 0));

			_.set(Memory, ["stats", "colonies", room_name, "population", "percent", i],
				_.get(Memory, ["stats", "colonies", room_name, "population", "actual", i], 0)
				/ _.get(Memory, ["stats", "colonies", room_name, "population", "target", i], 1))
		}
	}
};



/* ***********************************************************
 *	[sec11a] DEFINITIONS: MAIN LOOP
 * *********************************************************** */


module.exports.loop = function () {

	Stats_CPU.Init();

	if (Control.refillBucket()) {
		return;
	}

	Control.clearDeadMemory();
	Control.initMemory();
	Control.initLabs();
	Control.initVisuals();

	Control.runColonies();
	Control.runColonizations();
	Control.runCombat();

	Control.processSpawnRequests();
	Control.processSpawnRenewing();

	if (hasCPU()) {
		Control.sellExcessResources();
		Control.moveExcessEnergy();
	}

	if (hasCPU()) {
		Blueprint.Init();
	}

	Control.endMemory();
	Stats_Grafana.Run();

	Stats_CPU.Finish();
};
