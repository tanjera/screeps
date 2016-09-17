module.exports = {
	Init: function() {
		log_resources = function() {
			let resources = new Object();
			let resource_list = [ 
				"energy",
				"H", "O", "U", "L", "K", "Z", "X", "G", 
				"OH", "ZK", "UL", 
				"UH", "UO", "KH", "KO", "LH", "LO", "ZH", "ZO", "GH", "GO",
				"UH2O", "UHO2", "KH2O", "KHO2", "LH2O", "LHO2", "ZH2O", "ZHO2", "GH2O", "GHO2",
				"XUH2O", "XUHO2", "XKH2O", "XKHO2", "XLH2O", "XLHO2", "XZH2O", "XZHO2", "XGH2O", "XGHO2" ];
					
			for (let i in resource_list) {
				let res = resource_list[i];
				for (let r in Game.rooms) {
					let room = Game.rooms[r];
					
					if (room.storage != null) {				
						if (room.storage.store[res] != null && room.storage.store[res] > 0) {
							if (resources[res] == null) 
								resources[res] = {};					
							
							resources[res][r] = { amount: room.storage.store[res] };
						}
					}
					
					if (room.terminal != null) {
						if (room.terminal.store[res] != null && room.terminal.store[res] > 0) {
							if (resources[res] == null) 
								resources[res] = {};
							
							if (resources[res][r] == null)
								resources[res][r] = { amount: room.terminal.store[res] };
							else
								resources[res][r]["amount"] += room.terminal.store[res];
						}
					}
				}
			}
					
			for (let res in resources) {
				let output = `<font color=\"#D3FFA3">log-resources: ${res}</font><br>`;
				for (let r in resources[res]) { 
					output += `${r}: ${resources[res][r]["amount"]} <br>`; 
				}
				console.log(output);
			}
			return "<font color=\"#D3FFA3\">[Console]</font> Report generated";
		}
		
		log_storage = function() {		
			console.log(`<font color=\"#D3FFA3">log-storage</font>`);
			
			for (let i = 0; i < Object.keys(Game.rooms).length; i++) {
				let room = Game.rooms[Object.keys(Game.rooms)[i]];
				if (room.storage != null) {
					if (_.sum(room.storage) == 0) {
						console.log(`${room.name} storage: empty`);
					} else {
						let output = `<font color=\"#D3FFA3\">${room.name}</font> storage (${parseInt(_.sum(room.storage.store) / room.storage.storeCapacity * 100)}%): `;
						for (let res in room.storage.store) {
							if (room.storage.store[res] > 0)
								output += `<font color=\"#D3FFA3\">${res}</font>: ${_.floor(room.storage.store[res] / 1000)}k;  `;
						}
						console.log(output);
					}
				}

				if (room.terminal != null) {
					if (_.sum(room.terminal) == 0) {
						console.log(`${room.name} terminal: empty`);
					} else {
						let output = `<font color=\"#D3FFA3\">${room.name}</font> terminal (${parseInt(_.sum(room.terminal.store) / room.terminal.storeCapacity * 100)}%): `;
						for (let res in room.terminal.store) {
							if (room.terminal.store[res] > 0)
								output += `<font color=\"#D3FFA3\">${res}</font>: ${_.floor(room.terminal.store[res] / 1000)}k;  `;
						}
						console.log(output);
					}
				}            
			}
			return "<font color=\"#D3FFA3\">[Console]</font> Report generated";
		}
		
		stockpile = function (rmName, resource, amount) {
			if (amount < 1) {
				delete Memory.rooms.rmName.stockpile.resource;
				return `<font color=\"#D3FFA3\">[Console]</font> Memory.rooms.${rmName}.stockpile.${resource} deleted`;
			} else {
				Memory.rooms.rmName.stockpile.resource = amount;
				return `<font color=\"#D3FFA3\">[Console]</font> Memory.rooms.${rmName}.stockpile.${resource} = amount`;
			}
		}
		
		log_stockpile = function() {
			console.log(`<font color=\"#D3FFA3">log-stockpile</font>`);
			
			for (var r in Memory["rooms"]) {						
				if (Memory["rooms"][r]["stockpile"] == null || Object.keys(Memory["rooms"][r]["stockpile"]).length == 0)
					continue;
					
				let output = `<font color=\"#D3FFA3\">${r}</font>: `;
				
				for (var res in Memory["rooms"][r]["stockpile"]) {
					output += `<font color=\"#D3FFA3\">${res}</font>: ${Memory["rooms"][r]["stockpile"][res]};  `;
				}
				
				console.log(output);
			}
			return "<font color=\"#D3FFA3\">[Console]</font> Report generated";
		}
		
		reset_stockpiles = function() {
			Memory["terminal_orders"] = new Object();
			for (var r in Memory["rooms"]) {
				Memory["rooms"][r]["stockpile"] = new Object();
			}
			
			return "<font color=\"#D3FFA3\">[Console]</font> All Memory.rooms.[r].stockpile reset!";					
		}		
	}
};