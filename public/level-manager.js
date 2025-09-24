// LevelManager: 控制关卡（每关墙数递减）
// 依赖：catch-the-cat.js 中的构造函数 CatchTheCatGame
// 约定：catch-the-cat.js 在“通关”时触发自定义事件 'catch-the-cat:level-complete'

(function () {
  const LevelManager = {
    config: null,
    currentLevel: 1,
    gameInstance: null,

    start: function (config) {
      this.config = Object.assign({}, config);
      if (typeof this.config.baseWalls !== 'number') this.config.baseWalls = 8;
      this.currentLevel = 1;

      // 监听游戏通关事件
      window.addEventListener('catch-the-cat:level-complete', (ev) => {
        this.onLevelComplete(ev && ev.detail);
      });

      // 启动第一关
      this.startLevel(this.currentLevel);
    },

    computeWallsForLevel: function (level) {
      const base = this.config.baseWalls;
      return Math.max(0, base - (level - 1));
    },

    startLevel: function (level) {
      this.destroyGame();

      const walls = this.computeWallsForLevel(level);

      const options = Object.assign({}, this.config, {
        initialWallCount: walls,
        level: level,
        parent: this.config.parent
      });

      // 兼容原有用法：构造函数创建游戏实例
      try {
        this.gameInstance = new CatchTheCatGame(options);
      } catch (e) {
        console.error('LevelManager: Failed to create CatchTheCatGame', e);
        this.gameInstance = null;
      }

      // 兼容性：暴露到全局 window.game
      try { window.game = this.gameInstance; } catch (e) {}

      this.updateUI();
    },

    restartLevel: function () {
      this.startLevel(this.currentLevel);
    },

    onLevelComplete: function (detail) {
      // detail.level 可用于记录
      this.currentLevel += 1;
      // 如果希望在 walls 已为 0 时停止自动推进，可在此处添加判断
      this.startLevel(this.currentLevel);
    },

    destroyGame: function () {
      try {
        if (!this.gameInstance) {
          // 若父容器里可能有残留，清空父容器
          const parentNode = document.getElementById(this.config.parent);
          if (parentNode) parentNode.innerHTML = '';
          return;
        }

        if (typeof this.gameInstance.destroy === 'function') {
          this.gameInstance.destroy();
        } else if (this.gameInstance.game && typeof this.gameInstance.game.destroy === 'function') {
          this.gameInstance.game.destroy(true);
        } else {
          const parentNode = document.getElementById(this.config.parent);
          if (parentNode) parentNode.innerHTML = '';
        }
      } catch (e) {
        console.warn('LevelManager: destroy error', e);
      } finally {
        this.gameInstance = null;
        try { window.game = null; } catch (e) {}
      }
    },

    updateUI: function () {
      const info = document.getElementById('level-info');
      if (!info || !this.config) return;
      const walls = this.computeWallsForLevel(this.currentLevel);
      info.textContent = `Level: ${this.currentLevel} — Walls: ${walls}`;
    }
  };

  window.LevelManager = LevelManager;
})();
