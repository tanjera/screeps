let __Logs = {

	List: function() {
		console.log("List of functions: Storage()");
	},

    Storage: function() {        
		for (let i = 0; i < Object.keys(Game.rooms).length; i++) {
			let room = Game.rooms[Object.keys(Game.rooms)[i]];

			console.log(`<font color=\"#0001C8\">\t\t Storage Report: Tick # ${Game.time} </font>`);
			
			if (room.storage != null) {
				if (_.sum(room.storage) == 0) {
					console.log(`${room.name} storage: empty`);
				} else {
					let output = `${room.name} storage: `;
					for (let res in room.storage.store) {						
						output += `${res}: ${_.floor(room.storage.store[res] / 1000)}k \t\t`;
					}
					console.log(output);
				}
			}

			if (room.terminal != null) {
				if (_.sum(room.terminal) == 0) {
					console.log(`${room.name} terminal: empty`);
				} else {
					let output = `${room.name} terminal: `;
					for (let res in room.terminal.store) {
						output += `${res} x ${_.floor(room.terminal.store[res] / 1000)}k \t\t`;						
					}
					console.log(output);
				}
			}            
        }
    }
}

module.exports = __Logs;
