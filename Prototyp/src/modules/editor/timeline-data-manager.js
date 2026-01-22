/**
 * TimelineDataManager
 * Verwaltet Timeline-Daten: Objekte, Keyframes, Animation-Dauer
 * Lädt Daten aus explosionConfig und synchronisiert mit animationHandler
 */
export class TimelineDataManager {
    constructor(animationHandler) {
        this.animationHandler = animationHandler;
        
        this.animationDuration = 1500; // ms (Standard)
        this.objects = []; // Array von {name, start, end, level, expDirection, speedMultiplier}
        this.totalObjectsCount = 0; // Gecachte Anzahl der ursprünglichen Modell-Objekte
        
        this._initFromHandler();
        this._cacheTotalObjectsCount();
    }
    
    _initFromHandler() {
        if (!this.animationHandler || !this.animationHandler.explodableObjects) {
            console.warn('TimelineDataManager: Keine explodierbaren Objekte im Handler gefunden');
            return;
        }

        const rawObjects = this.animationHandler.explodableObjects;
        
        this.objects = rawObjects.map(item => ({
            name: item.object.name,
            start: item.start !== undefined ? item.start : 0,
            end: item.end !== undefined ? item.end : 1,
            level: item.targetLevel,
            expDirection: item.expDirection,
            speedMultiplier: item.speedMultiplier,
            sequence: item.sequence ?? null,
        }));

        console.log(`TimelineDataManager: ${this.objects.length} Objekte aus Handler geladen`);
    }

    // Cacht die Gesamtanzahl der Objekte beim ersten Laden --> bleibt konstant, auch wenn neue PreviewObjects hinzugefügt werden
    _cacheTotalObjectsCount() {
        if (!this.animationHandler || !this.animationHandler.scene) {
            console.warn('TimelineDataManager: Scene nicht verfügbar');
            this.totalObjectsCount = 0;
            return;
        }
        
        // Finde das geladene Modell (erste Gruppe/Objekt in der Scene)
        let modelRoot = null;
        for (let child of this.animationHandler.scene.children) {
            if (child.isGroup || child.isMesh) {
                modelRoot = child;
                break;
            }
        }
        
        this.totalObjectsCount = modelRoot ? modelRoot.children.length : 0;
    }

    // Gibt alle animierten Objekte zurück
    getObjects() {
        return this.objects;
    }

    // Aktualisiert die Liste der animierten Objekte aus dem AnimationHandler
    refreshObjects() {
        this._initFromHandler();
    }

    // Gibt die Gesamtanzahl der Objekte in der Szene zurück (gecachter Wert - bleibt konstant)
    getTotalObjectsCount() {
        return this.totalObjectsCount;
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

    debugInfo() {
        console.group('TimelineDataManager Debug Info');
        console.table(this.objects);
        console.log('Duration:', this.animationDuration + 'ms');
        console.groupEnd();
    }
}
