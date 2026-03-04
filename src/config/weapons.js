export const WEAPONS = {
  spear:      { name: 'Spear',        damage: 50,  fireRate: 800,  range: 400,  type: 'projectile', aoe: false, speed: 600,  unlockLevel: 1 },
  pistol:     { name: 'Pistol',       damage: 35,  fireRate: 400,  range: 500,  type: 'projectile', aoe: false, speed: 650,  unlockLevel: 2 },
  uzi:        { name: 'Uzi',          damage: 20,  fireRate: 150,  range: 400,  type: 'projectile', aoe: false, speed: 700,  unlockLevel: 4 },
  machinegun: { name: 'Machine Gun',  damage: 15,  fireRate: 100,  range: 500,  type: 'projectile', aoe: false, speed: 750,  unlockLevel: 5 },
  bazooka:    { name: 'Bazooka',      damage: 200, fireRate: 2000, range: 600,  type: 'projectile', aoe: true,  speed: 400,  aoeRadius: 100, unlockLevel: 3 },
  sword:      { name: 'Sword',        damage: 80,  fireRate: 600,  range: 80,   type: 'melee',      aoe: false, speed: 0,    unlockLevel: 3 },
  bow:        { name: 'Bow',          damage: 40,  fireRate: 700,  range: 700,  type: 'projectile', aoe: false, speed: 650,  unlockLevel: 6 },
  sniper:     { name: 'Sniper',       damage: 150, fireRate: 1500, range: 1200, type: 'projectile', aoe: false, speed: 1200, unlockLevel: 6 },
};
