/**
 * KeyframeController
 * Verwaltet die Keyframe-Handle Interaktionen: Dragging, Constraints, Synchronisation
 * Handelt die Bewegung von Keyframe-Bars und aktualisiert TimelineDataManager
 */
export class KeyframeController {
    constructor(dataManager, timelineElement) {
        this.dataManager = dataManager;
        this.timelineElement = timelineElement;
        
        // State für Handle-Dragging
        this.activeHandle = null;
        this.activeBar = null;
        this.handleType = null; // 'left' oder 'right'
        this.isDraggingHandle = false;
        
        // Constraints
        this.minWidth = 1; // Mindestbreite in %
        
        // Callbacks für externe Listener
        this.callbacks = {};
        
        this._init();
    }

    _init() {
        this._setupEventListeners();
    }

    //Registriert einen Callback für Keyframe-Änderungen
    setCallbacks(callbacks) {
        this.callbacks = callbacks;
    }

    // Setzt alle Event-Listener für Keyframe-Handles auf
    _setupEventListeners() {
        // Event-Delegation: Höher-Level Listener auf timelineElement
        if (this.timelineElement) {
            this.timelineElement.addEventListener('mousedown', (e) => this._onHandleMouseDown(e));
            document.addEventListener('mousemove', (e) => this._onHandleMouseMove(e));
            document.addEventListener('mouseup', () => this._onHandleMouseUp());
        }
    }

    // Keyframe Handle: Mouse Down
    _onHandleMouseDown(e) {
        // Nur auf Keyframe-Handles reagieren
        if (!e.target.classList.contains('keyframe-handle')) {
            return;
        }

        // Nur linke Maustaste
        if (e.button !== 0) {
            return;
        }

        this.isDraggingHandle = true;
        this.activeHandle = e.target;
        this.activeBar = this.activeHandle.closest('.keyframe-bar');

        if (!this.activeBar) return;

        // Handle-Typ bestimmen: left=0 (Start), right=100% (End)
        this.handleType = parseFloat(this.activeHandle.style.left) === 0 ? 'left' : 'right';

        // Visuelles Feedback
        this._setUserSelectDisabled(true);
        e.preventDefault();
        document.body.style.cursor = 'ew-resize';
        this.activeBar.classList.add('dragging');
    }

    // Keyframe Handle: Mouse Move
    _onHandleMouseMove(e) {
        if (!this.isDraggingHandle || !this.activeBar) {
            return;
        }

        e.preventDefault();
        this._moveHandleToMouse(e);
    }

    // Keyframe Handle: Mouse Up
    _onHandleMouseUp() {
        if (!this.isDraggingHandle) {
            return;
        }

        this.isDraggingHandle = false;
        this._onHandleRelease();
    }

    // Bewegt Handle zu Maus-Position mit Constraints
    _moveHandleToMouse(e) {
        const timelineRect = this.timelineElement.getBoundingClientRect();
        let x = e.clientX - timelineRect.left;

        // Begrenzung auf Timeline-Bereich
        x = Math.max(0, Math.min(x, timelineRect.width));

        // Prozent berechnen (0-100%)
        let newPercent = (x / timelineRect.width) * 100;
        newPercent = Math.max(0, Math.min(100, newPercent));

        // Einrasten an ganzen Prozentwerten
        newPercent = Math.round(newPercent);

        // Aktuelle Bar-Werte
        const currentLeft = Math.round(parseFloat(this.activeBar.style.left) || 0);
        const currentWidth = Math.round(parseFloat(this.activeBar.style.width) || 0);
        const currentRight = currentLeft + currentWidth;

        // Handle-Bewegung mit Constraints
        if (this.handleType === 'left') {
            // Linker Handle (Start):
            // - Darf nicht über rechten Handle hinausgehen (maxLeft = currentRight - minWidth)
            // - Breite wächst/schrumpft nach rechts
            const maxLeft = Math.max(0, currentRight - this.minWidth);
            newPercent = Math.min(newPercent, maxLeft);

            const newWidth = currentRight - newPercent;
            this.activeBar.style.left = Math.round(newPercent) + '%';
            this.activeBar.style.width = Math.round(newWidth) + '%';
        } else {
            // Rechter Handle (End):
            // - Darf nicht unter linken Handle hinausgehen (minRight = currentLeft + minWidth)
            // - Breite wächst/schrumpft nach rechts
            const minRight = Math.min(100, currentLeft + this.minWidth);
            newPercent = Math.max(newPercent, minRight);

            const newWidth = newPercent - currentLeft;
            this.activeBar.style.width = Math.round(newWidth) + '%';
        }
    }

