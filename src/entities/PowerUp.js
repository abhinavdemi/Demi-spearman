const POWERUP_CONFIG = {
  speedBoost:  { color: 0xf1c40f, label: 'SPEED',   duration: 10000 },
  damageBoost: { color: 0xe74c3c, label: 'DAMAGE',  duration: 15000 },
  shield:      { color: 0x3498db, label: 'SHIELD',  hits: 3 },
  weaponSwap:  { color: 0x9b59b6, label: 'WEAPON' },
};

export class PowerUp {
  constructor(scene, x, y, type) {
    this.scene = scene;
    this.type = type;
    const cfg = POWERUP_CONFIG[type];

    const texKey = `powerup_${type}`;
    if (!scene.textures.exists(texKey)) {
      const g = scene.make.graphics({ add: false });
      g.fillStyle(cfg.color, 1);
      g.fillCircle(12, 12, 10);
      g.lineStyle(2.5, 0xffffff, 0.9);
      g.strokeCircle(12, 12, 10);
      // Label letter
      g.generateTexture(texKey, 24, 24);
      g.destroy();
    }

    this.sprite = scene.physics.add.sprite(x, y, texKey);
    this.sprite.body.setAllowGravity(false);
    this.sprite.setData('type', type);
    this.sprite.setDepth(8);
    this.startY = y;

    // Glow tween
    scene.tweens.add({
      targets: this.sprite,
      alpha: { from: 0.6, to: 1 },
      duration: 600,
      yoyo: true,
      repeat: -1,
    });

    // Label text
    this.label = scene.add.text(x, y - 20, cfg.label, {
      fontSize: '10px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5).setDepth(9);
  }

  update(time) {
    if (!this.sprite.active) return;
    this.sprite.y = this.startY + Math.sin(time / 750) * 8;
    this.label.x = this.sprite.x;
    this.label.y = this.sprite.y - 20;
  }

  applyTo(player) {
    const cfg = POWERUP_CONFIG[this.type];
    switch (this.type) {
      case 'speedBoost':
        player.applySpeedBoost(cfg.duration);
        break;
      case 'damageBoost':
        player.applyDamageBoost(cfg.duration);
        break;
      case 'shield':
        player.applyShield(cfg.hits);
        break;
      case 'weaponSwap': {
        const options = player.unlockedWeapons.filter(w => w !== player.currentWeapon);
        if (options.length > 0) {
          const pick = Phaser.Math.RND.pick(options);
          player.currentWeaponIndex = player.unlockedWeapons.indexOf(pick);
          player._dirty = true;
        }
        break;
      }
    }
    this.label.destroy();
    this.sprite.destroy();
  }

  destroy() {
    if (this.label && this.label.active) this.label.destroy();
    if (this.sprite && this.sprite.active) this.sprite.destroy();
  }
}
