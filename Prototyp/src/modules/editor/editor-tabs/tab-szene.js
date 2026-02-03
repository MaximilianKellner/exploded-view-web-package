import { EditorColorPicker } from '../editor-colorpicker.js';
import '../../../css/editor-colorpicker.css';
import '../../../css/editor-components.css';
import '../../../css/tabs/editor-scene-tab.css';

/**
 * Szene-Tab: Verwaltet Szenen-Einstellungen (Hintergrund, Beleuchtung, etc.)
 * Kappselt UI und Logik, liefert ein Root-Element zur Integration in Editor-Sidebar.
 */
export class TabScene {
    constructor({ scene, renderer, config }) {
        this.scene = scene;
        this.renderer = renderer;
        this.config = config;

        this.element = null;
        this.inputs = {};
        this.colorPickers = {};

        this._init();
    }

    _init() {
        // Root Container
        this.element = document.createElement('div');
        this.element.className = 'editor-content';

        // HTML-Struktur mit einklappbaren Sektionen
        this.element.innerHTML = `
                <details class="editor-details" open>
                    <summary>Szene</summary>
                    <div class="editor-row">
                        <span class="editor-label">Hintergrund</span>
                        <div class="custom-picker-wrapper" data-picker="background">
                            <div class="picker-trigger">
                                <div class="color-preview-box"></div>
                                <div class="color-hex-label"></div>
                            </div>
                        </div>
                    </div>
                </details>

                <details class="editor-details" open>
                    <summary>Sun / Hauptlicht</summary>
                    <div class="editor-row">
                        <span class="editor-label">Farbe</span>
                        <div class="custom-picker-wrapper" data-picker="sunColor">
                            <div class="picker-trigger">
                                <div class="color-preview-box"></div>
                                <div class="color-hex-label"></div>
                            </div>
                        </div>
                    </div>

                    <div class="editor-row">
                        <span class="editor-label">Stärke</span>
                        <div class="slider-container">
                            <div class="slider-value" id="sun-intensity-value">60</div>
                            <div class="slider-wrapper">
                                <input type="range" class="editor-slider" id="sun-intensity" min="0" max="100" value="60" />
                            </div>
                        </div>
                    </div>

                    <div class="editor-row">
                        <span class="editor-label">Richtung</span>
                        <div class="editor-input-group bordered">
                            <input type="number" step="0.1" class="editor-input editor-vector-input" id="dir-x" placeholder="X" value="1">
                            <span class="vertical-divider"></span>
                            <input type="number" step="0.1" class="editor-input editor-vector-input" id="dir-y" placeholder="Y" value="1">
                            <span class="vertical-divider"></span>
                            <input type="number" step="0.1" class="editor-input editor-vector-input" id="dir-z" placeholder="Z" value="1">
                        </div>
                    </div>
                </details>
        `;

        // ColorPicker initialisieren
        const sceneConfig = this.config?.sceneConfig;
        const bgColor = sceneConfig?.backgroundColor || 
                       (this.scene?.background?.isColor ? '#' + this.scene.background.getHexString() : '#1e1e1e');

        const backgroundWrapper = this.element.querySelector('[data-picker="background"]');
        const sunColorWrapper = this.element.querySelector('[data-picker="sunColor"]');

        this.colorPickers.background = new EditorColorPicker(
            backgroundWrapper,
            bgColor,
            (color) => this._onBackgroundChange(color)
        );

        this.colorPickers.sunColor = new EditorColorPicker(
            sunColorWrapper,
            '#ffffff',
            (color) => this._onSunColorChange(color)
        );

        // Input-Referenzen
        this.inputs = {
            sunIntensity: this.element.querySelector('#sun-intensity'),
            sunIntensityValue: this.element.querySelector('#sun-intensity-value'),
            dirX: this.element.querySelector('#dir-x'),
            dirY: this.element.querySelector('#dir-y'),
            dirZ: this.element.querySelector('#dir-z'),
        };

        // Event Listener
        this.inputs.sunIntensity.addEventListener('input', (e) => {
            this.inputs.sunIntensityValue.textContent = `${e.target.value}`;
        });
    }

    // Gibt das Root-Element zum Einhängen in Sidebar zurück
    getElement() {
        return this.element;
    }

    //Aktualisiert die Szenen-Einstellungen, falls Config sich geändert hat
    update() {
        const sceneConfig = this.config?.sceneConfig;
        if (!sceneConfig) return;

        if (sceneConfig.backgroundColor) {
            this.colorPickers.background?.setColor(sceneConfig.backgroundColor);
        }
    }

    _onBackgroundChange(color) {
        const sceneConfig = this.config?.sceneConfig;
        if (!sceneConfig) return;

        sceneConfig.backgroundColor = color;
        this.scene?.background?.set(color);
    }

    _onSunColorChange(color) {
        console.log('Sun Color changed:', color);
        // TODO: Sun Light Farbe in der Szene aktualisieren
    }
}
