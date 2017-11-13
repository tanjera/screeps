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
								link = _.head(this.pos.findInRange(FIND_STRUCTURES, 1, { filter: (s) => { return s.structureType == "link"; }}));
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
								container = _.head(this.pos.findInRange(FIND_STRUCTURES, 1, { filter: (s) => { return s.structureType == "container"; }}));
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


Creep.prototype.getTask_Boost = function getTask_Boost () {
	if (this.ticksToLive < 1350 || this.spawning)
		return null;

	let boosted = this.getBoosts();
	return _.head(_.filter(_.get(Memory, ["rooms", this.room.name, "industry", "boosts"]),
		t => { return t.active && t.role == this.memory.role 
				&& (t.room == null ? true : t.room == this.memory.room) 
				&& !boosted.includes(t.resource); }));
};

Creep.prototype.getTask_Withdraw_Link = function getTask_Withdraw_Link () {
	if (!_.get(this.room, ["controller", "my"], false)
		|| !_.get(Memory, ["rooms", this.room.name, "defense", "is_safe"]))
		return;

	let link = _.head(_.filter(this.room.find(FIND_MY_STRUCTURES), s => { 
		return s.structureType == "link" && s.energy > 0 && this.pos.getRangeTo(s.pos) <= 12
			&& _.some(_.get(Memory, ["rooms", this.room.name, "links"]), 
				l => { return _.get(l, "id") == s.id && _.get(l, "dir") == "receive"; }); }));

	if (link != null) {
		return {	type: "withdraw",
					structure: "link",
					resource: "energy",
					id: link.id,
					timer: 60
		};
	}
};

Creep.prototype.getTask_Withdraw_Storage = function getTask_Withdraw_Storage (resource, is_critical) {
	if (!this.room.storage)
		return;
	
	if (resource != null && resource != "energy" && _.get(this.room.storage, ["store", resource], 0) > 0)
		resource = resource;
	else if ((resource == null || resource == "energy") 
			&& (_.get(Memory, ["rooms", this.room.name, "survey", "energy_level"]) != CRITICAL
			|| is_critical))
		resource = "energy";
	else
		return;

	return {	type: "withdraw",
				resource: resource,
				id: this.room.storage.id,
				timer: 60
	};
};

Creep.prototype.getTask_Withdraw_Container = function getTask_Withdraw_Container (resource, is_critical) {
	if (!_.get(Memory, ["rooms", this.room.name, "defense", "is_safe"], true))
		return;

	let containers = _.filter(this.room.find(FIND_STRUCTURES), s => { return s.structureType == STRUCTURE_CONTAINER; });

	if (resource == null || resource != "energy") {
		let cont = _.head(_.filter(containers, 
			s => { return _.get(s, ["store", resource], 0) > 0; }));

		if (cont != null) {
			return {	type: "withdraw",
						resource: resource,
						id: cont.id,
						timer: 60
			};
		}
	}

	if ((resource == null || resource == "energy") 
		&& (_.get(Memory, ["rooms", this.room.name, "survey", "energy_level"]) != CRITICAL
			|| is_critical)) {
		let am_owner = _.get(this.room, ["controller", "my"], false);
		let mining_colony = _.get(Memory, ["sites", "mining", this.room.name, "colony"]);
		let room_level = mining_colony == null || Game.rooms[mining_colony] == null
			? (am_owner ? this.room.getLevel() : 0)
			: Game.rooms[mining_colony].getLevel();
		let carry_capacity = (mining_colony == null || Game.rooms[mining_colony] == null)
			? [ 1000, 150, 200, 400, 650, 900, 1200, 1650, 1650 ]
			: [ 1000, 150, 200, 300, 500, 700, 900, 1250, 1250 ];

		let cont = _.head(_.sortBy(_.filter(containers, 
			s => { return s.store["energy"] > (carry_capacity[room_level] / 5); }),
			s => { return this.pos.getRangeTo(s.pos); }));

		if (cont != null) {
			return {	type: "withdraw",
						resource: "energy",
						id: cont.id,
						timer: 60
			};
		}
	}
};

Creep.prototype.getTask_Deposit_Link = function getTask_Deposit_Link () {
	if (_.get(Memory, ["rooms", this.room.name, "survey", "energy_level"]) == CRITICAL)
		return;
	
	if (this.carry["energy"] == 0)
		return;

	let link = _.head(_.filter(this.room.find(FIND_MY_STRUCTURES), s => { 
		return s.structureType == "link" && s.energy < (s.energyCapacity * 0.8) && this.pos.getRangeTo(s.pos) < 3
			&& _.some(_.get(Memory, ["rooms", this.room.name, "links"]), 
				l => { return _.get(l, "id") == s.id && _.get(l, "dir") == "send"; }); }));

	if (link != null) {
		return {	type: "deposit",
					resource: "energy",
					id: link.id,
					timer: 60,
		};
	}
};

