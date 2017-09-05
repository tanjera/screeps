# Implemented, Needs Debugging/Testing



# Implementing...
- Remote mining: if a room is not visible
	- Add "scout" body, 1 MOVE
		- Will go initially to ensure room is safe (will not waste larger creep bodies/spawn time)

- Combat
	- Add to_occupy to tactic.waves
	- Use object "tactics" to define actions from a playbook and victory conditions
		- Trickle (constant stream of soldiers, move to room and attack, no rally)
		- Waves (soldiers & healers, rally, attack)
		- Occupation (tactic logic same as "trickle", soldiers, archers, healer)
		- Soak (healer and tough soak tower energy; soldiers move to walls)
	- Armies
		- Only soldiers
		- Soldiers, healers
		- Archers, soldiers, healers
		- Paladins, archers
		- Brawlers?






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

- Implement tower repairing?
	- If not attacking or healing...
	- Check structures if (Game.time % 25 == 0)


- Refactor spawning code in sites.colony() sites.mining(); 
	- Just iterate listPopulation and request each in spawning 
		- Use more priority #s to "sort"

- Colony function
	- Creep ability to request another creep to move/swap spaces
		- If burrower blocked from source, request blocking creep to swap spaces

- Remote Mining
	- Combine colony mining and remote mining under one mining tree in Memory?
	- Creates a road from source to colony
	- Calculating additional carriers assumes all carriers are carrier_AT body type...

- Alliance
	- Sites.Support, help an ally build

- Code Standardization
	? Change all "listRoute" in Memory objects to "route" e.g. colonize()

- Memory Optimization
	- Delete old remote mining data from Memory.rooms... Memory.rooms.rmName.mining-name

- CPU Optimization
	- Replace _.filter(room.find(list)) with room.find(list, {filter: ()}) 
		- Prevents extra step of API cloning array
	- When sequentially calling _.sortBy ... figure out how to combine sorting conditions into 1 statement
		- More _sortBy's * longer arrays to sort == CPU hog.

- Known Bugs
	- If 1 link is within range of multiple targets (controller, source), will make erroneous definitions.