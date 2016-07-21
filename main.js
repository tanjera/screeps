var siteMining = require('site.mining');

var roleMiner = require('role.miner');
var roleWorker = require('role.worker');
var roleSoldier = require('role.soldier');


module.exports.loop = function () {

    // Clear dead creeps from Memory
    for (var eachCreep in Memory.creeps) {
        if (!Game.creeps[eachCreep]) {
            delete Memory.creeps[eachCreep];
        }
    }


/* TO DO:
    refactor colonies into siteColony

    scale colony and mining op body parts by room controller level...

    split helper functions into separate functions
        e.g. navigating rooms- move from role.miner to navigate room code??
*/     



    /* W16S43 
     * COLONY OPERATION (#2)
     */
   
    var p2Upgrader = 4;
    var p2Builder = 1;
    var p2Repairer = 2;
    var p2Defender = 1;
    
    
    var l2Upgrader = _.filter(Game.creeps, (creep) => creep.memory.role == 'w16s43upgrader');
    var l2Builder = _.filter(Game.creeps, (creep) => creep.memory.role == 'w16s43builder');
    var l2Repairer = _.filter(Game.creeps, (creep) => creep.memory.role == 'w16s43repairer');
    var l2Defender = _.filter(Game.creeps, (creep) => creep.memory.role == 'w16s43defender');
    
   
    if (l2Upgrader.length < p2Upgrader) {
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
            

         if (thisCreep.memory.role == 'w16s43upgrader' || thisCreep.memory.role == 'w16s43builder' || thisCreep.memory.role == 'w16s43repairer') {
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
    
    

    // siteMining.run(spawn, rmDeliver, rmHarvest, popBurrower, popCarrier, popMiner)
    siteMining.run(Game.spawns.Spawn2, 'W16S43', 'W16S43', 1, 2, 0);    // W16S43 colony #2 mining
    siteMining.run(Game.spawns.Spawn2, 'W16S43', 'W16S42', 2, 4, 0);    // W16S42 mining operation (from Colony #2, W16S43)
    siteMining.run(Game.spawns.Spawn2, 'W16S43', 'W17S42', 1, 2, 0);    // W17S42 mining operation (from Colony #2, W16S43)
    siteMining.run(Game.spawns.Spawn2, 'W16S43', 'W16S41', 1, 2, 0);    // W16S41 mining operation (from Colony #2, W16S43)


    
  

    /* W18S43
     * COLONY OPERATION (#1)
     */
    var p1Upgrader = 6;
    var p1Builder = 1;
    var p1Repairer = 2;
    var p1Defender = 1;
    
    
    var l1Upgrader = _.filter(Game.creeps, (creep) => creep.memory.role == 'w18s43upgrader');
    if (l1Upgrader.length < p1Upgrader) {
        var newUpgrader = Game.spawns.Spawn1.createCreep([WORK, WORK, WORK, WORK, WORK, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE], null, {role: 'w18s43upgrader'});
    }
    var l1Builder = _.filter(Game.creeps, (creep) => creep.memory.role == 'w18s43builder');
    if (l1Builder.length < p1Builder
            && Game.spawns.Spawn1.room.find(FIND_CONSTRUCTION_SITES).length > 0) {
        var newBuilder = Game.spawns.Spawn1.createCreep([WORK, WORK, WORK, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE], null, {role: 'w18s43builder'});
    }
    var l1Repairer = _.filter(Game.creeps, (creep) => creep.memory.role == 'w18s43repairer');
    if (l1Repairer.length < p1Repairer) {
        var newRepairer = Game.spawns.Spawn1.createCreep([WORK, WORK, WORK, WORK, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE], null, {role: 'w18s43repairer'});
    }
    var l1Defender = _.filter(Game.creeps, (creep) => creep.memory.role == 'w18s43defender');
    if (l1Defender.length < p1Defender // If there's a hostile creep in the room... spawn a defender!
        || (l1Defender.length < Game.spawns.Spawn1.room.find(FIND_HOSTILE_CREEPS).length)) {
        var newDefender = Game.spawns.Spawn1.createCreep([TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH,  
                                                            ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE], null, {role: 'w18s43defender'});
    }
    
    // Run roles!
    for (var eachName in Game.creeps) {
        var thisCreep = Game.creeps[eachName];
        
        if (thisCreep.memory.role == 'w18s43MinerN') {
            roleMiner.run(thisCreep, 'W18S43', 'W18S43', '577b93430f9d51615fa47e1d');
        }
        else if (thisCreep.memory.role == 'w18s43MinerS') {
            roleMiner.run(thisCreep, 'W18S43', 'W18S43', '577b93430f9d51615fa47e1e');
        }
        else if (thisCreep.memory.role == 'w18s43upgrader' || thisCreep.memory.role == 'w18s43builder' 
        || thisCreep.memory.role == 'w18s43repairer' || thisCreep.memory.role == 'w18s43defender') {
            roleWorker.run(thisCreep);
        }
    }
    
    // Process Towers
    var listTowers = Game.spawns.Spawn1.room.find(FIND_MY_STRUCTURES, {
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
    
    // siteMining.run(spawn, rmDeliver, rmHarvest, popBurrower, popCarrier, popMiner)
    siteMining.run(Game.spawns.Spawn2, 'W18S43', 'W18S43', 2, 4, 0);    // W18S43 colony #1 mining
    siteMining.run(Game.spawns.Spawn2, 'W18S43', 'W17S43', 2, 5, 0);    // W17S43 mining operation (from Colony #1, W18S43)
    siteMining.run(Game.spawns.Spawn2, 'W18S43', 'W19S43', 1, 3, 0);    // W19S43 mining operation (from Colony #1, W18S43)
    
}
