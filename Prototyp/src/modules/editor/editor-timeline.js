import '../../css/editor-timeline.css';
import { TimelineDataManager } from './timeline-data-manager.js';
import { ScrubberController } from './scrubber-controller.js';

export class EditorTimeline {
    constructor(container, animationHandler, explosionConfigPath) {
        this.container = container;
        this.animationHandler = animationHandler;
        this.explosionConfigPath = explosionConfigPath;
        
        this.dataManager = null;
        this.scrubberController = null;
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

        this._initDataManager();
    }

    async _initDataManager() {
        try {
            this.dataManager = new TimelineDataManager(this.animationHandler, this.explosionConfigPath);
            await this.dataManager._init();
            this._init();
        } catch (error) {
            console.error('Fehler beim Initialisieren des TimelineDataManager:', error);
        }
    }
    
    _init() {
        this.element = document.createElement('div');
        this.element.className = 'timeline-container';
        
        // Objekte aus dataManager laden
        const objects = this.dataManager?.getObjects() || [];
        const duration = this.dataManager?.getAnimationDuration() || 1500;
        const objectCount = objects.length;
        
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
                <input type="number" id="time-input" value="${duration}" max="999999" min="1">
                <span class="unit">ms</span>
            </span>
        </div>
    </div>

    <div class="obj-timeline-container">
        <!-- Grid Header: Sticky -->
        <div class="grid-header-left">
            <h2>Animierte Objekte</h2>
            <p id="object-count">(${objectCount}/${objectCount})</p>
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
        this._initScrubberController();
        this._setupKeyframeHandles();
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
    
    // DOM Element Referenzen für bessere Performance
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
    }

    _setupEventListeners() {
        // Scrubber Movement: Klickbereich Timeline-Header und Timeline-Column
        this.timelineHeader.addEventListener('mousedown', (e) => {
            this.isDragging = true;
            this._moveScrubber(e);
        });

        this.timelineColumn.addEventListener('mousedown', (e) => {
                this.isDragging = true;
                this._moveScrubber(e);
        });

        window.addEventListener('mousemove', (e) => {
            if (this.isDragging) {
                this._moveScrubber(e);
            }
            if (this.activeHandle && this.activeBar) {
                this._moveKeyframeHandle(e);
            }
        });

        window.addEventListener('mouseup', () => {
            if (this.isDragging) {
                this.isDragging = false;
            }
            if (this.activeHandle && this.activeBar) {
                this._onKeyframeHandleRelease();
            }
        });

        // Initial-Position setzen
        const currentPercent = parseInt(this.scrubberHead.getAttribute('data-percent')) || 0;
        const percentStr = currentPercent + '%';
        this.scrubber.style.left = percentStr;
        this.scrubberHead.style.left = percentStr;

        // Keyframe Handle Interaktivität
        this._setupKeyframeHandles();
        
        // Time-Input Event: Wenn Duration geändert wird
        if (this.timeInput) {
            this.timeInput.addEventListener('change', (e) => {
                const newDuration = parseInt(e.target.value) || 1500;
                if (this.dataManager) {
                    this.dataManager.setAnimationDuration(newDuration);
                    console.log('Animation-Dauer aktualisiert:', newDuration + 'ms');
                }
            });
        }
    }

    // ScrubberController verwaltet jetzt move scrubber --> Bleibt hier für Keyframe-Handle Interaktion erhalten
    _moveScrubber(e, snap = true) {
        // Delegiert an ScrubberController (falls dieser initialisiert ist)
        console.log('-------------- RETURN --------------');
        if (this.scrubberController) {

            // ScrubberController kümmert sich um Scrubber-Bewegung
            return;
        }

        console.log('EditorTimeline: _moveScrubber aufgerufen');

        const rect = this.timelineHeader.getBoundingClientRect();
        let x = e.clientX - rect.left;

        // Begrenzung auf 0-100%
        if (x < 0) x = 0;
        if (x > rect.width) x = rect.width;

        // Prozent berechnen
        let percent = (x / rect.width) * 100;

        // Beim Ziehen einrasten lassen
        if (snap) {
            percent = Math.round(percent);
        }

        // Beide Scrubber-Teile synchron bewegen
        const percentStr = Math.round(percent) + '%';
        this.scrubber.style.left = percentStr;
        this.scrubberHead.style.left = percentStr;
        this.scrubberHead.setAttribute('data-percent', percentStr);
        
        // AnimationHandler aktualisieren
        if (this.animationHandler) {
            this.animationHandler.seekToProgress(percent);
        }
    }

