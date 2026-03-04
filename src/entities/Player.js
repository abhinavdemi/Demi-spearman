import { StickmanRenderer } from '../rendering/StickmanRenderer.js';
import { WEAPONS } from '../config/weapons.js';

export class Player {
  constructor(scene, x, y) {
    this.scene = scene;
    this.maxHealth = 100;
    this.health = 100;
    this.speed = 200;
    this.jumpVelocity = -500;
    this.facingLeft = false;
    this.state = 'idle';
    this.walkFrame = 0;
    this.walkTimer = 0;
    this.shieldHits = 0;
    this.damageMultiplier = 1;
    this._dirty = true;

    this.unlockedWeapons = ['spear'];
    this.currentWeaponIndex = 0;
    this.lastFiredAt = 0;

    this.container = StickmanRenderer.create(scene, x, y, this._renderConfig());
    this.container.body.setCollideWorldBounds(true);
    this.container.setDepth(10);
  }

  get x() { return this.container.x; }
  get y() { return this.container.y; }
  get body() { return this.container.body; }

  get currentWeapon() {
    return this.unlockedWeapons[this.currentWeaponIndex];
  }

  get weaponConfig() {
    return WEAPONS[this.currentWeapon];
  }

  _renderConfig() {
    return {
      bodyColor: 0x3498db,
      headColor: 0xf5cba7,
      limbColor: 0x2980b9,
      hatType: 'cap',
      capeColor: 0x1a3a5a,
      weaponHolster: this.currentWeapon,
      state: this.state,
      walkFrame: this.walkFrame,
      facingLeft: this.facingLeft,
      accessoryColor: 0x1abc9c,
    };
  }

  update(time, delta, cursors, wasdKeys) {
    const body = this.container.body;
    let moving = false;
    const prevFacing = this.facingLeft;
    const prevState = this.state;
    const prevFrame = this.walkFrame;

    if (cursors.left.isDown || wasdKeys.left.isDown) {
      body.setVelocityX(-this.speed);
      this.facingLeft = true;
      moving = true;
    } else if (cursors.right.isDown || wasdKeys.right.isDown) {
      body.setVelocityX(this.speed);
      this.facingLeft = false;
      moving = true;
    } else {
      body.setVelocityX(0);
    }

    if ((cursors.up.isDown || wasdKeys.up.isDown) && body.blocked.down) {
      body.setVelocityY(this.jumpVelocity);
    }

    if (this.state !== 'hurt' && this.state !== 'dead') {
      this.state = moving ? 'walk' : 'idle';
    }

    if (moving) {
      this.walkTimer += delta;
      if (this.walkTimer > 150) {
        this.walkTimer = 0;
        this.walkFrame = (this.walkFrame + 1) % 4;
        this._dirty = true;
      }
    }

    if (prevFacing !== this.facingLeft || prevState !== this.state || prevFrame !== this.walkFrame) {
      this._dirty = true;
    }

    if (this._dirty) {
      const gfx = this.container.getData('gfx');
      StickmanRenderer.draw(gfx, this._renderConfig());
      this._dirty = false;
    }
  }

  fire(time, targetX, targetY) {
    const weapCfg = this.weaponConfig;
    if (time - this.lastFiredAt < weapCfg.fireRate) return null;
    this.lastFiredAt = time;

    const prevState = this.state;
    this.state = 'attack';
    this._dirty = true;
    this.scene.time.delayedCall(300, () => {
      if (this.state === 'attack') {
        this.state = 'idle';
        this._dirty = true;
      }
    });

    return {
      x: this.container.x,
      y: this.container.y - 10,
      targetX,
      targetY,
      weaponKey: this.currentWeapon,
      damage: weapCfg.damage * this.damageMultiplier,
      range: weapCfg.range,
      type: weapCfg.type,
      aoe: weapCfg.aoe || false,
      aoeRadius: weapCfg.aoeRadius || 0,
      speed: weapCfg.speed,
      facingLeft: this.facingLeft,
    };
  }

  takeDamage(amount) {
    if (this.health <= 0) return;
    if (this.shieldHits > 0) {
      this.shieldHits--;
      // Flash blue
      this.scene.cameras.main.flash(100, 0, 0, 200);
      return;
    }
    this.health = Math.max(0, this.health - amount);
    this.state = 'hurt';
    this._dirty = true;
    this.scene.cameras.main.shake(150, 0.005);

    if (this.health > 0) {
      this.scene.time.delayedCall(400, () => {
        if (this.state === 'hurt') {
          this.state = 'idle';
          this._dirty = true;
        }
      });
    } else {
      this.state = 'dead';
      this._dirty = true;
    }
  }

  switchWeapon(direction) {
    const len = this.unlockedWeapons.length;
    this.currentWeaponIndex = (this.currentWeaponIndex + direction + len) % len;
    this._dirty = true;
  }

  unlockWeapon(key) {
    if (!this.unlockedWeapons.includes(key)) {
      this.unlockedWeapons.push(key);
    }
  }

  applySpeedBoost(duration) {
    this.speed = 320;
    this.scene.time.delayedCall(duration, () => { this.speed = 200; });
  }

  applyDamageBoost(duration) {
    this.damageMultiplier = 2;
    this.scene.time.delayedCall(duration, () => { this.damageMultiplier = 1; });
  }

  applyShield(hits) {
    this.shieldHits = hits;
    this._dirty = true;
  }
}
