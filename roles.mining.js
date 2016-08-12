var uCr = require('util.creep');

var RolesMining = {

    Mining: function(creep, rmDeliver, rmHarvest) {
        if (creep.memory.state == 'refueling') {
                if (_.sum(creep.carry) == creep.carryCapacity && creep.carryCapacity > 0) {
                    creep.memory.state = 'delivering';
                    delete creep.memory.task;
                    return;
                }
                
                RolesMining.Mining_FindEnergy(creep, rmDeliver, rmHarvest);                
                RolesMining.Mining_GetEnergy(creep, rmDeliver, rmHarvest);
                return;

        } else if (creep.memory.state == 'delivering') {            
                if (creep.carryCapacity == 0
                    || (creep.carry[RESOURCE_ENERGY] == 0 && _.sum(creep.carry) < creep.carryCapacity)) {
                    creep.memory.state = 'refueling';
                    delete creep.memory.task;
                    return;
                }

                RolesMining.Mining_AssignDelivery(creep, rmDeliver, rmHarvest);                
                RolesMining.Mining_RunDelivery(creep, rmDeliver, rmHarvest);
                return;

        } else {
            creep.memory.state = 'refueling';
            return;
        }
    },


    Mining_FindEnergy: function(creep, rmDeliver, rmHarvest) {
        if (creep.memory.task != null) {
            return;
        }

        if (creep.room.name != rmHarvest) {
            uCr.moveToRoom(creep, rmHarvest);
            return;
        } 
        
        if (creep.carryCapacity > 0) {  // Carriers and miners, priority is to move energy throughout the room                    
            // Priority #1: get dropped energy
            var source = creep.pos.findClosestByRange(FIND_DROPPED_ENERGY);
            if (source != null) {    
                creep.memory.task = {
                    type: 'pickup',
                    id: source.id,
                    timer: 5 };
                return;                        
            }

            // Priority #2: get energy from storage
            var sources = creep.room.find(FIND_STRUCTURES, { filter: function (s) { 
                return (s.structureType == STRUCTURE_CONTAINER && s.store[RESOURCE_ENERGY] > 0)
                    || (s.structureType == STRUCTURE_STORAGE && s.store[RESOURCE_ENERGY] > 0); }})
                .sort(function(a, b) { return b.store[RESOURCE_ENERGY] - a.store[RESOURCE_ENERGY]; });
            if (sources.length > 0) {
                creep.memory.task = {
                    type: 'withdraw',
                    id: sources[0].id,
                    timer: 5 };
                return;
            } 
        
            // Priority #3: if able to, mine.
            if (creep.getActiveBodyparts('work') > 0) {
                var source = creep.pos.findClosestByRange(FIND_SOURCES, { filter: function (s) { return s.energy > 0; }});
                if (source != null) { 
                    creep.memory.task = {
                        type: 'mine',
                        id: source.id,
                        timer: 10 };
                    return;
                } 
            }
        } else if (creep.carryCapacity == 0) { 
            
            // Burrowers, straight to the source
            var source = creep.pos.findClosestByPath(FIND_SOURCES, { filter: function (s) { return s.energy > 0; }});
            if (source == null) {   // All sources are empty? Move to the one renewing next!
                var sources = creep.room.find(FIND_SOURCES).sort(function(a, b) { return a.ticksToRegeneration - b.ticksToRegeneration; });
                source = sources.length > 0 ? sources[0] : null;
            }
            if (source != null) {
                creep.memory.task = {
                    type: 'mine',
                    id: source.id,
                    timer: 10 };
                return;                    
            }
        }
    
        // If there is no energy to get... at least do something!
        if (creep.memory.task == null) {
            creep.memory.state = 'delivering';
            return;
        }
    },


    Mining_GetEnergy: function(creep, rmDeliver, rmHarvest) {
        var _ticksReusePath = 8;

        if (creep.memory.task == null) {            
            return;
        } 
        else if (creep.memory.task['timer'] != null) {
            // Process the task timer
            creep.memory.task['timer'] = creep.memory.task['timer'] - 1;
            if (creep.memory.task['timer'] <= 0) {
                delete creep.memory.task;
                return;
            }
        }

        var source = Game.getObjectById(creep.memory.task['id']);
        switch (creep.memory.task['type']) {
            case 'pickup':
                if (creep.pickup(source) == ERR_NOT_IN_RANGE) {
                    return creep.moveTo(source, {reusePath: _ticksReusePath}) == ERR_NO_PATH
                        ? creep.moveTo(new RoomPosition(25, 25, source.room.name)) : 1;
                } else {    // Action takes one tick... task complete... delete task...
                    delete creep.memory.task;
                    return;
                }

            case 'withdraw':                 
                if (creep.withdraw(source, 'energy') == ERR_NOT_IN_RANGE) {
                    return creep.moveTo(source, {reusePath: _ticksReusePath}) == ERR_NO_PATH
                        ? creep.moveTo(new RoomPosition(25, 25, source.room.name)) : 1;
                } else {    // Action takes one tick... task complete... delete task...
                    delete creep.memory.task;
                    return;
                }

            default:
            case 'mine':
                var result = creep.harvest(source); 
                if (result == ERR_NOT_IN_RANGE || result == ERR_NOT_ENOUGH_RESOURCES) {
                    return creep.moveTo(source, {reusePath: _ticksReusePath}) == ERR_NO_PATH
                        ? creep.moveTo(new RoomPosition(25, 25, source.room.name)) : 1;
                } else if (result != OK) {
                    delete creep.memory.task;
                    return;
                } else { return; }
        }
    },
        

    Mining_AssignDelivery: function(creep, rmDeliver, rmHarvest) {
        if (creep.memory.task != null) {
            return;
        }
        
        if (creep.room.name != rmDeliver) {
            uCr.moveToRoom(creep, rmDeliver);
            return;
        }

        var target;
        // Somehow picked up a stack of minerals?? Deliver to storage.
        if (_.sum(creep.carry) - creep.carry[RESOURCE_ENERGY] > 100) {
            target = creep.pos.findClosestByRange(FIND_STRUCTURES, { filter: function (s) {
                        return (s.structureType == STRUCTURE_STORAGE && _.sum(s.store) < s.storeCapacity)
                        || (s.structureType == STRUCTURE_CONTAINER && _.sum(s.store) < s.storeCapacity); }});
        }
        // Priority #1: keep towers fed... and if under attack, top them off!
        if (target == null) {
            target = creep.pos.findClosestByRange(FIND_STRUCTURES, { filter: function (s) {
                return s.structureType == STRUCTURE_TOWER && s.energy < s.energyCapacity * 0.4; }});
        }
        if (creep.room.find(FIND_HOSTILE_CREEPS, { filter: function(c) { 
                    return c.getActiveBodyparts('attack') > 0 || c.getActiveBodyparts('ranged_attack') > 0; }}).length > 0) {
            target = creep.pos.findClosestByRange(FIND_STRUCTURES, { filter: (s) => { 
                    return s.structureType == STRUCTURE_TOWER && s.energy < s.energyCapacity * 0.9; }});
        }
        // Priority #2: feed extensions and spawns (that aren't burning energy on renewing...)
        if (target == null) {
        target = creep.pos.findClosestByPath(FIND_STRUCTURES, { filter: function (s) {
                    return (s.structureType == STRUCTURE_SPAWN && s.energy < s.energyCapacity * 0.85)
                        || (s.structureType == STRUCTURE_EXTENSION && s.energy < s.energyCapacity); }});
        }
        // Priority #3: feed links sending to upgraders
        if (target == null && Memory['hive']['rooms'][creep.room.name]['links'] != null) {
            for (var l = 0; l < Object.keys(Memory['hive']['rooms'][creep.room.name]['links']).length; l++) {
                if (Memory['hive']['rooms'][creep.room.name]['links'][l]['role'] == 'send') {
                    var link = Game.getObjectById(Memory['hive']['rooms'][creep.room.name]['links'][l]['id']);
                    target = (link.energy < link.energyCapacity && creep.pos.getRangeTo(link) < 10) ? link : null;
                    break;
                }
            }
        }
        // Priority #4: feed towers, storage, and containers
        if (target == null) {
            target = creep.pos.findClosestByRange(FIND_STRUCTURES, { filter: function (s) {
                        return (s.structureType == STRUCTURE_TOWER && s.energy < s.energyCapacity)
                        || (s.structureType == STRUCTURE_STORAGE && _.sum(s.store) < s.storeCapacity)
                        || (s.structureType == STRUCTURE_CONTAINER && _.sum(s.store) < s.storeCapacity); }});
        }
        // And set the delivery task!
        creep.memory.task = {
            type: 'deposit',
            id: target.id,
            timer: 10 };
        return;   
    },


    Mining_RunDelivery: function(creep, rmDeliver, rmHarvest) {
        var target;
        var _ticksReusePath = 5;

        if (creep.memory.task != null && creep.memory.task['timer'] != null) {
            // Process the task timer
            creep.memory.task['timer'] = creep.memory.task['timer'] - 1;
            if (creep.memory.task['timer'] <= 0) {
                delete creep.memory.task;                  
                return;
            }
        }

        if (creep.memory.task != null) {
            // Make sure the target hasn't filled up...
            target = Game.getObjectById(creep.memory.task['id']);
            if ((target.structureType == STRUCTURE_SPAWN && target.energy == target.energyCapacity)
                    || (target.structureType == STRUCTURE_EXTENSION && target.energy == target.energyCapacity)
                    || (target.structureType == STRUCTURE_LINK && target.energy == target.energyCapacity)
                    || (target.structureType == STRUCTURE_TOWER && target.energy == target.energyCapacity)
                    || (target.structureType == STRUCTURE_STORAGE && _.sum(target.store) == target.storeCapacity)
                    || (target.structureType == STRUCTURE_CONTAINER && _.sum(target.store) == target.storeCapacity)) {
                RolesMining.Mining_AssignDelivery(creep, rmDeliver, rmHarvest);
            }
        }

        if (creep.memory.task != null) {
            // Cycle through all resources and deposit, starting with minerals
            target = Game.getObjectById(creep.memory.task['id']);
            for (var r = Object.keys(creep.carry).length; r > 0; r--) {
                var resourceType = Object.keys(creep.carry)[r - 1];
                if (target != null && creep.transfer(target, resourceType) == ERR_NOT_IN_RANGE) {
                    return creep.moveTo(target, {reusePath: _ticksReusePath}) == ERR_NO_PATH
                        ? creep.moveTo(new RoomPosition(25, 25, target.room.name)) : 1;
                } else {
                    delete creep.memory.task;
                    return;
                }
            }
        }
	},


    Extract: function(creep, rmDeliver, rmHarvest) {
        switch (creep.memory.state) {
            default:
            case 'get_minerals':
                if (_.sum(creep.carry) == creep.carryCapacity) {
                    creep.memory.state = 'deliver';
                }

                RolesMining.Extract_GetMinerals(creep, rmDeliver, rmHarvest);
            break;

            case 'deliver':
                if (_.sum(creep.carry) < creep.carryCapacity) {
                    creep.memory.state = 'get_minerals';
                }

                RolesMining.Extract_Deliver(creep, rmDeliver, rmHarvest);
            break;
        }
    },

    Extract_GetMinerals: function(creep, rmDeliver, rmHarvest) {
        var _ticksReusePath = 10;
        
        if (creep.room.name != rmHarvest) {
            uCr.moveToRoom(creep, rmHarvest);
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
    },     
        
    Extract_Deliver: function(creep, rmDeliver, rmHarvest) {
        var _ticksReusePath = 10;

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
            uCr.moveToRoom(creep, rmDeliver);
            return;
        }
	},


    Reserve: function(creep, rmHarvest) {
        if (creep.memory.room != null && creep.room.name != creep.memory.room) {
            uCr.moveToRoom(creep, creep.memory.room);
            return;
        }
        else {
            if ((creep.reserveController(creep.room.controller) == ERR_NOT_IN_RANGE 
                    ? creep.moveTo(creep.room.controller) 
                    : creep.reserveController(creep.room.controller)) == OK) {
                return;
            }
        }
    }
};

module.exports = RolesMining;
