var _Sites = require('_sites');
var _Hive = require('_hive');

module.exports.loop = function () {

    /* TO DO: 
        * industry:
            - add boosting
            - add standing terminal withdraw tasks (but if terminal storage doesn't have... then don't add the task)

        * task system:
            - add dismantle and combat tasks            
            - utilCreep: add resource types to things like 'withdraw'
    */      


    /* Prepare _Hive functions/memory for this tick */
    _Hive.clearDeadMemory();
    _Hive.initMemory();
    _Hive.initTasks();


    /* Colony #1, W18S43 */
    _Sites.Colony('W18S43', 3,                      
            { worker:   {level: 6, amount: 1},
              repairer: {level: 6, amount: 1},
              upgrader: {level: 7, amount: 1} },
            [{id: '57a2465268244ab107a96d5e', role: 'send'},
             {id: '57a24a31e620955e29e63e27', role: 'send'},
             {id: '57a24f9cacbffcb869dc9d21', role: 'receive'},
             {id: '57a25c61958cffd536325056', role: 'receive'}]);
    _Sites.Mining('W18S43', 'W18S43', 2,
            { burrower:  {level: 7, amount: 1},
              carrier:   {level: 7, amount: 2} } );
    _Sites.Industry('W18S43', 2,
            { courier:   {level: 5, amount: 1} },
            { OH:   {action: 'reaction', labs: ['579f9f2549708a4306732b3e', '57bc12855c9bd87c51d9abda', '57bc7f418cd23da102392560'] },
              OH_2: {action: 'reaction', labs: ['57bc412f58d9edd776d1a39e', '57bc12855c9bd87c51d9abda', '57bc7f418cd23da102392560'] },
              GH2O: {action: 'reaction', labs: ['57a0539e25bdfd7a71d9a527', '57a02f90b712db3b1f1c399c', '579f9f2549708a4306732b3e'] } },
            { GH_s:   {type: 'industry', subtype: 'withdraw', resource: 'GH', id: '5784906f1336e9037d76403c', target: '57a02f90b712db3b1f1c399c', timer: 10, creeps: 8, priority: 2 },              
              GH_l:   {type: 'industry', subtype: 'deposit', resource: 'GH', id: '57a02f90b712db3b1f1c399c', timer: 10, creeps: 8, priority: 2 },
              H_s:   {type: 'industry', subtype: 'withdraw', resource: 'H', id: '5784906f1336e9037d76403c', target: '57bc7f418cd23da102392560', timer: 10, creeps: 8, priority: 2 },              
              H_l:   {type: 'industry', subtype: 'deposit', resource: 'H', id: '57bc7f418cd23da102392560', timer: 10, creeps: 8, priority: 2 },
              O_s:   {type: 'industry', subtype: 'withdraw', resource: 'O', id: '5784906f1336e9037d76403c', target: '57bc12855c9bd87c51d9abda', timer: 10, creeps: 8, priority: 2 },              
              O_l:   {type: 'industry', subtype: 'deposit', resource: 'O', id: '57bc12855c9bd87c51d9abda', timer: 10, creeps: 8, priority: 2 },
              GH20_l:  {type: 'industry', subtype: 'withdraw', resource: 'GH2O', id: '57a0539e25bdfd7a71d9a527', timer: 10, creeps: 8, priority: 1 },
              GH20_s:  {type: 'industry', subtype: 'deposit', resource: 'GH2O', id: '5784906f1336e9037d76403c', timer: 10, creeps: 8, priority: 1 },
              OH_l1:  {type: 'industry', subtype: 'withdraw', resource: 'OH', id: '579f9f2549708a4306732b3e', timer: 10, creeps: 8, priority: 1 },
              OH_l2:  {type: 'industry', subtype: 'withdraw', resource: 'OH', id: '57bc412f58d9edd776d1a39e', timer: 10, creeps: 8, priority: 1 },
              OH_s:  {type: 'industry', subtype: 'deposit', resource: 'OH', id: '5784906f1336e9037d76403c', timer: 10, creeps: 8, priority: 1 },
              U_term:  {type: 'industry', subtype: 'withdraw', resource: 'U', id: '57a03063c20303fd1e5e125a', timer: 10, creeps: 8, priority: 2 },
              H_term:  {type: 'industry', subtype: 'withdraw', resource: 'H', id: '57a03063c20303fd1e5e125a', timer: 10, creeps: 8, priority: 2 } } );

    /* Colony #2, W19S42 */
    _Sites.Colony('W19S42', 3,
            { worker:   {level: 7, amount: 2},
              repairer: {level: 6, amount: 1},
              upgrader: {level: 6, amount: 1} },
            [{id: '57a23067cf975f59293d8a28', role: 'send'},
             {id: '57a23201113c59e97f7e364e', role: 'receive'},
             {id: '57a6a9d62d673fac4f21a62a', role: 'receive'}]);    
    _Sites.Mining('W19S42', 'W19S42', 2,
            { burrower:  {level: 6, amount: 1},
              carrier:   {level: 6, amount: 2},              
              extractor: {level: 6, amount: 1} } );

    /* Colony #3, W15S41 */
    _Sites.Colony('W15S41', 3,
            { worker:   {level: 6, amount: 2},
              repairer: {level: 6, amount: 1},
              upgrader: {level: 6, amount: 1} },
            [{id: '57abd1d35c977d2d5fec0d0f', role: 'send'},
             {id: '57bcc544ee84657d138c5866', role: 'send'},            
             {id: '57abe33f4a8b4b5a2f1a2b85', role: 'receive'},
             {id: '57af99d528986c413c0a8f4c', role: 'receive'}]);
    _Sites.Mining('W15S41', 'W15S41', 2,
            { burrower:  {level: 6, amount: 1},
              carrier:   {level: 6, amount: 2},              
              extractor: {level: 6, amount: 2} } );

    /* Colony #4, W15S43 */
    _Sites.Colony('W15S43', 3,
            { worker:   {level: 6, amount: 2},
              repairer: {level: 5, amount: 1},
              upgrader: {level: 6, amount: 1} } );      
    _Sites.Mining('W15S43', 'W15S43', 2,
            { burrower:  {level: 4, amount: 1},
              carrier:   {level: 5, amount: 2} } );
              
    /* Colony #5, W13S41 */
    _Sites.Colony('W13S41', 3,
            { worker:   {level: 4, amount: 3},
              repairer: {level: 4, amount: 1},
              upgrader: {level: 4, amount: 1} } );      
    _Sites.Mining('W13S41', 'W13S41', 3,
            { burrower:  {level: 4, amount: 2},
              carrier:   {level: 4, amount: 3} } );


    /* Remote mining operations for Colony #1, W18S43 */
    _Sites.Mining('W18S43', 'W17S43', 2,
            { burrower:  {level: 7, amount: 1},
              carrier:   {level: 7, amount: 3},
              multirole: {level: 6, amount: 1},
              reserver:  {level: 6, amount: 1} } );
    _Sites.Mining('W18S43', 'W19S43', 2,
            { burrower:  {level: 5, amount: 1},
              carrier:   {level: 5, amount: 2},
              multirole: {level: 5, amount: 1},
              reserver:  {level: 5, amount: 1} } );
    _Sites.Mining('W18S43', 'W17S42', 2,
            { burrower:  {level: 5, amount: 1},
              carrier:   {level: 5, amount: 2},
              multirole: {level: 5, amount: 1},
              reserver:  {level: 5, amount: 1} } );
    
    /* Remote mining operations for Colony #2, W19S42 */
    _Sites.Mining('W19S42', 'W18S42', 2,
            { burrower:  {level: 7, amount: 1},
              carrier:   {level: 7, amount: 3},
              multirole: {level: 6, amount: 1},
              reserver:  {level: 6, amount: 1} } );
    
    /* Remote mining operations for Colony #3, W15S41 */
    _Sites.Mining('W15S41', 'W15S42', 1,
            { burrower:  {level: 5, amount: 1},
              carrier:   {level: 6, amount: 3},
              multirole: {level: 5, amount: 1},
              reserver:  {level: 5, amount: 1} } );
    _Sites.Mining('W15S41', 'W14S42', 2,
            { burrower:  {level: 6, amount: 1},
              carrier:   {level: 6, amount: 3},
              multirole: {level: 5, amount: 1},
              reserver:  {level: 5, amount: 1} } );
    _Sites.Mining('W15S41', 'W16S41', 2,
            { multirole: {level: 3, amount: 1} } );
    _Sites.Mining('W15S41', 'W14S41', 2,
            { multirole: {level: 3, amount: 1} } );
    _Sites.Mining('W15S41', 'W16S42', 3,
            { burrower:  {level: 6, amount: 1},
              carrier:   {level: 6, amount: 3},
              multirole: {level: 5, amount: 1},
              reserver:  {level: 5, amount: 1} },
            ['W15S41', 'W16S41', 'W16S42']);
    
    /* Remote mining operations for Colony #4, W15S43 */
    _Sites.Mining('W15S43', 'W15S45', 0,
            { burrower:  {level: 5, amount: 4},
              carrier:   {level: 5, amount: 12, body: 'all-terrain'},
              multirole: {level: 5, amount: 1} } );

    /* Remote mining operations for Colony #5, W13S41 */
    _Sites.Mining('W13S41', 'W12S41', 1,
            { burrower:  {level: 4, amount: 1},
              carrier:   {level: 4, amount: 3},
              multirole: {level: 4, amount: 1},
              reserver:  {level: 4, amount: 1} } );
    _Sites.Mining('W13S41', 'W13S42', 2,
            { burrower:  {level: 4, amount: 1},
              carrier:   {level: 4, amount: 3},
              multirole: {level: 4, amount: 1},
              reserver:  {level: 4, amount: 1} } );

    /* Run end-tick _Hive functions */
    _Hive.processSpawnRequests();
    _Hive.processSpawnRenewing();
}
