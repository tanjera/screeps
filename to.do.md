# Implemented, Needs Debugging/Testing
- invade(), occupy()
- invasion(toOccupy) -> occupation
- labs.set_boost()
- labs.clear_boosts()
- all sites()



# Implementing...
- Implement tower repairing?
	- If not attacking or healing...
	- Check structures if (Game.time % 25 == 0)


# To Implement
- Combat
	* All offensive code goes under one pipeline- combat.
	- Use object "tactics" to define actions from a playbook and victory conditions
		- Trickle (spawn, move to room and attack, no rally)
		- Waves (spawn, rally, attack)
		- Forked Waves (2 groups, 2 rallies, attack simultaneous at seperate points)
		- Soak (healer and tough soak tower energy; soldiers move to walls)
	- Armies
		- Only soldiers
		- Soldiers, healers
		- Archers, soldiers, healers
		- Paladins, archers
		- Brawlers?
	- Victory conditions
		- None (continuous)
		- Target list wiped
		- Spawns wiped
		- Buildings wiped

- Defense
	- If hostile present (not Invader), no towers present, ?? conditions: pop safe mode

- Colony function
	- Creep ability to request another creep to move/swap spaces
		- If burrower blocked from source, request blocking creep to swap spaces

- Remote Mining
	- Creates a road from source to colony

- Alliance
	- Sites.Support, help an ally build

- Code Standardization
	? Change all "listRoute" in Memory objects to "route" e.g. colonize()

- CPU Optimization
	- Replace _.filter(room.find(list)) with room.find(list, {filter: ()}) 
		- Prevents extra step of API cloning array
	- When sequentially calling _.sortBy ... figure out how to combine sorting conditions into 1 statement
		- More _sortBy's * longer arrays to sort == CPU hog.

- Known Bugs
	- If 1 link is within range of multiple targets (controller, source), will make erroneous definitions.