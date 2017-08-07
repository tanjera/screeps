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

			if (newPos.x < 0 || newPos.x > 49 || newPos.y < 0 || newPos.y > 49)
				continue;

			if (newPos.lookFor("structure").length == 0 && newPos.lookFor("terrain") != "wall") {
				return newPos;
			}
		}
	}

	return null;
}