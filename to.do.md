- update readme.js with changes
	- sites.colony and sites.mining auto-populated for colonies
	
	- fields reading from memory, and how to set 
		- colonies: room assist, custom populations, LINKS
		- resources: to_market, to_overflow


- easier colonization...
	- a sites.colonize()
	- a command to automatically enter the sites.colonize into memory (with args for listSpawnRoom and listRoute...)
	- and once colonized, remove the sites.colonize and let it auto-run sites.colony

- creep ability to request another creep to move/swap spaces
	- if burrower blocked from source, request blocking creep to swap spaces