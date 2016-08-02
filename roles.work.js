var utilCreep = require('util.creep');

var RolesWork = {

    Worker: function(creep) {

        if (creep.memory.room != null && creep.room.name != creep.memory.room) {
            utilCreep.moveToRoom(creep, creep.memory.room);
        }
        else {
            var _ticksReusePath = 10;

            // Manage machine states!
            if (creep.memory.state == 'working' && creep.carry[RESOURCE_ENERGY] == 0) {
                creep.memory.state = 'getenergy';
            }
            else if (creep.memory.state == 'getenergy' && _.sum(creep.carry) == creep.carryCapacity) {
                creep.memory.state = 'working';
            }
            else if (creep.memory.state != 'getenergy' && creep.memory.state != 'working') {
                creep.memory.state = 'working';
            }

            // Out of energy? Find more...
            if(creep.memory.state == 'getenergy') {
                // Priority #1: get dropped energy
                var source = creep.pos.findClosestByRange(FIND_DROPPED_ENERGY, { filter: function (s) { 
                    return s.amount >= creep.carryCapacity / 2 && s.mineralType == RESOURCE_ENERGY}});
                if (source != null && creep.pickup(source) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(source, {reusePath: _ticksReusePath});
                    return;
                }
                
                // Priority #2: get energy from storage or containers
                var source = creep.pos.findClosestByRange(FIND_STRUCTURES, { filter: function (s) { 
                    return (s.structureType == STRUCTURE_STORAGE && s.store[RESOURCE_ENERGY] > 0)
                        || (s.structureType == STRUCTURE_CONTAINER && s.store[RESOURCE_ENERGY] > 0); }});
                if (source != null && creep.withdraw(source, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(source, {reusePath: _ticksReusePath});
                    return;
                } 

                // Priority #3: if able to, mine.
                if (creep.getActiveBodyparts('work') > 0) {
                    var source = creep.pos.findClosestByRange(FIND_SOURCES, { filter: function (s) { return s.energy > 0; }});
                    if(creep.harvest(source) == ERR_NOT_IN_RANGE) {
                        creep.moveTo(source, {reusePath: _ticksReusePath});
                        return;
                    } 
                }
            }
            
            if (creep.memory.state == 'working') {
            // Order of functions: upgrade critical downgrade timer, repair, build, then upgrade extra
                if (creep.room.controller != null && creep.room.controller.ticksToDowngrade < 4000) {
                    var r = creep.upgradeController(creep.room.controller); 
                    if (r == OK) return;
                    else if (r == ERR_NOT_IN_RANGE) {
                        creep.moveTo(creep.room.controller, {reusePath: _ticksReusePath});
                        return;
                    }
                }

                var structure;
                // Repair *critical* structures
                var uc = require('util.colony');
                var structure = uc.findByNeed_RepairCritical(creep.room);
                if (structure != null) {
                    var r = creep.repair(structure); 
                    if (r == OK) return;
                    else if(r == ERR_NOT_IN_RANGE) {
                        creep.moveTo(structure, {reusePath: _ticksReusePath});
                        return;
                    }
                }

                // Build construction sites
                structure = creep.pos.findClosestByRange(FIND_CONSTRUCTION_SITES);
                if (structure != null) {
                    var r = creep.build(structure);
                    if (r == OK) return;
                    else if (r == ERR_NOT_IN_RANGE) {
                        creep.moveTo(structure, {reusePath: _ticksReusePath});
                        return;
                    }
                }

                // Repair *maintenance* for subrole repairers
                if (creep.memory.subrole == 'repairer') {
                    var uc = require('util.colony');
                    structure = uc.findByRange_RepairMaintenance(creep);
                    if (structure != null) {
                        var r = creep.repair(structure);
                        if (r == OK) return;
                        else if (r == ERR_NOT_IN_RANGE) {
                            creep.moveTo(structure, {reusePath: _ticksReusePath});
                            return;
                        }
                    }
                }

                // Or upgrade the controller
                var r = creep.upgradeController(creep.room.controller);
                if (r == OK) return;
                else if (r == ERR_NOT_IN_RANGE) {
                    creep.moveTo(creep.room.controller, {reusePath: _ticksReusePath});
                    return;
                }
            }
        }
    }
};

module.exports = RolesWork;