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
    
    

    // siteMining.run(spawn, rmDeliver, rmHarvest, popBurrower, popCarrier, popMiner)

    siteMining.run(Game.spawns.Spawn2, 'W16S43', 'W16S42', 2, 4, 0);    // W16S42 mining operation (from Colony #2, W16S43)
    siteMining.run(Game.spawns.Spawn2, 'W16S43', 'W17S42', 1, 2, 0);    // W17S42 mining operation (from Colony #2, W16S43)
    siteMining.run(Game.spawns.Spawn2, 'W16S43', 'W16S41', 1, 2, 0);    // W16S41 mining operation (from Colony #2, W16S43)


    
  

    /* W18S43
     * COLONY OPERATION (#1)
     */
    var p1MinerN = 4;
    var p1MinerS = 2;
    var p1Upgrader = 6;
    var p1Builder = 1;
    var p1Repairer = 2;
    var p1Defender = 1;
    
    var l1MinerN = _.filter(Game.creeps, (creep) => creep.memory.role == 'w18s43MinerN');
    var l1MinerS = _.filter(Game.creeps, (creep) => creep.memory.role == 'w18s43MinerS');
    
    if (l1MinerN.length < p1MinerN) {
        if (l1MinerN.length == 0)
            var newHarvester = Game.spawns.Spawn1.createCreep([WORK, CARRY, CARRY, MOVE, MOVE], null, {role: 'w18s43MinerN'});
        else
            var newHarvester = Game.spawns.Spawn1.createCreep([WORK, WORK, WORK, WORK, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE], null, {role: 'w18s43MinerN'});
    }
    if (l1MinerS.length < p1MinerS) {
        var newHarvester = Game.spawns.Spawn1.createCreep([WORK, WORK, WORK, WORK, WORK, WORK, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE], null, {role: 'w18s43MinerS'});
    }
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
    
    
    /* W17S43 
     * Mining Operation #1
     * (from Colony #1, W18S43)
     */
    var pW17S43MinerW = 4;
    var pW17S43MinerE = 3;
    

    if (Game.rooms.W17S43 != null && Game.rooms.W17S43.find(FIND_HOSTILE_CREEPS).length > 0) {
        var lW17S43Defender = _.filter(Game.creeps, (creep) => creep.memory.role == 'w17s43defender');
        if (lW17S43Defender.length == 0) {
            var newDefender = Game.spawns.Spawn1.createCreep([TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH,  
                                                            ATTACK, ATTACK, ATTACK, 
                                                            MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE], null, {role: 'w17s43defender'});
        }

        for (var n = 0; n < lW17S43Defender.length; n++) {
            if (lW17S43Defender[n].attack(Game.rooms.W17S43.find(FIND_HOSTILE_CREEPS)[0]) == ERR_NOT_IN_RANGE) {
                lW17S43Defender[n].moveTo(Game.rooms.W17S43.find(FIND_HOSTILE_CREEPS)[0]);
            }
        }
    }
    var lW17S43MinerW = _.filter(Game.creeps, (creep) => creep.memory.role == 'w17s43minerW');
    if (lW17S43MinerW.length < pW17S43MinerW) {
        var newHarvester = Game.spawns.Spawn1.createCreep([WORK, WORK, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE], null, {role: 'w17s43minerW'});
    }
    var lW17S43MinerE = _.filter(Game.creeps, (creep) => creep.memory.role == 'w17s43minerE');
    if (lW17S43MinerE.length < pW17S43MinerE) {
        var newHarvester = Game.spawns.Spawn1.createCreep([WORK, WORK, WORK, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE], null, {role: 'w17s43minerE'});
    }
    for (var eachName in Game.creeps) {
        var thisCreep = Game.creeps[eachName];
        if (thisCreep.memory.role == 'w17s43minerW') {
            roleMiner.run(thisCreep, 'W18S43', 'W17S43', '577b93470f9d51615fa47e61');
        } else if (thisCreep.memory.role == 'w17s43minerE') {
            roleMiner.run(thisCreep, 'W18S43', 'W17S43', '577b93470f9d51615fa47e60');
        }
    }
    
    
    /* W19S43 
     * Mining Operation #2
     * (from Colony #1, W18S43)
     */
    var pW19S43Miner = 3;
    
    if (Game.rooms.W19S43 != null && Game.rooms.W19S43.find(FIND_HOSTILE_CREEPS).length > 0) {
        var lW19S43Defender = _.filter(Game.creeps, (creep) => creep.memory.role == 'w19s43defender');
        if (lW19S43Defender.length == 0) {
            var newDefender = Game.spawns.Spawn1.createCreep([TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH,  
                                                            ATTACK, ATTACK, ATTACK, 
                                                            MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE], null, {role: 'w19s43defender'});
        }

        for (var n = 0; n < lW19S43Defender.length; n++) {
            if (lW19S43Defender[n].attack(Game.rooms.W19S43.find(FIND_HOSTILE_CREEPS)[0]) == ERR_NOT_IN_RANGE) {
                lW19S43Defender[n].moveTo(Game.rooms.W19S43.find(FIND_HOSTILE_CREEPS)[0]);
            }
        }
    }
    var lW19S43Miner = _.filter(Game.creeps, (creep) => creep.memory.role == 'w19s43miner');
    if (lW19S43Miner.length < pW19S43Miner) {
        var newHarvester = Game.spawns.Spawn1.createCreep([WORK, WORK, WORK, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE], null, {role: 'w19s43miner'});
    }
    for (var eachName in Game.creeps) {
        var thisCreep = Game.creeps[eachName];
        if (thisCreep.memory.role == 'w19s43miner') {
            roleMiner.run(thisCreep, 'W18S43', 'W19S43', '577b93400f9d51615fa47de1');
        }
    }
}
