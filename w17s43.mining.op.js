var w17s43Miner = {

    run: function(creep) {
        
        // Manage machine states!
        if (creep.memory.state == 'working' && creep.carry[RESOURCE_ENERGY] == 0) {
            creep.memory.state = 'getenergy';
        }
        else if (creep.memory.state == 'getenergy' && creep.carry[RESOURCE_ENERGY] == creep.carryCapacity) {
            creep.memory.state = 'working';
        }
        else if (creep.memory.state != 'getenergy' && creep.memory.state != 'working') {
            creep.memory.state = 'working';
        }
        
	    if(creep.memory.state == 'getenergy') {
	        
	        if (creep.room.name == 'W18S43') {
	            if (creep.pos.x != 49 || creep.pos.y != 25) {
	                creep.moveTo(49, 25);
	            }
	            else {
	                creep.move(RIGHT);
	            }
	        }
	        else if (creep.room.name == 'W17S43') {
	            var source;
	            
	            if (creep.memory.role == 'w17s43minerW') {
	                source = Game.getObjectById('577b93470f9d51615fa47e61');
	            } else if (creep.memory.role == 'w17s43minerE') {
	                source = Game.getObjectById('577b93470f9d51615fa47e60');
	            }
                
                if(creep.harvest(source) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(source);
                }
	        }
        }
        
        if (creep.memory.state == 'working') { 
            
            if (creep.room.name == 'W18S43') {
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
	        else if (creep.room.name == 'W17S43') {
	            if (creep.pos.x != 0 || creep.pos.y != 26) {
	                creep.moveTo(0, 26); 
	            }
	            else {
	                creep.move(LEFT);
	            }
	        }
            
        }
	}
};

module.exports = w17s43Miner;