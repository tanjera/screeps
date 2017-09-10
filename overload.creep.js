Creep.prototype.isBoosted = function isBoosted() {
	for (let b in this.body) {
		if (this.body[b].boost) {
			return true;
		}
	}
	return false;
};

Creep.prototype.isAlly = function isAlly() {
	let allyList = _.get(Memory, ["hive", "allies"]);
	return this.my || (allyList != null && allyList.indexOf(this.owner.username) >= 0);
};


Creep.prototype.isHostile = function isHostile() {
	let allyList = _.get(Memory, ["hive", "allies"]);
	return !this.my && (allyList == null || allyList.indexOf(this.owner.username) < 0);
};


Creep.prototype.finishedTask = function finishedTask() {
	let task = this.memory.task;
	if (_.has(Memory, ["rooms", task.room, "tasks_running", task.key]))
		delete Memory["rooms"][task.room]["tasks_running"][task.key][this.name];
	delete this.memory.task;
};

Creep.prototype.returnTask = function returnTask() {
	let task = this.memory.task;
	if (_.has(Memory, ["rooms", task.room, "tasks_running", task.key]))
		delete Memory["rooms"][task.room]["tasks_running"][task.key][this.name];
	task.creeps += 1;
	delete this.memory.task;
};

Creep.prototype.runTaskTimer = function runTaskTimer() {
	if (this.memory.task == null) {
		return false;
	}
	else if (this.memory.task["timer"] != null) {
		let task = this.memory.task;
		task["timer"] = task["timer"] - 1;
		if (task["timer"] <= 0) {

			// Prevent burrower from losing task on task refresh, getting blocked by workers
			if (this.memory.role == "burrower" && task.subtype == "harvest" && task.resource == "energy"
					&& Game.getObjectById(task.id).energy > 0) {
				return true;
			}

			this.returnTask(this);
			return false;
		}
	}

	return true;
};

Creep.prototype.runTask = function runTask() {
	switch (this.memory.task["subtype"]) {
		case "wait":
			return;

		case "boost": {
			let lab = Game.getObjectById(this.memory.task["id"]);
			if (!this.pos.inRangeTo(lab, 1)) {
				this.travel(lab);
				return;
			} else {    // Wait out timer- should be boosted by then.
				return;
			}
		}

		case "pickup": {
			let obj = Game.getObjectById(this.memory.task["id"]);
			if (this.pickup(obj) == ERR_NOT_IN_RANGE) {
				this.travel(obj);
				return;
			} else {    // Action takes one tick... task complete... delete task...
				this.finishedTask();
				return;
			}
		}

		case "withdraw": {
			let obj = Game.getObjectById(this.memory.task["id"]);
			if (this.withdraw(obj, this.memory.task["resource"],
					(this.memory.task["amount"] > this.carryCapacity - _.sum(this.carry) ? null : this.memory.task["amount"]))
					== ERR_NOT_IN_RANGE) {
				this.travel(obj);
				return;
			} else {    // Action takes one tick... task complete... delete task...
				this.finishedTask();
				return;
			}
		}

		case "harvest": {
			let obj = Game.getObjectById(this.memory.task["id"]);
			let pos = new RoomPosition(this.memory.task["pos"].x, this.memory.task["pos"].y, this.memory.task["pos"].roomName);
			let result = this.harvest(obj);
			if (result == OK || result == ERR_TIRED) {
				return;
			} else if (result == ERR_NOT_IN_RANGE) {
				if (_.filter(pos.look(), n => n.type == "creep").length == 0)
					this.travel(pos);
				else
					this.travel(obj);
				return;			
			} else {
				this.finishedTask();
				return;
			}
		}

		case "upgrade": {
			let controller = Game.getObjectById(this.memory.task["id"]);
			let result = this.upgradeController(controller);
			if (result == ERR_NOT_IN_RANGE) {
				this.travel(controller);
				return;
			} else if (result != OK) {
				this.finishedTask();
				return;
			} else { return; }
		}

		case "sign": {
			let controller = Game.getObjectById(this.memory.task["id"]);
			let message = this.memory.task["message"];
			let result = this.signController(controller, message);
			if (result == ERR_NOT_IN_RANGE) {
				this.travel(controller);
				return;
			} else if (result != OK) {
				this.finishedTask();
				return;
			} else { return; }
		}

		case "repair": {
			let structure = Game.getObjectById(this.memory.task["id"]);
			let result = this.repair(structure);
			if (result == ERR_NOT_IN_RANGE) {
				this.travel(structure);
				return;
			} else if (result != OK || structure.hits == structure.hitsMax) {
				this.finishedTask();
				return;
			} else { return; }
		}

		case "build": {
			let structure = Game.getObjectById(this.memory.task["id"]);
			let result = this.build(structure);
			if (result == ERR_NOT_IN_RANGE) {
				this.travel(structure);
				return;
			} else if (result != OK) {
				this.finishedTask();
				return;
			} else { return; }
		}

		case "deposit": {
			let target = Game.getObjectById(this.memory.task["id"]);
			switch (this.memory.task["resource"]) {

				default:
				case "energy":
					if (target != null && this.transfer(target, this.memory.task["resource"]) == ERR_NOT_IN_RANGE) {
						this.travel(target);
						return;
					} else {
						this.finishedTask();
						return;
					}
					return;

				case "mineral":		// All except energy
					for (let r = Object.keys(this.carry).length; r > 0; r--) {
						let resourceType = Object.keys(this.carry)[r - 1];
						if (resourceType == "energy") {
							continue;
						} else if (target != null && this.transfer(target, resourceType) == ERR_NOT_IN_RANGE) {
							this.travel(target);
							return;
						} else {
							this.finishedTask();
							return;
						}
					}
					return;
			}
		}
	}
};


