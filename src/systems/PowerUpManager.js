import { PowerUp } from '../entities/PowerUp.js';

export class PowerUpManager {
  constructor(scene) {
    this.scene = scene;
    this.activePowerUps = [];
  }

  spawn(x, y, type) {
    const pu = new PowerUp(this.scene, x, y, type);
    this.activePowerUps.push(pu);
    this.scene.powerUps.add(pu.sprite);
    return pu;
  }

  getBySprite(sprite) {
    return this.activePowerUps.find(pu => pu.sprite === sprite);
  }

  update(time) {
    this.activePowerUps = this.activePowerUps.filter(pu => {
      if (!pu.sprite.active) {
        if (pu.label && pu.label.active) pu.label.destroy();
        return false;
      }
      return true;
    });
    this.activePowerUps.forEach(pu => pu.update(time));
  }
}
