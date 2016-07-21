var siteColony = {

    run: function(spawn) {
    
    var p2Burrower = 1;
    var p2Carrier = 2;
    var p2Upgrader = 4;
    var p2Builder = 1;
    var p2Repairer = 2;
    var p2Defender = 1;
    
    var l2Burrower  = _.filter(Game.creeps, (creep) => creep.memory.role == 'w16s43burrower');
    var l2Carrier  = _.filter(Game.creeps, (creep) => creep.memory.role == 'w16s43carrier');
    var l2Miner  = _.filter(Game.creeps, (creep) => creep.memory.role == 'w16s43miner');
    var l2Upgrader = _.filter(Game.creeps, (creep) => creep.memory.role == 'w16s43upgrader');
    var l2Builder = _.filter(Game.creeps, (creep) => creep.memory.role == 'w16s43builder');
    var l2Repairer = _.filter(Game.creeps, (creep) => creep.memory.role == 'w16s43repairer');
    var l2Defender = _.filter(Game.creeps, (creep) => creep.memory.role == 'w16s43defender');
    
    if (l2Burrower.length < p2Burrower) {
        if (l2Carrier.length < p2Carrier && l2Miner == 0) // Possibly colony wiped? Need restart?
            var newHarvester = Game.spawns.Spawn2.createCreep([WORK, CARRY, CARRY, MOVE, MOVE], null, {role: 'w16s43miner'});
        else
            var newHarvester = Game.spawns.Spawn2.createCreep([WORK, WORK, WORK, WORK, WORK, MOVE, MOVE, MOVE, MOVE, MOVE], null, {role: 'w16s43burrower'});
    }
    else if (l2Carrier.length < p2Carrier) {
        var newHarvester = Game.spawns.Spawn2.createCreep([CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE], null, {role: 'w16s43carrier'});
    }
    else if (l2Upgrader.length < p2Upgrader) {
        var newUpgrader = Game.spawns.Spawn2.createCreep([WORK, WORK, WORK, WORK, WORK, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE], null, {role: 'w16s43upgrader'});
    }
    else if (l2Builder.length < p2Builder
            && Game.spawns.Spawn2.room.find(FIND_CONSTRUCTION_SITES).length > 0) {
        var newBuilder = Game.spawns.Spawn2.createCreep([WORK, WORK, WORK, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE], null, {role: 'w16s43builder'});
    }
    else if (l2Repairer.length < p2Repairer) {
        var newRepairer = Game.spawns.Spawn2.createCreep([WORK, WORK, WORK, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE], null, {role: 'w16s43repairer'});
    }
    if (l2Defender.length < p2Defender // If there's a hostile creep in the room... spawn a defender!
        || (l2Defender.length < Game.spawns.Spawn2.room.find(FIND_HOSTILE_CREEPS).length)) {
        var newDefender = Game.spawns.Spawn2.createCreep([TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH,  
                                                            ATTACK, ATTACK, ATTACK, 
                                                            MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE], null, {role: 'w16s43defender'});
    }
    
    // Run roles!
    for (var eachName in Game.creeps) {
        var thisCreep = Game.creeps[eachName];
            
        if (thisCreep.memory.role == 'w16s43miner' || thisCreep.memory.role == 'w16s43burrower' || thisCreep.memory.role == 'w16s43carrier') {
            roleMiner.run(thisCreep, 'W16S43', 'W16S43', '577b93490f9d51615fa47eb2');
        }
        else if (thisCreep.memory.role == 'w16s43upgrader' || thisCreep.memory.role == 'w16s43builder' || thisCreep.memory.role == 'w16s43repairer') {
            roleWorker.run(thisCreep);
        }
    }
    
     // Process Towers
    var listTowers = Game.spawns.Spawn2.room.find(FIND_MY_STRUCTURES, {
                    filter: (structure) => {
                        return structure.structureType == STRUCTURE_TOWER; }});
                        
    for (var i = 0; i < listTowers.length; i++) {
        var hostile = listTowers[i].pos.findClosestByRange(FIND_HOSTILE_CREEPS);
        if (hostile) { // Anyone to attack?
            listTowers[i].attack(hostile);
        } 
        else { // Repair critical structures
            var lstructures = listTowers[i].room.find(FIND_STRUCTURES, {
	                        filter: function(structure) {
	                            return (structure.structureType == STRUCTURE_RAMPART && structure.hits < 10000)
                                    || (structure.structureType == STRUCTURE_WALL && structure.hits < 10000)
                                    || (structure.structureType == STRUCTURE_CONTAINER && structure.hits < structure.hitsMax / 5)
                                    || (structure.structureType == STRUCTURE_ROAD && structure.hits < structure.hitsMax / 5);
	                        } 
	                });
            if (lstructures.length > 0) {
                listTowers[i].repair(lstructures[0]);
            } 
        }
    }
    }
};

module.exports = siteColony;