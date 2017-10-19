module.exports = {

	Run: function() {
        // Periodically reset to remove unused keys or interval data
        if (Game.time % 100 == 0) {
        _.each(Game.rooms, room => {
            if (room.controller != null && room.controller.my)
                _.set(Memory, ["stats", "colonies", room.name, "population"], new Object()); });
        }
        
        if (Game.time % 500 == 0) {
            _.set(Memory, "stats", new Object());
        }


        _.set(Memory, ["stats", "cpu", "tick"], Game.time);
        _.set(Memory, ["stats", "cpu", "bucket"], Game.cpu.bucket);
        _.set(Memory, ["stats", "cpu", "used"], Game.cpu.getUsed());

        if (Game.time % 5 == 0) {
            _.set(Memory, ["stats", "gcl", "level"], Game.gcl.level);
            _.set(Memory, ["stats", "gcl", "progress"], Game.gcl.progress);
            _.set(Memory, ["stats", "gcl", "progress_total"], Game.gcl.progressTotal);
            _.set(Memory, ["stats", "gcl", "progress_percent"], (Game.gcl.progress / Game.gcl.progressTotal * 100));
            
            _.set(Memory, ["stats", "creeps", "total"], _.keys(Game.creeps).length);

            _.each(_.get(Game, "spawns"), s => { 
                _.set(Memory, ["stats", "colonies", s.room.name, "spawns", s.name], 
                    s.spawning == null ? 0 : 1); 
            });
        }

        if (Game.time % 50 == 0) {
            let colonies = new Object;
            _.set(Memory, ["stats", "resources"], new Object());
            _.each(Game.rooms, room => {
                if (room.controller != null && room.controller.my) {
                    _.set(Memory, ["stats", "colonies", room.name, "rcl", "level"], room.controller.level);
                    _.set(Memory, ["stats", "colonies", room.name, "rcl", "progress"], room.controller.progress);
                    _.set(Memory, ["stats", "colonies", room.name, "rcl", "progress_total"], room.controller.progressTotal);
                    _.set(Memory, ["stats", "colonies", room.name, "rcl", "progress_percent"], (room.controller.progress / room.controller.progressTotal * 100));
                    
                    let storage = _.get(Game, ["rooms", room.name, "storage"]);
                    let terminal = _.get(Game, ["rooms", room.name, "terminal"]);
                    _.set(Memory, ["stats", "colonies", room.name, "storage", "store"], _.get(storage, "store"));
                    _.set(Memory, ["stats", "colonies", room.name, "terminal", "store"], _.get(terminal, "store"));
                    for (let res in _.get(storage, "store"))
                        _.set(Memory, ["stats", "resources", res], 
                            _.get(Memory, ["stats", "resources", res], 0) 
                            + _.get(storage, ["store", res], 0) 
                            + _.get(terminal, ["store", res], 0));
                }
            });
        }
    }
};