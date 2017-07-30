# Implemented, Needs Debugging/Testing

- On colonize(), after claiming controller, _.set() spawn_room and spawn_route.



# Implementing...

- Automatic placement of structures
    - Needs to be limited to maximum of 5 construction sites per room... and then break iteration.
    - Will need to set origins for each room
        - And add the origin field to colonize()
    - Process extractor, links, containers



# To Implement

- Creep ability to request another creep to move/swap spaces
	- If burrower blocked from source, request blocking creep to swap spaces
