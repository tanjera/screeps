var rolesMining = require('roles.mining');
var rolesWork = require('roles.work');
var rolesCombat = require('roles.combat');

var utilCreep = require('util.creep');
var utilColony = require('util.colony');
var utilHive = require('util.hive');

var siteMining = {

    // Note: Miner = Burrower + Carrier
    run: function(rmColony, rmHarvest, popBurrower, popCarrier, popMiner, popMultirole, popReserver, popExtractor) {

        var lBurrower  = _.filter(Game.creeps, (c) => c.memory.role == 'burrower' && c.memory.room == rmHarvest && (c.ticksToLive == undefined || c.ticksToLive > 160));
        var lCarrier  = _.filter(Game.creeps, (c) => c.memory.role == 'carrier' && c.memory.room == rmHarvest && (c.ticksToLive == undefined || c.ticksToLive > 160));
        var lMiner  = _.filter(Game.creeps, (c) => c.memory.role == 'miner' && c.memory.room == rmHarvest && (c.ticksToLive == undefined || c.ticksToLive > 160));
        var lMultirole  = _.filter(Game.creeps, (c) => c.memory.role == 'multirole' && c.memory.room == rmHarvest);
        var lReserver  = _.filter(Game.creeps, (c) => c.memory.role == 'reserver' && c.memory.room == rmHarvest);
        var lExtractor  = _.filter(Game.creeps, (c) => c.memory.role == 'extractor' && c.memory.room == rmHarvest);

        var popTarget = popBurrower + popCarrier + popMiner + popMultirole + popReserver + popExtractor;
        var popActual = lBurrower.length + lCarrier.length + lMiner.length + lMultirole.length + lReserver.length + lExtractor.length;
        utilHive.populationTally(rmColony, popTarget, popActual);

        // Defend the mining op!
        var hostiles = Game.rooms[rmHarvest].find(FIND_HOSTILE_CREEPS, 
                        {filter: function(c) { return Object.keys(Memory['hive']['allies']).indexOf(c.owner.username) < 0; }});
        if (Object.keys(Game.rooms).includes(rmHarvest) && hostiles.length > 0) {
            var lSoldier = _.filter(Game.creeps, (creep) => creep.memory.role == 'soldier' && creep.memory.room == rmHarvest);
            if (lSoldier.length + lMultirole.length < hostiles.length) {
                utilHive.requestSpawn(rmColony, 0, 0, 'soldier', null, {role: 'soldier', room: rmHarvest});
            }
        }
        else if (lMiner.length < popMiner) {
            if (lMiner.length == 0) // Possibly colony wiped? Need restart?
                utilHive.requestSpawn(rmColony, 0, 1, 'worker', null, {role: 'miner', room: rmHarvest});
            else {
                utilHive.requestSpawn(rmColony, 2, 1, 'worker', null, {role: 'miner', room: rmHarvest});
            }    
        }
        else if (lBurrower.length < popBurrower) {
            if (lCarrier.length == 0 && popCarrier > 0 && lMiner.length == 0) // Possibly colony wiped? Need restart?
                utilHive.requestSpawn(rmColony, 0, 1, 'worker', null, {role: 'miner', room: rmHarvest});
            else {
                utilHive.requestSpawn(rmColony, 2, 1, 'burrower', null, {role: 'burrower', room: rmHarvest});
            }
        }
        else if (lCarrier.length < popCarrier) {
            utilHive.requestSpawn(rmColony, 2, 1, 'carrier', null, {role: 'carrier', room: rmHarvest});
        }
        else if (lMultirole.length < popMultirole) {
            utilHive.requestSpawn(rmColony, 2, 2, 'multirole', null, {role: 'multirole', room: rmHarvest});
        }
        else if (lReserver.length < popReserver && Game.rooms[rmHarvest] != null 
                && (Game.rooms[rmHarvest].controller.reservation == null || Game.rooms[rmHarvest].controller.reservation.ticksToEnd < 2000)) {
            utilHive.requestSpawn(rmColony, 0, 2, 'reserver', null, {role: 'reserver', room: rmHarvest});            
        }
        else if (lExtractor.length < popExtractor && Object.keys(Game.rooms).includes(rmHarvest)
                    && Game['rooms'][rmHarvest].find(FIND_MINERALS, {filter: function(m) { return m.mineralAmount > 0; }}).length > 0) {
            utilHive.requestSpawn(rmColony, 2, 2, 'worker', null, {role: 'extractor', room: rmHarvest});    
        }

        // Run roles!
        for (var n in Game.creeps) {
            var creep = Game.creeps[n];
                
            if (creep.memory.room != null && creep.memory.room == rmHarvest) {
                // If the room is safe to run mining operations... run roles. 
                if (!Object.keys(Game.rooms).includes(rmHarvest) || rmColony == rmHarvest 
                        || (Object.keys(Game.rooms).includes(rmHarvest) && Game.rooms[rmHarvest].find(FIND_HOSTILE_CREEPS, 
                        { filter: function(c) { return Object.keys(Memory['hive']['allies']).indexOf(c.owner.username) < 0; }}).length == 0)) {
                    if (creep.memory.role == 'miner' || creep.memory.role == 'burrower' || creep.memory.role == 'carrier') {
                        rolesMining.Mine(creep, rmColony, rmHarvest);
                    } else if (creep.memory.role == 'multirole') {
                        rolesWork.Worker(creep);
                    } else if (creep.memory.role == 'reserver') {
                        rolesMining.Reserve(creep);
                    } else if (creep.memory.role == 'extractor') {
                        rolesMining.Extract(creep, rmColony, rmHarvest);
                    } 
                }
            } else {
                // If it's not safe... attack!
                if (creep.memory.role == 'soldier' || creep.memory.role == 'multirole') {
                    rolesCombat.Soldier(creep);
                }
            }
        }
    }
};

module.exports = siteMining;