Creep.prototype.getTask_Deposit_Storage = function getTask_Deposit_Storage (resource) {
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

	return {	type: "deposit",
				resource: resource,
				id: this.room.storage.id,
				timer: 60,
	};
};

Creep.prototype.getTask_Deposit_Container = function getTask_Deposit_Container (resource) {
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
		return {	type: "deposit",
					resource: resource,
					id: cont.id,
					timer: 60,
		};
	}
};

Creep.prototype.getTask_Deposit_Towers = function getTask_Deposit_Towers () {
	if (!_.get(this.room, ["controller", "my"], false))
		return;

	let tower = _.head(_.sortBy(_.filter(this.room.find(FIND_MY_STRUCTURES), 
		s => { return s.structureType == "tower" && s.energy < s.energyCapacity; }),
		s => { return s.energy; }));

	if (tower != null) {
		return {	type: "deposit",
					structure: "tower",
					resource: "energy",
					id: tower.id,
					timer: 60
		};
	}
};

Creep.prototype.getTask_Deposit_Spawns = function getTask_Deposit_Spawns () {
	if (!_.get(this.room, ["controller", "my"], false))
		return;


	let spawn_ext = _.head(_.sortBy(_.filter(this.room.find(FIND_MY_STRUCTURES), s => {
		return (s.structureType == "spawn" && s.energy < s.energyCapacity * 0.85)
			|| (s.structureType == "extension" && s.energy < s.energyCapacity); }),
		s => { return this.pos.getRangeTo(s.pos); }));

	if (spawn_ext != null) {
		return {	type: "deposit",
					resource: "energy",
					id: spawn_ext.id,
					timer: 60	
		};
	}
};

Creep.prototype.getTask_Pickup = function getTask_Pickup (resource) {
	if (!_.get(Memory, ["rooms", this.room.name, "defense", "is_safe"]))
		return;

	let dropped_resources = this.room.find(FIND_DROPPED_RESOURCES);

	if (resource == null || resource != "energy") {
		let pile = _.head(_.sortBy(_.filter(dropped_resources, 
			r => { return r.resourceType == "mineral"; }),
			r => { return -r.amount; }));

		if (pile != null) {
			return {	type: "pickup",
						resource: "mineral",
						id: pile.id,
						timer: 30,
			};
		}
	}

	if (resource == null || resource == "energy") {
		let am_owner = _.get(this.room, ["controller", "my"], false);
		let mining_colony = _.get(Memory, ["sites", "mining", this.room.name, "colony"]);
		let room_level = mining_colony == null || Game.rooms[mining_colony] == null
			? (am_owner ? this.room.getLevel() : 0)
			: Game.rooms[mining_colony].getLevel();
		let carry_capacity = (mining_colony == null || Game.rooms[mining_colony] == null)
			? [ 1000, 150, 200, 400, 650, 900, 1200, 1650, 1650 ]
			: [ 1000, 150, 200, 300, 500, 700, 900, 1250, 1250 ];

		let pile = _.head(_.sortBy(_.filter(dropped_resources, 
			r => { return r.resourceType == "energy" && r.amount > (carry_capacity[room_level] / 5); }),
			r => { return -r.amount; }));

		if (pile != null) {
			return {	type: "pickup",
						resource: "energy",
						id: pile.id,
						timer: 30,
			};
		}
	}
};

Creep.prototype.getTask_Upgrade = function getTask_Upgrade (only_critical) {
	if (!_.get(this.room, ["controller", "my"], false))
		return;

	if ((only_critical || only_critical == null) && _.get(this.room, ["controller", "ticksToDowngrade"]) <= 3500) {
		return  {   type: "upgrade",
					id: this.room.controller.id,
					pos: this.room.controller.pos.getOpenTile_Range(2, true),
					timer: 60
				};
	}
	
	if ((!only_critical || only_critical == null) && _.get(this.room, ["controller", "ticksToDowngrade"]) > 3500) {
		return  {   type: "upgrade",
					id: this.room.controller.id,
					pos: this.room.controller.pos.getOpenTile_Range(2, true),
					timer: 60
				};
	}
};

