module.exports = {

	randomName: function() {
		return index = "xxxxxx-xxxxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
				let r = Math.random()*16|0, v = c == "x" ? r : (r&0x3|0x8);
				return v.toString(16);
			});
	},

	addTask: function (rmName, incTask) {
		/* Task format:
			type:       combat | work | mine | carry | energy | industry | wait
			subtype:    pickup | withdraw | deposit | harvest | upgrade | repair | dismantle | attack | defend | heal | wait
			priority:   on a scale of 1-10; only competes with tasks of same type
			structure:  link | storage
			resource:   energy | mineral
			amount:		#
			id:         target gameobject id
			pos:        room position
			timer:      run for x ticks
			goal:       e.g. hp goal for repairing, amount to deposit, etc.
			creeps:     maximum # of creeps to run this task
		 */

		if (incTask == null || _.get(incTask, "key") == null) {
			console.log(`<font color=\"#FF0000">[Error]</font> Task missing key: ${_.get(incTask, "room")} ${_.get(incTask, "type")} ${_.get(incTask, "subtype")}`);
			return;
		}

		if (_.get(Memory, ["rooms", rmName, "tasks_running", incTask.key]) != null)
			_.set(incTask, "creeps", Math.max(0, _.get(incTask, "creeps") - _.keys(Memory["rooms"][rmName]["tasks_running"][incTask.key]).length));

		_.set(Memory, ["rooms", rmName, "tasks", incTask.key], incTask);
	},

	giveTask: function(creep, task) {
		creep.memory.task = task;

		task.room = task.room || creep.room.name;
		task.key = task.key || this.randomName();

		_.set(Memory, ["rooms", task.room, "tasks_running", task.key, creep.name], true);

		if (task["creeps"] != null)
			task["creeps"] -= 1;

		return;
	},

	returnTask: function(creep) {
		let task = creep.memory.task;

		if (task == null)
		    return;

		if (Memory["rooms"][task.room]["tasks_running"] != null && Memory["rooms"][task.room]["tasks_running"][task.key])
			delete Memory["rooms"][task.room]["tasks_running"][task.key][creep.name];
		task.creeps += 1;
		delete creep.memory.task;
	},

	assignTask: function(creep, isRefueling) {
		if (creep.memory.task != null && Object.keys(creep.memory.task).length > 0) {
			return;
		}

		// Assign a boost if needed and available		
		if (creep.ticksToLive > 1100 && !creep.isBoosted()) {
			let task = _.head(_.filter(Memory["rooms"][creep.room.name]["tasks"],
				t => { return t.type == "boost" && t.role == creep.memory.role && t.subrole == creep.memory.subrole; }));
			if (task != null) {
				this.giveTask(creep, task);
				return;
			}
		}

		// Assign role tasks
		switch (creep.memory.role) {			
			case "multirole": case "worker":
				this.assignTask_Work(creep, isRefueling);
				return;

			case "courier":
				this.assignTask_Industry(creep, isRefueling);
				return;

			case "miner": case "burrower": case "carrier":
				this.assignTask_Mine(creep, isRefueling);
				return;

			case "extractor":
				this.assignTask_Extract(creep, isRefueling);
				return;
		}
	},

	assignTask_Work: function(creep, isRefueling) {
		let task;

		if (isRefueling) {
			if (this.goToRoom(creep, creep.memory.room, isRefueling))
				return;

			task = _.head(_.sortBy(_.filter(Memory["rooms"][creep.room.name]["tasks"],
					t => { return t.type == "energy" && t.resource == "energy"						
						&& _.get(t, "creeps") != 0; }),
					t => { return creep.pos.getRangeTo(t.pos.x, t.pos.y); }));
			if (task != null) {
				this.giveTask(creep, task);
				return;
			}

			task = _.head(_.sortBy(_.filter(Memory["rooms"][creep.room.name]["tasks"],
					t => { return t.subtype == "pickup" && t.resource == "energy" && _.get(t, "creeps") != 0; }),
					t => { return creep.pos.getRangeTo(t.pos.x, t.pos.y); }));
			if (task != null) {
				this.giveTask(creep, task);
				return;
			}

			task = _.head(_.sortBy(_.filter(Memory["rooms"][creep.room.name]["tasks"],
					t => { return t.type == "mine" && t.resource == "energy" && _.get(t, "creeps") != 0; }),
					t => { return creep.pos.getRangeTo(t.pos.x, t.pos.y); }));
			if (task != null) {
				this.giveTask(creep, task);
				return;
			}
		} else {
			if (this.goToRoom(creep, creep.memory.room, isRefueling))
				return;

			if (creep.memory.subrole == "repairer") {
				task = _.head(_.sortBy(_.sortBy(_.filter(Memory["rooms"][creep.room.name]["tasks"],
						t => { return t.type == "work" && t.subtype == "repair" && _.get(t, "creeps") != 0; }),
						t => { return creep.pos.getRangeTo(t.pos.x, t.pos.y); }),
						"priority"));
			} else if (creep.memory.subrole == "upgrader") {
				task = _.head(_.sortBy(_.filter(Memory["rooms"][creep.room.name]["tasks"],
						t => { return t.type == "work" && (t.subtype == "upgrade" || t.subtype == "sign") 
						&& _.get(t, "creeps") != 0; }),
						"priority"));
			} else {
				task = _.head(_.sortBy(_.sortBy(_.filter(Memory["rooms"][creep.room.name]["tasks"],
						t => { return t.type == "work" && _.get(t, "creeps") != 0; }),
						t => { return creep.pos.getRangeTo(t.pos.x, t.pos.y); }),
						"priority"));
			}

			if (task != null) {
				this.giveTask(creep, task);
				return;
			} else {
				creep.moveFromSource();
				this.giveTask(creep, {type: "wait", subtype: "wait", timer: 10});
				return;
			}
		}
	},

	assignTask_Industry: function(creep, isRefueling) {
		let task;

		if (isRefueling) {
			task = _.head(_.sortBy(_.sortBy(_.filter(Memory["rooms"][creep.room.name]["tasks"],
					t => { return t.type == "industry" && t.subtype == "withdraw" && _.get(t, "creeps") != 0; }),
					t => { return creep.pos.getRangeTo(t.pos.x, t.pos.y); }),
					"priority"));
			if (task != null) {
				this.giveTask(creep, task);
				return;
			} else {    // If no tasks, then wait
				this.giveTask(creep, {type: "wait", subtype: "wait", timer: 10});
				return;
			}
		} else {
			let res = _.head(_.sortBy(Object.keys(creep.carry), (c) => { return -creep.carry[c]; }));
			task = _.head(_.sortBy(_.sortBy(_.filter(Memory["rooms"][creep.room.name]["tasks"],
					t => { return t.type == "industry" && t.subtype == "deposit" && t.resource == res && _.get(t, "creeps") != 0; }),
					t => { return creep.pos.getRangeTo(t.pos.x, t.pos.y); }),
					"priority"));
			if (task != null) {
					this.giveTask(creep, task);
				return;
			}

			// If stuck without a task... drop off energy/minerals in storage... or wait...
			if (_.get(creep, ["carry", "energy"], 0) > 0) {
				task = _.head(_.sortBy(_.filter(Memory["rooms"][creep.room.name]["tasks"],
						t => { return t.type == "carry" && t.subtype == "deposit" && t.resource == "energy" && _.get(t, "creeps") != 0; }),
						t => { return creep.pos.getRangeTo(t.pos.x, t.pos.y); }));
				if (task != null) {
					this.giveTask(creep, task);
					return;
				}
			} else if (_.sum(creep.carry) > 0 && _.get(creep, ["carry", "energy"], 0) == 0) {
				task = _.head(_.sortBy(_.filter(Memory["rooms"][creep.room.name]["tasks"],
						t => { return t.type == "carry" && t.subtype == "deposit" && t.resource == "mineral" && _.get(t, "creeps") != 0; }),
						t => { return creep.pos.getRangeTo(t.pos.x, t.pos.y); }));
				if (task != null) {
					this.giveTask(creep, task);
					return;
				}
			} else {
				creep.moveFromSource();
				this.giveTask(creep, {type: "wait", subtype: "wait", timer: 10});
				return;
			}
		}
	},

	assignTask_Mine: function(creep, isRefueling) {
		let task;

		if (isRefueling) {
			if (this.goToRoom(creep, creep.memory.room, isRefueling))
				return;

			if (creep.memory.role == "burrower") {
				task = _.head(_.sortBy(_.filter(Memory["rooms"][creep.room.name]["tasks"],
						t => { return t.type == "mine" && t.resource == "energy" && _.get(t, "creeps") != 0; }),
						t => { return creep.pos.getRangeTo(t.pos.x, t.pos.y); }));
				if (task != null) {
					this.giveTask(creep, task);
					return;
				}
			}
			else if (creep.memory.role == "miner" || creep.memory.role == "carrier") {
				task = _.head(_.sortBy(_.sortBy(_.filter(Memory["rooms"][creep.room.name]["tasks"],
						t => { return (t.subtype == "pickup" || t.type == "energy" || t.type == "energy-critical")
							&& (t.structure != "link" || t.role != "upgrade")
							&& _.get(t, "creeps") != 0; }),
						t => { return creep.pos.getRangeTo(t.pos.x, t.pos.y); }),
						"priority"));
				if (task != null) {
					this.giveTask(creep, task);
					return;
				}

				if (creep.getActiveBodyparts("work") > 0) {
					task = _.head(_.sortBy(_.filter(Memory["rooms"][creep.room.name]["tasks"],
						t => { return t.type == "mine" && t.resource == "energy" && _.get(t, "creeps") != 0; }),
						t => { return creep.pos.getRangeTo(t.pos.x, t.pos.y); }));
					if (task != null) {
						this.giveTask(creep, task);
						return;
					}
				}

				if (creep.memory.task == null) {
					// If there is no energy to get... deliver or wait.
					if (_.sum(creep.carry) > creep.carryCapacity * 0.85) {
						creep.memory.state = "delivering";
						return;
					} else {
						creep.moveFromSource();
						this.giveTask(creep, {type: "wait", subtype: "wait", timer: 5});
						return;
					}
				}
			}
		} else {
			if (this.goToRoom(creep, creep.memory.colony, isRefueling))
				return;

			if (_.get(creep, ["carry", "energy"], 0) > 0) {
				task = _.head(_.sortBy(_.sortBy(_.filter(Memory["rooms"][creep.room.name]["tasks"],
						t => { return t.type == "carry" && t.subtype == "deposit" && t.resource == "energy"							
							&& _.get(t, "creeps") != 0; }),
						t => { return creep.pos.getRangeTo(t.pos.x, t.pos.y); }),
						"priority"));
			} else if (_.sum(creep.carry) > 0 && _.get(creep, ["carry", "energy"], 0) == 0) {
				task = _.head(_.sortBy(_.sortBy(_.filter(Memory["rooms"][creep.room.name]["tasks"],
						t => { return t.type == "carry" && t.subtype == "deposit" && t.resource == "mineral" && _.get(t, "creeps") != 0; }),
						t => { return creep.pos.getRangeTo(t.pos.x, t.pos.y); }),
						"priority"));
			}
			if (task != null) {
				this.giveTask(creep, task);
				return;
			}
		}
	},

	assignTask_Extract: function(creep, isRefueling) {
		let task;

		if (isRefueling) {
			if (this.goToRoom(creep, creep.memory.room, isRefueling))
				return;

			task = _.head(_.sortBy(_.sortBy(_.filter(Memory["rooms"][creep.room.name]["tasks"],
				t => { return t.subtype == "pickup" && t.resource == "mineral" && _.get(t, "creeps") != 0; }),
				t => { return creep.pos.getRangeTo(t.pos.x, t.pos.y); }),
					"priority"));
			if (task != null) {
				this.giveTask(creep, task);
				return;
			}

			task = _.head(_.sortBy(_.filter(Memory["rooms"][creep.room.name]["tasks"],
				t => { return t.type == "mine" && t.resource == "mineral" && _.get(t, "creeps") != 0; }),
				t => { return creep.pos.getRangeTo(t.pos.x, t.pos.y); }));
			if (task != null) {
				this.giveTask(creep, task);
				return;
			}

		} else {
			if (this.goToRoom(creep, creep.memory.colony, isRefueling))
				return;

			task = _.head(_.sortBy(_.sortBy(_.filter(Memory["rooms"][creep.room.name]["tasks"],
				t => { return t.type == "carry" && t.subtype == "deposit" && t.resource == "mineral" && _.get(t, "creeps") != 0; }),
				t => { return creep.pos.getRangeTo(t.pos.x, t.pos.y); }),
				"priority"));
			if (task != null) {
				this.giveTask(creep, task);
				return;
			}
		}
	},

	goToRoom: function(creep, room_name, is_refueling) {
		if (creep.room.name != room_name) {
			creep.travelToRoom(room_name, is_refueling);
			return true;
		}
		return false;
	},
}