import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { setupLights } from './scene/lights.js';
import { AnimationHandler } from './modules/animation-handler.js';
import { HighlightHandler } from './modules/highlight-handler.js';
import { ClickHandler } from './modules/click-handler.js';
import { CameraHandler } from './modules/camera-handler.js';
import { StatsHandler } from './modules/ui-stats-handler.js';
import { defaultOptions } from './config/default-options.js';
import { deepMerge } from './utils/deep-merge.js';

// UIHandler und InfoElement-Handler werden dynamisch geladen für Code-Splitting

import './css/main.css';
// Assets referenzieren, sodass der Bundler sie mitnimmt
const coordinateSystemUrl = new URL('./assets/coordinatesystem.glb', import.meta.url).href;

class ExplodedViewer {
    constructor(container, options) {
        this.container = container;
        this.userOptions = options;

        this.lights = {};
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.model = null;
        this.config = null;

        this.cameraHandler = null;
        this.animationHandler = null;
        this.uiHandler = null;
        this.clickHandler = null;
        this.highlightHandler = null;
        this.cardHandler = null;
        this.statsHandler = null;
        this._editorStylesLoaded = false;

        this._customControlIdCounter = 0;
        this._customControls = new Map();
    }
    
    async init() {
        try {
            await this._loadAndMergeConfigs();
            this._setupScene();
            this._setupRenderer();
            this._setupCamera();
            this._setupLights();
            await this._setupHandlers();

            await this._loadModel();
            this._loadCoordinateSystem();
            this._setupResizeListener();

            this.cameraHandler.animateCameraOnLoad();
            this.animationHandler.initScrollListener();
            
            this._animate();
            
            // Edit-Mode aktivieren, falls in Config gesetzt
            if (this.config.editMode === true) {
                await this.enableEditmode();
            }
            
            console.log('ExplodedViewer erfolgreich initialisiert.');

        } catch (error) {
            console.error('Fehler beim initialisieren des ExplodedViewers:', error)
        }
    }

    async _loadAndMergeConfigs() {
        // 1. Standardwerte laden
        let mergedConfig = JSON.parse(JSON.stringify(defaultOptions));

        // 2. JSON-Datei des nutzers laden, falls sie angegeben ist
        const configPath = this.userOptions.sceneConfigPath || mergedConfig.sceneConfigPath;
        if (configPath) {
            try {
                const response = await fetch(configPath);
                const fileConfig = await response.json();
                // Konfigurationsdatei mit den Defaults mergen
                mergedConfig = deepMerge(mergedConfig, fileConfig);
            } catch (error) {
                console.error(`Fehler beim Laden der Konfigurationsdatei: ${configPath}`, error);
            }
        }

        // 3. userOptions aus dem Konstruktor mit der merged Config kombinieren (höchste Priorität)
        // Prio:
        // Default --> Json --> userOptions
        this.config = deepMerge(mergedConfig, this.userOptions);
    }

