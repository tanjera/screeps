module.exports = {
    
	Colony: function(rmColony, listSpawnRooms, listPopulation, listRoute) {
		let Colony = require("sites.colony");
		Colony.Run(rmColony, listSpawnRooms, listPopulation, listRoute)
	},
	
	Mining: function(rmColony, rmHarvest, listSpawnRooms, hasKeepers, listPopulation, listRoute) {
		let Mining = require("sites.mining");
		Mining.Run(rmColony, rmHarvest, listSpawnRooms, hasKeepers, listPopulation, listRoute);
	},	
	
    Industry: function(rmColony, listSpawnRooms, listPopulation, listLabs) {
		let Industry = require("sites.industry");
		Industry.Run(rmColony, listSpawnRooms, listPopulation, listLabs);
	},
	
	Reservation: function(rmColony, rmReserve, listSpawnRooms, listPopulation, listRoute) {
		let Reservation = require("sites.reservation");
		Reservation.Run(rmColony, rmReserve, listSpawnRooms, listPopulation, listRoute);
	},

	Colonization: function(rmColony, rmTarget, listRoute) {
		let Colonization = require("sites.colonization");
		Colonization.Run(rmColony, rmTarget, listRoute);
	},
    
	Occupation: function(rmColony, rmOccupy, listSpawnRooms, listArmy, listTargets, listRoute) {
		let Occupation = require("sites.occupation");
		Occupation.Run(rmColony, rmOccupy, listSpawnRooms, listArmy, listTargets, listRoute);
	},
	
	Invasion: function(rmColony, rmInvade, toOccupy, listSpawnRooms, listArmy, listTargets, posRally, listRoute) {
		let Invasion = require("sites.invasion");
		Invasion.Run(rmColony, rmInvade, toOccupy, listSpawnRooms, listArmy, listTargets, posRally, listRoute);
	}
    
};