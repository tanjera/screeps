var utilCreep = require('util.creep');

var RolesWork = {

    Worker: function(creep) {

        if (creep.memory.room != null && creep.room.name != creep.memory.room) {
            utilCreep.moveToRoom(creep, creep.memory.room);
        }
        else {
            var _ticksReusePath = 10;

            // Manage machine states
            if (creep.carry[RESOURCE_ENERGY] == 0 && (creep.memory.state == 'task_working' || creep.memory.state == 'task_needed')) {
                creep.memory.state = 'need_energy';
                delete creep.memory.task;
            }
            else if (creep.memory.state == 'need_energy' && _.sum(creep.carry) == creep.carryCapacity) {
                creep.memory.state = 'task_needed';
            }
            else if (creep.memory.state != 'need_energy' && creep.memory.state != 'task_working') {
                creep.memory.state = 'task_needed';
            }

            // Out of energy? Find more...
            if(creep.memory.state == 'need_energy') {
                // Priority #1: get dropped energy
                var source = creep.pos.findClosestByRange(FIND_DROPPED_ENERGY, { filter: function (s) { 
                    return s.amount >= creep.carryCapacity / 2 && s.resourceType == RESOURCE_ENERGY; }});
                if (source != null && creep.pickup(source) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(source, {reusePath: _ticksReusePath});
                    return;
                }

                // Priority #2: get energy from receiving links
                if (Memory['hive']['rooms'][creep.room.name]['links'] != null) {
                    var links = _.filter(Memory['hive']['rooms'][creep.room.name]['links'], (obj) => { 
                        return obj.id && obj['role'] == 'receive'; });
                        
                    for (var l = 0; l < links.length; l++) {
                        var source = Game.getObjectById(links[l]['id']);
                        if (source != null && source.energy > 0
                                && creep.pos.getRangeTo(source) < 8 && creep.withdraw(source, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                            creep.moveTo(source, {reusePath: _ticksReusePath});
                            return;
                        } 
                    }
                }
                
                // Priority #3: get energy from storage or containers
                var source = creep.pos.findClosestByRange(FIND_STRUCTURES, { filter: function (s) { 
                    return (s.structureType == STRUCTURE_STORAGE && s.store[RESOURCE_ENERGY] > 0)
                        || (s.structureType == STRUCTURE_CONTAINER && s.store[RESOURCE_ENERGY] > 0); }});
                if (source != null && creep.withdraw(source, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(source, {reusePath: _ticksReusePath});
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
            }
            
            // Assign tasks to creeps that need them
            if (creep.memory.state == 'task_needed') {
                // Priority #1: Upgrade critical downgrade timer
                if (creep.memory.subrole == 'upgrader' 
                    || (creep.room.controller != null && creep.room.controller.level > 0 && creep.room.controller.ticksToDowngrade < 3500)) {
                    creep.memory.task = {
                        type: 'upgrade',
                        id: creep.room.controller.id,
                        timer: 20 };
                    creep.memory.state = 'task_working';
                }

                var structure;
                var uCo = require('util.colony');
                
                // Priority #2: Repair critical structures
                structure = uCo.findByNeed_RepairCritical(creep.room);
                if (structure != null) {
                    creep.memory.task = {
                        type: 'repair',
                        id: structure.id,
                        timer: 20 };
                    creep.memory.state = 'task_working';
                }

                // Priority #3: Build
                structure = creep.pos.findClosestByPath(FIND_CONSTRUCTION_SITES);
                if (structure != null) {
                    creep.memory.task = {
                        type: 'build',
                        id: structure.id,
                        timer: 30 };
                    creep.memory.state = 'task_working';
                }

                // Priority #4: Maintain (repair) structures
                if (creep.memory.subrole == 'repairer' || creep.memory.role == 'multirole') {
                    var uCo = require('util.colony');
                    structure = uCo.findByRange_RepairMaintenance(creep);
                    if (structure != null) {
                        creep.memory.task = {
                            type: 'repair',
                            id: structure.id,
                            timer: 30 };
                        creep.memory.state = 'task_working';
                    }
                }

                // Priority #5: Upgrade controller
                if (creep.room.controller != null && creep.room.controller.level > 0) {
                    creep.memory.task = {
                        type: 'upgrade',
                        id: creep.room.controller.id,
                        timer: 60 };
                    creep.memory.state = 'task_working';
                }
            }

            // Run assigned tasks
            if (creep.memory.state == 'task_working') {
            
                if (creep.memory.task == null) {
                    creep.memory.state == 'task_needed';
                } else if (creep.memory.task['timer'] != null) {
                    creep.memory.task['timer'] = creep.memory.task['timer'] - 1;
                    if (creep.memory.task['timer'] <= 0) {
                        creep.memory.state = 'task_needed';
                    }
                }

                if (creep.memory.task['type'] == 'upgrade') {
                    var controller = Game.getObjectById(creep.memory.task['id']);
                    var result = creep.upgradeController(controller); 
                    if (result == OK) return;
                    else if (result == ERR_NOT_IN_RANGE) {
                        creep.moveTo(controller, {reusePath: _ticksReusePath});
                        return;
                    } else {
                        creep.memory.state = 'task_needed';
                    }
                }

                if (creep.memory.task['type'] == 'repair') {
                    var structure = Game.getObjectById(creep.memory.task['id']);
                    var result = creep.repair(structure); 
                    if (result == OK && structure.hits != structure.hitsMax) return;
                    else if (result == ERR_NOT_IN_RANGE) {
                        creep.moveTo(structure, {reusePath: _ticksReusePath});
                        return;
                    } else {
                        creep.memory.state = 'task_needed';
                    }
                }

                if (creep.memory.task['type'] == 'build') {
                    var structure = Game.getObjectById(creep.memory.task['id']);
                    var result = creep.build(structure);
                    if (result == OK) return;
                    else if (result == ERR_NOT_IN_RANGE) {
                        creep.moveTo(structure, {reusePath: _ticksReusePath});
                        return;
                    } else {
                        creep.memory.state = 'task_needed';
                    }
                }
            }
        }
    }
};

module.exports = RolesWork;