Creep.prototype.getTask_Sign = function getTask_Sign () {
	if (!_.get(this.room, "controller", false))
		return;

	let sign_room = _.get(Memory, ["hive", "signs", this.room.name]);
	let sign_default = _.get(Memory, ["hive", "signs", "default"]);
	let is_safe = _.get(Memory, ["rooms", this.room.name, "defense", "is_safe"]);

	if (is_safe && sign_room != null && _.get(this.room, ["controller", "sign", "text"]) != sign_room) {
		return {	type: "sign",
					message: sign_room,
					id: this.room.controller.id,
					timer: 60
				};
	} else if (is_safe && sign_room == null && sign_default != null && _.get(this.room, ["controller", "sign", "text"]) != sign_default) {
		return {	type: "sign",
					message: sign_default,
					id: this.room.controller.id,
					timer: 60
				};
	}
};

Creep.prototype.getTask_Repair = function getTask_Repair (only_critical) {
	if (only_critical == null || only_critical == true) {
		let repair_critical = _.head(this.room.findRepair_Critical());
		if (repair_critical != null)
			return {	type: "repair",
						id: repair_critical.id,
						timer: 60
					};
	}

	if (only_critical == null || only_critical == false) {
		let repair_maintenance = _.head(this.room.findRepair_Maintenance());
		if (repair_maintenance != null)
			return {	type: "repair",
						id: repair_maintenance.id,
						timer: 60,
					};
	}
};

Creep.prototype.getTask_Build = function getTask_Build () {
	let site = _.head(_.sortBy(_.filter(this.room.find(FIND_CONSTRUCTION_SITES),
		s => { return s.my; }),
		s => {
			let p = 0;
			switch (s.structureType) {
				case "spawn":		p = 2; 	break;
				case "tower": 		p = 3; 	break;
				case "extension":	p = 4; 	break;
				case "storage":		p = 5;	break;
				default:  			p = 6;  	break;
				case "road":		p = 7;	break;
			}
			
			if (s.progress > 0)
				p -= 1;
			
			return p;
		}));

	if (site != null)
		return {	type: "build",
					id: site.id,
					timer: 60
				};
};

Creep.prototype.getTask_Mine = function getTask_Mine () {
	if (!_.get(Memory, ["rooms", this.room.name, "defense", "is_safe"], true))
		return;

	let source = _.head(_.sortBy(_.filter(this.room.find(FIND_SOURCES), 
		s => { return s.energy > 0; }),
		s => {
			if (this.memory.role == "burrower") {
				return _.filter(s.pos.findInRange(FIND_MY_CREEPS, 1), 
					c => { return c.memory.role == "burrower"; }).length;
			} else
				return;
		}));

	if (source == null)
		return;

	let container = _.get(Memory, ["rooms", this.room.name, "sources", source.id, "container"]);
	container = (container == null) ? null : Game.getObjectById(container);		
	if (container == null) {
		container = _.head(source.pos.findInRange(FIND_STRUCTURES, 1, { filter:
			s => { return s.structureType == "container"; } }));
		_.set(Memory, ["rooms", this.room.name, "sources", source.id, "container"], _.get(container, "id"));
	}

	let position = source.pos.getOpenTile_Adjacent(true);
	position = position || source.pos.getOpenTile_Adjacent(false);
	position = position || source.pos;
	
	return {	type: "harvest",
				resource: "energy",
				id: source.id,
				pos: position,
				timer: 100,
				container: _.get(container, "id", null)
	};
};

Creep.prototype.getTask_Extract = function getTask_Extract () {
	if (!_.get(Memory, ["rooms", this.room.name, "defense", "is_safe"], true))
		return;

	let mineral = _.head(_.filter(this.room.find(FIND_MINERALS), m => { 
		return m.mineralAmount > 0 
			&& _.some(m.pos.lookFor("structure"), s => { return s.structureType == "extractor"; }); 
	}));

	if (mineral != null) {
		return {	type: "harvest",
					resource: "mineral",
					id: mineral.id,
					timer: 100
		};
	}
};

Creep.prototype.getTask_Industry_Withdraw = function getTask_Industry_Withdraw () {
	return _.head(_.sortBy(_.filter(_.get(Memory, ["rooms", this.room.name, "industry", "tasks"]),
		t => { return t.type == "withdraw"; }),
		t => { return t.priority; }));
};

Creep.prototype.getTask_Industry_Deposit = function getTask_Industry_Deposit () {
	let res = _.head(_.sortBy(Object.keys(this.carry), (c) => { return -this.carry[c]; }));
	return _.head(_.sortBy(_.filter(_.get(Memory, ["rooms", this.room.name, "industry", "tasks"]),
			t => { return t.type == "deposit" && t.resource == res; }),
			t => { return t.priority; }));

};

Creep.prototype.getTask_Wait = function getTask_Wait (ticks) {
	return {	type: "wait",
				timer: ticks || 10
	};
};