var uCreep = require('util.creep');
var uTask = require('util.tasks');

var Roles = {
    Worker: function(creep) {
        if (creep.memory.room != null && creep.room.name != creep.memory.room) {
            uCreep.moveToRoom(creep, creep.memory.room);
        }
        else if (creep.memory.state == 'refueling') {
            if (_.sum(creep.carry) == creep.carryCapacity) {
                creep.memory.state = 'working';
                delete creep.memory.task;
                return;
            }
            
            uTask.assignTask(creep, true);        
            if (uCreep.runTaskTimer(creep)) {
                uCreep.runTask(creep);
            }
            return;

        } else if (creep.memory.state == 'working') {            
            if (creep.carry[RESOURCE_ENERGY] == 0) {
                    creep.memory.state = 'refueling';
                    delete creep.memory.task;
                    return;
                }
            
            uTask.assignTask(creep, false);
            if (uCreep.runTaskTimer(creep)) {
                uCreep.runTask(creep);
            }
            return;

        } else {
            creep.memory.state = 'refueling';
            return;
        } },

    Mining: function(creep) {
        if (creep.memory.state == 'refueling') {
            if (_.sum(creep.carry) == creep.carryCapacity && creep.carryCapacity > 0) {
                creep.memory.state = 'delivering';
                delete creep.memory.task;
                return;
            }
            
            uTask.assignTask(creep, true);        
            if (uCreep.runTaskTimer(creep)) {
                uCreep.runTask(creep);
            }
            return;

        } else if (creep.memory.state == 'delivering') {            
            if (creep.carryCapacity == 0
                || (creep.carry[RESOURCE_ENERGY] == 0 && _.sum(creep.carry) < creep.carryCapacity)) {
                creep.memory.state = 'refueling';
                delete creep.memory.task;
                return;
            }

            uTask.assignTask(creep, false);
            if (uCreep.runTaskTimer(creep)) {
                uCreep.runTask(creep);
            }
            return;

        } else {
            creep.memory.state = 'refueling';
            return;
        } },

    Extracter: function(creep) {
        switch (creep.memory.state) {
            default:
            case 'get_minerals':
                if (_.sum(creep.carry) == creep.carryCapacity) {
                    creep.memory.state = 'deliver';
                }

                uTask.assignTask(creep, true);
                if (uCreep.runTaskTimer(creep)) {
                    uCreep.runTask(creep);
                }
            return;

            case 'deliver':
                if (_.sum(creep.carry) < creep.carryCapacity) {
                    creep.memory.state = 'get_minerals';
                }

                uTask.assignTask(creep, false);
                if (uCreep.runTaskTimer(creep)) {
                    uCreep.runTask(creep);
                }
            return;
        } },

    Reserver: function(creep) {
        if (creep.memory.room != null && creep.room.name != creep.memory.room) {
            uCreep.moveToRoom(creep, creep.memory.room, true);
            return;
        }
        else {
            if ((creep.reserveController(creep.room.controller) == ERR_NOT_IN_RANGE 
                    ? creep.moveTo(creep.room.controller) 
                    : creep.reserveController(creep.room.controller)) == OK) {
                return;
            }
        } },

    Soldier: function(creep) {
        if (creep.memory.room != null && creep.room.name != creep.memory.room) {
            uCreep.moveToRoom(creep, creep.memory.room);
        }
        else {
            var targets = creep.room.find(FIND_HOSTILE_CREEPS, { filter: function(c) { 
                return Object.keys(Memory['hive']['allies']).indexOf(c.owner.username) < 0; }});
            
            if (targets.length > 0) {
                if(creep.attack(targets[0]) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(targets[0]);
                }
            }
        } },

    Archer: function(creep) {
        if (creep.memory.room != null && creep.room.name != creep.memory.room) {
            uCreep.moveToRoom(creep, creep.memory.room);
        }
        else {
            var allTargets = creep.room.find(FIND_HOSTILE_CREEPS, { filter: function(c) { 
                    return Object.keys(Memory['hive']['allies']).indexOf(c.owner.username) < 0; }});
            var nearTargets = creep.pos.findInRange(allTargets, 3);
            
            if (nearTargets.length == 0) {
                if (allTargets.length > 0) {
                    moveTo(allTargets[0]);
                }
            } else if (nearTargets.length > 2) {
                creep.rangedMassAttack();
            } else if (nearTargets.length > 0) {
                creep.rangedAttack(nearTargets[0]);
                if (creep.pos.getRangeTo(nearTargets[0]) < 2) {
                    uCreep.moveFrom(creep, nearTargets[0]);
                }
            }
        } },

    Healer: function(creep) {
        if (creep.memory.room != null && creep.room.name != creep.memory.room) {
            uCreep.moveToRoom(creep, creep.memory.room);
        }
        else {
            var wounded = creep.pos.findClosestByRange(FIND_MY_CREEPS, { filter: function(c) { 
                return c.hits < c.hitsMax; }});
            
            if (wounded != null && creep.heal(wounded) == ERR_NOT_IN_RANGE) {                
                creep.rangedHeal(wounded);
                creep.moveTo(wounded);
            }
        } }
};

module.exports = Roles;