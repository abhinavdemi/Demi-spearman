import { BaseEnemy } from './BaseEnemy.js';

export class ShieldEnemy extends BaseEnemy {
  constructor(scene, x, y) {
    super(scene, x, y, 'shieldEnemy');
  }

  _renderConfig() {
    return {
      bodyColor: 0x8e44ad,
      headColor: 0xf5cba7,
      limbColor: 0x6c3483,
      hatType: 'helmet',
      hasShield: true,
      state: this.state,
      walkFrame: this.walkFrame,
      facingLeft: this.facingLeft,
    };
  }

  update(time, delta, playerContainer) {
    if (this.health <= 0) return;

    const dist = Phaser.Math.Distance.Between(
      this.container.x, this.container.y,
      playerContainer.x, playerContainer.y
    );

    // Always face player (shield faces player direction)
    const prevFacing = this.facingLeft;
    this.facingLeft = playerContainer.x < this.container.x;
    if (prevFacing !== this.facingLeft) this._dirty = true;

    if (dist > 55) {
      this._moveTowardPlayer(playerContainer, delta);
    } else {
      this._stopMoving();
      if (time - this.lastAttackAt > this.attackRate) {
        this.lastAttackAt = time;
        this.state = 'attack';
        this._dirty = true;
        this.scene.events.emit('enemy-attack', { enemy: this, damage: this.damage });
        this.scene.time.delayedCall(300, () => {
          this.state = 'idle';
          this._dirty = true;
        });
      }
    }

    this._redraw();
  }
}
