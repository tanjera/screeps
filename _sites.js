var __Colony = require('__colony');
var _Roles = require('_roles');
var _Hive = require('_hive');

var _Sites = {
    Colony: function(rmColony, spawnDistance, listPopulation, listLinks) {
        if (Memory['_rooms'][rmColony] == null) {
            Memory['_rooms'][rmColony] = {};
        }
         
        var lWorker = _.filter(Game.creeps, (creep) => creep.memory.role == 'worker' && creep.memory.subrole == null && creep.memory.room == rmColony);
        var lRepairer = _.filter(Game.creeps, (creep) => creep.memory.role == 'worker' && creep.memory.subrole == 'repairer' && creep.memory.room == rmColony);
        var lUpgrader = _.filter(Game.creeps, (creep) => creep.memory.role == 'worker' && creep.memory.subrole == 'upgrader' && creep.memory.room == rmColony);
        var lSoldier = _.filter(Game.creeps, (creep) => creep.memory.role == 'soldier' && creep.memory.room == rmColony);

        var popTarget = 
            (listPopulation['worker'] == null ? 0 : listPopulation['worker']['amount'])
            + (listPopulation['repairer'] == null ? 0 : listPopulation['repairer']['amount'])
            + (listPopulation['upgrader'] == null ? 0 : listPopulation['upgrader']['amount'])
            + (listPopulation['soldier'] == null ? 0 : listPopulation['soldier']['amount']);        
        var popActual = lWorker.length + lRepairer.length + lUpgrader.length + lSoldier.length;
        _Hive.populationTally(rmColony, popTarget, popActual);

        if ((listPopulation['soldier'] != null && lSoldier.length < listPopulation['soldier']['amount']) 
            || (lSoldier.length < Game.rooms[rmColony].find(FIND_HOSTILE_CREEPS, { filter: function(c) { 
                        return !Object.keys(Memory['_allies']).includes(c.owner.username); }}).length)) {            
            _Hive.requestSpawn(rmColony, 0, 0, (listPopulation['soldier'] == null ? 8 : listPopulation['soldier']['level']), 'soldier', 
                null, {role: 'soldier', room: rmColony});
        } else if (listPopulation['worker'] != null && lWorker.length < listPopulation['worker']['amount']) {
            _Hive.requestSpawn(rmColony, spawnDistance, 3, listPopulation['worker']['level'], 'worker', 
                null, {role: 'worker', room: rmColony});
        } else if (listPopulation['repairer'] != null && lRepairer.length < listPopulation['repairer']['amount']) {
            _Hive.requestSpawn(rmColony, spawnDistance, 4, listPopulation['repairer']['level'], 'worker', 
                null, {role: 'worker', subrole: 'repairer', room: rmColony});
        } else if (listPopulation['upgrader'] != null && lUpgrader.length < listPopulation['upgrader']['amount']) {
            _Hive.requestSpawn(rmColony, spawnDistance, 4, listPopulation['upgrader']['level'], 'worker', 
                null, {role: 'worker', subrole: 'upgrader', room: rmColony});
        }        
        
        // Run _Roles!
        for (var n in Game.creeps) {
            var creep = Game.creeps[n];            
            if (creep.memory.room != null && creep.memory.room == rmColony) {
                if (creep.memory.role == 'worker') {
                    _Roles.Worker(creep);
                }
                else if (creep.memory.role == 'soldier') {
                    _Roles.Soldier(creep);
                }
            }
        }        

        // Process Towers
        var listTowers = Game.rooms[rmColony].find(FIND_MY_STRUCTURES, { filter: (s) => { return s.structureType == STRUCTURE_TOWER; }});                            
        for (var t in listTowers) {
            var tower = listTowers[t];
            
            var hostile = tower.pos.findClosestByRange(FIND_HOSTILE_CREEPS, { filter: function(c) {
                        return !Object.keys(Memory['_allies']).includes(c.owner.username); }});
            if (hostile != null) { // Anyone to attack?
                tower.attack(hostile);
                continue;
            } 
            
            var injured = tower.pos.findClosestByRange(FIND_MY_CREEPS, { filter: function(c) { return c.hits < c.hitsMax; }});
            if (injured != null && tower.energy > tower.energyCapacity * 0.5) { // Anyone to heal?
                tower.heal(injured);
                continue;
            } 
            
            if (tower.energy > tower.energyCapacity * 0.5) { // Maintain structures with extra energy
                var structure = __Colony.findByNeed_RepairCritical(tower.room);
                if (structure != null) {
                    tower.repair(structure);
                    continue;
                } 
            }
        }

        // Process links via listLinks parameter (an array of [id: '', role: 'send/receive'])
        if (listLinks != null) {
            Memory['_rooms'][rmColony]['links'] = listLinks;

            var linksSend = _.filter(listLinks, (obj) => { return obj.id && obj['role'] == 'send'; });
            var linksReceive = _.filter(listLinks, (obj) => { return obj.id && obj['role'] == 'receive'; });

            for (var r = 0; r < linksReceive.length; r++) {
                for (var s = 0; s < linksSend.length; s++) {
                    var lSend = Game.getObjectById(linksSend[s]['id']);
                    var lReceive = Game.getObjectById(linksReceive[r]['id']);
                    if (lSend.energy > lSend.energyCapacity * 0.25 && lReceive.energy < lReceive.energyCapacity * 0.9) {
                        lSend.transferEnergy(lReceive);
                    }
                }
            }
        } },


    Mining: function(rmColony, rmHarvest, spawnDistance, listPopulation, listRoute) {

        var lBurrower  = _.filter(Game.creeps, (c) => c.memory.role == 'burrower' && c.memory.room == rmHarvest && (c.ticksToLive == undefined || c.ticksToLive > 160));
        var lCarrier  = _.filter(Game.creeps, (c) => c.memory.role == 'carrier' && c.memory.room == rmHarvest && (c.ticksToLive == undefined || c.ticksToLive > 160));
        var lMiner  = _.filter(Game.creeps, (c) => c.memory.role == 'miner' && c.memory.room == rmHarvest && (c.ticksToLive == undefined || c.ticksToLive > 160));
        var lMultirole  = _.filter(Game.creeps, (c) => c.memory.role == 'multirole' && c.memory.room == rmHarvest);
        var lReserver  = _.filter(Game.creeps, (c) => c.memory.role == 'reserver' && c.memory.room == rmHarvest);
        var lExtractor  = _.filter(Game.creeps, (c) => c.memory.role == 'extractor' && c.memory.room == rmHarvest);

        var popTarget =(
            listPopulation['burrower'] == null ? 0 : listPopulation['burrower']['amount'])
            + (listPopulation['carrier'] == null ? 0 : listPopulation['carrier']['amount'])
            + (listPopulation['miner'] == null ? 0 : listPopulation['miner']['amount'])
            + (listPopulation['multirole'] == null ? 0 : listPopulation['multirole']['amount']
            + (listPopulation['reserver'] == null ? 0 : listPopulation['reserver']['amount'])
            + (listPopulation['extractor'] == null ? 0 : listPopulation['extractor']['amount']));         
        var popActual = lBurrower.length + lCarrier.length + lMiner.length + lMultirole.length + lReserver.length + lExtractor.length;
        _Hive.populationTally(rmColony, popTarget, popActual);

        // Defend the mining op!
        if (Object.keys(Game.rooms).includes(rmHarvest) && Game.rooms[rmHarvest].find(FIND_HOSTILE_CREEPS, 
                        {filter: function(c) { return !Object.keys(Memory['_allies']).includes(c.owner.username); }}).length > 0) {
            var lSoldier = _.filter(Game.creeps, (creep) => creep.memory.role == 'soldier' && creep.memory.room == rmHarvest);
            if (lSoldier.length + lMultirole.length < Game.rooms[rmHarvest].find(FIND_HOSTILE_CREEPS, 
                        {filter: function(c) { return !Object.keys(Memory['_allies']).includes(c.owner.username); }}).length) {
                _Hive.requestSpawn(rmColony, 0, 0, 8, 'soldier', null, {role: 'soldier', room: rmHarvest, colony: rmColony});
            }
        }
        else if (listPopulation['miner'] != null && lMiner.length < listPopulation['miner']['amount']) {
            if (lMiner.length == 0) { // Possibly colony wiped? Need restart?
                _Hive.requestSpawn(rmColony, 0, 1, 1, 'worker', null, {role: 'miner', room: rmHarvest, colony: rmColony});
            } else {
                _Hive.requestSpawn(rmColony, spawnDistance, 1, listPopulation['miner']['level'], 'worker', 
                    null, {role: 'miner', room: rmHarvest, colony: rmColony});
            }    
        }
        else if (listPopulation['burrower'] != null && lBurrower.length < listPopulation['burrower']['amount']) {
            if (lCarrier.length == 0 && listPopulation['carrier'] != null && lMiner.length == 0) {// Possibly colony wiped? Need restart?
                _Hive.requestSpawn(rmColony, 0, 1, 1, 'worker', null, {role: 'miner', room: rmHarvest, colony: rmColony});
            } else {
                _Hive.requestSpawn(rmColony, spawnDistance, 1, listPopulation['burrower']['level'], 'burrower', 
                    null, {role: 'burrower', room: rmHarvest, colony: rmColony});
            }
        }
        else if (listPopulation['carrier'] != null && lCarrier.length < listPopulation['carrier']['amount']) {
            if (listPopulation['carrier']['body'] == null) {
                _Hive.requestSpawn(rmColony, spawnDistance, 1, listPopulation['carrier']['level'], 'carrier', 
                    null, {role: 'carrier', room: rmHarvest, colony: rmColony});
            } else if (listPopulation['carrier']['body'] == 'all-terrain') {
                _Hive.requestSpawn(rmColony, spawnDistance, 1, listPopulation['carrier']['level'], 'carrier_at', 
                    null, {role: 'carrier', room: rmHarvest, colony: rmColony});
            }
        }
        else if (listPopulation['multirole'] != null && lMultirole.length < listPopulation['multirole']['amount']) {
            _Hive.requestSpawn(rmColony, spawnDistance, 2, listPopulation['multirole']['level'], 'multirole', 
                null, {role: 'multirole', room: rmHarvest, colony: rmColony});
        }
        else if (listPopulation['reserver'] != null && lReserver.length < listPopulation['reserver']['amount'] 
                    && Game.rooms[rmHarvest] != null && Game.rooms[rmHarvest].controller != null
                    && (Game.rooms[rmHarvest].controller.reservation == null || Game.rooms[rmHarvest].controller.reservation.ticksToEnd < 2000)) {
            _Hive.requestSpawn(rmColony, 0, 2, listPopulation['reserver']['level'], 'reserver', 
                null, {role: 'reserver', room: rmHarvest, colony: rmColony});            
        }
        else if (listPopulation['extractor'] != null && lExtractor.length < listPopulation['extractor']['amount'] 
                    && Object.keys(Game.rooms).includes(rmHarvest)
                    && Game['rooms'][rmHarvest].find(FIND_MINERALS, {filter: function(m) { return m.mineralAmount > 0; }}).length > 0) {
            _Hive.requestSpawn(rmColony, spawnDistance, 2, listPopulation['extractor']['level'], 'worker', 
                null, {role: 'extractor', room: rmHarvest, colony: rmColony});    
        }

        // Run _Roles!
        for (var n in Game.creeps) {
            var creep = Game.creeps[n];                
            if (creep.memory.room != null && creep.memory.colony != null 
                    && creep.memory.room == rmHarvest && creep.memory.colony == rmColony) {
                creep.memory.listRoute = listRoute;
                // If the room is safe to run mining operations... run _Roles. 
                if (!Object.keys(Game.rooms).includes(rmHarvest) || rmColony == rmHarvest 
                        || (Object.keys(Game.rooms).includes(rmHarvest) && Game.rooms[rmHarvest].find(FIND_HOSTILE_CREEPS, 
                        { filter: function(c) { return !Object.keys(Memory['_allies']).includes(c.owner.username); }}).length == 0)) {
                    if (creep.memory.role == 'miner' || creep.memory.role == 'burrower' || creep.memory.role == 'carrier') {
                        _Roles.Mining(creep, rmColony, rmHarvest, listRoute);
                    } else if (creep.memory.role == 'multirole') {
                        _Roles.Worker(creep, listRoute);
                    } else if (creep.memory.role == 'reserver') {
                        _Roles.Reserver(creep, listRoute);
                    } else if (creep.memory.role == 'extractor') {
                        _Roles.Extracter(creep, rmColony, rmHarvest, listRoute);
                    } 
                }
            } else {
                // If it's not safe... attack!
                if (creep.memory.role == 'soldier' || creep.memory.role == 'multirole') {
                    _Roles.Soldier(creep, listRoute);
                }
            }
        } },


    Industry: function(rmColony, spawnDistance, listPopulation, listLabs, listTasks) {
        var lCourier  = _.filter(Game.creeps, (c) => c.memory.role == 'courier' && c.memory.room == rmColony && (c.ticksToLive == undefined || c.ticksToLive > 80));

        var popTarget = (listPopulation['courier'] == null ? 0 : listPopulation['courier']['amount']);
        var popActual = lCourier.length;
        _Hive.populationTally(rmColony, popTarget, popActual);

        if (listPopulation['courier'] != null && lCourier.length < listPopulation['courier']['amount']) {
            _Hive.requestSpawn(rmColony, spawnDistance, 4, listPopulation['courier']['level'], 'courier', 
                null, {role: 'courier', room: rmColony});            
        }        

        for (var l in listLabs) {
            var listing = listLabs[l];
             switch (listing['action']) {
                default:
                    break;

                case 'reaction':
                    var labReactor = Game.getObjectById(listing['reactor']['lab']);
                    var labSupply1 = Game.getObjectById(listing['supply1']['lab']);
                    var labSupply2 = Game.getObjectById(listing['supply2']['lab']);  
                    if (labReactor != null && labSupply1 != null && labSupply2 != null) {
                        labReactor.runReaction(labSupply1, labSupply2);
                    }
                    break;

                case 'boost':
                    break;
             }
        }

        if (_Hive.isPulse()) {
            var _Tasks = require('_tasks');
            if (listTasks == null)  listTasks = {};

            for (var l in listLabs) {                
                var listing = listLabs[l];

                // Populate tasks for the courier to load and unload labs
                if (listing['action'] == 'reaction') {                    
					var storage = Game.rooms[rmColony].storage;
                    if (storage == null) break;			
                                 
                    var target = Game.getObjectById(listing['supply1']['lab']);
                    if (Object.keys(storage.store).includes(listing['supply1']['mineral']) 
							&& target.mineralAmount < target.mineralCapacity * 0.5) {
						_Tasks.addTask(rmColony, 
							{   type: 'industry', subtype: 'withdraw', 
								resource: listing['supply1']['mineral'], 
								id: storage.id, 
								target: listing['supply1']['lab'], 
								timer: 10, creeps: 8, priority: 3 
							});							
						_Tasks.addTask(rmColony, 
							{   type: 'industry', subtype: 'deposit', 
								resource: listing['supply1']['mineral'],
								id: listing['supply1']['lab'],
								timer: 10, creeps: 8, priority: 3 
							});
					}
                    
                    var target = Game.getObjectById(listing['supply2']['lab']);
                    if (Object.keys(storage.store).includes(listing['supply2']['mineral']) 
							&& target.mineralAmount < target.mineralCapacity * 0.5) {
						_Tasks.addTask(rmColony, 
							{   type: 'industry', subtype: 'withdraw', 
								resource: listing['supply2']['mineral'], 
								id: storage.id, 
								target: listing['supply2']['lab'], 
								timer: 10, creeps: 8, priority: 3 
							});
						_Tasks.addTask(rmColony, 
							{   type: 'industry', subtype: 'deposit', 
								resource: listing['supply2']['mineral'],
								id: listing['supply2']['lab'],
								timer: 10, creeps: 8, priority: 3 
							});
					}

					var obj = Game.getObjectById(listing['reactor']['lab']);
					if (obj.mineralAmount > obj.mineralCapacity * 0.5) {
						_Tasks.addTask(rmColony, 
							{   type: 'industry', subtype: 'withdraw', 
								resource: listing['reactor']['mineral'],
								id: listing['reactor']['lab'],
								timer: 10, creeps: 8, priority: 2 
							};
					}
                }
            }

            for (var t in listTasks) {                
                var task = listTasks[t];
                
                var obj = Game.getObjectById(task['id']);
                if (obj == null) {
                    continue;
                }

                task['pos'] = obj.pos;
                
                if (task['subtype'] == 'withdraw') {
                    var target = Game.getObjectById(task['target']);
                    if ((obj.structureType == STRUCTURE_STORAGE || obj.structureType == STRUCTURE_CONTAINER) 
                            && Object.keys(obj.store).includes(task['resource'])) {
                        if (target == null) {
                            _Tasks.addTask(rmColony, task);
                        } else if (target.structureType == STRUCTURE_LAB && target.mineralAmount < target.mineralCapacity * 0.5) {
                            _Tasks.addTask(rmColony, task);
                        }
                    } else if (obj.structureType == STRUCTURE_LAB && obj.mineralAmount > obj.mineralCapacity * 0.5) {
                        _Tasks.addTask(rmColony, task);
                    } else if (obj.structureType == STRUCTURE_TERMINAL && Object.keys(obj.store).includes(task['resource'])) {
                        _Tasks.addTask(rmColony, task);
                    }
                } else if (task['subtype'] == 'deposit') {
                    if (obj.structureType == STRUCTURE_LAB) {
                        if (obj.mineralAmount < obj.mineralCapacity * 0.5
                                && (obj.mineralType == task['resource'] || obj.mineralType == null)) {
                            _Tasks.addTask(rmColony, task);
                        }                        
                    } else {
                        _Tasks.addTask(rmColony, task);
                    }
                }
            }
        }

        for (var n in Game.creeps) {
            var creep = Game.creeps[n];
            if (creep.memory.room != null && creep.memory.room == rmColony) {                
                if (creep.memory.role == 'courier') {
                    _Roles.Courier(creep);
                }
            }
        }
        },


    Reservation: function(rmColony, rmHarvest, spawnDistance, listPopulation, listRoute) {
        var lReserver  = _.filter(Game.creeps, (c) => c.memory.role == 'reserver' && c.memory.room == rmHarvest && (c.ticksToLive == undefined || c.ticksToLive > 80));

        var popTarget = (listPopulation['reserver'] == null ? 0 : listPopulation['reserver']['amount']);
        var popActual = lReserver.length;
        _Hive.populationTally(rmColony, popTarget, popActual);

        if (listPopulation['reserver'] != null && lReserver.length < listPopulation['reserver']['amount']) {
            _Hive.requestSpawn(rmColony, spawnDistance, 1, listPopulation['reserver']['level'], 'reserver', 
                null, {role: 'reserver', room: rmHarvest, colony: rmColony});
        }

        for (var n in Game.creeps) {
            var creep = Game.creeps[n];
            if (creep.memory.room != null && creep.memory.colony != null 
                    && creep.memory.room == rmHarvest && creep.memory.colony == rmColony) {
                creep.memory.listRoute = listRoute;
                if (creep.memory.role == 'reserver') {
                    _Roles.Reserver(creep);
                }
            }            
        } },


    Occupation: function(rmColony, rmOccupy, spawnDistance, listPopulation, listRoute) {
        var lSoldier  = _.filter(Game.creeps, (c) => c.memory.role == 'soldier' && c.memory.room == rmOccupy && (c.ticksToLive == undefined || c.ticksToLive > 80));
        
        var popTarget = (listPopulation['soldier'] == null ? 0 : listPopulation['soldier']['amount']);
        var popActual = lSoldier.length;
        _Hive.populationTally(rmColony, popTarget, popActual);

        if (listPopulation['soldier'] != null && lSoldier.length < listPopulation['soldier']['amount']) {
            _Hive.requestSpawn(rmColony, spawnDistance, 1, listPopulation['soldier']['level'], 'soldier', 
                null, {role: 'soldier', room: rmOccupy, colony: rmColony});            
        }

        for (var n in Game.creeps) {
            var creep = Game.creeps[n];
            if (creep.memory.room != null && creep.memory.colony != null 
                    && creep.memory.room == rmHarvest && creep.memory.colony == rmColony) {
                creep.memory.listRoute = listRoute;
                if (creep.memory.role == 'soldier') {
                    _Roles.Soldier(creep);
                }
            }            
        } }
};

module.exports = _Sites;
