import Phaser from 'phaser';

export default class GameOverScene extends Phaser.Scene {
  constructor() {
    super('GameOverScene');
  }

  create({ score = 0 }) {
    const { width, height } = this.scale;
    const cx = width / 2;
    const cy = height / 2;

    // Dark overlay
    this.add.rectangle(cx, cy, width, height, 0x000000, 0.75);

    this.add.text(cx, cy - 100, 'GAME OVER', {
      fontSize: '56px',
      color: '#e74c3c',
      stroke: '#000000',
      strokeThickness: 6,
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(cx, cy - 30, `Final Score: ${score}`, {
      fontSize: '28px',
      color: '#ffffff',
    }).setOrigin(0.5);

    // Retry button
    const retryBtn = this.add.text(cx, cy + 50, 'RETRY', {
      fontSize: '28px',
      color: '#2ecc71',
      backgroundColor: '#1a1a2e',
      padding: { x: 20, y: 10 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    retryBtn.on('pointerover', () => retryBtn.setColor('#27ae60'));
    retryBtn.on('pointerout', () => retryBtn.setColor('#2ecc71'));
    retryBtn.on('pointerdown', () => {
      this.cameras.main.fadeOut(300);
      this.cameras.main.on('camerafadeoutcomplete', () => {
        this.scene.start('GameScene', { levelIdx: 0 });
      });
    });

    // Menu button
    const menuBtn = this.add.text(cx, cy + 110, 'MAIN MENU', {
      fontSize: '20px',
      color: '#aaaaaa',
      backgroundColor: '#1a1a2e',
      padding: { x: 16, y: 8 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    menuBtn.on('pointerover', () => menuBtn.setColor('#ffffff'));
    menuBtn.on('pointerout', () => menuBtn.setColor('#aaaaaa'));
    menuBtn.on('pointerdown', () => {
      this.cameras.main.fadeOut(300);
      this.cameras.main.on('camerafadeoutcomplete', () => {
        this.scene.start('MenuScene');
      });
    });

    this.cameras.main.fadeIn(300);
  }
}
