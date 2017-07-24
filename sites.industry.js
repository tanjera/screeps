require("populations");

let Roles = require("roles");
let Hive = require("hive");
let Tasks = require("tasks");

let _Creep = require("util.creep");
let _CPU = require("util.cpu");

module.exports = {

	Run: function(rmColony, listSpawnRooms, listPopulation, listLabs) {

		/* For setting lab targets:
				Memory.labs.targets[""] = { mineral: "", amount: , priority: };

		 * For internal transfers:
				Memory["terminal_orders"][""] = { room: "", resource: "energy", amount: , priority: 1};
				Memory["terminal_orders"][""] = { room: "", resource: "", amount: , from: "", priority: 1};
		 * For market trading:
				Memory["terminal_orders"][""] = { market_id: "", amount: , from: "", priority: 4};
				Memory["terminal_orders"][""] = { market_id: "", amount: , to: "", priority: 4};
		*/

		_CPU.Start(rmColony, "Industry-listCreeps");
		let listCreeps = _.filter(Game.creeps, c => c.memory.room == rmColony);
		_CPU.End(rmColony, "Industry-listCreeps");

		if (Hive.isPulse_Spawn()) {
			_CPU.Start(rmColony, "Industry-runPopulation");
			this.runPopulation(rmColony, listCreeps, listSpawnRooms, listPopulation);
			_CPU.End(rmColony, "Industry-runPopulation");
		}

		_CPU.Start(rmColony, "Industry-runLabs");
		this.runLabs(rmColony, listLabs);
		_CPU.End(rmColony, "Industry-runLabs");

		if (Hive.isPulse_Main()) {
			_CPU.Start(rmColony, "Industry-loadNukers");
			this.loadNukers(rmColony);
			_CPU.End(rmColony, "Industry-loadNukers");

			_CPU.Start(rmColony, "Industry-createLabTasks");
			this.createLabTasks(rmColony, listLabs);
			_CPU.End(rmColony, "Industry-createLabTasks");

			_CPU.Start(rmColony, "Industry-runTerminal");
			this.runTerminal(rmColony);
			_CPU.End(rmColony, "Industry-runTerminal");
		}

		_CPU.Start(rmColony, "Industry-runCreeps");
		this.runCreeps(rmColony, listCreeps);
		_CPU.End(rmColony, "Industry-runCreeps");
	},


	runPopulation: function(rmColony, listCreeps, listSpawnRooms, listPopulation) {
		let lCourier  = _.filter(listCreeps, (c) => c.memory.role == "courier" && (c.ticksToLive == undefined || c.ticksToLive > 80));

		if (listPopulation == null)
			listPopulation = Population_Industry;

        let popTarget = (listPopulation["courier"] == null ? 0 : listPopulation["courier"]["amount"]);
        let popActual = lCourier.length;
        Hive.populationTally(rmColony, popTarget, popActual);

        if (listPopulation["courier"] != null && lCourier.length < listPopulation["courier"]["amount"]) {
			Memory["spawn_requests"].push({ room: rmColony, listRooms: listSpawnRooms, priority: 4, level: listPopulation["courier"]["level"],
				scale_level: listPopulation["courier"] == null ? true : listPopulation["courier"]["scale_level"],
				body: "courier", name: null, args: {role: "courier", room: rmColony} });
        }
	},

	loadNukers: function(rmColony) {
		let nuker = _.head(Game.rooms[rmColony].find(FIND_STRUCTURES, { filter: (s) => { return s.structureType == "nuker"; } }));
		let storage = Game.rooms[rmColony].storage;

		if (nuker == null || storage == null)
			return;

		if (nuker.energy < nuker.energyCapacity && _.get(storage, ["store", "energy"], 0) > 0) {
			Tasks.addTask(rmColony, {
				key: `industry:withdraw-energy-${storage.id}`, room: rmColony,
				type: "industry", subtype: "withdraw", resource: "energy",
				id: storage.id, pos: storage.pos, timer: 10, creeps: 8, priority: 5 });
			Tasks.addTask(rmColony, {
				key: `industry:deposit-energy-${nuker.id}`, room: rmColony,
				type: "industry", subtype: "deposit", resource: "energy",
				id: nuker.id, pos: nuker.pos, timer: 10, creeps: 8, priority: 5 });
		}

		if (nuker.ghodium < nuker.ghodiumCapacity) {
			if (_.get(Memory, ["rooms", rmColony, "stockpile", "G"]) == null)
				_.set(Memory, ["rooms", rmColony, "stockpile", "G"], 500)

			if (_.get(storage, ["store", "G"], 0) > 0) {
				Tasks.addTask(rmColony, {
					key: `industry:withdraw-G-${storage.id}`, room: rmColony,
					type: "industry", subtype: "withdraw", resource: "G",
					id: storage.id, pos: storage.pos, timer: 10, creeps: 8, priority: 5 });
				Tasks.addTask(rmColony, {
					key: `industry:deposit-G-${nuker.id}`, room: rmColony,
					type: "industry", subtype: "deposit", resource: "G",
					id: nuker.id, pos: nuker.pos, timer: 10, creeps: 8, priority: 5 });
			}
		}
	},

	assignReaction: function(rmColony) {
		let target = _.head(_.sortBy(_.sortBy(_.sortBy(_.filter(_.get(Memory, ["labs", "targets"]),
			t => {
				let amount = 0, r1_amount = 0, r2_amount = 0;
				let reagents = getReagents(_.get(t, "mineral"));
				_.each(_.filter(Game.rooms,
					r => { return r.controller != null && r.controller.my && r.terminal; }),
					r => {
						amount += r.store(_.get(t, "mineral"));
						r1_amount += r.store(reagents[0]);
						r2_amount += r.store(reagents[1]);
					});
				return (_.get(t, "amount") < 0 || amount < _.get(t, "amount")) && r1_amount >= 1000 && r2_amount >= 1000;
			}),
			t => _.get(t, "priority")),
			t => _.get(t, "is_reagent")),
			t => _.filter(_.get(Memory, ["labs", "reactions"]), r => { return _.get(r, "mineral") == _.get(t, "mineral"); }).length));

		if (target != null) {
			_.set(Memory, ["labs", "reactions", rmColony], { mineral: target.mineral, amount: target.amount });
			console.log(`<font color=\"#A17BFF\">[Labs]</font> Assigning ${rmColony} to create ${target.mineral}.`);
		} else {
			_.set(Memory, ["labs", "reactions", rmColony], { mineral: null, amount: null });
			console.log(`<font color=\"#A17BFF\">[Labs]</font> No reaction to assign to ${rmColony}, idling.`);
		}

	},

	runLabs: function(rmColony, listLabs) {
		/* Arguments for listLabs:
			{ action: "boost", mineral: "", lab: "", role: "", subrole: "" }
			{ action: "reaction", amount: -1, mineral: "",
			  supply1: "", supply2: "",
			  reactors: ["", "", ...] }
			{ action: "empty", labs: ["", "", ...] }
		*/

        for (let l in listLabs) {
            let listing = listLabs[l];
             switch (listing["action"]) {
                default:
                    break;

				case "boost":
					let lab = Game.getObjectById(listing["lab"]);
					let creeps = lab.pos.findInRange(FIND_MY_CREEPS, 1, { filter: (c) => { 
						return c.memory.role == listing["role"]
							&& c.memory.subrole == listing["subrole"]
							&& (listing["dest"] == null ? true : c.memory.room == listing["dest"])
							&& c.ticksToLive > 1100 && !c.isBoosted() }});

					if (creeps.length > 0) {
						lab.boostCreep(creeps[0]);
					}

					break;

                case "reaction":
					if (Hive.isPulse_Labs()) {
						this.assignReaction(rmColony);
					}

                    let labSupply1 = Game.getObjectById(listing["supply1"]);
                    let labSupply2 = Game.getObjectById(listing["supply2"]);

					if (labSupply1 == null && labSupply2 == null)
						break;

					let mineral = _.get(Memory, ["labs", "reactions", rmColony, "mineral"]);
					if (mineral == null)
						return;
					
					if (_.get(REACTIONS, [labSupply1.mineralType, labSupply2.mineralType]) != mineral)
						return;

					let amount = _.get(Memory, ["labs", "reactions", rmColony, "amount"], -1);
					if (amount > 0 && Game.rooms[rmColony].store(mineral) >= amount) {
						if (_.get(Memory, ["labs", "targets", mineral, "is_reagent"]))
							delete Memory.labs.targets[mineral];
						delete Memory.labs.reactions[rmColony];
						console.log(`<font color=\"#A17BFF\">[Labs]</font> ${rmColony} completed target for ${mineral}, re-assigning lab.`);

						if (Hive.isPulse_Main())
							this.assignReaction(rmColony);
						return;
					}

					_.forEach(listing["reactors"], r => {
						let labReactor = Game.getObjectById(r);
						if (labReactor != null)
							labReactor.runReaction(labSupply1, labSupply2);
					});

                    break;
             }
        }
	},

	createLabTasks: function(rmColony, listLabs) {
		/* Terminal task priorities:
		 * 2: emptying labs
		 * 3: filling labs
		 * 4: filling nuker
		 * 5: filling orders
		 * 6: emptying terminal
		 */

		for (let l in listLabs) {
			var lab, storage;
			let listing = listLabs[l];

			switch (listing["action"]) {
				default:
					break;

				case "boost":
					lab = Game.getObjectById(listing["lab"]);
					if (_.get(Memory, ["rooms", rmColony, "stockpile", listing["mineral"]]) == null)
						_.set(Memory, ["rooms", rmColony, "stockpile", listing["mineral"]], 1000)

					// Minimum amount necessary to boost 1x body part: 30 mineral & 20 energy
					if (lab.mineralType == listing["mineral"] && lab.mineralAmount > 30 && lab.energy > 20) {
						Tasks.addTask(rmColony, {
							key: `boost:boost-${listing["mineral"]}-${lab.id}`, room: rmColony, dest: listing["dest"],
							type: "boost", subtype: "boost", role: listing["role"], subrole: listing["subrole"],
							resource: listing["mineral"], id: lab.id, pos: lab.pos, timer: 10, creeps: 8, priority: 1 });
					}

					storage = Game.rooms[rmColony].storage;
					if (storage == null) break;

					if (lab.mineralType != null && lab.mineralType != listing["mineral"]) {
						Tasks.addTask(rmColony, {
							key: `industry:withdraw-${lab.mineralType}-${lab.id}`, room: rmColony,
							type: "industry", subtype: "withdraw", resource: lab.mineralType,
							id: lab.id, pos: lab.pos, timer: 10, creeps: 8, priority: 2 });
					} else if (lab.energy < lab.energyCapacity * 0.75 && storage.store["energy"] > 0) {
						Tasks.addTask(rmColony, {
							key: `industry:withdraw-energy-${storage.id}`, room: rmColony,
							type: "industry", subtype: "withdraw", resource: "energy",
							id: storage.id, pos: storage.pos, timer: 10, creeps: 8, priority: 3 });
						Tasks.addTask(rmColony, {
							key: `industry:deposit-energy-${lab.id}`, room: rmColony,
							type: "industry", subtype: "deposit", resource: "energy",
							id: lab.id, pos: lab.pos, timer: 10, creeps: 8, priority: 3 });
					} else if (lab.mineralAmount < lab.mineralCapacity * 0.75 && Object.keys(storage.store).includes(listing["mineral"])) {
						Tasks.addTask(rmColony, {
							key: `industry:withdraw-${listing["mineral"]}-${storage.id}`, room: rmColony,
							type: "industry", subtype: "withdraw", resource: listing["mineral"],
							id: storage.id, pos: storage.pos, timer: 10, creeps: 8, priority: 3 });
						Tasks.addTask(rmColony, {
							key: `industry:deposit-${listing["mineral"]}-${lab.id}`, room: rmColony,
							type: "industry", subtype: "deposit", resource: listing["mineral"],
							id: lab.id, pos: lab.pos, timer: 10, creeps: 8, priority: 3 });
					}
					break;

				case "empty":
					_.forEach(listing["labs"], l => {
						lab = Game.getObjectById(l);
						if (lab.mineralAmount > 0) {
							Tasks.addTask(rmColony, {
								key: `industry:withdraw-${lab.mineralType}-${lab.id}`, room: rmColony,
								type: "industry", subtype: "withdraw", resource: lab.mineralType,
								id: lab.id, pos: lab.pos, timer: 10, creeps: 8, priority: 2 });
						}
					});
					break;

				case "reaction":
					storage = Game.rooms[rmColony].storage;
					if (storage == null) break;

					let mineral = _.get(Memory, ["labs", "reactions", rmColony, "mineral"]);
					if (mineral == null)
						return;

					let reagents = getReagents(mineral);
					let supply1_mineral = reagents[0];
					let supply2_mineral = reagents[1];
					_.set(Memory, ["rooms", rmColony, "stockpile", supply1_mineral], 1000)
					_.set(Memory, ["rooms", rmColony, "stockpile", supply2_mineral], 1000)


					lab = Game.getObjectById(listing["supply1"]);
					if (lab == null) {
						console.log(`<font color=\"#FF0000\">[Error]</font> Sites.Industry: Game.getObjectById(${listing["supply1"]}) is null.`);
						return;
					}
					else if (lab.mineralType != null && lab.mineralType != supply1_mineral) {
						Tasks.addTask(rmColony, {
							key: `industry:withdraw-${lab.mineralType}-${lab.id}`, room: rmColony,
							type: "industry", subtype: "withdraw", resource: lab.mineralType,
							id: lab.id, pos: lab.pos, timer: 10, creeps: 8, priority: 2 });
					}
					else if (Object.keys(storage.store).includes(supply1_mineral)
							&& lab.mineralAmount < lab.mineralCapacity * 0.25) {
						Tasks.addTask(rmColony, {
							key: `industry:withdraw-${supply1_mineral}-${storage.id}`, room: rmColony,
							type: "industry", subtype: "withdraw", resource: supply1_mineral,
							id: storage.id, pos: storage.pos, timer: 10, creeps: 8, priority: 3 });
						Tasks.addTask(rmColony, {
							key: `industry:deposit-${supply1_mineral}-${lab.id}`, room: rmColony,
							type: "industry", subtype: "deposit", resource: supply1_mineral,
							id: lab.id, pos: lab.pos, timer: 10, creeps: 8, priority: 3 });
					}

					lab = Game.getObjectById(listing["supply2"]);
					if (lab == null) {
						console.log(`<font color=\"#FF0000\">[Error]</font> Sites.Industry: Game.getObjectById(${listing["supply2"]}) is null.`);
						return;
					}
					else if (lab.mineralType != null && lab.mineralType != supply2_mineral) {
						Tasks.addTask(rmColony, {
							key: `industry:withdraw-${lab.mineralType}-${lab.id}`, room: rmColony,
							type: "industry", subtype: "withdraw", resource: lab.mineralType,
							id: lab.id, pos: lab.pos, timer: 10, creeps: 8, priority: 2 });
					}
					else if (Object.keys(storage.store).includes(supply2_mineral)
							&& lab.mineralAmount < lab.mineralCapacity * 0.25) {
						Tasks.addTask(rmColony, {
							key: `industry:withdraw-${supply2_mineral}-${storage.id}`, room: rmColony,
							type: "industry", subtype: "withdraw", resource: supply2_mineral,
							id: storage.id, pos: storage.pos, timer: 10, creeps: 8, priority: 3 });
						Tasks.addTask(rmColony, {
							key: `industry:deposit-${supply2_mineral}-${lab.id}`, room: rmColony,
							type: "industry", subtype: "deposit", resource: supply2_mineral,
							id: lab.id, pos: lab.pos, timer: 10, creeps: 8, priority: 3 });
					}

					_.forEach(listing["reactors"], r => {
						lab = Game.getObjectById(r);
							if (lab == null) {
							console.log(`<font color=\"#FF0000\">[Error]</font> Sites.Industry: Game.getObjectById(${r}) is null.`);
							return;
						}
						else if (lab.mineralType != null && lab.mineralType != mineral) {
							Tasks.addTask(rmColony, {
								key: `industry:withdraw-${lab.mineralType}-${lab.id}`, room: rmColony,
								type: "industry", subtype: "withdraw", resource: lab.mineralType,
								id: lab.id, pos: lab.pos, timer: 10, creeps: 8, priority: 2 });
						} else if (lab.mineralAmount > lab.mineralCapacity * 0.2) {
							Tasks.addTask(rmColony, {
								key: `industry:withdraw-${mineral}-${lab.id}`, room: rmColony,
								type: "industry", subtype: "withdraw", resource: mineral,
								id: lab.id, pos: lab.pos, timer: 10, creeps: 8, priority: 2 });
						}
					});

					break;
			}
		}
	},

	runTerminal: function (rmColony) {
		if (Game.rooms[rmColony].terminal != null && Game.rooms[rmColony].terminal.my) {

			if (Memory["terminal_orders"] == null)
				Memory["terminal_orders"] = new Object();
			if (Memory["rooms"][rmColony]["stockpile"] == null)
				Memory["rooms"][rmColony]["stockpile"] = new Object();

			let shortage = {};
			let room = Game.rooms[rmColony];
			let storage = Game.rooms[rmColony].storage;
			let terminal = Game.rooms[rmColony].terminal;

			for (let res in Memory["rooms"][rmColony]["stockpile"]) {
				shortage[res] = Memory["rooms"][rmColony]["stockpile"][res] - room.store(res);

				if (shortage[res] > 0) {
					Memory["terminal_orders"][`${rmColony}-${res}`] = { room: rmColony, resource: res, amount: shortage[res], automated: true, priority: 2 };
				}
			}

			let filling = new Array();
			this.runTerminal_Orders(rmColony, storage, terminal, shortage, filling);
			this.runTerminal_Empty(rmColony, storage, terminal, filling);
        }
	},

	runTerminal_Orders: function (rmColony, storage, terminal, shortage, filling) {
		/* Priority list for terminal orders:
		 * 	1: console injected...
		 * 	2: filling a shortage (internal transfers)
		 * 	3: filling energy for an internal transfer
		 *	4: filling a market order
		 *	5: filling energy for a market order
		*/

		for (let o in Memory["terminal_orders"])
			Memory["terminal_orders"][o]["name"] = o;

		let orders = _.sortBy(Memory["terminal_orders"], "priority");

		for (let n in orders) {
			let order = orders[n];

			if (order["active"] != null && order["active"] == false)
				continue;

			if (this.runOrder_Sync(order, rmColony) == false)
				continue;

			if ((rmColony == order["room"])
				|| (order["from"] != null && rmColony != order["from"])
				|| (order["to"] != null && rmColony != order["to"]))
				continue;

			if (order["market_id"] == null || order["type"] == "buy") {	// Buy order means I'm selling...
				if (this.runOrder_Send(rmColony, order, storage, terminal, shortage, filling) == true)
					return;
			} else if (order["market_id"] != null && order["type"] == "sell") { // Sell order means I'm buying...
				if (this.runOrder_Receive(rmColony, order, storage, terminal, filling) == true)
					return;
			}
		}
	},

	runOrder_Sync: function (order, rmColony) {
		let o = order["name"];

		if (order["market_id"] != null) {	// Sync market orders, update/find new if expired...
			if (order["sync"] != Game.time) {
				order["sync"] = Game.time;
				let sync = Game.market.getOrderById(order["market_id"]);

				if (sync != null) {
					order["market_item"] = sync;
					order["type"] = sync.type;
					order["room"] = sync.roomName;
					order["resource"] = sync.resourceType;
				} else {
					let replacement = _.head(_.sortBy(Game.market.getAllOrders(
						obj => { return obj.resourceType == order["market_item"].resourceType
							&& obj.type == order["market_item"].type && obj.price == order["market_item"].price; }),
						obj => { return Game.map.getRoomLinearDistance(rmColony, obj.roomName); }));

					if (replacement != null) {
						order["market_item"] = replacement;
						order["market_id"] = replacement.id;
						order["type"] = replacement.type;
						order["room"] = replacement.roomName;
						order["resource"] = replacement.resourceType;

						console.log(`<font color=\"#00F0FF\">[Market]</font> Replacement market order found for ${o}!`);
					} else {
						console.log(`<font color=\"#00F0FF\">[Market]</font> No replacement market order found for ${o}; order deleted!`);

						delete Memory["terminal_orders"][o];
						return false;
					}
				}
			}
		}

		return true;
	},

	runOrder_Send: function (rmColony, order, storage, terminal, shortage, filling) {
		/* Notes: Minimum transfer amount is 100.
		 *	 Don't try fulfilling orders with near-shortages- can cause an endless send loop and confuse couriers
		*/

		let o = order["name"];
		let res = order["resource"];
		let room = Game.rooms[rmColony];

		if (_.get(shortage, res, 0) < -2000 || (!_.keys(shortage).includes(res) && room.store(res) > 100)) {
			if (terminal.store[res] != null && ((res != "energy" && terminal.store[res] >= 100) || (res == "energy" && terminal.store[res] > 200))) {
				filling.push(res);
				filling.push("energy");

				let amount;
				if (res == "energy") {
					let calc_transfer = Game.market.calcTransactionCost(10000, rmColony, order["room"]);
					let calc_total = calc_transfer + 10000;
					let calc_coeff = (1 - calc_transfer / calc_total) * 0.95;
					amount = Math.floor(Math.clamp(terminal.store[res] * calc_coeff, 100, order["amount"]));
				} else {
					amount = Math.floor(Math.clamp(terminal.store[res], 100, order["amount"]));
				}

				let cost = Game.market.calcTransactionCost(amount, rmColony, order["room"]);

				if ((res != "energy" && terminal.store["energy"] >= cost)
						|| (res == "energy" && terminal.store["energy"] >= cost + amount)) {

					let result = (order["market_id"] == null)
						? terminal.send(res, amount, order["room"])
						: Game.market.deal(order["market_id"], amount, rmColony);

					if (result == OK) {
						console.log(`<font color=\"#DC00FF\">[Terminals]</font> ${o}: ${amount} of ${res} sent, ${rmColony}`
							+ ` -> ${order["room"]}`);

						Memory["terminal_orders"][o]["amount"] -= amount;
						if (Memory["terminal_orders"][o]["amount"] <= 0)
							delete Memory["terminal_orders"][o];

						return true;

					} else {
						console.log(`<font color=\"#DC00FF\">[Terminals]</font> ${o}: failed to send , `
							+ `${amount} of ${res} ${rmColony} -> ${order["room"]} (code: ${result})`);
					}
				} else {
					if (storage != null && storage.store["energy"] > 0) {
						Tasks.addTask(rmColony, {
							key: `industry:withdraw-energy-${storage.id}`, room: rmColony,
							type: "industry", subtype: "withdraw", resource: "energy",
							id: storage.id, pos: storage.pos, timer: 10, creeps: 8, priority: 5 });
						Tasks.addTask(rmColony, {
							key: `industry:deposit-energy-${terminal.id}`, room: rmColony,
							type: "industry", subtype: "deposit", resource: "energy",
							id: terminal.id, pos: terminal.pos, timer: 10, creeps: 8, priority: 5 });
					} else if (res != "energy") {
						shortage["energy"] = (shortage["energy"] == null) ? cost : shortage["energy"] + cost;
						Memory["terminal_orders"][`${rmColony}-energy`] =
							{ room: rmColony, resource: "energy", amount: cost, automated: true, priority: order["market_id"] == null ? 3 : 5 };
					}
				}
			} else if (storage != null && storage.store[res] != null) {
				filling.push(res);

				Tasks.addTask(rmColony, {
					key: `industry:withdraw-${res}-${storage.id}`, room: rmColony,
					type: "industry", subtype: "withdraw", resource: res,
					amount: Object.keys(shortage).includes(res) ? Math.abs(shortage[res] + 100) : null,
					id: storage.id, pos: storage.pos, timer: 10, creeps: 8, priority: 5 });
				Tasks.addTask(rmColony, {
					key: `industry:deposit-${res}-${terminal.id}`, room: rmColony,
					type: "industry", subtype: "deposit", resource: res,
					id: terminal.id, pos: terminal.pos, timer: 10, creeps: 8, priority: 5 });
			}
		}

		return false;
	},

	runOrder_Receive: function (rmColony, order, storage, terminal, filling) {
	/* Notes: Minimum transfer amount is 100
	 * And always buy in small amounts! ~500-2000
	 */

		let o = order["name"];
		let res = order["resource"];
		let amount = Math.max(100, Math.min(Memory["terminal_orders"][o]["amount"], 2000));
		let cost = Game.market.calcTransactionCost(amount, rmColony, order["room"]);

		if (terminal.store["energy"] != null && terminal.store["energy"] > cost) {
			filling.push("energy");

			let result = Game.market.deal(order["market_id"], amount, rmColony);

			if (result == OK) {
				console.log(`<font color=\"#DC00FF\">[Terminals]</font> ${o}: ${amount} of ${res} received, ${order["room"]}`
					+ ` -> ${rmColony} `);

				Memory["terminal_orders"][o]["amount"] -= amount;
				if (Memory["terminal_orders"][o]["amount"] <= 0)
					delete Memory["terminal_orders"][o];

				return true;
			} else {
				console.log(`<font color=\"#DC00FF\">[Terminals]</font> ${o}: failed to receive`
					+ ` ${amount} of ${res} ${order["room"]} -> ${rmColony} (code: ${result})`);
			}
		} else {
			if (storage != null && storage.store["energy"] > 0) {
				filling.push("energy");

				Tasks.addTask(rmColony, {
					key: `industry:withdraw-energy-${storage.id}`, room: rmColony,
					type: "industry", subtype: "withdraw", resource: "energy",
					id: storage.id, pos: storage.pos, timer: 10, creeps: 8, priority: 5 });
				Tasks.addTask(rmColony, {
					key: `industry:deposit-energy-${terminal.id}`, room: rmColony,
					type: "industry", subtype: "deposit", resource: "energy",
					id: terminal.id, pos: terminal.pos, timer: 10, creeps: 8, priority: 5 });
			} else if (res != "energy") {
				Memory["terminal_orders"][`${rmColony}-energy`] = { room: rmColony, resource: "energy", amount: cost, automated: true, priority: 5 };
			}
		}

		return false;
	},

	runTerminal_Empty: function (rmColony, storage, terminal, filling) {
		// Create generic tasks for emptying terminal's minerals to storage
		let resource_list = [
			"energy",
			"H", "O", "U", "L", "K", "Z", "X", "G",
			"OH", "ZK", "UL",
			"UH", "UO", "KH", "KO", "LH", "LO", "ZH", "ZO", "GH", "GO",
			"UH2O", "UHO2", "KH2O", "KHO2", "LH2O", "LHO2", "ZH2O", "ZHO2", "GH2O", "GHO2",
			"XUH2O", "XUHO2", "XKH2O", "XKHO2", "XLH2O", "XLHO2", "XZH2O", "XZHO2", "XGH2O", "XGHO2" ];

		for (let r in resource_list) {
			let res = resource_list[r];

			if (filling.includes(res)
				|| ((res != "energy" && terminal.store[res] == null) || (res == "energy" && terminal.store[res] == 0)))
				continue;

			Tasks.addTask(rmColony, {
				key: `industry:withdraw-${res}-${terminal.id}`, room: rmColony,
				type: "industry", subtype: "withdraw", resource: res,
				id: terminal.id, pos: terminal.pos, timer: 10, creeps: 8, priority: 6 });
			Tasks.addTask(rmColony, {
				key: `industry:deposit-${res}-${storage.id}`, room: rmColony,
				type: "industry", subtype: "deposit", resource: res,
				id: storage.id, pos: storage.pos, timer: 10, creeps: 8, priority: 6 });
		}
	},

	runCreeps: function (rmColony, listCreeps) {
        _.each(listCreeps, creep => {
			if (creep.memory.role == "courier") {
				Roles.Courier(creep);
			}
        });
	}
};