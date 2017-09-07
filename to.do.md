# Implemented, Needs Debugging/Testing	
- Sites.Combat: use_boosts



# Implementing...
- Tactics: keeper-kite (zookeeper), keeper-wipe (paladin)

- Implement dismantler role (copy soldier role?)

- If a soldier's target has an adjacent rampart, stand on the rampart.

- If room has hostiles (not invaders), turn off all mining
	- Disable remote mining (all), local (burrowers, extractors), and stop carrier tasks from containers!
	


# To Implement

- If ANY colony has hostiles (that are not Invaders), pause upgrading in ALL rooms (frees up energy to transfer...)
	- Just set field to Memory on surveyRoom (sites.colony) and remove upgrading from tasks.compile.js- easiest way...

- log.labs show active boosts? Or add a log.boosts...

- Set of 6 labs (RCL 7) not defining supply1 and supply2 accessible to all labs
	- Needs to define central labs as supply to reach all reactors


- Industry
	* when defining reactions, splice out labs already defined in boosts!!!!!!! but not empty...
	- @ sites.industry() line ~141: if no reaction available to be assigned, check if any labs need emptying
		- and empty them!
	- refactor industry functions; Refactor industry... write out steps for industry and try to refactor to it
	- In defining labs, if no reaction or boost, if not empty, then empty

- Log to show all boosts in action... or add to log.labs()


- Refactor spawning code in sites.colony() sites.mining(); 
	- Just iterate listPopulation and request each in spawning 
		- Use more priority #s to "sort"

- Colony function
	- Creep ability to request another creep to move/swap spaces
		- If burrower blocked from source, request blocking creep to swap spaces

- Remote Mining
	- Creates a road from source to colony

- Alliance
	- Sites.Support, help an ally build

- CPU Optimization
	- Replace _.filter(room.find(list)) with room.find(list, {filter: ()}) 
		- Prevents extra step of API cloning array
	- When sequentially calling _.sortBy ... figure out how to combine sorting conditions into 1 statement
		- More _sortBy's * longer arrays to sort == CPU hog.

- Known Bugs
	- If multiple spawns in 1 room start spawning at the same tick, only 1 console.log() reaches output
	- If 1 link is within range of multiple targets (controller, source), will make erroneous definitions.