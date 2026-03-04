import { LEVELS } from '../config/levels.js';
import { BasicSoldier } from '../entities/enemies/BasicSoldier.js';
import { RangedEnemy } from '../entities/enemies/RangedEnemy.js';
import { ShieldEnemy } from '../entities/enemies/ShieldEnemy.js';
import { Boss } from '../entities/enemies/Boss.js';

const ENEMY_CLASS_MAP = {
  basicSoldier: BasicSoldier,
  rangedEnemy: RangedEnemy,
  shieldEnemy: ShieldEnemy,
  boss: Boss,
};

export class LevelManager {
  constructor(scene) {
    this.scene = scene;
    this.currentLevelIdx = 0;
    this.currentWaveIdx = 0;
    this.activeEnemies = [];
    this.waveInProgress = false;
    this.transitioning = false;
  }

  get currentLevel() { return LEVELS[this.currentLevelIdx]; }
  get totalLevels() { return LEVELS.length; }

  startLevel(levelIdx) {
    this.currentLevelIdx = Math.min(levelIdx, LEVELS.length - 1);
    this.currentWaveIdx = 0;
    this.activeEnemies = [];
    this.transitioning = false;
    this.startWave();
  }

  startWave() {
    if (this.transitioning) return;
    const level = this.currentLevel;
    const wave = level.waves[this.currentWaveIdx];
    this.waveInProgress = true;
    this.activeEnemies = [];

    const rightOnly = !!level.spawnFromRight;
    const spawnSides = rightOnly
      ? [this.scene.scale.width - 80]
      : [this.scene.scale.width - 80, 80];
    let enemyIdx = 0;

    wave.enemies.forEach(group => {
      for (let i = 0; i < group.count; i++) {
        const EnemyClass = ENEMY_CLASS_MAP[group.type];
        if (!EnemyClass) continue;

        const spawnX = spawnSides[enemyIdx % spawnSides.length];
        // Spawn at platform height — use ground level
        const spawnY = this.scene.groundY - 30;

        const args = [this.scene, spawnX, spawnY];
        if (group.type === 'boss') args.push(group.variant || `level${level.id}`);

        const enemy = new EnemyClass(...args);
        enemy.container.setVisible(false);

        // Add collision with platforms
        this.scene.physics.add.collider(enemy.container, this.scene.platforms);

        // Stagger spawn
        this.scene.time.delayedCall(enemyIdx * 400, () => {
          if (enemy.container && enemy.container.active) {
            enemy.container.setVisible(true);
          }
        });

        this.activeEnemies.push(enemy);
        enemyIdx++;
      }
    });

    // Announce wave
    this.scene.events.emit('wave-start', {
      wave: this.currentWaveIdx + 1,
      totalWaves: level.waves.length,
      levelId: level.id,
    });
  }

  update(time, delta, playerContainer) {
    for (let i = this.activeEnemies.length - 1; i >= 0; i--) {
      const enemy = this.activeEnemies[i];
      if (enemy.container && enemy.container.active) {
        enemy.update(time, delta, playerContainer);
      }
    }
  }

  removeEnemy(enemy) {
    const idx = this.activeEnemies.indexOf(enemy);
    if (idx !== -1) {
      this.activeEnemies.splice(idx, 1);
    }
    enemy.destroy();

    if (this.activeEnemies.length === 0 && !this.transitioning) {
      this.onWaveCleared();
    }
  }

  onWaveCleared() {
    this.transitioning = true;
    this.waveInProgress = false;
    this.currentWaveIdx++;

    if (this.currentWaveIdx >= this.currentLevel.waves.length) {
      // Level complete
      this.scene.time.delayedCall(1500, () => {
        this.scene.events.emit('level-complete', {
          levelIdx: this.currentLevelIdx,
          levelId: this.currentLevel.id,
          unlocks: this.currentLevel.unlocks,
          nextLevelIdx: this.currentLevelIdx + 1,
          isLastLevel: this.currentLevelIdx >= LEVELS.length - 1,
        });
      });
    } else {
      // Next wave with delay
      this.scene.events.emit('wave-complete', { nextWave: this.currentWaveIdx + 1 });
      this.scene.time.delayedCall(2500, () => {
        this.transitioning = false;
        this.startWave();
      });
    }
  }

  getEnemyContainers() {
    return this.activeEnemies
      .filter(e => e.container && e.container.active)
      .map(e => e.container);
  }
}
