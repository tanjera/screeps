# Implemented, Needs Debugging/Testing

- On colonize(), after claiming controller, `_.set() spawn_room` and `spawn_route`.
- On colonize(), test that origin and is set properly.
- Placement of roads from base <-> extractor, sources not always being built/rebuilt


# Implementing...

- Automatic placement of structures
    * At RCL 8, create ramparts over all major structures (spawns, nuker)

- Task system: prioritize construction sites based on structureType?



# To Implement

- Creep ability to request another creep to move/swap spaces
	- If burrower blocked from source, request blocking creep to swap spaces
