module.exports = {
    
	Colony: function(rmColony, spawnDistance, listPopulation, listLinks) {
		let Colony = require("sites.colony");
		Colony.Run(rmColony, spawnDistance, listPopulation, listLinks)
	},
	
	Mining: function(rmColony, rmHarvest, spawnDistance, hasKeepers, listPopulation, listRoute) {
		let Mining = require("sites.mining");
		Mining.Run(rmColony, rmHarvest, spawnDistance, hasKeepers, listPopulation, listRoute);
	},	
	
    Industry: function(rmColony, spawnDistance, listPopulation, listLabs) {
		let Industry = require("sites.industry");
		Industry.Run(rmColony, spawnDistance, listPopulation, listLabs);
	},
	
	Reservation: function(rmColony, rmHarvest, spawnDistance, listPopulation, listRoute) {
		let Reservation = require("sites.reservation");
		Reservation.Run(rmColony, rmHarvest, spawnDistance, listPopulation, listRoute)
	},
    
	Occupation: function(rmColony, rmOccupy, spawnDistance, listPopulation, listRoute) {
		let Occupation = require("sites.occupation");
		Occupation.Run(rmColony, rmOccupy, spawnDistance, listPopulation, listRoute);
	},
	
	Invasion: function(rmColony, rmInvading, spawnDistance, listArmy, listTargets, posRally, listRoute) {
		let Invasion = require("sites.invasion");
		Invasion.Run(rmColony, rmInvading, spawnDistance, listArmy, listTargets, posRally, listRoute);
	}
    
};