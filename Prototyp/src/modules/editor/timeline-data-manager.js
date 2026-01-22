/**
 * TimelineDataManager
 * Verwaltet Timeline-Daten: Objekte, Keyframes, Animation-Dauer
 * Lädt Daten aus explosionConfig und synchronisiert mit animationHandler
 */
export class TimelineDataManager {
    constructor(animationHandler, explosionConfigPath) {
        this.animationHandler = animationHandler;
        this.explosionConfigPath = explosionConfigPath; // Standardpfad
        
        this.explosionConfig = null;
        this.animationDuration = 1500; // ms (Standard)
        this.objects = []; // Array von {name, start, end, level, expDirection, speedMultiplier}
        
        this._init();
    }
    
    async _init() {
        await this.loadConfig();
        this._parseObjects();
    }

    // Lädt die Explosions-Konfiguration aus JSON
    async loadConfig() {
        try {
            const response = await fetch(this.explosionConfigPath);
            //console.log(response);
            if (!response.ok) {
                throw new Error(`Config konnte nicht geladen werden: ${response.status}`);
            }
            this.explosionConfig = await response.json();
            console.log('TimelineDataManager: explosionConfig geladen', this.explosionConfig);
            return this.explosionConfig;
        } catch (error) {
            console.error('TimelineDataManager Error beim Laden der Config:', error);
            throw error;
        }
    }

    /**
     * Konvertiert explosionConfig Objekte in Timeline-Format
     * start/end sind Werte von 0-1 (0% - 100% der Animation)
     */
    _parseObjects() {
        if (!this.explosionConfig || !this.explosionConfig.objects) {
            console.warn('TimelineDataManager: Keine objects in explosionConfig');
            return;
        }

        this.objects = Object.entries(this.explosionConfig.objects).map(([name, config]) => ({
            name,
            start: config.start ?? 0,
            end: config.end ?? 1,
            level: config.level ?? 0,
            expDirection: config.expDirection ?? [0, 0, 0],
            speedMultiplier: config.speedMultiplier ?? 1,
            sequence: config.sequence ?? null,
        }));

        console.log(`TimelineDataManager: ${this.objects.length} Objekte geparst`);
    }

    // Gibt alle animierten Objekte zurück
    getObjects() {
        return this.objects;
    }

    //Gibt ein spezifisches Objekt nach Name zurück
    getObjectByName(name) {
        return this.objects.find(obj => obj.name === name);
    }

    /**
     * Setzt die Animation-Dauer (in ms)
     * Wird verwendet, um die Timeline-Skalierung zu berechnen
     */
    setAnimationDuration(duration) {
        this.animationDuration = duration;
        console.log(`TimelineDataManager: Animation-Dauer auf ${duration}ms gesetzt`);
    }

    // Gibt die Animation-Dauer zurück (in ms)
    getAnimationDuration() {
        return this.animationDuration;
    }

    // Konvertiert Prozent-Wert (0-100) zu start/end (0-1)
    percentToNormalized(percent) {
        return Math.max(0, Math.min(1, percent / 100));
    }

    // Konvertiert start/end (0-1) zu Prozent-Wert (0-100)
    normalizedToPercent(normalized) {
        return Math.max(0, Math.min(100, normalized * 100));
    }

    // Konvertiert Timeline-Zeit (ms) zu Prozent (0-100)
    timeToPercent(timeMs) {
        return (timeMs / this.animationDuration) * 100;
    }

    // Konvertiert Prozent (0-100) zu Timeline-Zeit (ms)
    percentToTime(percent) {
        return (percent / 100) * this.animationDuration;
    }

    // Synchronisiert Keyframe-Änderungen mit animationHandler
    updateKeyframe(objectName, startPercent, endPercent) {
        const obj = this.getObjectByName(objectName);
        if (!obj) {
            console.warn(`Objekt "${objectName}" nicht gefunden`);
            return;
        }

        // Konvertiere Prozent zu normalized (0-1)
        const start = this.percentToNormalized(startPercent);
        const end = this.percentToNormalized(endPercent);

        // Update lokal
        obj.start = start;
        obj.end = end;

        // Synchronisiere mit animationHandler
        if (this.animationHandler) {
            this.animationHandler.updateObjectConfigByName(objectName, { start, end });
            console.log(`Keyframe aktualisiert: ${objectName} [${startPercent}%-${endPercent}%]`);
        }
    }

    // Exportiert die aktuellen Daten (für Speicherung)
    export() {
        return {
            animationDuration: this.animationDuration,
            explosionConfig: this.explosionConfig,
        };
    }

    debugInfo() {
        console.group('TimelineDataManager Debug Info');
        console.table(this.objects);
        console.log('Duration:', this.animationDuration + 'ms');
        console.log('Config URL:', this.explosionConfigPath);
        console.groupEnd();
    }
}
