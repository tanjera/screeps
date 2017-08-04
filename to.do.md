# Implemented, Needs Debugging/Testing

- On colonize(), after claiming controller, `_.set() spawn_room` and `spawn_route`.
- On colonize(), test that origin and is set properly.



# Implementing...

- Automatic placement of structures
    * Check that construction site is not blocked; remove road if blocking.
    * Create road paths for base <-> sources, base <-> mineral
    * At RCL 8, create ramparts over all major structures (spawns, nuker)

- Task system: prioritize construction sites based on structureType?



# To Implement

- Automatic placement of structures
    - Placing links, containers

- Creep ability to request another creep to move/swap spaces
	- If burrower blocked from source, request blocking creep to swap spaces
