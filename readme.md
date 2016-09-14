## screeps

My code for my Screeps account- feel free to use, copy, etc. No guarantee that the code won't drive your colony into the ground though ;)

### main.js

I wrote the codebase so that the *only* editing that needs to be done is in main.js. You can define your colonies, mining sites, terminal and lab setups, rooms that you want reserved, rooms that you want a military presence in- all of that is defined in main.js using a Sites.Colony(), defined as `function(rmColony, spawnDistance, listPopulation, listLinks)`. For example:

`Sites.Colony("W18S43", 2,
	{ worker:   {level: 7, amount: 1},
	  repairer: {level: 5, amount: 1} },
	[ {id: "57a2465268244ab107a96d5e", role: "send"},
	  {id: "57a24a31e620955e29e63e27", role: "send"},
	  {id: "57a24f9cacbffcb869dc9d21", role: "receive"},
	  {id: "57a25c61958cffd536325056", role: "receive"} ] );`

This example shows the definition of a colony at room W18S43 that will spawn its creeps from up to 2 rooms away, with a goal population of a worker and a repairer of different levels (body levels are defined in util.creep.js), and with 4 links (2 of which send energy, and 2 of which receive).

Each colony needs to mine, so then there is a source mining site which, depending on the arguments, can be an in-colony mining site, a remote mining site, mineral extraction, or mining of rooms with source keepers. This uses Sites.Mining() defined as `function(rmColony, rmHarvest, spawnDistance, hasKeepers, listPopulation, listRoute)`:

`Sites.Mining("W13S41", "W12S41", 1, false,
	{ burrower:  {level: 4, amount: 1},
	  carrier:   {level: 4, amount: 3},
	  multirole: {level: 4, amount: 1},
	  reserver:  {level: 4, amount: 1} } );`
			  
This example shows a remote mining site one room away from its base colony, which will spawn creeps from spawns up to 1 room away, whose workers don't keep any lookout for source keepers (saving CPU, but non-responsive to invaders!). The goal population is a burrower (literally burrows a pile of energy onto the ground), a carrier (which carries the energy from the pile to the colony), a multi-role creep (builds structures, repairs roads, and attacks invaders!), and a reserver (because a reserved room controller increases the maximum amount of energy in a source!).

### Spawning and Creep "Levels"

Using the spawnDistance argument, the codebase iterates through each spawn and attempts to spawn creeps in order of priority, and within range (spawnDistance) of their future colony. This allows a brand new colony to have its creeps spawned from an existing colony several rooms away, or allows multiple established colonies to share the burden of spawning if one colony lacks the energy.

For resource management- to save energy and spawn time- I equated a room's control level ("RCL") with creep "levels" to make sense of spawning. A room may be RCL 6 but only need a level 4 repairer to keep up with the work of repairing structures. If every creep, miner, and remote miner for an RCL 6 room (with 1 spawn) were to be at creep level 6, the spawn may not be able to keep up with the population demand!

### Population Demand

If a colony isn't doing so well- maybe its remote mine was attacked, its colony ran out of energy, or a server restart wiped out the population. Each time the codebase goes to spawn a creep, it tallies up the ideal requested population (a total of listPopulation for all Sites based in that room) and sees how much of the goal population even exists. If main.js defines that W18S43 should have 20 creeps between its colony, mining, and remote mining... but only 10 exist... which means it is at 50% of its goal, then it will spawn the next creep at 50% of its target level. So if the next creep was to have 30 body parts, then it will only spawn with 15. As a colony fills its population to 100%, the spawns will spawn at 100% of the target creep level. For this reason, without needing any adjustments to the code in main.js, a colony can die off (due to attack, lack of energy, server restart) and still revive itself. Miners and burrowers are one of the first to spawn, and they will spawn at low levels with few body parts, and work to renew the colony to its full operations.

### Task System

To save CPU and prevent 3 creeps from trying to do a job that only takes 1 creep, I implemented a task system. Every pulse cycle (see "Pulsing"- but at a full CPU bucket, this is roughly every 8 ticks), the codebase scans all active rooms and compiles a task list to memory. Every creep without a task will search through the task list and pick up a task. Some tasks have a creep limit of 1 or 2 creeps, to limit 2 creeps from picking up the same small pile of energy. Creeps will continue to run the task until it is complete or until a specified timer runs out. Tasks are also automatically sorted by priority, for example, carriers will deposit energy into the spawn before depositing excess into storage. The Sites.Industry() system also creates tasks of an "industry" type for couriers (mineral carriers) to load and unload labs, terminals, and storage.

### Pulsing

Though the task system helps creeps stay organized as a group, iterating every room and creating a new task list each tick would chew through CPU very quickly. Compiling tasks and processing terminal orders are done on a "pulse" defined by Hive.isPulse(). If the CPU bucket (Game.cpu.bucket) is full, it will pulse every ~8 ticks. If the CPU bucket is half empty, it will pulse every ~30 seconds. If you are entirely out of CPU, it will pulse every ~1 minute. By scaling its CPU usage through pulsing, the codebase won't chew through all your CPU. Depending on how efficient your code edits are, or if you overload your CPU with a massive amount of creeps, you may need to change the frequency of pulses.

### Industry

#### Labs

So you have some minerals and want your labs to process them? Or boost your creeps? In main.js, you can define a Sites.Industry like so:

`Sites.Industry("W18S43", 2,
	{ courier:   {level: 5, amount: 1} },            
	[ { action: "reaction", amount: 5000,
		reactor: {mineral: "G", lab: "57bc412f58d9edd776d1a39e"}, 
		supply1: {mineral: "UL", lab: "57ca9ba307e97e58106a3eeb"}, 
		supply2: {mineral: "ZK", lab: "57a0539e25bdfd7a71d9a527"} } ]);`

Which specifies that in room W18S43, we want one courier (that can be spawned up to 2 rooms away). This courier will do all tasks that are automatically generated to meet the needs of the rest of the Sites.Industry() statement. We also want a lab (the reactor) to combine the minerals in the supply labs (supply1, supply2), until the room contains up to 5000 in storage.



















