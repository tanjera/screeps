module.exports = {
	
	Init: function() {
		profiler = new Object();
		profiler.run = function(cycles) {
			_.set(Memory, ["hive", "profiler", "cycles"], (cycles == null) ? 1 : cycles);
			_.set(Memory, ["hive", "profiler", "cycles_total"], (cycles == null) ? 1 : cycles);
			_.set(Memory, ["hive", "profiler", "status"], "on");
			return "<font color=\"#D3FFA3\">[CPU]</font> Profiler started"
		};
		
		profiler.stop = function() {
			_.set(Memory, ["hive", "profiler", "cycles"], 0);
			return "<font color=\"#D3FFA3\">[CPU]</font> Profiler stopped"
		};
		
		if (_.get(Memory, ["hive", "profiler"]) == null) 
			_.set(Memory, ["hive", "profiler"], new Object());
		
		if (_.get(Memory, ["hive", "profiler", "status"]) == null)
			_.set(Memory, ["hive", "profiler", "status"], "off");
		
		if (_.get(Memory, ["hive", "profiler", "status"]) != "on")
			return;
		
		if (_.get(Memory, ["hive", "profiler", "cycles"]) == null)
			_.set(Memory, ["hive", "profiler", "cycles"], 0);
		else
			_.set(Memory, ["hive", "profiler", "cycles"], 
				_.get(Memory, ["hive", "profiler", "cycles"]) - 1);
		
		if (_.get(Memory, ["hive", "profiler", "current"]) == null)
			_.set(Memory, ["hive", "profiler", "current"], new Object());
	},
	
	Start: function(room, name) {
		if (_.get(Memory, ["hive", "profiler", "status"]) != "on")
			return;
		
		_.set(Memory, ["hive", "profiler", "current", room, name, 
			_.get(Memory, ["hive", "profiler", "cycles"]), 
			"start"], Game.cpu.getUsed());
	},

	End: function(room, name) {
		if (_.get(Memory, ["hive", "profiler", "status"]) != "on")
			return;
		
		let cycle = Memory["profiler"]["cycles"];		
		_.set(Memory, ["hive", "profiler", "current", room, name, cycle, "used"], 
			Game.cpu.getUsed() - _.get(Memory, ["hive", "profiler", "current", room, name, cycle, "start"]));
	},
	
	Finish: function() {
		if (_.get(Memory, ["hive", "profiler", "status"]) != "on")
			return;		
		
		if (_.get(Memory, ["hive", "profiler", "cycles"]) <= 0) {	
			let total_cycles = _.get(Memory, ["hive", "profiler", "cycles_total"]);
			
			for (let r in _.get(Memory, ["hive", "profiler", "current"])) {
				let output = "";
				let room_used = 0, room_cycles = 0;				
				
				for (let n in _.get(Memory, ["hive", "profiler", "current", r])) {					
					let used = 0;
					let cycles = Object.keys(_.get(Memory, ["hive", "profiler", "current", r, n])).length;					
					_.forEach(_.get(Memory, ["hive", "profiler", "current", r, n]), c => { used += c["used"]; });
					used = ((used > 0 == true) ? used : 0);
					output += `<tr><td>(${parseFloat(used).toFixed(2)} / ${cycles})</td><td>${parseFloat(used / cycles).toFixed(2)}</td><td>${n}</td></tr>`;
					
					room_used += used;
					if (typeof(room_cycles) != Number)
						room_cycles = 0;					
					room_cycles = Math.max(room_cycles, cycles);
				}
				
				console.log(`<font color=\"#D3FFA3">CPU report for ${r} \n`
					+ `Room Total: ${parseFloat(room_used).toFixed(2)} : `
					+ `Room Mean: ${parseFloat(room_used / total_cycles).toFixed(2)}</font> `
					+ `<table><tr><th>Total / Cycles\t  </th><th>Mean\t  </th><th>Function</th></tr>`
					+ `${output}</table>`);
			}			
			
			_.set(Memory, ["hive", "profiler", "status"], "off");
			_.set(Memory, ["hive", "profiler", "current"], new Object());	// Wipe for the next use
		} else if (_.set(Memory, ["hive", "profiler", "cycles"]) % 5 == 0) {
			console.log(`<font color=\"#D3FFA3\">[CPU]</font> Profiler running, ${_.get(Memory, ["hive", "profiler", "cycles"])} ticks remaining.`);
		}
	}
};