import { EditorColorPicker } from '../editor-colorpicker.js';
import { toggleDarkMode } from '../../theme-handler.js';

const iconDownloadUrl = new URL('../../../assets/editor/download.svg', import.meta.url).href;

/**
 * Szene-Tab: Verwaltet Szenen-Einstellungen (Hintergrund, Beleuchtung, etc.)
 * Kappselt UI und Logik, liefert ein Root-Element zur Integration in Editor-Sidebar.
 */
export class TabScene {
    constructor({ scene, renderer, config, animationHandler, controls, cameraHandler, highlightHandler, onExportSceneConfig }) {
        this.scene = scene;
        this.renderer = renderer;
        this.config = config;
        this.animationHandler = animationHandler;
        this.controls = controls;
        this.cameraHandler = cameraHandler;
        this.highlightHandler = highlightHandler;
        this.onExportSceneConfig = onExportSceneConfig;

        this.element = null;
        this.inputs = {};
        this.colorPickers = {};
        this.dropdowns = [];
        this._onDocumentClick = null;

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
                    <span class="editor-label">Scroll Animation</span>
                    <div class="editor-input-group">
                        <input type="checkbox" class="editor-checkbox" id="animation-scroll" />
                    </div>
                </div>

                <div class="editor-row">
                    <span class="editor-label">Sequenziell</span>
                    <div class="editor-input-group">
                        <input type="checkbox" class="editor-checkbox" id="animation-sequence" />
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
                    <span class="editor-label">Shadows</span>
                    <div class="editor-input-group">
                        <input type="checkbox" class="editor-checkbox" id="scene-shadows" />
                    </div>
                </div>

                <div class="editor-row">
                    <span class="editor-label">Koordinaten</span>
                    <div class="editor-input-group">
                        <input type="checkbox" class="editor-checkbox" id="scene-coordinatesystem" />
                    </div>
                </div>
            </details>

            <details class="editor-details" open>
                <summary>Kamera</summary>
                <div class="editor-row">
                    <span class="editor-label">Position</span>
                    <div class="editor-input-group bordered">
                        <input type="number" step="0.1" class="editor-input editor-vector-input" id="camera-pos-x" placeholder="X">
                        <span class="vertical-divider"></span>
                        <input type="number" step="0.1" class="editor-input editor-vector-input" id="camera-pos-y" placeholder="Y">
                        <span class="vertical-divider"></span>
                        <input type="number" step="0.1" class="editor-input editor-vector-input" id="camera-pos-z" placeholder="Z">
                    </div>
                </div>

                <div class="editor-row">
                    <span class="editor-label">Min Zoom</span>
                    <div class="editor-input-group">
                        <input type="number" step="0.1" class="editor-input" id="camera-min-zoom">
                    </div>
                </div>

                <div class="editor-row">
                    <span class="editor-label">Max Zoom</span>
                    <div class="editor-input-group">
                        <input type="number" step="0.1" class="editor-input" id="camera-max-zoom">
                    </div>
                </div>

                <div class="editor-row">
                    <span class="editor-label">Zoom Speed</span>
                    <div class="editor-input-group">
                        <input type="number" step="0.1" class="editor-input" id="camera-zoom-speed">
                    </div>
                </div>

                <div class="editor-row">
                    <span class="editor-label">Rotate Speed</span>
                    <div class="editor-input-group">
                        <input type="number" step="0.1" class="editor-input" id="camera-rotate-speed">
                    </div>
                </div>

                <div class="editor-row">
                    <span class="editor-label">Damping</span>
                    <div class="editor-input-group">
                        <input type="number" step="0.005" class="editor-input" id="camera-damping">
                    </div>
                </div>

                <div class="editor-row">
                    <span class="editor-label">Lock Horizontal</span>
                    <div class="editor-input-group">
                        <input type="checkbox" class="editor-checkbox" id="camera-lock-horizontal" />
                    </div>
                </div>

                <div class="editor-row">
                    <span class="editor-label">Lock Vertical</span>
                    <div class="editor-input-group">
                        <input type="checkbox" class="editor-checkbox" id="camera-lock-vertical" />
                    </div>
                </div>
            </details>

            <details class="editor-details" open>
                <summary>Info Elemente</summary>
                <div class="editor-row">
                    <span class="editor-label">Highlight</span>
                    <div class="editor-input-group">
                        <input type="checkbox" class="editor-checkbox" id="highlight-enabled" />
                    </div>
                </div>

                <div class="editor-row">
                    <span class="editor-label">Highlight Mode</span>
                    <div class="editor-dropdown" data-dropdown="highlight-mode">
                        <button class="editor-dropdown-toggle" type="button" aria-haspopup="listbox" aria-expanded="false">
                            <span class="editor-dropdown-icon" aria-hidden="true"></span>
                        </button>
                        <div class="editor-dropdown-value">Wireframe</div>
                        <ul class="editor-dropdown-menu" role="listbox" aria-hidden="true">
                            <li class="editor-dropdown-option" role="option" data-value="wireframe">Wireframe</li>
                            <li class="editor-dropdown-option" role="option" data-value="ghost">Ghost</li>
                        </ul>
                    </div>
                </div>

                <div class="editor-row">
                    <span class="editor-label">Wireframe</span>
                    <div class="custom-picker-wrapper" data-picker="highlight-wireframe">
                        <div class="picker-trigger">
                            <div class="color-preview-box"></div>
                            <div class="color-hex-label"></div>
                        </div>
                    </div>
                </div>

                <div class="editor-row">
                    <span class="editor-label">Ghost</span>
                    <div class="custom-picker-wrapper" data-picker="highlight-ghost">
                        <div class="picker-trigger">
                            <div class="color-preview-box"></div>
                            <div class="color-hex-label"></div>
                        </div>
                    </div>
                </div>

                <div class="editor-row">
                    <span class="editor-label">Card Duration</span>
                    <div class="editor-input-group">
                        <input type="number" class="editor-input" id="card-duration" min="100" max="5000" step="100">
                    </div>
                </div>

                <div class="editor-row">
                    <span class="editor-label">Darkmode</span>
                    <div class="editor-input-group">
                        <input type="checkbox" class="editor-checkbox" id="card-darkmode" />
                    </div>
                </div>

                <div class="editor-row">
                    <span class="editor-label">Pointer Side</span>
                    <div class="editor-dropdown" data-dropdown="pointer-side">
                        <button class="editor-dropdown-toggle" type="button" aria-haspopup="listbox" aria-expanded="false">
                            <span class="editor-dropdown-icon" aria-hidden="true"></span>
                        </button>
                        <div class="editor-dropdown-value">Auto</div>
                        <ul class="editor-dropdown-menu" role="listbox" aria-hidden="true">
                            <li class="editor-dropdown-option" role="option" data-value="auto">Auto</li>
                            <li class="editor-dropdown-option" role="option" data-value="left">Left</li>
                            <li class="editor-dropdown-option" role="option" data-value="right">Right</li>
                        </ul>
                    </div>
                </div>

                <div class="editor-row">
                    <span class="editor-label">Rotation Y</span>
                    <div class="editor-input-group">
                        <input type="text" class="editor-input" id="pointer-rotation-y" placeholder="auto" />
                    </div>
                </div>

                <div class="editor-row">
                    <span class="editor-label">Pointer Size</span>
                    <div class="editor-input-group">
                        <input type="number" class="editor-input" id="pointer-max-width" min="500" max="2500" step="100">
                    </div>
                </div>

                <div class="editor-row">
                    <span class="editor-label">Title Color</span>
                    <div class="custom-picker-wrapper" data-picker="pointer-title">
                        <div class="picker-trigger">
                            <div class="color-preview-box"></div>
                            <div class="color-hex-label"></div>
                        </div>
                    </div>
                </div>

                <div class="editor-row">
                    <span class="editor-label">Body Color</span>
                    <div class="custom-picker-wrapper" data-picker="pointer-body">
                        <div class="picker-trigger">
                            <div class="color-preview-box"></div>
                            <div class="color-hex-label"></div>
                        </div>
                    </div>
                </div>

                <div class="editor-row">
                    <span class="editor-label">Line Color</span>
                    <div class="custom-picker-wrapper" data-picker="pointer-line">
                        <div class="picker-trigger">
                            <div class="color-preview-box"></div>
                            <div class="color-hex-label"></div>
                        </div>
                    </div>
                </div>
            </details>
            <!--Fix: Überlagerung wird verhjindert-->
            <div style="height: 39px;"></div>
            <div class="tab-footer">
                <button class="editor-btn blue" id="export-scene-config-btn">
                    <img src="${iconDownloadUrl}" alt="download icon" />        
                    scene-config
                </button>
            </div>
        `;

        this.inputs = {
            exportSceneConfig: this.element.querySelector('#export-scene-config-btn'),
            animationScroll: this.element.querySelector('#animation-scroll'),
            animationSequence: this.element.querySelector('#animation-sequence'),
            sceneShadows: this.element.querySelector('#scene-shadows'),
            sceneCoordinates: this.element.querySelector('#scene-coordinatesystem'),
            cameraPosX: this.element.querySelector('#camera-pos-x'),
            cameraPosY: this.element.querySelector('#camera-pos-y'),
            cameraPosZ: this.element.querySelector('#camera-pos-z'),
            cameraMinZoom: this.element.querySelector('#camera-min-zoom'),
            cameraMaxZoom: this.element.querySelector('#camera-max-zoom'),
            cameraZoomSpeed: this.element.querySelector('#camera-zoom-speed'),
            cameraRotateSpeed: this.element.querySelector('#camera-rotate-speed'),
            cameraDamping: this.element.querySelector('#camera-damping'),
            cameraLockHorizontal: this.element.querySelector('#camera-lock-horizontal'),
            cameraLockVertical: this.element.querySelector('#camera-lock-vertical'),
            highlightEnabled: this.element.querySelector('#highlight-enabled'),
            cardDuration: this.element.querySelector('#card-duration'),
            cardDarkmode: this.element.querySelector('#card-darkmode'),
            pointerRotationY: this.element.querySelector('#pointer-rotation-y'),
            pointerMaxWidth: this.element.querySelector('#pointer-max-width')
        };

        this._initPickers();
        this._bindInputs();
        this._setupDropdowns();
        this.update();
    }

    // Gibt das Root-Element zum Einhängen in Sidebar zurück
    getElement() {
        return this.element;
    }

    //Aktualisiert die Szenen-Einstellungen, falls Config sich geändert hat
    update() {
        const sceneConfig = this.config?.sceneConfig;
        const animationConfig = this.config?.animationConfig;
        const highlightOptions = this.config?.highlightOptions;
        const cardConfig = this.config?.cardConfig;
        const pointerConfig = this.config?.pointerConfig;
        const cameraConfig = sceneConfig?.camera;

        if (animationConfig) {
            if (this.inputs.animationScroll) {
                this.inputs.animationScroll.checked = Boolean(animationConfig.allowScrollAnimation);
            }
            if (this.inputs.animationSequence) {
                this.inputs.animationSequence.checked = Boolean(animationConfig.useSequenceAnim);
            }
        }

        if (sceneConfig) {
            if (sceneConfig.backgroundColor) {
                this.colorPickers.background?.setColor(sceneConfig.backgroundColor);
            }
            if (this.inputs.sceneShadows) {
                this.inputs.sceneShadows.checked = Boolean(sceneConfig.shadowsEnabled);
            }
            if (this.inputs.sceneCoordinates) {
                this.inputs.sceneCoordinates.checked = Boolean(sceneConfig.showCoordinatesystem);
            }
        }

        if (cameraConfig) {
            const position = cameraConfig.position || [0, 0, 0];
            if (this.inputs.cameraPosX) this.inputs.cameraPosX.value = Number(position[0] ?? 0).toFixed(2);
            if (this.inputs.cameraPosY) this.inputs.cameraPosY.value = Number(position[1] ?? 0).toFixed(2);
            if (this.inputs.cameraPosZ) this.inputs.cameraPosZ.value = Number(position[2] ?? 0).toFixed(2);
            if (this.inputs.cameraMinZoom) this.inputs.cameraMinZoom.value = cameraConfig.minDistance ?? 1;
            if (this.inputs.cameraMaxZoom) this.inputs.cameraMaxZoom.value = cameraConfig.maxDistance ?? 20;
            if (this.inputs.cameraZoomSpeed) this.inputs.cameraZoomSpeed.value = cameraConfig.zoomSpeed ?? 1.5;
            if (this.inputs.cameraRotateSpeed) this.inputs.cameraRotateSpeed.value = cameraConfig.rotateSpeed ?? 1.1;
            if (this.inputs.cameraDamping) this.inputs.cameraDamping.value = cameraConfig.dampingFactor ?? 0.075;
            if (this.inputs.cameraLockHorizontal) this.inputs.cameraLockHorizontal.checked = Boolean(cameraConfig.lockHorizontal);
            if (this.inputs.cameraLockVertical) this.inputs.cameraLockVertical.checked = Boolean(cameraConfig.lockVertical);
        }

        if (highlightOptions) {
            if (this.inputs.highlightEnabled) {
                this.inputs.highlightEnabled.checked = Boolean(highlightOptions.highlightComponent);
            }
            if (highlightOptions.wireframeColor) {
                this.colorPickers.wireframe?.setColor(highlightOptions.wireframeColor);
            }
            if (highlightOptions.ghostColor) {
                this.colorPickers.ghost?.setColor(highlightOptions.ghostColor);
            }
            if (highlightOptions.mode) {
                this._setDropdownValue('highlight-mode', highlightOptions.mode);
            }
        }

        if (cardConfig) {
            if (this.inputs.cardDuration) this.inputs.cardDuration.value = cardConfig.animationDuration ?? 500;
            if (this.inputs.cardDarkmode) {
                this.inputs.cardDarkmode.checked = Boolean(cardConfig.isDarkmode);
                toggleDarkMode(this.inputs.cardDarkmode.checked);
            }
        }

        if (pointerConfig) {
            if (this.inputs.pointerRotationY) this.inputs.pointerRotationY.value = pointerConfig.rotationY ?? 'auto';
            if (this.inputs.pointerMaxWidth) this.inputs.pointerMaxWidth.value = pointerConfig.maxWidth ?? 1800;
            if (pointerConfig.titleColor) this.colorPickers.pointerTitle?.setColor(pointerConfig.titleColor);
            if (pointerConfig.bodyColor) this.colorPickers.pointerBody?.setColor(pointerConfig.bodyColor);
            if (pointerConfig.lineColor) this.colorPickers.pointerLine?.setColor(pointerConfig.lineColor);
            if (pointerConfig.defaultSide) this._setDropdownValue('pointer-side', pointerConfig.defaultSide);
        }
    }

    _initPickers() {
        const sceneConfig = this.config?.sceneConfig;
        const highlightOptions = this.config?.highlightOptions;
        const pointerConfig = this.config?.pointerConfig;

        const bgColor = sceneConfig?.backgroundColor ||
            (this.scene?.background?.isColor ? '#' + this.scene.background.getHexString() : '#1e1e1e');

        const backgroundWrapper = this.element.querySelector('[data-picker="background"]');
        this.colorPickers.background = new EditorColorPicker(
            backgroundWrapper,
            bgColor,
            (color) => this._onBackgroundChange(color)
        );

        const wireframeWrapper = this.element.querySelector('[data-picker="highlight-wireframe"]');
        this.colorPickers.wireframe = new EditorColorPicker(
            wireframeWrapper,
            highlightOptions?.wireframeColor || '#aaaaaa',
            (color) => this._onWireframeColorChange(color)
        );

        const ghostWrapper = this.element.querySelector('[data-picker="highlight-ghost"]');
        this.colorPickers.ghost = new EditorColorPicker(
            ghostWrapper,
            highlightOptions?.ghostColor || '#c4c4c4',
            (color) => this._onGhostColorChange(color)
        );

        const titleWrapper = this.element.querySelector('[data-picker="pointer-title"]');
        this.colorPickers.pointerTitle = new EditorColorPicker(
            titleWrapper,
            pointerConfig?.titleColor || '#ffffff',
            (color) => this._onPointerColorChange('titleColor', color)
        );

        const bodyWrapper = this.element.querySelector('[data-picker="pointer-body"]');
        this.colorPickers.pointerBody = new EditorColorPicker(
            bodyWrapper,
            pointerConfig?.bodyColor || '#999999',
            (color) => this._onPointerColorChange('bodyColor', color)
        );

        const lineWrapper = this.element.querySelector('[data-picker="pointer-line"]');
        this.colorPickers.pointerLine = new EditorColorPicker(
            lineWrapper,
            pointerConfig?.lineColor || '#ebebeb',
            (color) => this._onPointerColorChange('lineColor', color)
        );
    }

    _bindInputs() {
        if (this.inputs.exportSceneConfig) {
            this.inputs.exportSceneConfig.addEventListener('click', () => {
                if (this.onExportSceneConfig) {
                    this.onExportSceneConfig();
                }
            });
        }

        if (this.inputs.animationScroll) {
            this.inputs.animationScroll.addEventListener('change', () => {
                if (!this.config?.animationConfig) return;
                this.config.animationConfig.allowScrollAnimation = this.inputs.animationScroll.checked;
                if (this.controls) {
                    this.controls.enableZoom = !this.inputs.animationScroll.checked;
                }
            });
        }

        if (this.inputs.animationSequence) {
            this.inputs.animationSequence.addEventListener('change', () => {
                if (!this.config?.animationConfig) return;
                if (this.inputs.animationSequence.checked) {
                    console.warn('Stellen sie sicher, dass die sequenzielle Animation konfiguriert ist');
                }
                this.config.animationConfig.useSequenceAnim = this.inputs.animationSequence.checked;
            });
        }

        if (this.inputs.sceneShadows) {
            this.inputs.sceneShadows.addEventListener('change', () => {
                const sceneConfig = this.config?.sceneConfig;
                if (!sceneConfig) return;
                sceneConfig.shadowsEnabled = this.inputs.sceneShadows.checked;
                if (this.renderer) {
                    this.renderer.shadowMap.enabled = this.inputs.sceneShadows.checked;
                }

                this.scene?.traverse((child) => {
                    if (child.isLight && child.castShadow !== undefined) {
                        child.castShadow = this.inputs.sceneShadows.checked;
                    }
                    if (child.material) {
                        child.material.needsUpdate = true;
                    }
                });
            });
        }

        if (this.inputs.sceneCoordinates) {
            this.inputs.sceneCoordinates.addEventListener('change', () => {
                const sceneConfig = this.config?.sceneConfig;
                if (!sceneConfig) return;
                sceneConfig.showCoordinatesystem = this.inputs.sceneCoordinates.checked;
                const coordinateSystem = this.scene?.getObjectByName('Coordinatesystem');
                if (coordinateSystem) {
                    coordinateSystem.visible = this.inputs.sceneCoordinates.checked;
                } else {
                    console.warn('Koodrinatensystem nicht in der Szene vorhanden.');
                }
            });
        }

        const cameraPositionChange = () => {
            const cameraConfig = this.config?.sceneConfig?.camera;
            if (!cameraConfig) return;

            const x = this._readNumber(this.inputs.cameraPosX.value, 0);
            const y = this._readNumber(this.inputs.cameraPosY.value, 0);
            const z = this._readNumber(this.inputs.cameraPosZ.value, 0);
            cameraConfig.position = [x, y, z];

            const camera = this.cameraHandler?.getCamera();
            camera?.position.set(x, y, z);
            this.controls?.update();
        };

        if (this.inputs.cameraPosX) this.inputs.cameraPosX.addEventListener('change', cameraPositionChange);
        if (this.inputs.cameraPosY) this.inputs.cameraPosY.addEventListener('change', cameraPositionChange);
        if (this.inputs.cameraPosZ) this.inputs.cameraPosZ.addEventListener('change', cameraPositionChange);

        if (this.inputs.cameraMinZoom) {
            this.inputs.cameraMinZoom.addEventListener('change', () => {
                const value = this._readNumber(this.inputs.cameraMinZoom.value, 0.1);
                if (!this.config?.sceneConfig?.camera) return;
                this.config.sceneConfig.camera.minDistance = value;
                if (this.controls) {
                    this.controls.minDistance = value;
                    this.controls.update();
                }
            });
        }

        if (this.inputs.cameraMaxZoom) {
            this.inputs.cameraMaxZoom.addEventListener('change', () => {
                const value = this._readNumber(this.inputs.cameraMaxZoom.value, 100);
                if (!this.config?.sceneConfig?.camera) return;
                this.config.sceneConfig.camera.maxDistance = value;
                if (this.controls) {
                    this.controls.maxDistance = value;
                    this.controls.update();
                }
            });
        }

        if (this.inputs.cameraZoomSpeed) {
            this.inputs.cameraZoomSpeed.addEventListener('change', () => {
                const value = this._readNumber(this.inputs.cameraZoomSpeed.value, 1.5);
                if (!this.config?.sceneConfig?.camera) return;
                this.config.sceneConfig.camera.zoomSpeed = value;
                if (this.controls) this.controls.zoomSpeed = value;
            });
        }

        if (this.inputs.cameraRotateSpeed) {
            this.inputs.cameraRotateSpeed.addEventListener('change', () => {
                const value = this._readNumber(this.inputs.cameraRotateSpeed.value, 1.1);
                if (!this.config?.sceneConfig?.camera) return;
                this.config.sceneConfig.camera.rotateSpeed = value;
                if (this.controls) this.controls.rotateSpeed = value;
            });
        }

        if (this.inputs.cameraDamping) {
            this.inputs.cameraDamping.addEventListener('change', () => {
                const value = this._readNumber(this.inputs.cameraDamping.value, 0.075);
                if (!this.config?.sceneConfig?.camera) return;
                this.config.sceneConfig.camera.dampingFactor = value;
                if (this.controls) this.controls.dampingFactor = value;
            });
        }

        if (this.inputs.cameraLockHorizontal) {
            this.inputs.cameraLockHorizontal.addEventListener('change', () => {
                const cameraConfig = this.config?.sceneConfig?.camera;
                if (!cameraConfig) return;
                cameraConfig.lockHorizontal = this.inputs.cameraLockHorizontal.checked;
                this.cameraHandler?.updateLocks();
            });
        }

        if (this.inputs.cameraLockVertical) {
            this.inputs.cameraLockVertical.addEventListener('change', () => {
                const cameraConfig = this.config?.sceneConfig?.camera;
                if (!cameraConfig) return;
                cameraConfig.lockVertical = this.inputs.cameraLockVertical.checked;
                this.cameraHandler?.updateLocks();
            });
        }

        if (this.inputs.highlightEnabled) {
            this.inputs.highlightEnabled.addEventListener('change', () => {
                const highlightOptions = this.config?.highlightOptions;
                if (!highlightOptions) return;
                highlightOptions.highlightComponent = this.inputs.highlightEnabled.checked;
            });
        }

        if (this.inputs.cardDuration) {
            this.inputs.cardDuration.addEventListener('change', () => {
                const cardConfig = this.config?.cardConfig;
                if (!cardConfig) return;
                cardConfig.animationDuration = this._readNumber(this.inputs.cardDuration.value, 500);
            });
        }

        if (this.inputs.cardDarkmode) {
            this.inputs.cardDarkmode.addEventListener('change', () => {
                const cardConfig = this.config?.cardConfig;
                if (!cardConfig) return;
                cardConfig.isDarkmode = this.inputs.cardDarkmode.checked;
                toggleDarkMode(this.inputs.cardDarkmode.checked);
            });
        }

        if (this.inputs.pointerRotationY) {
            this.inputs.pointerRotationY.addEventListener('change', () => {
                const pointerConfig = this.config?.pointerConfig;
                if (!pointerConfig) return;
                pointerConfig.rotationY = this.inputs.pointerRotationY.value || 'auto';
            });
        }

        if (this.inputs.pointerMaxWidth) {
            this.inputs.pointerMaxWidth.addEventListener('change', () => {
                const pointerConfig = this.config?.pointerConfig;
                if (!pointerConfig) return;
                pointerConfig.maxWidth = this._readNumber(this.inputs.pointerMaxWidth.value, 1800);
            });
        }
    }

    _onBackgroundChange(color) {
        const sceneConfig = this.config?.sceneConfig;
        if (!sceneConfig) return;

        sceneConfig.backgroundColor = color;
        this.scene?.background?.set(color);
    }

    _onWireframeColorChange(color) {
        const highlightOptions = this.config?.highlightOptions;
        if (!highlightOptions) return;
        highlightOptions.wireframeColor = color;
        if (this.highlightHandler?.wireframeMaterial) {
            this.highlightHandler.wireframeMaterial.color.set(color);
        }
    }

    _onGhostColorChange(color) {
        const highlightOptions = this.config?.highlightOptions;
        if (!highlightOptions) return;
        highlightOptions.ghostColor = color;
        if (this.highlightHandler?.ghostMaterial) {
            this.highlightHandler.ghostMaterial.color.set(color);
        }
    }

    _onPointerColorChange(key, color) {
        const pointerConfig = this.config?.pointerConfig;
        if (!pointerConfig) return;
        pointerConfig[key] = color;
    }

    _setupDropdowns() {
        this.dropdowns = Array.from(this.element.querySelectorAll('.editor-dropdown'));
        if (!this.dropdowns.length) return;

        const handlers = {
            'highlight-mode': (value) => {
                const highlightOptions = this.config?.highlightOptions;
                if (!highlightOptions) return;
                highlightOptions.mode = value;
            },
            'pointer-side': (value) => {
                const pointerConfig = this.config?.pointerConfig;
                if (!pointerConfig) return;
                pointerConfig.defaultSide = value;
            }
        };

        this.dropdowns.forEach((dropdown) => {
            const toggle = dropdown.querySelector('.editor-dropdown-toggle');
            const menu = dropdown.querySelector('.editor-dropdown-menu');
            const name = dropdown.dataset.dropdown;

            dropdown.addEventListener('click', (event) => {
                const option = event.target.closest('.editor-dropdown-option');
                if (option) {
                    const value = option.dataset.value || option.textContent.trim();
                    this._setDropdownValue(name, value);
                    if (handlers[name]) handlers[name](value);
                    this._closeDropdown(dropdown);
                    return;
                }

                const isOpen = dropdown.classList.toggle('is-open');
                if (toggle) toggle.setAttribute('aria-expanded', String(isOpen));
                if (menu) menu.setAttribute('aria-hidden', String(!isOpen));
            });
        });

        this._onDocumentClick = (event) => {
            this.dropdowns.forEach((dropdown) => {
                if (!dropdown.contains(event.target)) {
                    this._closeDropdown(dropdown);
                }
            });
        };

        document.addEventListener('click', this._onDocumentClick);
    }

    _closeDropdown(dropdown) {
        const toggle = dropdown.querySelector('.editor-dropdown-toggle');
        const menu = dropdown.querySelector('.editor-dropdown-menu');
        dropdown.classList.remove('is-open');
        if (toggle) toggle.setAttribute('aria-expanded', 'false');
        if (menu) menu.setAttribute('aria-hidden', 'true');
    }

    _setDropdownValue(name, value) {
        const dropdown = this.element.querySelector(`[data-dropdown="${name}"]`);
        if (!dropdown) return;

        const valueEl = dropdown.querySelector('.editor-dropdown-value');
        const option = dropdown.querySelector(`.editor-dropdown-option[data-value="${value}"]`);
        if (valueEl) {
            valueEl.textContent = option ? option.textContent.trim() : String(value);
        }
        dropdown.dataset.value = value;
    }

    _readNumber(value, fallback) {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : fallback;
    }
}
