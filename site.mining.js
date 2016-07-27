var roleMiner = require('role.miner');

var siteMining = {

    // Note: Miner = Burrower + Carrier
    run: function(spawn, rmDeliver, rmHarvest, popBurrower, popCarrier, popMiner) {

        var lBurrower  = _.filter(Game.creeps, (creep) => creep.memory.role == 'burrower' && creep.memory.room == rmHarvest);
        var lCarrier  = _.filter(Game.creeps, (creep) => creep.memory.role == 'carrier' && creep.memory.room == rmHarvest);
        var lMiner  = _.filter(Game.creeps, (creep) => creep.memory.role == 'miner' && creep.memory.room == rmHarvest);

        // Defend the mining op!
        if (Object.keys(Game.rooms).includes(rmHarvest) && Game.rooms[rmHarvest].find(FIND_HOSTILE_CREEPS).length > 0) {
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
        

        // Run roles!
        for (var n in Game.creeps) {
            var creep = Game.creeps[n];
                
            if (creep.memory.room == rmHarvest 
                && (creep.memory.role == 'miner' || creep.memory.role == 'burrower' || creep.memory.role == 'carrier')
                && (!Object.keys(Game.rooms).includes(rmHarvest)
                    || (Object.keys(Game.rooms).includes(rmHarvest) && Game.rooms[rmHarvest].find(FIND_HOSTILE_CREEPS).length == 0))) {
                roleMiner.run(creep, rmDeliver, rmHarvest);
            }
        }
    }
};

module.exports = siteMining;
