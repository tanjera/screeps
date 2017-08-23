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
}