var w18s43Miner = require('w18s43.miner');
var w18s43Worker = require('w18s43.worker');

var w16s43Miner = require('w16s43.miner');
var w16s43Worker = require('w16s43.worker');

var w17s43Miner = require('w17s43.mining.op');
var w19s43Miner = require('w19s43.mining.op');
var w16s42Miner = require('w16s42.mining.op');

module.exports.loop = function () {

    // Clear dead creeps from Memory
    for (var eachCreep in Memory.creeps) {
        if (!Game.creeps[eachCreep]) {
            delete Memory.creeps[eachCreep];
        }
    }


/* TO DO:

	Iterate rooms with Object.keys(Game.rooms)
		then iterate the rooms to memory, update each tick
		note hostility, controller level, # of sources
		note explored rooms surrounding... iterate exits???
		balance amount of creeps in the room and surrounding rooms (may need scout to scout all surrounding rooms)



    // Iterate all rooms to memory

    for (var n in Object.keys(Game.rooms)) {
        if (Game.rooms[n]) {
            Memory.rooms[n] = {
                'Hostile_Creeps': Game.rooms[n].find(FIND_HOSTILE_CREEPS),
                'Sources': Game.rooms[n].find(FIND_SOURCES) };
        }
    }
*/     



    /* W16S43 
     * COLONY OPERATION (#2)
     */
    var p2Burrower = 1;
    var p2Carrier = 2;
    var p2Upgrader = 4;
    var p2Builder = 1;
    var p2Repairer = 2;
    var p2Defender = 0;
    
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
            w16s43Miner.run(thisCreep);
        }
        else if (thisCreep.memory.role == 'w16s43upgrader' || thisCreep.memory.role == 'w16s43builder' || thisCreep.memory.role == 'w16s43repairer') {
            w16s43Worker.run(thisCreep);
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
    
    
    
    /* W16S42 
     * Mining Operation 
     * (from Colony #2, W16S43)
     */
    var pW16S42BurrowerW = 1;
    var pW16S42BurrowerE = 1;
    var pW16S42Carrier = 5;
    
    var lW16S42BurrowerW = _.filter(Game.creeps, (creep) => creep.memory.role == 'w16s42burrowerW');
    var lW16S42BurrowerE = _.filter(Game.creeps, (creep) => creep.memory.role == 'w16s42burrowerE');
    var lW16S42Carrier = _.filter(Game.creeps, (creep) => creep.memory.role == 'w16s42carrier');
    

    if (lW16S42BurrowerW.length < pW16S42BurrowerW) {
        var newHarvester = Game.spawns.Spawn2.createCreep([WORK, WORK, WORK, WORK, WORK, MOVE, MOVE, MOVE, MOVE, MOVE], null, {role: 'w16s42burrowerW'});
    }
    else if (lW16S42BurrowerE.length < pW16S42BurrowerE) {
        var newHarvester = Game.spawns.Spawn2.createCreep([WORK, WORK, WORK, WORK, WORK, MOVE, MOVE, MOVE, MOVE, MOVE], null, {role: 'w16s42burrowerE'});
    }
    else if (lW16S42Carrier.length < pW16S42Carrier) {
        var newHarvester = Game.spawns.Spawn2.createCreep([CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE], null, {role: 'w16s42carrier'});
    }
    for (var eachName in Game.creeps) {
        var thisCreep = Game.creeps[eachName];
        if (thisCreep.memory.role == 'w16s42burrowerW' || thisCreep.memory.role == 'w16s42burrowerE' || thisCreep.memory.role == 'w16s42carrier') {
            w16s42Miner.run(thisCreep);
        }
    }
    
    
  

    /* W18S43
     * COLONY OPERATION (#1)
     */
    var p1MinerN = 4;
    var p1MinerS = 2;
    var p1Upgrader = 6;
    var p1Builder = 1;
    var p1Repairer = 2;
    var p1Defender = 0;
    
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
        
        if (thisCreep.memory.role == 'w18s43MinerS' || thisCreep.memory.role == 'w18s43MinerN') {
            w18s43Miner.run(thisCreep);
        }
        else if (thisCreep.memory.role == 'w18s43upgrader' || thisCreep.memory.role == 'w18s43builder' 
        || thisCreep.memory.role == 'w18s43repairer' || thisCreep.memory.role == 'w18s43defender') {
            w18s43Worker.run(thisCreep);
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
        if (thisCreep.memory.role == 'w17s43minerW' || thisCreep.memory.role == 'w17s43minerE') {
            w17s43Miner.run(thisCreep);
        }
    }
    
    
    /* W19S43 
     * Mining Operation #2
     * (from Colony #1, W18S43)
     */
    var pW19S43Miner = 3;
    
    var lW19S43Miner = _.filter(Game.creeps, (creep) => creep.memory.role == 'w19s43miner');
    if (lW19S43Miner.length < pW19S43Miner) {
        var newHarvester = Game.spawns.Spawn1.createCreep([WORK, WORK, WORK, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE], null, {role: 'w19s43miner'});
    }
    for (var eachName in Game.creeps) {
        var thisCreep = Game.creeps[eachName];
        if (thisCreep.memory.role == 'w19s43miner') {
            w19s43Miner.run(thisCreep);
        }
    }
}
