var siteMining = {

    // Note: Miner = Burrower + Carrier
    run: function(spawn, rmDeliver, rmHarvest, popBurrower, popCarrier, popMiner) {
    
        var lBurrower  = _.filter(Game.creeps, (creep) => creep.memory.role == 'burrower' && creep.memory.room == rmHarvest);
        var lCarrier  = _.filter(Game.creeps, (creep) => creep.memory.role == 'carrier' && creep.memory.room == rmHarvest);
        var lMiner  = _.filter(Game.creeps, (creep) => creep.memory.role == 'miner' && creep.memory.room == rmHarvest);
        

        if (lMiner.length < popMiner) {
            if (lMiner.length == 0) // Possibly colony wiped? Need restart?
                spawn.createCreep([WORK, CARRY, CARRY, MOVE, MOVE], null, {role: 'miner', room: rmHarvest});
            else
                spawn.createCreep([WORK, WORK, WORK, WORK, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE], null, {role: 'miner', room: rmHarvest});
        }
        else if (lBurrower.length < popBurrower) {
            if (lCarrier.length < popCarrier && lMiner.length == 0) // Possibly colony wiped? Need restart?
                spawn.createCreep([WORK, CARRY, CARRY, MOVE, MOVE], null, {role: 'miner', room: rmHarvest});
            else
                spawn.createCreep([WORK, WORK, WORK, WORK, WORK, MOVE, MOVE, MOVE, MOVE, MOVE], null, {role: 'burrower', room: rmHarvest});
        }
        else if (lCarrier.length < popCarrier) {
            spawn.createCreep([CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE], null, {role: 'carrier', room: rmHarvest});
        }
        

        // Run roles!
        for (var n in Game.creeps) {
            var creep = Game.creeps[n];
                
            if (creep.memory.room == rmHarvest && creep.memory.role == 'miner' || creep.memory.role == 'burrower' || creep.memory.role == 'carrier') {
                roleMiner.run(creep, rmDeliver, rmHarvest);
            }
        }
    }
};

module.exports = siteMining;