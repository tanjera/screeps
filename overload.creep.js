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
			if (result == ERR_NOT_IN_RANGE) {
				if (_.filter(pos.look(), n => n.type == "creep").length == 0)
					this.travel(pos);
				else
					this.travel(obj);
				return;
			} else if (result == OK || result == ERR_TIRED) {
				if (!this.pos.isEqualTo(pos))
					this.travel(pos);
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
	let pos_dest = (dest instanceof RoomPosition == true) ? dest : dest.pos;

	let Hive = require("hive");
	this.moveTo(pos_dest, {maxOps: Hive.moveMaxOps(), reusePath: Hive.moveReusePath(),
		costCallback: function(roomName, costMatrix) {
			_.each(_.get(Memory, ["hive", "paths", "avoid", "rooms", roomName]), p => {
				new RoomVisual(roomName).text("x", p, {color: "red", stroke: "pink", opacity: 0.1});
				costMatrix.set(p.x, p.y, 255); });
		}});
	return;
};

Creep.prototype.moveToRoom = function moveToRoom (tgtRoom, forwardRoute) {
	if (this.room.name == tgtRoom) {
		console.log(`Error: trying to move creep ${this.name} to its own room ${tgtRoom}... check logic!!!`);
		return;
	}

	if (this.memory.listRoute != null) {
		if (forwardRoute == true) {
			for (let i = 1; i < this.memory.listRoute.length; i++) {
				if (this.room.name == this.memory.listRoute[i - 1]) {
					this.travel(new RoomPosition(25, 25, this.memory.listRoute[i]));
					return;
				}
			}
		} else if (forwardRoute == false) {
			for (let i = this.memory.listRoute.length - 2; i >= 0; i--) {
				if (this.room.name == this.memory.listRoute[i + 1]) {
					this.travel(new RoomPosition(25, 25, this.memory.listRoute[i]));                        
					return;
				}
			}
		}
	}

	if (this.memory.route == null || this.memory.route.length == 0 || this.memory.route == ERR_NO_PATH
			|| this.memory.route[0].room == this.room.name || this.memory.exit == null
			|| this.memory.exit.roomName != this.room.name) {
		this.memory.route = Game.map.findRoute(this.room, tgtRoom);

		if (this.memory.route == ERR_NO_PATH) {
			delete this.memory.route;
			return;
		}
		this.memory.exit = this.pos.findClosestByPath(this.memory.route[0].exit);
	}

	if (this.memory.exit) {
		this.travel(new RoomPosition(this.memory.exit.x, this.memory.exit.y, this.memory.exit.roomName));
	}
};

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