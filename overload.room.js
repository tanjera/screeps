Room.prototype.store = function store(resource) {
	return _.get(this, ["storage", "store", resource], 0) + _.get(this, ["terminal", "store", resource], 0);	
};