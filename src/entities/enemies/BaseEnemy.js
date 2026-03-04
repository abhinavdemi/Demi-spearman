import { StickmanRenderer } from '../../rendering/StickmanRenderer.js';
import { ENEMIES } from '../../config/enemies.js';

export class BaseEnemy {
  constructor(scene, x, y, type) {
    this.scene = scene;
    this.type = type;
    const cfg = ENEMIES[type];

    this.maxHealth = cfg.health;
    this.health = cfg.health;
    this.speed = cfg.speed;
    this.damage = cfg.damage;
    this.attackRate = cfg.attackRate;
    this.shieldReduction = cfg.shieldReduction;
    this.scoreValue = cfg.scoreValue;

    this.state = 'idle';
    this.walkFrame = 0;
    this.walkTimer = 0;
    this.facingLeft = true;
    this.lastAttackAt = 0;
    this._dirty = true;

    this.container = StickmanRenderer.create(scene, x, y, this._renderConfig());
    this.container.body.setCollideWorldBounds(true);
    this.container.setDepth(5);
  }

  get x() { return this.container.x; }
  get y() { return this.container.y; }

  _renderConfig() {
    return {
      bodyColor: 0xe74c3c,
      headColor: 0xf5cba7,
      limbColor: 0xc0392b,
      hatType: 'helmet',
      state: this.state,
      walkFrame: this.walkFrame,
      facingLeft: this.facingLeft,
    };
  }

  takeDamage(amount, fromFront = true) {
    const reduced = fromFront ? amount * (1 - this.shieldReduction) : amount;
    this.health -= reduced;
    this.state = 'hurt';
    this._dirty = true;

    if (this.health > 0) {
      this.scene.time.delayedCall(250, () => {
        if (this.health > 0) {
          this.state = 'walk';
          this._dirty = true;
        }
      });
    }
    return this.health <= 0;
  }

  update(time, delta, playerContainer) {
    // Override in subclasses
  }

  _moveTowardPlayer(playerContainer, delta) {
    const dx = playerContainer.x - this.container.x;
    const prevFacing = this.facingLeft;
    this.facingLeft = dx < 0;
    const dir = dx > 0 ? 1 : -1;
    this.container.body.setVelocityX(this.speed * dir);

    this.walkTimer += delta;
    if (this.walkTimer > 150) {
      this.walkTimer = 0;
      this.walkFrame = (this.walkFrame + 1) % 4;
      this._dirty = true;
    }

    const prevState = this.state;
    this.state = 'walk';
    if (prevState !== this.state || prevFacing !== this.facingLeft) {
      this._dirty = true;
    }
  }

  _stopMoving() {
    this.container.body.setVelocityX(0);
    if (this.state === 'walk') {
      this.state = 'idle';
      this._dirty = true;
    }
  }

  _redraw() {
    if (this._dirty) {
      const gfx = this.container.getData('gfx');
      StickmanRenderer.draw(gfx, this._renderConfig());
      this._dirty = false;
    }
  }

  destroy() {
    if (this.container && this.container.active) {
      this.container.destroy();
    }
  }
}
