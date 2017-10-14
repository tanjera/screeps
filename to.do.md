# Implemented, Needs Debugging/Testing	
- test extractor state machine functioning properly (unable to test after delivery bugfix... all minerals empty)


# Implementing...
- log.boosts...


# To Implement
- Observer -> adjust threat_level

- Center sector mining
	- Create Roles.Dredger: each one claim a source in the room (by memory, in sites.mining)
	- Copy o4kapuk's behavior; burrow, if a source keeper, keep at distance, attack ranged, heal through

- Industry
	- Set of 6 labs (RCL 7) not defining supply1 and supply2 accessible to all labs
	- Needs to define central labs as supply to reach all reactors

	* when defining reactions, splice out labs already defined in boosts!!!!!!! but not empty...
	- @ sites.industry() line ~141: if no reaction available to be assigned, check if any labs need emptying
		- and empty them!
	- refactor industry functions; Refactor industry... write out steps for industry and try to refactor to it
	- In defining labs, if no reaction or boost, if not empty, then empty

	- Log to show all boosts in action... or add to log.labs()


- Roads
	- Roads in colonies- from sources, extractor, and controller to ... ramparts?
	- Roads in remote_mining rooms- from sources to exit tiles

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