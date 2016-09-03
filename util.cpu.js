module.exports = {

	Init: function() {
		if (Memory["options"]["profiler"] != "on")
			return;
		
		if (Memory["profiler"] == null) 
			Memory["profiler"] = new Object();
		
		Memory["profiler"]["current"] = new Object();
	},

	Start: function(room, name) {
		if (Memory["options"]["profiler"] != "on")
			return;
		
		if (Memory["profiler"]["current"][room] == null)
			Memory["profiler"]["current"][room] = new Object();
		
		if (Memory["profiler"]["current"][room][name] == null)
			Memory["profiler"]["current"][room][name] = new Object();
		
		Memory["profiler"]["current"][room][name]["start"] = Game.cpu.getUsed();
	},

	End: function(room, name) {
		if (Memory["options"]["profiler"] != "on")
			return;
		
		Memory["profiler"]["current"][room][name]["used"] = Game.cpu.getUsed() - Memory["profiler"]["current"][room][name]["start"];
	},
	
	Finish: function() {
		if (Memory["options"]["profiler"] != "on")
			return;
		
		let color = "#D3FFA3";
		
		for (let r in Memory["profiler"]["current"]) {
			let output = `<font color=\"${color}\">CPU report for ${r}</font>: `;
			
			for (let n in Memory["profiler"]["current"][r][n]) {
				output += `${n} ${Memory["profiler"]["current"][r][n]["used"]}`;
			}
			
			console.log(output);
		}
		
		Memory["options"]["profiler"] = "off";
	}
};