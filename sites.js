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
	
	Combat: function(memory_id) {
		let Combat = require("sites.combat");
		Combat.Run(memory_id);
	}
    
};