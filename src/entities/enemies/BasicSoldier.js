import { BaseEnemy } from './BaseEnemy.js';

export class BasicSoldier extends BaseEnemy {
  constructor(scene, x, y) {
    super(scene, x, y, 'basicSoldier');
  }

  update(time, delta, playerContainer) {
    if (this.health <= 0) return;

    const dist = Phaser.Math.Distance.Between(
      this.container.x, this.container.y,
      playerContainer.x, playerContainer.y
    );

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
