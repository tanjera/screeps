let _Creep = require("util.creep");
let Tasks = require("tasks");

module.exports = {
	
    Worker: function(creep, hasKeepers) {
        let hostile = (hasKeepers == true)
			? _.head(creep.pos.findInRange(FIND_HOSTILE_CREEPS, 5, { filter: 
				c => { return Memory["allies"].indexOf(c.owner.username) < 0; }}))
			: null;
			
		if (hostile == null) {
			if (creep.memory.room != null && creep.room.name != creep.memory.room) {
				_Creep.moveToRoom(creep, creep.memory.room);
			}
			else if (creep.memory.state == "refueling") {
				if (_.sum(creep.carry) >= creep.carryCapacity * 0.9) {
					creep.memory.state = "working";
					Tasks.returnTask(creep, creep.memory.task);
					return;
				}
				
				Tasks.assignTask(creep, true);        
				if (_Creep.runTaskTimer(creep)) {
					_Creep.runTask(creep);
				}
				return;

			} else if (creep.memory.state == "working") {            
				if (creep.carry[RESOURCE_ENERGY] == 0) {
						creep.memory.state = "refueling";
						Tasks.returnTask(creep, creep.memory.task);
						return;
					}
				
				Tasks.assignTask(creep, false);
				if (_Creep.runTaskTimer(creep)) {
					_Creep.runTask(creep);
				}
				return;

			} else {
				creep.memory.state = "refueling";
				return;
			}
		} else if (hostile != null) {		
			let _Creep = require("util.creep");
			_Creep.moveFrom(creep, hostile);
			return;
		}
	},

    Mining: function(creep, hasKeepers) {
		let hostile = (hasKeepers == true)
			? _.head(creep.pos.findInRange(FIND_HOSTILE_CREEPS, 5, { filter: 
				c => { return Memory["allies"].indexOf(c.owner.username) < 0; }}))
			: null;
			
		if (hostile == null) {
			if (creep.memory.state == "refueling") {
				if (creep.carryCapacity > 0 && _.sum(creep.carry) >= creep.carryCapacity * 0.85) {
					creep.memory.state = "delivering";
					Tasks.returnTask(creep, creep.memory.task);
					return;
				}
				
				Tasks.assignTask(creep, true);        
				if (_Creep.runTaskTimer(creep)) {
					_Creep.runTask(creep);
				}
				return;

			} else if (creep.memory.state == "delivering") {            
				if (creep.carryCapacity == 0 || _.sum(creep.carry) == 0) {
					creep.memory.state = "refueling";
					Tasks.returnTask(creep, creep.memory.task);
					return;
				}

				Tasks.assignTask(creep, false);
				if (_Creep.runTaskTimer(creep)) {
					_Creep.runTask(creep);
				}
				return;

			} else {
				creep.memory.state = "refueling";
				return;
			} 
		} else if (hostile != null) {		
			let _Creep = require("util.creep");
			_Creep.moveFrom(creep, hostile);
			return;
		}
	},

    Courier: function(creep) {
        if (creep.memory.room != null && creep.room.name != creep.memory.room) {
            _Creep.moveToRoom(creep, creep.memory.room);
        }
        else if (creep.memory.state == "loading") {
            if (_.sum(creep.carry) > 0) {
                creep.memory.state = "delivering";
                Tasks.returnTask(creep, creep.memory.task);
                return;
            }
            
            Tasks.assignTask(creep, true);        
            if (_Creep.runTaskTimer(creep)) {
                _Creep.runTask(creep);
            }
            return;

        } else if (creep.memory.state == "delivering") {            
            if (_.sum(creep.carry) == 0) {
                    creep.memory.state = "loading";
                    Tasks.returnTask(creep, creep.memory.task);
                    return;
                }
            
            Tasks.assignTask(creep, false);
            if (_Creep.runTaskTimer(creep)) {
                _Creep.runTask(creep);
            }
            return;

        } else {
            creep.memory.state = "loading";
            return;
        } },

    Extracter: function(creep, hasKeepers) {
		let hostile = (hasKeepers == true)
			? _.head(creep.pos.findInRange(FIND_HOSTILE_CREEPS, 5, { filter: 
				c => { return Memory["allies"].indexOf(c.owner.username) < 0; }}))
			: null;
			
		if (hostile == null) {
			switch (creep.memory.state) {
				default:
				case "get_minerals":
					if (_.sum(creep.carry) >= creep.carryCapacity * 0.9) {
						creep.memory.state = "deliver";
					}

					Tasks.assignTask(creep, true);
					if (_Creep.runTaskTimer(creep)) {
						_Creep.runTask(creep);
					}
				return;

				case "deliver":
					if (_.sum(creep.carry) == 0) {
						creep.memory.state = "get_minerals";
					}

					Tasks.assignTask(creep, false);
					if (_Creep.runTaskTimer(creep)) {
						_Creep.runTask(creep);
					}
				return;
			} 
		} else if (hostile != null) {
			let _Creep = require("util.creep");
			_Creep.moveFrom(creep, hostile);
			return;
		}
	},

    Reserver: function(creep) {
        if (creep.memory.room != null && creep.room.name != creep.memory.room) {
            _Creep.moveToRoom(creep, creep.memory.room, true);
            return;
        }
        else {
            let result = creep.reserveController(creep.room.controller); 
            if (result == ERR_NOT_IN_RANGE) {
                creep.moveTo(creep.room.controller)
                return;
            } else if (result == OK) {
                if (Game.time % 4 == 0) {  // Don't park next to a source (and possibly block it!)
                    let sources = creep.pos.findInRange(FIND_SOURCES, 1);
                    if (sources != null && sources.length > 0) {
                        let __creep = require("util.creep");
                        __creep.moveFrom(creep, sources[0]);
                    }
                }
                return;
            }                
        } 
	},
		
    Soldier: function(creep, destroyStructures, listTargets) {
		if (creep.memory.room != null && creep.room.name != creep.memory.room) {
            _Creep.moveToRoom(creep, creep.memory.room);
        }
        else {
            let target;
			
			for (let t in listTargets) {
				target = Game.getObjectById(listTargets[t]);
				if (target != null) {
					if (creep.attack(target) == ERR_NOT_IN_RANGE)
						creep.moveTo(target);
					creep.heal(creep);				
					return;					
				}
			}
			
			if (target == null) {
				target = creep.pos.findClosestByRange(FIND_HOSTILE_CREEPS, { filter: (c) => { 
					return Memory["allies"].indexOf(c.owner.username) < 0; }});
			}
			
            if (target != null) {
                if (creep.attack(target) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(target);
					creep.heal(creep);
                }
				return;
            }
						
			creep.heal(creep);
			
			if (destroyStructures != null && destroyStructures == true) {
				target = _.head(_.sortBy(creep.room.find(FIND_STRUCTURES, { filter: 
					s => { return s.hits != null && s.hits > 0 
							&& (s.owner == null || Memory["allies"].indexOf(s.owner.username) < 0); }}),
					s => { return s.hits; } ));	// Sort by hits to prevent attacking massive ramparts/walls forever
				if (target != null) {
					if (creep.attack(target) == ERR_NOT_IN_RANGE) {
						creep.moveTo(target);					
					}
					return;
				}
			}
        } 
	},

    Archer: function(creep, destroyStructures, listTargets) {
		if (creep.memory.room != null && creep.room.name != creep.memory.room) {
            _Creep.moveToRoom(creep, creep.memory.room);
        }
        else {
			for (let t in listTargets) {
				let target = Game.getObjectById(listTargets[t]);				
				if (target != null) {
					if (creep.rangedAttack(target) == ERR_NOT_IN_RANGE)
						creep.moveTo(target);
					creep.heal(creep);
					return;
				}
			}
			
            let allTargets = creep.room.find(FIND_HOSTILE_CREEPS, { filter: (c) => { 
                    return Memory["allies"].indexOf(c.owner.username) < 0; }});
            let nearTargets = creep.pos.findInRange(allTargets, 3);
            
            if (nearTargets.length == 0) {
                if (allTargets.length > 0) {
                    moveTo(allTargets[0]);
					return;
                } else if (creep.hits < creep.hitsMax) {
					creep.heal(creep);
					return;
				}
            } else if (nearTargets.length > 2) {
                creep.rangedMassAttack();
				return;
            } else if (nearTargets.length > 0) {
                creep.rangedAttack(nearTargets[0]);
                if (creep.pos.getRangeTo(nearTargets[0]) < 2) {
                    _Creep.moveFrom(creep, nearTargets[0]);
                }
				return;
            }
        } 
	},

    Healer: function(creep) {
		if (creep.memory.room != null && creep.room.name != creep.memory.room) {
            _Creep.moveToRoom(creep, creep.memory.room);
        }
        else {
			let wounded = creep.pos.findClosestByRange(FIND_MY_CREEPS, { filter: 
				c => { return c.hits < c.hitsMax; }});
			
			if (wounded != null && creep.heal(wounded) == ERR_NOT_IN_RANGE) {                
				creep.rangedHeal(wounded);
				creep.moveTo(wounded);
				return;
			} else if (creep.hits < creep.hitsMax) {
				creep.heal(creep)
			}			 
        } 
	},
};