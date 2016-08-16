var utilCreep = {

    getBody: function(type, level) {
        switch (type) {
            case 'soldier': return utilCreep.getBody_Soldier(level);
            case 'archer': return utilCreep.getBody_Archer(level);
            case 'healer': return utilCreep.getBody_Healer(level);
            case 'multirole': return utilCreep.getBody_Multirole(level); 
            case 'worker': return utilCreep.getBody_Worker(level);
            case 'burrower': return utilCreep.getBody_Burrower(level);
            case 'carrier': return utilCreep.getBody_Carrier(level);
            case 'reserver': return utilCreep.getBody_Reserver(level);
        }
    },

    getBody_Soldier: function(level) {
        switch (level) {
            case 1:
                return [ // 190 energy, 1x TOUGH, 1x ATTACK, 2x MOVE
                        TOUGH, MOVE,   
                        MOVE, ATTACK]; 
            case 2:
                return [ // 380 energy, 2x TOUGH, 2x ATTACK, 4x MOVE
                        TOUGH, TOUGH, MOVE, MOVE,
                        MOVE, ATTACK, MOVE, ATTACK]; 
            case 3:
                return [ // 570 energy, 3x TOUGH, 3x ATTACK, 6x MOVE
                        TOUGH, TOUGH, TOUGH, MOVE, MOVE, MOVE, 
                        MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK]; 
            case 4:
                return [ // 950 energy, 5x TOUGH, 5x ATTACK, 10x MOVE
                        TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, MOVE, MOVE, MOVE, MOVE, MOVE, 
                        MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK];
            case 5:
                return [ // 1390 energy, 8x TOUGH, 7x ATTACK, 15x MOVE
                        TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH,  
                        MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE,
                        MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK, 
                        MOVE, ATTACK, MOVE, ATTACK]; 
            case 6:
                return [ // 1720 energy, 10x TOUGH, 8x ATTACK, 18x MOVE
                        TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH,
                        MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE,
                        MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK, 
                        MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK];
            case 7:
                return [ // 3250 energy, 25x MOVE, 25x ATTACK
                        MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK, 
                        MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK,
                        MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK,
                        MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK,
                        MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK];
            case 8:
                return [ // 3250 energy, 25x MOVE, 25x ATTACK
                        MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK, 
                        MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK,
                        MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK,
                        MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK,
                        MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK];
        }
    },

    getBody_Archer: function(level) {
        switch (level) {
            case 1:
                return [ // 260 energy, 1x TOUGH, 1x RANGED_ATTACK, 2x MOVE
                        TOUGH, 
                        MOVE, MOVE, 
                        RANGED_ATTACK]; 
            case 2:
                return [ // 460 energy, 1x TOUGH, 2x RANGED_ATTACK, 3x MOVE
                        TOUGH, 
                        MOVE, MOVE, MOVE, 
                        RANGED_ATTACK, RANGED_ATTACK]; 
            case 3:
                return [ // 720 energy, 2x TOUGH, 3x RANGED_ATTACK, 5x MOVE
                        TOUGH, TOUGH, 
                        MOVE, MOVE, MOVE, MOVE, MOVE, 
                        RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK]; 
            case 4:
                return [ // 1120 energy, 2x TOUGH, 5x RANGED_ATTACK, 7x MOVE
                        TOUGH, TOUGH, 
                        MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, 
                        RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK];
            case 5:
                return [ // 1580 energy, 2x TOUGH, 5x RANGED_ATTACK, 7x MOVE
                        TOUGH, TOUGH, TOUGH,  
                        MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE,
                        RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK]; 
            case 6:
                return [ // 2020 energy, 7x TOUGH, 8x RANGED_ATTACK, 15x MOVE
                        TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, 
                        MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, 
                        MOVE, MOVE, MOVE, MOVE, MOVE,
                        RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK];
            case 7:
                return [ // 4000 energy, 20x RANGED_ATTACK, 20x MOVE                                                 
                        MOVE, RANGED_ATTACK, MOVE, RANGED_ATTACK, MOVE, RANGED_ATTACK, MOVE, RANGED_ATTACK, MOVE, RANGED_ATTACK, 
                        MOVE, RANGED_ATTACK, MOVE, RANGED_ATTACK, MOVE, RANGED_ATTACK, MOVE, RANGED_ATTACK, MOVE, RANGED_ATTACK, 
                        MOVE, RANGED_ATTACK, MOVE, RANGED_ATTACK, MOVE, RANGED_ATTACK, MOVE, RANGED_ATTACK, MOVE, RANGED_ATTACK, 
                        MOVE, RANGED_ATTACK, MOVE, RANGED_ATTACK, MOVE, RANGED_ATTACK, MOVE, RANGED_ATTACK, MOVE, RANGED_ATTACK];
            case 8:
                return [ // 5000 energy, 25x RANGED_ATTACK, 25x MOVE
                        MOVE, RANGED_ATTACK, MOVE, RANGED_ATTACK, MOVE, RANGED_ATTACK, MOVE, RANGED_ATTACK, MOVE, RANGED_ATTACK, 
                        MOVE, RANGED_ATTACK, MOVE, RANGED_ATTACK, MOVE, RANGED_ATTACK, MOVE, RANGED_ATTACK, MOVE, RANGED_ATTACK, 
                        MOVE, RANGED_ATTACK, MOVE, RANGED_ATTACK, MOVE, RANGED_ATTACK, MOVE, RANGED_ATTACK, MOVE, RANGED_ATTACK,
                        MOVE, RANGED_ATTACK, MOVE, RANGED_ATTACK, MOVE, RANGED_ATTACK, MOVE, RANGED_ATTACK, MOVE, RANGED_ATTACK,  
                        MOVE, RANGED_ATTACK, MOVE, RANGED_ATTACK, MOVE, RANGED_ATTACK, MOVE, RANGED_ATTACK, MOVE, RANGED_ATTACK];
        }
    },
    
    getBody_Healer: function(level) {
        switch (level) {
            case 1:
            case 2:
                return [ // 300 energy, 1x HEAL, 1x MOVE
                        MOVE, HEAL];  
            case 3:
                return [ // 600 energy, 2x HEAL, 2x MOVE
                        MOVE, MOVE, 
                        HEAL, HEAL]; 
            case 4:
                return [ // 1200 energy, 4x HEAL, 4x MOVE
                        MOVE, MOVE, MOVE, MOVE,
                        HEAL, HEAL, HEAL, HEAL]; 
            case 5:
                return [ // 1500 energy, 5x HEAL, 5x MOVE
                        MOVE, MOVE, MOVE, MOVE, MOVE,
                        HEAL, HEAL, HEAL, HEAL, HEAL]; 
            case 6:
                return [ // 2100 energy, 7x HEAL, 7x MOVE
                        MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE,
                        HEAL, HEAL, HEAL, HEAL, HEAL, HEAL, HEAL]; 
            case 7:
                return [ // 4500 energy, 15x HEAL, 15x MOVE
                        MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE,
                        MOVE, MOVE, MOVE, MOVE, MOVE,
                        HEAL, HEAL, HEAL, HEAL, HEAL, HEAL, HEAL, HEAL, HEAL, HEAL,
                        HEAL, HEAL, HEAL, HEAL, HEAL]; 
            case 8:
                return [ // 6000 energy, 20x HEAL, 20x MOVE
                        MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE,
                        MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE,
                        HEAL, HEAL, HEAL, HEAL, HEAL, HEAL, HEAL, HEAL, HEAL, HEAL,
                        HEAL, HEAL, HEAL, HEAL, HEAL, HEAL, HEAL, HEAL, HEAL, HEAL]; 
        }
    },

    getBody_Multirole: function(level) {
        switch (level) {
            case 1:
                return [ // 280 energy, 1x WORK, 1x CARRY, 1x MOVE, 1x ATTACK
                        WORK, CARRY,   
                        MOVE, 
                        ATTACK]; 
            case 2:
                return [ // 430 energy, 1x WORK, 2x CARRY, 3x MOVE, 1x ATTACK 
                        WORK, CARRY, CARRY,   
                        MOVE, MOVE, MOVE, 
                        ATTACK]; 
            case 3:
                return [ // 730 energy, 2x WORK, 3x CARRY, 6x MOVE, 1x ATTACK 
                        WORK, WORK, CARRY, CARRY, CARRY,    
                        MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, 
                        ATTACK]; 
            case 4:
                return [ // 1110 energy, 3x WORK, 5x CARRY, 8x MOVE, 2x ATTACK 
                        WORK, WORK, WORK, 
                        CARRY, CARRY, CARRY, CARRY, CARRY,    
                        MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, 
                        ATTACK, ATTACK];
            case 5:
                return [ // 1620 energy, 4x WORK, 6x CARRY, 12x MOVE, 4x ATTACK 
                        WORK, WORK, WORK, WORK,
                        CARRY, CARRY, CARRY, CARRY, CARRY, CARRY,    
                        MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE,
                        MOVE, MOVE, 
                        ATTACK, ATTACK, ATTACK, ATTACK]; 
            case 6:
                return [ // 2020 energy, 6x WORK, 8x CARRY, 14x MOVE, 4x ATTACK 
                        WORK, WORK, WORK, WORK, WORK, WORK,
                        CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY,    
                        MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE,
                        MOVE, MOVE, MOVE, MOVE,  
                        ATTACK, ATTACK, ATTACK, ATTACK];
            case 7:
                return [ // 3100 energy, 6x WORK, 10x CARRY, 24x MOVE, 10x ATTACK 
                        WORK, WORK, WORK, WORK, WORK, WORK, 
                        CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY,    
                        MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE,
                        MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE,
                        MOVE, MOVE, MOVE, MOVE,
                        ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK];
            case 8:
                return [ // 3100 energy, 6x WORK, 10x CARRY, 24x MOVE, 10x ATTACK 
                        WORK, WORK, WORK, WORK, WORK, WORK, 
                        CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY,    
                        MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE,
                        MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE,
                        MOVE, MOVE, MOVE, MOVE,
                        ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK];
        }
    },

    getBody_Worker: function(level) {
        switch (level) {
            case 1:
                return [ // 300 energy, 1x WORK, 2x CARRY, 2x MOVE
                        WORK,  
                        CARRY, CARRY, 
                        MOVE, MOVE]; 
            case 2:
                return [ // 450 energy, 1x WORK, 4x CARRY, 5x MOVE
                        WORK,  
                        CARRY, CARRY, CARRY,  
                        MOVE, MOVE, MOVE, MOVE]; 
            case 3:
                return [ // 700 energy, 3x WORK, 4x CARRY, 4x MOVE
                        WORK, WORK, WORK,
                        CARRY, CARRY, CARRY, CARRY, 
                        MOVE, MOVE, MOVE, MOVE,];
            case 4:
                return [ // 1100 energy, 5x WORK, 6x CARRY, 6x MOVE
                        WORK, WORK, WORK, WORK, WORK,
                        CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, 
                        MOVE, MOVE, MOVE, MOVE, MOVE, MOVE];
            case 5:
                return [ // 1600 energy, 8x WORK, 8x CARRY, 8x MOVE
                        WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, 
                        CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, 
                        MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE]; 
            case 6:
                return [ // 2000 energy, 10x WORK, 10x CARRY, 10x MOVE
                        WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, 
                        CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, 
                        MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE];
            case 7:
                return [ // 3100 energy, 16x WORK, 13x CARRY, 17x MOVE
                        WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, 
                        WORK, WORK, WORK, WORK, WORK, WORK,  
                        CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, 
                        CARRY, CARRY, CARRY,
                        MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE,
                        MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE];
            case 8:
                return [ // 3500 energy, 20x WORK, 13x CARRY, 17 MOVE
                        WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, 
                        WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK,  
                        CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, 
                        CARRY, CARRY, CARRY,
                        MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE,
                        MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE];
        }
    },
    
    getBody_Burrower: function(level) {
				switch (level) {
            case 1:
                return [ // 300 energy, 2x WORK, 2x MOVE
                        WORK, MOVE, WORK, MOVE]; 
            case 2:
                return [ // 450 energy, 3x WORK, 3x MOVE
                        WORK, MOVE, WORK, MOVE, WORK, MOVE]; 
            case 3:
                return [ // 750 energy, 6x WORK, 3x MOVE
                        WORK, WORK, WORK, WORK, WORK, WORK,
                        MOVE, MOVE, MOVE];
            case 4:
                return [ // 1050 energy, 8x WORK, 5x MOVE
                        WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK,
                        MOVE, MOVE, MOVE, MOVE, MOVE];
            case 5:
                return [ // 1500 energy, 12x WORK, 7x MOVE
                        WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK,
                        WORK, WORK,
                        MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE]; 
            case 6:
                return [ // 1800 energy, 14x WORK, 8x MOVE
                        WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK,
                        WORK, WORK, WORK, WORK,
                        MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE]; 
            case 7:
                return [ // 3750 energy, 28x WORK, 19x MOVE
                        WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK,
                        WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK,
                        WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK,
                        MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE,
                        MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE];
            case 8:
                return [ // 4000 energy, 30x WORK, 20x MOVE
                        WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK,
                        WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK,
                        WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK,
                        MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE,
                        MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE];
        }
    },
    
    getBody_Carrier: function(level) {
        switch (level) {
            case 1:
            		return [ // 300 energy, 3x CARRY, 3x MOVE
                        CARRY, MOVE, CARRY, MOVE, CARRY, MOVE]; 
            case 2:
                return [ // 400 energy, 4x CARRY, 4x MOVE
                        CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE]; 
            case 3:
                return [ // 600 energy, 8x CARRY, 4x MOVE
                        CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY,  
                        MOVE, MOVE, MOVE, MOVE];
            case 4:
                return [ // 1000 energy, 13x CARRY, 7x MOVE
                        CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY,
                        CARRY, CARRY, CARRY,  
                        MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE];
            case 5:
                return [ // 1400 energy, 18x CARRY, 10x MOVE
                        CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY,
                        CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY,
                        MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE];
            case 6:
                return [ // 1800 energy, 24x CARRY, 12 MOVE
                        CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY,
                        CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY,
                        CARRY, CARRY, CARRY, CARRY,
                        MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE,
                        MOVE, MOVE];
            case 7:
                return [ // 2500 energy, 33x CARRY, 17x MOVE
                        CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY,
                        CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY,
                        CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY,
                        CARRY, CARRY, CARRY,
                        MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE,
                        MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE];
            case 8:
                return [ // 2500 energy, 33x CARRY, 17x MOVE
                        CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY,
                        CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY,
                        CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY,
                        CARRY, CARRY, CARRY,
                        MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE,
                        MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE];
        }
    },

    getBody_Reserver: function(level) {
        switch (level) {
            case 1:
            case 2:
                return null; 
            case 3:
            case 4:
                return [ // 650 energy, 1x CLAIM, 1x MOVE
                        CLAIM, MOVE];
            case 5:    
            case 6:
            case 7:
            case 8:
                return [ // 1300 energy, 2x CLAIM, 2x MOVE
                        CLAIM, CLAIM, MOVE, MOVE];
        }
    },

    moveFrom: function(creep, target) {
        var tgtDir = creep.pos.getDirectionTo(target);
        var moveDir;
        
        switch (tgtDir) {
            case TOP:           moveDir = BOTTOM;       break;
            case TOP_RIGHT:     moveDir = BOTTOM_LEFT;  break;
            case RIGHT:         moveDir = LEFT;         break;
            case BOTTOM_RIGHT:  moveDir = TOP_LEFT;     break;
            case BOTTOM:        moveDir = TOP;          break;
            case BOTTOM_LEFT:   moveDir = TOP_RIGHT;    break;
            case LEFT:          moveDir = RIGHT;        break;
            case TOP_LEFT:      moveDir = BOTTOM_RIGHT; break;
        }

        return creep.move(moveDir);
    },

    runTaskTimer: function(creep) {
        if (creep.memory.task == null) {
            return false;
        } 
        else if (creep.memory.task['timer'] != null) {
            // Process the task timer
            creep.memory.task['timer'] = creep.memory.task['timer'] - 1;
            if (creep.memory.task['timer'] <= 0) {
                delete creep.memory.task;
                return false;
            }
        }

        return true;
    },

    runTask: function(creep) {
        var _ticksReusePath = 8;
        
        switch (creep.memory.task['subtype']) {
            case 'pickup':
                var obj = Game.getObjectById(creep.memory.task['id']);
                if (creep.pickup(obj) == ERR_NOT_IN_RANGE) {
                    return creep.moveTo(obj, {reusePath: _ticksReusePath}) == ERR_NO_PATH
                        ? creep.moveTo(new RoomPosition(25, 25, obj.room.name)) : 1;
                } else {    // Action takes one tick... task complete... delete task...
                    delete creep.memory.task;
                    return;
                }

            case 'withdraw':
                var obj = Game.getObjectById(creep.memory.task['id']);
                if (creep.withdraw(obj, 'energy') == ERR_NOT_IN_RANGE) {
                    return creep.moveTo(obj, {reusePath: _ticksReusePath}) == ERR_NO_PATH
                        ? creep.moveTo(new RoomPosition(25, 25, obj.room.name)) : 1;
                } else {    // Action takes one tick... task complete... delete task...
                    delete creep.memory.task;
                    return;
                }

            case 'harvest':
                var obj = Game.getObjectById(creep.memory.task['id']);
                var result = creep.harvest(obj); 
                if (result == ERR_NOT_IN_RANGE || result == ERR_NOT_ENOUGH_RESOURCES) {
                    return creep.moveTo(obj, {reusePath: _ticksReusePath}) == ERR_NO_PATH
                        ? creep.moveTo(new RoomPosition(25, 25, obj.room.name)) : 1;
                } else if (result != OK) {
                    delete creep.memory.task;
                    return;
                } else { return; }

            case 'upgrade':
                var controller = Game.getObjectById(creep.memory.task['id']);
                var result = creep.upgradeController(controller); 
                if (result == ERR_NOT_IN_RANGE) {
                    return creep.moveTo(controller, {reusePath: _ticksReusePath}) == ERR_NO_PATH
                        ? creep.moveTo(new RoomPosition(25, 25, controller.room.name)) : 1;
                } else if (result != OK) {
                    delete creep.memory.task;
                    return;
                } else { return; }

            case 'repair':
                var structure = Game.getObjectById(creep.memory.task['id']);
                var result = creep.repair(structure); 
                if (result == ERR_NOT_IN_RANGE) {
                    return creep.moveTo(structure, {reusePath: _ticksReusePath}) == ERR_NO_PATH
                        ? creep.moveTo(new RoomPosition(25, 25, structure.room.name)) : 1;
                } else if (result != OK || structure.hits == structure.hitsMax) {
                    delete creep.memory.task;
                    return;
                } else { return; }
            
            case 'build':
                var structure = Game.getObjectById(creep.memory.task['id']);
                var result = creep.build(structure);
                if (result == ERR_NOT_IN_RANGE) {
                    return creep.moveTo(structure, {reusePath: _ticksReusePath}) == ERR_NO_PATH
                        ? creep.moveTo(new RoomPosition(25, 25, structure.room.name)) : 1;
                } else if (result != OK) {
                    delete creep.memory.task;
                    return;
                } else { return; }

            case 'deposit':
                // Make sure the target hasn't filled up...
                var target = Game.getObjectById(creep.memory.task['id']);
                if ((target.structureType == STRUCTURE_SPAWN && target.energy == target.energyCapacity)
                        || (target.structureType == STRUCTURE_EXTENSION && target.energy == target.energyCapacity)
                        || (target.structureType == STRUCTURE_LINK && target.energy == target.energyCapacity)
                        || (target.structureType == STRUCTURE_TOWER && target.energy == target.energyCapacity)
                        || (target.structureType == STRUCTURE_STORAGE && _.sum(target.store) == target.storeCapacity)
                        || (target.structureType == STRUCTURE_CONTAINER && _.sum(target.store) == target.storeCapacity)) {
                    var uTask = require('util.tasks');
                    uTask.assignTask(creep, false);
                }
                // Cycle through all resources and deposit, starting with minerals                
                for (var r = Object.keys(creep.carry).length; r > 0; r--) {
                    var resourceType = Object.keys(creep.carry)[r - 1];
                    if (target != null && creep.transfer(target, resourceType) == ERR_NOT_IN_RANGE) {
                        return creep.moveTo(target, {reusePath: _ticksReusePath}) == ERR_NO_PATH
                            ? creep.moveTo(new RoomPosition(25, 25, target.room.name)) : 1;
                    } else {
                        delete creep.memory.task;
                        return;
                    }
                }

        }
    },

    moveToRoom: function(creep, tgtRoom) {
        var _ticksReusePath = 10;
        
        if (creep.room.name == tgtRoom) {
            console.log('Error: trying to move creep ' + creep.name + ' to its own room... check logic!!!');
            return;
        } 
        
        if (creep.memory.route == null || creep.memory.route.length == 0 || creep.memory.route == ERR_NO_PATH 
                || creep.memory.route[0].room == creep.room.name || creep.memory.exit == null
                || creep.memory.exit.roomName != creep.room.name) {
            
            creep.memory.route = Game.map.findRoute(creep.room, tgtRoom);
            
            if (creep.memory.route == ERR_NO_PATH) {
                delete creep.memory.route;
                return;
            }
            
            creep.memory.exit = creep.pos.findClosestByPath(creep.memory.route[0].exit);
        }

        if (creep.memory.exit) {
            var r = creep.moveTo(new RoomPosition(creep.memory.exit.x, creep.memory.exit.y, creep.memory.exit.roomName), {reusePath: _ticksReusePath});
            
            if (r == ERR_NO_PATH) {
                delete creep.memory.route;
                delete creep.memory.exit;
            }
        }
    }
};

module.exports = utilCreep;
