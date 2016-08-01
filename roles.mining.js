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
    	        
    	        if (creep.carryCapacity > 0) {  // Carriers and miners, priority is to move energy throughout the room                    
                    // Priority #1: get dropped energy
                    var sources = creep.room.find(FIND_DROPPED_ENERGY).sort(function(a, b) { return b - a; });
                    if (sources.length > 0 && creep.pickup(sources[0]) == ERR_NOT_IN_RANGE) {
                        creep.moveTo(sources[0], {reusePath: _ticksReusePath});
                        return;
                    }

                    // Priority #2: get energy from receiving containers (if there is a storage) and links
                    if (creep.room.storage != null) {
                        var sources = creep.room.find(FIND_STRUCTURES, { filter: function (s) { 
                            return (s.structureType == STRUCTURE_LINK && s.energy > 0)
                                || (s.structureType == STRUCTURE_CONTAINER && s.store[RESOURCE_ENERGY] > 0); }});
                        if (sources.length > 0 && creep.withdraw(sources[0], RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                            creep.moveTo(sources[0], {reusePath: _ticksReusePath});
                            return;
                        } 
                    }

                    // Priority #3: get energy from storage
                    var sources = creep.room.find(FIND_STRUCTURES, { filter: function (s) { 
                        return s.structureType == STRUCTURE_STORAGE && s.store[RESOURCE_ENERGY] > 0; }});
                    if (sources.length > 0 && creep.withdraw(sources[0], RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                        creep.moveTo(sources[0], {reusePath: _ticksReusePath});
                        return;
                    } 

                    // Priority #4: if able to, mine.
                    if (creep.getActiveBodyparts('work') > 0) {
                        var source = creep.pos.findClosestByRange(FIND_SOURCES, { filter: function (s) { return s.energy > 0; }});
                        if(creep.harvest(source) == ERR_NOT_IN_RANGE) {
                            creep.moveTo(source, {reusePath: _ticksReusePath});
                            return;
                        } 
                    }
                } else { 
                    // Burrowers, straight to the source
                    var source = creep.pos.findClosestByPath(FIND_SOURCES, { filter: function (s) { return s.energy > 0; }});
                    if(creep.harvest(source) == ERR_NOT_IN_RANGE) {
                        creep.moveTo(source, {reusePath: _ticksReusePath});
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

                if (rmDeliver == rmHarvest) {  // Carriers that *are* working within the colony room
                    // Priority #1: if under attack, feed the towers
                    if (creep.room.find(FIND_HOSTILE_CREEPS, { filter: function(c) { 
                                return c.getActiveBodyparts('attack') > 0 || c.getActiveBodyparts('ranged_attack') > 0; }}).length > 0) {
                        target = creep.pos.findClosestByRange(FIND_STRUCTURES, { filter: (s) => { 
                                return (s.structureType == STRUCTURE_TOWER && s.energy < s.energyCapacity); }});
                    }
                    // Priority #2: feed spawns and extensions
                    if (target == null) {
                    target = creep.pos.findClosestByRange(FIND_STRUCTURES, { filter: function (s) {
                                return (s.structureType == STRUCTURE_SPAWN && s.energy < s.energyCapacity)
                                    || (s.structureType == STRUCTURE_EXTENSION && s.energy < s.energyCapacity); }});
                    }
                    // Priority #3: feed towers and storage
                    if (target == null) {
                        target = creep.pos.findClosestByRange(FIND_STRUCTURES, { filter: function (s) {
                                    return (s.structureType == STRUCTURE_TOWER && s.energy < s.energyCapacity)
                                    || (s.structureType == STRUCTURE_STORAGE && _.sum(s.store) < s.storeCapacity); }});
                    }
                    // Priority #4: fill containers
                    if (target == null) {
                        target = creep.pos.findClosestByRange(FIND_STRUCTURES, { filter: function (s) {
                                    return (s.structureType == STRUCTURE_CONTAINER && s.energy < s.energyCapacity); }});
                    }
                }
                else if (rmDeliver != rmHarvest) {   // Carriers *not* working within the colony room
                    // Priority #1: fill links and delivery containers 
                    target = creep.pos.findClosestByRange(FIND_STRUCTURES, { filter: function (s) {
                                    return (s.structureType == STRUCTURE_LINK && s.energy < s.energyCapacity)
                                        || (s.structureType == STRUCTURE_CONTAINER && s.energy < s.energyCapacity); }});
                     
                    // Priority #2: feed spawns and extensions
                    if (target == null) {
                    target = creep.pos.findClosestByRange(FIND_STRUCTURES, { filter: function (s) {
                                return (s.structureType == STRUCTURE_SPAWN && s.energy < s.energyCapacity)
                                    || (s.structureType == STRUCTURE_EXTENSION && s.energy < s.energyCapacity); }});
                    }
                    // Priority #3: feed towers and storage
                    if (target == null) {
                        target = creep.pos.findClosestByRange(FIND_STRUCTURES, { filter: function (s) {
                                    return (s.structureType == STRUCTURE_TOWER && s.energy < s.energyCapacity)
                                    || (s.structureType == STRUCTURE_STORAGE && _.sum(s.store) < s.storeCapacity); }});
                    }
                }

                if (target != null) {
                    for (var resourceType in creep.carry) {
                        if (creep.transfer(target, resourceType) == ERR_NOT_IN_RANGE) {
                            creep.moveTo(target, {reusePath: _ticksReusePath});
                            return;
                        }
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
                if(creep.harvest(source) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(source, {reusePath: _ticksReusePath});
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
                    if (creep.transfer(target, resourceType) == ERR_NOT_IN_RANGE) {
                        creep.moveTo(target, {reusePath: _ticksReusePath});
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
            if(creep.reserveController(creep.room.controller) == ERR_NOT_IN_RANGE) {
                creep.moveTo(creep.room.controller);
                return;
            }
        }
    }
};

module.exports = RolesMining;
