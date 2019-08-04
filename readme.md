## screeps

My code for my Screeps account- feel free to use, copy, etc. No guarantee that the code won't drive your colony into the ground though ;)

Note: This is not a fully automated codebase, and has no intention of being fully automated! It is just an interface for controlling your colonies, and manages much of the mundane creep tasks.

### main.js

**The goal for this codebase is to supply a complete interface for players to control their colonies via console commands. This is not a fully automated codebase, and does not aim to be one!** Colony tasks (spawning, building), mining tasks (burrowing, carrying), and many industry functions are all automated. Directing which rooms are to be colonized, the shape and placement of the colonies, goal amount of minerals to stockpile, and all combat functionality all needs to be entered via console commands. For a full list of console commands, type:

`help();`

#### Colonies
Rooms that you own a controller in are automatically run with a preset population of creeps adjusted based on room controller level (RCL) and whether the colony is being assisted in spawning from another, adjacent room. Colony populations are automatically spawned (so long as there is a spawn present! or a room assisting in spawning!) and creeps get to work on construction sites and upgrading the room controller.

#### In-Colony Mining (Local Mining)
Just like colonies are automatically run and populated with a preset population, so is local mining. Miners will spawn and mine based on room level (RCL)... low level colonies utilize miners (all-in-one mining creeps) and mid-level and high-level rooms utilize burrowers and carriers (seperate creeps for mining the source then carrying the energy to storage).

### What You Need To Do

#### Construction Sites: Set Origin Coordinates (esp. For Colony #1)

**This codebase will automate the layout and construction of your base within your colony, based on different pre-fabricated base layouts that are programmed in blueprint.layouts.js and can be visualized in Excel format in base\_layouts/base\_layouts.xlsc!!! Layouts have origins of 0,0 being the top left spawn, not including the defensive walls/buffer space).** Every 200-500 ticks, up to 5 construction sites will be placed automatically. Since your first colony is started via the GUI, for automated base creation, you will need to set the origin point for the top left of your colony like so (and you can set the layout as well, as "default\_horizontal", "default\_vertical", or "default\_compact"):

`blueprint.set_layout(rmName, originX, originY, layoutName);`

If your colony cannot be automatically built in its entirety due to walls being in the way, you can still manually place construction sites for the structures that are blocked (e.g. by terrain), placing them elsewhere. However, if they are destroyed, they will not automatically be rebuilt. For this reason, **see the default base layout in base\_layouts/base\_layouts.xlsx** and try to find adequate space if possible.

Links will automatically be built near sources and the room controller, and will facilitate feeding energy to upgraders.

To manually block off areas from being constructed (such as if the code is trying to build a wall up against a terrain wall, which is a useless waste of energy), you can set off blocked areas defined by start and end (x, y) coordinates. The blocked areas are defined as objects in a list, so you can add multiple blocked areas per room by adding to the list array. You can set them like this:

`blueprint.block_area(rmName, startX, startY, endX, endY);`

If you must manually build structures, you can run the following command to see what structures are available to be built in each colony:

`log.can_build();`

#### Colonize New Rooms

When you are ready to expand to a new room (create a new "colony"), you can use a console command to commit a colonization request to Memory, which will automatically spawn a colonizer (as long as the sending colony has enough energy and extensions, at least RCL 4), and the colonizer will move to the room and claim the controller. If your colonizer will need to travel through 3+ rooms to get there, you may want to include a list\_route to make sure the colonizer takes the quickest route and to avoid pathfinding problems (list_route is a list of rooms in order that you want the creep to travel through, including the room\_from, room\_to, and everything in-between, e.g. ["W1N1", "W1N2", "W2N2", "W3N2"] ... but list\_route is optional). To place a colonization request:

`empire.colonize("room_from", "room_target", {origin: {x: base_origin_x, y: base_origin_y}, name: "default_horizontal"}, [list_route]);`

Once the colonizer claims the new controller, the code-base will remove the colonization request from Memory and start running the new room as a colony _assisted by the colony that sent the colonizer, using the same route as the colonizer_. It will utilize the layout origin for automatically setting construction sites for your base as the colony progresses. You can either set a specific room layout via layout_name, or leave it as null to use the default horizontal layout. If you want to modify or add rooms to assist in the spawning burden, you can modify the spawn\_assist.rooms field for a colony like this:

