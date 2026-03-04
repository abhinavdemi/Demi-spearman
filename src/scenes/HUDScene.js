import Phaser from 'phaser';

export default class HUDScene extends Phaser.Scene {
  constructor() {
    super('HUDScene');
  }

  create({ gameScene }) {
    this.gameScene = gameScene;
    this._createHealthBar();
    this._createWeaponBar();
    this._createScoreText();
    this._createWaveText();
    this._createShieldIndicator();
    this._createBossHealthBar();

    this.events.on('update-hud', data => this._updateHUD(data));
    this.events.on('show-wave', data => this._showWaveText(data));
    this.events.on('show-boss-bar', data => this._showBossBar(data));
    this.events.on('update-boss-bar', data => this._updateBossBar(data));
    this.events.on('hide-boss-bar', () => this._hideBossBar());
  }

  _createHealthBar() {
    const bg = this.add.rectangle(12, 12, 204, 22, 0x222222).setOrigin(0, 0).setScrollFactor(0);
    this.healthFill = this.add.rectangle(14, 14, 200, 18, 0x2ecc71).setOrigin(0, 0).setScrollFactor(0);
    this.add.text(220, 14, 'HP', {
      fontSize: '14px', color: '#ffffff', fontStyle: 'bold'
    }).setScrollFactor(0);
    this.healthText = this.add.text(14, 38, '100 / 100', {
      fontSize: '11px', color: '#aaaaaa'
    }).setScrollFactor(0);
  }

  _createWeaponBar() {
    this.weaponText = this.add.text(12, 58, 'SPEAR', {
      fontSize: '15px',
      color: '#f1c40f',
      backgroundColor: '#00000088',
      padding: { x: 6, y: 3 },
      fontStyle: 'bold',
    }).setScrollFactor(0);

    this.weaponSubText = this.add.text(12, 80, '[1/1]', {
      fontSize: '11px',
      color: '#888888',
    }).setScrollFactor(0);
  }

  _createScoreText() {
    this.scoreText = this.add.text(this.scale.width - 10, 12, 'Score: 0', {
      fontSize: '16px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(1, 0).setScrollFactor(0);
  }

  _createWaveText() {
    this.waveText = this.add.text(this.scale.width / 2, 20, '', {
      fontSize: '20px',
      color: '#f1c40f',
      stroke: '#000000',
      strokeThickness: 3,
      fontStyle: 'bold',
    }).setOrigin(0.5, 0).setScrollFactor(0).setAlpha(0);
  }

  _createShieldIndicator() {
    this.shieldText = this.add.text(12, 100, '', {
      fontSize: '13px',
      color: '#3498db',
      fontStyle: 'bold',
    }).setScrollFactor(0);
  }

  _createBossHealthBar() {
    const bw = 400;
    const bx = (this.scale.width - bw) / 2;
    const by = this.scale.height - 40;

    this.bossBarBg = this.add.rectangle(bx - 2, by - 2, bw + 4, 24, 0x222222)
      .setOrigin(0, 0).setScrollFactor(0).setAlpha(0);
    this.bossFill = this.add.rectangle(bx, by, bw, 20, 0xff0000)
      .setOrigin(0, 0).setScrollFactor(0).setAlpha(0);
    this.bossLabel = this.add.text(this.scale.width / 2, by - 16, 'BOSS', {
      fontSize: '14px', color: '#ff4444', fontStyle: 'bold', stroke: '#000', strokeThickness: 2
    }).setOrigin(0.5, 0).setScrollFactor(0).setAlpha(0);

    this._bossMaxHealth = 1;
    this._bossBarWidth = bw;
    this._bossBarX = bx;
  }

  _showBossBar({ name, maxHealth }) {
    this._bossMaxHealth = maxHealth;
    this.bossBarBg.setAlpha(1);
    this.bossFill.setAlpha(1);
    this.bossLabel.setAlpha(1).setText(name || 'BOSS');
  }

  _updateBossBar({ health }) {
    const pct = Math.max(0, health / this._bossMaxHealth);
    this.bossFill.width = this._bossBarWidth * pct;
  }

  _hideBossBar() {
    this.tweens.add({
      targets: [this.bossBarBg, this.bossFill, this.bossLabel],
      alpha: 0,
      duration: 1000,
    });
  }

  _showWaveText({ wave, totalWaves, levelId }) {
    const txt = wave === totalWaves ? `LEVEL ${levelId} — BOSS WAVE!` : `LEVEL ${levelId} — WAVE ${wave}/${totalWaves}`;
    this.waveText.setText(txt).setAlpha(1);
    this.tweens.add({
      targets: this.waveText,
      alpha: 0,
      duration: 600,
      delay: 2000,
    });
  }

  _updateHUD({ health, maxHealth, currentWeapon, unlockedWeapons, shieldHits, score, damageMultiplier, speedBoosted, weaponRange }) {
    // Health bar
    const pct = Math.max(0, health / maxHealth);
    this.healthFill.width = 200 * pct;
    if (pct > 0.5) this.healthFill.setFillStyle(0x2ecc71);
    else if (pct > 0.25) this.healthFill.setFillStyle(0xf39c12);
    else this.healthFill.setFillStyle(0xe74c3c);
    this.healthText.setText(`${Math.ceil(health)} / ${maxHealth}`);

    // Weapon
    const idx = unlockedWeapons.indexOf(currentWeapon);
    this.weaponText.setText(currentWeapon.toUpperCase().replace('GUN', ' GUN'));
    const rangeStr = weaponRange === 80 ? 'MELEE' : `${weaponRange}px`;
    this.weaponSubText.setText(`[${idx + 1}/${unlockedWeapons.length}] Q/E to switch  |  Range: ${rangeStr}`);

    // Active boosts
    let weaponColor = '#f1c40f';
    if (damageMultiplier > 1) weaponColor = '#e74c3c';
    if (speedBoosted) weaponColor = '#f1c40f';
    this.weaponText.setColor(weaponColor);

    // Shield
    if (shieldHits > 0) {
      this.shieldText.setText(`SHIELD: ${shieldHits} hits`);
    } else {
      this.shieldText.setText('');
    }

    // Score
    this.scoreText.setText(`Score: ${score}`);
  }
}
