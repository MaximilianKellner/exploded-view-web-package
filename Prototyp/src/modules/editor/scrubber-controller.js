/**
 * ScrubberController
 * Verwaltet nur die Scrubber-UI und delegiert Animation-Logik an AnimationHandler
 * Play/Pause/Duration werden via AnimationHandler verwaltet (anime.js)
 */
export class ScrubberController {
    constructor(animationHandler, dataManager, uiElements) {
        this.animationHandler = animationHandler;
        this.dataManager = dataManager;
        
        // UI-Elemente
        this.timeInput = uiElements.timeInput;
        this.scrubber = uiElements.scrubber;
        this.scrubberHead = uiElements.scrubberHead;
        this.timelineHeader = uiElements.timelineHeader;
        this.timelineColumn = uiElements.timelineColumn;
        this.playPauseBtn = uiElements.playPauseBtn;
        this.startBtn = uiElements.startBtn;
        this.endBtn = uiElements.endBtn;
        
        // Scrubber-Zustand
        this.isDraggingScrubber = false;
        this.syncFrameId = null;
        
        this._init();
    }

    _init() {
        this._setupEventListeners();
        this._updateScrubberFromAnimation();
    }

    // Setzt alle Event-Listener für Scrubber und Controls auf
    _setupEventListeners() {
        // Scrubber dragging (Timeline Header & Column)
        if (this.timelineHeader) {
            this.timelineHeader.addEventListener('mousedown', (e) => this._onScrubberMouseDown(e));
        }
        
        if (this.timelineColumn) {
            this.timelineColumn.addEventListener('mousedown', (e) => this._onScrubberMouseDown(e));
        }

        // Mouse move & up für Scrubber
        document.addEventListener('mousemove', (e) => this._onScrubberMouseMove(e));
        document.addEventListener('mouseup', () => this._onScrubberMouseUp());

        // Play Button - delegiert an AnimationHandler
        if (this.playPauseBtn) {
            this.playPauseBtn.addEventListener('click', () => {
                this.animationHandler.toggleAnimation();
                this._updatePlayPauseButtonState();
                this._syncScrubberWithAnimation();
            });
        }

        // Start Button - Sprung zu 0%
        if (this.startBtn) {
            this.startBtn.addEventListener('click', () => this.seekTo(0));
        }

        // End Button - Sprung zu 100%
        if (this.endBtn) {
            this.endBtn.addEventListener('click', () => this.seekTo(100));
        }

        // Time Input: Duration ändern
        if (this.timeInput) {
            this.timeInput.addEventListener('change', (e) => {
                const newDuration = parseInt(e.target.value) || this.dataManager.getAnimationDuration();
                this.animationHandler.setAnimationDuration(newDuration);
                this.dataManager.setAnimationDuration(newDuration);
                console.log('✓ Animation-Dauer aktualisiert:', newDuration + 'ms');
            });
        }
    }

    // Scrubber Dragging: Mouse Down
    _onScrubberMouseDown(e) {
        // Nicht auf Keyframe-Handles reagieren
        if (e.target.classList.contains('keyframe-handle')) {
            return;
        }
        
        this.isDraggingScrubber = true;
        // Pause während Drag
        if (this.animationHandler.isAnimating) {
            this.animationHandler.pauseAnimation();
        }
        this._moveScrubberToMouse(e);
    }

    // Scrubber Dragging: Mouse Move
    _onScrubberMouseMove(e) {
        if (this.isDraggingScrubber) {
            this._moveScrubberToMouse(e);
        }
    }

    // Scrubber Dragging: Mouse Up
    _onScrubberMouseUp() {
        this.isDraggingScrubber = false;
    }

    // Bewegt Scrubber zu Maus-Position und aktualisiert AnimationHandler
    _moveScrubberToMouse(e) {
        const rect = this.timelineHeader.getBoundingClientRect();
        let x = e.clientX - rect.left;

        // Begrenzung auf 0-100%
        x = Math.max(0, Math.min(x, rect.width));

        // Prozent berechnen
        const percent = (x / rect.width) * 100;
        
        // Scrubber-UI aktualisieren
        this._updateScrubberPosition(percent);
        
        // AnimationHandler seekToProgress (sofort, kein Drag-Feedback nötig)
        this.animationHandler.seekToProgress(percent);
    }

    // Aktualisiert Scrubber-Visuals basierend auf Prozent (0-100)
    _updateScrubberPosition(percent) {
        percent = Math.max(0, Math.min(100, percent));
        const percentStr = Math.round(percent) + '%';
        
        if (this.scrubber) {
            this.scrubber.style.left = percentStr;
        }
        if (this.scrubberHead) {
            this.scrubberHead.style.left = percentStr;
            this.scrubberHead.setAttribute('data-percent', percentStr);
        }
    }

    /**
     * Synchronisiert Scrubber mit AnimationHandler während Play
     * Nutzt RequestAnimationFrame um UI in Sync mit Animation zu halten
     */
    _syncScrubberWithAnimation() {
        if (!this.animationHandler.isAnimating) {
            return;
        }

        const progress = this.animationHandler.getProgressPercent();
        this._updateScrubberPosition(progress);

        this.syncFrameId = requestAnimationFrame(() => this._syncScrubberWithAnimation());
    }

    // Startet Scrubber-Synchronisation wenn Animation beginnt
    _updateScrubberFromAnimation() {
        // Initiales Update
        const progress = this.animationHandler.getProgressPercent();
        this._updateScrubberPosition(progress);
    }

    // Aktualisiert Play-Button visuellen Status
    _updatePlayPauseButtonState() {
        if (!this.playPauseBtn) return;
        
        if (this.animationHandler.isAnimating) {
            this.playPauseBtn.classList.add('playing');
            this._syncScrubberWithAnimation();
        } else {
            this.playPauseBtn.classList.remove('playing');
            if (this.syncFrameId) {
                cancelAnimationFrame(this.syncFrameId);
                this.syncFrameId = null;
            }
        }
    }

    // Zu spezifischer Position springen (Prozent 0-100)
    seekTo(percent) {
        // Pausiere Animation
        if (this.animationHandler.isAnimating) {
            this.animationHandler.pauseAnimation();
            this._updatePlayPauseButtonState();
        }
        
        // Seek zu Position
        this.animationHandler.seekToProgress(percent);
        this._updateScrubberPosition(percent);
        
        console.log(`Seek zu ${Math.round(percent)}%`);
    }

    // Gibt aktuellen Progress zurück (0-100)
    getCurrentProgress() {
        return this.animationHandler.getProgressPercent();
    }

    // Gibt aktuellen Status zurück
    getStatus() {
        return {
            isPlaying: this.animationHandler.isAnimating,
            progress: this.animationHandler.getProgressPercent(),
            duration: this.animationHandler.getTotalDuration(),
        };
    }

    destroy() {
        if (this.syncFrameId) {
            cancelAnimationFrame(this.syncFrameId);
            this.syncFrameId = null;
        }
    }
}