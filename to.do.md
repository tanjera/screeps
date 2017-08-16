# Implemented, Needs Debugging/Testing
- invade(), occupy()
- invasion(toOccupy) -> occupation



# Implementing...
- Console command for setting boost labs
	* Then test to ensure that define_labs() doesn't overwrite boost!



# To Implement
- Defense
	- If hostile present (not Invader), no towers present, ?? conditions: pop safe mode
	- Towers only target hostiles within ? distance of structures? Or within ? distance of towers and sources?

- Invasion
	- Pass "tactics" object to Sites.Invasion- switch() tactic types, modifies army behavior (e.g. moves in a playbook)
	- Victory conditions for Sites.Invasion.... e.g. all listTargets are destroyed.

- Colony function
	- Creep ability to request another creep to move/swap spaces
		- If burrower blocked from source, request blocking creep to swap spaces

- Alliance
	- Sites.Support, help an ally build

- Code Standardization
	? Change all "listRoute" in Memory objects to "route" e.g. colonize()

- Known Bugs
	- If 1 link is within range of multiple targets (controller, source), will make erroneous definitions.

- Misc
	- Set default room controller message via Memory