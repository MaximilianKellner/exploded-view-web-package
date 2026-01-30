import { EditorColorPicker } from './editor-colorpicker.js';
import '../../css/editor-colorpicker.css';
import '../../css/editor-components.css';

export class EditorScenePanel {
    constructor(container, { scene, renderer, config }) {
        this.container = container;
        this.scene = scene;
        this.renderer = renderer;
        this.config = config;

        this.element = null;
        this.inputs = {};
        this.colorPickers = {};

        this._init();
    }

    _init() {
        this.element = document.createElement('div');
        this.element.className = 'editor-scene-panel';

        this.element.innerHTML = `
            <div class="editor-content">
                <h3 class="editor-title">Szenen Einstellungen</h3>

                <details class="editor-details">
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

                <details class="editor-details">
                    <summary>Sun</summary>
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
                                <div class="slider-value" id="sun-intensity-value">0</div>
                                <div class="slider-wrapper">
                                    <input type="range" class="editor-slider" id="sun-intensity" min="0" max="100" value="60" />
                                </div>
                            </div>
                        </div>

                        <div class="editor-row">
                        <span class="editor-label">Richtung</span>
                        <div class="editor-input-group bordered">
                            <input type="number" step="0.1" class="editor-input editor-vector-input" id="dir-x" placeholder="X">
                            <span class="vertical-divider"></span>
                            <input type="number" step="0.1" class="editor-input editor-vector-input" id="dir-y" placeholder="Y">
                            <span class="vertical-divider"></span>
                            <input type="number" step="0.1" class="editor-input editor-vector-input" id="dir-z" placeholder="Z">
                        </div>
                        </div>

                                        <div class="editor-row">
                    <span class="editor-label">Ebene</span>
                    <div class="editor-input-group">
                        <input type="number" step="0.1" class="editor-input" id="layer">
                    </div>
                </div>
                </details>
            </div>
        `;

        this.container.appendChild(this.element);

        // Farben aus Config auslesen
        const sceneConfig = this.config?.sceneConfig;
        const bgColor = sceneConfig?.backgroundColor || 
                       (this.scene?.background?.isColor ? '#' + this.scene.background.getHexString() : '#1e1e1e');

        // ColorPicker mit finalen Werten initialisieren
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

        // Referenzen für andere Inputs
        this.inputs = {
            sunIntensity: this.element.querySelector('#sun-intensity'),
            sunIntensityValue: this.element.querySelector('#sun-intensity-value'),
            dirX: this.element.querySelector('#dir-x'),
            dirY: this.element.querySelector('#dir-y'),
            dirZ: this.element.querySelector('#dir-z'),
        };

        // Event Listener für Slider
        this.inputs.sunIntensity.addEventListener('input', (e) => {
            this.inputs.sunIntensityValue.textContent = `${e.target.value}`;
        });
    }

    show() {
        this.element.classList.add('visible');
    }

    hide() {
        this.element.classList.remove('visible');
    }

    update() {
        const sceneConfig = this.config?.sceneConfig;
        if (!sceneConfig) return;

        // Hintergrundfarbe aktualisieren falls sich Config geändert hat
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
        // Implementierung für Sun Color Change
        console.log('Sun Color changed:', color);
        // TODO: Sun Light Farbe in der Szene aktualisieren
    }
}
