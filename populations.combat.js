/* Note:
 * Remember, not all creep body types have support for all levels; since sites.combat() sets creep level
 * automatically, only use creeps that have bodies for all RCL levels; see body.js for creep
 * bodies.
*/

Population_Combat__Waves = {
    soldier:    {amount: 3},
    healer:     {amount: 3}
};

Population_Combat__Trickle = {
    soldier:    {amount: 5}
};

Population_Combat__Occupy = {
    soldier:    {amount: 3},
    archer:     {amount: 2},
    healer:     {amount: 1}
};

Population_Combat__Tower_Drain = {
    tank:       {amount: 3},
    healer:     {amount: 3}
};

Population_Combat__Controller = {
    reserver:  {amount: 1, level: 3, body: "reserver_at"}
};