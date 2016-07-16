var w16s43Miner = {

    /** @param {Creep} creep **/
    run: function(creep) {
        
        // Burrower?
        if (creep.memory.role == 'w16s43burrower' || creep.carryCapacity == 0) {
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
	        var source;
	        
	        // Carriers, try to pick up off the ground first
            if (creep.carryCapacity > 0) {
                source = creep.pos.findClosestByRange(FIND_DROPPED_ENERGY, {
                    filter: (n) => { return n.amount > 5; } });
                
                if (source != null)  {
                    if (creep.pickup(source) == ERR_NOT_IN_RANGE) {
                        creep.moveTo(source);
                    }
                } else {
                    source = Game.getObjectById('577b93490f9d51615fa47eb2');
                    
                    if(creep.harvest(source) == ERR_NOT_IN_RANGE) {
                        creep.moveTo(source);
                    }
                }
            } else { // Burrowers, straight to the source
                source = Game.getObjectById('577b93490f9d51615fa47eb2');    
                
                if(creep.harvest(source) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(source);
                }
            }
        }
        
        if (creep.memory.state == 'working') { 
            
            var target;
            // Deliver to Spawns and extensions as priority, unless there's a hostile
            target = creep.pos.findClosestByRange(FIND_STRUCTURES, {
                    filter: (structure) => {
                        return (structure.structureType == STRUCTURE_SPAWN && structure.energy < structure.energyCapacity)
                            || (structure.structureType == STRUCTURE_EXTENSION && structure.energy < structure.energyCapacity)
                            || (structure.structureType == STRUCTURE_TOWER && structure.energy < structure.energyCapacity);
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
            
            if (target == null) {
                creep.moveTo(Game.spawns.Spawn2);
            }
            
            if(creep.transfer(target, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                creep.moveTo(target);
            }
        }
	}
};

module.exports = w16s43Miner;