var uCreep = require('util.creep');
var uTask = require('util.tasks');

var RolesWork = {

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
        }                        
    }
};

module.exports = RolesWork;