module.exports = {
    
	Colony: function(rmColony, listSpawnRooms, listPopulation, listLinks) {
		let Colony = require("sites.colony");
		Colony.Run(rmColony, listSpawnRooms, listPopulation, listLinks)
	},
	
	Mining: function(rmColony, rmHarvest, listSpawnRooms, hasKeepers, listPopulation, listRoute) {
		let Mining = require("sites.mining");
		Mining.Run(rmColony, rmHarvest, listSpawnRooms, hasKeepers, listPopulation, listRoute);
	},	
	
    Industry: function(rmColony, listSpawnRooms, listPopulation, listLabs) {
		let Industry = require("sites.industry");
		Industry.Run(rmColony, listSpawnRooms, listPopulation, listLabs);
	},
	
	Reservation: function(rmColony, rmHarvest, listSpawnRooms, listPopulation, listRoute) {
		let Reservation = require("sites.reservation");
		Reservation.Run(rmColony, rmHarvest, listSpawnRooms, listPopulation, listRoute)
	},
    
	Occupation: function(rmColony, rmOccupy, listSpawnRooms, listPopulation, listTargets, listRoute) {
		let Occupation = require("sites.occupation");
		Occupation.Run(rmColony, rmOccupy, listSpawnRooms, listPopulation, listTargets, listRoute);
	},
	
	Invasion: function(rmColony, rmInvade, listSpawnRooms, listArmy, listTargets, posRally, listRoute) {
		let Invasion = require("sites.invasion");
		Invasion.Run(rmColony, rmInvade, listSpawnRooms, listArmy, listTargets, posRally, listRoute);
	}
    
};