    _setupScene() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(this.config.sceneConfig.backgroundColor);
    }

    _setupRenderer() {
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.shadowMap.enabled = this.config.sceneConfig.shadowsEnabled;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.container.appendChild(this.renderer.domElement);
        this.renderer.domElement.style.touchAction = 'none';
    }

    _setupCamera() {
        this.cameraHandler = new CameraHandler(this.config, this.container);
        this.cameraHandler.initialize(this.renderer);
        this.camera = this.cameraHandler.getCamera();
        this.controls = this.cameraHandler.getControls();
    }

    _setupLights() {
        setupLights(this.config, this.scene, this.lights);
    }

    _setupResizeListener() {
        this._resizeListener = () => {
            const width = this.container.clientWidth;
            const height = this.container.clientHeight;

            // Kamera-Aspektverhältnis aktualisieren
            this.cameraHandler.resize(width, height)

            // Renderer-Größe aktualisieren
            this.renderer.setSize(width, height);
        };
        window.addEventListener('resize', this._resizeListener);
    }

    async _setupHandlers() {
        this.animationHandler = new AnimationHandler(this.scene, this.config, this.renderer);
        
        // Handler je nach Infoelement Typ dynamisch laden (Code-Splitting)
        let handlerType = this.config.infoElementType || 'card';
        switch (handlerType) {
            case 'pointer': {
                const { PointerHandler } = await import('./modules/info-elements/pointer-handler.js');
                this.infoElementHandler = new PointerHandler(this.camera, this.config.pointerConfig);
                console.log('pointer');
                break;
            }
            case 'card': {
                const { CardHandler } = await import('./modules/info-elements/card-handler.js');
                this.infoElementHandler = new CardHandler();
                console.log('card');
                break;
            }
            case 'attached-card': {
                const { AttachedCardHandler } = await import('./modules/info-elements/attached-card-handler.js');
                this.infoElementHandler = new AttachedCardHandler();
                console.log('attached-card');
                break;
            }
            default: {
                const { CardHandler } = await import('./modules/info-elements/card-handler.js');
                this.infoElementHandler = new CardHandler();
            }
        }

        this.infoElementHandler.initialize(this.config.cardDataPath, this.config);

        this.highlightHandler = new HighlightHandler(this.scene, this.config.highlightOptions);
        this.highlightHandler.initialize();

        this.clickHandler = new ClickHandler(this.camera, this.scene, this.infoElementHandler, this.renderer, this.highlightHandler);
        this.clickHandler.initialize();

        // UIHandler nur laden wenn Debug-UI aktiviert ist (Code-Splitting)
        if (this.config.showDebugUI !== false) {
            const { UIHandler } = await import('./modules/ui-Handler.js');
            this.uiHandler = new UIHandler();
            this.uiHandler.initialize(this.config, this.lights, this.scene, this.camera, this.controls, this.cameraHandler, this.renderer);
            this.uiHandler.setAnimationHandler(this.animationHandler);
            this.uiHandler.setCameraHandler(this.cameraHandler);
            this.uiHandler.setHighlightHandler(this.highlightHandler);
        }

        if (this.config.showStats) {
            this.statsHandler = new StatsHandler();
        }
    }

    async _loadModel() {
        try {
            const loader = new GLTFLoader();
            const gltf = await loader.loadAsync(this.config.modelPath);
            this.model = gltf.scene;
            this.highlightHandler.modelChildren = this.model.children;
            //console.log(this.model.children)
            this.scene.add(this.model);
            
            this.model.traverse(function(child) {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }});

            await this.animationHandler.initialize(this.model, this.config.explosionConfigPath);
        } catch (error) {
            console.error("Fahler beim Laden des Modells oder initialisieren der Animation:", error)
        }
    }

    async _loadCoordinateSystem() {
        try {
            const loader = new GLTFLoader();
            const gltf = await loader.loadAsync(coordinateSystemUrl);

            const coordinateSystem = gltf.scene;
            coordinateSystem.name = 'Coordinatesystem';
            coordinateSystem.visible = this.config.sceneConfig.showCoordinatesystem;
            // Koordinatensystem nicht selektierbar machen
            coordinateSystem.traverse(node => {
                node.userData = node.userData || {};
                node.userData.nonSelectable = true;
            });
            this.scene.add(coordinateSystem);
        } catch (error) {
            console.error('Fehler beim Laden des Koordinatensystems:', error);
        }
    }

    _animate() {
        this._animationFrameId = requestAnimationFrame(() => this._animate());
        this.controls.update();

        // Animation aktualisieren, falls der Handler existiert
        if (this.animationHandler) {
            this.animationHandler.updateExplosion();
        }
    
        // Ui aktualisieren, falls der Handler existiert
        if (this.uiHandler) {
            this.uiHandler.refreshPane()
        }

        this._refreshCustomControls();

        // Stats aktualisieren, falls der Handler existiert
        if (this.statsHandler) {
            this.statsHandler.update();
        } 

        this.renderer.render(this.scene, this.camera);

        if (this.infoElementHandler?.labelRenderer) {
        this.infoElementHandler.labelRenderer.render(this.scene, this.camera);
        }
    }

    // --- Custom Controlls einbinden ---

    // Löst einen Selektor oder ein DOM-Element in ein gültiges UI-Element auf.
    _resolveControlElement(elementOrSelector) {
        if (!elementOrSelector) {
            throw new Error('Kein UI-Element übergeben.');
        }

        if (typeof elementOrSelector === 'string') {
            const element = document.querySelector(elementOrSelector);
            if (!element) {
                throw new Error(`UI-Element nicht gefunden: ${elementOrSelector}`);
            }
            return element;
        }

        return elementOrSelector;
    }

    // Stellt sicher, dass die Animations-API verfügbar ist.
    _ensureAnimationHandlerReady() {
        if (!this.animationHandler) {
            throw new Error('AnimationHandler ist noch nicht verfügbar. Bitte erst viewer.init() aufrufen.');
        }
    }

    // Registriert ein Control intern und gibt eine eindeutige ID zurück.
    _registerCustomControlEntry(entry) {
        const id = `control_${++this._customControlIdCounter}`;
        this._customControls.set(id, entry);
        return id;
    }

    // Synchronisiert registrierte Slider mit dem aktuellen Animationsfortschritt.
    _refreshCustomControls() {
        if (!this._customControls || this._customControls.size === 0 || !this.animationHandler) {
            return;
        }

        const state = this.animationHandler.getAnimationState();
        this._customControls.forEach((entry) => {
            if (entry?.type !== 'slider' || !entry.syncWithAnimation) {
                return;
            }

            const slider = entry.element;
            if (!slider) {
                return;
            }

            if (entry.usePercent) {
                const percent = Math.round(state.currentProgress * 10000) / 100;
                if (Number(slider.value) !== percent) {
                    slider.value = String(percent);
                }
                return;
            }

            const factor = Math.round(state.currentProgress * 10000) / 10000;
            if (Number(slider.value) !== factor) {
                slider.value = String(factor);
            }
        });
    }

    // Registriert einen benutzerdefinierten Button für Start/Pause/Toggle der Animation.
    registerAnimationButton(elementOrSelector, options = {}) {
        this._ensureAnimationHandlerReady();

        const element = this._resolveControlElement(elementOrSelector);
        const {
            eventName = 'click',
            action = 'toggle',
            onTrigger = null,
        } = options;

        const handler = () => {
            switch (action) {
                case 'start':
                    this.animationHandler.startAnimation();
                    break;
                case 'pause':
                    this.animationHandler.pauseAnimation();
                    break;
                case 'toggle':
                default:
                    this.animationHandler.toggleAnimation();
                    break;
            }

            if (typeof onTrigger === 'function') {
                onTrigger(this.animationHandler.getAnimationState(), this.animationHandler);
            }
        };

        element.addEventListener(eventName, handler);

        return this._registerCustomControlEntry({
            type: 'button',
            element,
            cleanup: () => element.removeEventListener(eventName, handler),
        });
    }

    // Registriert einen benutzerdefinierten Slider für den Animationsfortschritt.
    registerAnimationSlider(elementOrSelector, options = {}) {
        this._ensureAnimationHandlerReady();

        const element = this._resolveControlElement(elementOrSelector);
        const {
            eventName = 'input',
            usePercent = true,
            animate = false,
            syncWithAnimation = true,
            onChange = null,
        } = options;

        const handler = () => {
            const rawValue = Number(element.value);
            if (!Number.isFinite(rawValue)) {
                return;
            }

            if (usePercent) {
                if (animate) {
                    this.animationHandler.setProgress(rawValue);
                } else {
                    this.animationHandler.seekToProgress(rawValue);
                }
            } else {
                const clamped = Math.max(0, Math.min(1, rawValue));
                if (animate) {
                    this.animationHandler.setExplosionFactorAnimated(clamped);
                } else {
                    this.config.animationConfig.expFactor = clamped;
                }
            }

            if (typeof onChange === 'function') {
                onChange(this.animationHandler.getAnimationState(), this.animationHandler);
            }
        };

        element.addEventListener(eventName, handler);

        const id = this._registerCustomControlEntry({
            type: 'slider',
            element,
            usePercent,
            syncWithAnimation,
            cleanup: () => element.removeEventListener(eventName, handler),
        });

        this._refreshCustomControls();
        return id;
    }

    // Registriert einen benutzerdefinierten Reset-Button
    registerAnimationResetButton(elementOrSelector, options = {}) {
        this._ensureAnimationHandlerReady();

        const element = this._resolveControlElement(elementOrSelector);
        const {
            eventName = 'click',
            progress = 0,
            onTrigger = null,
        } = options;

        const targetProgress = Math.max(0, Math.min(100, progress));
        const handler = () => {
            this.animationHandler.resetAnimation(targetProgress);
            this._refreshCustomControls();

            if (typeof onTrigger === 'function') {
                onTrigger(this.animationHandler.getAnimationState(), this.animationHandler);
            }
        };

        element.addEventListener(eventName, handler);

        return this._registerCustomControlEntry({
            type: 'reset',
            element,
            cleanup: () => element.removeEventListener(eventName, handler),
        });
    }

    // Entfernt ein einzelnes zuvor registriertes Custom-Control.
    unregisterCustomControl(controlId) {
        if (!this._customControls || !this._customControls.has(controlId)) {
            return false;
        }

        const entry = this._customControls.get(controlId);
        if (typeof entry.cleanup === 'function') {
            entry.cleanup();
        }

        this._customControls.delete(controlId);
        return true;
    }

    // Entfernt alle registrierten Custom-Controls inklusive Event-Listener.
    unregisterAllCustomControls() {
        if (!this._customControls) {
            return;
        }

        this._customControls.forEach((entry) => {
            if (typeof entry.cleanup === 'function') {
                entry.cleanup();
            }
        });

        this._customControls.clear();
    }

    // --- Edit-Mode Helpers ---

    async _setupEditor() {
        const { EditorController } = await import('./modules/editor/editor-controller.js');
        const { TransformControlsHandler } = await import('./modules/editor/transform-controls-handler.js');

        this.editor = new EditorController({
            scene: this.scene,
            camera: this.camera,
            renderer: this.renderer,
            clickHandler: this.clickHandler,
            animationHandler: this.animationHandler,
            explosionConfigPath: this.config.explosionConfigPath,
            config: this.config,
            controls: this.controls,
            cameraHandler: this.cameraHandler,
            highlightHandler: this.highlightHandler
        });

        this.editor.setInfoElementHandler(this.infoElementHandler);
        if (this.uiHandler) {
            this.editor.setUIHandler(this.uiHandler);
        }
        this.editor.cameraHandler = this.cameraHandler;
        this.editor.transformHandler = new TransformControlsHandler(this.camera, this.renderer, this.scene);
    }

    async _ensureEditorStylesLoaded() {
        if (this._editorStylesLoaded) {
            return;
        }

        // Inline-loader für das automatische importieren in bundled environments ohne Pfadprobleme
        try {
            const { loadEditorCss } = await import('./utils/editor-style-loader.js');
            loadEditorCss();
        } catch (error) {
            console.warn('ExplodedViewer: Could not load editor styles.', error);
        }

        this._editorStylesLoaded = true;
    }


    // Handler-Zugriff
    getAnimationHandler() {
        return this.animationHandler;
    }

    getHighlightHandler() {
        return this.highlightHandler;
    }

    getCameraHandler() {
        return this.cameraHandler;
    }

    getClickHandler() {
        return this.clickHandler;
    }

    getInfoElementHandler() {
        return this.infoElementHandler;
    }

    // Szenen-Zugriff
    getScene() {
        return this.scene;
    }

    getCamera() {
        return this.camera;
    }

    getRenderer() {
        return this.renderer;
    }

    getModel() {
        return this.model;
    }

    // Config-Management
    getConfig() {
        return this.config;
    }

    exportConfig() {
        return {
            sceneConfig: this.config,
            explosionConfig: this.getExplosionConfig()
        };
    }

    // Edit-Mode Helpers
    async enableEditmode() {
        // Css für Edit-Mode laden
        await this._ensureEditorStylesLoaded();
        if (!this.editor) {
            await this._setupEditor();
        }
        this.editor?.enable();
    }

    disableEditmode() {
        this.editor?.disable();
        this.editor?.transformHandler.detach();
    }

    isEditMode() {
        return this.editor?.enabled === true;
    }

    attachTransformControlsByUUID(uuid) {
    const object = this.scene.getObjectByProperty('uuid', uuid);
        if (object) {
            this.editor.transformHandler.attach(object);
        }
    }

    detachTransformControls() {
        this.editor.transformHandler.detach();
    }

    destroy() {

        this.unregisterAllCustomControls();

        if (this._animationFrameId) {
            cancelAnimationFrame(this._animationFrameId);
            this._animationFrameId = null;
        }
        
        if (this._resizeListener) {
            window.removeEventListener('resize', this._resizeListener);
        }
            
        // Handler zerstören
        if (this.animationHandler) this.animationHandler.destroy();
        if (this.clickHandler) this.clickHandler.destroy();
        if (this.highlightHandler) this.highlightHandler.destroy();
        if (this.cardHandler) this.cardHandler.destroy();
        if (this.uiHandler) this.uiHandler.destroy();
        if (this.statsHandler) this.statsHandler.destroy();
        if (this.cameraHandler) this.cameraHandler.destroy();

        // Szene bereinigen
        if (this.scene) {
            this.scene.traverse(object => {
                if (object.isMesh) {
                    if (object.geometry) {
                        object.geometry.dispose();
                    }
                    if (object.material) {
                        if (Array.isArray(object.material)) {
                            object.material.forEach(material => material.dispose());
                        } else {
                            object.material.dispose();
                        }
                    }
                }
            });
        }

        // Renderer und controlls entfernen
        if (this.controls) this.controls.dispose();
        if (this.renderer) {
            this.renderer.dispose();
            if (this.renderer.domElement && this.container.contains(this.renderer.domElement)) {
                this.container.removeChild(this.renderer.domElement);
            }
        }

        // Editor zerstören
        if (this.editor) {
            this.editor.transformHandler.dispose();
        }

        // Szene und Kamera entfernen
        this.scene = null;
        this.camera = null;
        this.model = null;
        this.renderer = null;
        this.controls = null;
        this.cameraHandler = null;
        this.animationHandler = null;
        this.uiHandler = null;
        this.clickHandler = null;
        this.cardHandler = null;
        this.statsHandler = null;
        this.config = null;
        this.lights = null;
        this.options = null;
        this.container = null;
        this.editor = null;
    }
}

export default ExplodedViewer;