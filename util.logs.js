module.exports = {

    Resources: function() {
		let color = "#D3FFA3";
        console.log(`<font color=\"${color}">*** Storage Report: Tick # ${Game.time} ***</font>`);
        
		for (let i = 0; i < Object.keys(Game.rooms).length; i++) {
			let room = Game.rooms[Object.keys(Game.rooms)[i]];
			if (room.storage != null) {
				if (_.sum(room.storage) == 0) {
					console.log(`${room.name} storage: empty`);
				} else {
					let output = `<font color=\"${color}\">${room.name}</font> storage: `;
					for (let res in room.storage.store) {						
						output += `<font color=\"${color}\">${res}</font>: ${_.floor(room.storage.store[res] / 1000)}k;  `;
					}
					console.log(output);
				}
			}

			if (room.terminal != null) {
				if (_.sum(room.terminal) == 0) {
					console.log(`${room.name} terminal: empty`);
				} else {
					let output = `<font color=\"${color}\">${room.name}</font> terminal: `;
					for (let res in room.terminal.store) {
						output += `<font color=\"${color}\">${res}</font>: ${_.floor(room.terminal.store[res] / 1000)}k;  `;
					}
					console.log(output);
				}
			}            
        }
    },
	
	Stockpile: function() {
		let color = "#D3FFA3";
        console.log(`<font color=\"${color}">*** Stockpile Report: Tick # ${Game.time} ***</font>`);
        
		for (var r in Memory["rooms"]) {						
			if (Memory["rooms"][r]["stockpile"] == null || Object.keys(Memory["rooms"][r]["stockpile"]).length == 0)
				continue;
				
			let output = `<font color=\"${color}\">${r}</font>: `;
			
			for (var res in Memory["rooms"][r]["stockpile"]) {
				output += `<font color=\"${color}\">${res}</font>: ${Memory["rooms"][r]["stockpile"][res]};  `;
			}
			
			console.log(output);
        }
    }
};