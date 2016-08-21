var _Tasks = {

    addTask: function (rmName, incTask) {
        /* Task format:
            type:       combat | work | mine | carry | energy
            subtype:    pickup | withdraw | deposit | harvest | upgrade | repair | dismantle | attack | defend | heal            
            priority:   on a scale of 1-10; only competes with tasks of same type
            structure:  link | storage
            resource:   energy | mineral
            id:         target gameobject id
            pos:        room position
            timer:      run for x ticks
            goal:       e.g. hp goal for repairing, amount to deposit, etc.
            creeps:     maximum # of creeps to run this task
         */

        var index = Object.keys(Memory['hive']['rooms'][rmName]['tasks']).length;
        Memory['hive']['rooms'][rmName]['tasks'][index] = incTask;
        },

    giveTask: function(creep, task) {
        for (var t in Memory['hive']['rooms'][creep.room.name]['tasks']) {
            if (Memory['hive']['rooms'][creep.room.name]['tasks'][t] == task) {
                creep.memory.task = Memory['hive']['rooms'][creep.room.name]['tasks'][t];
                
                if (Memory['hive']['rooms'][creep.room.name]['tasks'][t]['creeps'] != null) {
                    Memory['hive']['rooms'][creep.room.name]['tasks'][t]['creeps'] -= 1;
                    if (Memory['hive']['rooms'][creep.room.name]['tasks'][t]['creeps'] == 0) {
                        delete Memory['hive']['rooms'][creep.room.name]['tasks'][t];
                    }
                }
                
                return;
            }
        }
        },

    returnTask: function(creep, task) {
        task.creeps = 1;
        _Tasks.addTask(creep.room.name, task);
        },

    compileTasks: function (rmName) {
        var __Colony = require('__colony');
        var room = Game.rooms[rmName];

        /* Worker-based tasks (upgrading controllers, building and maintaining structures) */
        if (room.controller != null && room.controller.level > 0) {
            if (room.controller.ticksToDowngrade < 3500) {
                _Tasks.addTask(rmName, 
                    {   type: 'work',
                        subtype: 'upgrade',
                        id: room.controller.id,
                        pos: room.controller.pos,
                        timer: 20,
                        creeps: 15,
                        priority: 1
                    });
            } else {
                _Tasks.addTask(rmName, 
                    {   type: 'work',
                        subtype: 'upgrade',
                        id: room.controller.id,
                        pos: room.controller.pos,
                        timer: 20,
                        creeps: 15,
                        priority: 5
                    });
            }
        }
        
        var structures = __Colony.findByNeed_RepairCritical(room);
        for (var i in structures) {
            _Tasks.addTask(rmName, 
                {   type: 'work',
                    subtype: 'repair',
                    id: structures[i].id,
                    pos: structures[i].pos,
                    timer: 20,
                    creeps: 2,
                    priority: 2
                });                
        }
        
        var structures = __Colony.findByNeed_RepairMaintenance(room);
        for (var i in structures) {
            _Tasks.addTask(rmName, 
                {   type: 'work',
                    subtype: 'repair',
                    id: structures[i].id,
                    pos: structures[i].pos,
                    timer: 20,
                    creeps: 2,
                    priority: 6
                });
        }
        
        structures = room.find(FIND_CONSTRUCTION_SITES);
        for (var i in structures) {
            _Tasks.addTask(rmName, 
                {   type: 'work',
                    subtype: 'build',
                    id: structures[i].id,
                    pos: structures[i].pos,
                    timer: 30,
                    creeps: 3,
                    priority: 3
                });            
        }

        /* Carrier-based tasks & energy supply for workers) */
        var piles = room.find(FIND_DROPPED_ENERGY);
        for (var i in piles) {
            _Tasks.addTask(rmName, 
                {   type: 'carry',
                    subtype: 'pickup',
                    resource: piles[i].resourceType == 'energy' ? 'energy' : 'mineral',
                    id: piles[i].id,
                    pos: piles[i].pos,
                    timer: 10, 
                    creeps: 1,
                    priority: piles[i].resourceType == 'energy' ? 2 : 1,
                });
        }

        var sources = room.find(FIND_SOURCES, { filter: function (s) { return s.energy > 0; }});
        for (var i in sources) {
            _Tasks.addTask(rmName, 
                {   type: 'mine',
                    subtype: 'harvest',
                    resource: 'energy',
                    id: sources[i].id,
                    pos: sources[i].pos,
                    timer: 15,
                    creeps: 2,
                    priority: 1
                });
        }

        var minerals = room.find(FIND_MINERALS, { filter: function (m) { return m.mineralAmount > 0; }});
        for (var i in minerals) {
            var look = minerals[i].pos.look();
            for (var l = 0; l < look.length; l++) {
                if (look[l].structure != null && look[l].structure.structureType == 'extractor') {
                    _Tasks.addTask(rmName, 
                        {   type: 'mine',
                            subtype: 'harvest',
                            resource: 'mineral',
                            id: minerals[i].id,
                            pos: minerals[i].pos,
                            timer: 20,
                            creeps: 2,
                            priority: 2
                        }); 
                }
            }
        }

        var storages = room.find(FIND_STRUCTURES, { filter: function (s) { 
            return (s.structureType == STRUCTURE_STORAGE)
                || (s.structureType == STRUCTURE_CONTAINER); }});
        for (var i in storages) {            
            if (storages[i].store[RESOURCE_ENERGY] > 0) {
                _Tasks.addTask(rmName, 
                    {   type: 'energy',
                        subtype: 'withdraw',
                        structure: storages[i].structureType,
                        resource: 'energy',
                        id: storages[i].id,
                        pos: storages[i].pos,
                        timer: 5,
                        creeps: 8,
                        priority: 3
                    });
            }
            if (_.sum(storages[i].store) < storages[i].storeCapacity) {
                _Tasks.addTask(rmName, 
                    {   type: 'carry',
                        subtype: 'deposit',
                        structure: storages[i].structureType,
                        resource: 'energy',
                        id: storages[i].id,
                        pos: storages[i].pos,
                        timer: 20,
                        creeps: 8,
                        priority: 9
                    });
                _Tasks.addTask(rmName, 
                    {   type: 'carry',
                        subtype: 'deposit',
                        structure: storages[i].structureType,
                        resource: 'mineral',
                        id: storages[i].id,
                        pos: storages[i].pos,
                        timer: 20,
                        creeps: 8,
                        priority: 9
                    });     
            }
        } 

        if (Memory['hive']['rooms'][rmName]['links'] != null) {
            var links = Memory['hive']['rooms'][rmName]['links'];
            for (var l in links) {
                var link = Game.getObjectById(links[l]['id']);
                if (links[l]['role'] == 'send' && link != null && link.energy < link.energyCapacity * 0.9) {
                    _Tasks.addTask(rmName, 
                    {   type: 'carry',
                        subtype: 'deposit',
                        structure: 'link',
                        resource: 'energy',
                        id: links[l]['id'],
                        pos: link.pos,
                        timer: 20,
                        creeps: 1,
                        priority: 3
                     });
                } else if (links[l]['role'] == 'receive' && link != null && link.energy > 0) {
                    _Tasks.addTask(rmName, 
                    {   type: 'energy',
                        subtype: 'withdraw',
                        structure: 'link',
                        resource: 'energy',
                        id: links[l]['id'],
                        pos: link.pos,
                        timer: 5,
                        creeps: 2,
                        priority: 1
                    });
                }
            }
        }

        var towers = room.find(FIND_MY_STRUCTURES, { filter: function (s) {
            return s.structureType == STRUCTURE_TOWER; }});
        for (var i in towers) {
            if (towers[i].energy < towers[i].energyCapacity * 0.4) {
                _Tasks.addTask(rmName, 
                {   type: 'carry',
                    subtype: 'deposit',                    
                    resource: 'energy',
                    id: towers[i].id,
                    pos: towers[i].pos,
                    structure: towers[i].structureType,
                    timer: 20,
                    creeps: 1,
                    priority: 1 
                });
            } else if (towers[i].energy < towers[i].energyCapacity) {
                _Tasks.addTask(rmName, 
                {   type: 'carry',
                    subtype: 'deposit',
                    resource: 'energy',
                    id: towers[i].id,
                    pos: towers[i].pos,
                    structure: towers[i].structureType,
                    timer: 20,
                    creeps: 1,
                    priority: 5
                });
            }
        }

        var structures = room.find(FIND_MY_STRUCTURES, { filter: function (s) {
            return (s.structureType == STRUCTURE_SPAWN && s.energy < s.energyCapacity * 0.85)
                || (s.structureType == STRUCTURE_EXTENSION && s.energy < s.energyCapacity); }});
        for (var i in structures) {
                _Tasks.addTask(rmName, 
                {   type: 'carry',
                    subtype: 'deposit',
                    resource: 'energy',
                    id: structures[i].id,
                    pos: structures[i].pos,
                    structure: structures[i].structureType,
                    timer: 20,
                    creeps: 1,
                    priority: 2 
                });
        }

        /* Cycle through all creeps in the room- remove the task if it's already taken */
            for (var t = Object.keys(Memory['hive']['rooms'][rmName]['tasks']).length - 1; t >= 0 ; t--) {
                var task = Memory['hive']['rooms'][rmName]['tasks'][t];
                for (var c in Game.creeps) {
                    if (Game.creeps[c].room.name == rmName) {
                        var creep = Game.creeps[c];
                        if (creep.memory.task != null
                                && creep.memory.task.type == task.type && creep.memory.task.subtype == task.subtype
                                && creep.memory.task.id == task.id && creep.memory.task.structure == task.structure
                                && creep.memory.task.resource == task.resource) {
                            task.creeps -= 1;
                        }
                        if (task.creeps <= 0) {
                            delete Memory['hive']['rooms'][rmName]['tasks'][t];
                        }
                    }
                }
            }  
        },

    assignTask: function(creep, isRefueling) {
        if (creep.memory.task != null && Object.keys(creep.memory.task).length > 0) {            
            return;
        }

        switch (creep.memory.role) {
            default: 
                return;

            case 'multirole':
            case 'worker': 
                _Tasks.assignTask_Work(creep, isRefueling);
                return;

            case 'miner':
            case 'burrower':
            case 'carrier':                
                _Tasks.assignTask_Mine(creep, isRefueling);
                return;

            case 'extractor':
                _Tasks.assignTask_Extract(creep, isRefueling);
                return;
        }
        },

    assignTask_Work: function(creep, isRefueling) {
        var tasks;

        if (isRefueling) {            
            tasks = _.sortBy(_.sortBy(_.filter(Memory['hive']['rooms'][creep.room.name]['tasks'], 
                    function (t) { return t.type == 'energy'; }), 
                    function(t) { return creep.pos.getRangeTo(t.pos.x, t.pos.y); }), 
                    'priority');
            if (tasks.length > 0) {
                _Tasks.giveTask(creep, tasks[0]);
                return;
            }
                        
            tasks = _.sortBy(_.filter(Memory['hive']['rooms'][creep.room.name]['tasks'], 
                    function (t) { return t.subtype == 'pickup' && t.resource == 'energy'; }), 
                    function(t) { return creep.pos.getRangeTo(t.pos.x, t.pos.y); });
            if (tasks.length > 0) {
                _Tasks.giveTask(creep, tasks[0]);
                return;
            }

            tasks = _.sortBy(_.filter(Memory['hive']['rooms'][creep.room.name]['tasks'], 
                    function (t) { return t.type == 'mine' && t.resource == 'energy'; }), 
                    function(t) { return creep.pos.getRangeTo(t.pos.x, t.pos.y); });
            if (tasks.length > 0) {
                _Tasks.giveTask(creep, tasks[0]);
                return;
            }        
        } else {
            if (creep.memory.subrole == 'repairer') {
                tasks = _.sortBy(_.sortBy(_.filter(Memory['hive']['rooms'][creep.room.name]['tasks'], 
                        function (t) { return t.type == 'work' && t.subtype == 'repair'; }), 
                        function(t) { return creep.pos.getRangeTo(t.pos.x, t.pos.y); }),
                        'priority');
            }
            else if (creep.memory.subrole == 'upgrader') {
                tasks = _.sortBy(_.filter(Memory['hive']['rooms'][creep.room.name]['tasks'], function (t) { return t.type == 'work' && t.subtype == 'upgrade'; }), 'priority');
            }
            
            if (tasks == null || tasks.length == 0) {
                tasks = _.sortBy(_.sortBy(_.filter(Memory['hive']['rooms'][creep.room.name]['tasks'], 
                        function (t) { return t.type == 'work'; }), 
                        function(t) { return creep.pos.getRangeTo(t.pos.x, t.pos.y); }),
                        'priority');
            }

            if (tasks != null && tasks.length > 0) {
                _Tasks.giveTask(creep, tasks[0]);        
                return;
            }
        }
        },

    assignTask_Mine: function(creep, isRefueling) {
        var tasks;

        if (isRefueling) {
            if (creep.room.name != creep.memory.room) {
                var __Creep = require('__creep');
                __Creep.moveToRoom(creep, creep.memory.room, isRefueling);
                return;
            } 

            if (creep.memory.role == 'burrower') {
                tasks = _.sortBy(_.filter(Memory['hive']['rooms'][creep.room.name]['tasks'], 
                        function (t) { return t.type == 'mine' && t.resource == 'energy'; }), 
                        function(t) { return creep.pos.getRangeTo(t.pos.x, t.pos.y); });
                if (tasks.length > 0) {
                    _Tasks.giveTask(creep, tasks[0]);
                    return;                
                }
            }
            else if (creep.memory.role == 'miner' || creep.memory.role == 'carrier') {
                tasks = _.sortBy(_.sortBy(_.filter(Memory['hive']['rooms'][creep.room.name]['tasks'], 
                        function (t) { return (t.subtype == 'pickup' && t.resource == 'energy') || (t.type == 'energy' && t.structure != 'link'); }), 
                        function(t) { return creep.pos.getRangeTo(t.pos.x, t.pos.y); }),
                        'priority');
                if (tasks.length > 0) {
                    _Tasks.giveTask(creep, tasks[0]);
                    return;
                }

                if (creep.getActiveBodyparts('work') > 0) {
                    tasks = _.sortBy(_.filter(Memory['hive']['rooms'][creep.room.name]['tasks'], 
                        function (t) { return t.type == 'mine' && t.resource == 'energy'; }), 
                        function(t) { return creep.pos.getRangeTo(t.pos.x, t.pos.y); });
                    if (tasks.length > 0) {
                        _Tasks.giveTask(creep, tasks[0]);
                        return;
                    }
                }

                // If there is no energy to get... at least do something!
                if (creep.memory.task == null) {
                    creep.memory.state = 'delivering';
                    return;
                }
            }
        } else {
            if (creep.room.name != creep.memory.colony) {
                var __Creep = require('__creep');
                __Creep.moveToRoom(creep, creep.memory.colony, isRefueling);
                return;
            }

            tasks = _.sortBy(_.sortBy(_.filter(Memory['hive']['rooms'][creep.room.name]['tasks'], 
                    function (t) { return t.type == 'carry' && t.subtype == 'deposit' && t.resource == 'energy'; }), 
                    function(t) { return creep.pos.getRangeTo(t.pos.x, t.pos.y); }),
                    'priority');
            if (tasks.length > 0) {
                _Tasks.giveTask(creep, tasks[0]);
                return;
            }
        }
        },

    assignTask_Extract: function(creep, isRefueling) {
        var tasks;

        if (isRefueling) {
            if (creep.room.name != creep.memory.room) {
                var __Creep = require('__creep');
                __Creep.moveToRoom(creep, creep.memory.room, isRefueling);
                return;
            } 

            tasks = _.sortBy(_.filter(Memory['hive']['rooms'][creep.room.name]['tasks'], 
                function (t) { return t.type == 'mine' && t.resource == 'mineral'; }), 
                function(t) { return creep.pos.getRangeTo(t.pos.x, t.pos.y); });
            if (tasks.length > 0) {
                _Tasks.giveTask(creep, tasks[0]);
                return;
            }            

        } else {
            if (creep.room.name != creep.memory.colony) {
                var __Creep = require('__creep');
                __Creep.moveToRoom(creep, creep.memory.colony, isRefueling);
                return;
            }

            tasks = _.sortBy(_.filter(Memory['hive']['rooms'][creep.room.name]['tasks'], 
                    function (t) { return t.type == 'carry' && t.resource == 'mineral'; }), 
                    function(t) { return creep.pos.getRangeTo(t.pos.x, t.pos.y); });
            if (tasks.length > 0) {
                _Tasks.giveTask(creep, tasks[0]);
                return;
            }
        }
        },
}

module.exports = _Tasks;