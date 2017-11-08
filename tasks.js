module.exports = {

	assignTask_Industry: function(creep, isRefueling) {
		// Remember: Industry tasks are not mixed with general tasks due to different refresh timers
		let task;

		if (isRefueling) {
			task = _.head(_.sortBy(_.sortBy(_.filter(_.get(Memory, ["rooms", creep.room.name, "industry", "tasks", "list"]),
					t => { return t.type == "industry" && t.subtype == "withdraw" && _.get(t, "creeps") > 0; }),
					t => { return creep.pos.getRangeTo(_.get(t, ["pos", "x"]), _.get(t, ["pos", "y"])); }),
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
			task = _.head(_.sortBy(_.sortBy(_.filter(_.get(Memory, ["rooms", creep.room.name, "industry", "tasks", "list"]),
					t => { return t.type == "industry" && t.subtype == "deposit" && t.resource == res && _.get(t, "creeps") > 0; }),
					t => { return creep.pos.getRangeTo(_.get(t, ["pos", "x"]), _.get(t, ["pos", "y"])); }),
					"priority"));
			if (task != null) {
					this.giveTask(creep, task);
				return;
			}

			// If stuck without a task... drop off energy/minerals in storage... or wait...
			if (_.get(creep, ["carry", "energy"], 0) > 0) {
				task = _.head(_.sortBy(_.filter(_.get(Memory, ["rooms", creep.room.name, "industry", "tasks", "list"]),
						t => { return t.type == "carry" && t.subtype == "deposit" && t.resource == "energy" && _.get(t, "creeps") > 0; }),
						t => { return creep.pos.getRangeTo(_.get(t, ["pos", "x"]), _.get(t, ["pos", "y"])); }));
				if (task != null) {
					this.giveTask(creep, task);
					return;
				} else {
					this.giveTask(creep, {type: "wait", subtype: "wait", timer: 5});
					return;
				}
			} else if (_.sum(creep.carry) > 0 && _.get(creep, ["carry", "energy"], 0) == 0) {
				task = _.head(_.sortBy(_.filter(_.get(Memory, ["rooms", creep.room.name, "industry", "tasks", "list"]),
						t => { return t.type == "carry" && t.subtype == "deposit" && t.resource == "mineral" && _.get(t, "creeps") > 0; }),
						t => { return creep.pos.getRangeTo(_.get(t, ["pos", "x"]), _.get(t, ["pos", "y"])); }));
				if (task != null) {
					this.giveTask(creep, task);
					return;
				} else {
					this.giveTask(creep, {type: "wait", subtype: "wait", timer: 5});
					return;
				}
			} else {
				creep.moveFromSource();
				this.giveTask(creep, {type: "wait", subtype: "wait", timer: 10});
				return;
			}
		}
	},


}