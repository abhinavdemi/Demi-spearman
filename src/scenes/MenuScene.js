import Phaser from 'phaser';
import { StickmanRenderer } from '../rendering/StickmanRenderer.js';

export default class MenuScene extends Phaser.Scene {
  constructor() {
    super('MenuScene');
  }

  create() {
    const { width, height } = this.scale;
    const cx = width / 2;
    const cy = height / 2;

    // Gradient background
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x1a1a2e, 0x1a1a2e, 0x16213e, 0x16213e, 1);
    bg.fillRect(0, 0, width, height);

    // Ground line
    bg.lineStyle(2, 0x4a4a5a);
    bg.lineBetween(0, height - 60, width, height - 60);

    // Decorative stickmen
    this._drawMenuStickmen(width, height);

    // Title
    this.add.text(cx, 80, 'DEMI SPEARMAN', {
      fontSize: '52px',
      color: '#f1c40f',
      stroke: '#000000',
      strokeThickness: 6,
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(cx, 130, 'A Stickman Action Game', {
      fontSize: '18px',
      color: '#aaaaaa',
    }).setOrigin(0.5);

    // Start button
    const startBtn = this.add.text(cx, cy, 'START GAME', {
      fontSize: '32px',
      color: '#2ecc71',
      backgroundColor: '#1a1a2e',
      padding: { x: 24, y: 12 },
      stroke: '#2ecc71',
      strokeThickness: 2,
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    startBtn.on('pointerover', () => {
      startBtn.setColor('#27ae60');
      startBtn.setScale(1.05);
    });
    startBtn.on('pointerout', () => {
      startBtn.setColor('#2ecc71');
      startBtn.setScale(1);
    });
    startBtn.on('pointerdown', () => {
      this.cameras.main.fadeOut(300);
      this.cameras.main.on('camerafadeoutcomplete', () => {
        this.scene.start('GameScene', { levelIdx: 0 });
      });
    });

    // Controls
    this.add.text(cx, cy + 80, 'CONTROLS', {
      fontSize: '20px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    const controls = [
      'Arrow Keys / WASD — Move & Jump',
      'Left Click — Shoot toward cursor',
      'Q / E — Switch Weapon',
      'Mouse wheel — Cycle weapons',
    ];

    controls.forEach((line, i) => {
      this.add.text(cx, cy + 112 + i * 22, line, {
        fontSize: '14px',
        color: '#aaaaaa',
      }).setOrigin(0.5);
    });

    // Weapon list
    this.add.text(cx, cy + 230, '8 WEAPONS: Spear · Pistol · Uzi · Machine Gun · Bazooka · Sword · Bow · Sniper', {
      fontSize: '12px',
      color: '#f1c40f',
    }).setOrigin(0.5);

    this.cameras.main.fadeIn(400);
  }

  _drawMenuStickmen(width, height) {
    // Left stickman
    const gfxL = this.add.graphics();
    gfxL.setPosition(120, height - 70);
    StickmanRenderer.draw(gfxL, {
      bodyColor: 0x3498db,
      limbColor: 0x2980b9,
      hatType: 'cap',
      accessoryColor: 0x1abc9c,
      capeColor: 0x1a3a5a,
      state: 'idle',
      facingLeft: false,
    });

    // Right stickman (enemy)
    const gfxR = this.add.graphics();
    gfxR.setPosition(width - 120, height - 70);
    StickmanRenderer.draw(gfxR, {
      bodyColor: 0xe74c3c,
      limbColor: 0xc0392b,
      hatType: 'helmet',
      state: 'idle',
      facingLeft: true,
    });

    // Animate idle breathing
    this.tweens.add({
      targets: [gfxL, gfxR],
      y: '-=3',
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }
}