    // Werte persistieren und synchronisieren
    _onHandleRelease() {
        if (!this.activeHandle || !this.activeBar) {
            return;
        }

        // Aktuelle Werte aus DOM auslesen
        const startPercent = Math.round(parseFloat(this.activeBar.style.left) || 0);
        const width = Math.round(parseFloat(this.activeBar.style.width) || 0);
        const endPercent = startPercent + width;

        // Objekt-ID ermitteln
        const timelineRowItem = this.activeBar.closest('.timeline-row-item');
        const objectId = timelineRowItem?.getAttribute('data-object-id');

        // Mit DataManager synchronisieren
        if (objectId && this.dataManager) {
            this.dataManager.updateKeyframe(objectId, startPercent, endPercent);
            console.log(`Keyframe aktualisiert: ${objectId} [${startPercent}%-${endPercent}%]`);
            
            // Callback für externe Listener (z.B. EditorPanel)
            if (this.callbacks.onKeyframeChange) {
                const normalizedStart = this.dataManager.percentToNormalized(startPercent);
                const normalizedEnd = this.dataManager.percentToNormalized(endPercent);
                this.callbacks.onKeyframeChange(objectId, normalizedStart, normalizedEnd);
            }
        }

        // Cleanup
        document.body.style.cursor = '';
        this._setUserSelectDisabled(false);
        this.activeBar.classList.remove('dragging');
        this.activeHandle = null;
        this.activeBar = null;
        this.handleType = null;
    }

    // Initialisiert alle Keyframe-Handles --> für EditorTimeline
    initializeKeyframeHandles() {
        if (!this.timelineElement) return;

        const handles = this.timelineElement.querySelectorAll('.keyframe-handle');
        // Keine zusätzliche Initialisierung nötig - Event-Delegation läuft über _setupEventListeners
        console.log(`KeyframeController: ${handles.length} Keyframe-Handles initialisiert`);
    }

    /**
     * Initialisiert Keyframe-Handles für ein neu hinzugefügtes Objekt
     * Event-Delegation funktioniert automatisch über _setupEventListeners
     */
    initializeKeyframeHandlesForObject(objectId) {
        if (!this.timelineElement) return;
        
        const rowItem = this.timelineElement.querySelector(`[data-object-id="${objectId}"]`);
        if (!rowItem) return;
        
        const handles = rowItem.querySelectorAll('.keyframe-handle');
        console.log(`KeyframeController: ${handles.length} Keyframe-Handles für "${objectId}" initialisiert`);
    }

    // Aktualisiert Keyframe-Bar visuell (z.B. nach Daten-Änderung)
    updateKeyframeBar(objectId, startPercent, endPercent) {
        const rowItem = this.timelineElement?.querySelector(`[data-object-id="${objectId}"]`);
        if (!rowItem) return;

        const keyframeBar = rowItem.querySelector('.keyframe-bar');
        if (!keyframeBar) return;

        const width = Math.max(this.minWidth, endPercent - startPercent);

        keyframeBar.style.left = Math.round(startPercent) + '%';
        keyframeBar.style.width = Math.round(width) + '%';
    }

    // Gibt alle Keyframe-Daten zurück
    getAllKeyframes() {
        if (!this.timelineElement) return [];

        const keyframes = [];
        const timelineRows = this.timelineElement.querySelectorAll('.timeline-row-item');

        timelineRows.forEach(row => {
            const objectId = row.getAttribute('data-object-id');
            const keyframeBar = row.querySelector('.keyframe-bar');

            if (keyframeBar) {
                const startPercent = Math.round(parseFloat(keyframeBar.style.left) || 0);
                const width = Math.round(parseFloat(keyframeBar.style.width) || 0);
                const endPercent = startPercent + width;

                keyframes.push({
                    objectId,
                    startPercent,
                    endPercent,
                    duration: width,
                });
            }
        });

        return keyframes;
    }

    destroy() {
        if (this.isDraggingHandle) {
            this._onHandleMouseUp();
        }
        this.activeHandle = null;
        this.activeBar = null;
        this.timelineElement = null;
        this.dataManager = null;
    }

    _setUserSelectDisabled(isDisabled) {
        if (!document?.body) {
            return;
        }

        document.body.classList.toggle('no-user-select', isDisabled);
    }
}
