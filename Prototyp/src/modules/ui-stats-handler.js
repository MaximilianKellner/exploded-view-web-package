/**
 * Verwaltet die Statistikanzeige, welche Latenz und FPS darstellt.
 * Stats.js wird dynamisch geladen für Code-Splitting.
 */

export class StatsHandler {
    constructor() {
        this.fpsStats = null;
        this.latencyStats = null;
        this.initialized = false;
        this._initPromise = this._initialize();
    }

    async _initialize() {
        // Dynamic Import für Code-Splitting
        const Stats = (await import('stats.js')).default;
        
        this.fpsStats = new Stats();
        this.fpsStats.showPanel(0); // 0: fps, 1: ms
        this.fpsStats.dom.style.cssText = 'position:absolute;top:0px;left:0px;';

        document.body.appendChild(this.fpsStats.dom);

        this.latencyStats = new Stats();
        this.latencyStats.showPanel(1);
        this.latencyStats.dom.style.cssText = 'position:absolute;top:0px;left:80px;'; // Position neben dem FPS-Panel

        document.body.appendChild(this.latencyStats.dom);
        this.initialized = true;
    }

    async update() {
        // Warte auf Initialisierung falls noch nicht abgeschlossen
        if (!this.initialized) {
            await this._initPromise;
        }
        
        if (this.fpsStats) {
            this.fpsStats.update();
        }

        if (this.latencyStats) {
            this.latencyStats.update();
        }
    }

    destroy() {
        if (this.fpsStats && this.fpsStats.dom && document.body.contains(this.fpsStats.dom)) {
            document.body.removeChild(this.fpsStats.dom);
        }
        if (this.latencyStats && this.latencyStats.dom && document.body.contains(this.latencyStats.dom)) {
            document.body.removeChild(this.latencyStats.dom);
        }
        this.fpsStats = null;
        this.latencyStats = null;
    }
}