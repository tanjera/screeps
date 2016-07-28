var roleWorker = require('role.worker');
var roleSoldier = require('role.soldier');

var utilCreep = require('util.creep');
var utilColony = require('util.colony');

var siteColony = {

    run: function(rmColony, popRepairer, popWorker, popSoldier) {
    
        var lRepairer = _.filter(Game.creeps, (creep) => creep.memory.role == 'worker' && creep.memory.subrole == 'repairer' && creep.memory.room == rmColony);
        var lWorker = _.filter(Game.creeps, (creep) => creep.memory.role == 'worker' && creep.memory.subrole == null && creep.memory.room == rmColony);
        var lSoldier = _.filter(Game.creeps, (creep) => creep.memory.role == 'soldier' && creep.memory.room == rmColony);

        if (lSoldier.length < popSoldier // If there's a hostile creep in the room... spawn a defender!
            || (lSoldier.length < Game.rooms[rmColony].find(FIND_HOSTILE_CREEPS, { filter: function(c) { 
                        return c.getActiveBodyparts('attack') > 0 || c.getActiveBodyparts('ranged_attack') > 0; }}).length)) {            
            utilColony.Spawn(rmColony, utilCreep.getBody_Soldier(utilColony.getRoom_Level(rmColony)), null, {role: 'soldier', room: rmColony});
        }
        else if (lRepairer.length < popRepairer) {
            utilColony.Spawn(rmColony, utilCreep.getBody_Worker(utilColony.getRoom_Level(rmColony)), null, {role: 'worker', subrole: 'repairer', room: rmColony});
        }
        else if (lWorker.length < popWorker) {
            utilColony.Spawn(rmColony, utilCreep.getBody_Worker(utilColony.getRoom_Level(rmColony)), null, {role: 'worker', room: rmColony});
        }
        
        // Run roles!
        for (var n in Game.creeps) {
            var creep = Game.creeps[n];
                
            if (creep.memory.role == 'worker') {
                roleWorker.run(creep);
            }
            else if (creep.memory.role == 'soldier') {
                roleSoldier.run(creep);
            }
        }
        
        // Process Towers
        var lTowers = spawn.room.find(FIND_MY_STRUCTURES, { filter: (s) => { return s.structureType == STRUCTURE_TOWER; }});
                            
        for (var i = 0; i < lTowers.length; i++) {
            var tower = lTowers[i];
            
            var hostile = tower.pos.findClosestByRange(FIND_HOSTILE_CREEPS, { filter: function(c) { 
                        return c.getActiveBodyparts('attack') > 0 || c.getActiveBodyparts('ranged_attack') > 0; }});
            if (hostile != null) { // Anyone to attack?
                tower.attack(hostile);
                continue;
            } 
            
            var injured = tower.pos.findClosestByRange(FIND_MY_CREEPS, { filter: function(c) { return c.hits < c.hitsMax; }});
            if (injured != null) { // Anyone to heal?
                tower.heal(injured);
                continue;
            } 
            
            if (tower.energy > tower.energyCapacity / 2) { // Maintain structures with extra energy
                var structure = utilColony.findByNeed_RepairMaintenance(tower.room);
                if (structure != null) {
                    tower.repair(structure);
                    continue;
                } 
            }
        }
    }
};

module.exports = siteColony;
