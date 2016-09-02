let Roles = require("roles");
let Hive = require("hive");


module.exports = {
	
	Industry: function(rmColony, spawnDistance, listPopulation, listLabs) {

		this.runPopulation(rmColony, spawnDistance, listPopulation);
		this.runLabs(rmColony);
		
		if (Hive.isPulse()) {
			this.createTasks(rmColony);
			this.runTerminals(rmColony);
		}
	
		this.runCreeps(rmColony);
	},
	
	
	runPopulation: function(rmColony, spawnDistance, listPopulation) {
		
		let lCourier  = _.filter(Game.creeps, (c) => c.memory.role == "courier" && c.memory.room == rmColony && (c.ticksToLive == undefined || c.ticksToLive > 80));

        let popTarget = (listPopulation["courier"] == null ? 0 : listPopulation["courier"]["amount"]);
        let popActual = lCourier.length;
        Hive.populationTally(rmColony, popTarget, popActual);

        if (listPopulation["courier"] != null && lCourier.length < listPopulation["courier"]["amount"]) {
            Hive.requestSpawn(rmColony, spawnDistance, 4, listPopulation["courier"]["level"], "courier", 
                null, {role: "courier", room: rmColony});            
        }
	},
	
	runLabs: function(rmColony) {
		
		/* Arguments for listLabs:
			{ action: "boost", mineral: "", lab: "", role: "", subrole: "" }
			{ action: "reaction", 
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
                        labReactor.runReaction(labSupply1, labSupply2);
                    }
                    break;
             }
        }
	},
	
	createTasks: function(rmColony) {
		/* Terminal task priorities:
		 * 2: emptying labs
		 * 3: filling labs
		 * ...
		 * 5: filling orders
		 * 6: emptying terminal
		 */

		let Tasks = require("tasks");

		for (let l in listLabs) {
			var lab, storage;
			let listing = listLabs[l];

			switch (listing["action"]) {
				default:
					break;
					
				case "boost":
					storage = Game.rooms[rmColony].storage;
					if (storage == null) break;			
								 
					lab = Game.getObjectById(listing["lab"]);
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
					
					if (lab.mineralType == listing["mineral"] && lab.mineralAmount > 0 && lab.energy > 0) {						
						Tasks.addTask(rmColony, {   
							type: "boost", subtype: "boost", role: listing["role"], subrole: listing["subrole"],
							resource: listing["mineral"], id: lab.id, pos: lab.pos, timer: 10, creeps: 8, priority: 1 });	
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
				Memory["terminal_orders"] == {};
			if (Memory["rooms"][rmColony]["stockpile"] == null)
				Memory["rooms"][rmColony]["stockpile"] = { };

			let storage = Game.rooms[rmColony].storage;
			let terminal = Game.rooms[rmColony].terminal;
			let shortage = Memory["rooms"][rmColony]["stockpile"];

			for (let res in shortage) {
				shortage -= terminal.store[res];
				if (storage != null) 
					shortage -= storage.store[res];
				
				if (shortage[res] > 0) {
					Memory["terminal_orders"].push(
						{ room: rmColony, resource: res, amount: shortage[res] });
				}
			}

			let orders = Memory["terminal_orders"];
			let filling = [];
			for (let o in orders) {
				let resource = orders[o]["resource"];
				if (!shortage.includes(resource) || shortage[resource] < 0) {
					if (terminal.store[resource] != null) {
						filling.push(resource);
						console.log(`Attempting terminal.send(${resource}, ${Math.min(orders[o]["amount"], terminal.store[resource])},`
							+ `${orders[o]["room"]})!!!`);
						//terminal.send(resource, Math.min(orders[o]["amount"], terminal.store[resource]), orders[o]["room"]);
					} else if (storage != null && storage.store[resource] != null) {
						filling.push(resource);
						Tasks.addTask(rmColony, { 
							type: "industry", subtype: "withdraw", resource: resource, 
							id: storage.id, pos: storage.pos, timer: 10, creeps: 8, priority: 5 });
						Tasks.addTask(rmColony, { 
							type: "industry", subtype: "deposit", resource: resource, 
							id: terminal.id, pos: terminal.pos, timer: 10, creeps: 8, priority: 5 });
					}
				}
			}

			for (let res in terminal.store) {
				if (!filling.includes(res)) {
					Tasks.addTask(rmColony, { 
						type: "industry", subtype: "withdraw", resource: resource, 
						id: terminal.id, pos: terminal.pos, timer: 10, creeps: 8, priority: 6 });
					Tasks.addTask(rmColony, { 
						type: "industry", subtype: "deposit", resource: resource, 
						id: storage.id, pos: storage.pos, timer: 10, creeps: 8, priority: 6 });
				}
			}		
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