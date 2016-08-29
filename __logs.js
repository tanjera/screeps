let __Logs = {

    Storage: function() {
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
    }
}

module.exports = __Logs;
