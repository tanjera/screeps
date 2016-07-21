var RoleMiner = {

    run: function(creep, rmDeliver, rmHarvest) {

        var _ticksReusePath = 10;

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
    	        if (creep.memory.route == null || creep.memory.route.length == 0 || creep.memory.route[0].room == creep.room.name || creep.memory.exit == null) {
                    creep.memory.route = Game.map.findRoute(creep.room, rmHarvest);
                    creep.memory.exit = creep.pos.findClosestByPath(creep.memory.route[0].exit);;
                    if (creep.memory.exit) {
                        creep.moveTo(creep.memory.exit.x, creep.memory.exit.y, {reusePath: _ticksReusePath});
                    }
                }
                else {
                    var result = creep.moveTo(creep.memory.exit.x, creep.memory.exit.y, {reusePath: _ticksReusePath});
                    if (result == ERR_NO_PATH) {
                        delete creep.memory.route;
                        delete creep.memory.exit;
                    }
                }
	        }
	        else if (creep.room.name == rmHarvest) {
    	        delete creep.memory.route;
    	        delete creep.memory.exit;
    	        
    	        var source;
    	        
    	        // Carriers, try to pick up off the ground first
                if (creep.carryCapacity > 0) {
                    
                    // Try to pick up larger piles first... then pick up anything
                    source = creep.pos.findClosestByRange(FIND_DROPPED_ENERGY, { filter: (s) => { return s.amount > 100; }});
                    if (source == null) { 
                        source = creep.pos.findClosestByRange(FIND_DROPPED_ENERGY);
                    }
                    
                    if (source != null)  {
                        if (creep.pickup(source) == ERR_NOT_IN_RANGE) {
                            creep.moveTo(source, {reusePath: _ticksReusePath});
                        }
                    } else {
                        source = creep.pos.findClosestByRange(FIND_SOURCES, { filter: (s) => { return s.energy > 0; }});
                        
                        if(creep.harvest(source) == ERR_NOT_IN_RANGE) {
                            creep.moveTo(source, {reusePath: _ticksReusePath});
                        }
                    }
                } else { // Burrowers, straight to the source
                    
                    source = creep.pos.findClosestByPath(FIND_SOURCES, { filter: (s) => { return s.energy > 0; }});
                    
                    if(creep.harvest(source) == ERR_NOT_IN_RANGE) {
                        creep.moveTo(source, {reusePath: _ticksReusePath});
                    }
                }
	        }
        }
        
        if (creep.memory.state == 'working') { 
            if (creep.room.name == rmDeliver) {
                delete creep.memory.route;
    	        delete creep.memory.exit;
    	        
	            var target;
                // Deliver to Spawns and extensions as priority
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
                
                if(creep.transfer(target, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(target, {reusePath: _ticksReusePath});
	            }
	        }
	        else if (creep.room.name != rmDeliver) {
    	        if (creep.memory.route == null || creep.memory.route.length == 0 || creep.memory.route[0].room == creep.room.name || creep.memory.exit == null) {
                    creep.memory.route = Game.map.findRoute(creep.room, rmDeliver);
                    creep.memory.exit = creep.pos.findClosestByPath(creep.memory.route[0].exit);;
                    if (creep.memory.exit) {
                        creep.moveTo(creep.memory.exit.x, creep.memory.exit.y, {reusePath: _ticksReusePath});
                    }
                }
                else {
                    var result = creep.moveTo(creep.memory.exit.x, creep.memory.exit.y, {reusePath: _ticksReusePath});
                    if (result == ERR_NO_PATH) {
                        delete creep.memory.route;
                        delete creep.memory.exit;
                    }
                }
	        }
        }
	}
};

module.exports = RoleMiner;