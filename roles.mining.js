var utilCreep = require('util.creep');

var RolesMining = {

    Mine: function(creep, rmDeliver, rmHarvest) {

        var _ticksReusePath = 10;

        // Burrower?
        if (creep.carryCapacity == 0) {
            creep.memory.state = 'getenergy';
        }
        
        // Manage machine states for carriers!
        else if (creep.memory.state == 'working' && creep.carry[RESOURCE_ENERGY] == 0) {
            creep.memory.state = 'getenergy';
        }
        else if (creep.memory.state == 'getenergy' && _.sum(creep.carry) == creep.carryCapacity) {
            creep.memory.state = 'working';
        }
        else if (creep.memory.state != 'getenergy' && creep.memory.state != 'working') {
            creep.memory.state = 'working';
        }
        
	    if(creep.memory.state == 'getenergy') {
	        if (creep.room.name != rmHarvest) {
                utilCreep.moveToRoom(creep, rmHarvest);
	        }
	        else if (creep.room.name == rmHarvest) {
    	        delete creep.memory.route;
    	        delete creep.memory.exit;
    	        
    	        var source;
    	        
    	        // Carriers, try to pick up off the ground first
                if (creep.carryCapacity > 0) {
                    
                    // Try to pick up larger piles first... then pick up anything
                    source = creep.pos.findClosestByRange(FIND_DROPPED_ENERGY, { filter: (s) => { return s.amount >= creep.carryCapacity / 10; }});
                    if (source == null) { 
                        source = creep.pos.findClosestByRange(FIND_DROPPED_ENERGY);
                    }
                    if (source != null)  {
                        if (creep.pickup(source) == ERR_NOT_IN_RANGE) {
                            creep.moveTo(source, {reusePath: _ticksReusePath});
                        }
                    } else {
                        // Attempt to carry energy from a container/storage
                        source = creep.pos.findClosestByRange(FIND_STRUCTURES, { filter: (s) => { 
                                return (s.structureType == STRUCTURE_STORAGE || s.structureType == STRUCTURE_CONTAINER) && s.store[RESOURCE_ENERGY] > creep.carryCapacity; }});
                        if (source != null) {
                            if(creep.withdraw(source, RESOURCE_ENERGY, creep.carryCapacity - _.sum(creep.carry)) == ERR_NOT_IN_RANGE)
                                creep.moveTo(source, {reusePath: _ticksReusePath});
                        } 
                        else if (creep.getActiveBodyparts('work') > 0) { // Miners can still harvest
                            source = creep.pos.findClosestByRange(FIND_SOURCES, { filter: (s) => { return s.energy > 0; }});
                            if(creep.harvest(source) == ERR_NOT_IN_RANGE) {
                                creep.moveTo(source, {reusePath: _ticksReusePath});
                            } 
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
                                || (structure.structureType == STRUCTURE_TOWER && structure.energy < structure.energyCapacity / 2.5);
                        }
                });
                // And to extensions/containers otherwise
                if (target == null) {
                    target = creep.pos.findClosestByRange(FIND_STRUCTURES, {
                            filter: (structure) => {
                                return (structure.structureType == STRUCTURE_TOWER && structure.energy < structure.energyCapacity / 1.25)
                                || (structure.structureType == STRUCTURE_CONTAINER && _.sum(structure.store) < structure.storeCapacity)
                                || (structure.structureType == STRUCTURE_STORAGE && _.sum(structure.store) < structure.storeCapacity);
                            }
                    })
                };
                
                for (var resourceType in creep.carry) {
                    if(creep.transfer(target, resourceType) == ERR_NOT_IN_RANGE) {
                        creep.moveTo(target, {reusePath: _ticksReusePath});
                        return;
                    }
	            }
	        }
	        else if (creep.room.name != rmDeliver) {
                utilCreep.moveToRoom(creep, rmDeliver);
	        }
        }
	},


    Extract: function(creep, rmDeliver, rmHarvest) {
        var _ticksReusePath = 10;

        if (creep.memory.state == 'working' && _.sum(creep.carry) < creep.carryCapacity) {
            creep.memory.state = 'getenergy';
        }
        else if (creep.memory.state == 'getenergy' && _.sum(creep.carry) == creep.carryCapacity) {
            creep.memory.state = 'working';
        }
        else if (creep.memory.state != 'getenergy' && creep.memory.state != 'working') {
            creep.memory.state = 'working';
        }
        
        if(creep.memory.state == 'getenergy') {
            if (creep.room.name != rmHarvest) {
                utilCreep.moveToRoom(creep, rmHarvest);
            }
            else if (creep.room.name == rmHarvest) {
                delete creep.memory.route;
                delete creep.memory.exit;

                var source = creep.pos.findClosestByRange(FIND_MINERALS);
                if(creep.harvest(source) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(source, {reusePath: _ticksReusePath});
                }
            }
        }        
        
        if (creep.memory.state == 'working') { 
            if (creep.room.name == rmDeliver) {
                delete creep.memory.route;
    	        delete creep.memory.exit;
    	        
	            var target = creep.pos.findClosestByRange(FIND_STRUCTURES, {
                            filter: (structure) => {
                                return (structure.structureType == STRUCTURE_STORAGE && _.sum(structure.store) < structure.storeCapacity); }});
                
                for (var resourceType in creep.carry) {
                    if (creep.transfer(target, resourceType) == ERR_NOT_IN_RANGE) {
                        creep.moveTo(target, {reusePath: _ticksReusePath});
                        return;
                    }
	            }
	        }
	        else if (creep.room.name != rmDeliver) {
                utilCreep.moveToRoom(creep, rmDeliver);
	        }
        }
	},


    Reserve: function(creep, rmHarvest) {
        if (creep.room.name != rmHarvest) {
            utilCreep.moveToRoom(creep, rmHarvest);
        }
        else if (creep.room.name == rmHarvest) {
            if(creep.reserveController(creep.room.controller) == ERR_NOT_IN_RANGE) {
                creep.moveTo(creep.room.controller);
            }
        }
    }
};

module.exports = RolesMining;