`empire.spawn_assist(rmToAssist, [listRooms], [listRoute]);`

#### Set Custom Room Functions

Higher level functions for colonies and spawning are available, such as spawning from an adjacent room (spawn\_assist.rooms), routing creeps through a complex series of rooms to assist another colony with spawning (spawn\_assist.list_route). For more information on this, please read the comments placed in main.js- they offer more instruction on how to set the parameters in your Memory.

Note: If you set a custom room population (as shown in main.js' comments), you _must set the entire room's population_ including mining, industry, etc; if you only include colony workers, you won't spawn any miners to fill the spawn and extensions!

#### Remote Mining

Although local mining is run automatically in any room you own a controller, remote mining still needs to be defined via a console command. You can do that like so:

`empire.remote_mining(colony_room, room_to_harvest);`

and it's pretty much that simple. The creep population for the remote mining is automatically chosen, but more complex operations are definitely possible and a few fields are read from Memory, including adjacent room assistance with spawning, spawning of soldiers to accompany miners in rooms that have source keepers, and custom populations for the mining operation, all set through Memory. For example, if you will be mining a room with source keepers and assist in spawning the creeps from an adjacent room, your command would look like this:

`empire.remote_mining(rmHarvest, rmColony, hasKeepers, [listRoute], [listSpawnAssistRooms], [listPopulation]);`

### Spawning and Creep "Levels"

Using the spawn\_assist.rooms Memory fields that can be custom set, the codebase iterates through each spawn and attempts to spawn creeps in order of priority, and within either the colony or any rooms on spawn\_assist.rooms list. This allows a brand new colony to have its creeps spawned from an existing colony several rooms away, or allows multiple established colonies to share the burden of spawning if one colony lacks the energy.

For resource management- to save energy and spawn time- I equated a room's control level ("RCL") with creep "levels" to make sense of spawning. A room may be RCL 6 but only need a level 4 repairer to keep up with the work of repairing structures. If every creep, miner, and remote miner for an RCL 6 room (with 1 spawn) were to be at creep level 6, the spawn may not be able to keep up with the population demand!

### Population Demand

If a colony isn't doing so well- maybe its remote mine was attacked, its colony ran out of energy, or a server restart wiped out the population. Each time the codebase goes to spawn a creep, it tallies up the ideal requested population (a total of listPopulation for all Sites based in that room) and sees how much of the goal population even exists. If main.js defines that W18S43 should have 20 creeps between its colony, mining, and remote mining... but only 10 exist... which means it is at 50% of its goal, then it will spawn the next creep at 50% of its target level. So if the next creep was to have 30 body parts, then it will only spawn with 15. As a colony fills its population to 100%, the spawns will spawn at 100% of the target creep level. For this reason, without needing any adjustments to the code in main.js, a colony can die off (due to attack, lack of energy, server restart) and still revive itself. Miners and burrowers are one of the first to spawn, and they will spawn at low levels with few body parts, and work to renew the colony to its full operations.

### Pulsing

Though the task system helps creeps stay organized as a group, iterating every room and creating a new task list each tick would chew through CPU very quickly. Compiling tasks and processing terminal orders are done on a "pulse" defined by Hive.setPulse(). If the CPU bucket (Game.cpu.bucket) is full, it will pulse every ~8 ticks. If the CPU bucket is half empty, it will pulse every ~30 seconds. If you are entirely out of CPU, it will pulse every ~1 minute. By scaling its CPU usage through pulsing, the codebase won't chew through all your CPU. Depending on how efficient your code edits are, or if you overload your CPU with a massive amount of creeps, you may need to change the frequency of pulses.

### Industry

#### Links

Links are automatically built based on the defined room layout and their functionality is automatically defined. Links built in different places as they are unlocked as your room's controller level (RCL) increases. Initially, links direct the flow of energy from sources to the room controller for upgrading. At higher RCL, links are built near the room's storage to direct energy for stockpiling as well.

#### Labs

So you have some minerals and want your labs to process them? Or boost your creeps? ... well rooms of RCL 6 and above automatically will spawn a courier that will run minerals to labs and terminals for managing reactions. The codebase actually lets you specify in Memory what your goal minerals are, and it will automatically set up reactions in your labs. Note: this is an empire-wide process, _not_ specific to each room- couriers in all of your rooms will start shipping reagents via terminals to different rooms to fill labs to run reactions, automatically!! There is no need for you to manually move minerals except if you want to send them to your friends.

To set reaction targets, "mineral" is the mineral's abbreviation, "amount" is the amount of this mineral that you'd like to generate, and "priority" is any number for you to order your reaction priorities, with 1 being highest priority and 100 being lowest priority:

`resources.lab_target(mineral, amount, priority);`

#### Terminals

Once you have reach RCL 6 a courier will spawn and begin to automatically do a lot of functions for you. For example, if you set up mineral reactions, the code will automatically request other rooms with terminals to load any excess minerals used for the reaction, and send it over! Also, if any rooms have an excess of energy, you can set the "cap_amount" so that when a room reaches the energy cap, it will start to overflow energy into other rooms:

`resources.overflow_cap(cap_amount);`

and any rooms with more energy than the limit will start automatically loading and sending the energy to a terminal in a room with the least amount of energy, balancing out the amount of energy in your empire.

The codebase also will automatically off-load excess minerals and energy, selling them to the market to the highest bidder, but only if you enter manually into Memory the limit at which you want excess minerals to be sold. This is great for selling excess basic minerals, and you can always manually enter market trades for minerals that you don't include in automatic sales. To set up automatic market selling, you can use the following command on the console, where "resource" is the mineral abbreviation (or "energy"!), and "cap_amount" is the amount at which it will start overflowing that resource onto the market:

`resources.market_cap(resource, cap_amount);`

Terminals also process manually entered terminal orders, which you can use to send resources to friends, by using the following manual entries in the console:

* For internal transfers (among your own rooms or to your friends or private trades):

`resources.send(order_name, room_from, room_to, resource, amount);`

* For manual market trading (fulfilling existing buy/sell orders from other players), use the following commands. Note that if you want to buy a mineral, you are purchasing from another player's "sell" order, but since you are buying, you will use `market_buy();`, specifying your room *to* which you want the minerals sent during the purchase (and the 'from' room will be pulled automatically from the player's "sell" order on the market in the server's database). Similarly, if you are selling, you will use `market_sell();` to sell to another player's "buy" order. To do all this, use the following commands:

`resources.market_sell(order_name, market_order_id, room_from, amount);` << to sell your existing minerals/energy
`resources.market_buy(order_name, market_order_id, room_to, amount);` << to buy new minerals/energy

and your courier will to load/unload the terminal, and send/receive minerals and energy to fulfill all terminal orders!

### Attack & Defense

#### Allies

Don't forget to define your allies in Memory, but be careful who you add! Your list of allies is a group of players whose creeps will be able to move through your rooms and interact with your creeps and structures without setting off your defenses. Allies can be set with the following commands:

```
allies.add(ally);
allies.add_list([ally1, ally2, ...]);
allies.remove(ally);
allies.clear();
```

#### Active Defenses

There are several basic automatic defenses built into the code. Towers will choose an enemy creep that enters your rooms and fire on them, so long as they are supplied with energy! When enemy creeps invade your rooms, including your remote mining rooms, soldiers are spawned and sent after the enemy until they are destroyed. All of these basic defenses function automatically.

#### Passive Defenses

Passive defenses (walls and ramparts) are also an integral part of your room's defenses. When you construct a wall or rampart and have a worker or repairer available with energy, it is automatically set to build and repair your walls to a minimum "critical" hitpoint level, and then- as available- repair them to a target "maintenance" hitpoint level. The amount of hitpoints that the code will automatically aim for scales depending on your room's controller level (RCL), from 10K hitpoints at RCL1 to 5M hitpoints at RCL8.

You can change the target hitpoint goal to keep your walls and ramparts at by using the following command:

`empire.wall_target(hitpoints);`

This changes the target hitpoint goal for all rooms. Rooms you colonize afterwards will revert to default target goal. By modifying the Memory object referenced in the console command, you can set the target goal for rooms individually as well.

#### Combat

There is a pipeline in place for entering specific instructions for creeps to initiate combat against targets, creeps, or structures in other rooms utilizing various tactics similar to a playbook. The full list of commands and options can be found under `help("empire");`. Some tactics that are included are:

- "Waves": Spawn a full set of creeps that rally at a specific rally point. Once every creep is at the rally point, they push towards the objective.
- "Trickle": As creeps spawn, they trickle one by one into the objective room as a steady stream.
- "Occupy": Based on "trickle", but utilizing a different army population specifically for maintaining the room under an occupation.
- "Dismantle": Based on "trickle", but utilizing only dismantlers to remove an old set of structures.
- "Tower Drain": Several tanks and healers rally outside an enemy's room. The tanks cross into the room, absorb fire from the towers, then switch out and get healed, draining the towers' energy.
- "Controller": Attack a controller to downgrade it faster.

### Console Commands

There are a number of commands that can be run from the console that are part of the codebase and are essential in growing your Screeps empire. These range from logs to show your resource amounts, to using a "blueprint" feature that saves your room layout (using flags) and will automatically rebuild after an attack, along with a CPU profiler that can show you which functions are using the most CPU. For a full list of console commands, simply go to the console and type:

`help();`

There are also a number of helpful commands that output logs to help keep track of all your different colonies and their different conditions. You can find a list of logs by typing:

`help("log");`

### Advanced Topics

#### Ratio of Colonies to Remote Mining, Source Keeper Mining

CPU optimization and spawn burden (spawn time, spawn amounts, and energy requirements) are a constant focus for the development of this code base. With that said, a lot of focus goes into population balancing to ensure colonies and mining rooms are fully functional but that colonies and creeps are maximizing their potential. Although the code base takes measures to save CPU when running on a low CPU bucket, it is best to keep the CPU bucket full by not over-reaching your colonies' abilities for spawning and CPU usage. The easiest way to balance CPU and spawn burden is to only set up a certain amount of remote mining rooms per colony based on RCL. The following ratios are shown to work best:

- Per RCL 3-6 colony (1 spawn): 2 (2 source) - 3 (1 source) remote mining
- Per RCL 7 colony (2 spawns): 3 (2 source) - 4 (1 source) remote mining
- Per RCL 3-6 colony (3 spawns): 4 (2 source) - 5 (1 source) remote mining; or 2 souce keeper mining with 1 remote mining

#### Custom Populations

When implementing a specific room population, it is best to use the original population object from populations.js or populations.combat.js as a template to modify. Body types and classes can be modified, but *not all classes are implemented for all sites*. For example, mining rooms may not know what to do with a dismantler or a bulldozer creep. This is because different types of rooms use different body types for different functions and implement them differently. If you have trouble with a creep's behavior in a custom set population, feel free to ask the developers for possible updates or implementations.

The following are classes and body types. Note: you can specify any body in the population object for any class without worrying about implementation, so long as they have the proper body parts (you cannot use a healer body to carry energy, but you can use an all-terrain carrier body for a regular carrier class/role). The default matches between class/role and body type is designed to be most effective without needing to be otherwise specified.

- "scout" class; body: "scout", "tank"
- "worker" class; body: "worker", "worker\_at", "multirole"
- "mining" class (includes burrowing, carrying, or combination miner);     body: "burrower", "burrower\_at", "worker", "worker\_at", "carrier", "carrier\_at"
- "courier" class; body: "carrier", "carrier\_at"
- "extractor" class; body: "extractor", "extractor\_rem", "worker", "worker\at"
- "reserver" class; body: "reserver", "reserver\_at"
- "colonizer" class; body: "reserver", "reserver\_at"
- "soldier" class; body: "soldier", "brawler", "paladin", "tank", "multirole"
- "archer" class; body: "archer", "ranger"
- "dismantler" class; body: "dismantler", "bulldozer", "worker", "worker\_at"
- "healer" class; body: "healer"