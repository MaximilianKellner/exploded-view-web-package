import { EditorColorPicker } from './editor-colorpicker.js';
import '../../css/editor-colorpicker.css';
import '../../css/editor-components.css';
import '../../css/editor-light-panel.css';

export class EditorLightPanel {
    constructor(container, { config }) {
        this.container = container;
        this.config = config;

        this.element = null;
        this.inputs = {};
        this.colorPicker = null;
        this.callbacks = {};

        this.currentLight = null;
        this.currentConfigKey = null;

        this._init();
    }

    _init() {
        this.element = document.createElement('div');
        this.element.className = 'editor-light-panel';

        this.element.innerHTML = `
            <div class="editor-content">
                <h3 id="light-title">No Light Selected</h3>

                <div class="editor-row">
                    <span class="editor-label">Typ</span>
                    <div class="editor-value-display" id="light-type">-</div>
                </div>

                <div class="editor-row">
                    <span class="editor-label">Aktiv</span>
                    <div class="editor-input-group">
                        <input type="checkbox" class="editor-checkbox" id="light-enabled" />
                    </div>
                </div>

                <div class="editor-row">
                    <span class="editor-label">Farbe</span>
                    <div class="custom-picker-wrapper" data-picker="lightColor">
                        <div class="picker-trigger">
                            <div class="color-preview-box"></div>
                            <div class="color-hex-label"></div>
                        </div>
                    </div>
                </div>

                <div class="editor-row">
                    <span class="editor-label">Starke</span>
                    <div class="slider-container">
                        <div class="slider-value" id="light-intensity-value">1.0</div>
                        <div class="slider-wrapper">
                            <input type="range" class="editor-slider" id="light-intensity" min="0" max="5" step="0.1" value="1" />
                        </div>
                    </div>
                </div>

                <div class="editor-row" data-section="position">
                    <span class="editor-label">Position</span>
                    <div class="editor-input-group bordered">
                        <input type="number" step="0.1" class="editor-input editor-vector-input" id="pos-x" placeholder="X">
                        <span class="vertical-divider"></span>
                        <input type="number" step="0.1" class="editor-input editor-vector-input" id="pos-y" placeholder="Y">
                        <span class="vertical-divider"></span>
                        <input type="number" step="0.1" class="editor-input editor-vector-input" id="pos-z" placeholder="Z">
                    </div>
                </div>

                <div class="editor-row" data-section="rotation">
                    <span class="editor-label">Rotation</span>
                    <div class="editor-input-group bordered">
                        <input type="number" step="0.1" class="editor-input editor-vector-input" id="rot-x" placeholder="X">
                        <span class="vertical-divider"></span>
                        <input type="number" step="0.1" class="editor-input editor-vector-input" id="rot-y" placeholder="Y">
                        <span class="vertical-divider"></span>
                        <input type="number" step="0.1" class="editor-input editor-vector-input" id="rot-z" placeholder="Z">
                    </div>
                </div>
            </div>

            <div class="editor-actions">
                <button class="editor-btn blue" id="btn-export-scene">scene-config</button>
            </div>
        `;

        this.container.appendChild(this.element);

        this.inputs = {
            title: this.element.querySelector('#light-title'),
            type: this.element.querySelector('#light-type'),
            enabled: this.element.querySelector('#light-enabled'),
            intensity: this.element.querySelector('#light-intensity'),
            intensityValue: this.element.querySelector('#light-intensity-value'),
            posX: this.element.querySelector('#pos-x'),
            posY: this.element.querySelector('#pos-y'),
            posZ: this.element.querySelector('#pos-z'),
            rotX: this.element.querySelector('#rot-x'),
            rotY: this.element.querySelector('#rot-y'),
            rotZ: this.element.querySelector('#rot-z'),
            positionRow: this.element.querySelector('[data-section="position"]'),
            rotationRow: this.element.querySelector('[data-section="rotation"]')
        };

        const colorWrapper = this.element.querySelector('[data-picker="lightColor"]');
        this.colorPicker = new EditorColorPicker(colorWrapper, '#ffffff', (color) => {
            this._onColorChange(color);
        });

        this.inputs.enabled.addEventListener('change', () => this._onInputChange());
        this.inputs.intensity.addEventListener('input', () => this._onInputChange());
        this.inputs.posX.addEventListener('change', () => this._onInputChange());
        this.inputs.posY.addEventListener('change', () => this._onInputChange());
        this.inputs.posZ.addEventListener('change', () => this._onInputChange());
        this.inputs.rotX.addEventListener('change', () => this._onInputChange());
        this.inputs.rotY.addEventListener('change', () => this._onInputChange());
        this.inputs.rotZ.addEventListener('change', () => this._onInputChange());

        this.element.querySelector('#btn-export-scene').addEventListener('click', () => {
            if (this.callbacks.onExport) {
                this.callbacks.onExport();
            }
        });
    }

