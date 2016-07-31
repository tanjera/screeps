var roleWorker = require('role.worker');
var roleSoldier = require('role.soldier');

var utilCreep = require('util.creep');
var utilColony = require('util.colony');
var utilHive = require('util.hive');

var siteColony = {

    run: function(rmColony, popRepairer, popWorker, popSoldier) {
    
        var lRepairer = _.filter(Game.creeps, (creep) => creep.memory.role == 'worker' && creep.memory.subrole == 'repairer' && creep.memory.room == rmColony);
        var lWorker = _.filter(Game.creeps, (creep) => creep.memory.role == 'worker' && creep.memory.subrole == null && creep.memory.room == rmColony);
        var lSoldier = _.filter(Game.creeps, (creep) => creep.memory.role == 'soldier' && creep.memory.room == rmColony);

        var popTarget = popRepairer + popWorker + popSoldier;
        var popActual = lRepairer.length + lWorker.length + lSoldier.length;
        utilHive.populationTally(rmColony, popTarget, popActual);

        if (lSoldier.length < popSoldier // If there's a hostile creep in the room... requestSpawn a defender!
            || (lSoldier.length < Game.rooms[rmColony].find(FIND_HOSTILE_CREEPS, { filter: function(c) { 
                        return c.getActiveBodyparts('attack') > 0 || c.getActiveBodyparts('ranged_attack') > 0; }}).length)) {            
            utilHive.requestSpawn(rmColony, 0, 0, 'soldier', null, {role: 'soldier', room: rmColony});
        }
        else if (lRepairer.length < popRepairer) {
            utilHive.requestSpawn(rmColony, 2, 4, 'worker', null, {role: 'worker', subrole: 'repairer', room: rmColony});
        }
        else if (lWorker.length < popWorker) {
            utilHive.requestSpawn(rmColony, 2, 3, 'worker', null, {role: 'worker', room: rmColony});
        }
        
        // Run roles!
        for (var n in Game.creeps) {
            var creep = Game.creeps[n];
            
            if (creep.memory.room != null && creep.memory.room == rmColony) {
                if (creep.memory.role == 'worker') {
                    roleWorker.run(creep);
                }
                else if (creep.memory.role == 'soldier') {
                    roleSoldier.run(creep);
                }
            }
        }
        
        // Process Towers
        var lTowers = Game.rooms[rmColony].find(FIND_MY_STRUCTURES, { filter: (s) => { return s.structureType == STRUCTURE_TOWER; }});
                            
        for (var i = 0; i < lTowers.length; i++) {
            var tower = lTowers[i];
            
            var hostile = tower.pos.findClosestByRange(FIND_HOSTILE_CREEPS, { filter: function(c) { 
                        return c.getActiveBodyparts('attack') > 0 || c.getActiveBodyparts('ranged_attack') > 0
                                || c.owner.username == 'Invader'; }});
            if (hostile != null) { // Anyone to attack?
                tower.attack(hostile);
                continue;
            } 
            
            var injured = tower.pos.findClosestByRange(FIND_MY_CREEPS, { filter: function(c) { return c.hits < c.hitsMax; }});
            if (injured != null && tower.energy > tower.energyCapacity / 2) { // Anyone to heal?
                tower.heal(injured);
                continue;
            } 
            
            if (tower.energy > tower.energyCapacity / 2) { // Maintain structures with extra energy
                var structure = utilColony.findByNeed_RepairCritical(tower.room);
                if (structure != null) {
                    tower.repair(structure);
                    continue;
                } 
            }
        }
    }
};

module.exports = siteColony;
