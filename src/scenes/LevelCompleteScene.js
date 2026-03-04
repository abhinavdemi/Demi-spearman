import Phaser from 'phaser';

export default class LevelCompleteScene extends Phaser.Scene {
  constructor() {
    super('LevelCompleteScene');
  }

  create({ levelIdx, levelId, score = 0, unlockedWeapons = [], nextLevelIdx, isLastLevel }) {
    const { width, height } = this.scale;
    const cx = width / 2;
    const cy = height / 2;

    // Semi-transparent background
    this.add.rectangle(cx, cy, width, height, 0x000000, 0.7);

    // Panel
    this.add.rectangle(cx, cy, 520, 320, 0x1a1a2e, 0.95);
    this.add.rectangle(cx, cy, 516, 316, 0x000000, 0).setStrokeStyle(2, 0xf1c40f);

    if (isLastLevel) {
      this.add.text(cx, cy - 130, 'VICTORY!', {
        fontSize: '52px',
        color: '#f1c40f',
        stroke: '#000000',
        strokeThickness: 5,
        fontStyle: 'bold',
      }).setOrigin(0.5);
      this.add.text(cx, cy - 75, 'You have defeated all enemies!', {
        fontSize: '20px',
        color: '#2ecc71',
      }).setOrigin(0.5);
    } else {
      this.add.text(cx, cy - 130, `LEVEL ${levelId} COMPLETE!`, {
        fontSize: '40px',
        color: '#f1c40f',
        stroke: '#000000',
        strokeThickness: 5,
        fontStyle: 'bold',
      }).setOrigin(0.5);
    }

    this.add.text(cx, cy - 65, `Score: ${score}`, {
      fontSize: '26px',
      color: '#ffffff',
    }).setOrigin(0.5);

    if (unlockedWeapons && unlockedWeapons.length > 0) {
      this.add.text(cx, cy - 20, 'WEAPONS UNLOCKED:', {
        fontSize: '16px',
        color: '#9b59b6',
        fontStyle: 'bold',
      }).setOrigin(0.5);

      this.add.text(cx, cy + 10, unlockedWeapons.map(w => w.toUpperCase()).join('  ·  '), {
        fontSize: '18px',
        color: '#e8d5f7',
      }).setOrigin(0.5);
    }

    const btnLabel = isLastLevel ? 'PLAY AGAIN' : 'NEXT LEVEL';
    const btn = this.add.text(cx, cy + 80, btnLabel, {
      fontSize: '26px',
      color: '#2ecc71',
      backgroundColor: '#0d0d1a',
      padding: { x: 24, y: 10 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    btn.on('pointerover', () => { btn.setColor('#27ae60'); btn.setScale(1.05); });
    btn.on('pointerout', () => { btn.setColor('#2ecc71'); btn.setScale(1); });
    btn.on('pointerdown', () => {
      this.cameras.main.fadeOut(300);
      this.cameras.main.on('camerafadeoutcomplete', () => {
        if (isLastLevel) {
          this.scene.start('MenuScene');
        } else {
          this.scene.start('GameScene', { levelIdx: nextLevelIdx });
        }
      });
    });

    const menuBtn = this.add.text(cx, cy + 125, 'MAIN MENU', {
      fontSize: '16px',
      color: '#888888',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    menuBtn.on('pointerover', () => menuBtn.setColor('#ffffff'));
    menuBtn.on('pointerout', () => menuBtn.setColor('#888888'));
    menuBtn.on('pointerdown', () => {
      this.cameras.main.fadeOut(300);
      this.cameras.main.on('camerafadeoutcomplete', () => {
        this.scene.start('MenuScene');
      });
    });

    this.cameras.main.fadeIn(400);
  }
}
