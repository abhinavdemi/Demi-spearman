import Phaser from 'phaser';
import { Player } from '../entities/Player.js';
import { BasicSoldier } from '../entities/enemies/BasicSoldier.js';
import { LevelManager } from '../systems/LevelManager.js';
import { PowerUpManager } from '../systems/PowerUpManager.js';
import { LEVELS } from '../config/levels.js';

export default class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  init(data) {
    this.startLevelIdx = data?.levelIdx || 0;
    this.score = 0;
    this._gameOver = false;
    this._levelComplete = false;
    this._bossRef = null;
    this._speedBoosted = false;
    this._damageBoostActive = false;
  }

  create() {
    const { width, height } = this.scale;
    this.groundY = height - 50;

    // Background
    this._createBackground(width, height);

    // Platforms
    this._createPlatforms(width, height);

    // Collision groups
    this.playerProjectiles = this.physics.add.group({ maxSize: 40, runChildUpdate: false });
    this.enemyProjectiles = this.physics.add.group({ maxSize: 30, runChildUpdate: false });
    this.powerUps = this.physics.add.group();

    // Player
    this.player = new Player(this, 120, this.groundY - 30);
    this.physics.add.collider(this.player.container, this.platforms);

    // Input
    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasdKeys = this.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
    });
    this.qKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Q);
    this.eKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);

    // Mouse wheel weapon switch
    this.input.on('wheel', (ptr, gos, dx, dy) => {
      if (dy > 0) this.player.switchWeapon(1);
      else this.player.switchWeapon(-1);
      this._notifyHUD();
    });

    // Managers
    this.levelManager = new LevelManager(this);
    this.powerUpManager = new PowerUpManager(this);

    // Collisions
    this._setupCollisions();

    // Event listeners
    this._registerEvents();

    // Mobile controls (only if touch device)
    if (this.sys.game.device.input.touch) {
      this._createMobileControls(width, height);
    }

    // Start HUD
    this.scene.launch('HUDScene', { gameScene: this });

    // Start level
    this.levelManager.startLevel(this.startLevelIdx);

    this.cameras.main.fadeIn(400);
  }

  _createBackground(width, height) {
    const level = LEVELS[this.startLevelIdx] || LEVELS[0];
    const bg = this.add.graphics();
    bg.fillGradientStyle(level.background, level.background, 0x000000, 0x000000, 1);
    bg.fillRect(0, 0, width, height);
    bg.setDepth(-10);

    // Stars / particles
    const stars = this.add.graphics();
    stars.setDepth(-9);
    stars.fillStyle(0xffffff, 0.5);
    for (let i = 0; i < 60; i++) {
      stars.fillCircle(
        Phaser.Math.Between(0, width),
        Phaser.Math.Between(0, height * 0.7),
        Phaser.Math.FloatBetween(0.5, 2)
      );
    }
  }

  _createPlatforms(width, height) {
    this.platforms = this.physics.add.staticGroup();
    const groundH = 50;

    // Ground
    const groundGfx = this.make.graphics({ add: false });
    groundGfx.fillStyle(0x3a3a4a);
    groundGfx.fillRect(0, 0, width, groundH);
    groundGfx.lineStyle(2, 0x5a5a6a);
    groundGfx.lineBetween(0, 0, width, 0);
    groundGfx.generateTexture('ground', width, groundH);
    groundGfx.destroy();

    this.platforms.create(width / 2, height - groundH / 2, 'ground')
      .setScale(1, 1)
      .refreshBody();

    // Elevated platforms (level-specific feel, consistent layout)
    const platData = [
      { x: 180, y: height - 160, w: 150 },
      { x: width - 180, y: height - 160, w: 150 },
      { x: width / 2, y: height - 230, w: 200 },
      { x: 320, y: height - 310, w: 120 },
      { x: width - 320, y: height - 310, w: 120 },
    ];

    platData.forEach(({ x, y, w }) => {
      const key = `plat_${w}`;
      if (!this.textures.exists(key)) {
        const pg = this.make.graphics({ add: false });
        pg.fillStyle(0x4a4a5a);
        pg.fillRect(0, 0, w, 18);
        pg.lineStyle(2, 0x7a7a8a);
        pg.lineBetween(0, 0, w, 0);
        pg.generateTexture(key, w, 18);
        pg.destroy();
      }
      this.platforms.create(x, y, key).refreshBody();
    });
  }

  _setupCollisions() {
    // Enemy projectiles hit player
    this.physics.add.overlap(
      this.player.container,
      this.enemyProjectiles,
      (playerContainer, proj) => {
        if (!proj.active) return;
        this.player.takeDamage(proj.getData('damage'));
        proj.setActive(false).setVisible(false);
        this._notifyHUD();
      }
    );

    // Player collects power-ups
    this.physics.add.overlap(
      this.player.container,
      this.powerUps,
      (playerContainer, puSprite) => {
        if (!puSprite.active) return;
        const powerUp = this.powerUpManager.getBySprite(puSprite);
        if (powerUp) {
          powerUp.applyTo(this.player);
          this._notifyHUD();
        }
      }
    );

    // Enemy projectiles vs platforms (clear on hit)
    this.physics.add.collider(this.enemyProjectiles, this.platforms, (proj) => {
      proj.setActive(false).setVisible(false);
    });

    // Player projectiles vs platforms
    this.physics.add.collider(this.playerProjectiles, this.platforms, (proj) => {
      if (proj.getData('aoe')) {
        this._doAoeExplosion(proj);
      }
      proj.setActive(false).setVisible(false);
    });
  }

  _registerEvents() {
    // Enemy melee attack
    this.events.on('enemy-attack', ({ enemy, damage }) => {
      if (!this.player || this.player.health <= 0) return;
      const dist = Phaser.Math.Distance.Between(
        enemy.container.x, enemy.container.y,
        this.player.container.x, this.player.container.y
      );
      if (dist < 80) {
        this.player.takeDamage(damage);
        this._notifyHUD();
      }
    }, this);

    // Enemy fires projectile
    this.events.on('enemy-fire', ({ x, y, targetX, targetY, damage }) => {
      const proj = this.enemyProjectiles.get(x, y, 'tex_enemybullet');
      if (!proj) return;
      proj.setActive(true).setVisible(true);
      proj.setData('damage', damage);
      proj.body.setAllowGravity(false);
      const angle = Phaser.Math.Angle.Between(x, y, targetX, targetY);
      proj.setRotation(angle);
      proj.body.setVelocity(Math.cos(angle) * 320, Math.sin(angle) * 320);
    }, this);

    // Boss spawns minions
    this.events.on('boss-spawn-minions', ({ count, bossX, bossY }) => {
      for (let i = 0; i < count; i++) {
        const offset = (i % 2 === 0 ? -100 : 100) * (Math.floor(i / 2) + 1);
        const enemy = new BasicSoldier(this, bossX + offset, this.groundY - 30);
        this.physics.add.collider(enemy.container, this.platforms);
        this.levelManager.activeEnemies.push(enemy);
      }
    }, this);

    // Boss phase change — flash
    this.events.on('boss-phase-change', ({ boss, phase }) => {
      this.cameras.main.flash(400, 100, 0, 0, false);
      if (phase.pattern === 'berserker') {
        this.cameras.main.flash(500, 150, 0, 0, false);
      }
    }, this);

    // Wave start
    this.events.on('wave-start', (data) => {
      const hudScene = this.scene.get('HUDScene');
      if (hudScene) hudScene.events.emit('show-wave', data);

      // Check if this is a boss wave and set up boss bar
      const wave = this.levelManager.currentLevel.waves[this.levelManager.currentWaveIdx];
      const hasBoss = wave && wave.enemies.some(e => e.type === 'boss');
      if (hasBoss) {
        this.time.delayedCall(500, () => {
          const boss = this.levelManager.activeEnemies.find(e => e.type === 'boss');
          if (boss) {
            this._bossRef = boss;
            const hudScene = this.scene.get('HUDScene');
            if (hudScene) hudScene.events.emit('show-boss-bar', {
              name: `BOSS — LEVEL ${this.levelManager.currentLevel.id}`,
              maxHealth: boss.maxHealth,
            });
          }
        });
      }
    }, this);

    // Level complete
    this.events.on('level-complete', (data) => {
      if (this._levelComplete) return;
      this._levelComplete = true;

      // Unlock weapons
      if (data.unlocks) {
        data.unlocks.forEach(w => this.player.unlockWeapon(w));
      }

      this.time.delayedCall(200, () => {
        this.scene.stop('HUDScene');
        this.scene.start('LevelCompleteScene', {
          ...data,
          score: this.score,
        });
      });
    }, this);
  }

  update(time, delta) {
    if (this._gameOver || this._levelComplete) return;

    // Check player death
    if (this.player.health <= 0) {
      this._gameOver = true;
      this.time.delayedCall(800, () => {
        this.scene.stop('HUDScene');
        this.scene.start('GameOverScene', { score: this.score });
      });
      return;
    }

    // Player update
    this.player.update(time, delta, this.cursors, this.wasdKeys);

    // Weapon switch
    if (Phaser.Input.Keyboard.JustDown(this.qKey)) {
      this.player.switchWeapon(-1);
      this._notifyHUD();
    }
    if (Phaser.Input.Keyboard.JustDown(this.eKey)) {
      this.player.switchWeapon(1);
      this._notifyHUD();
    }

    // Fire
    const ptr = this.input.activePointer;
    if (ptr.isDown || this._mobileAttackDown) {
      let targetX = ptr.worldX;
      let targetY = ptr.worldY;
      if (this._mobileAttackDown) {
        // Fire in facing direction
        const dir = this.player.facingLeft ? -1 : 1;
        targetX = this.player.x + dir * 500;
        targetY = this.player.y;
      }
      const fireData = this.player.fire(time, targetX, targetY);
      if (fireData) {
        this._spawnPlayerProjectile(fireData);
        this._notifyHUD();
      }
    }

    // Enemy update
    this.levelManager.update(time, delta, this.player.container);

    // Boss bar update
    if (this._bossRef && this._bossRef.container && this._bossRef.container.active) {
      const hudScene = this.scene.get('HUDScene');
      if (hudScene) hudScene.events.emit('update-boss-bar', { health: this._bossRef.health });
    } else if (this._bossRef && !this._bossRef.container.active) {
      const hudScene = this.scene.get('HUDScene');
      if (hudScene) hudScene.events.emit('hide-boss-bar');
      this._bossRef = null;
    }

    // Power-up update
    this.powerUpManager.update(time);

    // Projectile collision check
    this._checkPlayerProjectileHits();

    // Cleanup dead projectiles out of world bounds
    this._cleanupProjectiles();
  }

  _spawnPlayerProjectile(fireData) {
    const { x, y, targetX, targetY, weaponKey, damage, range, aoe, aoeRadius, speed, facingLeft } = fireData;

    if (weaponKey === 'sword') {
      this._doSwordAttack(x, y, damage, facingLeft, range);
      return;
    }

    const texKey = `tex_${weaponKey}`;
    const proj = this.playerProjectiles.get(x, y, texKey);
    if (!proj) return;

    proj.setActive(true).setVisible(true);
    proj.setData('damage', damage);
    proj.setData('range', range);
    proj.setData('startX', x);
    proj.setData('startY', y);
    proj.setData('aoe', aoe);
    proj.setData('aoeRadius', aoeRadius);
    proj.body.setAllowGravity(false);

    const angle = Phaser.Math.Angle.Between(x, y, targetX, targetY);
    proj.setRotation(angle);
    proj.body.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
  }

  _doSwordAttack(x, y, damage, facingLeft, range) {
    const offsetX = facingLeft ? -range * 0.6 : range * 0.6;
    // Visual slash
    const slash = this.add.graphics();
    slash.lineStyle(4, 0xffffff, 1);
    slash.beginPath();
    slash.moveTo(x, y - 20);
    slash.lineTo(x + offsetX * 2, y + 20);
    slash.strokePath();

    this.tweens.add({
      targets: slash,
      alpha: 0,
      duration: 200,
      onComplete: () => slash.destroy(),
    });

    // Damage nearby enemies
    this.levelManager.activeEnemies.forEach(enemy => {
      if (!enemy.container.active) return;
      const dx = enemy.container.x - x;
      const dy = enemy.container.y - y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      // Check facing direction
      const inFront = facingLeft ? dx < 0 : dx > 0;
      if (dist < range && inFront) {
        const fromFront = this._isHittingFront({ x }, enemy);
        const died = enemy.takeDamage(damage, fromFront);
        if (died) {
          this.score += enemy.scoreValue;
          this._maybeSpawnPowerUp(enemy.container.x, enemy.container.y);
          this.levelManager.removeEnemy(enemy);
          this._notifyHUD();
        }
      }
    });
  }

  _checkPlayerProjectileHits() {
    this.playerProjectiles.getChildren().forEach(proj => {
      if (!proj.active) return;

      // Range check
      const dist = Phaser.Math.Distance.Between(
        proj.getData('startX'), proj.getData('startY'),
        proj.x, proj.y
      );
      if (dist > proj.getData('range')) {
        if (proj.getData('aoe')) this._doAoeExplosion(proj);
        proj.setActive(false).setVisible(false);
        return;
      }

      // Hit enemies
      for (let i = this.levelManager.activeEnemies.length - 1; i >= 0; i--) {
        const enemy = this.levelManager.activeEnemies[i];
        if (!enemy.container || !enemy.container.active) continue;

        const projBounds = proj.getBounds();
        const enemyBounds = enemy.container.getBounds();

        if (Phaser.Geom.Rectangle.Overlaps(projBounds, enemyBounds)) {
          if (proj.getData('aoe')) {
            this._doAoeExplosion(proj);
          } else {
            proj.setActive(false).setVisible(false);
          }

          const fromFront = this._isHittingFront(proj, enemy);
          const died = enemy.takeDamage(proj.getData('damage'), fromFront);

          if (died) {
            this.score += enemy.scoreValue;
            this._maybeSpawnPowerUp(enemy.container.x, enemy.container.y);
            this.levelManager.removeEnemy(enemy);
            this._notifyHUD();
          }
          break; // One projectile hits one enemy
        }
      }
    });
  }

  _isHittingFront(proj, enemy) {
    // If enemy faces left, the front is left side (proj.x < enemy.x)
    // If enemy faces right, the front is right side (proj.x > enemy.x)
    return enemy.facingLeft
      ? proj.x < enemy.container.x
      : proj.x > enemy.container.x;
  }

  _doAoeExplosion(proj) {
    const px = proj.x;
    const py = proj.y;
    const radius = proj.getData('aoeRadius') || 80;
    const damage = proj.getData('damage');

    // Visual explosion
    const ring = this.add.graphics();
    ring.setDepth(20);
    this.tweens.add({
      targets: { pct: 0 },
      pct: 1,
      duration: 350,
      onUpdate: (tween, target) => {
        ring.clear();
        const r = radius * target.pct;
        const alpha = 1 - target.pct;
        ring.lineStyle(4, 0xff8800, alpha);
        ring.strokeCircle(px, py, r);
        ring.fillStyle(0xff6600, alpha * 0.3);
        ring.fillCircle(px, py, r);
      },
      onComplete: () => ring.destroy(),
    });

    // Damage all enemies in radius
    this.levelManager.activeEnemies.forEach(enemy => {
      if (!enemy.container.active) return;
      const dist = Phaser.Math.Distance.Between(px, py, enemy.container.x, enemy.container.y);
      if (dist < radius) {
        const falloff = 1 - (dist / radius);
        const died = enemy.takeDamage(damage * falloff, true);
        if (died) {
          this.score += enemy.scoreValue;
          this._maybeSpawnPowerUp(enemy.container.x, enemy.container.y);
          this.levelManager.removeEnemy(enemy);
          this._notifyHUD();
        }
      }
    });

    this.cameras.main.shake(200, 0.01);
    proj.setActive(false).setVisible(false);
  }

  _maybeSpawnPowerUp(x, y) {
    const chance = this.levelManager.currentLevel?.powerUpChance || 0.3;
    if (Math.random() < chance) {
      const types = ['speedBoost', 'damageBoost', 'shield', 'weaponSwap'];
      const type = Phaser.Math.RND.pick(types);
      this.powerUpManager.spawn(x, y - 20, type);
    }
  }

  _cleanupProjectiles() {
    const { width, height } = this.scale;
    [this.playerProjectiles, this.enemyProjectiles].forEach(group => {
      group.getChildren().forEach(proj => {
        if (!proj.active) return;
        if (proj.x < -50 || proj.x > width + 50 || proj.y < -50 || proj.y > height + 50) {
          proj.setActive(false).setVisible(false);
        }
      });
    });
  }

  _notifyHUD() {
    const hudScene = this.scene.get('HUDScene');
    if (!hudScene) return;
    hudScene.events.emit('update-hud', {
      health: this.player.health,
      maxHealth: this.player.maxHealth,
      currentWeapon: this.player.currentWeapon,
      unlockedWeapons: this.player.unlockedWeapons,
      shieldHits: this.player.shieldHits,
      score: this.score,
      damageMultiplier: this.player.damageMultiplier,
      speedBoosted: this.player.speed > 200,
    });
  }

  _createMobileControls(width, height) {
    this._mobileAttackDown = false;

    // Joystick base
    const jbX = 80, jbY = height - 80;
    const joystickBase = this.add.circle(jbX, jbY, 50, 0x000000, 0.3)
      .setScrollFactor(0).setDepth(100);
    const joystickThumb = this.add.circle(jbX, jbY, 25, 0xffffff, 0.5)
      .setScrollFactor(0).setDepth(101);

    // Attack button
    const atkBtn = this.add.circle(width - 70, height - 80, 42, 0xe74c3c, 0.7)
      .setScrollFactor(0).setDepth(100).setInteractive();
    this.add.text(width - 70, height - 80, 'ATK', {
      fontSize: '14px', color: '#ffffff', fontStyle: 'bold'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(101);

    atkBtn.on('pointerdown', () => { this._mobileAttackDown = true; });
    atkBtn.on('pointerup', () => { this._mobileAttackDown = false; });
    atkBtn.on('pointerout', () => { this._mobileAttackDown = false; });

    // Weapon buttons
    const prevBtn = this.add.text(width - 150, height - 90, '<<', {
      fontSize: '20px', color: '#f1c40f', backgroundColor: '#00000066', padding: { x: 8, y: 5 }
    }).setScrollFactor(0).setDepth(100).setInteractive();
    const nextBtn = this.add.text(width - 110, height - 90, '>>', {
      fontSize: '20px', color: '#f1c40f', backgroundColor: '#00000066', padding: { x: 8, y: 5 }
    }).setScrollFactor(0).setDepth(100).setInteractive();

    prevBtn.on('pointerdown', () => { this.player.switchWeapon(-1); this._notifyHUD(); });
    nextBtn.on('pointerdown', () => { this.player.switchWeapon(1); this._notifyHUD(); });

    // Jump button
    const jumpBtn = this.add.circle(width - 130, height - 80, 30, 0x2980b9, 0.7)
      .setScrollFactor(0).setDepth(100).setInteractive();
    this.add.text(width - 130, height - 80, 'JMP', {
      fontSize: '11px', color: '#ffffff'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(101);
    jumpBtn.on('pointerdown', () => {
      if (this.player.body.blocked.down) this.player.body.setVelocityY(this.player.jumpVelocity);
    });

    // Joystick drag
    this._joystickActive = false;
    this._joystickPtrId = -1;
    const jbDead = 10;

    this.input.on('pointerdown', (ptr) => {
      if (ptr.x < 200) {
        this._joystickActive = true;
        this._joystickPtrId = ptr.id;
      }
    });

    this.input.on('pointermove', (ptr) => {
      if (!this._joystickActive || ptr.id !== this._joystickPtrId) return;
      const dx = ptr.x - jbX;
      const dy = ptr.y - jbY;
      const dist = Math.min(Math.sqrt(dx * dx + dy * dy), 50);
      const angle = Math.atan2(dy, dx);
      joystickThumb.x = jbX + Math.cos(angle) * dist;
      joystickThumb.y = jbY + Math.sin(angle) * dist;

      if (dist > jbDead) {
        const normX = Math.cos(angle) * (dist / 50);
        this.player.container.body.setVelocityX(normX * this.player.speed);
        this.player.facingLeft = normX < 0;
        this.player.state = 'walk';
        this.player._dirty = true;
        if (Math.sin(angle) < -0.7 && this.player.body.blocked.down) {
          this.player.body.setVelocityY(this.player.jumpVelocity);
        }
      } else {
        this.player.container.body.setVelocityX(0);
        this.player.state = 'idle';
        this.player._dirty = true;
      }
    });

    this.input.on('pointerup', (ptr) => {
      if (ptr.id === this._joystickPtrId) {
        this._joystickActive = false;
        joystickThumb.x = jbX;
        joystickThumb.y = jbY;
        this.player.container.body.setVelocityX(0);
      }
    });
  }
}
