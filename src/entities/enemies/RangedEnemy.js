import { BaseEnemy } from './BaseEnemy.js';
import { ENEMIES } from '../../config/enemies.js';

export class RangedEnemy extends BaseEnemy {
  constructor(scene, x, y) {
    super(scene, x, y, 'rangedEnemy');
    this.firingRange = ENEMIES.rangedEnemy.firingRange;
  }

  _renderConfig() {
    return {
      bodyColor: 0xe67e22,
      headColor: 0xf5cba7,
      limbColor: 0xd35400,
      hatType: 'cap',
      accessoryColor: 0xe74c3c,
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

    if (dist > this.firingRange) {
      this._moveTowardPlayer(playerContainer, delta);
    } else {
      this._stopMoving();
      // Keep facing player
      const prevFacing = this.facingLeft;
      this.facingLeft = playerContainer.x < this.container.x;
      if (prevFacing !== this.facingLeft) this._dirty = true;

      if (time - this.lastAttackAt > this.attackRate) {
        this.lastAttackAt = time;
        this.state = 'attack';
        this._dirty = true;
        this.scene.events.emit('enemy-fire', {
          x: this.container.x,
          y: this.container.y - 10,
          targetX: playerContainer.x,
          targetY: playerContainer.y,
          damage: this.damage,
        });
        this.scene.time.delayedCall(300, () => {
          this.state = 'idle';
          this._dirty = true;
        });
      }
    }

    this._redraw();
  }
}
