import { EditorColorPicker } from '../editor-colorpicker.js';

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

        `;

        // ColorPicker initialisieren
        const sceneConfig = this.config?.sceneConfig;
        const bgColor = sceneConfig?.backgroundColor || 
                       (this.scene?.background?.isColor ? '#' + this.scene.background.getHexString() : '#1e1e1e');

        const backgroundWrapper = this.element.querySelector('[data-picker="background"]');
        this.colorPickers.background = new EditorColorPicker(
            backgroundWrapper,
            bgColor,
            (color) => this._onBackgroundChange(color)
        );
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

}
