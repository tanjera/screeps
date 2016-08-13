var utilTasks = {

    CreateRoomMemory: function (rmName) {
        if (Memory['hive']['rooms'][rmName] == null) {
            Memory['hive']['rooms'][rmName] = {};
        }

        if (Memory['hive']['rooms'][rmName]['tasks'] == null) {
            Memory['hive']['rooms'][rmName]['tasks'] = {};
        }
    },

    List_AddTask: function (rmName, task) {
        /* Task format:
            type:       pickup | withdraw | deposit | harvest | upgrade | repair | dismantle | attack | heal
            subtype:    link | storage
            priority:   1-20... need to make a list...
            resource:   energy | mineral
            id:         target gameobject id
            timer:      run for x ticks
            goal:       e.g. hp goal for repairing, amount to deposit, etc.
            creeps:     maximum # of creeps to run this task
         */
    },

    CompileTasks: function (rmName) {
        utilTasks.CreateRoomMemory(rmName);
        utilTasks.CompileTasks_Energy(rmName);
        utilTasks.CompileTasks_Colony(rmName);

        //TO-DO: Factor in worker tasks (build, repair, upgrade)  

        // Then sort based on priority...
    },


    CompileTasks_Colony: function (rmName) {
        if (Memory['hive']['rooms'][rmName]['links'] != null) {
            var links = Memory['hive']['rooms'][rmName]['links'];
            for (var l = 0; l < links.length; l++) {
                var link = Game.getObjectById(links[l]['id']);
                if (links[l]['role'] == 'send' && link != null && link.energy < link.energyCapacity * 0.9) {
                    utilTasks.List_AddTask(rmName, 
                    {   type: 'deposit',
                        subtype: 'link',
                        resource: 'energy',
                        id: links[l]['id'],
                        timer: 5,
                        creeps: 1
                     });
                    return;
                } else if (links[l]['role'] == 'receive' && link != null && link.energy > 0) {
                    utilTasks.List_AddTask(rmName, 
                    {   type: 'withdraw',
                        subtype: 'link',
                        resource: 'energy',
                        id: links[l]['id'],
                        timer: 5,
                        creeps: 1 
                    });
                }
            }
        }
    },


    CompileTasks_Energy: function (rmName) {
        var room = Game.rooms[rmName];
        
        var piles = room.find(FIND_DROPPED_ENERGY);
        for (var i = 0; i < piles.length; i++) {
            utilTasks.List_AddTask(rmName, 
                {   type: 'pickup',
                    resource: piles[i].resourceType == 'energy' ? 'energy' : 'mineral',
                    id: piles[i].id,
                    timer: 5, 
                    creeps: 1
                });
        }

        var storages = room.find(FIND_STRUCTURES, { filter: function (s) { 
            return (s.structureType == STRUCTURE_STORAGE && s.store[RESOURCE_ENERGY] > 0)
                || (s.structureType == STRUCTURE_CONTAINER && s.store[RESOURCE_ENERGY] > 0); }});
        for (var i = 0; i < storages.length; i++) {
            utilTasks.List_AddTask(rmName, 
                {   type: 'withdraw',
                    resource: 'energy',
                    id: storages[i].id,
                    timer: 5,
                    goal: storages[i].store['energy']
                });
        } 

        var sources = room.find(FIND_SOURCES, { filter: function (s) { return s.energy > 0; }});
        for (var i = 0; i < sources.length; i++) {
            utilTasks.List_AddTask(rmName, 
                {   type: 'harvest',
                    resource: 'energy',
                    id: sources[i].id,
                    timer: 5,
                    goal: sources[i].energy
                });
        }

        var minerals = room.find(FIND_MINERALS, { filter: function (m) { return m.mineralAmount > 0; }});
        for (var i = 0; i < minerals.length; i++) {
            var look = minerals[i].pos.look();
            for (var l = 0; l < look.length; l++) {
                if (look[l].structure != null && look[l].structure.structureType == 'extractor') {
                    utilTasks.List_AddTask(rmName, 
                        {   type: 'harvest',
                            resource: 'mineral',
                            id: minerals[i].id,
                            timer: 5,
                            goal: minerals[i].mineralAmount
                        }); 
                }
            }
        }
    }
}

module.exports = utilTasks;
