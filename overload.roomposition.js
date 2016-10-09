RoomPosition.prototype.isWalkable = function isWalkable() {
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