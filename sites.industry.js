let Roles = require("roles");
let Hive = require("hive");
let Tasks = require("tasks");

let _CPU = require("util.cpu");

module.exports = {
	
	Run: function(rmColony, spawnDistance, listPopulation, listLabs) {

		/* Terminal order format (from: is optional!)
		 * For internal transfers: 
				Memory["terminal_orders"][""] = { room: "", resource: "", amount: , from: ""};
		 * For market trading: 
				Memory["terminal_orders"][""] = { market_id: "", amount: , from: ""};
				Memory["terminal_orders"][""] = { market_id: "", amount: , to: ""};
		*/
		 
	
		_CPU.Start(rmColony, "Industry-runPopulation");
		this.runPopulation(rmColony, spawnDistance, listPopulation);
		_CPU.End(rmColony, "Industry-runPopulation");
		
		_CPU.Start(rmColony, "Industry-runLabs");
		this.runLabs(rmColony, listLabs);
		_CPU.End(rmColony, "Industry-runLabs");
		
		if (Hive.isPulse()) {
			_CPU.Start(rmColony, "Industry-createLabTasks");
			this.createLabTasks(rmColony, listLabs);
			_CPU.End(rmColony, "Industry-createLabTasks");
			
			_CPU.Start(rmColony, "Industry-runTerminal");
			this.runTerminal(rmColony);
			_CPU.End(rmColony, "Industry-runTerminal");
		}
	
		_CPU.Start(rmColony, "Industry-runCreeps");
		this.runCreeps(rmColony);
		_CPU.End(rmColony, "Industry-runCreeps");
	},
	
	
	runPopulation: function(rmColony, spawnDistance, listPopulation) {
		
		let lCourier  = _.filter(Game.creeps, (c) => c.memory.role == "courier" && c.memory.room == rmColony && (c.ticksToLive == undefined || c.ticksToLive > 80));

        let popTarget = (listPopulation["courier"] == null ? 0 : listPopulation["courier"]["amount"]);
        let popActual = lCourier.length;
        Hive.populationTally(rmColony, popTarget, popActual);

        if (listPopulation["courier"] != null && lCourier.length < listPopulation["courier"]["amount"]) {            
			Memory["spawn_requests"].push({ room: rmColony, distance: spawnDistance, priority: 4, level: listPopulation["courier"]["level"], 
				body: "courier", name: null, args: {role: "courier", room: rmColony} });
        }
	},
	
	runLabs: function(rmColony, listLabs) {
		
		/* Arguments for listLabs:
			{ action: "boost", mineral: "", lab: "", role: "", subrole: "" }
			{ action: "reaction", amount: -1,
				reactor: {mineral: "", lab: ""}, 
				supply1: {mineral: "", lab: ""}, 
				supply2: {mineral: "", lab: ""} }
			{ action: "empty", lab: "" }			
		*/		
		
        for (let l in listLabs) {
            let listing = listLabs[l];
             switch (listing["action"]) {
                default:
                    break;
					
				case "boost":
					let _Creep = require("util.creep");
					let lab = Game.getObjectById(listing["lab"]);
					let creeps = lab.pos.findInRange(FIND_MY_CREEPS, 1, 
						{ filter: (c) => { return c.memory.role == listing["role"] 
							&& c.memory.subrole == listing["subrole"]
							&& c.ticksToLive > 1100 && !_Creep.isBoosted(c) }});
					if (creeps.length > 0) {						
						lab.boostCreep(creeps[0]);						
					}
					break;

                case "reaction":
                    let labReactor = Game.getObjectById(listing["reactor"]["lab"]);
                    let labSupply1 = Game.getObjectById(listing["supply1"]["lab"]);
                    let labSupply2 = Game.getObjectById(listing["supply2"]["lab"]);  
                    
					if (labReactor != null && labSupply1 != null && labSupply2 != null) {
						if (listing["amount"] != null && listing["amount"] > 0) {
							let mineral = listing["reactor"]["mineral"]
							let amount = (Game.rooms[rmColony].storage.store[mineral] == null ? 0 : Game.rooms[rmColony].storage.store[mineral])
									+ (Game.rooms[rmColony].terminal.store[mineral] == null ? 0 : Game.rooms[rmColony].terminal.store[mineral]);
							if (amount > listing["amount"])
								break;
						}
						
                        labReactor.runReaction(labSupply1, labSupply2);
                    }
                    break;
             }
        }
	},
	
	createLabTasks: function(rmColony, listLabs) {
		/* Terminal task priorities:
		 * 2: emptying labs
		 * 3: filling labs
		 * ...
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
					
					// Minimum amount necessary to boost 1x body part: 30 mineral & 20 energy
					if (lab.mineralType == listing["mineral"] && lab.mineralAmount > 30 && lab.energy > 20) {
						Tasks.addTask(rmColony, {   
							type: "boost", subtype: "boost", role: listing["role"], subrole: listing["subrole"],
							resource: listing["mineral"], id: lab.id, pos: lab.pos, timer: 10, creeps: 8, priority: 1 });	
					}
					
					storage = Game.rooms[rmColony].storage;
					if (storage == null) break;
										
					if (lab.mineralType != null && lab.mineralType != listing["mineral"]) {
						Tasks.addTask(rmColony, {   
							type: "industry", subtype: "withdraw", resource: lab.mineralType,
							id: lab.id, pos: lab.pos, timer: 10, creeps: 8, priority: 2 });
					} else if (lab.energy < lab.energyCapacity * 0.75 && Object.keys(storage.store).includes("energy")) {
						Tasks.addTask(rmColony, {   
							type: "industry", subtype: "withdraw", resource: "energy", 
							id: storage.id, pos: storage.pos, timer: 10, creeps: 8, priority: 3 });							
						Tasks.addTask(rmColony, {   
							type: "industry", subtype: "deposit", resource: "energy",
							id: lab.id, pos: lab.pos, timer: 10, creeps: 8, priority: 3 });	
					} else if (lab.mineralAmount < lab.mineralCapacity * 0.75 && Object.keys(storage.store).includes(listing["mineral"])) {
						Tasks.addTask(rmColony, {   
							type: "industry", subtype: "withdraw", resource: listing["mineral"], 
							id: storage.id, pos: storage.pos, timer: 10, creeps: 8, priority: 3 });							
						Tasks.addTask(rmColony, {   
							type: "industry", subtype: "deposit", resource: listing["mineral"],
							id: lab.id, pos: lab.pos, timer: 10, creeps: 8, priority: 3 });								
					}					
					break;
					
				case "empty":
					lab = Game.getObjectById(listing["lab"]);
					if (lab.mineralAmount > 0) {							
						Tasks.addTask(rmColony, {   
							type: "industry", subtype: "withdraw", resource: lab.mineralType,
							id: listing["lab"], pos: lab.pos, timer: 10, creeps: 8, priority: 2 });
					}
					if (lab.energy > 0) {							
						Tasks.addTask(rmColony, {   
							type: "industry", subtype: "withdraw", resource: "energy",
							id: listing["lab"], pos: lab.pos, timer: 10, creeps: 8, priority: 3 });
					}
					break;
					
				case "reaction":
					storage = Game.rooms[rmColony].storage;
					if (storage == null) break;			
								 
					lab = Game.getObjectById(listing["supply1"]["lab"]);
					if (lab.mineralType != null && lab.mineralType != listing["supply1"]["mineral"]) {
						Tasks.addTask(rmColony, {   
							type: "industry", subtype: "withdraw", resource: lab.mineralType,
							id: lab.id, pos: lab.pos, timer: 10, creeps: 8, priority: 2 });
					}
					else if (Object.keys(storage.store).includes(listing["supply1"]["mineral"]) 
							&& lab.mineralAmount < lab.mineralCapacity * 0.2) {
						Tasks.addTask(rmColony, {   
							type: "industry", subtype: "withdraw", resource: listing["supply1"]["mineral"], 
							id: storage.id, pos: storage.pos, timer: 10, creeps: 8, priority: 3 });							
						Tasks.addTask(rmColony, {   
							type: "industry", subtype: "deposit", resource: listing["supply1"]["mineral"], 
							id: lab.id, pos: lab.pos, timer: 10, creeps: 8, priority: 3 });
					}
					
					lab = Game.getObjectById(listing["supply2"]["lab"]);
					if (lab.mineralType != null && lab.mineralType != listing["supply2"]["mineral"]) {
						Tasks.addTask(rmColony, {   
							type: "industry", subtype: "withdraw", resource: lab.mineralType, 
							id: lab.id, pos: lab.pos, timer: 10, creeps: 8, priority: 2 });
					}
					else if (Object.keys(storage.store).includes(listing["supply2"]["mineral"]) 
							&& lab.mineralAmount < lab.mineralCapacity * 0.2) {
						Tasks.addTask(rmColony, {   
							type: "industry", subtype: "withdraw", resource: listing["supply2"]["mineral"], 
							id: storage.id, pos: storage.pos, timer: 10, creeps: 8, priority: 3 });
						Tasks.addTask(rmColony, {   
							type: "industry", subtype: "deposit", resource: listing["supply2"]["mineral"], 
							id: lab.id, pos: lab.pos, timer: 10, creeps: 8, priority: 3 });
					}

					lab = Game.getObjectById(listing["reactor"]["lab"]);
					if (lab.mineralType != null && lab.mineralType != listing["reactor"]["mineral"]) {						
						Tasks.addTask(rmColony, {   
							type: "industry", subtype: "withdraw", resource: lab.mineralType, 
							id: lab.id, pos: lab.pos, timer: 10, creeps: 8, priority: 2 });
					} else if (lab.mineralAmount > lab.mineralCapacity * 0.8) {
						Tasks.addTask(rmColony, {   
							type: "industry", subtype: "withdraw", resource: listing["reactor"]["mineral"], 
							id: lab.id, pos: lab.pos, timer: 10, creeps: 8, priority: 2 });
					}
					
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
			let storage = Game.rooms[rmColony].storage;
			let terminal = Game.rooms[rmColony].terminal;			

			for (let res in Memory["rooms"][rmColony]["stockpile"]) {
				shortage[res] = Memory["rooms"][rmColony]["stockpile"][res];
				
				if (terminal.store[res] != null) 
					shortage[res] -= terminal.store[res];
				if (storage != null && storage.store[res] != null) 
					shortage[res] -= storage.store[res];
				
				if (shortage[res] > 0) {					
					Memory["terminal_orders"][`${rmColony}-${res}`] = { room: rmColony, resource: res, amount: shortage[res] };
				}
			}
			
			let filling = new Array();			
			this.runTerminal_Orders(rmColony, storage, terminal, shortage, filling);
			this.runTerminal_Empty(rmColony, storage, terminal, filling);
        }
	},
	
	runTerminal_Orders: function (rmColony, storage, terminal, shortage, filling) {
		for (let o in Memory["terminal_orders"]) {
			let order = Memory["terminal_orders"][o];
			order["name"] = o;
			
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
				let sync = _.head(Game.market.getAllOrders(obj => obj.id == order["market_id"]));
				
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
						
						if (Memory["options"]["console"] == "on")
							console.log(`<font color=\"#00F0FF\">[Market]</font> Replacement market order found for ${o}!`);
					} else {							
						if (Memory["options"]["console"] == "on")
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
		
		if (!Object.keys(shortage).includes(res) || shortage[res] < -2000) {
			if (terminal.store[res] != null && ((res != "energy" && terminal.store[res] > 100) || (res == "energy" && terminal.store[res] > 200))) {
				filling.push(res);
				filling.push("energy");
				
				let amount = Math.ceil((res == "energy")
					? Math.max(Math.min(order["amount"], terminal.store[res]) * 0.65, 100)
					: Math.max(Math.min(order["amount"], terminal.store[res]), 100));
				let cost = Game.market.calcTransactionCost(amount, rmColony, order["room"]);
				
				if ((res != "energy" && terminal.store["energy"] >= cost)
						|| (res == "energy" && terminal.store["energy"] >= cost + amount)) {
					
					let result = (order["market_id"] == null)
						? terminal.send(res, amount, order["room"])
						: Game.market.deal(order["market_id"], amount, rmColony);
						
					if (result == OK) {
						if (Memory["options"]["console"] == "on")
							console.log(`<font color=\"#DC00FF\">[Terminals]</font> ${o}: ${amount} of ${res} sent, ${rmColony}`
								+ ` -> ${order["room"]}`);
						
						Memory["terminal_orders"][o]["amount"] -= amount;							
						if (Memory["terminal_orders"][o]["amount"] <= 0)
							delete Memory["terminal_orders"][o];							
						
						return true;
						
					} else {
						if (Memory["options"]["console"] == "on")
							console.log(`<font color=\"#DC00FF\">[Terminals]</font> ${o}: failed to send , `
								+ `${amount} of ${res} ${rmColony} -> ${order["room"]} (code: ${result})`);
					}
				} else {
					if (storage != null && storage.store["energy"] > 0) {
						Tasks.addTask(rmColony, { 
							type: "industry", subtype: "withdraw", resource: "energy", 
							id: storage.id, pos: storage.pos, timer: 10, creeps: 8, priority: 5 });
						Tasks.addTask(rmColony, { 
							type: "industry", subtype: "deposit", resource: "energy", 
							id: terminal.id, pos: terminal.pos, timer: 10, creeps: 8, priority: 5 });
					} else if (res != "energy") {
						shortage["energy"] = (shortage["energy"] == null) ? cost : shortage["energy"] + cost;
						Memory["terminal_orders"][`${rmColony}-energy`] = { room: rmColony, resource: "energy", amount: cost };						
					}
				}			
			} else if (storage != null && storage.store[res] != null) {					
				filling.push(res);
				
				Tasks.addTask(rmColony, { 
					type: "industry", subtype: "withdraw", resource: res, 
					amount: Object.keys(shortage).includes(res) ? Math.abs(shortage[res] + 100) : null,
					id: storage.id, pos: storage.pos, timer: 10, creeps: 8, priority: 5 });
				Tasks.addTask(rmColony, { 
					type: "industry", subtype: "deposit", resource: res, 
					id: terminal.id, pos: terminal.pos, timer: 10, creeps: 8, priority: 5 });					
			}
		}
		
		return false;
	},
	
	runOrder_Receive: function (rmColony, order, storage, terminal, filling) {				
	/* Notes: Minimum transfer amount is 100
	 * And always buy in small amounts! ~500-1000
	 */
	 
		let o = order["name"];
		let res = order["resource"];
		let amount = 500;
		let cost = Game.market.calcTransactionCost(amount, rmColony, order["room"]);
	 
		if (terminal.store["energy"] != null && terminal.store["energy"] > cost) {
			filling.push("energy");
				
			let result = Game.market.deal(order["market_id"], amount, rmColony);
					
			if (result == OK) {
				if (Memory["options"]["console"] == "on")
					console.log(`<font color=\"#DC00FF\">[Terminals]</font> ${o}: ${amount} of ${res} received, ${order["room"]}`
						+ ` -> ${rmColony} `);
				
				Memory["terminal_orders"][o]["amount"] -= amount;							
				if (Memory["terminal_orders"][o]["amount"] <= 0)
					delete Memory["terminal_orders"][o];							
				
				return true;				
			} else {
				if (Memory["options"]["console"] == "on")
					console.log(`<font color=\"#DC00FF\">[Terminals]</font> ${o}: failed to receive`
						+ ` ${amount} of ${res} ${order["room"]} -> ${rmColony} (code: ${result})`);
			}				
		} else {
			if (storage != null && storage.store["energy"] > 0) {
				filling.push("energy");
				
				Tasks.addTask(rmColony, { 
					type: "industry", subtype: "withdraw", resource: "energy", 
					id: storage.id, pos: storage.pos, timer: 10, creeps: 8, priority: 5 });
				Tasks.addTask(rmColony, { 
					type: "industry", subtype: "deposit", resource: "energy", 
					id: terminal.id, pos: terminal.pos, timer: 10, creeps: 8, priority: 5 });
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
				type: "industry", subtype: "withdraw", resource: res, 
				id: terminal.id, pos: terminal.pos, timer: 10, creeps: 8, priority: 6 });
			Tasks.addTask(rmColony, { 
				type: "industry", subtype: "deposit", resource: res, 
				id: storage.id, pos: storage.pos, timer: 10, creeps: 8, priority: 6 });			
		}
	},
	
	runCreeps: function (rmColony) {
        for (let n in Game.creeps) {
            let creep = Game.creeps[n];
            if (creep.memory.room != null && creep.memory.room == rmColony) {                
                if (creep.memory.role == "courier") {
                    Roles.Courier(creep);
                }
            }
        }
	}
};