import '../../css/editor-timeline.css';
import { TimelineDataManager } from './timeline-data-manager.js';
import { ScrubberController } from './scrubber-controller.js';
import { KeyframeController } from './keyframe-controller.js';

export class EditorTimeline {
    constructor(container, animationHandler, explosionConfigPath) {
        this.container = container;
        this.animationHandler = animationHandler;
        this.explosionConfigPath = explosionConfigPath;
        
        this.dataManager = null;
        this.scrubberController = null;
        this.keyframeController = null;
        this.element = null;
        
        // werden in _cacheDOMElements gesetzt
        this.timelineColumn = null;
        this.timelineHeader = null;
        this.scrubber = null;
        this.scrubberHead = null;
        this.timeInput = null;
        this.objectsColumn = null;
        this.playPauseBtn = null;
        this.startBtn = null;
        this.endBtn = null;
        this.einklappenBtn = null;

        this._initDataManager();
    }

    async _initDataManager() {
        try {
            this.dataManager = new TimelineDataManager(this.animationHandler);
            this._init();
        } catch (error) {
            console.error('Fehler beim Initialisieren des TimelineDataManager:', error);
        }
    }
    
    _init() {
        this.element = document.createElement('div');
        this.element.className = 'timeline-container';
        
        // Verhindern, dass Klicks durch die UI auf die 3D-Szene durchgehen
        // Mouseup und Touchend nicht blockieren, damit Drag-Operationen beendet werden können
        ['click', 'mousedown', 'touchstart'].forEach(event => {
            this.element.addEventListener(event, (e) => e.stopPropagation());
        });

        // Objekte aus dataManager laden
        const objects = this.dataManager?.getObjects() || [];
        const duration = this.dataManager?.getAnimationDuration() || 1500;
        const objectCount = objects.length;
        const totalObjectsCount = this.dataManager?.getTotalObjectsCount() || 0;
        
        // HTML-Template für animierte Objekte
        let objectsHtml = objects
            .map(obj => `<div class="object-item" data-object-id="${obj.name}">${obj.name}</div>`)
            .join('');
        
        // HTML-Template für Keyframe-Bars aus start/end Werten
        let keyframesHtml = objects
            .map(obj => {
                const startPercent = this.dataManager.normalizedToPercent(obj.start);
                const endPercent = this.dataManager.normalizedToPercent(obj.end);
                const width = endPercent - startPercent;
                
                return `<div class="timeline-row-item" data-object-id="${obj.name}">
                    <div class="keyframe-bar" style="left: ${startPercent}%; width: ${width}%;">
                        <div class="keyframe-handle" style="left: 0;"></div>
                        <div class="keyframe-handle" style="left: 100%;"></div>
                    </div>
                </div>`;
            })
            .join('');
        
        this.element.innerHTML = `
            <div class="top-bar">
        <div class="anim-btn-group">
            <button id="timeline-start">
                <img src="/icon/editor/start.svg" alt="start icon">
            </button>
            <button id="timeline-play-pause">
                <img src="/icon/editor/play.svg" alt="play icon">
            </button>
            <button id="timeline-end">
                <img src="/icon/editor/end.svg" alt="end icon">
            </button>
        </div>

        <div class="time-control">
            <img src="/icon/editor/timer.svg" alt="timer icon">
            <span>
                <input type="number" id="time-input" value="${duration}" max="99999" min="1">
                <span class="unit">ms</span>
            </span>

            <button id="einklappen">
                <img src="/icon/editor/einklappen.svg" alt="einklappen">
            </button>
        </div>
    </div>

    <div class="obj-timeline-container">
        <!-- Grid Header: Sticky -->
        <div class="grid-header-left">
            <h2>Animierte Objekte</h2>
            <p id="object-count">(${objectCount}/${totalObjectsCount})</p>
        </div>
        
        <!-- Timeline Header: Sticky -->
        <div class="grid-header-right">
            <div class="timeline-header">
                <div class="grid-line" style="left: 0%;" data-label="0%"></div>
                <div class="grid-line" style="left: 25%;" data-label="25%"></div>
                <div class="grid-line" style="left: 50%;" data-label="50%"></div>
                <div class="grid-line" style="left: 75%;" data-label="75%"></div>
                <div class="grid-line" style="left: 100%;" data-label="100%"></div>
                <!-- Scrubber-Kopf im Header -->
                <div id="scrubber-head" style="left: 0%;" data-percent="0%"></div>
            </div>
        </div>

        <!-- Scrollbarer Content-Bereich -->
        <div class="grid-content-wrapper">

            <div class="objects-column">
                ${objectsHtml}
            </div>

            <!-- Timeline Spalte mit Keyframes -->
            <div class="timeline-column" id="timeline">
                <!-- Grid-Lines -->
                <div class="grid-line" style="left: 0%;" data-label=""></div>
                <div class="grid-line" style="left: 25%;" data-label=""></div>
                <div class="grid-line" style="left: 50%;" data-label=""></div>
                <div class="grid-line" style="left: 75%;" data-label=""></div>
                <div class="grid-line" style="left: 100%;" data-label=""></div>
                
                <!-- Scrubber-Linie (läuft durch Timeline) -->
                <div id="scrubber" style="left: 0%;"></div>
                
                ${keyframesHtml}
            </div>
        </div>
    </div>
        `;
        
        this.container.appendChild(this.element);
        this._cacheDOMElements();
        this._initEinklappenButton();
        this._initScrubberController();
        this._initKeyframeController();
    }
    