    setCallbacks(callbacks) {
        this.callbacks = callbacks || {};
    }

    show(light, configKey, configEntry) {
        this.element.classList.add('visible');
        this.update(light, configKey, configEntry);
    }

    hide() {
        this.element.classList.remove('visible');
    }

    update(light, configKey, configEntry) {
        if (!light || !configKey || !configEntry) return;

        this.currentLight = light;
        this.currentConfigKey = configKey;

        this.inputs.title.textContent = configKey || light.name || '(Unnamed Light)';
        this.inputs.type.textContent = light.constructor?.name || 'Light';

        const isEnabled = configEntry.enabled ?? light.visible ?? true;
        const intensity = configEntry.intensity ?? light.intensity ?? 1;
        const color = configEntry.color || (light.color ? `#${light.color.getHexString()}` : '#ffffff');

        this.inputs.enabled.checked = Boolean(isEnabled);
        this.inputs.intensity.value = intensity;
        this.inputs.intensityValue.textContent = Number(intensity).toFixed(2);
        this.colorPicker.setColor(color);

        if (light.isDirectionalLight) {
            const position = configEntry.position || light.position || { x: 0, y: 0, z: 0 };
            this.inputs.posX.value = Number(position.x ?? 0).toFixed(2);
            this.inputs.posY.value = Number(position.y ?? 0).toFixed(2);
            this.inputs.posZ.value = Number(position.z ?? 0).toFixed(2);
            this.inputs.positionRow.classList.remove('hidden');
            const rotation = configEntry.rotation || light.rotation || { x: 0, y: 0, z: 0 };
            this.inputs.rotX.value = Number(rotation.x ?? 0).toFixed(2);
            this.inputs.rotY.value = Number(rotation.y ?? 0).toFixed(2);
            this.inputs.rotZ.value = Number(rotation.z ?? 0).toFixed(2);
            this.inputs.rotationRow.classList.remove('hidden');
        } else {
            this.inputs.positionRow.classList.add('hidden');
            this.inputs.rotationRow.classList.add('hidden');
        }
    }

    _onInputChange() {
        if (!this.currentLight || !this.currentConfigKey) return;

        const lightsConfig = this.config?.sceneConfig?.lights;
        const configEntry = lightsConfig?.[this.currentConfigKey];
        if (!configEntry) return;

        const enabled = Boolean(this.inputs.enabled.checked);
        const intensity = Number.parseFloat(this.inputs.intensity.value || '0');

        configEntry.enabled = enabled;
        configEntry.intensity = intensity;

        this.currentLight.visible = enabled;
        this.currentLight.intensity = intensity;

        this.inputs.intensityValue.textContent = Number(intensity).toFixed(2);

        if (this.currentLight.isDirectionalLight) {
            const posX = Number.parseFloat(this.inputs.posX.value || '0');
            const posY = Number.parseFloat(this.inputs.posY.value || '0');
            const posZ = Number.parseFloat(this.inputs.posZ.value || '0');

            configEntry.position = { x: posX, y: posY, z: posZ };
            this.currentLight.position.set(posX, posY, posZ);

            const rotX = Number.parseFloat(this.inputs.rotX.value || '0');
            const rotY = Number.parseFloat(this.inputs.rotY.value || '0');
            const rotZ = Number.parseFloat(this.inputs.rotZ.value || '0');

            configEntry.rotation = { x: rotX, y: rotY, z: rotZ };
            this.currentLight.rotation.set(rotX, rotY, rotZ);
        }

        if (this.callbacks.onChange) {
            this.callbacks.onChange(this.currentLight, configEntry);
        }
    }

    _onColorChange(color) {
        if (!this.currentLight || !this.currentConfigKey) return;

        const lightsConfig = this.config?.sceneConfig?.lights;
        const configEntry = lightsConfig?.[this.currentConfigKey];
        if (!configEntry) return;

        configEntry.color = color;
        if (this.currentLight.color) {
            this.currentLight.color.set(color);
        }

        if (this.callbacks.onChange) {
            this.callbacks.onChange(this.currentLight, configEntry);
        }
    }
}
