export class StickmanRenderer {
  /**
   * Create a Container (physics body) with a Graphics child for drawing.
   * Returns the container. Use container.getData('gfx') to get the Graphics.
   */
  static create(scene, x, y, config = {}) {
    const gfx = scene.add.graphics();
    const container = scene.add.container(x, y, [gfx]);
    container.setData('gfx', gfx);

    scene.physics.add.existing(container);
    container.body.setSize(22, 52);
    container.body.setOffset(-11, -26);

    StickmanRenderer.draw(gfx, config);
    return container;
  }

  /**
   * Draw a stickman into the provided Graphics object.
   * Call gfx.clear() automatically, then redraw everything.
   */
  static draw(gfx, config = {}) {
    const {
      bodyColor = 0xffffff,
      headColor = 0xf5cba7,
      limbColor = 0xffffff,
      hatType = null,
      capeColor = null,
      weaponHolster = null,
      state = 'idle',
      walkFrame = 0,
      facingLeft = false,
      accessoryColor = 0xffd700,
      hasShield = false,
      scale = 1,
    } = config;

    gfx.clear();

    const sx = facingLeft ? -1 : 1;

    // Cape (behind everything)
    if (capeColor) {
      StickmanRenderer._drawCape(gfx, capeColor, state, walkFrame, sx);
    }

    // Head
    gfx.fillStyle(headColor);
    gfx.fillCircle(0, -20, 7);
    gfx.lineStyle(1.5, 0x333333);
    gfx.strokeCircle(0, -20, 7);

    // Eyes
    gfx.fillStyle(0x333333);
    gfx.fillCircle(sx * 2.5, -21, 1.5);

    // Torso
    gfx.lineStyle(3, bodyColor);
    gfx.beginPath();
    gfx.moveTo(0, -13);
    gfx.lineTo(0, 5);
    gfx.strokePath();

    // Arms
    const arms = StickmanRenderer._getArmAngles(state, walkFrame);
    gfx.lineStyle(2, limbColor);

    gfx.beginPath();
    gfx.moveTo(0, -10);
    gfx.lineTo(sx * -14 * Math.cos(arms.left), -10 + 14 * Math.sin(arms.left));
    gfx.strokePath();

    gfx.beginPath();
    gfx.moveTo(0, -10);
    gfx.lineTo(sx * 14 * Math.cos(arms.right), -10 + 14 * Math.sin(arms.right));
    gfx.strokePath();

    // Legs
    const legs = StickmanRenderer._getLegAngles(state, walkFrame);
    gfx.lineStyle(2.5, limbColor);

    gfx.beginPath();
    gfx.moveTo(0, 5);
    gfx.lineTo(-9 * Math.cos(legs.left), 5 + 20 * Math.sin(legs.left));
    gfx.strokePath();

    gfx.beginPath();
    gfx.moveTo(0, 5);
    gfx.lineTo(9 * Math.cos(legs.right), 5 + 20 * Math.sin(legs.right));
    gfx.strokePath();

    // Hat
    if (hatType) {
      StickmanRenderer._drawHat(gfx, hatType, accessoryColor);
    }

    // Weapon holster indicator
    if (weaponHolster) {
      StickmanRenderer._drawHolster(gfx, weaponHolster, sx);
    }

    // Shield (shield enemy)
    if (hasShield) {
      StickmanRenderer._drawShield(gfx, sx);
    }
  }

  static _getArmAngles(state, frame) {
    const f = frame % 4;
    if (state === 'walk') {
      const swings = [0.6, 0.9, 0.6, 0.3];
      const s = swings[f];
      return { left: Math.PI * s * 0.4 + 0.1, right: Math.PI * (1 - s) * 0.4 + 0.1 };
    }
    if (state === 'attack') return { left: 0.1, right: -0.4 };
    if (state === 'hurt') return { left: 0.8, right: 0.8 };
    if (state === 'dead') return { left: 1.4, right: 1.4 };
    // idle
    return { left: 0.35, right: 0.35 };
  }

  static _getLegAngles(state, frame) {
    const cycle = [
      { left: 0.7, right: 0.4 },
      { left: 0.55, right: 0.55 },
      { left: 0.4, right: 0.7 },
      { left: 0.55, right: 0.55 },
    ];
    if (state === 'walk') {
      const c = cycle[frame % 4];
      return { left: Math.PI * c.left, right: Math.PI * c.right };
    }
    if (state === 'dead') return { left: Math.PI * 0.3, right: Math.PI * 0.75 };
    // idle, attack, hurt
    return { left: Math.PI * 0.55, right: Math.PI * 0.55 };
  }

  static _drawHat(gfx, type, color) {
    gfx.fillStyle(color);
    if (type === 'tophat') {
      gfx.fillRect(-7, -35, 14, 3);
      gfx.fillRect(-5, -44, 10, 10);
    } else if (type === 'cap') {
      gfx.fillRect(-8, -31, 16, 4);
      gfx.fillCircle(0, -30, 6);
    } else if (type === 'helmet') {
      gfx.fillStyle(0x888888);
      gfx.fillCircle(0, -22, 9);
      gfx.fillRect(-9, -22, 18, 5);
      gfx.fillStyle(0x555555);
      gfx.fillRect(-5, -19, 10, 3);
    }
  }

  static _drawCape(gfx, color, state, frame, sx) {
    const flap = state === 'walk' ? Math.sin((frame % 4) * Math.PI / 2) * 5 : 0;
    gfx.fillStyle(color, 0.85);
    gfx.fillTriangle(-sx * 3, -12, -sx * (16 + flap), 8, sx * 3, 8);
  }

  static _drawHolster(gfx, weaponKey, sx) {
    const colors = {
      spear: 0x8B4513, pistol: 0x888888, uzi: 0x999999,
      machinegun: 0xaaaaaa, bazooka: 0x556B2F, sword: 0xC0C0C0,
      bow: 0xd4a017, sniper: 0xff3333,
    };
    const color = colors[weaponKey] || 0x666666;
    gfx.fillStyle(color);
    gfx.fillRect(sx * 5, 0, sx * 4, 8);
  }

  static _drawShield(gfx, sx) {
    gfx.fillStyle(0x4444cc, 0.8);
    gfx.fillRect(sx * 6, -14, sx * 8, 22);
    gfx.lineStyle(2, 0x8888ff);
    gfx.strokeRect(sx * 6, -14, sx * 8, 22);
  }
}
