var uCr = require('util.creep');

var RolesWork = {

    Worker: function(creep) {
        if (creep.memory.room != null && creep.room.name != creep.memory.room) {
            uCr.moveToRoom(creep, creep.memory.room);
        }
        else if (creep.memory.state == 'refueling') {
            if (_.sum(creep.carry) == creep.carryCapacity) {
                creep.memory.state = 'working';
                delete creep.memory.task;
                return;
            }
            
            RolesWork.Worker_FindEnergy(creep);
            RolesWork.Worker_GetEnergy(creep);
            return;

        } else if (creep.memory.state == 'working') {            
            if (creep.carry[RESOURCE_ENERGY] == 0) {
                    creep.memory.state = 'refueling';
                    delete creep.memory.task;
                    return;
                }
            
            RolesWork.Worker_AssignTask(creep);
            RolesWork.Worker_RunTask(creep);
            return;

        } else {
            creep.memory.state = 'refueling';
            return;
        }                        
    },

    
    Worker_FindEnergy: function(creep) {
        if (creep.memory.task != null) {
            return;
        }

        // Priority #1: get energy from nearby receiving links
        if (Memory['hive']['rooms'][creep.room.name]['links'] != null) {
            var links = _.filter(Memory['hive']['rooms'][creep.room.name]['links'], (obj) => { 
                return obj.id && obj['role'] == 'receive'; });
                
            for (var l = 0; l < links.length; l++) {
                var source = Game.getObjectById(links[l]['id']);
                if (source != null && source.energy > 0 && creep.pos.getRangeTo(source) < 8) {
                    creep.memory.task = {
                        type: 'withdraw',
                        id: source.id,
                        timer: 5 };
                    return;
                } 
            }
        }

        // Priority #2: get dropped energy
        var source = creep.pos.findClosestByRange(FIND_DROPPED_ENERGY, { filter: function (s) { 
            return s.amount >= creep.carryCapacity * 0.3 && s.resourceType == RESOURCE_ENERGY; }});
        if (source != null) {
            creep.memory.task = {
                type: 'pickup',
                id: source.id,
                timer: 10 };
            return;
        }

        // Priority #3: get energy from storage or containers
        var source = creep.pos.findClosestByRange(FIND_STRUCTURES, { filter: function (s) { 
            return (s.structureType == STRUCTURE_STORAGE && s.store[RESOURCE_ENERGY] > 0)
                || (s.structureType == STRUCTURE_CONTAINER && s.store[RESOURCE_ENERGY] > 0); }});
        if (source != null) {
            creep.memory.task = {
                type: 'withdraw',
                id: source.id,
                timer: 5 };
            return;
        } 

        // Priority #4: if able to, mine.
        if (creep.getActiveBodyparts('work') > 0) {
            var source = creep.pos.findClosestByRange(FIND_SOURCES, { filter: function (s) { return s.energy > 0; }});
            if (source != null) {
                creep.memory.task = {
                    type: 'mine',
                    id: source.id,
                    timer: 5 };
                return;
            }
        } 

        // If there is no energy to get... at least do something!
        if (creep.memory.task == null) {
            creep.memory.state = 'working';
            return;
        }
    },


    Worker_GetEnergy: function(creep) {
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


    Worker_AssignTask: function(creep) {
        if (creep.memory.task != null) {
            return;
        }

        var structure;
        var uCo = require('util.colony');

        // Priority #1: Upgrade critical downgrade timer
        if (creep.memory.subrole == 'upgrader' 
            || (creep.room.controller != null && creep.room.controller.level > 0 && creep.room.controller.ticksToDowngrade < 3500)) {
            creep.memory.task = {
                type: 'upgrade',
                id: creep.room.controller.id,
                timer: 20 };
            return;
        }
        // Priority #2: Repair critical structures
        structure = uCo.findByNeed_RepairCritical(creep.room);
        if (structure != null) {
            creep.memory.task = {
                type: 'repair',
                id: structure.id,
                timer: 20 };
            return;
        }
        // Priority #3: Build
        structure = creep.pos.findClosestByPath(FIND_CONSTRUCTION_SITES);
        if (structure != null) {
            creep.memory.task = {
                type: 'build',
                id: structure.id,
                timer: 30 };
            return;
        }
        // Priority #4: Maintain (repair) structures
        if (creep.memory.subrole == 'repairer' || creep.memory.role == 'multirole') {
            structure = uCo.findByRange_RepairMaintenance(creep);
            if (structure != null) {
                creep.memory.task = {
                    type: 'repair',
                    id: structure.id,
                    timer: 30 };
                return;
            }
        }
        // Priority #5: Upgrade controller
        if (creep.room.controller != null && creep.room.controller.level > 0) {
            creep.memory.task = {
                type: 'upgrade',
                id: creep.room.controller.id,
                timer: 60 };
            return;
        }
    },


    Worker_RunTask: function(creep) {
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

        switch (creep.memory.task['type']) {
            default:
            case 'upgrade':
                var controller = Game.getObjectById(creep.memory.task['id']);
                var result = creep.upgradeController(controller); 
                if (result == ERR_NOT_IN_RANGE) {
                    return creep.moveTo(controller, {reusePath: _ticksReusePath}) == ERR_NO_PATH
                        ? creep.moveTo(new RoomPosition(25, 25, controller.room.name)) : 1;
                } else if (result != OK) {
                    delete creep.memory.task;
                    return;
                } else { return; }

            case 'repair':
                var structure = Game.getObjectById(creep.memory.task['id']);
                var result = creep.repair(structure); 
                if (result == ERR_NOT_IN_RANGE) {
                    return creep.moveTo(structure, {reusePath: _ticksReusePath}) == ERR_NO_PATH
                        ? creep.moveTo(new RoomPosition(25, 25, structure.room.name)) : 1;
                } else if (result != OK || structure.hits == structure.hitsMax) {
                    delete creep.memory.task;
                    return;
                } else { return; }
            
            case 'build':
                var structure = Game.getObjectById(creep.memory.task['id']);
                var result = creep.build(structure);
                if (result == ERR_NOT_IN_RANGE) {
                    return creep.moveTo(structure, {reusePath: _ticksReusePath}) == ERR_NO_PATH
                        ? creep.moveTo(new RoomPosition(25, 25, structure.room.name)) : 1;
                } else if (result != OK) {
                    delete creep.memory.task;
                    return;
                } else { return; }
        }
    }
};

module.exports = RolesWork;