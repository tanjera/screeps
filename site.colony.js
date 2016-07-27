var roleWorker = require('role.worker');
var roleSoldier = require('role.soldier');


var siteColony = {

    run: function(spawn, rmColony, popRepairer, popWorker, popSoldier) {
    
        var lRepairer = _.filter(Game.creeps, (creep) => creep.memory.role == 'worker' && creep.memory.subrole == 'repairer' && creep.memory.room == rmColony);
        var lWorker = _.filter(Game.creeps, (creep) => creep.memory.role == 'worker' && creep.memory.subrole == null && creep.memory.room == rmColony);
        var lSoldier = _.filter(Game.creeps, (creep) => creep.memory.role == 'soldier' && creep.memory.room == rmColony);

        if (lSoldier.length < popSoldier // If there's a hostile creep in the room... spawn a defender!
            || (lSoldier.length < spawn.room.find(FIND_HOSTILE_CREEPS).length)) {
            var uc = require('util.creep');
            spawn.createCreep(uc.getBody_Soldier(uc.getSpawn_Level(spawn)), null, {role: 'soldier', room: rmColony});
        }

        else if (lRepairer.length < popRepairer) {
            var uc = require('util.creep');
            spawn.createCreep(uc.getBody_Worker(uc.getSpawn_Level(spawn)), null, {role: 'worker', subrole: 'repairer', room: rmColony});
        }

        else if (lWorker.length < popWorker) {
            var uc = require('util.creep');
            spawn.createCreep(uc.getBody_Worker(uc.getSpawn_Level(spawn)), null, {role: 'worker', room: rmColony});
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
        var lTowers = spawn.room.find(FIND_MY_STRUCTURES, {
                        filter: (s) => {
                            return s.structureType == STRUCTURE_TOWER; }});
                            
        for (var i = 0; i < lTowers.length; i++) {
            var hostile = lTowers[i].pos.findClosestByRange(FIND_HOSTILE_CREEPS);
            if (hostile) { // Anyone to attack?
                lTowers[i].attack(hostile);
            } 
            else { // Maintain structures with some energy
                var uc = require('util.colony');
                var lstructures = lTowers[i].room.find(FIND_STRUCTURES, {
                                filter: function(structure) {
                                    return (structure.structureType == STRUCTURE_RAMPART && structure.hits < uc.repairWalls_Maintenance(uc.getSpawn_Level(spawn)))
                                        || (structure.structureType == STRUCTURE_WALL && structure.hits < uc.repairWalls_Maintenance(uc.getSpawn_Level(spawn)))
                                        || (structure.structureType == STRUCTURE_CONTAINER && structure.hits < structure.hitsMax / 4)
                                        || (structure.structureType == STRUCTURE_ROAD && structure.hits < structure.hitsMax / 4);
                                } 
                        });
                if (lTowers[i].energy > 700 && lstructures.length > 0) {
                    lTowers[i].repair(lstructures[0]);
                } 
            }
        }
    }
};

module.exports = siteColony;
