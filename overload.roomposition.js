RoomPosition.prototype.isValid = function isValid() {	
	return !(this.x < 0 || this.x > 49 || this.y < 0 || this.y > 49);
}

RoomPosition.prototype.isWalkable = function isWalkable(creeps_block) {
	if (!this.isValid())
		return false;
	
	let look = this.look();
	
	let terrain = _.head(_.filter(look, l => l.type == "terrain"))["terrain"];
	if (terrain == "wall")
		return false;
	
	let structures = _.filter(look, l => l.type == "structure");
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

RoomPosition.prototype.getTileInDirection = function getTileInDirection(dir) {
	switch (dir) {
		case 0: return this;
		case 1: return new RoomPosition(this.x,	 		this.y - 1, 	this.roomName);
		case 2: return new RoomPosition(this.x + 1, 	this.y - 1, 	this.roomName);
		case 3: return new RoomPosition(this.x + 1, 	this.y,		 	this.roomName);
		case 4: return new RoomPosition(this.x + 1, 	this.y + 1, 	this.roomName);
		case 5: return new RoomPosition(this.x,	 		this.y + 1, 	this.roomName);
		case 6: return new RoomPosition(this.x - 1, 	this.y + 1, 	this.roomName);
		case 7: return new RoomPosition(this.x - 1, 	this.y,		 	this.roomName);
		case 8: return new RoomPosition(this.x - 1, 	this.y - 1, 	this.roomName);
	}

	return null;
};

RoomPosition.prototype.isEdge = function isEdge() {
	return (this.x == 0 || this.x == 49 || this.y == 0 || this.y == 49);
};

RoomPosition.prototype.inRangeToListTargets = function inRangeToListTargets(listTargets, range) {
	for (let i = 0; i < listTargets.length; i++) {
		if (this.getRangeTo(listTargets[i].pos.x, listTargets[i].pos.y) < range)
			return true;
	}

	return false;
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
				let path = this.findPathTo(newPos.x, newPos.y, {maxOps: 200, ignoreCreeps: true, ignoreRoads: true});
				if (path.length <= 2)
					return newPos;
			}
		}
	}

	return null;
};