var RoleWorker = {

    run: function(creep) {

        var _ticksReusePath = 10;

        // Manage machine states!
        if (creep.memory.state == 'working' && creep.carry[RESOURCE_ENERGY] == 0) {
            creep.memory.state = 'getenergy';
        }
        else if (creep.memory.state == 'getenergy' && creep.carry[RESOURCE_ENERGY] == creep.carryCapacity) {
            creep.memory.state = 'working';
        }
        else if (creep.memory.state != 'getenergy' && creep.memory.state != 'working') {
            creep.memory.state = 'working';
        }

        // Out of energy? Find more...
	    if(creep.memory.state == 'getenergy') {
            var source;
            
            // Try to pick up off the ground first, if there is a pile...
            source = creep.pos.findClosestByRange(FIND_DROPPED_ENERGY, { filter: (s) => { return s.amount > 100; }});
            
            if (source != null)  {
                if (creep.pickup(source) == ERR_NOT_IN_RANGE)
                    creep.moveTo(source, {reusePath: _ticksReusePath});
            }
            
            else // Try to pull energy from storage containers...
            {
                source = creep.pos.findClosestByRange(FIND_STRUCTURES, {
                            filter: (structure) => {
                                return (structure.structureType == STRUCTURE_CONTAINER && structure.store[RESOURCE_ENERGY] > 0)
                                        || (structure.structureType == STRUCTURE_STORAGE && structure.store[RESOURCE_ENERGY] > 0);
                            }
                    });
                
                if (source != null) {
                    if (source.transfer(creep, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                        creep.moveTo(source, {reusePath: _ticksReusePath});
                    }
                }
                else { // But if there are none... then harvest from a source
                    
                    source = creep.pos.findClosestByPath(FIND_SOURCES);
                    if(creep.harvest(source) == ERR_NOT_IN_RANGE) {
                        creep.moveTo(source, {reusePath: _ticksReusePath});
                    } 
                }
            }
	    }
	    

	    else if (creep.memory.state == 'working') {
        // Order of functions: upgrade critical downgrade timer, repair, build, then upgrade extra

            if (creep.room.controller != null && creep.room.controller.ticksToDowngrade < 5000) {
                var r = creep.upgradeController(creep.room.controller); 
                if (r == OK) return;
                else if (r == ERR_NOT_IN_RANGE) {
                    creep.moveTo(creep.room.controller, {reusePath: _ticksReusePath});
                    return;
                }
            }

            var structure;

            // Repair *critical* structures
            structure = creep.pos.findClosestByRange(FIND_STRUCTURES, {
                            filter: function(structure) {
                                return (structure.structureType == STRUCTURE_RAMPART && structure.hits < 20000)
                                    || (structure.structureType == STRUCTURE_WALL && structure.hits < 20000)
                                    || (structure.structureType == STRUCTURE_CONTAINER && structure.hits < structure.hitsMax / 3)
                                    || (structure.structureType == STRUCTURE_ROAD && structure.hits < structure.hitsMax / 3);
                            } 
                    }); 
            if (structure != null) {
                var r = creep.repair(structure); 
                if (r == OK) return;
                else if(r == ERR_NOT_IN_RANGE) {
                    creep.moveTo(structure, {reusePath: _ticksReusePath});
                    return;
                }
            }

            // Build construction sites
            structure = creep.pos.findClosestByRange(FIND_CONSTRUCTION_SITES);
            if (structure != null) {
                var r = creep.build(structure);
                if (r == OK) return;
                else if (r == ERR_NOT_IN_RANGE) {
                    creep.moveTo(structure, {reusePath: _ticksReusePath});
                    return;
                }
            }

            // Repair *maintenance* for subrole repairers
            if (creep.memory.subrole == 'repairer') {
                structure = creep.pos.findClosestByRange(FIND_STRUCTURES, {
                                filter: function(structure) {
                                    return (structure.structureType == STRUCTURE_ROAD && structure.hits < structure.hitsMax / 2)
                                        || (structure.structureType == STRUCTURE_CONTAINER && structure.hits < structure.hitsMax / 2)
                                        || (structure.structureType == STRUCTURE_RAMPART && structure.hits < 100000)
                                        || (structure.structureType == STRUCTURE_WALL && structure.hits < 100000);
                                } 
                        });
                if (structure != null) {
                    var r = creep.repair(structure);
                    if (r == OK) return;
                    else if (r == ERR_NOT_IN_RANGE) {
                        creep.moveTo(structure, {reusePath: _ticksReusePath});
                        return;
                    }
                }
            }

            // Or upgrade the controller
            var r = creep.upgradeController(creep.room.controller);
            if (r == OK) return;
            else if (r == ERR_NOT_IN_RANGE) {
                creep.moveTo(creep.room.controller, {reusePath: _ticksReusePath});
                return;
            }
	    }
	}
};

module.exports = RoleWorker;