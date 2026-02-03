import * as THREE from 'three';
import { animate } from 'animejs';

/**
 * Verwaltet die Logik für die Explosionsansicht eines 3D-Modells.
 * Liest eine Konfigurationsdatei, identifiziert bewegliche Teile im Modell
 * und aktualisiert deren Positionen in der Animationsschleife.
 */

export class AnimationHandler {
    constructor(scene, config, renderer) {
        this.scene = scene;
        this.config = config;
        this.renderer = renderer;
        this.animationConfig = config.animationConfig;
        this.explodableObjects = [];
        this.explosionConfig = null;
        this.animation = null;
        this.maxSequence = null;

        this.isAnimating = false;
        this.isReversed = false;
        this.isPaused = false;
    }

    // --- Initialisiert den AnimationHandler mit dem geladenen Modell und der Konfigurationn ---
    async initialize(model, expConfigUrl) {
        await this._loadExplosionConfig(expConfigUrl);
        this._parseModel(model);
    }

    // --- Lädt die Explosions-Konfiguration von der angegebenen URL ---
    async _loadExplosionConfig(url) {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            this.explosionConfig = await response.json();

            console.log('Explosions-Konfiguration geladen');
            //console.log(this.explosionConfig);
        } catch (error) {
            console.error('Fehler beim Laden der Explosions-Konfiguration:', error);
        }
    }

    // --- Parst das Modell und bereitet die explodierbaren Objekte vor ---
    _parseModel(model) {
        if (!model || !this.explosionConfig) {
            console.error('Modell oder Explosions-Konfiguration nicht bereit.');
            return;
        }

        // Explodierbare Objekte aus der Konfiguration
        const configObjects = this.explosionConfig.objects;

        // maxSequence Bestimmen --> Anzahl der Animationsschritte / Zeitfenster
        this.maxSequence = 0;
        for (const key in configObjects) {
            const objectConfig = configObjects[key];
            if (objectConfig.sequence && isFinite(objectConfig.sequence)) {
                if (objectConfig.sequence > this.maxSequence) {
                    this.maxSequence = objectConfig.sequence;
                }
            }
        }
        // Fallback für Objekte ohne Sequenz
        const fallbackMaxSequence = this.maxSequence + 1;

        model.traverse((child) => {
            if (configObjects[child.name]) {
                const objectConfig = configObjects[child.name];

                // expDirection lesen, fallback auf globalExpDirection
                let expDirection = objectConfig.expDirection;
                if (!objectConfig.expDirection) {
                    expDirection = this.animationConfig.globalExpDirection;
                }

                // Start/Ende bestimmen
                let start = objectConfig.start;
                let end = objectConfig.end;

                // Fallback auf Sequenz-Logik, falls start/end nicht gesetzt sind
                if (start === undefined || end === undefined) {
                    // Wenn sequence explizit definiert ist, nutzen wir sie für die Berechnung
                    if (objectConfig.sequence !== undefined && this.maxSequence > 0) {
                        const seq = objectConfig.sequence;
                        start = (seq - 1) / this.maxSequence;
                        end = seq / this.maxSequence;
                    } else {
                        // Sonst Standard: 0 bis 1 (gesamte Animation)
                        start = 0;
                        end = 1;
                    }
                }

                // Explodierbares Objekt mit relevanten Informationen speichern
                this.explodableObjects.push({
                    object: child,
                    originalPosition: child.position.clone(),
                    targetLevel: objectConfig.level !== undefined ? objectConfig.level : 0,
                    start: start,
                    end: end,
                    expDirection: new THREE.Vector3().fromArray(expDirection).normalize()
                });
            }
        });

        // Sortiere die Objekte nach Startzeit für konsistente Verarbeitung (optional)
        this.explodableObjects.sort((a, b) => a.start - b.start);
        
        //console.log('Explodierbare Objekte gefunden und vorbereitet:', this.explodableObjects);
    }

    // --- Helper Methode zur Berechnung des Fortschritts eines einzelnen Items ---
    _calculateItemProgress(item) {
        const { expFactor } = this.animationConfig;
        
        // Zeitfenster bestimmen
        const start = item.start !== undefined ? item.start : 0;
        const end = item.end !== undefined ? item.end : 1;
        const duration = end - start;

        // Wenn Dauer 0 oder negativ, sofort Ziel oder Start
        if (duration <= 0.00001) {
            return expFactor >= start ? 1 : 0;
        }

        // Lokalen Fortschritt berechnen
        let progress = (expFactor - start) / duration;
        progress = THREE.MathUtils.clamp(progress, 0, 1);

        // Easing anwenden
        const easedProgress = progress < 0.5 
            ? 4 * progress * progress * progress 
            : 1 - Math.pow(-2 * progress + 2, 3) / 2; // easeInOutCubic
            
        return easedProgress;
    }

    // --- Helper Methode zur Berechnung des Offsets ---
    // Berechnet die Verschiebung (Offset) eines Objekts basierend auf dem aktuellen Animationsfortschritt (expFactor).
    _calculateOffset(item) {
        const { layerDistance } = this.animationConfig;
        
        if (item.targetLevel === 0) {
            return new THREE.Vector3(0, 0, 0);
        }

        const progress = this._calculateItemProgress(item);
        const distance = item.targetLevel * layerDistance * progress;

        return new THREE.Vector3().copy(item.expDirection).multiplyScalar(distance);
    }

    // --- Endposition aktualisieren (Editor Mode) ---
    updateEndPosition(object) {
        const item = this.explodableObjects.find(i => i.object === object);
        if (!item) return;

        // Aktuellen Fortschritt für dieses Item berechnen
        const progress = this._calculateItemProgress(item);
        
        // Schutz vor Division durch Null oder sehr kleinen Werten
        // Wenn Progress fast 0 ist, nehmen wir an, der User will das Ziel definieren (als wäre Progress 1)
        const effectiveProgress = progress > 0.001 ? progress : 1;

        // Vektor von Start zu aktueller Position
        const currentVector = new THREE.Vector3().subVectors(object.position, item.originalPosition);
        
        // Hochrechnen auf vollen Vektor (bei Progress 1)
        const fullVector = currentVector.clone().divideScalar(effectiveProgress);
        
        // Richtung und Distanz extrahieren
        const distance = fullVector.length();
        
        // Fallback für layerDistance um Division durch 0 zu vermeiden
        const layerDistance = this.animationConfig.layerDistance || 1;
        
        // Werte aktualisieren
        item.targetLevel = distance / layerDistance;
        
        // Nur Richtung aktualisieren, wenn Vektor lang genug ist
        if (distance > 0.000001) {
            item.expDirection.copy(fullVector).normalize();
        }

        // Config aktualisieren
        if (this.explosionConfig && this.explosionConfig.objects[object.name]) {
            const configObj = this.explosionConfig.objects[object.name];
            configObj.level = item.targetLevel;
            configObj.expDirection = item.expDirection.toArray();
            
            // Start/Ende auch speichern, falls noch nicht vorhanden
            if (configObj.start === undefined) configObj.start = item.start;
            if (configObj.end === undefined) configObj.end = item.end;
        }
    }

    // --- Anwenden der Explosion auf die explodierbaren Objekte ---
    // Setzt die Position jedes Objekts neu: Originalposition + berechneter Offset.
    updateExplosion() {
        this.explodableObjects.forEach(item => {
            const offset = this._calculateOffset(item);
            item.object.position.copy(item.originalPosition).add(offset);
        });
    }

    // --- Aktualisiert die Originalposition basierend auf der aktuellen Position und dem Animationsstatus ---
    // Wichtig für den Editor: Wenn ein Objekt verschoben wird, während eine Animation aktiv ist (expFactor > 0),
    // muss die 'originalPosition' so angepasst werden, dass die Animation relativ zur neuen Position korrekt bleibt.
    // Berechnung: originalPosition = aktuellePosition - aktuellerOffset
    updateOriginalPosition(object) {
        const item = this.explodableObjects.find(i => i.object === object);
        if (item) {
            const offset = this._calculateOffset(item);
            item.originalPosition.copy(object.position).sub(offset);
        }
    }

    // --- Aktuellen Status der Animation abfragen ---
    getAnimationState() {
        return {
            isAnimating: this.isAnimating,
            isReversed: this.isReversed,
            isPaused: this.isPaused,
            currentProgress: this.config.animationConfig.expFactor
        }
    }
    
    // --- Play/ Pause Animation ---
    toggleAnimation() {
        if (this.isAnimating){
            this.pauseAnimation();
        } else {
            this.startAnimation();
        }
    }

    pauseAnimation() {
        this.isAnimating = false;
        this.isPaused = true;
        if (this.animation) {
            this.animation.pause();
        }
    }

    // --- Starten der Animation ---
    startAnimation(){
        if (this.isAnimating) return;
        this.isAnimating = true;
        this.isPaused = false;

        // Zielwert der Animation basierend auf der Richtung bestimmen
        let target = this.isReversed ? 0 : 1;

        // Animiere den expFactor von seinem aktuellen Wert auf 1
        this.animation = animate(this.config.animationConfig,{
            expFactor: target,
            duration: this.config.animationConfig.animationDuration || 1000, // Dauer in ms
            ease: this.config.animationConfig.useSequenceAnim ? 'inOut' : 'inOut(8)',
            onUpdate: () => {
            },
            onComplete: () => {
                this.isAnimating = false;
                // Nur wenn die Animation vollständig abgeschlossen ist,
                // wird die Richtung umgekehrt für die nächste Animation
                if ((target === 1 && this.config.animationConfig.expFactor >= 0.99) || 
                    (target === 0 && this.config.animationConfig.expFactor <= 0.01)) {
                    this.isReversed = !this.isReversed;
                }
            }
        });
    }

    setExplosionFactorAnimated(targetExplosionFactor) {
        // Begrenzen des Faktors auf 0 bis 1 --> Auf und abrunden auf 0 bzw. 1
        targetExplosionFactor = Math.min(Math.max(targetExplosionFactor, 0), 1);
        
        // Animiere zum Zielwert
        animate(this.config.animationConfig, {
            expFactor: targetExplosionFactor,
            duration: 300, // Dauer der Glättung in ms
            easing: 'easeOutQuad', // Sanfte Abflachung am Ende
        });
    }

    // --- Initialisieren der Scrollanimation ---
    initScrollListener() {
        this.scrollSensitivity = this.config.animationConfig.scrollSensitivity || 0.01;
        let targetExplosionFactor = this.config.animationConfig.expFactor;

        // Event-Listener für scrollen auf der Seite
        this._wheelListener = (event) => {
            event.preventDefault();
            
            if(this.config.animationConfig.allowScrollAnimation === false){
                return;
            }

            // Explosionsfaktor anpassen
            targetExplosionFactor += event.deltaY * this.scrollSensitivity;
            
            targetExplosionFactor = Math.min(Math.max(targetExplosionFactor, 0), 1);

            this.setExplosionFactorAnimated(targetExplosionFactor);

        };
        this.renderer.domElement.addEventListener('wheel', this._wheelListener, { passive: false });
    }

    removeScrollListener () {
        if (this.renderer && this.renderer.domElement && this._wheelListener) {
            this.renderer.domElement.removeEventListener('wheel', this._wheelListener, { passive: false });
            this._wheelListener = null;
        }
    }

    // --- Edit-Mode Helpers ---
    getExplodableItem(object) {
        return this.explodableObjects.find(i => i.object === object);
    }

    updateExplosionTarget(object, direction, targetLevel) {
        const item = this.getExplodableItem(object);
        if (!item) return;
    
        item.expDirection.copy(direction);
        item.targetLevel = targetLevel;
    
        // Update the source config object
        if (this.explosionConfig && this.explosionConfig.objects[object.name]) {
            const configObj = this.explosionConfig.objects[object.name];
            configObj.level = item.targetLevel;
            configObj.expDirection = item.expDirection.toArray();
        }
    }

    updateObjectConfigByName(objectName, newConfig) {
        const item = this.explodableObjects.find(i => i.object.name === objectName);
        if (item) {
            this.updateObjectConfig(item.object, newConfig);
            
            // Update der Position für direktes visuelles Feedback
            if (!this.isAnimating) {
                const offset = this._calculateOffset(item);
                item.object.position.copy(item.originalPosition).add(offset);
            }
        }
    }

    updateObjectConfig(object, newConfig) {
        let item = this.getExplodableItem(object);
        
        // Objekt ohne Animation eine Animation hinzufügen (Editor)
        if (!item) {
            item = {
                object: object,
                originalPosition: object.position.clone(),
                targetLevel: 0,
                start: 0,
                end: 1,
                expDirection: new THREE.Vector3(0, 1, 0)
            };
            this.explodableObjects.push(item);
        }

        if (newConfig.expDirection) item.expDirection.copy(newConfig.expDirection);
        if (newConfig.targetLevel !== undefined) item.targetLevel = newConfig.targetLevel;
        if (newConfig.start !== undefined) item.start = newConfig.start;
        if (newConfig.end !== undefined) item.end = newConfig.end;

        // Internes Config-Objekt erstellen oder aktualisieren
        if (this.explosionConfig) {
            if (!this.explosionConfig.objects) {
                this.explosionConfig.objects = {};
            }
            
            // Config für dieses Objekt erstellen oder aktualisieren
            if (!this.explosionConfig.objects[object.name]) {
                this.explosionConfig.objects[object.name] = {};
            }
            
            const configObj = this.explosionConfig.objects[object.name];
            configObj.level = item.targetLevel;
            configObj.expDirection = item.expDirection.toArray();
            if (item.start !== undefined) {
                configObj.start = item.start;
            }
            if (item.end !== undefined) {
                configObj.end = item.end;
            }
        }
    }

    deleteAnimation(object) {
        // Entferne aus explodableObjects Array
        const index = this.explodableObjects.findIndex(i => i.object === object);
        if (index !== -1) {
            const item = this.explodableObjects[index];
            
            // Objekt zurück zur Originalposition setzen
            object.position.copy(item.originalPosition);
            
            // Aus Array entfernen
            this.explodableObjects.splice(index, 1);
        }
        
        // Aus explosionConfig entfernen
        if (this.explosionConfig && this.explosionConfig.objects && this.explosionConfig.objects[object.name]) {
            delete this.explosionConfig.objects[object.name];
        }
        
        console.log(`Animation für ${object.name} gelöscht`);
    }

    exportConfig() {
        if (!this.explosionConfig) return;

        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(this.explosionConfig, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", "exp-config.json");
        document.body.appendChild(downloadAnchorNode); // required for firefox
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    }

    getExplosionConfig() {
        return this.explosionConfig;
    }

    async setExplosionConfig(newConfig) {
        this.explosionConfig = newConfig;
        if (this.model) {
            this._parseModel(this.model);
        }
    }

    // --- Timeline-Editor Hilfsmethoden ---

    //Gibt den aktuellen Fortschritt als Prozent (0-100) zurück
    getProgressPercent() {
        return this.config.animationConfig.expFactor * 100;
    }

    // Setzt den Fortschritt animiert (0-100%)
    setProgress(percent) {
        const factor = Math.max(0, Math.min(100, percent)) / 100;
        this.setExplosionFactorAnimated(factor);
    }

    //Springt direkt zu einem Progress-Wert ohne Animation
    seekToProgress(percent) {
        const factor = Math.max(0, Math.min(100, percent)) / 100;
        this.config.animationConfig.expFactor = factor;
    }

    // Setzt die Gesamtdauer der Animation (ms)
    setAnimationDuration(durationMs) {
        if (durationMs > 0) {
            this.config.animationConfig.animationDuration = durationMs;
        }
    }

    // Gibt die aktuelle Zeit basierend auf Progress und Dauer zurück
    getCurrentTime() {
        const duration = this.config.animationConfig.animationDuration || 1500;
        return this.config.animationConfig.expFactor * duration;
    }

    // Gibt die Gesamtdauer der Animation zurück
    getTotalDuration() {
        return this.config.animationConfig.animationDuration || 1500;
    }

    destroy() {
        // Animation stoppen
        if (this.animation) {
            this.animation.pause();
            this.animation = null;
        }
        // Event-Listiner entfernen
        if (this.renderer && this.renderer.domElement) {
            this.renderer.domElement.removeEventListener('wheel', this._wheelListener, { passive: false });
        }
        // Speicher freigeben
        this.explodableObjects = null;
        this.explosionConfig = null;
        this.scene = null;
        this.config = null;
        this.renderer = null;
        this.animationConfig = null;
        this.maxSequence = null;
        this.isAnimating = null;
        this.isReversed = null;
        this.isPaused = null;
        this._wheelListener = null;
    }
}