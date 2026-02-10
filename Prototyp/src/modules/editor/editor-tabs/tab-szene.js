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
                <summary>Animation</summary>
                <div class="editor-row">
                    <span class="editor-label">Dropdown</span>
                    <div class="editor-dropdown" data-dropdown="animation-mode">
                        <button class="editor-dropdown-toggle" type="button" aria-haspopup="listbox" aria-expanded="false">
                            <span class="editor-dropdown-icon" aria-hidden="true"></span>
                        </button>
                        <div class="editor-dropdown-value">Ghost</div>
                        <ul class="editor-dropdown-menu" role="listbox" aria-hidden="true">
                            <li class="editor-dropdown-option" role="option">test 1</li>
                            <li class="editor-dropdown-option" role="option">test 2</li>
                            <li class="editor-dropdown-option" role="option">test 2</li>
                        </ul>
                    </div>
                </div>
            </details>

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

                <div class="editor-row">
                    <span class="editor-label">Hintergrund</span>
                    
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

        this._setupDropdowns();
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

    _setupDropdowns() {
        const dropdown = this.element.querySelector('[data-dropdown="animation-mode"]');
        if (!dropdown) return;

        const valueEl = dropdown.querySelector('.editor-dropdown-value');
        const toggle = dropdown.querySelector('.editor-dropdown-toggle');
        const menu = dropdown.querySelector('.editor-dropdown-menu');

        const closeDropdown = () => {
            dropdown.classList.remove('is-open');
            if (toggle) toggle.setAttribute('aria-expanded', 'false');
            if (menu) menu.setAttribute('aria-hidden', 'true');
        };

        dropdown.addEventListener('click', (event) => {
            const option = event.target.closest('.editor-dropdown-option');
            if (option && valueEl) {
                valueEl.textContent = option.textContent.trim();
                closeDropdown();
                return;
            }

            const isOpen = dropdown.classList.toggle('is-open');
            if (toggle) toggle.setAttribute('aria-expanded', String(isOpen));
            if (menu) menu.setAttribute('aria-hidden', String(!isOpen));
        });

        document.addEventListener('click', (event) => {
            if (!dropdown.contains(event.target)) {
                closeDropdown();
            }
        });
    }

}
