var utilCreep = require('util.creep');

var RolesMining = {

    Mine: function(creep, rmDeliver, rmHarvest) {

        var _ticksReusePath = 10;

        // Burrower?
        if (creep.carryCapacity == 0) {
            creep.memory.state = 'getenergy';
        }
        
        // Manage machine states for carriers!
        else if (creep.memory.state == 'working' && creep.carry[RESOURCE_ENERGY] == 0 && _.sum(creep.carry) < creep.carryCapacity) {
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
    	        
    	        if (creep.carryCapacity > 0) {  // Carriers and miners, priority is to move energy throughout the room                    
                    // Priority #1: get dropped energy
                    var source = creep.pos.findClosestByRange(FIND_DROPPED_ENERGY);
                    if (source != null 
                            && (creep.pickup(source) == ERR_NOT_IN_RANGE 
                                ? creep.moveTo(source, {reusePath: _ticksReusePath}) 
                                : creep.pickup(source)) == OK) {   
                        return;                        
                    }

                    // Priority #2: get energy from storage
                    var sources = creep.room.find(FIND_STRUCTURES, { filter: function (s) { 
                        return (s.structureType == STRUCTURE_CONTAINER && s.store[RESOURCE_ENERGY] > 0)
                            || (s.structureType == STRUCTURE_STORAGE && s.store[RESOURCE_ENERGY] > 0); }})
                        .sort(function(a, b) { return b.store[RESOURCE_ENERGY] - a.store[RESOURCE_ENERGY]; });
                    if (sources.length > 0 
                            && (creep.withdraw(sources[0], RESOURCE_ENERGY) == ERR_NOT_IN_RANGE 
                                ? creep.moveTo(sources[0], {reusePath: _ticksReusePath}) 
                                : creep.withdraw(sources[0], RESOURCE_ENERGY)) == OK) {
                        return;
                    } 
                
                    // Priority #3: if able to, mine.
                    if (creep.getActiveBodyparts('work') > 0) {
                        var source = creep.pos.findClosestByRange(FIND_SOURCES, { filter: function (s) { return s.energy > 0; }});
                        if (source != null 
                            && (creep.harvest(source) == ERR_NOT_IN_RANGE 
                                ? creep.moveTo(source, {reusePath: _ticksReusePath}) 
                                : creep.harvest(source)) == OK) {
                            return;
                        } 
                    }
                } else { 
                    // Burrowers, straight to the source
                    var source = creep.pos.findClosestByPath(FIND_SOURCES, { filter: function (s) { return s.energy > 0; }});
                    if (source == null) {   // All sources are empty? Move to the one renewing next!
                        var sources = creep.room.find(FIND_SOURCES).sort(function(a, b) { return a.ticksToRegeneration - b.ticksToRegeneration; });
                        source = sources.length > 0 ? sources[0] : null;
                    }
                    if (source != null 
                            && (creep.harvest(source) == ERR_NOT_IN_RANGE || creep.harvest(source) == ERR_NOT_ENOUGH_RESOURCES
                                ? creep.moveTo(source, {reusePath: _ticksReusePath}) 
                                : creep.harvest(source)) == OK) {
                        return;
                    }
                }
	        }
        }
        
        if (creep.memory.state == 'working') { 
            if (creep.room.name == rmDeliver) {
                delete creep.memory.route;
    	        delete creep.memory.exit;
    	        
	            var target;
	            // Somehow picked up a stack of minerals?? Deliver to storage.
	            if (_.sum(creep.carry) - creep.carry[RESOURCE_ENERGY] > 100) {
	                target = creep.pos.findClosestByRange(FIND_STRUCTURES, { filter: function (s) {
                                return (s.structureType == STRUCTURE_STORAGE && _.sum(s.store) < s.storeCapacity)
                                || (s.structureType == STRUCTURE_CONTAINER && _.sum(s.store) < s.storeCapacity); }});
	            }
                // Priority #1: if under attack, feed the towers
                if (creep.room.find(FIND_HOSTILE_CREEPS, { filter: function(c) { 
                            return c.getActiveBodyparts('attack') > 0 || c.getActiveBodyparts('ranged_attack') > 0; }}).length > 0) {
                    target = creep.pos.findClosestByRange(FIND_STRUCTURES, { filter: (s) => { 
                            return (s.structureType == STRUCTURE_TOWER && s.energy < s.energyCapacity); }});
                }
                // Priority #2: feed extensions and spawns (that aren't burning energy on renewing...)
                if (target == null) {
                target = creep.pos.findClosestByRange(FIND_STRUCTURES, { filter: function (s) {
                            return (s.structureType == STRUCTURE_SPAWN && s.energy < s.energyCapacity * 0.8)
                                || (s.structureType == STRUCTURE_EXTENSION && s.energy < s.energyCapacity); }});
                }
                // Priority #3: feed towers, storage, and containers
                if (target == null) {
                    target = creep.pos.findClosestByRange(FIND_STRUCTURES, { filter: function (s) {
                                return (s.structureType == STRUCTURE_TOWER && s.energy < s.energyCapacity)
                                || (s.structureType == STRUCTURE_STORAGE && _.sum(s.store) < s.storeCapacity)
                                || (s.structureType == STRUCTURE_CONTAINER && _.sum(s.store) < s.storeCapacity); }});
                }
                // And deliver... (starting with minerals)
                for (var r = Object.keys(creep.carry).length; r > 0; r--) {
                    var resourceType = Object.keys(creep.carry)[r - 1];
                    if (resourceType != RESOURCE_ENERGY && creep.carry[resourceType] < 15) {
                        continue;   // Don't drop off small stacks of boosting minerals!!
                    }
                    if (target != null 
                        && (creep.transfer(target, resourceType) == ERR_NOT_IN_RANGE 
                            ? creep.moveTo(target, {reusePath: _ticksReusePath}) 
                            : creep.transfer(target, resourceType)) == OK) {
                        return;
                    }
                }
	        } else if (creep.room.name != rmDeliver) {
                utilCreep.moveToRoom(creep, rmDeliver);
                return;
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
                if (source != null 
                    && (creep.harvest(source) == ERR_NOT_IN_RANGE 
                        ? creep.moveTo(source, {reusePath: _ticksReusePath}) 
                        : creep.harvest(source)) == OK) {
                    return;
                }
            }
        }        
        
        if (creep.memory.state == 'working') { 
            if (creep.room.name == rmDeliver) {
                delete creep.memory.route;
    	        delete creep.memory.exit;
    	        
	            var target = creep.pos.findClosestByRange(FIND_STRUCTURES, {
                            filter: function (s) {
                                return (s.structureType == STRUCTURE_STORAGE && _.sum(s.store) < s.storeCapacity); }});
                
                for (var resourceType in creep.carry) {
                    if (target != null 
                        && (creep.transfer(target, resourceType) == ERR_NOT_IN_RANGE 
                            ? creep.moveTo(target, {reusePath: _ticksReusePath}) 
                            : creep.transfer(target, resourceType)) == OK) {
                        return;
                    }
	            }
	        }
	        else if (creep.room.name != rmDeliver) {
                utilCreep.moveToRoom(creep, rmDeliver);
                return;
	        }
        }
	},


    Reserve: function(creep, rmHarvest) {
        if (creep.room.name != rmHarvest) {
            utilCreep.moveToRoom(creep, rmHarvest);
            return;
        }
        else if (creep.room.name == rmHarvest) {
            if ((creep.reserveController(creep.room.controller) == ERR_NOT_IN_RANGE 
                    ? creep.moveTo(creep.room.controller) 
                    : creep.reserveController(creep.room.controller)) == OK) {
                return;
            }
        }
    }
};

module.exports = RolesMining;
