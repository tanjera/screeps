var rolesWork = require('roles.work');
var rolesCombat = require('roles.combat');

var utilCreep = require('util.creep');
var utilColony = require('util.colony');
var utilHive = require('util.hive');

var siteColony = {

    run: function(rmColony, popWorker, popRepairer, popUpgrader, popSoldier, listLinks) {
    
        if (Memory['hive']['rooms'][rmColony] == null) {
            Memory['hive']['rooms'][rmColony] = {};
        }
         

        var lWorker = _.filter(Game.creeps, (creep) => creep.memory.role == 'worker' && creep.memory.subrole == null && creep.memory.room == rmColony);
        var lRepairer = _.filter(Game.creeps, (creep) => creep.memory.role == 'worker' && creep.memory.subrole == 'repairer' && creep.memory.room == rmColony);
        var lUpgrader = _.filter(Game.creeps, (creep) => creep.memory.role == 'worker' && creep.memory.subrole == 'upgrader' && creep.memory.room == rmColony);
        var lSoldier = _.filter(Game.creeps, (creep) => creep.memory.role == 'soldier' && creep.memory.room == rmColony);

        var popTarget = popWorker + popRepairer + popUpgrader + popSoldier;
        var popActual = lWorker.length + lRepairer.length + lUpgrader.length + lSoldier.length;
        utilHive.populationTally(rmColony, popTarget, popActual);

        if (lSoldier.length < popSoldier // If there's a hostile creep in the room... requestSpawn a defender!
            || (lSoldier.length < Game.rooms[rmColony].find(FIND_HOSTILE_CREEPS, { filter: function(c) { 
                        return Object.keys(Memory['hive']['allies']).indexOf(c.owner.username) < 0; }}).length)) {            
            utilHive.requestSpawn(rmColony, 0, 0, 'soldier', null, {role: 'soldier', room: rmColony});
        } else if (lWorker.length < popWorker) {
            utilHive.requestSpawn(rmColony, 2, 3, 'worker', null, {role: 'worker', room: rmColony});
        } else if (lRepairer.length < popRepairer) {
            utilHive.requestSpawn(rmColony, 2, 4, 'worker', null, {role: 'worker', subrole: 'repairer', room: rmColony});
        } else if (lUpgrader.length < popUpgrader) {
            utilHive.requestSpawn(rmColony, 2, 4, 'worker', null, {role: 'worker', subrole: 'upgrader', room: rmColony});
        }
        
        
        // Run roles!
        for (var n in Game.creeps) {
            var creep = Game.creeps[n];
            
            if (creep.memory.room != null && creep.memory.room == rmColony) {
                if (creep.memory.role == 'worker') {
                    rolesWork.Worker(creep);
                }
                else if (creep.memory.role == 'soldier') {
                    rolesCombat.Soldier(creep);
                }
            }
        }
        
        // Process Towers
        var listTowers = Game.rooms[rmColony].find(FIND_MY_STRUCTURES, { filter: (s) => { return s.structureType == STRUCTURE_TOWER; }});
                            
        for (var i = 0; i < listTowers.length; i++) {
            var tower = listTowers[i];
            
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
        }
    }
};

module.exports = siteColony;
