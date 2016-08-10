var uCr = require('util.creep');

var RolesWork = {

    Worker: function(creep) {
        if (creep.memory.room != null && creep.room.name != creep.memory.room) {
            uCr.moveToRoom(creep, creep.memory.room);
        }
        else {
            switch (creep.memory.state) {
                default:
                    creep.memory.state = 'energy_needed';
                    break;

                case 'energy_needed':
                    RolesWork.Worker_FindEnergy(creep);
                    break;

                case 'energy_fetch':
                    if (_.sum(creep.carry) == creep.carryCapacity) {
                        creep.memory.state = 'task_needed';
                        delete creep.memory.task;
                        break;
                    }     
                    
                    RolesWork.Worker_GetEnergy(creep);
                    break;

                case 'task_needed':
                    RolesWork.Worker_AssignTask(creep);
                    break;

                case 'task_working':
                    if (creep.carry[RESOURCE_ENERGY] == 0) {
                        creep.memory.state = 'energy_needed';
                        delete creep.memory.task;
                        break;
                    }
                    
                    RolesWork.Worker_RunTask(creep);
                    break;

            }
        }
    },

    
    Worker_FindEnergy: function(creep) {
        // Priority #1: get dropped energy
        var source = creep.pos.findClosestByRange(FIND_DROPPED_ENERGY, { filter: function (s) { 
            return s.amount >= creep.carryCapacity * 0.5 && s.resourceType == RESOURCE_ENERGY; }});
        if (source != null) {
            creep.memory.task = {
                type: 'pickup',
                id: source.id,
                timer: 10 };
            creep.memory.state = 'energy_fetch';
            return;
        }

        // Priority #2: get energy from receiving links
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
                    creep.memory.state = 'energy_fetch';
                    return;
                } 
            }
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
            creep.memory.state = 'energy_fetch';
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
                creep.memory.state = 'energy_fetch';
                return;
            }
        } 

    },


    Worker_GetEnergy: function(creep) {
        var _ticksReusePath = 8;

        if (creep.memory.task == null) {
            delete creep.memory.task;
            creep.memory.state == 'energy_needed';
        } 
        else if (creep.memory.task['timer'] != null) {
            // Process the task timer
            creep.memory.task['timer'] = creep.memory.task['timer'] - 1;
            if (creep.memory.task['timer'] <= 0) {
                RolesWork.Worker_FindEnergy(creep);
            }
        }

        var source = Game.getObjectById(creep.memory.task['id']);
        switch (creep.memory.task['type']) {
            case 'pickup':
                var result = creep.pickup(source); 
                if (result == OK && source != null && source.amount > creep.carryCapacity * 0.3) {
                    return;
                } else if (result == ERR_NOT_IN_RANGE) {
                    creep.moveTo(source, {reusePath: _ticksReusePath});
                    return;
                } else {
                    RolesWork.Worker_FindEnergy(creep);
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
                    RolesWork.Worker_FindEnergy(creep);
                    return;
                }

            default:
            case 'mine':
                var result = creep.harvest(source); 
                if (result == OK && source.energy > 0) {
                    return;
                } else if (result == ERR_NOT_IN_RANGE) {
                    creep.moveTo(source, {reusePath: _ticksReusePath});
                    return;
                } else {
                    RolesWork.Worker_FindEnergy(creep);
                    return;
                }
        }
    },


    Worker_AssignTask: function(creep) {
        var structure;
        var uCo = require('util.colony');

        // Priority #1: Upgrade critical downgrade timer
        if (creep.memory.subrole == 'upgrader' 
            || (creep.room.controller != null && creep.room.controller.level > 0 && creep.room.controller.ticksToDowngrade < 3500)) {
            creep.memory.task = {
                type: 'upgrade',
                id: creep.room.controller.id,
                timer: 20 };
            creep.memory.state = 'task_working';
            return;
        }
        // Priority #2: Repair critical structures
        structure = uCo.findByNeed_RepairCritical(creep.room);
        if (structure != null) {
            creep.memory.task = {
                type: 'repair',
                id: structure.id,
                timer: 20 };
            creep.memory.state = 'task_working';
            return;
        }
        // Priority #3: Build
        structure = creep.pos.findClosestByPath(FIND_CONSTRUCTION_SITES);
        if (structure != null) {
            creep.memory.task = {
                type: 'build',
                id: structure.id,
                timer: 30 };
            creep.memory.state = 'task_working';
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
                creep.memory.state = 'task_working';
                return;
            }
        }
        // Priority #5: Upgrade controller
        if (creep.room.controller != null && creep.room.controller.level > 0) {
            creep.memory.task = {
                type: 'upgrade',
                id: creep.room.controller.id,
                timer: 60 };
            creep.memory.state = 'task_working';
            return;
        }
    },


    Worker_RunTask: function(creep) {
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
                RolesWork.Worker_AssignTask(creep);
            }
        }

        switch (creep.memory.task['type']) {
            default:
            case 'upgrade':
                var controller = Game.getObjectById(creep.memory.task['id']);
                var result = creep.upgradeController(controller); 
                if (result == OK) {
                    return;
                } else if (result == ERR_NOT_IN_RANGE) {
                    creep.moveTo(controller, {reusePath: _ticksReusePath});
                    return;
                } else {
                    RolesWork.Worker_AssignTask(creep);
                    return;
                }

            case 'repair':
                var structure = Game.getObjectById(creep.memory.task['id']);
                var result = creep.repair(structure); 
                if (result == OK && structure.hits != structure.hitsMax) {
                    return;
                } else if (result == ERR_NOT_IN_RANGE) {
                    creep.moveTo(structure, {reusePath: _ticksReusePath});
                    return;
                } else {
                    RolesWork.Worker_AssignTask(creep);
                    return;
                }
            
            case 'build':
                var structure = Game.getObjectById(creep.memory.task['id']);
                var result = creep.build(structure);
                if (result == OK) {
                    return;
                } else if (result == ERR_NOT_IN_RANGE) {
                    creep.moveTo(structure, {reusePath: _ticksReusePath});
                    return;
                } else {
                    RolesWork.Worker_AssignTask(creep);
                    return;
                }
        }
    }
};

module.exports = RolesWork;