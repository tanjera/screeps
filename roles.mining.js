var uCr = require('util.creep');

var RolesMining = {

    Mining: function(creep, rmDeliver, rmHarvest) {
        switch (creep.memory.state) {
            default:
                creep.memory.state = 'energy_needed';
                break;

            case 'energy_needed':
                RolesMining.Mining_FindEnergy(creep, rmDeliver, rmHarvest);
                RolesMining.Mining_GetEnergy(creep, rmDeliver, rmHarvest);
                break;

            case 'energy_fetch':
                if (_.sum(creep.carry) == creep.carryCapacity && creep.carryCapacity > 0) {
                    creep.memory.state = 'delivery_needed';
                    delete creep.memory.task;
                    break;
                }
                
                RolesMining.Mining_GetEnergy(creep, rmDeliver, rmHarvest);
                break;

            case 'delivery_needed':
                RolesMining.Mining_AssignDelivery(creep, rmDeliver, rmHarvest);
                RolesMining.Mining_RunDelivery(creep, rmDeliver, rmHarvest);
                break;

            case 'delivery_working':
                if (creep.carryCapacity == 0
                    || (creep.carry[RESOURCE_ENERGY] == 0 && _.sum(creep.carry) < creep.carryCapacity)) {
                    creep.memory.state = 'energy_needed';
                    delete creep.memory.task;
                    break;
                }
                
                RolesMining.Mining_RunDelivery(creep, rmDeliver, rmHarvest);
                break;
        }
    },


    Mining_FindEnergy: function(creep, rmDeliver, rmHarvest) {
        
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
                creep.memory.state = 'energy_fetch';
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
                creep.memory.state = 'energy_fetch';
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
                    creep.memory.state = 'energy_fetch';
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
                creep.memory.state = 'energy_fetch';
                return;                    
            }
        }
    
        // If there is no energy to get... at least do something!
        if (creep.memory.task == null) {
            delete creep.memory.task;
            creep.memory.state = 'delivery_needed';
            return;
        }
    },


    Mining_GetEnergy: function(creep, rmDeliver, rmHarvest) {
        var _ticksReusePath = 8;

        if (creep.memory.task == null) {
            creep.memory.state == 'energy_needed';
            return;
        } 
        else if (creep.memory.task['timer'] != null) {
            // Process the task timer
            creep.memory.task['timer'] = creep.memory.task['timer'] - 1;
            if (creep.memory.task['timer'] <= 0) {
                delete creep.memory.task;
                RolesMining.Mining_FindEnergy(creep, rmDeliver, rmHarvest);
                return;
            }
        }

        var source = Game.getObjectById(creep.memory.task['id']);
        switch (creep.memory.task['type']) {
            case 'pickup':
                var result = creep.pickup(source); 
                if (result == OK && source != null && source.amount > creep.carryCapacity * 0.1) {
                    return;
                } else if (result == ERR_NOT_IN_RANGE) {
                    creep.moveTo(source, {reusePath: _ticksReusePath});
                    return;
                } else {
                    delete creep.memory.task;
                    RolesMining.Mining_FindEnergy(creep, rmDeliver, rmHarvest);
                    return;
                }

            case 'withdraw':
                var result = creep.withdraw(source, 'energy'); 
                if (result == OK) {
                    return;
                } else if (result == ERR_NOT_IN_RANGE) {
                    creep.moveTo(source, {reusePath: _ticksReusePath});
                    return;
                } else {
                    delete creep.memory.task;
                    RolesMining.Mining_FindEnergy(creep, rmDeliver, rmHarvest);
                    return;
                }

            default:
            case 'mine':
                var result = creep.harvest(source); 
                if (result == OK) {
                    return;
                } else if (result == ERR_NOT_IN_RANGE || result == ERR_NOT_ENOUGH_RESOURCES) {
                    creep.moveTo(source, {reusePath: _ticksReusePath});
                    return;
                } else {
                    delete creep.memory.task;
                    RolesMining.Mining_FindEnergy(creep, rmDeliver, rmHarvest);
                    return;
                }
        }
    },
        

    Mining_AssignDelivery: function(creep, rmDeliver, rmHarvest) {
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
            timer: 2 };
        creep.memory.state = 'delivery_working';
        return;   


    },


    Mining_RunDelivery: function(creep, rmDeliver, rmHarvest) {
        var _ticksReusePath = 8;

        if (creep.memory.task == null) {
            delete creep.memory.task;
            creep.memory.state == 'task_needed';
            return;
        } 
        else if (creep.memory.task['timer'] != null) {
            // Process the task timer
            creep.memory.task['timer'] = creep.memory.task['timer'] - 1;
            if (creep.memory.task['timer'] <= 0) {
                delete creep.memory.task;
                RolesMining.Mining_AssignDelivery(creep, rmDeliver, rmHarvest);
                return;
            }
        }

        var target = Game.getObjectById(creep.memory.task['id']);
        // Cycle through feeding spawns and extensions a bit faster...
        if ((target.structureType == STRUCTURE_SPAWN || target.structureType == STRUCTURE_EXTENSION)
                && target.energy == target.energyCapacity) {
            RolesMining.Mining_AssignDelivery(creep, rmDeliver, rmHarvest);
        }

        // Cycle through all resources and deposit, starting with minerals
        for (var r = Object.keys(creep.carry).length; r > 0; r--) {
            var resourceType = Object.keys(creep.carry)[r - 1];
            if (target != null) {
                var result = creep.transfer(target, resourceType)
                if (result == OK) {
                    return;
                } else if (result == ERR_NOT_IN_RANGE) {
                    creep.moveTo(target, {reusePath: _ticksReusePath});
                    return;
                } else {
                    delete creep.memory.task;
                    RolesMining.Mining_AssignDelivery(creep, rmDeliver, rmHarvest);
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
