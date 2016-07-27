var RoleSoldier = {

    run: function(creep, tgtRoom) {

        var targets = creep.room.find(FIND_HOSTILE_CREEPS, { filter: function(c) { 
                        return c.getActiveBodyparts('attack') > 0 || c.getActiveBodyparts('ranged_attack') > 0; }});
        
        if (targets.length > 0) {
            if(creep.attack(targets[0]) == ERR_NOT_IN_RANGE) {
                creep.moveTo(targets[0]);
            }
        }

    }
};

module.exports = RoleSoldier;