import Pickr from "@simonwep/pickr";
import '@simonwep/pickr/dist/themes/nano.min.css';

export class EditorColorPicker {
    constructor(container, defaultColor = '#333333', onChange = null) {
        this.container = container;
        this.defaultColor = defaultColor;
        this.onChange = onChange;
        this.pickr = null;
        this.previewBox = null;
        this.hexLabel = null;
        this.isInitialized = false;

        this._init();
    }

    _init() {
        const triggerEl = this.container.querySelector('.picker-trigger');
        if (!triggerEl) {
            console.error('EditorColorPicker: .picker-trigger nicht gefunden');
            return;
        }

        this.previewBox = triggerEl.querySelector('.color-preview-box');
        this.hexLabel = triggerEl.querySelector('.color-hex-label');

        // Pickr initialisieren
        this.pickr = Pickr.create({
            el: triggerEl,
            theme: "nano",
            useAsButton: true,
            default: this.defaultColor,

            components: {
                preview: true,
                opacity: false,
                hue: true,
                interaction: {
                    hex: true,
                    input: true,
                    save: false,
                },
            },
        });

        // Events registrieren
        this.pickr.on("change", (color) => {
            this._updateUI(color);
            if (this.onChange) {
                this.onChange(color.toHEXA().toString());
            }
        });

        this.pickr.on("save", (color) => {
            this._updateUI(color);
            this.pickr.hide();
        });

        this.pickr.on('init', instance => {
            this._updateUI(instance.getColor());
            this.isInitialized = true;
        });
    }

    _updateUI(color) {
        if (color && this.previewBox && this.hexLabel) {
            const hex = color.toHEXA().toString().toLowerCase();
            this.hexLabel.textContent = hex;
            this.previewBox.style.backgroundColor = hex;
        }
    }

    // Farbe programmatisch setzen
    setColor(colorString) {
        if (!this.pickr) return;

        // Wenn Pickr noch nicht initialisiert ist, warten wir kurz
        if (!this.isInitialized) {
            setTimeout(() => this.setColor(colorString), 50);
            return;
        }

        this.pickr.setColor(colorString);
        // UI manuell aktualisieren, da setColor nicht automatisch _updateUI triggert
        const color = this.pickr.getColor();
        if (color) {
            this._updateUI(color);
        }
    }

    // Aktuelle Farbe abrufen
    getColor() {
        if (this.pickr) {
            return this.pickr.getColor().toHEXA().toString();
        }
        return null;
    }

    // Picker zerstören (für Cleanup)
    destroy() {
        if (this.pickr) {
            this.pickr.destroyAndRemove();
            this.pickr = null;
        }
    }
}
