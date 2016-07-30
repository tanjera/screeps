var rolesMining = require('roles.mining');
var roleSoldier = require('role.soldier');

var utilCreep = require('util.creep');
var utilColony = require('util.colony');

var siteMining = {

    // Note: Miner = Burrower + Carrier
    run: function(rmColony, rmHarvest, popBurrower, popCarrier, popMiner, popReserver, popExtractor) {

        var lBurrower  = _.filter(Game.creeps, (c) => c.memory.role == 'burrower' && c.memory.room == rmHarvest && (c.ticksToLive == undefined || c.ticksToLive > 160));
        var lCarrier  = _.filter(Game.creeps, (c) => c.memory.role == 'carrier' && c.memory.room == rmHarvest && (c.ticksToLive == undefined || c.ticksToLive > 160));
        var lMiner  = _.filter(Game.creeps, (c) => c.memory.role == 'miner' && c.memory.room == rmHarvest && (c.ticksToLive == undefined || c.ticksToLive > 160));
        var lReserver  = _.filter(Game.creeps, (c) => c.memory.role == 'reserver' && c.memory.room == rmHarvest);
        var lExtractor  = _.filter(Game.creeps, (c) => c.memory.role == 'extractor' && c.memory.room == rmHarvest);

        // Defend the mining op!
        if (Object.keys(Game.rooms).includes(rmHarvest) && Game.rooms[rmHarvest].find(FIND_HOSTILE_CREEPS, 
                        { filter: function(c) { return c.getActiveBodyparts('attack') > 0 || c.getActiveBodyparts('ranged_attack') > 0; }}).length > 0) {
            var lDefender = _.filter(Game.creeps, (creep) => creep.memory.role == 'defender' && creep.memory.room == rmHarvest);
            if (lDefender.length == 0) {
                utilColony.requestSpawn(rmColony, 0, 0, utilCreep.getBody_Soldier(utilColony.getRoom_Level(Game.rooms[rmColony])), null, {role: 'defender', room: rmHarvest});
            }
        }
        else if (lMiner.length < popMiner) {
            if (lMiner.length == 0) // Possibly colony wiped? Need restart?
                utilColony.requestSpawn(rmColony, 0, 1, [WORK, CARRY, CARRY, MOVE, MOVE], null, {role: 'miner', room: rmHarvest});
            else {
                utilColony.requestSpawn(rmColony, 2, 1, utilCreep.getBody_Worker(utilColony.getRoom_Level(Game.rooms[rmColony])), null, {role: 'miner', room: rmHarvest});
            }    
        }
        else if (lBurrower.length < popBurrower) {
            if (lCarrier.length == 0 && popCarrier > 0 && lMiner.length == 0) // Possibly colony wiped? Need restart?
                utilColony.requestSpawn(rmColony, 0, 1, [WORK, CARRY, CARRY, MOVE, MOVE], null, {role: 'miner', room: rmHarvest});
            else {
                utilColony.requestSpawn(rmColony, 2, 1, utilCreep.getBody_Burrower(utilColony.getRoom_Level(Game.rooms[rmColony])), null, {role: 'burrower', room: rmHarvest});
            }
        }
        else if (lCarrier.length < popCarrier) {
            utilColony.requestSpawn(rmColony, 2, 1, utilCreep.getBody_Carrier(utilColony.getRoom_Level(Game.rooms[rmColony])), null, {role: 'carrier', room: rmHarvest});
        }
        else if (lReserver.length < popReserver && Game.rooms[rmHarvest] != null 
                && (Game.rooms[rmHarvest].controller.reservation == null || Game.rooms[rmHarvest].controller.reservation.ticksToEnd < 1000)) {
            var body = utilCreep.getBody_Reserver(utilColony.getRoom_Level(Game.rooms[rmColony]));
            if (body != null) {
                utilColony.requestSpawn(rmColony, 2, 1, body, null, {role: 'reserver', room: rmHarvest});
            }
        }
        else if (lExtractor.length < popExtractor) {
            utilColony.requestSpawn(rmColony, 2, 2, utilCreep.getBody_Worker(utilColony.getRoom_Level(Game.rooms[rmColony])), null, {role: 'extractor', room: rmHarvest});    
        }

        // Run roles!
        for (var n in Game.creeps) {
            var creep = Game.creeps[n];
                
            if (creep.memory.room == rmHarvest 
                    && (!Object.keys(Game.rooms).includes(rmHarvest) || rmColony == rmHarvest 
                    || (Object.keys(Game.rooms).includes(rmHarvest) && Game.rooms[rmHarvest].find(FIND_HOSTILE_CREEPS, 
                        { filter: function(c) { return c.getActiveBodyparts('attack') > 0 || c.getActiveBodyparts('ranged_attack') > 0; }}).length == 0))) {
                if (creep.memory.role == 'miner' || creep.memory.role == 'burrower' || creep.memory.role == 'carrier') {
                    rolesMining.Mine(creep, rmColony, rmHarvest);
                } else if (creep.memory.role == 'reserver') {
                    rolesMining.Reserve(creep, rmHarvest);
                } else if (creep.memory.role == 'extractor') {
                    rolesMining.Extract(creep, rmColony, rmHarvest);
                } else if (creep.memory.role == 'defender') {
                    roleSoldier.run(creep);
                }
            }
        }
    }
};

module.exports = siteMining;
