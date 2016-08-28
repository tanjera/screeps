var __Creep = require("__creep");
var _Tasks = require("_tasks");

var _Roles = {
    Worker: function(creep) {
        if (creep.memory.room != null && creep.room.name != creep.memory.room) {
            __Creep.moveToRoom(creep, creep.memory.room);
        }
        else if (creep.memory.state == "refueling") {
            if (_.sum(creep.carry) == creep.carryCapacity) {
                creep.memory.state = "working";
                delete creep.memory.task;
                return;
            }
            
            _Tasks.assignTask(creep, true);        
            if (__Creep.runTaskTimer(creep)) {
                __Creep.runTask(creep);
            }
            return;

        } else if (creep.memory.state == "working") {            
            if (creep.carry[RESOURCE_ENERGY] == 0) {
                    creep.memory.state = "refueling";
                    delete creep.memory.task;
                    return;
                }
            
            _Tasks.assignTask(creep, false);
            if (__Creep.runTaskTimer(creep)) {
                __Creep.runTask(creep);
            }
            return;

        } else {
            creep.memory.state = "refueling";
            return;
        } },

    Mining: function(creep) {
        if (creep.memory.state == "refueling") {
            if (_.sum(creep.carry) == creep.carryCapacity && creep.carryCapacity > 0) {
                creep.memory.state = "delivering";
                delete creep.memory.task;
                return;
            }
            
            _Tasks.assignTask(creep, true);        
            if (__Creep.runTaskTimer(creep)) {
                __Creep.runTask(creep);
            }
            return;

        } else if (creep.memory.state == "delivering") {            
            if (creep.carryCapacity == 0
                || (creep.carry[RESOURCE_ENERGY] == 0 && _.sum(creep.carry) < creep.carryCapacity)) {
                creep.memory.state = "refueling";
                delete creep.memory.task;
                return;
            }

            _Tasks.assignTask(creep, false);
            if (__Creep.runTaskTimer(creep)) {
                __Creep.runTask(creep);
            }
            return;

        } else {
            creep.memory.state = "refueling";
            return;
        } },

    Courier: function(creep) {
        if (creep.memory.room != null && creep.room.name != creep.memory.room) {
            __Creep.moveToRoom(creep, creep.memory.room);
        }
        else if (creep.memory.state == "loading") {
            if (_.sum(creep.carry) > 0) {
                creep.memory.state = "delivering";
                delete creep.memory.task;
                return;
            }
            
            _Tasks.assignTask(creep, true);        
            if (__Creep.runTaskTimer(creep)) {
                __Creep.runTask(creep);
            }
            return;

        } else if (creep.memory.state == "delivering") {            
            if (_.sum(creep.carry) == 0) {
                    creep.memory.state = "loading";
                    delete creep.memory.task;
                    return;
                }
            
            _Tasks.assignTask(creep, false);
            if (__Creep.runTaskTimer(creep)) {
                __Creep.runTask(creep);
            }
            return;

        } else {
            creep.memory.state = "loading";
            return;
        } },

    Extracter: function(creep) {
        switch (creep.memory.state) {
            default:
            case "get_minerals":
                if (_.sum(creep.carry) == creep.carryCapacity) {
                    creep.memory.state = "deliver";
                }

                _Tasks.assignTask(creep, true);
                if (__Creep.runTaskTimer(creep)) {
                    __Creep.runTask(creep);
                }
            return;

            case "deliver":
                if (_.sum(creep.carry) < creep.carryCapacity) {
                    creep.memory.state = "get_minerals";
                }

                _Tasks.assignTask(creep, false);
                if (__Creep.runTaskTimer(creep)) {
                    __Creep.runTask(creep);
                }
            return;
        } },

    Reserver: function(creep) {
        if (creep.memory.room != null && creep.room.name != creep.memory.room) {
            __Creep.moveToRoom(creep, creep.memory.room, true);
            return;
        }
        else {
            var result = creep.reserveController(creep.room.controller); 
            if (result == ERR_NOT_IN_RANGE) {
                creep.moveTo(creep.room.controller)
                return;
            } else if (result == OK) {
                if (Game.time % 4 == 0) {  // Don"t park next to a source (and possibly block it!)
                    var sources = creep.pos.findInRange(FIND_SOURCES, 1);
                    if (sources != null && sources.length > 0) {
                        var __creep = require("__creep");
                        __creep.moveFrom(creep, sources[0]);
                    }
                }
                return;
            }                
        } },

    Soldier: function(creep) {
        if (creep.memory.room != null && creep.room.name != creep.memory.room) {
            __Creep.moveToRoom(creep, creep.memory.room);
        }
        else {
            var targets = creep.room.find(FIND_HOSTILE_CREEPS, { filter: function(c) { 
                return !Object.keys(Memory["hive"]["allies"]).includes(c.owner.username); }});
            
            if (targets.length > 0) {
                if(creep.attack(targets[0]) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(targets[0]);
                }
            }
        } },

    Archer: function(creep) {
        if (creep.memory.room != null && creep.room.name != creep.memory.room) {
            __Creep.moveToRoom(creep, creep.memory.room);
        }
        else {
            var allTargets = creep.room.find(FIND_HOSTILE_CREEPS, { filter: function(c) { 
                    return !Object.keys(Memory["hive"]["allies"]).includes(c.owner.username); }});
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
                    __Creep.moveFrom(creep, nearTargets[0]);
                }
            }
        } },

    Healer: function(creep) {
        if (creep.memory.room != null && creep.room.name != creep.memory.room) {
            __Creep.moveToRoom(creep, creep.memory.room);
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

module.exports = _Roles;