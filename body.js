module.exports = {

    getPartCount: function(body, part) {
        return _.filter(body, p => { return p == part; }).length;
    },

    getBodyCost: function(body) {
        let cost = 0;
        for (let p in body) {
            switch (body[p]) {
                case "move": cost += 50; break;
                case "work": cost += 100; break;
                case "carry": cost += 50; break;
                case "attack": cost += 80; break;
                case "ranged_attack": cost += 150; break;
                case "heal": cost += 250; break;
                case "claim": cost +=600; break;
                case "tough": cost += 10; break;
            }
        }
        return cost;
    },

    
    getBody: function(type, level) {
        switch (type) {
            case "scout": return this.getBody_Scout();
            case "soldier": return this.getBody_Soldier(level);
			case "brawler": return this.getBody_Brawler(level);
            case "paladin": return this.getBody_Paladin(level);
            case "tank": return this.getBody_Tank(level);
            case "archer": return this.getBody_Archer(level);
            case "healer": return this.getBody_Healer(level);
            case "multirole": return this.getBody_Multirole(level);
            case "worker": return this.getBody_Worker(level);
			case "worker_at": return this.getBody_Worker_AT(level);
            case "burrower": return this.getBody_Burrower(level);
			case "burrower_at": return this.getBody_Burrower_AT(level);
			case "extractor": return this.getBody_Extractor(level);
			case "extractor_rem": return this.getBody_Extractor_REM(level);
            case "courier":
            case "carrier": return this.getBody_Carrier(level);
            case "carrier_at": return this.getBody_Carrier_AT(level);
            case "reserver": return this.getBody_Reserver(level);
			case "reserver_at": return this.getBody_Reserver_AT(level);
        }
    },
    

    getBody_Scout: function() {
        return [ // 300 energy, 5x MOVE
            MOVE, MOVE, MOVE, MOVE, MOVE];
    },

	getBody_Soldier: function(level) {
        switch (level) {
            case 1:
                return [ // 130 energy, 1x ATTACK, 1x MOVE                        
                        ATTACK, MOVE ];
            case 2:
                return [ // 390 energy, 3x ATTACK, 3x MOVE
                        ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE];
            case 3:
                return [ // 650 energy, 4x ATTACK, 4x MOVE
                        ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE];
            case 4:
                return [ // 910 energy, 6x ATTACK, 6x MOVE
                        ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE,
						ATTACK, MOVE];
            case 5:
                return [ // 1700 energy, 10x ATTACK, 12x MOVE, 2x RANGED_ATTACK
                        MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK,
						MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK,
						MOVE, MOVE, 
						RANGED_ATTACK, RANGED_ATTACK];
            case 6:
                return [ // 2160 energy, 12x ATTACK, 15x MOVE, 3x RANGED_ATTACK
                        MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK,
						MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK,
						MOVE, ATTACK, MOVE, ATTACK, 
						MOVE, MOVE, MOVE,
						RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK];
            case 7: case 8:
                return [ // 3700 energy, 25x MOVE, 20x ATTACK, 4x RANGED_ATTACK, 1x HEAL
                        MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK,
                        MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK,
                        MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK,
                        MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK,                        
						MOVE, MOVE, MOVE, MOVE, MOVE, 
						RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK,
						HEAL];
        }
	},
	
	getBody_Brawler: function(level) {
        switch (level) {
            default:
                return this.getBody_Soldier(level)
            case 4:
                return [ // 1210 energy, 10 TOUGH, 6x ATTACK, 10x MOVE                        
                        TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH,
                        ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE,
                        ATTACK, MOVE, MOVE, MOVE, MOVE, MOVE];
            case 5:
                return [ // 1700 energy, 11x ATTACK, 15x MOVE, 4x TOUGH
						TOUGH, TOUGH, TOUGH, TOUGH, MOVE, MOVE, MOVE, MOVE,
                        ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE,
						ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE,
						ATTACK, MOVE ];
            case 6:
                return [ // 2160 energy, 14x ATTACK, 19x MOVE, 5x TOUGH
						TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, MOVE, MOVE, MOVE, MOVE, MOVE,
                        ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE,
						ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE,
						ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE ];
            case 7: case 8:
                return [ // 2700 energy, 20x MOVE, 20x ATTACK, 10x TOUGH
                        TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH,
						ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE,
						ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE,
						ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE,
						ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE ];
        }
	},

	getBody_Paladin: function(level) {
        switch (level) {
            default:
				return this.getBody_Soldier(level);
            case 7: case 8:
                return [ // 4450 energy, 25x MOVE, 5x RANGED_ATTACK, 15x ATTACK, 5x HEAL
                        MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE,
						MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE,
						MOVE, MOVE, MOVE, MOVE, MOVE,
						RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, 
						ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK,
						ATTACK, ATTACK, ATTACK, ATTACK, ATTACK,						
						HEAL, HEAL, HEAL, HEAL, HEAL];
        }
    },
    
    getBody_Tank: function(level) {
        switch (level) {
            case 1:
                return [ // 240 energy, 4x TOUGH, 4x MOVE
                    TOUGH, TOUGH, TOUGH, TOUGH, 
                    MOVE, MOVE, MOVE, MOVE];
            case 2:
                return [ // 480 energy, 8x TOUGH, 8x MOVE
                    TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH,
                    MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE];
            case 3:
                return [ // 480 energy, 12x TOUGH, 12x MOVE
                    TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH,
                    TOUGH, TOUGH, 
                    MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE,
                    MOVE, MOVE];
            case 4: case 5: case 6: case 7: case 8:            
                return [ // 1180 energy, 33x TOUGH, 17x MOVE
                    TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH,
                    TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH,
                    TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH,
                    TOUGH, TOUGH, TOUGH,
                    MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE,
                    MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE];
        }
    },
    
    getBody_Archer: function(level) {
        switch (level) {
            default:
				console.log(`Error @ getBody_Archer, ${level} is not a proper number!`);
				return;
            case 1:
                return [ // 200 energy, 1x RANGED_ATTACK, 1x MOVE
                        MOVE, RANGED_ATTACK];
            case 2:
                return [ // 460 energy, 1x TOUGH, 2x RANGED_ATTACK, 3x MOVE
                        TOUGH,
                        MOVE, MOVE, MOVE,
                        RANGED_ATTACK, RANGED_ATTACK];
            case 3:
                return [ // 720 energy, 2x TOUGH, 3x RANGED_ATTACK, 5x MOVE
                        TOUGH, TOUGH,
                        MOVE, MOVE, MOVE, MOVE, MOVE,
                        RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK];
            case 4:
                return [ // 1000 energy, 5x RANGED_ATTACK, 5x MOVE
                        RANGED_ATTACK, MOVE, RANGED_ATTACK, MOVE, RANGED_ATTACK, MOVE, RANGED_ATTACK, MOVE, RANGED_ATTACK, MOVE];
            case 5:
                return [ // 1600 energy, 8x RANGED_ATTACK, 8x MOVE
                        RANGED_ATTACK, MOVE, RANGED_ATTACK, MOVE, RANGED_ATTACK, MOVE, RANGED_ATTACK, MOVE, RANGED_ATTACK, MOVE,
						RANGED_ATTACK, MOVE, RANGED_ATTACK, MOVE, RANGED_ATTACK, MOVE];
            case 6:
                return [ // 2000 energy, 10x RANGED_ATTACK, 10x MOVE
                        RANGED_ATTACK, MOVE, RANGED_ATTACK, MOVE, RANGED_ATTACK, MOVE, RANGED_ATTACK, MOVE, RANGED_ATTACK, MOVE,
						RANGED_ATTACK, MOVE, RANGED_ATTACK, MOVE, RANGED_ATTACK, MOVE, RANGED_ATTACK, MOVE, RANGED_ATTACK, MOVE];
            case 7:
                return [ // 4000 energy, 20x RANGED_ATTACK, 20x MOVE
                        RANGED_ATTACK, MOVE, RANGED_ATTACK, MOVE, RANGED_ATTACK, MOVE, RANGED_ATTACK, MOVE, RANGED_ATTACK, MOVE,
                        RANGED_ATTACK, MOVE, RANGED_ATTACK, MOVE, RANGED_ATTACK, MOVE, RANGED_ATTACK, MOVE, RANGED_ATTACK, MOVE,
                        RANGED_ATTACK, MOVE, RANGED_ATTACK, MOVE, RANGED_ATTACK, MOVE, RANGED_ATTACK, MOVE, RANGED_ATTACK, MOVE,
                        RANGED_ATTACK, MOVE, RANGED_ATTACK, MOVE, RANGED_ATTACK, MOVE, RANGED_ATTACK, MOVE, RANGED_ATTACK, MOVE];
            case 8:
                return [ // 5000 energy, 25x RANGED_ATTACK, 25x MOVE
                        RANGED_ATTACK, MOVE, RANGED_ATTACK, MOVE, RANGED_ATTACK, MOVE, RANGED_ATTACK, MOVE, RANGED_ATTACK, MOVE,
                        RANGED_ATTACK, MOVE, RANGED_ATTACK, MOVE, RANGED_ATTACK, MOVE, RANGED_ATTACK, MOVE, RANGED_ATTACK, MOVE,
                        RANGED_ATTACK, MOVE, RANGED_ATTACK, MOVE, RANGED_ATTACK, MOVE, RANGED_ATTACK, MOVE, RANGED_ATTACK, MOVE,
                        RANGED_ATTACK, MOVE, RANGED_ATTACK, MOVE, RANGED_ATTACK, MOVE, RANGED_ATTACK, MOVE, RANGED_ATTACK, MOVE,
                        RANGED_ATTACK, MOVE, RANGED_ATTACK, MOVE, RANGED_ATTACK, MOVE, RANGED_ATTACK, MOVE, RANGED_ATTACK, MOVE];
        }
	},

    getBody_Healer: function(level) {
        switch (level) {
            case 1: case 2:
                return [ // 300 energy, 1x HEAL, 1x MOVE
                        HEAL, MOVE];
            case 3:
                return [ // 600 energy, 2x HEAL, 2x MOVE                        
                        HEAL, MOVE, HEAL, MOVE];
            case 4:
                return [ // 1200 energy, 4x HEAL, 4x MOVE
                        HEAL, MOVE, HEAL, MOVE, HEAL, MOVE, HEAL, MOVE];
            case 5:
                return [ // 1680 energy, 5x HEAL, 8x MOVE, 3x TOUGH
                        TOUGH, TOUGH, TOUGH,
						MOVE, MOVE, MOVE,						
                        HEAL, MOVE, HEAL, MOVE, HEAL, MOVE, HEAL, MOVE, HEAL, MOVE];
            case 6:
                return [ // 2100 energy, 6x HEAL, 11x MOVE, 5x TOUGH
                        TOUGH, TOUGH, TOUGH, TOUGH, TOUGH,
						MOVE, MOVE, MOVE, MOVE, MOVE,						
                        HEAL, MOVE, HEAL, MOVE, HEAL, MOVE, HEAL, MOVE, HEAL, MOVE, 
                        HEAL, MOVE];
            case 7:
                return [ // 4800 energy, 15x HEAL, 15x MOVE
						TOUGH, TOUGH, TOUGH, TOUGH, TOUGH,
						MOVE, MOVE, MOVE, MOVE, MOVE,                        
                        HEAL, MOVE, HEAL, MOVE, HEAL, MOVE, HEAL, MOVE, HEAL, MOVE, 
                        HEAL, MOVE, HEAL, MOVE, HEAL, MOVE, HEAL, MOVE, HEAL, MOVE, 
                        HEAL, MOVE, HEAL, MOVE, HEAL, MOVE, HEAL, MOVE, HEAL, MOVE];
            case 8:
                return [ // 6300 energy, 20x HEAL, 5x TOUGH, 25x MOVE
                        TOUGH, TOUGH, TOUGH, TOUGH, TOUGH,
						MOVE, MOVE, MOVE, MOVE, MOVE,
                        HEAL, MOVE, HEAL, MOVE, HEAL, MOVE, HEAL, MOVE, HEAL, MOVE, 
                        HEAL, MOVE, HEAL, MOVE, HEAL, MOVE, HEAL, MOVE, HEAL, MOVE, 
                        HEAL, MOVE, HEAL, MOVE, HEAL, MOVE, HEAL, MOVE, HEAL, MOVE, 
                        HEAL, MOVE, HEAL, MOVE, HEAL, MOVE, HEAL, MOVE, HEAL, MOVE];
        }
	},

    getBody_Multirole: function(level) {
        switch (level) {
            case 1:
                return [ // 280 energy, 1x WORK, 1x CARRY, 1x MOVE, 1x ATTACK
                        WORK, CARRY,
                        MOVE,
                        ATTACK];
            case 2:
                return [ // 430 energy, 1x WORK, 2x CARRY, 3x MOVE, 1x ATTACK
                        WORK, CARRY, CARRY,
                        MOVE, MOVE, MOVE,
                        ATTACK];
            case 3:
                return [ // 730 energy, 2x WORK, 3x CARRY, 6x MOVE, 1x ATTACK
                        WORK, WORK, CARRY, CARRY, CARRY,
                        MOVE, MOVE, MOVE, MOVE, MOVE, MOVE,
                        ATTACK];
            case 4:
                return [ // 1110 energy, 3x WORK, 5x CARRY, 8x MOVE, 2x ATTACK
                        WORK, WORK, WORK,
                        CARRY, CARRY, CARRY, CARRY, CARRY,
                        MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE,
                        ATTACK, ATTACK];
            case 5:
                return [ // 1690 energy, 4x WORK, 6x CARRY, 12x MOVE, 1x RANGED_ATTACK, 3x ATTACK
                        WORK, WORK, WORK, WORK,
                        CARRY, CARRY, CARRY, CARRY, CARRY, CARRY,
                        MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE,
                        MOVE, MOVE,
						RANGED_ATTACK, 
                        ATTACK, ATTACK, ATTACK];
            case 6:
                return [ // 2160 energy, 6x WORK, 8x CARRY, 14x MOVE, 2x RANGED_ATTACK, 2x ATTACK
                        WORK, WORK, WORK, WORK, WORK, WORK,
                        CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY,
                        MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE,
                        MOVE, MOVE, MOVE, MOVE,
                        RANGED_ATTACK, RANGED_ATTACK, 
						ATTACK, ATTACK];
            case 7: case 8:
                return [ // 3380 energy, 6x WORK, 10x CARRY, 25x MOVE, 4x RANGED_ATTACK, 5x ATTACK
                        WORK, WORK, WORK, WORK, WORK, WORK,
                        CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY,
                        MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE,
                        MOVE, MOVE, MOVE, MOVE, MOVE, MOVE,                        
						RANGED_ATTACK, MOVE, RANGED_ATTACK, MOVE, RANGED_ATTACK, MOVE, RANGED_ATTACK, MOVE, 
                        ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE];
        }
	},

    getBody_Worker: function(level) {
        switch (level) {
            case 1:
                return [ // 300 energy, 1x WORK, 2x CARRY, 2x MOVE
                        WORK,
                        CARRY, CARRY,
                        MOVE, MOVE];
            case 2:
                return [ // 450 energy, 2x WORK, 2x CARRY, 3x MOVE
                        WORK, WORK,
                        CARRY, CARRY,
                        MOVE, MOVE, MOVE];
            case 3:
                return [ // 700 energy, 3x WORK, 4x CARRY, 4x MOVE
                        WORK, WORK, WORK,
                        CARRY, CARRY, CARRY, CARRY,
                        MOVE, MOVE, MOVE, MOVE,];
            case 4:
                return [ // 1100 energy, 5x WORK, 6x CARRY, 6x MOVE
                        WORK, WORK, WORK, WORK, WORK,
                        CARRY, CARRY, CARRY, CARRY, CARRY, CARRY,
                        MOVE, MOVE, MOVE, MOVE, MOVE, MOVE];
            case 5:
                return [ // 1600 energy, 8x WORK, 8x CARRY, 8x MOVE
                        WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK,
                        CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY,
                        MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE];
            case 6:
                return [ // 2000 energy, 10x WORK, 10x CARRY, 10x MOVE
                        WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK,
                        CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY,
                        MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE];
            case 7:
                return [ // 3000 energy, 15x WORK, 13x CARRY, 17x MOVE
                        WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK,
                        WORK, WORK, WORK, WORK, WORK,
                        CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY,
                        CARRY, CARRY, CARRY,
                        MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE,
                        MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE];
            case 8:
                return [ // 3500 energy, 20x WORK, 13x CARRY, 17 MOVE
                        WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK,
                        WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK,
                        CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY,
                        CARRY, CARRY, CARRY,
                        MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE,
                        MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE];
        }
	},

    getBody_Worker_AT: function(level) {
        switch (level) {
            case 1:
                return [ // 250 energy, 1x WORK, 1x CARRY, 2x MOVE
                        WORK,
                        CARRY,
                        MOVE, MOVE];
            case 2:
                return [ // 400 energy, 2x WORK, 1x CARRY, 3x MOVE
                        WORK, WORK,
                        CARRY,
                        MOVE, MOVE, MOVE];
            case 3:
                return [ // 700 energy, 3x WORK, 3x CARRY, 6x MOVE
                        WORK, WORK, WORK,
                        CARRY, CARRY, CARRY,
                        MOVE, MOVE, MOVE, MOVE, MOVE, MOVE];
            case 4:
                return [ // 1150 energy, 5x WORK, 4x CARRY, 9x MOVE
                        WORK, WORK, WORK, WORK, WORK,
                        CARRY, CARRY, CARRY, CARRY,
                        MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE];
            case 5:
                return [ // 1650 energy, 7x WORK, 6x CARRY, 13x MOVE
                        WORK, WORK, WORK, WORK, WORK, WORK, WORK,
                        CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, 
                        MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE,
						MOVE, MOVE, MOVE];
            case 6:
                return [ // 2200 energy, 10x WORK, 7x CARRY, 17x MOVE
                        WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK,
                        CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY,
                        MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE,
						MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE];
            case 7: case 8:
                return [ // 3100 energy, 15x WORK, 10x CARRY, 25x MOVE
                        WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK,
						WORK, WORK, WORK, WORK, WORK,
                        CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, 
                        MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE,
						MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE,
						MOVE, MOVE, MOVE, MOVE, MOVE];            
        }
	},

    getBody_Burrower: function(level) {
        switch (level) {
            case 1:
                return [ // 300 energy, 2x WORK, 2x MOVE
                        WORK, MOVE, WORK, MOVE];
            case 2:
                return [ // 450 energy, 3x WORK, 3x MOVE
                        WORK, MOVE, WORK, MOVE, WORK, MOVE];
            case 3:
                return [ // 750 energy, 6x WORK, 3x MOVE
                        WORK, WORK, WORK, WORK, WORK, WORK,
                        MOVE, MOVE, MOVE];
            case 4:
                return [ // 1050 energy, 8x WORK, 5x MOVE
                        WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK,
                        MOVE, MOVE, MOVE, MOVE, MOVE];
            case 5:
                return [ // 1500 energy, 12x WORK, 7x MOVE
                        WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK,
                        WORK, WORK,
                        MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE];
            case 6:
                return [ // 1800 energy, 14x WORK, 8x MOVE
                        WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK,
                        WORK, WORK, WORK, WORK,
                        MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE];
            case 7:
                return [ // 2700 energy, 21x WORK, 12x MOVE
                        WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK,
                        WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK,
                        WORK,
                        MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE,
                        MOVE, MOVE];
            case 8:
                return [ // 4000 energy, 30x WORK, 20x MOVE
                        WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK,
                        WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK,
                        WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK,
                        MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE,
                        MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE];
        }
    },

    getBody_Burrower_AT: function(level) {
        switch (level) {
            case 1:
                return [ // 300 energy, 2x WORK, 2x MOVE
                        WORK, MOVE, WORK, MOVE];
            case 2:
                return [ // 450 energy, 3x WORK, 3x MOVE
                        WORK, MOVE, WORK, MOVE, WORK, MOVE];
            case 3:
                return [ // 600 energy, 4x WORK, 4x MOVE
                        WORK, WORK, WORK, WORK,
                        MOVE, MOVE, MOVE, MOVE];
            case 4:
                return [ // 1200 energy, 8x WORK, 8x MOVE
                        WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, 
                        MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE];
            case 5:
                return [ // 1650 energy, 11x WORK, 11x MOVE
                        WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK,
                        WORK, 
                        MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE,
                        MOVE];
            case 6:
                return [ // 2100 energy, 14x WORK, 14x MOVE
                        WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK,
                        WORK, WORK, WORK, WORK, 
                        MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE,
                        MOVE, MOVE, MOVE, MOVE];
            case 7:
                return [ // 3000 energy, 20x WORK, 20x MOVE
                        WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK,
                        WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK,
                        MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE,
                        MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE];
            case 8:
                return [ // 3750 energy, 25x WORK, 25x MOVE
                        WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK,
                        WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK,
                        WORK, WORK, WORK, WORK, WORK,
                        MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE,
                        MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE,
						MOVE, MOVE, MOVE, MOVE, MOVE];
        }
	},
    
    getBody_Dredger: function(level) {
        switch (level) {
            default: 
                return getBody_Burrower(level);
            case 7: case 8:
                return [ // 5250 energy, 10x WORK, 14x MOVE, 10x RANGED_ATTACK, 8X HEAL
                        WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, 
                        MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, 
                        MOVE, MOVE, MOVE, MOVE, 
                        RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, 
                        RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, 
                        HEAL, HEAL, HEAL, HEAL, HEAL, HEAL, HEAL, HEAL ];
        }
    },

    getBody_Dismantler: function(level) {
        switch (level) {
            default: 
                return getBody_Burrower_AT(level);
            case 7: case 8:
                return [ // 3100 energy, 10x TOUGH, 20x WORK, 20x MOVE
                        TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH,
                        WORK, MOVE, WORK, MOVE, WORK, MOVE, WORK, MOVE, WORK, MOVE, 
                        WORK, MOVE, WORK, MOVE, WORK, MOVE, WORK, MOVE, WORK, MOVE, 
                        WORK, MOVE, WORK, MOVE, WORK, MOVE, WORK, MOVE, WORK, MOVE, 
                        WORK, MOVE, WORK, MOVE, WORK, MOVE, WORK, MOVE, WORK, MOVE ];
        }
    },

	getBody_Extractor: function(level) {
        switch (level) {
            case 1:
                return [ // 300 energy, 1x WORK, 2x CARRY, 2x MOVE
                        WORK,
                        CARRY, CARRY,
                        MOVE, MOVE];
            case 2:
                return [ // 450 energy, 2x WORK, 2x CARRY, 3x MOVE
                        WORK, WORK,
                        CARRY, CARRY,
                        MOVE, MOVE, MOVE];
            case 3:
                return [ // 700 energy, 3x WORK, 4x CARRY, 4x MOVE
                        WORK, WORK, WORK,
                        CARRY, CARRY, CARRY, CARRY,
                        MOVE, MOVE, MOVE, MOVE,];
            case 4:
                return [ // 1100 energy, 5x WORK, 6x CARRY, 6x MOVE
                        WORK, WORK, WORK, WORK, WORK,
                        CARRY, CARRY, CARRY, CARRY, CARRY, CARRY,
                        MOVE, MOVE, MOVE, MOVE, MOVE, MOVE];
            case 5:
                return [ // 1600 energy, 8x WORK, 8x CARRY, 8x MOVE
                        WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK,
                        CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY,
                        MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE];
            case 6:
                return [ // 2000 energy, 14x WORK, 4x CARRY, 8x MOVE
                        WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK,
						WORK, WORK, WORK, WORK,
                        CARRY, CARRY, CARRY, CARRY,
                        MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE];
            case 7: case 8:
                return [ // 3750 energy, 25x WORK, 8x CARRY, 17x MOVE
                        WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK,
                        WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK,
						WORK, WORK, WORK, WORK, WORK, 
                        CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY,
                        MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE,
						MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE];
        }
	},

	getBody_Extractor_REM: function(level) {
        switch (level) {
            case 1:
                return [ // 250 energy, 1x WORK, 1x CARRY, 2x MOVE
                        WORK,
                        CARRY,
                        MOVE, MOVE];
            case 2:
                return [ // 400 energy, 2x WORK, 1x CARRY, 3x MOVE
                        WORK, WORK,
                        CARRY,
                        MOVE, MOVE, MOVE];
            case 3:
                return [ // 700 energy, 4x WORK, 2x CARRY, 4x MOVE
                        WORK, WORK, WORK, WORK,
                        CARRY, CARRY,
                        MOVE, MOVE, MOVE, MOVE,];
            case 4:
                return [ // 1050 energy, 6x WORK, 3x CARRY, 6x MOVE
                        WORK, WORK, WORK, WORK, WORK, WORK,
                        CARRY, CARRY, CARRY,
                        MOVE, MOVE, MOVE, MOVE, MOVE, MOVE];
            case 5:
                return [ // 1550 energy, 9x WORK, 5x CARRY, 8x MOVE
                        WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK,
                        CARRY, CARRY, CARRY, CARRY, CARRY,
                        MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE];
            case 6:
                return [ // 2150 energy, 14x WORK, 5x CARRY, 10x MOVE
                        WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK,
						WORK, WORK, WORK, WORK,
                        CARRY, CARRY, CARRY, CARRY, CARRY,
                        MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE];
            case 7: case 8:
                return [ // 3650 energy, 23x WORK, 10x CARRY, 17x MOVE
                        WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK,
                        WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK,
						WORK, WORK, WORK,
                        CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY,
                        MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE,
						MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE];
        }
	},

    getBody_Carrier: function(level) {
        switch (level) {
            case 1:
            		return [ // 300 energy, 3x CARRY, 3x MOVE
                        CARRY, MOVE, CARRY, MOVE, CARRY, MOVE];
            case 2:
                return [ // 400 energy, 4x CARRY, 4x MOVE
                        CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE];
            case 3:
                return [ // 600 energy, 8x CARRY, 4x MOVE
                        CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY,
                        MOVE, MOVE, MOVE, MOVE];
            case 4:
                return [ // 1000 energy, 13x CARRY, 7x MOVE
                        CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY,
                        CARRY, CARRY, CARRY,
                        MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE];
            case 5:
                return [ // 1400 energy, 18x CARRY, 10x MOVE
                        CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY,
                        CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY,
                        MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE];
            case 6:
                return [ // 1800 energy, 24x CARRY, 12 MOVE
                        CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY,
                        CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY,
                        CARRY, CARRY, CARRY, CARRY,
                        MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE,
                        MOVE, MOVE];
            case 7: case 8:
                return [ // 2500 energy, 33x CARRY, 17x MOVE
                        CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY,
                        CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY,
                        CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY,
                        CARRY, CARRY, CARRY,
                        MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE,
                        MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE];
        }
	},

    getBody_Carrier_AT: function(level) {
        switch (level) {
            case 1:
            		return [ // 300 energy, 3x CARRY, 3x MOVE
                        CARRY, MOVE, CARRY, MOVE, CARRY, MOVE];
            case 2:
                return [ // 400 energy, 4x CARRY, 4x MOVE
                        CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE];
            case 3:
                return [ // 600 energy, 6x CARRY, 6x MOVE
                        CARRY, CARRY, CARRY, CARRY, CARRY, CARRY,
                        MOVE, MOVE, MOVE, MOVE, MOVE, MOVE];
            case 4:
                return [ // 1000 energy, 10x CARRY, 10x MOVE
                        CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY,
                        MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE];
            case 5:
                return [ // 1400 energy, 14x CARRY, 14x MOVE
                        CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY,
                        CARRY, CARRY, CARRY, CARRY,
                        MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE,
                        MOVE, MOVE, MOVE, MOVE];
            case 6:
                return [ // 1800 energy, 18x CARRY, 18 MOVE
                        CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY,
                        CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY,
                        MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE,
                        MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE];
            case 7: case 8:
                return [ // 2500 energy, 25x CARRY, 25x MOVE
                        CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY,
                        CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY,
                        CARRY, CARRY, CARRY, CARRY, CARRY,
                        MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE,
                        MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE,
                        MOVE, MOVE, MOVE, MOVE, MOVE];
        }
	},

    getBody_Reserver: function(level) {
        switch (level) {
            case 1: case 2:
                return null;
            case 3: case 4:
                return [ // 650 energy, 1x CLAIM, 1x MOVE
                        CLAIM, MOVE];
            case 5: case 6: case 7: case 8:
                return [ // 1300 energy, 2x CLAIM, 2x MOVE
                        CLAIM, CLAIM, MOVE, MOVE];
        }
    },

    getBody_Reserver_AT: function(level) {
        switch (level) {
            case 1: case 2:
                return null;
            case 3:
				return [ // 750 energy, 1x CLAIM, 3x MOVE
                        CLAIM, MOVE, MOVE, MOVE];
            case 4:
                return [ // 850 energy, 1x CLAIM, 5x MOVE
                        CLAIM, MOVE, MOVE, MOVE, MOVE, MOVE];
            case 5: case 6: case 7: case 8:
                return [ // 1700 energy, 2x CLAIM, 10x MOVE
                        CLAIM, CLAIM, 
						MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE];
        }
    },
};