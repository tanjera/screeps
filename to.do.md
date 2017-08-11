# Implemented, Needs Debugging/Testing
- invade(), occupy()
- invasion(toOccupy) -> occupation
- resources.lab_target()
- resources.to_overflow()
- resources.to_market()
- resources.market_sell(order_name, market_order_id, room_from, amount)
- resources.market_buy(order_name, market_order_id, room_to, amount)



# Implementing...


# To Implement
- Defense
	- If hostile present (not Invader), no towers present, ?? conditions: pop safe mode
	- Towers only target hostiles within ? distance of structures? Or within ? distance of towers and sources?

- Invasion
	- Victory conditions for Sites.Invasion.... e.g. all listTargets are destroyed.

- Colony function
	- Creep ability to request another creep to move/swap spaces
		- If burrower blocked from source, request blocking creep to swap spaces

- Alliance
	- Sites.Support, help an ally build

- Code Standardization
	? Change all "listRoute" in Memory objects to "route" e.g. colonize()

- Misc
	- Set default room controller message via Memory