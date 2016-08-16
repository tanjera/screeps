var uCreep = require('util.creep');

var RolesCombat = {

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
        }
    },


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
        }
    },


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
        }
    }
};

module.exports = RolesCombat;