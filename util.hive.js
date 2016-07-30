var utilHive = {


    resetSpawnRequests: function() {   // Reset the memory for spawn requests
        if (Memory['hive'] == null) {
            Memory['hive'] = {};
        }

        Memory['hive']['spawn_requests'] = {};   
    },


    processSpawnRequests: function() {
        var listRequests = Object.keys(Memory['hive']['spawn_requests']).sort(function(a, b) { 
            return Memory['hive']['spawn_requests'][a].priority - Memory['hive']['spawn_requests'][b].priority; } );
		
        var listSpawns = Object.keys(Game['spawns']).filter(function(a) { return Game['spawns'][a].spawning == null; });

        for (var r = 0; r < listRequests.length; r++) {
            for (var s = 0; s < listSpawns.length; s++) {
                if (listSpawns[s] != null && listRequests[r] != null
                        && Game.map.getRoomLinearDistance(Game['spawns'][listSpawns[s]].room.name, listRequests[r].room) <= listRequests[r].distance) {
                    
                    var result = Game['spawns'][listSpawns[s]].createCreep(listRequests[r].body, listRequests[r].name, listRequests[r].args);

                    if (_.isString(result)) {
                        listSpawns[s] = null;
                        listRequests[r] = null;
                    }
                }
            }
        }
	}
};

module.exports = utilHive;
