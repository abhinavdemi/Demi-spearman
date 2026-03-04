import Phaser from 'phaser';

export default class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  create() {
    // Generate all projectile textures once
    const textures = [
      { key: 'tex_enemybullet', color: 0xff4444, w: 10, h: 6 },
      { key: 'tex_spear',       color: 0x8B4513, w: 28, h: 5 },
      { key: 'tex_pistol',      color: 0xaaaaaa, w: 10, h: 5 },
      { key: 'tex_uzi',         color: 0xcccccc, w: 7, h: 4 },
      { key: 'tex_machinegun',  color: 0xdddddd, w: 9, h: 4 },
      { key: 'tex_bazooka',     color: 0x556B2F, w: 20, h: 10 },
      { key: 'tex_sword',       color: 0xC0C0C0, w: 40, h: 6 },
      { key: 'tex_bow',         color: 0xd4a017, w: 20, h: 4 },
      { key: 'tex_sniper',      color: 0xff0000, w: 24, h: 3 },
    ];

    textures.forEach(({ key, color, w, h }) => {
      if (!this.textures.exists(key)) {
        const g = this.make.graphics({ add: false });
        g.fillStyle(color);
        g.fillRect(0, 0, w, h);
        g.generateTexture(key, w, h);
        g.destroy();
      }
    });

    // Platform texture
    if (!this.textures.exists('platform')) {
      const g = this.make.graphics({ add: false });
      g.fillStyle(0x4a4a5a);
      g.fillRect(0, 0, 16, 16);
      g.lineStyle(1, 0x6a6a7a);
      g.strokeRect(0, 0, 16, 16);
      g.generateTexture('platform', 16, 16);
      g.destroy();
    }

    this.scene.start('MenuScene');
  }
}
