var w16s41Miner = {

    run: function(creep) {
        
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
	        
	        if (creep.room.name == 'W16S43') {
    	        if (creep.pos.x != 15 || creep.pos.y != 0) {
    	                creep.moveTo(15, 0); 
    	            }
    	            else {
    	                creep.move(TOP);
    	            }
	        }
            else if (creep.room.name == 'W16S42') {
    	        if (creep.pos.x != 26 || creep.pos.y != 0) {
    	                creep.moveTo(26, 0); 
    	            }
    	            else {
    	                creep.move(TOP);
    	            }
	        }
	        else if (creep.room.name == 'W16S41') {
    	        var source;
    	        
    	        // Carriers, try to pick up off the ground first
                if (creep.carryCapacity > 0) {
                    source = creep.pos.findClosestByRange(FIND_DROPPED_ENERGY);
                    
                    if (source != null)  {
                        if (creep.pickup(source) == ERR_NOT_IN_RANGE) {
                            creep.moveTo(source);
                        }
                    } else {
                        source = Game.getObjectById('577b93490f9d51615fa47eaa');
                        
                        if(creep.harvest(source) == ERR_NOT_IN_RANGE) {
                            creep.moveTo(source);
                        }
                    }
                } else { // Burrowers, straight to the source
                    
                    source = Game.getObjectById('577b93490f9d51615fa47eaa');
                    
                    if(creep.harvest(source) == ERR_NOT_IN_RANGE) {
                        creep.moveTo(source);
                    }
                }
	        }
        }
        
        if (creep.memory.state == 'working') { 
            
            if (creep.room.name == 'W16S43') {
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
	        else if (creep.room.name == 'W16S42') {
	            if (creep.pos.x != 11 || creep.pos.y != 49) {
	                creep.moveTo(11, 49); 
	            }
	            else {
	                creep.move(BOTTOM);
	            }
	        }
            else if (creep.room.name == 'W16S41') {
	            if (creep.pos.x != 37 || creep.pos.y != 49) {
	                creep.moveTo(37, 49); 
	            }
	            else {
	                creep.move(BOTTOM);
	            }
	        }
            
        }
	}
};

module.exports = w16s41Miner;