    //Einklappen-Button zum Ein-/Ausklappen der Timeline
    _initEinklappenButton() {
        if (this.einklappenBtn) {
            this.einklappenBtn.addEventListener('click', () => {
                this.element.classList.toggle('eingeklappt');
                this.einklappenBtn.classList.toggle('eingeklappt');
            });
        }
    }

    /**
     * Initialisiert ScrubberController mit allen UI-Elementen
     */
    _initScrubberController() {
        this.scrubberController = new ScrubberController(
            this.animationHandler,
            this.dataManager,
            {
                timeInput: this.timeInput,
                scrubber: this.scrubber,
                scrubberHead: this.scrubberHead,
                timelineHeader: this.timelineHeader,
                timelineColumn: this.timelineColumn,
                playPauseBtn: this.playPauseBtn,
                startBtn: this.startBtn,
                endBtn: this.endBtn,
            }
        );
    }

    // Initialisiert KeyframeController für Keyframe-Handle Interaktionen
    _initKeyframeController() {
        this.keyframeController = new KeyframeController(
            this.dataManager,
            this.timelineColumn
        );
        this.keyframeController.initializeKeyframeHandles();
    }

    // Setzt Callbacks für Keyframe-Änderungen (für EditorController)
    setKeyframeCallbacks(callbacks) {
        if (this.keyframeController) {
            this.keyframeController.setCallbacks(callbacks);
        }
    }
    _cacheDOMElements() {
        this.timelineColumn = this.element.querySelector('.timeline-column');
        this.timelineHeader = this.element.querySelector('.timeline-header');
        this.scrubber = this.element.querySelector('#scrubber');
        this.scrubberHead = this.element.querySelector('#scrubber-head');
        this.timeInput = this.element.querySelector('#time-input');
        this.objectsColumn = this.element.querySelector('.objects-column');
        
        // Buttons
        this.playPauseBtn = this.element.querySelector('#timeline-play-pause');
        this.startBtn = this.element.querySelector('#timeline-start');
        this.endBtn = this.element.querySelector('#timeline-end');
        this.einklappenBtn = this.element.querySelector('#einklappen');
    }

    /**
     * Aktualisiert die objectCount und fügt neue Objekte zur Timeline UI hinzu
     */
    updateObjectCount() {
        if (!this.dataManager) return;
        
        // Objekt-Liste im DataManager aktualisieren
        this.dataManager.refreshObjects();
        
        // Neue Objektliste aus animationHandler laden
        const objects = this.dataManager.getObjects();
        const objectCount = objects.length;
        const totalObjectsCount = this.dataManager.getTotalObjectsCount();
        
        // Object Count Text aktualisieren
        const countElement = this.element.querySelector('#object-count');
        if (countElement) {
            countElement.textContent = `(${objectCount}/${totalObjectsCount})`;
        }
        
        // Neue Objekte zur Timeline hinzufügen (die nicht bereits vorhanden sind)
        const objectsColumn = this.element.querySelector('.objects-column');
        const timelineColumn = this.element.querySelector('.timeline-column');
        
        if (objectsColumn && timelineColumn) {
            objects.forEach(obj => {
                // Prüfen, ob Objekt bereits in Timeline vorhanden ist
                const existingItem = objectsColumn.querySelector(`[data-object-id="${obj.name}"]`);
                
                if (!existingItem) {
                    // Neues Objekt-Item zur objects-column hinzufügen
                    const objectItem = document.createElement('div');
                    objectItem.className = 'object-item';
                    objectItem.setAttribute('data-object-id', obj.name);
                    objectItem.textContent = obj.name;
                    objectsColumn.appendChild(objectItem);
                    
                    // Neues Keyframe-Row zur timeline-column hinzufügen
                    const startPercent = this.dataManager.normalizedToPercent(obj.start);
                    const endPercent = this.dataManager.normalizedToPercent(obj.end);
                    const width = endPercent - startPercent;
                    
                    const timelineRowItem = document.createElement('div');
                    timelineRowItem.className = 'timeline-row-item';
                    timelineRowItem.setAttribute('data-object-id', obj.name);
                    timelineRowItem.innerHTML = `
                        <div class="keyframe-bar" style="left: ${startPercent}%; width: ${width}%;">
                            <div class="keyframe-handle" style="left: 0;"></div>
                            <div class="keyframe-handle" style="left: 100%;"></div>
                        </div>
                    `;
                    timelineColumn.appendChild(timelineRowItem);
                    
                    // Keyframe-Handles für das neue Objekt initialisieren
                    if (this.keyframeController) {
                        this.keyframeController.initializeKeyframeHandlesForObject(obj.name);
                    }
                }
            });
        }
    }

    show() {
        if (this.element) {
            this.element.style.display = 'block';
        }
    }

    hide() {
        if (this.element) {
            this.element.style.display = 'none';
        }
    }

    destroy() {
        // Cleanup ScrubberController
        if (this.scrubberController) {
            this.scrubberController.destroy();
            this.scrubberController = null;
        }

        // Cleanup KeyframeController
        if (this.keyframeController) {
            this.keyframeController.destroy();
            this.keyframeController = null;
        }

        if (this.element && this.element.parentElement) {
            this.element.parentElement.removeChild(this.element);
        }
    }

    getScrubberController() {
        return this.scrubberController;
    }

    getKeyframeController() {
        return this.keyframeController;
    }
}
    