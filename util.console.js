module.exports = {
	Init: function() {
		let command_list = new Array();

		command_list.push("blueprint.set(rmName)");
		command_list.push("blueprint.set_all()");
		command_list.push("blueprint.construct(rmName)");
		command_list.push("blueprint.construct_all()");
		command_list.push("");

		command_list.push("profiler.run(cycles)");
		command_list.push("profiler.stop()");
		command_list.push("");



		command_list.push("log.resources()");

		log = new Object();

		log.resources = function(resource = null, limit = 100) {
			let resource_list = resource != null
				? [ resource ]
				: [ "energy",
					"H", "O", "U", "L", "K", "Z", "X", "G",
					"OH", "ZK", "UL",
					"UH", "UO", "KH", "KO", "LH", "LO", "ZH", "ZO", "GH", "GO",
					"UH2O", "UHO2", "KH2O", "KHO2", "LH2O", "LHO2", "ZH2O", "ZHO2", "GH2O", "GHO2",
					"XUH2O", "XUHO2", "XKH2O", "XKHO2", "XLH2O", "XLHO2", "XZH2O", "XZHO2", "XGH2O", "XGHO2" ];

			_.each(resource_list, res => {
				let output = "";

				_.each(_.filter(Game.rooms, r => { return r.controller != null && r.controller.my; }), r => {
					let amount = _.get(r, ["storage", "store", res], 0) + _.get(r, ["terminal", "store", res], 0);
					if (amount >= limit)
						output += `${r.name}: ${amount} <br>`;
				});

				if (output != "")
					console.log(`<font color=\"#D3FFA3">log-resources: ${res}</font><br>` + output);
			});
			return "<font color=\"#D3FFA3\">[Console]</font> Report generated";
		};

		command_list.push("log.room_list()");

		log.room_list = function() {
			return `["${String(Object.keys(Game.rooms)).replace(/[,]/g, "\", \"")}"]`;
		};

		command_list.push("log.storage()");

		log.storage = function() {
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
		};

		command_list.push("log.can_build()");

		log.can_build = function() {
			let rooms = _.filter(Game.rooms, n => { return n.controller != null && n.controller.my; });
			console.log("<font color=\"#D3FFA3\">[Console]</font> Buildable structures:");
			for (let r in rooms) {
				room = rooms[r];

				let output = `${room.name}: `;
				for (let s in CONTROLLER_STRUCTURES) {
					if (s == "road" || s == "constructedWall" || s == "rampart")
						continue;

					let amount = CONTROLLER_STRUCTURES[s][room.controller.level]
						- room.find(FIND_STRUCTURES, { filter: t => { return t.structureType == s; }}).length;
					output += amount < 1 ? "" : `${amount} x ${s};  `;
				}
				console.log(output);
			}
			return "<font color=\"#D3FFA3\">[Console]</font> Report generated";
		};

		command_list.push("log.nukers()");

		log.nukers = function() {
			console.log("<font color=\"#D3FFA3\">[Console]</font> Nukers:");
			_.each(_.filter(Game.rooms, r => { return r.controller != null && r.controller.my; }), r => {
				let nuker = _.head(r.find(FIND_STRUCTURES, { filter: (s) => { return s.structureType == "nuker"; } }));
				if (nuker != null) {
					console.log(`<font color=\"#D3FFA3\">${r.name}:</font> `
						+ `<font color=\"#${nuker.cooldown == 0 ? "47FF3E" : "FF3E3E"}\">`
							+ `cooldown: ${nuker.cooldown};</font>  `
						+ `<font color=\"#${nuker.energy == nuker.energyCapacity ? "47FF3E" : "FF3E3E"}\">`
							+ `energy: ${nuker.energy} (${parseFloat(nuker.energy / nuker.energyCapacity * 100).toFixed(0)}%);</font>  `
						+ `<font color=\"#${nuker.ghodium == nuker.ghodiumCapacity ? "47FF3E" : "FF3E3E"}\">`
							+ `ghodium: ${nuker.ghodium} (${parseFloat(nuker.ghodium / nuker.ghodiumCapacity * 100).toFixed(0)}%)</font>`);
				}
			});
			return "<font color=\"#D3FFA3\">[Console]</font> Report generated";
		};


		command_list.push("");
		command_list.push("stockpile.set(rmName, resource, amount)");

		stockpile = new Object();
		stockpile.set = function (rmName, resource, amount) {
			if (amount < 1) {
				delete Memory.rooms[rmName].stockpile[resource];
				return `<font color=\"#D3FFA3\">[Console]</font> Memory.rooms[${rmName}].stockpile[${resource}] deleted`;
			} else {
				Memory.rooms[rmName].stockpile[resource] = amount;
				return `<font color=\"#D3FFA3\">[Console]</font> Memory.rooms[${rmName}].stockpile[${resource}] = ${amount}`;
			}
		};

		command_list.push("stockpile.log()");

		stockpile.log = function() {
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
		};

		command_list.push("stockpile.reset()");

		stockpile.reset = function() {
			_.each(Memory["rooms"], r => { _.set(r, ["stockpile"], new Object()); });
			return "<font color=\"#D3FFA3\">[Console]</font> All Memory.rooms.[r].stockpile reset!";
		};


		commands = function() {
			console.log(`<font color=\"#D3FFA3\">Command list:</font> <br>${command_list.join("<br>")}`);
			return "<font color=\"#D3FFA3\">[Console]</font> Command list complete";
		};
	}
};