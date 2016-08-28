var __Logs = {

    Resources: function() {        
		for (var i = 0; i < Object.keys(Game.rooms).length; i++) {
			var room = Game.rooms[Object.keys(Game.rooms)[i]];

			console.log("<font color=\"#0001C8\">STORAGE REPORT: Tick #" + Game.time + "</font>");
			
			if (room.storage != null) {
				if (_.sum(room.storage) == 0) {
					console.log(room.name + " storage: empty.")
				} else {
					var output = room.name + " storage: ";
					for (var r = 0; r < Object.keys(room.storage.store).length; r++) {
						var res = Object.keys(room.storage.store)[r];
						if (room.storage.store[res] != 0) {
							output += res + " x " + _.floor(room.storage.store[res] / 1000) + "k;     ";
						}
					}
					console.log(output);
				}
			}

			if (room.terminal != null) {
				if (_.sum(room.terminal) == 0) {
					console.log(room.name + " terminal: empty.")
				} else {
					var output = room.name + " terminal: ";
					for (var r = 0; r < Object.keys(room.terminal.store).length; r++) {
						var res = Object.keys(room.terminal.store)[r];
						if (room.terminal.store[res] != 0) {
							output += res + " x " + _.floor(room.terminal.store[res] / 1000) + "k;     ";
						}
					}
					console.log(output);
				}
			}            
        }
    }
}

module.exports = __Logs;
