Creep.prototype.travel = function travel (dest, ignore_creeps) {
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
	let Hive = require("hive");
	if (_.get(this, ["memory", "path", "travel_req"], 0) > (Game.time - Hive.moveRequestPath(this)))
		return this.travelByPath();
	else
		_.set(this, ["memory", "path", "travel_req"], Game.time);

	if (_.get(this, ["memory", "path", "path_str"]) == null
			|| typeof(_.get(this, ["memory", "path", "path_str"])) != "string"
			|| _.get(this, ["memory", "path", "path_str"]).length == 0
			|| _.get(this, ["memory", "path", "destination"]) != pos_dest) {
		_.set(this, ["memory", "path", "destination"], pos_dest);
		
		let path_array = this.pos.findPathTo(pos_dest, {maxOps: Hive.moveMaxOps(), reusePath: Hive.moveReusePath(),
			ignoreCreeps: ignore_creeps, costCallback: function(roomName, costMatrix) {
				_.each(_.get(Memory, ["hive", "paths", "prefer", "rooms", roomName]), p => {				
					costMatrix.set(p.x, p.y, 1); });
				
				_.each(_.get(Memory, ["hive", "paths", "avoid", "rooms", roomName]), p => {				
					costMatrix.set(p.x, p.y, 255); });
			}});
		
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

	if (path == null || typeof(path) != "string" || path.length == 0) {
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

Creep.prototype.travelToRoom = function travelToRoom (tgtRoom, forward) {
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

Creep.prototype.travelSwap = function travelSwap (target) {
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

Creep.prototype.travelTask = function travelTask (dest) {
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

Creep.prototype.travelTask_Burrower = function travelTask_Burrower () {
	if (_.get(this.memory.task, "container") != null) {
		let container = Game.getObjectById(this.memory.task["container"]);
		if (container != null) {
			let cont_cr = _.head(container.pos.lookFor(LOOK_CREEPS));
			if (_.get(cont_cr, ["memory", "role"]) != "burrower")
				return this.travel(container.pos);
		}
	} else {
		let position = new RoomPosition(this.memory.task["pos"].x, this.memory.task["pos"].y, this.memory.task["pos"].roomName);
		let pos_cr = _.head(position.lookFor(LOOK_CREEPS));
		if (_.get(pos_cr, ["memory", "role"]) != "burrower")
			return this.travel(position);		
	}

	let source = Game.getObjectById(this.memory.task["id"]);
	return this.travel(source.pos);
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

Creep.prototype.moveFromSource = function moveFromSource() {	
	let sources = this.pos.findInRange(FIND_SOURCES, 1);
	if (sources != null && sources.length > 0) {
		this.moveFrom(sources[0]);
	}
};
