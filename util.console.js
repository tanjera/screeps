module.exports = {
	Init: function() {
		let command_list = new Array();

		command_list.push("profiler.run(cycles)");
		command_list.push("profiler.stop()");
		
		
		command_list.push("");
		command_list.push("allies.add(ally)");
		
		allies = new Object()
		allies.add = function(ally) {
			Memory["allies"].push(ally);
			return `<font color=\"#D3FFA3\">[Console]</font> Player ${ally} added to ally list.`
		};

		command_list.push("allies.add_list([ally1, ally2, ...])");

		allies.add_list = function(allyList) {
			Array.prototype.push.apply(Memory["allies"], allyList);
			return `<font color=\"#D3FFA3\">[Console]</font> Players added to ally list.`
		};

		command_list.push("allies.remove(ally)");
		
		allies.remove = function(ally) {
			Memory["allies"].pop(ally);
			return `<font color=\"#D3FFA3\">[Console]</font> Player ${ally} removed from ally list.`
		};

		command_list.push("allies.clear()");
		allies.clear = function() {
			Memory["allies"] = [];
			return `<font color=\"#D3FFA3\">[Console]</font> Ally list cleared.`
		};


		blueprint = new Object();
		command_list.push("");
		command_list.push("blueprint.request(room_name)");

		blueprint.request = function(room) {
			Memory["pulses"]["blueprint"]["request"] = room;
			return `<font color=\"#D3FFA3\">[Console]</font> Setting Blueprint() request for ${room}; Blueprint() will run this request next tick.`;
		};

		command_list.push("blueprint.reset()");
		blueprint.reset = function() {
			delete Memory.pulses.blueprint;
			return `<font color=\"#D3FFA3\">[Console]</font> Resetting Blueprint() cycles; Blueprint() will initiate next tick.`;
		};


		command_list.push("");
		command_list.push("log.labs()");
		
		log = new Object();
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
			_.each(_.sortBy(_.sortBy(_.filter(Game.rooms, 
					r => { return r.controller != null && r.controller.my; }), 
					r => { return -r.controller.progress; }), 
					r => { return -r.controller.level; }), r => {
				output += `<tr><td><font color=\"#D3FFA3\">${r.name}:</font>  (${r.controller.level})  </td> `
					+ `<td>${r.controller.progress}  </td><td>  /  </td><td>${r.controller.progressTotal}    </td> `
					+ `<td>(${(r.controller.progress / r.controller.progressTotal * 100).toFixed()} %)</td></tr>`;
			});
			console.log(`${output}</table>`);
			return "<font color=\"#D3FFA3\">[Console]</font> Report generated";
		};


		command_list.push("");
		command_list.push("resources.stockpile.set(rmName, resource, amount)");

		resources = new Object()
		resources.stockpile = new Object();

		resources.stockpile.set = function (rmName, resource, amount) {
			if (amount < 1) {
				delete Memory.rooms[rmName].stockpile[resource];
				return `<font color=\"#D3FFA3\">[Console]</font> Memory.rooms[${rmName}].stockpile[${resource}] deleted`;
			} else {
				Memory.rooms[rmName].stockpile[resource] = amount;
				return `<font color=\"#D3FFA3\">[Console]</font> Memory.rooms[${rmName}].stockpile[${resource}] = ${amount}`;
			}
		};

		command_list.push("resources.stockpile.log()");

		resources.stockpile.log = function() {
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

		command_list.push("resources.stockpile.reset()");

		resources.stockpile.reset = function() {
			_.each(Memory["rooms"], r => { _.set(r, ["stockpile"], new Object()); });
			return "<font color=\"#D3FFA3\">[Console]</font> All Memory.rooms.[r].stockpile reset!";
		};

		command_list.push("resources.lab_target(mineral, amount, priority)");

		resources.lab_target = function(mineral, amount, priority) {
			if (Memory["labs"] == null) Memory["labs"] = {};
			if (Memory["labs"]["targets"] == null) Memory["labs"]["targets"] = {};
			Memory["labs"]["targets"][mineral] = { mineral: mineral, amount: amount, priority: priority };
		};
		
		command_list.push("resources.to_overflow(cap_amount)");

		resources.to_overflow = function(amount) {
			if (Memory["resources"] == null) Memory["resources"] = {};
			Memory["resources"]["to_overflow"] = amount;
		};

		command_list.push("resources.to_market(resource, cap_amount)");

		resources.to_market = function(resource, amount) {
			if (Memory["resources"] == null) Memory["resources"] = {};
			if (Memory["resources"]["to_market"] == null) Memory["resources"]["to_market"] = {};
			Memory["resources"]["to_market"][resource] = amount;
		};

		command_list.push("resources.send(order_name, room_from, room_to, resource, amount)");

		resources.send = function(order_name, room_from, room_to, resource, amount) {
			if (Memory["terminal_orders"] == null) Memory["terminal_orders"] = {};			
			Memory["terminal_orders"][order_name] = { room: room_to, from: room_from, resource: resource, amount: amount, priority: 1};	
		};

		command_list.push("resources.market_sell(order_name, market_order_id, room_from, amount)");

		resources.market_sell = function(order_name, market_order_id, room_from, amount) {
			if (Memory["terminal_orders"] == null) Memory["terminal_orders"] = {};			
			Memory["terminal_orders"][order_name] = { market_id: market_order_id, amount: amount, from: room_from, priority: 4};
			
		};

		command_list.push("resources.market_buy(order_name, market_order_id, room_to, amount)");

		resources.market_buy = function(order_name, market_order_id, room_to, amount) {
			if (Memory["terminal_orders"] == null) Memory["terminal_orders"] = {};			
			Memory["terminal_orders"][order_name] = { market_id: market_order_id, amount: amount, to: room_to, priority: 4};
		};


		command_list.push("");
		command_list.push("colonize(rmFrom, rmTarget, {origin: {x: baseX, y: baseY}, name: layoutName}, [listRoute])");

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
		command_list.push("spawn_assist(rmToAssist, [listRooms], [listRoute])");
		spawn_assist = function(rmToAssist, listRooms, listRoute) {
			_.set(Memory, ["rooms", rmToAssist, "spawn_assist"], { rooms: listRooms, route: listRoute });
			return `<font color=\"#D3FFA3\">[Console]</font> Spawn assist added to Memory.rooms.${rmToAssist}.spawn_assist ... to cancel, delete the entry.`;
		};

		command_list.push("remote_mining(rmHarvest, rmColony, hasKeepers, [listRoute], [listSpawnAssistRooms], [listPopulation])");
		remote_mining = function(rmHarvest, rmColony, hasKeepers, listRoute, listSpawnAssistRooms, listPopulation) {
			_.set(Memory, ["remote_mining", rmHarvest], { colony: rmColony, has_keepers: hasKeepers, route: listRoute, spawn_assist: listSpawnAssistRooms, population: listPopulation});
			return `<font color=\"#D3FFA3\">[Console]</font> Remote mining added to Memory.remote_mining.${rmHarvest} ... to cancel, delete the entry.`;
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
		
		command_list.push("");

		commands = function() {
			console.log(`<font color=\"#D3FFA3\">Command list:</font> <br>${command_list.join("<br>")}`);
			return "<font color=\"#D3FFA3\">[Console]</font> Command list complete";
		};
	}
};