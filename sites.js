module.exports = {
    
	Colony: function(rmColony, spawnDistance, listPopulation, listLinks) {
		let Colony = require("sites.colony");
		Colony.Run(rmColony, spawnDistance, listPopulation, listLinks)
	},
	
	Mining: function(rmColony, rmHarvest, spawnDistance, listPopulation, listRoute) {
		let Mining = require("sites.mining");
		Mining.Run(rmColony, rmHarvest, spawnDistance, listPopulation, listRoute);
	},
	
	Mining_SK: function(rmColony, rmHarvest, spawnDistance, idSource, posRally, listPopulation, listRoute) {
		let Mining_SK = require("sites.mining.keeper");
		Mining_SK.Run(rmColony, rmHarvest, spawnDistance, idSource, posRally, listPopulation, listRoute);
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
	}
    
};