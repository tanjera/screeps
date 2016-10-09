module.exports = {
	Init: function() {
		profiler = new Object();
		profiler.run = function(cycles) {
			Memory["profiler"]["cycles"] = (cycles == null) ? 1 : cycles;
			Memory["profiler"]["status"] = "on";
			return "<font color=\"#D3FFA3\">[CPU]</font> Profiler started"
		};
		
		profiler.stop = function() {
			Memory["profiler"]["cycles"] = 0;
			return "<font color=\"#D3FFA3\">[CPU]</font> Profiler stopped"
		};
		
		if (Memory["profiler"] == null) 
			Memory["profiler"] = new Object();
		
		if (Memory["profiler"]["status"] == null)
			Memory["profiler"]["status"] = "off";
		
		if (Memory["profiler"]["status"] != "on")
			return;
		
		if (Memory["profiler"]["cycles"] == null)
			Memory["profiler"]["cycles"] = 0;
		else
			Memory["profiler"]["cycles"] -= 1;
		
		if (Memory["profiler"]["current"] == null)
			Memory["profiler"]["current"] = new Object();
	},
	
	Start: function(room, name) {
		if (Memory["profiler"]["status"] != "on")
			return;
		
		let cycle = Memory["profiler"]["cycles"];
		
		if (Memory["profiler"]["current"][room] == null)
			Memory["profiler"]["current"][room] = new Object();
		
		if (Memory["profiler"]["current"][room][name] == null)
			Memory["profiler"]["current"][room][name] = new Object();
		
		if (Memory["profiler"]["current"][room][name][cycle] == null)
			Memory["profiler"]["current"][room][name][cycle] = new Object();
		
		Memory["profiler"]["current"][room][name][cycle]["start"] = Game.cpu.getUsed();
	},

	End: function(room, name) {
		if (Memory["profiler"]["status"] != "on")
			return;
		
		let cycle = Memory["profiler"]["cycles"];		
		Memory["profiler"]["current"][room][name][cycle]["used"] = Game.cpu.getUsed() - Memory["profiler"]["current"][room][name][cycle]["start"];
	},
	
	Finish: function() {
		if (Memory["profiler"]["status"] != "on")
			return;		
		
		if (Memory["profiler"]["cycles"] <= 0) {			
			for (let r in Memory["profiler"]["current"]) {
				let output = "";
				let room_used = 0, room_cycles = 0;
				
				for (let n in Memory["profiler"]["current"][r]) {					
					let used = 0;
					let cycles = Object.keys(Memory["profiler"]["current"][r][n]).length;					
					_.forEach(Memory["profiler"]["current"][r][n], c => { used += c["used"]; } );
					output += `<br>(${parseFloat(used).toFixed(2)} / ${cycles}) : \t ${parseFloat(used / cycles).toFixed(2)} \t ${n}`;
					
					room_used += used;
					if (typeof(room_cycles) != Number)
						room_cycles = 0;					
					room_cycles = Math.max(room_cycles, cycles);
				}
				
				console.log(`<font color=\"#D3FFA3">CPU report for ${r}</font> :: `
					+ `${parseFloat(room_used).toFixed(2)} : `
					+ `<font color=\"#D3FFA3">${parseFloat(room_used / room_cycles).toFixed(2)}</font> ${output}`);
			}			
			
			Memory["profiler"]["status"] = "off";			
			Memory["profiler"]["current"] = new Object();	// Wipe for the next use			
		} else if (Memory["profiler"]["cycles"] % 5 == 0) {
			console.log(`<font color=\"#D3FFA3\">[CPU]</font> Profiler running, ${Memory["profiler"]["cycles"]} ticks remaining.`);
		}
	}
};