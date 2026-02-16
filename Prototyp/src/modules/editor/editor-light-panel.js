import * as THREE from 'three';
import { EditorColorPicker } from './editor-colorpicker.js';

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

        this._canMove = false;
        this._canRotate = false;

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
                    <select class="editor-select" id="light-type">
                        <option value="directional">Directional</option>
                        <option value="point">Point</option>
                        <option value="ambient">Ambient</option>
                    </select>
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
                    <span class="editor-label">Stärke</span>
                    <div class="slider-container">
                        <div class="slider-value" id="light-intensity-value">1.0</div>
                        <div class="slider-wrapper">
                            <input type="range" class="editor-slider" id="light-intensity" min="0" max="10" step="0.1" value="1" />
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

                <div class="editor-row" data-section="look-at">
                    <span class="editor-label">Look At</span>
                    <div class="editor-input-group">
                        <input type="checkbox" class="editor-checkbox" id="light-look-at" />
                    </div>
                </div>

                <div class="editor-row" data-section="look-at-position">
                    <span class="editor-label">Look At Pos</span>
                    <div class="editor-input-group bordered">
                        <input type="number" step="0.1" class="editor-input editor-vector-input" id="lookat-x" placeholder="X">
                        <span class="vertical-divider"></span>
                        <input type="number" step="0.1" class="editor-input editor-vector-input" id="lookat-y" placeholder="Y">
                        <span class="vertical-divider"></span>
                        <input type="number" step="0.1" class="editor-input editor-vector-input" id="lookat-z" placeholder="Z">
                    </div>
                </div>

                <div class="editor-row" data-section="gizmo">
                    <span class="editor-label">Gizmo</span>
                    <div class="editor-input-group light-mode-toggle">
                        <button class="editor-btn" id="btn-mode-translate" type="button">Position</button>
                        <button class="editor-btn" id="btn-mode-rotate" type="button">Rotation</button>
                    </div>
                </div>
            </div>

            <div class="editor-actions">
                <button class="editor-btn red" id="btn-delete">Licht löschen</button>
            </div>

            <div class="delete-popup" id="delete-popup">
                <div class="delete-popup-content">
                    <h3>Licht Löschen ?</h3>
                    <p id="delete-popup-text">Wollen sie das Licht wirklich löschen?</p>
                    <div class="delete-popup-actions">
                        <button class="editor-btn" id="btn-cancel">Abbrechen</button>
                        <button class="editor-btn red" id="btn-confirm-delete">Löschen</button>
                    </div>
                </div>
            </div>
        `;

        this.container.appendChild(this.element);

        this.inputs = {
            title: this.element.querySelector('#light-title'),
            typeSelect: this.element.querySelector('#light-type'),
            enabled: this.element.querySelector('#light-enabled'),
            intensity: this.element.querySelector('#light-intensity'),
            intensityValue: this.element.querySelector('#light-intensity-value'),
            posX: this.element.querySelector('#pos-x'),
            posY: this.element.querySelector('#pos-y'),
            posZ: this.element.querySelector('#pos-z'),
            rotX: this.element.querySelector('#rot-x'),
            rotY: this.element.querySelector('#rot-y'),
            rotZ: this.element.querySelector('#rot-z'),
            lookAt: this.element.querySelector('#light-look-at'),
            lookAtX: this.element.querySelector('#lookat-x'),
            lookAtY: this.element.querySelector('#lookat-y'),
            lookAtZ: this.element.querySelector('#lookat-z'),
            modeTranslate: this.element.querySelector('#btn-mode-translate'),
            modeRotate: this.element.querySelector('#btn-mode-rotate'),
            positionRow: this.element.querySelector('[data-section="position"]'),
            rotationRow: this.element.querySelector('[data-section="rotation"]'),
            lookAtRow: this.element.querySelector('[data-section="look-at"]'),
            lookAtPositionRow: this.element.querySelector('[data-section="look-at-position"]')
        };

        const colorWrapper = this.element.querySelector('[data-picker="lightColor"]');
        this.colorPicker = new EditorColorPicker(colorWrapper, '#ffffff', (color) => {
            this._onColorChange(color);
        });

        this.inputs.enabled.addEventListener('change', () => this._onInputChange());
        this.inputs.typeSelect.addEventListener('change', () => this._onTypeChange());
        this.inputs.intensity.addEventListener('input', () => this._onInputChange());
        this.inputs.posX.addEventListener('change', () => this._onInputChange());
        this.inputs.posY.addEventListener('change', () => this._onInputChange());
        this.inputs.posZ.addEventListener('change', () => this._onInputChange());
        this.inputs.rotX.addEventListener('change', () => this._onInputChange());
        this.inputs.rotY.addEventListener('change', () => this._onInputChange());
        this.inputs.rotZ.addEventListener('change', () => this._onInputChange());
        this.inputs.lookAt.addEventListener('change', () => this._onInputChange());
        this.inputs.lookAtX.addEventListener('change', () => this._onInputChange());
        this.inputs.lookAtY.addEventListener('change', () => this._onInputChange());
        this.inputs.lookAtZ.addEventListener('change', () => this._onInputChange());

        this.inputs.modeTranslate.addEventListener('click', () => {
            this._setMode('translate');
        });

        this.inputs.modeRotate.addEventListener('click', () => {
            this._setMode('rotate');
        });

        this.element.querySelector('#btn-delete').addEventListener('click', () => {
            this._showDeletePopup();
        });

        this.element.querySelector('#btn-cancel').addEventListener('click', () => {
            this._hideDeletePopup();
        });

        this.element.querySelector('#btn-confirm-delete').addEventListener('click', () => {
            this._hideDeletePopup();
            if (this.callbacks.onDelete) {
                this.callbacks.onDelete(this.currentLight, this.currentConfigKey);
            }
        });

        this._setMode('translate', false);
        this._setRotateAvailable(false);
    }

    _showDeletePopup() {
        const popup = this.element.querySelector('#delete-popup');
        const popupText = this.element.querySelector('#delete-popup-text');

        if (popup) {
            if (popupText) {
                const lightName = this.currentConfigKey || this.currentLight?.name || 'Light';
                popupText.textContent = `Wollen sie das Licht "${lightName}" wirklich löschen?`;
            }
            popup.classList.add('visible');
        }
    }

    _hideDeletePopup() {
        const popup = this.element.querySelector('#delete-popup');
        if (popup) {
            popup.classList.remove('visible');
        }
    }

    setCallbacks(callbacks) {
        this.callbacks = callbacks || {};
    }

    show(light, configKey, configEntry) {
        this.element.classList.add('visible');
        this._setMode('translate', false);
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
        this.inputs.typeSelect.value = configEntry.type || this._getTypeFromLight(light);

        const isEnabled = configEntry.enabled ?? light.visible ?? true;
        const intensity = configEntry.intensity ?? light.intensity ?? 1;
        const color = configEntry.color || (light.color ? `#${light.color.getHexString()}` : '#ffffff');

        this.inputs.enabled.checked = Boolean(isEnabled);
        this.inputs.intensity.value = intensity;
        this.inputs.intensityValue.textContent = Number(intensity).toFixed(2);
        this.colorPicker.setColor(color);

        this._canMove = false;
        this._canRotate = false;

        if (light.isDirectionalLight) {
            this._canMove = true;
            this._canRotate = true;

            const position = configEntry.position || light.position || { x: 0, y: 0, z: 0 };
            this.inputs.posX.value = Number(position.x ?? 0).toFixed(2);
            this.inputs.posY.value = Number(position.y ?? 0).toFixed(2);
            this.inputs.posZ.value = Number(position.z ?? 0).toFixed(2);
            
            const rotation = configEntry.rotation || light.rotation || { x: 0, y: 0, z: 0 };
            this.inputs.rotX.value = this._radToDeg(rotation.x ?? 0).toFixed(1);
            this.inputs.rotY.value = this._radToDeg(rotation.y ?? 0).toFixed(1);
            this.inputs.rotZ.value = this._radToDeg(rotation.z ?? 0).toFixed(1);
            
            this.inputs.lookAtRow.classList.remove('hidden');
            const lookAtEnabled = configEntry.lookAtEnabled !== false;
            this.inputs.lookAt.checked = lookAtEnabled;
            this._setRotateAvailable(!lookAtEnabled);
            const lookAtTarget = configEntry.lookAtTarget || light.target?.position || { x: 0, y: 0, z: 0 };
            this.inputs.lookAtX.value = Number(lookAtTarget.x ?? 0).toFixed(2);
            this.inputs.lookAtY.value = Number(lookAtTarget.y ?? 0).toFixed(2);
            this.inputs.lookAtZ.value = Number(lookAtTarget.z ?? 0).toFixed(2);
            this.inputs.lookAtPositionRow.classList.toggle('hidden', !lookAtEnabled);
        } else if (light.isPointLight || light.isSpotLight) {
            this._canMove = true;

            const position = configEntry.position || light.position || { x: 0, y: 0, z: 0 };
            this.inputs.posX.value = Number(position.x ?? 0).toFixed(2);
            this.inputs.posY.value = Number(position.y ?? 0).toFixed(2);
            this.inputs.posZ.value = Number(position.z ?? 0).toFixed(2);
            
            if (light.isSpotLight) {
                this._canRotate = true;

                const rotation = configEntry.rotation || light.rotation || { x: 0, y: 0, z: 0 };
                this.inputs.rotX.value = this._radToDeg(rotation.x ?? 0).toFixed(1);
                this.inputs.rotY.value = this._radToDeg(rotation.y ?? 0).toFixed(1);
                this.inputs.rotZ.value = this._radToDeg(rotation.z ?? 0).toFixed(1);
                
                this.inputs.lookAtRow.classList.remove('hidden');
                const lookAtEnabled = configEntry.lookAtEnabled !== false;
                this.inputs.lookAt.checked = lookAtEnabled;
                this._setRotateAvailable(!lookAtEnabled);
                const lookAtTarget = configEntry.lookAtTarget || light.target?.position || { x: 0, y: 0, z: 0 };
                this.inputs.lookAtX.value = Number(lookAtTarget.x ?? 0).toFixed(2);
                this.inputs.lookAtY.value = Number(lookAtTarget.y ?? 0).toFixed(2);
                this.inputs.lookAtZ.value = Number(lookAtTarget.z ?? 0).toFixed(2);
                this.inputs.lookAtPositionRow.classList.toggle('hidden', !lookAtEnabled);
            } else {
                this.inputs.lookAtRow.classList.add('hidden');
                this._setRotateAvailable(false);
                this.inputs.lookAtPositionRow.classList.add('hidden');
            }
        } else {
            this.inputs.lookAtRow.classList.add('hidden');
            this._setRotateAvailable(false);
            this.inputs.lookAtPositionRow.classList.add('hidden');
        }

        this._updateVisibility();
    }

    _setMode(mode, notify = true) {
        this.inputs.modeTranslate.classList.toggle('active', mode === 'translate');
        this.inputs.modeRotate.classList.toggle('active', mode === 'rotate');

        this._updateVisibility();

        if (notify && this.callbacks.onModeChange) {
            this.callbacks.onModeChange(mode);
        }
    }

    _updateVisibility() {
        const mode = this.inputs.modeTranslate.classList.contains('active') ? 'translate' : 'rotate';

        if (this._canMove && mode === 'translate') {
            this.inputs.positionRow.classList.remove('hidden');
        } else {
            this.inputs.positionRow.classList.add('hidden');
        }

        if (this._canRotate && mode === 'rotate') {
            this.inputs.rotationRow.classList.remove('hidden');
        } else {
            this.inputs.rotationRow.classList.add('hidden');
        }
    }

    _setRotateAvailable(isAvailable) {
        this.inputs.modeRotate.classList.toggle('disabled', !isAvailable);
        this.inputs.modeRotate.disabled = !isAvailable;
        if (!isAvailable) {
            this._setMode('translate', true);
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

        if (this.currentLight.isDirectionalLight || this.currentLight.isPointLight || this.currentLight.isSpotLight) {
            const posX = Number.parseFloat(this.inputs.posX.value || '0');
            const posY = Number.parseFloat(this.inputs.posY.value || '0');
            const posZ = Number.parseFloat(this.inputs.posZ.value || '0');

            configEntry.position = { x: posX, y: posY, z: posZ };
            this.currentLight.position.set(posX, posY, posZ);
        }

        if (this.currentLight.isDirectionalLight || this.currentLight.isSpotLight) {
            const lookAtEnabled = this.inputs.lookAt.checked;
            configEntry.lookAtEnabled = lookAtEnabled;
            this._setRotateAvailable(!lookAtEnabled);
            this.inputs.lookAtPositionRow.classList.toggle('hidden', !lookAtEnabled);
            const rotX = this._degToRad(Number.parseFloat(this.inputs.rotX.value || '0'));
            const rotY = this._degToRad(Number.parseFloat(this.inputs.rotY.value || '0'));
            const rotZ = this._degToRad(Number.parseFloat(this.inputs.rotZ.value || '0'));

            configEntry.rotation = { x: rotX, y: rotY, z: rotZ };
            this._setWorldRotation(this.currentLight, rotX, rotY, rotZ);

            if (lookAtEnabled) {
                const targetX = Number.parseFloat(this.inputs.lookAtX.value || '0');
                const targetY = Number.parseFloat(this.inputs.lookAtY.value || '0');
                const targetZ = Number.parseFloat(this.inputs.lookAtZ.value || '0');
                configEntry.lookAtTarget = { x: targetX, y: targetY, z: targetZ };
                if (this.currentLight.target) {
                    this.currentLight.target.position.set(targetX, targetY, targetZ);
                }
            }
        }

        if (this.callbacks.onChange) {
            this.callbacks.onChange(this.currentLight, configEntry);
        }
    }

    _onTypeChange() {
        if (!this.currentLight || !this.currentConfigKey) return;

        const selectedType = this.inputs.typeSelect.value;
        const lightsConfig = this.config?.sceneConfig?.lights;
        const configEntry = lightsConfig?.[this.currentConfigKey];
        if (!configEntry || configEntry.type === selectedType) return;

        if (this.callbacks.onTypeChange) {
            this.callbacks.onTypeChange(selectedType);
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

    _setWorldRotation(light, rotX, rotY, rotZ) {
        const euler = new THREE.Euler(rotX, rotY, rotZ, light.rotation.order || 'XYZ');
        const worldQuat = new THREE.Quaternion().setFromEuler(euler);

        if (light.parent) {
            const parentQuat = new THREE.Quaternion();
            light.parent.getWorldQuaternion(parentQuat);
            parentQuat.invert();
            worldQuat.premultiply(parentQuat);
        }

        light.quaternion.copy(worldQuat);
    }

    _radToDeg(value) {
        return value * (180 / Math.PI);
    }

    _degToRad(value) {
        return value * (Math.PI / 180);
    }

    _getTypeFromLight(light) {
        if (light?.isDirectionalLight) return 'directional';
        if (light?.isPointLight) return 'point';
        return 'ambient';
    }
}