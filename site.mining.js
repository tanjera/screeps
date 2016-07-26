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
                
                var body;
                if (spawn.room.energyCapacityAvailable < 550)           // lvl 1, 300 energy
                    body = [ // 190 energy, 1x TOUGH, 1x ATTACK, 2x MOVE
                            MOVE, TOUGH,   
                            MOVE, ATTACK]; 
                else if (spawn.room.energyCapacityAvailable < 800)      // lvl 2, 550 energy
                    body = [ // 380 energy, 2x TOUGH, 2x ATTACK, 4x MOVE
                            MOVE, TOUGH, MOVE, TOUGH,  
                            MOVE, ATTACK, MOVE, ATTACK]; 
                else if (spawn.room.energyCapacityAvailable < 1300)     // lvl 3, 800 energy
                    body = [ // 570 energy, 3x TOUGH, 3x ATTACK, 6x MOVE
                            MOVE, TOUGH, MOVE, TOUGH, MOVE, TOUGH,  
                            MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK]; 
                else if (spawn.room.energyCapacityAvailable < 1800)     // lvl 4, 1300 energy
                    body = [ // 950 energy, 5x TOUGH, 5x ATTACK, 10x MOVE
                            MOVE, TOUGH, MOVE, TOUGH, MOVE, TOUGH, MOVE, TOUGH, MOVE, TOUGH, 
                            MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK];
                else if (spawn.room.energyCapacityAvailable < 2300)     // lvl 5, 1800 energy
                    body = [ // 1390 energy, 8x TOUGH, 7x ATTACK, 15x MOVE
                            MOVE, TOUGH, MOVE, TOUGH, MOVE, TOUGH, MOVE, TOUGH, MOVE, TOUGH, 
                            MOVE, TOUGH, MOVE, TOUGH, MOVE, TOUGH, 
                            MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK, 
                            MOVE, ATTACK, MOVE, ATTACK]; 
                else if (spawn.room.energyCapacityAvailable < 5300)     // lvl 6, 2300 energy
                    body = [ // 1720 energy, 10x TOUGH, 8x ATTACK, 18x MOVE
                            MOVE, TOUGH, MOVE, TOUGH, MOVE, TOUGH, MOVE, TOUGH, MOVE, TOUGH,
                            MOVE, TOUGH, MOVE, TOUGH, MOVE, TOUGH, MOVE, TOUGH, MOVE, TOUGH,
                            MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK, 
                            MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK];
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
                
                spawn.createCreep(body, null, {role: 'defender', room: rmHarvest});
            }

            for (var n = 0; n < lDefender.length; n++) {
                if (Game.rooms[rmHarvest] != null) {
                    if (lDefender[n].attack(Game.rooms[rmHarvest].find(FIND_HOSTILE_CREEPS)[0]) == ERR_NOT_IN_RANGE) {
                        lDefender[n].moveTo(Game.rooms[rmHarvest].find(FIND_HOSTILE_CREEPS)[0]);
                    }
                } else {
                    // Implement moving to room without a presence 
                }
            }
        }
        else if (lMiner.length < popMiner) {
            if (lMiner.length == 0) // Possibly colony wiped? Need restart?
                spawn.createCreep([WORK, CARRY, CARRY, MOVE, MOVE], null, {role: 'miner', room: rmHarvest});
            else {
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
                    body = [ // 1100 energy, 4x WORK, 5x CARRY, 9x MOVE
                            WORK, WORK, WORK, WORK, 
                            CARRY, CARRY, CARRY, CARRY, CARRY, 
                            MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE];
                else if (spawn.room.energyCapacityAvailable < 2300)     // lvl 5, 1800 energy
                    body = [ // 1600 energy, 6x WORK, 7x CARRY, 13x MOVE
                            WORK, WORK, WORK, WORK, WORK, WORK, 
                            CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, 
                            MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE,
                            MOVE, MOVE, MOVE]; 
                else if (spawn.room.energyCapacityAvailable < 5300)     // lvl 6, 2300 energy
                    body = [ // 1950 energy, 7x WORK, 9x CARRY, 16x MOVE
                            WORK, WORK, WORK, WORK, WORK, WORK, WORK, 
                            CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, 
                            MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE,
                            MOVE, MOVE, MOVE, MOVE, MOVE, MOVE];
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

                spawn.createCreep(body, null, {role: 'miner', room: rmHarvest});
            }    
        }
        else if (lBurrower.length < popBurrower) {
            if (lCarrier.length < popCarrier && lMiner.length == 0) // Possibly colony wiped? Need restart?
                spawn.createCreep([WORK, CARRY, CARRY, MOVE, MOVE], null, {role: 'miner', room: rmHarvest});
            else {
                var body;
                if (spawn.room.energyCapacityAvailable < 550)           // lvl 1, 300 energy
                    body = [ // 300 energy, 2x WORK, 2x MOVE
                            WORK, MOVE, WORK, MOVE]; 
                else if (spawn.room.energyCapacityAvailable < 800)      // lvl 2, 550 energy
                        body = [ // 450 energy, 3x WORK, 3x MOVE
                            WORK, MOVE, WORK, MOVE, WORK, MOVE]; 
                else if (spawn.room.energyCapacityAvailable < 1300)     // lvl 3, 800 energy
                    body = [ // 750 energy, 5x WORK, 5x MOVE
                            WORK, MOVE, WORK, MOVE, WORK, MOVE, WORK, MOVE, WORK, MOVE];
                else if (spawn.room.energyCapacityAvailable < 1800)     // lvl 4, 1300 energy
                    body = [ // 1050 energy, 7x WORK, 7x MOVE
                            WORK, MOVE, WORK, MOVE, WORK, MOVE, WORK, MOVE, WORK, MOVE, 
                            WORK, MOVE, WORK, MOVE];
                else if (spawn.room.energyCapacityAvailable < 2300)     // lvl 5, 1800 energy
                    body = [ // 1500 energy, 10x WORK, 10x MOVE
                            WORK, MOVE, WORK, MOVE, WORK, MOVE, WORK, MOVE, WORK, MOVE,
                            WORK, MOVE, WORK, MOVE, WORK, MOVE, WORK, MOVE, WORK, MOVE]; 
                else if (spawn.room.energyCapacityAvailable < 5300)     // lvl 6, 2300 energy
                    body = [ // 1800 energy, 12x WORK, 12x MOVE
                            WORK, MOVE, WORK, MOVE, WORK, MOVE, WORK, MOVE, WORK, MOVE,
                            WORK, MOVE, WORK, MOVE, WORK, MOVE, WORK, MOVE, WORK, MOVE,
                            WORK, MOVE, WORK, MOVE];
                else if (spawn.room.energyCapacityAvailable < 12300)    // lvl 7, 5300 energy
                    body = [ // 3750 energy, 25x WORK, 25x MOVE
                            WORK, MOVE, WORK, MOVE, WORK, MOVE, WORK, MOVE, WORK, MOVE,
                            WORK, MOVE, WORK, MOVE, WORK, MOVE, WORK, MOVE, WORK, MOVE,
                            WORK, MOVE, WORK, MOVE, WORK, MOVE, WORK, MOVE, WORK, MOVE,
                            WORK, MOVE, WORK, MOVE, WORK, MOVE, WORK, MOVE, WORK, MOVE,
                            WORK, MOVE, WORK, MOVE, WORK, MOVE, WORK, MOVE, WORK, MOVE];
                else if (spawn.room.energyCapacityAvailable == 12300)   // lvl 8, 12300 energy
                    body = [ // 3750 energy, 25x WORK, 25x MOVE
                            WORK, MOVE, WORK, MOVE, WORK, MOVE, WORK, MOVE, WORK, MOVE,
                            WORK, MOVE, WORK, MOVE, WORK, MOVE, WORK, MOVE, WORK, MOVE,
                            WORK, MOVE, WORK, MOVE, WORK, MOVE, WORK, MOVE, WORK, MOVE,
                            WORK, MOVE, WORK, MOVE, WORK, MOVE, WORK, MOVE, WORK, MOVE,
                            WORK, MOVE, WORK, MOVE, WORK, MOVE, WORK, MOVE, WORK, MOVE];

                spawn.createCreep(body, null, {role: 'burrower', room: rmHarvest});
            }
        }
        else if (lCarrier.length < popCarrier) {
                var body;
                if (spawn.room.energyCapacityAvailable < 550)           // lvl 1, 300 energy
                    body = [ // 300 energy, 3x CARRY, 3x MOVE
                            CARRY, MOVE, CARRY, MOVE, CARRY, MOVE]; 
                else if (spawn.room.energyCapacityAvailable < 800)      // lvl 2, 550 energy
                        body = [ // 400 energy, 4x CARRY, 4x MOVE
                            CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE]; 
                else if (spawn.room.energyCapacityAvailable < 1300)     // lvl 3, 800 energy
                    body = [ // 600 energy, 6x CARRY, 6x MOVE
                            CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE,
                            CARRY, MOVE];
                else if (spawn.room.energyCapacityAvailable < 1800)     // lvl 4, 1300 energy
                    body = [ // 1000 energy, 10x CARRY, 10x MOVE
                            CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE,
                            CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE];
                else if (spawn.room.energyCapacityAvailable < 2300)     // lvl 5, 1800 energy
                    body = [ // 1400 energy, 14x CARRY, 14x MOVE
                            CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE,
                            CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE,
                            CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE];
                else if (spawn.room.energyCapacityAvailable < 5300)     // lvl 6, 2300 energy
                    body = [ // 1800 energy, 18x CARRY, 18x MOVE
                            CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE,
                            CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE,
                            CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE,
                            CARRY, MOVE, CARRY, MOVE, CARRY, MOVE];
                else if (spawn.room.energyCapacityAvailable < 12300)    // lvl 7, 5300 energy
                    body = [ // 2500 energy, 25x CARRY, 25x MOVE
                            CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE,
                            CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE,
                            CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE,
                            CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE,
                            CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE];
                else if (spawn.room.energyCapacityAvailable == 12300)   // lvl 8, 12300 energy
                    body = [ // 2500 energy, 25x CARRY, 25x MOVE
                            CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE,
                            CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE,
                            CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE,
                            CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE,
                            CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE];

            spawn.createCreep(body, null, {role: 'carrier', room: rmHarvest});
        }
        

        // Run roles!
        for (var n in Game.creeps) {
            var creep = Game.creeps[n];
                
            if (creep.memory.room == rmHarvest && (creep.memory.role == 'miner' || creep.memory.role == 'burrower' || creep.memory.role == 'carrier')) {
                roleMiner.run(creep, rmDeliver, rmHarvest);
            }
        }
    }
};

module.exports = siteMining;
