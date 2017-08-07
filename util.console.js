module.exports = {
	Init: function() {
		let command_list = new Array();

		command_list.push("profiler.run(cycles)");
		command_list.push("profiler.stop()");
		command_list.push("");

		

		log = new Object();

		command_list.push("log.labs()");
		
		log.labs = function() {
			let output = "<font color=\"#D3FFA3\">[Console]</font> Lab Report<br>"
				+ "<table><tr><th>Room \t</th><th>Mineral \t</th><th>Amount \t</th><th>Target Amount \t</th><th>Reagent #1 \t</th><th>Reagent #2</th></tr>";
			
			_.each(_.keys(_.get(Memory, ["labs", "reactions"])), r => {
				let rxn = Memory.labs.reactions[r];
				
				let amount = 0;
				_.each(_.filter(Game.rooms, 
					r => { return r.controller != null && r.controller.my && (r.storage || r.terminal); }), 
					r => { amount += r.store(_.get(rxn, "mineral")); });
				
				let reagents = "";
				_.each(getReagents(_.get(rxn, "mineral")), 
					reagent => { 
					
					let r_amount = 0;
					_.each(_.filter(Game.rooms, 
						r => { return r.controller != null && r.controller.my && (r.storage || r.terminal); }), 
						r => { r_amount += r.store(reagent); });					
					reagents += `<td>${reagent}: \t${r_amount}</td>` ;
				});
				
				output += `<tr><td>${r}</td><td>${_.get(rxn, "mineral")}</td><td>${amount}</td><td>(${_.get(rxn, "amount")})${reagents}</tr>`
			});
			
			console.log(`${output}</table>`);
			return "<font color=\"#D3FFA3\">[Console]</font> Report generated";
		};
		
		command_list.push("log.resources()");
		
		log.resources = function(resource = null, limit = 1) {
			let resource_list = resource != null ? [ resource ] : RESOURCES_ALL;
			let room_list = _.filter(Game.rooms, r => { return r.controller != null && r.controller.my && (r.storage || r.terminal); });
			
			let output = `<font color=\"#FFF"><tr><th>Resource\t</th><th>Total \t\t</th>`;
			_.each(room_list, r => { output += `<th><font color=\"#${r.terminal ? "5DB65B" : "B65B5B"}\">${r.name}</font> \t</th>`; });
			
			_.each(resource_list, res => {				
				let amount = 0;
				let output_rooms = "";
				
				_.each(room_list, r => {
					let a = r.store(res);
					amount += a;
					output_rooms += `<td>${a}</td>`
				});

				if (amount >= limit)
					output += `<tr><td>${res}</td><td>${amount}</td> ${output_rooms} </tr>`;									
			});
			
			console.log(`<font color=\"#D3FFA3">log.resources</font> <table>${output}</table>`);
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

		command_list.push("log.controllers()");

		log.controllers = function() {
			console.log("<font color=\"#D3FFA3\">[Console]</font> Room Controllers:");
			let output = "<table>"
			_.each(_.filter(Game.rooms, r => { return r.controller != null && r.controller.my; }), r => {				
				output += `<tr><td><font color=\"#D3FFA3\">${r.name}:</font>  (${r.controller.level})  </td> `
					+ `<td>${r.controller.progress}  </td><td>  /  </td><td>${r.controller.progressTotal}    </td> `
					+ `<td>(${(r.controller.progress / r.controller.progressTotal * 100).toFixed()} %)</td></tr>`;
			});
			console.log(`${output}</table>`);
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


		command_list.push("");
		command_list.push("colonize(rmFrom, rmTarget, layout, [listRoute])");

		colonize = function(rmFrom, rmTarget, layout, listRoute) {
			_.set(Memory, ["colonization_requests", rmTarget], { from: rmFrom, target: rmTarget, layout: layout, listRoute: listRoute });
			return `<font color=\"#D3FFA3\">[Console]</font> Colonization request added to Memory.colonization_requests.${rmTarget} ... to cancel, delete the entry.`;
		};

		command_list.push("invade(rmFrom, rmInvade, toOccupy, listSpawnRooms, listArmy, listTargets, posRally, listRoute)");

		invade = function(rmColony, rmInvade, toOccupy, listSpawnRooms, listArmy, listTargets, posRally, listRoute) {
			_.set(Memory, ["invasion_requests", rmTarget], { from: rmColony, target: rmInvade, occupy: toOccupy, 
				spawn_assist: listSpawnRooms, army: listArmy, targets: listTargets, rally_point: posRally, route: listRoute });
			return `<font color=\"#D3FFA3\">[Console]</font> Invasion request added to Memory.invasion_requests.${rmTarget} ... to cancel, delete the entry.`;
		};

		command_list.push("occupy(rmFrom, rmInvade, listSpawnRooms, listArmy, listTargets, listRoute)");

		occupy = function(rmColony, rmOccupy, listSpawnRooms, listArmy, listTargets, listRoute) {
			_.set(Memory, ["occupation_requests", rmTarget], { from: rmColony, target: rmOccupy,
				spawn_assist: listSpawnRooms, army: listArmy, targets: listTargets, route: listRoute });
			return `<font color=\"#D3FFA3\">[Console]</font> Occupation request added to Memory.invasion_requests.${rmTarget} ... to cancel, delete the entry.`;
		};
		

		command_list.push("");
		command_list.push("create_road(room_name, start_x, start_y, end_x, end_y)");

		create_road = function(room_name, start_x, start_y, end_x, end_y) {
			let room = Game.rooms[room_name];
			if (room == null)
				return `<font color=\"#D3FFA3\">[Console]</font> Error, ${room_name} not found.`;
			
			let from = new RoomPosition(start_x, start_y, room_name);
			let to = new RoomPosition(end_x, end_y, room_name);
			let path = room.findPath(from, to, {ignoreCreeps: true});			
			for (let i = 0; i < path.length; i++)
				room.createConstructionSite(path[i].x, path[i].y, "road");
			room.createConstructionSite(start_x, start_y, "road");
			room.createConstructionSite(end_x, end_y, "road");
			
			return `<font color=\"#D3FFA3\">[Console]</font> Construction sites placed in ${room_name} for road from (${start_x}, ${start_y}) to (${end_x}, ${end_y}).`;
		};
		

		commands = function() {
			console.log(`<font color=\"#D3FFA3\">Command list:</font> <br>${command_list.join("<br>")}`);
			return "<font color=\"#D3FFA3\">[Console]</font> Command list complete";
		};
	}
};