Creep.prototype.travel = function travel (dest) {
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

	if (_.get(this, ["memory", "path", "path_list"]) == null || _.get(this, ["memory", "path", "path_list"]).length == 0) {
		let Hive = require("hive");
		_.set(this, ["memory", "path", "destination"], pos_dest);
		_.set(this, ["memory", "path", "path_list"],
			this.pos.findPathTo(pos_dest, {maxOps: Hive.moveMaxOps(), reusePath: Hive.moveReusePath(),
				costCallback: function(roomName, costMatrix) {
					_.each(_.get(Memory, ["hive", "paths", "prefer", "rooms", roomName]), p => {				
						costMatrix.set(p.x, p.y, 1); });
					
					_.each(_.get(Memory, ["hive", "paths", "avoid", "rooms", roomName]), p => {				
						costMatrix.set(p.x, p.y, 255); });
				}}));
	}

	return this.travelByPath();
	
};

Creep.prototype.travelByPath = function travelByPath() {
	let path = _.get(this, ["memory", "path", "path_list"]);
	if (path == null || path.length == 0 || _.get(path, 0) == null) {
		_.set(this, ["memory", "path"], null)
		return ERR_NO_PATH;
	}

	let tile = this.pos.getTileInDirection(_.get(path, [0, "direction"]));
	if (tile == null || tile.isWalkable(true) == false) {
		_.set(this, ["memory", "path"], null)
		return ERR_NO_PATH;
	}

	let result = this.move(_.get(path, [0, "direction"]));
	if (result == OK) {
		this.memory.path.path_list.splice(0, 1);
		return OK;
	} else if (result == ERR_BUSY || result == ERR_TIRED || result == ERR_NO_BODYPART) {
		return OK;
	} else {
		_.set(this, ["memory", "path"], null);
		return ERR_NO_PATH;
	}
};

Creep.prototype.travelToRoom = function travelToRoom (tgtRoom, forward) {
	if (this.room.name == tgtRoom)
		return ERR_NO_PATH;

	let list_route = _.get(this, ["memory", "listRoute"]);
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

Creep.prototype.travelToExitTile = function travelToExitTile (target_name) {
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
				case '1': tile = _.head(_.sortBy(_.filter(exit_tiles, t => { return t.y == 0; }), t => { return this.pos.getRangeTo(t.x, t.y);})); break;
				case '3': tile = _.head(_.sortBy(_.filter(exit_tiles, t => { return t.x == 49; }), t => { return this.pos.getRangeTo(t.x, t.y);})); break;
				case '5': tile = _.head(_.sortBy(_.filter(exit_tiles, t => { return t.y == 49; }), t => { return this.pos.getRangeTo(t.x, t.y);})); break;
				case '7': tile = _.head(_.sortBy(_.filter(exit_tiles, t => { return t.x == 0; }), t => { return this.pos.getRangeTo(t.x, t.y);})); break;
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

Creep.prototype.moveFrom = function moveFrom (target) {
	let tgtDir = this.pos.getDirectionTo(target);
	let moveDir;

	switch (tgtDir) {
		default:
		case TOP:           moveDir = BOTTOM;       break;
		case TOP_RIGHT:     moveDir = BOTTOM_LEFT;  break;
		case RIGHT:         moveDir = LEFT;         break;
		case BOTTOM_RIGHT:  moveDir = TOP_LEFT;     break;
		case BOTTOM:        moveDir = TOP;          break;
		case BOTTOM_LEFT:   moveDir = TOP_RIGHT;    break;
		case LEFT:          moveDir = RIGHT;        break;
		case TOP_LEFT:      moveDir = BOTTOM_RIGHT; break;
	}

	return this.move(moveDir);
};

Creep.prototype.moveFromSource = function moveFromSource() {	
	let sources = this.pos.findInRange(FIND_SOURCES, 1);
	if (sources != null && sources.length > 0) {
		this.moveFrom(sources[0]);
	}
}