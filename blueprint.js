
let Blueprint_Colors = [COLOR_BLUE, COLOR_CYAN];
let Blueprint_Keys = [
	{ structure: "spawn", 			color: COLOR_BLUE, secondaryColor: COLOR_RED },
	{ structure: "extension", 		color: COLOR_BLUE, secondaryColor: COLOR_PURPLE },
	{ structure: "road", 			color: COLOR_BLUE, secondaryColor: COLOR_BLUE },
	{ structure: "constructedWall", color: COLOR_BLUE, secondaryColor: COLOR_CYAN },
	{ structure: "rampart", 		color: COLOR_BLUE, secondaryColor: COLOR_GREEN },
	{ structure: "link", 			color: COLOR_BLUE, secondaryColor: COLOR_YELLOW },
	{ structure: "storage", 		color: COLOR_BLUE, secondaryColor: COLOR_ORANGE },
	{ structure: "tower", 			color: COLOR_BLUE, secondaryColor: COLOR_BROWN },
	{ structure: "observer", 		color: COLOR_BLUE, secondaryColor: COLOR_GREY },
	{ structure: "powerSpawn", 		color: COLOR_BLUE, secondaryColor: COLOR_WHITE },
	{ structure: "extractor", 		color: COLOR_CYAN, secondaryColor: COLOR_RED },
	{ structure: "lab", 			color: COLOR_CYAN, secondaryColor: COLOR_PURPLE },
	{ structure: "terminal", 		color: COLOR_CYAN, secondaryColor: COLOR_BLUE },
	{ structure: "container", 		color: COLOR_CYAN, secondaryColor: COLOR_CYAN },
	{ structure: "nuker", 			color: COLOR_CYAN, secondaryColor: COLOR_GREEN }
];


module.exports = {

	Init: function() {
		let _Hive = require("hive");

		if (_Hive.isPulse_Blueprint()) {
			this.constructAll();
		} else if (_.get(Memory, ["blueprint"]) != null) {
			this.setRooms_Iterate();
		}


		blueprint = new Object();

		blueprint.set = function(rmName) {
			let _BP = require("blueprint");
			_BP.setRoom(rmName);
			return true;
		};

		blueprint.set_all = function() {
			Memory.blueprint = {
				index: 0,
				final: Object.keys(Game.rooms).length,
				rooms: Object.keys(Game.rooms)
			};

			console.log(`<font color=\"#6065FF\">[Blueprint]</font> Memory set- Will set 1 room per tick until complete!`);
			return true;
		}

		blueprint.construct = function(rmName) {
			let _BP = require("blueprint");
			_BP.constructRoom(rmName);
			return true;
		};

		blueprint.construct_all = function(rmName) {
			let _BP = require("blueprint");
			_BP.constructAll();
			return true;
		};
	},

	setRoom: function(rmName) {
		if (Game.rooms[rmName] == null)
			return `<font color=\"#6065FF\">[Blueprint]</font> Blueprint.set() failed: ${rmName} == null`;

		let room = Game.rooms[rmName];
		let myRoom = room.controller ? room.controller.my : false;
		let structures = _.groupBy(room.find(FIND_STRUCTURES).concat(room.find(FIND_CONSTRUCTION_SITES)), s => s.structureType);
		let results = new Object();

		for (let type in structures) {
			if (type == "road" || type == "container"
				|| (myRoom && (type == "spawn" || type == "extension" || type == "constructedWall"
					|| type == "rampart" || type == "link" || type == "storage"
					|| type == "tower" || type == "observer" || type == "powerSpawn"
					|| type == "extractor" || type == "lab" || type == "terminal"
					|| type == "nuker"))) {

				_.forEach(structures[type], s => {
					let flags = s.pos.lookFor("flag");
					let key = _.find(Blueprint_Keys, k => { return k.structure == type; });

					for (let f in flags) {
						let flag = flags[f];
						if (flag.color == key["color"] && flag.secondaryColor == key["secondaryColor"]) {
							results["existed"] = _.get(results, ["existed"], 0) + 1;
							return;
						}
					}

					let result = s.pos.createFlag(`blueprint_${s.pos.roomName}-${s.pos.x}-${s.pos.y}-${s.structureType}`,
						key["color"], key["secondaryColor"]);
					if (_.isString(result))
						results["new"] = _.get(results, ["new"], 0) + 1;
					else
						results[result] = _.get(results, [result], 0) + 1;
				});
			}
		}

		console.log(`<font color=\"#6065FF\">[Blueprint]</font> Set flags for ${rmName}! New: ${results["new"] || 0};  Existed: ${results["existed"] || 0};  `
			+ `Name_Exists: ${results[ERR_NAME_EXISTS] || 0};  Invalid_Args ${results[ERR_INVALID_ARGS] || 0}`);
		return true;
	},

	setRooms_Iterate: function() {
		this.setRoom(Memory.blueprint.rooms[Memory.blueprint.index]);
		Memory.blueprint.index += 1;
		if (Memory.blueprint.index == Memory.blueprint.final) {
			delete Memory.blueprint;
		}
	},

	constructAll: function() {
		for (let room in Game.rooms) {
			this.constructRoom(room);
		}
	},

	constructRoom: function(rmName) {
		if (Game.rooms[rmName] == null)
			return `<font color=\"#6065FF\">[Blueprint]</font> constructRoom() failed: ${rmName} == null`;
		if (Object.keys(Game.constructionSites).length >= 100)
			return `<font color=\"#6065FF\">[Blueprint]</font> constructRoom() failed: Game.constructionSites at maximum!`;

		let result = 0;
		let room = Game.rooms[rmName];
		let flags = room.find(FIND_FLAGS, { filter: (f) => { return Blueprint_Colors.some(c => { return c == f.color; }); }});
		let sites = room.find(FIND_CONSTRUCTION_SITES);
		
		_.forEach(flags, f => {
			if (Object.keys(Game.constructionSites).length >= 100 || Object.keys(sites).length + result >= 10)
				return;			

			if (Object.keys(f.pos.lookFor("structure")).length == 0) {
				let key = _.find(Blueprint_Keys, k => { return k["color"] == f.color && k["secondaryColor"] == f.secondaryColor; })
				if (key != null)
					result += (f.pos.createConstructionSite(key["structure"]) == OK ? 1 : 0);
			}			
		});

		if (result > 0)
			console.log(`<font color=\"#6065FF\">[Blueprint]</font> ${rmName}: ${result} sites created.`);
	}
};