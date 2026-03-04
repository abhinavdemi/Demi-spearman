import { BaseEnemy } from './BaseEnemy.js';

const BOSS_PHASES = {
  level1: [
    { healthThreshold: 1.0, pattern: 'charge',     speed: 120 },
    { healthThreshold: 0.5, pattern: 'rapidFire',  speed: 100 },
    { healthThreshold: 0.25,pattern: 'berserker',  speed: 200 },
  ],
  level2: [
    { healthThreshold: 1.0, pattern: 'charge',     speed: 130 },
    { healthThreshold: 0.6, pattern: 'rapidFire',  speed: 110 },
    { healthThreshold: 0.3, pattern: 'berserker',  speed: 220 },
  ],
  level3: [
    { healthThreshold: 1.0, pattern: 'charge',     speed: 140 },
    { healthThreshold: 0.7, pattern: 'rapidFire',  speed: 120 },
    { healthThreshold: 0.4, pattern: 'spawnMinions', speed: 100 },
    { healthThreshold: 0.2, pattern: 'berserker',  speed: 240 },
  ],
  level4: [
    { healthThreshold: 1.0, pattern: 'charge',     speed: 150 },
    { healthThreshold: 0.7, pattern: 'rapidFire',  speed: 130 },
    { healthThreshold: 0.4, pattern: 'spawnMinions', speed: 110 },
    { healthThreshold: 0.2, pattern: 'berserker',  speed: 260 },
  ],
  level5: [
    { healthThreshold: 1.0, pattern: 'rapidFire',  speed: 140 },
    { healthThreshold: 0.7, pattern: 'charge',     speed: 160 },
    { healthThreshold: 0.4, pattern: 'spawnMinions', speed: 120 },
    { healthThreshold: 0.2, pattern: 'berserker',  speed: 280 },
  ],
  level6: [
    { healthThreshold: 1.0, pattern: 'rapidFire',  speed: 150 },
    { healthThreshold: 0.75,pattern: 'charge',     speed: 170 },
    { healthThreshold: 0.5, pattern: 'spawnMinions', speed: 130 },
    { healthThreshold: 0.25,pattern: 'berserker',  speed: 300 },
  ],
};

export class Boss extends BaseEnemy {
  constructor(scene, x, y, variant = 'level1') {
    super(scene, x, y, 'boss');
    this.variant = variant;
    this.phases = BOSS_PHASES[variant] || BOSS_PHASES.level1;
    this._lastPhase = null;
    this.phaseTimer = 0;
    this.chargeTimer = 0;
  }

  _renderConfig() {
    return {
      bodyColor: 0x922b21,
      headColor: 0xf5cba7,
      limbColor: 0x7b241c,
      hatType: 'tophat',
      capeColor: 0x1a252f,
      accessoryColor: 0xff0000,
      state: this.state,
      walkFrame: this.walkFrame,
      facingLeft: this.facingLeft,
    };
  }

  _getCurrentPhase() {
    const pct = this.health / this.maxHealth;
    let chosen = this.phases[0];
    for (let i = this.phases.length - 1; i >= 0; i--) {
      if (pct <= this.phases[i].healthThreshold) {
        chosen = this.phases[i];
      }
    }
    return chosen;
  }

  update(time, delta, playerContainer) {
    if (this.health <= 0) return;

    const phase = this._getCurrentPhase();
    this.speed = phase.speed;
    this.phaseTimer += delta;

    if (phase !== this._lastPhase) {
      this._lastPhase = phase;
      this.scene.events.emit('boss-phase-change', { boss: this, phase });
    }

    switch (phase.pattern) {
      case 'charge':
        this._chargePattern(time, delta, playerContainer);
        break;
      case 'rapidFire':
        this._rapidFirePattern(time, playerContainer);
        break;
      case 'berserker':
        this._berserkerPattern(time, delta, playerContainer);
        break;
      case 'spawnMinions':
        this._spawnMinionsPattern(time, delta, playerContainer);
        break;
    }

    // Always face player
    const prevFacing = this.facingLeft;
    this.facingLeft = playerContainer.x < this.container.x;
    if (prevFacing !== this.facingLeft) this._dirty = true;

    this._redraw();
  }

  _chargePattern(time, delta, playerContainer) {
    this.chargeTimer += delta;
    if (this.chargeTimer > 2500) {
      this.chargeTimer = 0;
      const dx = playerContainer.x - this.container.x;
      const dir = dx > 0 ? 1 : -1;
      this.container.body.setVelocityX(dir * 450);
      this.state = 'attack';
      this._dirty = true;
      this.scene.time.delayedCall(350, () => {
        this.container.body.setVelocityX(0);
        this.state = 'idle';
        this._dirty = true;
      });
    } else {
      this._moveTowardPlayer(playerContainer, delta);
    }

    if (time - this.lastAttackAt > this.attackRate * 1.5) {
      const dist = Phaser.Math.Distance.Between(
        this.container.x, this.container.y,
        playerContainer.x, playerContainer.y
      );
      if (dist < 80) {
        this.lastAttackAt = time;
        this.scene.events.emit('enemy-attack', { enemy: this, damage: this.damage });
      }
    }
  }

  _rapidFirePattern(time, playerContainer) {
    this._stopMoving();
    if (time - this.lastAttackAt > this.attackRate * 0.6) {
      this.lastAttackAt = time;
      this.state = 'attack';
      this._dirty = true;
      // 3-way spread
      [-20, 0, 20].forEach(yOffset => {
        this.scene.events.emit('enemy-fire', {
          x: this.container.x,
          y: this.container.y - 10,
          targetX: playerContainer.x,
          targetY: playerContainer.y + yOffset,
          damage: this.damage * 0.7,
        });
      });
      this.scene.time.delayedCall(300, () => {
        this.state = 'idle';
        this._dirty = true;
      });
    }
  }

  _berserkerPattern(time, delta, playerContainer) {
    this._moveTowardPlayer(playerContainer, delta);
    if (time - this.lastAttackAt > this.attackRate * 0.5) {
      const dist = Phaser.Math.Distance.Between(
        this.container.x, this.container.y,
        playerContainer.x, playerContainer.y
      );
      if (dist < 70) {
        this.lastAttackAt = time;
        this.scene.events.emit('enemy-attack', { enemy: this, damage: this.damage * 1.5 });
      }
    }
    // Also fire occasionally
    if (time - this.lastAttackAt > this.attackRate * 2) {
      this.lastAttackAt = time;
      this.scene.events.emit('enemy-fire', {
        x: this.container.x,
        y: this.container.y - 10,
        targetX: playerContainer.x,
        targetY: playerContainer.y,
        damage: this.damage,
      });
    }
  }

  _spawnMinionsPattern(time, delta, playerContainer) {
    this._stopMoving();
    if (time - this.lastAttackAt > 4000) {
      this.lastAttackAt = time;
      this.scene.events.emit('boss-spawn-minions', {
        count: 2,
        bossX: this.container.x,
        bossY: this.container.y,
      });
    }
    // Also fire
    if (time - this.lastAttackAt > this.attackRate) {
      this.lastAttackAt = time + this.attackRate / 2; // offset to prevent double-fire
      this.scene.events.emit('enemy-fire', {
        x: this.container.x,
        y: this.container.y - 10,
        targetX: playerContainer.x,
        targetY: playerContainer.y,
        damage: this.damage,
      });
    }
  }
}
