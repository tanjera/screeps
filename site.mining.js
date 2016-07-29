var rolesMining = require('roles.mining');
var roleSoldier = require('role.soldier');

var utilCreep = require('util.creep');
var utilColony = require('util.colony');

var siteMining = {

    // Note: Miner = Burrower + Carrier
    run: function(rmDeliver, rmHarvest, popBurrower, popCarrier, popMiner, popReserver, popExtractor) {

        var lBurrower  = _.filter(Game.creeps, (creep) => creep.memory.role == 'burrower' && creep.memory.room == rmHarvest);
        var lCarrier  = _.filter(Game.creeps, (creep) => creep.memory.role == 'carrier' && creep.memory.room == rmHarvest);
        var lMiner  = _.filter(Game.creeps, (creep) => creep.memory.role == 'miner' && creep.memory.room == rmHarvest);
        var lReserver  = _.filter(Game.creeps, (creep) => creep.memory.role == 'reserver' && creep.memory.room == rmHarvest);
        var lExtractor  = _.filter(Game.creeps, (creep) => creep.memory.role == 'extractor' && creep.memory.room == rmHarvest);

        // Defend the mining op!
        if (Object.keys(Game.rooms).includes(rmHarvest) && Game.rooms[rmHarvest].find(FIND_HOSTILE_CREEPS, 
                        { filter: function(c) { return c.getActiveBodyparts('attack') > 0 || c.getActiveBodyparts('ranged_attack') > 0; }}).length > 0) {
            var lDefender = _.filter(Game.creeps, (creep) => creep.memory.role == 'defender' && creep.memory.room == rmHarvest);
            if (lDefender.length == 0) {
                utilColony.Spawn(rmDeliver, utilCreep.getBody_Soldier(utilColony.getRoom_Level(Game.rooms[rmColony])), null, {role: 'defender', room: rmHarvest});
            }
        }
        else if (lMiner.length < popMiner) {
            if (lMiner.length == 0) // Possibly colony wiped? Need restart?
                utilColony.Spawn(rmDeliver, [WORK, CARRY, CARRY, MOVE, MOVE], null, {role: 'miner', room: rmHarvest});
            else {
                utilColony.Spawn(rmDeliver, utilCreep.getBody_Worker(utilColony.getRoom_Level(Game.rooms[rmColony])), null, {role: 'miner', room: rmHarvest});
            }    
        }
        else if (lBurrower.length < popBurrower) {
            if (lCarrier.length == 0 && popCarrier > 0 && lMiner.length == 0) // Possibly colony wiped? Need restart?
                utilColony.Spawn(rmDeliver, [WORK, CARRY, CARRY, MOVE, MOVE], null, {role: 'miner', room: rmHarvest});
            else {
                utilColony.Spawn(rmDeliver, utilCreep.getBody_Burrower(utilColony.getRoom_Level(Game.rooms[rmColony])), null, {role: 'burrower', room: rmHarvest});
            }
        }
        else if (lCarrier.length < popCarrier) {
            utilColony.Spawn(rmDeliver, utilCreep.getBody_Carrier(utilColony.getRoom_Level(Game.rooms[rmColony])), null, {role: 'carrier', room: rmHarvest});
        }
        else if (lReserver.length < popReserver) {
            var body = utilCreep.getBody_Reserver(utilColony.getRoom_Level(Game.rooms[rmColony]));
            if (body != null) {
                utilColony.Spawn(rmDeliver, body, null, {role: 'reserver', room: rmHarvest});
            }
        }
        else if (lExtractor.length < popExtractor) {
            utilColony.Spawn(rmDeliver, utilCreep.getBody_Worker(utilColony.getRoom_Level(Game.rooms[rmColony])), null, {role: 'extractor', room: rmHarvest});    
        }

        // Run roles!
        for (var n in Game.creeps) {
            var creep = Game.creeps[n];
                
            if (creep.memory.room == rmHarvest 
                    && (!Object.keys(Game.rooms).includes(rmHarvest) 
                    || (Object.keys(Game.rooms).includes(rmHarvest) && Game.rooms[rmHarvest].find(FIND_HOSTILE_CREEPS, 
                        { filter: function(c) { return c.getActiveBodyparts('attack') > 0 || c.getActiveBodyparts('ranged_attack') > 0; }}).length == 0))) {
                if (creep.memory.role == 'miner' || creep.memory.role == 'burrower' || creep.memory.role == 'carrier') {
                    rolesMining.Mine(creep, rmDeliver, rmHarvest);
                } else if (creep.memory.role == 'reserver') {
                    rolesMining.Reserve(creep, rmHarvest);
                } else if (creep.memory.role == 'extractor') {
                    rolesMining.Extract(creep, rmDeliver, rmHarvest);
                } else if (creep.memory.role == 'defender') {
                    roleSoldier.run(creep, rmHarvest);
                }
            }
        }
    }
};

module.exports = siteMining;
