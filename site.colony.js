var roleWorker = require('role.worker');
var roleSoldier = require('role.soldier');


var siteColony = {

    run: function(spawn, rmColony, popRepairer, popWorker, popSoldier) {
    
        var lRepairer = _.filter(Game.creeps, (creep) => creep.memory.role == 'worker' && creep.memory.subrole == 'repairer' && creep.memory.room == rmColony);
        var lWorker = _.filter(Game.creeps, (creep) => creep.memory.role == 'worker' && creep.memory.room == rmColony);
        var lSoldier = _.filter(Game.creeps, (creep) => creep.memory.role == 'soldier' && creep.memory.room == rmColony);

        /*
            MOVE	        50
            WORK	        100	
            CARRY	        50
            ATTACK	        80
            RANGED_ATTACK	150	
            HEAL	        25
            CLAIM	        600	
            TOUGH       	10
        */

        if (lSoldier.length < popSoldier // If there's a hostile creep in the room... spawn a defender!
            || (lSoldier.length < spawn.room.find(FIND_HOSTILE_CREEPS).length)) {
            
            var body;
            if (spawn.room.energyCapacityAvailable < 550)           // lvl 1, 300 energy
                body = [ // 190 energy, 1x TOUGH, 1x ATTACK, 2x MOVE
                        MOVE, TOUGH,   
                        MOVE, ATTACK]; 
            else if (spawn.room.energyCapacityAvailable < 800)      // lvl 2, 550 energy
                body = [ // 510 energy, 2x TOUGH, 3x ATTACK, 5x MOVE
                        MOVE, TOUGH, MOVE, TOUGH,  
                        MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK]; 
            else if (spawn.room.energyCapacityAvailable < 1300)     // lvl 3, 800 energy
                body = [ // 760 energy, 4x TOUGH, 4x ATTACK, 8x MOVE
                        MOVE, TOUGH, MOVE, TOUGH, MOVE, TOUGH, MOVE, TOUGH, 
                        MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK]; 
            else if (spawn.room.energyCapacityAvailable < 1800)     // lvl 4, 1300 energy
                body = [ // 1270 energy, 6x TOUGH, 7x ATTACK, 13x MOVE
                        MOVE, TOUGH, MOVE, TOUGH, MOVE, TOUGH, MOVE, TOUGH, MOVE, TOUGH, 
                        MOVE, TOUGH, 
                        MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK, 
                        MOVE, ATTACK, MOVE, ATTACK];
            else if (spawn.room.energyCapacityAvailable < 2300)     // lvl 5, 1800 energy
                body = [ // 1650 energy, 8x TOUGH, 9x ATTACK, 17x MOVE
                        MOVE, TOUGH, MOVE, TOUGH, MOVE, TOUGH, MOVE, TOUGH, MOVE, TOUGH, 
                        MOVE, TOUGH, MOVE, TOUGH, MOVE, TOUGH, 
                        MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK, 
                        MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK]; 
            else if (spawn.room.energyCapacityAvailable < 5300)     // lvl 6, 2300 energy
                body = [ // 2270 energy, 14x TOUGH, 11x ATTACK, 25x MOVE
                        MOVE, TOUGH, MOVE, TOUGH, MOVE, TOUGH, MOVE, TOUGH, MOVE, TOUGH,
                        MOVE, TOUGH, MOVE, TOUGH, MOVE, TOUGH, MOVE, TOUGH, MOVE, TOUGH,
                        MOVE, TOUGH, MOVE, TOUGH, MOVE, TOUGH, MOVE, TOUGH,  
                        MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK, 
                        MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK, 
                        MOVE, ATTACK];
            else if (spawn.room.energyCapacityAvailable < 12300)    // lvl 7, 5300 energy
                body = [ // 3250 energy, 25x MOVE, 25x ATTACK
                        MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK, 
                        MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK,
                        MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK,
                        MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK,
                        MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK];
            else if (spawn.room.energyCapacityAvailable == 12300)   // lvl 8, 12300 energy
                body = [ // 3250 energy, 25x MOVE, 25x ATTACK
                        MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK, 
                        MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK,
                        MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK,
                        MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK,
                        MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK];

            spawn.createCreep(body, null, {role: 'soldier', room: rmColony});
        }

        else if (lRepairer.length < popRepairer) {
            var body;
            if (spawn.room.energyCapacityAvailable < 550)           // lvl 1, 300 energy
                body = [ // 300 energy, 1x WORK, 2x CARRY, 2x MOVE
                        WORK,  
                        CARRY, CARRY, 
                        MOVE, MOVE]; 
            else if (spawn.room.energyCapacityAvailable < 800)      // lvl 2, 550 energy
                    body = [ // 550 energy, 1x WORK, 4x CARRY, 5x MOVE
                        WORK,  
                        CARRY, CARRY, CARRY, CARRY, 
                        MOVE, MOVE, MOVE, MOVE, MOVE]; 
            else if (spawn.room.energyCapacityAvailable < 1300)     // lvl 3, 800 energy
                body = [ // 700 energy, 2x WORK, 4x CARRY, 6x MOVE
                        WORK, WORK,  
                        CARRY, CARRY, CARRY, CARRY, 
                        MOVE, MOVE, MOVE, MOVE, MOVE, MOVE];
            else if (spawn.room.energyCapacityAvailable < 1800)     // lvl 4, 1300 energy
                body = [ // 1250 energy, 5x WORK, 5x CARRY, 10x MOVE
                        WORK, WORK, WORK, WORK, WORK, 
                        CARRY, CARRY, CARRY, CARRY, CARRY, 
                        MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE];
            else if (spawn.room.energyCapacityAvailable < 2300)     // lvl 5, 1800 energy
                body = [ // 1750 energy, 7x WORK, 7x CARRY, 14x MOVE
                        WORK, WORK, WORK, WORK, WORK, WORK, WORK, 
                        CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, 
                        MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE,
                        MOVE, MOVE, MOVE, MOVE]; 
            else if (spawn.room.energyCapacityAvailable < 5300)     // lvl 6, 2300 energy
                body = [ // 2250 energy, 9x WORK, 9x CARRY, 18x MOVE
                        WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, 
                        CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, 
                        MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE,
                        MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE];
            else if (spawn.room.energyCapacityAvailable < 12300)    // lvl 7, 5300 energy
                body = [ // 3100 energy, 12x WORK, 13x CARRY, 25x MOVE
                        WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, 
                        WORK, WORK,  
                        CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, 
                        CARRY, CARRY, CARRY,
                        MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE,
                        MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE,
                        MOVE, MOVE, MOVE, MOVE, MOVE];
            else if (spawn.room.energyCapacityAvailable == 12300)   // lvl 8, 12300 energy
                body = [ // 3100 energy, 12x WORK, 13x CARRY, 25x MOVE
                        WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, 
                        WORK, WORK,  
                        CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, 
                        CARRY, CARRY, CARRY,
                        MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE,
                        MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE,
                        MOVE, MOVE, MOVE, MOVE, MOVE];
        
            spawn.createCreep(body, null, {role: 'worker', subrole: 'repairer', room: rmColony});
        }

        else if (lWorker.length < popWorker) {
                        var body;
            if (spawn.room.energyCapacityAvailable < 550)           // lvl 1, 300 energy
                body = [ // 300 energy, 1x WORK, 2x CARRY, 2x MOVE
                        WORK,  
                        CARRY, CARRY, 
                        MOVE, MOVE]; 
            else if (spawn.room.energyCapacityAvailable < 800)      // lvl 2, 550 energy
                    body = [ // 550 energy, 1x WORK, 4x CARRY, 5x MOVE
                        WORK,  
                        CARRY, CARRY, CARRY, CARRY, 
                        MOVE, MOVE, MOVE, MOVE, MOVE]; 
            else if (spawn.room.energyCapacityAvailable < 1300)     // lvl 3, 800 energy
                body = [ // 700 energy, 2x WORK, 4x CARRY, 6x MOVE
                        WORK, WORK,  
                        CARRY, CARRY, CARRY, CARRY, 
                        MOVE, MOVE, MOVE, MOVE, MOVE, MOVE];
            else if (spawn.room.energyCapacityAvailable < 1800)     // lvl 4, 1300 energy
                body = [ // 1250 energy, 5x WORK, 5x CARRY, 10x MOVE
                        WORK, WORK, WORK, WORK, WORK, 
                        CARRY, CARRY, CARRY, CARRY, CARRY, 
                        MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE];
            else if (spawn.room.energyCapacityAvailable < 2300)     // lvl 5, 1800 energy
                body = [ // 1750 energy, 7x WORK, 7x CARRY, 14x MOVE
                        WORK, WORK, WORK, WORK, WORK, WORK, WORK, 
                        CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, 
                        MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE,
                        MOVE, MOVE, MOVE, MOVE]; 
            else if (spawn.room.energyCapacityAvailable < 5300)     // lvl 6, 2300 energy
                body = [ // 2250 energy, 9x WORK, 9x CARRY, 18x MOVE
                        WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, 
                        CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, 
                        MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE,
                        MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE];
            else if (spawn.room.energyCapacityAvailable < 12300)    // lvl 7, 5300 energy
                body = [ // 3100 energy, 12x WORK, 13x CARRY, 25x MOVE
                        WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, 
                        WORK, WORK,  
                        CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, 
                        CARRY, CARRY, CARRY,
                        MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE,
                        MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE,
                        MOVE, MOVE, MOVE, MOVE, MOVE];
            else if (spawn.room.energyCapacityAvailable == 12300)   // lvl 8, 12300 energy
                body = [ // 3100 energy, 12x WORK, 13x CARRY, 25x MOVE
                        WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, 
                        WORK, WORK,  
                        CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, 
                        CARRY, CARRY, CARRY,
                        MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE,
                        MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE,
                        MOVE, MOVE, MOVE, MOVE, MOVE];

            spawn.createCreep(body, null, {role: 'worker', room: rmColony});
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
            else { // Repair critical structures
                var lstructures = lTowers[i].room.find(FIND_STRUCTURES, {
                                filter: function(structure) {
                                    return (structure.structureType == STRUCTURE_RAMPART && structure.hits < 10000)
                                        || (structure.structureType == STRUCTURE_WALL && structure.hits < 10000)
                                        || (structure.structureType == STRUCTURE_CONTAINER && structure.hits < structure.hitsMax / 5)
                                        || (structure.structureType == STRUCTURE_ROAD && structure.hits < structure.hitsMax / 5);
                                } 
                        });
                if (lstructures.length > 0) {
                    lTowers[i].repair(lstructures[0]);
                } 
            }
        }
    }
};

module.exports = siteColony;