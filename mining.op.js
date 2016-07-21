var MiningOp = {

    run: function(creep, rmDeliver, rmHarvest, idSource) {
        
        // Burrower?
        if (creep.carryCapacity == 0) {
            creep.memory.state = 'getenergy';
        }
        
        // Manage machine states for carriers!
        else if (creep.memory.state == 'working' && creep.carry[RESOURCE_ENERGY] == 0) {
            creep.memory.state = 'getenergy';
        }
        else if (creep.memory.state == 'getenergy' && creep.carry[RESOURCE_ENERGY] == creep.carryCapacity) {
            creep.memory.state = 'working';
        }
        else if (creep.memory.state != 'getenergy' && creep.memory.state != 'working') {
            creep.memory.state = 'working';
        }
        
	    if(creep.memory.state == 'getenergy') {
	        if (creep.room.name != rmHarvest) {
    	        if (creep.memory.route == null || creep.memory.route[0].room != creep.room) {
                    creep.memory.route = Game.map.findRoute(creep.room, rmHarvest);
                    if (creep.memory.route.length > 0) {
                        creep.memory.exit = creep.pos.findClosestByPath(creep.memory.route[0].exit);
                    }
                }
                else {
                    creep.moveTo(exit);
                }
	        }
	        else if (creep.room.name == rmHarvest) {
    	        var source;
    	        
    	        // Carriers, try to pick up off the ground first
                if (creep.carryCapacity > 0) {
                    source = creep.pos.findClosestByRange(FIND_DROPPED_ENERGY);
                    
                    if (source != null)  {
                        if (creep.pickup(source) == ERR_NOT_IN_RANGE) {
                            creep.moveTo(source);
                        }
                    } else {
                        source = Game.getObjectById(idSource);
                        
                        if(creep.harvest(source) == ERR_NOT_IN_RANGE) {
                            creep.moveTo(source);
                        }
                    }
                } else { // Burrowers, straight to the source
                    
                    source = Game.getObjectById(idSource);
                    
                    
                    if(creep.harvest(source) == ERR_NOT_IN_RANGE) {
                        creep.moveTo(source);
                    }
                }
	        }
        }
        
        if (creep.memory.state == 'working') { 
            if (creep.room.name == rmDeliver) {
	            var target;
                // Deliver to Spawns and extensions as priority
                target = creep.pos.findClosestByRange(FIND_STRUCTURES, {
                        filter: (structure) => {
                            return (structure.structureType == STRUCTURE_SPAWN && structure.energy < structure.energyCapacity)
                                || (structure.structureType == STRUCTURE_EXTENSION && structure.energy < structure.energyCapacity)
                                || (structure.structureType == STRUCTURE_TOWER && structure.energy < structure.energyCapacity / 2);
                        }
                });
                // And to extensions/containers otherwise
                if (target == null) {
                    target = creep.pos.findClosestByRange(FIND_STRUCTURES, {
                            filter: (structure) => {
                                return (structure.structureType == STRUCTURE_CONTAINER && _.sum(structure.store) < structure.storeCapacity)
                                || (structure.structureType == STRUCTURE_STORAGE && _.sum(structure.store) < structure.storeCapacity);
                            }
                    })
                };
                
                if(creep.transfer(target, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(target);
	            }
	        }
	        else if (creep.room.name != rmDeliver) {
    	        if (creep.memory.route == null || creep.memory.route[0].room != creep.room) {
                    creep.memory.route = Game.map.findRoute(creep.room, rmDeliver);
                    if (creep.memory.route.length > 0) {
                        creep.memory.exit = creep.pos.findClosestByPath(creep.memory.route[0].exit);
                    }
                }
                else {
                    creep.moveTo(exit);
                }
	        }
        }
	}
};

module.exports = MiningOp;