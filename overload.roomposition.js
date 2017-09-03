RoomPosition.prototype.isWalkable = function isWalkable() {
	if (this.x < 0 || this.x > 49 || this.y < 0 || this.y > 49)
		return false;
	
	let look = this.look();
	
	let terrain = _.head(_.filter(look, l => l.type == "terrain"))["terrain"];
	if (terrain == "wall")
		return false;
	
	let structures = _.filter(look, l => l.type == "structure");
	for (let s in structures) {
		if (structures[s].structure.structureType != "container" && structures[s].structure.structureType != "road")
			return false;
	}
	
	return true;
};

RoomPosition.prototype.isEdge = function isEdge() {
	return (this.x == 0 || this.x == 49 || this.y == 0 || this.y == 49);
}

RoomPosition.prototype.inRangeToListTargets = function inRangeToListTargets(listTargets, range) {
	for (let i = 0; i < listTargets.length; i++) {
		if (this.getRangeTo(listTargets[i].pos.x, listTargets[i].pos.y) < range)
			return true;
	}

	return false;
}

RoomPosition.prototype.getAccessAmount = function getAccessAmount() {
	let access = 0;
	
	access += new RoomPosition(this.x - 1, 	this.y - 1, 	this.roomName).isWalkable() ? 1 : 0;
	access += new RoomPosition(this.x, 		this.y - 1, 	this.roomName).isWalkable() ? 1 : 0;
	access += new RoomPosition(this.x + 1, 	this.y - 1, 	this.roomName).isWalkable() ? 1 : 0;
	access += new RoomPosition(this.x - 1, 	this.y, 		this.roomName).isWalkable() ? 1 : 0;
	access += new RoomPosition(this.x + 1, 	this.y, 		this.roomName).isWalkable() ? 1 : 0;
	access += new RoomPosition(this.x - 1, 	this.y + 1, 	this.roomName).isWalkable() ? 1 : 0;
	access += new RoomPosition(this.x, 		this.y + 1, 	this.roomName).isWalkable() ? 1 : 0;
	access += new RoomPosition(this.x + 1, 	this.y + 1, 	this.roomName).isWalkable() ? 1 : 0;

	return access;
};

RoomPosition.prototype.getOpenTile_Adjacent = function getOpenTile_Adjacent() {
	return (this.getOpenTile_Range(1));
}

RoomPosition.prototype.getOpenTile_Range = function getOpenTile_Range(range) {
	for (let x = -range; x <= range; x++) {
		for (let y = -range; y <= range; y++) {
			let newPos = new RoomPosition(this.x + x, this.y + y, this.roomName);

			if (newPos.x <= 1 || newPos.x >= 48 || newPos.y <= 1 || newPos.y >= 48)
				continue;

			if (newPos.lookFor("structure").length == 0 && newPos.lookFor("terrain") != "wall") {
				return newPos;
			}
		}
	}

	return null;
}

RoomPosition.prototype.getOpenTile_Path = function getOpenTile_Path(range) {
	for (let x = -range; x <= range; x++) {
		for (let y = -range; y <= range; y++) {
			let newPos = new RoomPosition(this.x + x, this.y + y, this.roomName);

			if (newPos.x <= 1 || newPos.x >= 48 || newPos.y <= 1 || newPos.y >= 48)
				continue;

			if (newPos.lookFor("structure").length == 0 && newPos.lookFor("terrain") != "wall") {
				let path = this.findPathTo(newPos.x, newPos.y, {maxOps: 200, ignoreCreeps: true, ignoreRoads: true});
				if (path.length <= 2)
					return newPos;
			}
		}
	}

	return null;
}