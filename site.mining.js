var rolesMining = require('roles.mining');

var siteMining = {

    // Note: Miner = Burrower + Carrier
    run: function(spawn, rmDeliver, rmHarvest, popBurrower, popCarrier, popMiner, popReserver, popMineralist) {

        var lBurrower  = _.filter(Game.creeps, (creep) => creep.memory.role == 'burrower' && creep.memory.room == rmHarvest);
        var lCarrier  = _.filter(Game.creeps, (creep) => creep.memory.role == 'carrier' && creep.memory.room == rmHarvest);
        var lMiner  = _.filter(Game.creeps, (creep) => creep.memory.role == 'miner' && creep.memory.room == rmHarvest);
        var lReserver  = _.filter(Game.creeps, (creep) => creep.memory.role == 'reserver' && creep.memory.room == rmHarvest);
        var lMineralist  = _.filter(Game.creeps, (creep) => creep.memory.role == 'mineralist' && creep.memory.room == rmHarvest);

        // Defend the mining op!
        if (Object.keys(Game.rooms).includes(rmHarvest) && Game.rooms[rmHarvest].find(FIND_HOSTILE_CREEPS, 
                        { filter: function(c) { return c.getActiveBodyparts('attack') > 0 || c.getActiveBodyparts('ranged_attack') > 0; }}).length > 0) {
            var lDefender = _.filter(Game.creeps, (creep) => creep.memory.role == 'defender' && creep.memory.room == rmHarvest);
            if (lDefender.length == 0) {
                var uc = require('util.creep');
                spawn.createCreep(uc.getBody_Soldier(uc.getSpawn_Level(spawn)), null, {role: 'defender', room: rmHarvest});
            }

            for (var n = 0; n < lDefender.length; n++) {
                if (lDefender[n].room.name == rmHarvest) {
                    if (lDefender[n].attack(Game.rooms[rmHarvest].find(FIND_HOSTILE_CREEPS)[0]) == ERR_NOT_IN_RANGE) {
                        lDefender[n].moveTo(Game.rooms[rmHarvest].find(FIND_HOSTILE_CREEPS)[0]);
                    }
                } else {
                    var uc = require('util.creep');
                    uc.moveToRoom(lDefender[n], rmHarvest);
                }
            }
        }
        else if (lMiner.length < popMiner) {
            if (lMiner.length == 0) // Possibly colony wiped? Need restart?
                spawn.createCreep([WORK, CARRY, CARRY, MOVE, MOVE], null, {role: 'miner', room: rmHarvest});
            else {
                var uc = require('util.creep');
                spawn.createCreep(uc.getBody_Worker(uc.getSpawn_Level(spawn)), null, {role: 'miner', room: rmHarvest});
            }    
        }
        else if (lBurrower.length < popBurrower) {
            if (lCarrier.length < popCarrier && lMiner.length == 0) // Possibly colony wiped? Need restart?
                spawn.createCreep([WORK, CARRY, CARRY, MOVE, MOVE], null, {role: 'miner', room: rmHarvest});
            else {
                var uc = require('util.creep');
                spawn.createCreep(uc.getBody_Burrower(uc.getSpawn_Level(spawn)), null, {role: 'burrower', room: rmHarvest});
            }
        }
        else if (lCarrier.length < popCarrier) {
            var uc = require('util.creep');
            spawn.createCreep(uc.getBody_Carrier(uc.getSpawn_Level(spawn)), null, {role: 'carrier', room: rmHarvest});
        }
        else if (lReserver.length < popReserver) {
            var uc = require('util.creep');
            var body = uc.getBody_Reserver(uc.getSpawn_Level(spawn));
            if (body != null) {
                spawn.createCreep(body, null, {role: 'reserver', room: rmHarvest});
            }
        }

        // Run roles!
        for (var n in Game.creeps) {
            var creep = Game.creeps[n];
                
            if (creep.memory.room == rmHarvest 
                    && (!Object.keys(Game.rooms).includes(rmHarvest) 
                    || (Object.keys(Game.rooms).includes(rmHarvest) && Game.rooms[rmHarvest].find(FIND_HOSTILE_CREEPS).length == 0))) {
                if (creep.memory.role == 'miner' || creep.memory.role == 'burrower' || creep.memory.role == 'carrier') {
                    rolesMining.Mining(creep, rmDeliver, rmHarvest);
                } else if (creep.memory.role == 'reserver') {
                    rolesMining.Reserve(creep, rmHarvest);
                }
            }
        }
    }
};

module.exports = siteMining;
