export const ENEMIES = {
  basicSoldier: { health: 50,   speed: 100, damage: 10, type: 'melee',   shieldReduction: 0,    scoreValue: 10,  attackRate: 1000 },
  rangedEnemy:  { health: 40,   speed: 70,  damage: 15, type: 'ranged',  shieldReduction: 0,    scoreValue: 20,  attackRate: 2000, firingRange: 350 },
  shieldEnemy:  { health: 120,  speed: 80,  damage: 12, type: 'melee',   shieldReduction: 0.80, scoreValue: 30,  attackRate: 1200 },
  boss:         { health: 1200, speed: 60,  damage: 25, type: 'boss',    shieldReduction: 0,    scoreValue: 500, attackRate: 800 },
};
