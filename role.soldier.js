var utilCreep = require('util.creep');

var RoleSoldier = {

    run: function(creep) {

        if (creep.memory.room != null || creep.room.name != creep.memory.room) {
            utilCreep.moveToRoom(creep, creep.memory.room);
        }
        else {
            var targets = creep.room.find(FIND_HOSTILE_CREEPS, { filter: function(c) { 
                            return c.getActiveBodyparts('attack') > 0 || c.getActiveBodyparts('ranged_attack') > 0
                                    || c.owner.username == 'Invader'; }});
            
            if (targets.length > 0) {
                if(creep.attack(targets[0]) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(targets[0]);
                }
            }
        }
    }
};

module.exports = RoleSoldier;