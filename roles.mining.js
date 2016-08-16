var uCreep = require('util.creep');
var uTask = require('util.tasks');

var RolesMining = {

    Mining: function(creep, rmDeliver, rmHarvest) {
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
        }
    },

    Extract: function(creep, rmDeliver, rmHarvest) {
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
        }
    },

    Reserve: function(creep, rmHarvest) {
        if (creep.memory.room != null && creep.room.name != creep.memory.room) {
            uCreep.moveToRoom(creep, creep.memory.room);
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
