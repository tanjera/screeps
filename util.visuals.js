module.exports = {

	Init: function() {
        if (_.get(Memory, ["hive", "visuals", "show_path"], false) == true)
            this.Show_Path();

        if (_.get(Memory, ["hive", "visuals", "show_repair"], false) == true) {
            this.Show_Repair();
            if (isPulse_Long() || _.keys(Memory.hive.visuals.repair_levels).length == 0)
                this.Compile_Repair();
        } else {
            _.set(Memory, ["hive", "visuals", "repair_levels"], null);
        }
    },

    Show_Path: function () {
        // Display pathfinding visuals
        _.each(_.keys(_.get(Memory, ["hive", "paths", "prefer", "rooms"])), r => {
            _.each(_.get(Memory, ["hive", "paths", "prefer", "rooms", r]), p => {
                new RoomVisual(r).circle(p, {fill: "green", stroke: "green", radius: 0.15, opacity: 0.25}); }); });        
        _.each(_.keys(_.get(Memory, ["hive", "paths", "avoid", "rooms"])), r => {
            _.each(_.get(Memory, ["hive", "paths", "avoid", "rooms", r]), p => {
                new RoomVisual(r).circle(p, {fill: "red", stroke: "red", radius: 0.15, opacity: 0.25}); }); });
        _.each(_.keys(_.get(Memory, ["hive", "paths", "exits", "rooms"])), r => {
            _.each(_.get(Memory, ["hive", "paths", "exits", "rooms", r]), p => {
                new RoomVisual(r).circle(p, {fill: "green", radius: 0.4, opacity: 0.25}); }); });
        _.each(_.keys(Memory.rooms), r => {
            if (_.get(Memory, ["rooms", r, "camp"]) != null)
                new RoomVisual(r).circle(_.get(Memory, ["rooms", r, "camp"]), 
                    {fill: "orange", stroke: "pink", radius: 0.3, opacity: 0.25});
        });
    },

    Show_Repair: function () {
        // Display repair levels for ramparts and walls
        _.each(_.get(Memory, ["hive", "visuals", "repair_levels"]), l => {
            if (_.get(l, ["pos", "roomName"]) != null && _.get(l, "percent") != null) {
                let percent = new String(l["percent"]);
                new RoomVisual(l["pos"]["roomName"]).text(
                    `${percent.substr(0, percent.indexOf('.'))}%`, 
                    l["pos"], {font: (percent < 80 ? 0.45 : 0.35), color: "white"});
               }
        });
    },

    Compile_Repair: function() {
        // Compile repair levels for ramparts and walls
        _.set(Memory, ["hive", "visuals", "repair_levels"], new Array());
        _.each(_.filter(Game.rooms, r => { return r.controller != null && r.controller.my }), r => {
            _.each(_.filter(r.find(FIND_STRUCTURES), 
                    s => { return s.structureType == "constructedWall" || s.structureType == "rampart"; }), w => {
                let p = w.hits / _.get(Memory, ["rooms", r.name, "structures", `${w.structureType}-${w.id}`, "targetHits"], r.getWallTarget()) * 100;
                Memory["hive"]["visuals"]["repair_levels"].push({pos: w.pos, percent: p});
            })
        });
    }
};
