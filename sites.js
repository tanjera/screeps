var Roles = require('roles');

var utilColony = require('util.colony');
var Hive = require('hive');

var Sites = {
    Colony: function(rmColony, tgtLevel, popWorker, popRepairer, popUpgrader, popSoldier, listLinks) {
    
        if (Memory['hive']['rooms'][rmColony] == null) {
            Memory['hive']['rooms'][rmColony] = {};
        }
         
        var lWorker = _.filter(Game.creeps, (creep) => creep.memory.role == 'worker' && creep.memory.subrole == null && creep.memory.room == rmColony);
        var lRepairer = _.filter(Game.creeps, (creep) => creep.memory.role == 'worker' && creep.memory.subrole == 'repairer' && creep.memory.room == rmColony);
        var lUpgrader = _.filter(Game.creeps, (creep) => creep.memory.role == 'worker' && creep.memory.subrole == 'upgrader' && creep.memory.room == rmColony);
        var lSoldier = _.filter(Game.creeps, (creep) => creep.memory.role == 'soldier' && creep.memory.room == rmColony);

        var popTarget = popWorker + popRepairer + popUpgrader + popSoldier;
        var popActual = lWorker.length + lRepairer.length + lUpgrader.length + lSoldier.length;
        Hive.populationTally(rmColony, popTarget, popActual);

        if (lSoldier.length < popSoldier // If there's a hostile creep in the room... requestSpawn a defender!
            || (lSoldier.length < Game.rooms[rmColony].find(FIND_HOSTILE_CREEPS, { filter: function(c) { 
                        return Object.keys(Memory['hive']['allies']).indexOf(c.owner.username) < 0; }}).length)) {            
            Hive.requestSpawn(rmColony, 0, 0, tgtLevel, 'soldier', null, {role: 'soldier', room: rmColony});
        } else if (lWorker.length < popWorker) {
            Hive.requestSpawn(rmColony, 2, 3, tgtLevel, 'worker', null, {role: 'worker', room: rmColony});
        } else if (lRepairer.length < popRepairer) {
            Hive.requestSpawn(rmColony, 2, 4, tgtLevel, 'worker', null, {role: 'worker', subrole: 'repairer', room: rmColony});
        } else if (lUpgrader.length < popUpgrader) {
            Hive.requestSpawn(rmColony, 2, 4, tgtLevel, 'worker', null, {role: 'worker', subrole: 'upgrader', room: rmColony});
        }
        
        
        // Run roles!
        for (var n in Game.creeps) {
            var creep = Game.creeps[n];            
            if (creep.memory.room != null && creep.memory.room == rmColony) {
                if (creep.memory.role == 'worker') {
                    Roles.Worker(creep);
                }
                else if (creep.memory.role == 'soldier') {
                    Roles.Soldier(creep);
                }
            }
        }        

        // Process Towers
        var listTowers = Game.rooms[rmColony].find(FIND_MY_STRUCTURES, { filter: (s) => { return s.structureType == STRUCTURE_TOWER; }});                            
        for (var t in listTowers) {
            var tower = listTowers[t];
            
            var hostile = tower.pos.findClosestByRange(FIND_HOSTILE_CREEPS, { filter: function(c) {
                        return Object.keys(Memory['hive']['allies']).indexOf(c.owner.username) < 0; }});
            if (hostile != null) { // Anyone to attack?
                tower.attack(hostile);
                continue;
            } 
            
            var injured = tower.pos.findClosestByRange(FIND_MY_CREEPS, { filter: function(c) { return c.hits < c.hitsMax; }});
            if (injured != null && tower.energy > tower.energyCapacity * 0.5) { // Anyone to heal?
                tower.heal(injured);
                continue;
            } 
            
            if (tower.energy > tower.energyCapacity * 0.5) { // Maintain structures with extra energy
                var structure = utilColony.findByNeed_RepairCritical(tower.room);
                if (structure != null) {
                    tower.repair(structure);
                    continue;
                } 
            }
        }

        // Process links via listLinks parameter (an array of [id: '', role: 'send/receive'])
        if (listLinks != null) {
            Memory['hive']['rooms'][rmColony]['links'] = listLinks;

            var linksSend = _.filter(listLinks, (obj) => { return obj.id && obj['role'] == 'send'; });
            var linksReceive = _.filter(listLinks, (obj) => { return obj.id && obj['role'] == 'receive'; });

            for (var r = 0; r < linksReceive.length; r++) {
                for (var s = 0; s < linksSend.length; s++) {
                    var lSend = Game.getObjectById(linksSend[s]['id']);
                    var lReceive = Game.getObjectById(linksReceive[r]['id']);
                    if (lSend.energy > lSend.energyCapacity * 0.25 && lReceive.energy < lReceive.energyCapacity * 0.9) {
                        lSend.transferEnergy(lReceive);
                    }
                }
            }
        } },


    Mining: function(rmColony, rmHarvest, tgtLevel, popBurrower, popCarrier, popMiner, popMultirole, popReserver, popExtractor, listRoute) {

        var lBurrower  = _.filter(Game.creeps, (c) => c.memory.role == 'burrower' && c.memory.room == rmHarvest && (c.ticksToLive == undefined || c.ticksToLive > 160));
        var lCarrier  = _.filter(Game.creeps, (c) => c.memory.role == 'carrier' && c.memory.room == rmHarvest && (c.ticksToLive == undefined || c.ticksToLive > 160));
        var lMiner  = _.filter(Game.creeps, (c) => c.memory.role == 'miner' && c.memory.room == rmHarvest && (c.ticksToLive == undefined || c.ticksToLive > 160));
        var lMultirole  = _.filter(Game.creeps, (c) => c.memory.role == 'multirole' && c.memory.room == rmHarvest);
        var lReserver  = _.filter(Game.creeps, (c) => c.memory.role == 'reserver' && c.memory.room == rmHarvest);
        var lExtractor  = _.filter(Game.creeps, (c) => c.memory.role == 'extractor' && c.memory.room == rmHarvest);

        var popTarget = popBurrower + popCarrier + popMiner + popMultirole + popReserver + popExtractor;
        var popActual = lBurrower.length + lCarrier.length + lMiner.length + lMultirole.length + lReserver.length + lExtractor.length;
        Hive.populationTally(rmColony, popTarget, popActual);

        // Defend the mining op!
        if (Object.keys(Game.rooms).includes(rmHarvest) && Game.rooms[rmHarvest].find(FIND_HOSTILE_CREEPS, 
                        {filter: function(c) { return Object.keys(Memory['hive']['allies']).indexOf(c.owner.username) < 0; }}).length > 0) {
            var lSoldier = _.filter(Game.creeps, (creep) => creep.memory.role == 'soldier' && creep.memory.room == rmHarvest);
            if (lSoldier.length + lMultirole.length < Game.rooms[rmHarvest].find(FIND_HOSTILE_CREEPS, 
                        {filter: function(c) { return Object.keys(Memory['hive']['allies']).indexOf(c.owner.username) < 0; }}).length) {
                Hive.requestSpawn(rmColony, 0, 0, tgtLevel, 'soldier', null, {role: 'soldier', room: rmHarvest});
            }
        }
        else if (lMiner.length < popMiner) {
            if (lMiner.length == 0) // Possibly colony wiped? Need restart?
                Hive.requestSpawn(rmColony, 0, 1, 1, 'worker', null, {role: 'miner', room: rmHarvest, colony: rmColony});
            else {
                Hive.requestSpawn(rmColony, 2, 1, tgtLevel, 'worker', null, {role: 'miner', room: rmHarvest, colony: rmColony});
            }    
        }
        else if (lBurrower.length < popBurrower) {
            if (lCarrier.length == 0 && popCarrier > 0 && lMiner.length == 0) // Possibly colony wiped? Need restart?
                Hive.requestSpawn(rmColony, 0, 1, 1, 'worker', null, {role: 'miner', room: rmHarvest, colony: rmColony});
            else {
                Hive.requestSpawn(rmColony, 2, 1, tgtLevel, 'burrower', null, {role: 'burrower', room: rmHarvest, colony: rmColony});
            }
        }
        else if (lCarrier.length < popCarrier) {
            Hive.requestSpawn(rmColony, 2, 1, tgtLevel, 'carrier', null, {role: 'carrier', room: rmHarvest, colony: rmColony});
        }
        else if (lMultirole.length < popMultirole) {
            Hive.requestSpawn(rmColony, 2, 2, tgtLevel, 'multirole', null, {role: 'multirole', room: rmHarvest, colony: rmColony});
        }
        else if (lReserver.length < popReserver && Game.rooms[rmHarvest] != null 
                && (Game.rooms[rmHarvest].controller.reservation == null || Game.rooms[rmHarvest].controller.reservation.ticksToEnd < 2000)) {
            Hive.requestSpawn(rmColony, 0, 2, tgtLevel, 'reserver', null, {role: 'reserver', room: rmHarvest, colony: rmColony});            
        }
        else if (lExtractor.length < popExtractor && Object.keys(Game.rooms).includes(rmHarvest)
                    && Game['rooms'][rmHarvest].find(FIND_MINERALS, {filter: function(m) { return m.mineralAmount > 0; }}).length > 0) {
            Hive.requestSpawn(rmColony, 2, 2, tgtLevel, 'worker', null, {role: 'extractor', room: rmHarvest, colony: rmColony});    
        }

        // Run roles!
        for (var n in Game.creeps) {
            var creep = Game.creeps[n];
                
            if (creep.memory.room != null && creep.memory.room == rmHarvest) {
                creep.memory.listRoute = listRoute;
                // If the room is safe to run mining operations... run roles. 
                if (!Object.keys(Game.rooms).includes(rmHarvest) || rmColony == rmHarvest 
                        || (Object.keys(Game.rooms).includes(rmHarvest) && Game.rooms[rmHarvest].find(FIND_HOSTILE_CREEPS, 
                        { filter: function(c) { return Object.keys(Memory['hive']['allies']).indexOf(c.owner.username) < 0; }}).length == 0)) {
                    if (creep.memory.role == 'miner' || creep.memory.role == 'burrower' || creep.memory.role == 'carrier') {
                        Roles.Mining(creep, rmColony, rmHarvest, listRoute);
                    } else if (creep.memory.role == 'multirole') {
                        Roles.Worker(creep, listRoute);
                    } else if (creep.memory.role == 'reserver') {
                        Roles.Reserver(creep, listRoute);
                    } else if (creep.memory.role == 'extractor') {
                        Roles.Extracter(creep, rmColony, rmHarvest, listRoute);
                    } 
                }
            } else {
                // If it's not safe... attack!
                if (creep.memory.role == 'soldier' || creep.memory.role == 'multirole') {
                    rolesCombat.Soldier(creep, listRoute);
                }
            }
        } },


    Reservation: function(rmColony, rmHarvest, tgtLevel, popReserver, listRoute) {

        var lReserver  = _.filter(Game.creeps, (c) => c.memory.role == 'reserver' && c.memory.room == rmHarvest && (c.ticksToLive == undefined || c.ticksToLive > 80));
        
        var popTarget = popReserver;
        var popActual = lReserver.length;
        Hive.populationTally(rmColony, popTarget, popActual);

        if (lReserver.length < popReserver) {
            Hive.requestSpawn(rmColony, 0, 1, tgtLevel, 'reserver', null, {role: 'reserver', room: rmHarvest});            
        }

        for (var n in Game.creeps) {
            var creep = Game.creeps[n];                
            if (creep.memory.room != null && creep.memory.room == rmHarvest) {
                creep.memory.listRoute = listRoute;
                if (creep.memory.role == 'reserver') {
                    rolesMining.Reserve(creep);
                }
            }            
        } }
};

module.exports = Sites;