    getScrubberPosition() {
        const percent = this.scrubber.getAttribute('data-percent');
        return percent ? parseInt(percent) : 0;
    }

    _setupKeyframeHandles() {
        const handles = this.element.querySelectorAll('.keyframe-handle');
        handles.forEach(handle => {
            handle.addEventListener('mousedown', (e) => {

                // Entfernt --> Scrubber als % label nutzen und später live vorschau.
                //e.stopPropagation(); // Verhindert Scrubber-Bewegung

                this.activeHandle = handle;
                this.activeBar = handle.closest('.keyframe-bar');
                
                // Handle-Typ über keyframe-handle.style.left bestimmen: 0 = links, 100% = rechts
                this.handleType = parseFloat(handle.style.left) === 0 ? 'left' : 'right';
                
                // Cursor --> Griff-Icon
                document.body.style.cursor = 'ew-resize';
            });
        });
    }

    _moveKeyframeHandle(e) {
        const timelineRect = this.timelineColumn.getBoundingClientRect();
        let x = e.clientX - timelineRect.left;
        
        // Begrenzung auf Timeline-Bereich
        if (x < 0) x = 0;
        if (x > timelineRect.width) x = timelineRect.width;
        
        let newPercent = (x / timelineRect.width) * 100;
        newPercent = Math.max(0, Math.min(100, newPercent));
        
        // Einrasten an ganzen Prozentwerten
        newPercent = Math.round(newPercent);
        
        // Aktuelle Bar-Werte (gerundet)
        const currentLeft = Math.round(parseFloat(this.activeBar.style.left) || 0);
        const currentWidth = Math.round(parseFloat(this.activeBar.style.width) || 0);
        const currentRight = currentLeft + currentWidth;
        
        const minWidth = 1; // Mindestbreite 1%
        
        if (this.handleType === 'left') {
            // Linker Handle (Start)
            const maxLeft = currentRight - minWidth;
            newPercent = Math.min(newPercent, maxLeft);
            
            const newWidth = currentRight - newPercent;
            this.activeBar.style.left = Math.round(newPercent) + '%';
            this.activeBar.style.width = Math.round(newWidth) + '%';
        } else {
            // Rechter Handle (End)
            const minRight = currentLeft + minWidth;
            newPercent = Math.max(newPercent, minRight);
            
            const newWidth = newPercent - currentLeft;
            this.activeBar.style.width = Math.round(newWidth) + '%';
        }
    }

    _onKeyframeHandleRelease() {
        if (this.activeHandle && this.activeBar) {
            // Werte ausgeben
            const startPercent = Math.round(parseFloat(this.activeBar.style.left) || 0);
            const width = Math.round(parseFloat(this.activeBar.style.width) || 0);
            const endPercent = startPercent + width;
            
            // Objekt-ID ermitteln
            const objectId = this.activeBar.closest('.timeline-row-item')?.getAttribute('data-object-id');
            
            if (objectId && this.dataManager) {
                // Keyframe mit DataManager aktualisieren
                this.dataManager.updateKeyframe(objectId, startPercent, endPercent);
            }
            
            console.log(`Keyframe Position: ${startPercent}%-${endPercent}%`);
            
            // Cursor zurücksetzen
            document.body.style.cursor = '';
        }
        
        this.activeHandle = null;
        this.activeBar = null;
        this.handleType = null;
    }

    show() {
        if (this.element) {
            this.element.style.display = 'flex';
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

        if (this.element && this.element.parentElement) {
            this.element.parentElement.removeChild(this.element);
        }
    }

    // Gibt Zugriff auf den ScrubberController für externe Steuerung
    getScrubberController() {
        return this.scrubberController;
    }
}
    