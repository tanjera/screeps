module.exports = {
    
	Colony: function(rmColony) {
		let Colony = require("sites.colony");
		Colony.Run(rmColony)
	},
	
	Mining: function(rmColony, rmHarvest) {
		let Mining = require("sites.mining");
		Mining.Run(rmColony, rmHarvest);
	},	
	
    Industry: function(rmColony) {
		let Industry = require("sites.industry");
		Industry.Run(rmColony);
	},

	Colonization: function(rmColony, rmTarget) {
		let Colonization = require("sites.colonization");
		Colonization.Run(rmColony, rmTarget);
	},
    
	Occupation: function(rmColony, rmOccupy) {
		let Occupation = require("sites.occupation");
		Occupation.Run(rmColony, rmOccupy);
	},
	
	Invasion: function(rmColony, rmInvade) {
		let Invasion = require("sites.invasion");
		Invasion.Run(rmColony, rmInvade);
	}
    
};