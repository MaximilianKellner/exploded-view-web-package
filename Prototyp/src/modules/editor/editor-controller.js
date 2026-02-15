import { EditorLightController } from './editor-light-controller.js';
import { EditorAnimationController } from './editor-animation-controller.js';
import { EditorSidebarPanel } from './editor-sidebar-panel.js';

export class EditorController {
    constructor({ scene, camera, renderer, clickHandler, animationHandler, explosionConfigPath, config, controls, cameraHandler, highlightHandler }) {
        this.scene = scene;
        this.camera = camera;
        this.renderer = renderer;
        this.clickHandler = clickHandler;
        this.animationHandler = animationHandler;
        this.explosionConfigPath = explosionConfigPath;
        this.config = config;
        this.controls = controls;
        this.cameraHandler = cameraHandler;
        this.highlightHandler = highlightHandler;

        this.enabled = false;
        this.transformHandler = null;
        // Light Controller initialisieren
        this.lightController = new EditorLightController({
            scene: this.scene,
            renderer: this.renderer,
            config: this.config
        });

        // Animation Controller initialisieren
        this.animController = new EditorAnimationController({
            scene: this.scene,
            renderer: this.renderer,
            config: this.config,
            animationHandler: this.animationHandler,
            explosionConfigPath: this.explosionConfigPath,
            clickHandler: this.clickHandler
        });

        // Event handlers
        this._onObjectSelected = this._onObjectSelected.bind(this);
        this._onObjectDeselected = this._onObjectDeselected.bind(this);
        this._onLightSelectedEvent = this._onLightSelectedEvent.bind(this);
        this._onTransformChange = this._onTransformChange.bind(this);
        this._onExportSceneConfig = this._onExportSceneConfig.bind(this);

        // Sidebar Panel initialisieren --> Tab-Komponenten
        const container = this.renderer.domElement.parentElement;
        this.editorSidebarPanel = new EditorSidebarPanel(container, {
            scene: this.scene,
            renderer: this.renderer,
            config: this.config,
            animationHandler: this.animationHandler,
            controls: this.controls,
            cameraHandler: this.cameraHandler,
            highlightHandler: this.highlightHandler,
            onLightSelect: (light) => {
                this.animController.deselectObject();
                this.lightController.selectLight(light);
            },
            onExportSceneConfig: this._onExportSceneConfig,
            onAddLight: () => {
                // Bei neuem Licht auch Object Selection entfernen
                this.animController.deselectObject();
                this.lightController.addLight();
            }
        });
        
        // Callbacks für Sidebar Updates vom LightController
        this.lightController.setSidebarCallbacks({
            onRefresh: () => this.editorSidebarPanel?.getTab('lights')?.refresh(),
            onUpdateItem: (light) => this.editorSidebarPanel?.getTab('lights')?.updateLightItem(light)
        });

        // Callbacks für Sidebar Updates vom AnimationController
        this.animController.setSidebarCallbacks({
             onUpdateIcon: (name) => this.editorSidebarPanel?.getTab('objects')?.updateObjectIcon(name)
        });
    }

    enable() {
        // === EDIT MODE AKTIVIEREN ===
        this.enabled = true;
        
        // InfoElements ausblenden (Cards/Pointer)
        this.infoElementHandler?.setVisible(false);
                    
        // Scroll-Listener deaktivieren
        this.animationHandler?.removeScrollListener();
        
        // UI-Handler (Tweakpane) ausblenden
        this.uiHandler?.hide();

        // Sub-Controllers aktivieren
        this.animController.enable();
        this.lightController.enable();

        // Sidebar anzeigen
        this.editorSidebarPanel?.show();
        
        // ClickHandler in Edit-Mode setzen
        this.clickHandler?.setEditMode(true);

        // Object Selection Event Listener aktivieren
        window.addEventListener('ev:objectSelected', this._onObjectSelected);
        window.addEventListener('ev:objectDeselected', this._onObjectDeselected);
        window.addEventListener('ev:lightSelected', this._onLightSelectedEvent);

        // CameraHandler an TransformHandler übergeben für Gizmo-Interaktion
        if (this.transformHandler) {
            this.transformHandler.setCameraHandler(this.cameraHandler);
            
            // TransformHandler an ClickHandler übergeben um Drag-Click-Konflikte zu vermeiden
            this.clickHandler?.setTransformHandler(this.transformHandler);
            
            // Listener für Transform-Änderungen hinzufügen, um Animationen synchron zu halten
            if (this.transformHandler.controls) {
                this.transformHandler.controls.addEventListener('change', this._onTransformChange);
            }
            
            // TransformHandler an Sub-Controllers übergeben
            this.lightController.setTransformHandler(this.transformHandler);
            this.animController.setTransformHandler(this.transformHandler);
        }
    }

    disable() {
        // === VIEWER MODE WIEDERHERSTELLEN ===
        this.enabled = false;

        // InfoElements wieder anzeigen
        this.infoElementHandler?.setVisible(true);
        
        // Scroll-Listener wieder aktivieren
        this.animationHandler?.initScrollListener();
        
        // UI-Handler wieder anzeigen
        this.uiHandler?.show();
        
        // Sub-Controllers deaktivieren
        this.animController.disable();
        this.lightController.disable();

        // Sidebar verstecken
        this.editorSidebarPanel?.hide();

        // ClickHandler zurück in Viewer-Mode
        this.clickHandler?.setEditMode(false);

        // Object Selection Event Listener deaktivieren
        window.removeEventListener('ev:objectSelected', this._onObjectSelected);
        window.removeEventListener('ev:objectDeselected', this._onObjectDeselected);
        window.removeEventListener('ev:lightSelected', this._onLightSelectedEvent);

        // Listener für Transform-Änderungen entfernen
        if (this.transformHandler && this.transformHandler.controls) {
            this.transformHandler.controls.removeEventListener('change', this._onTransformChange);
        }

        // Gizmo von ausgewähltem Objekt entfernen
        this.transformHandler?.detach();
    }

    _onLightSelectedEvent(event) {
        const light = event?.detail?.light;
        if (light) {
            this.animController.deselectObject();
            this.lightController.selectLight(light);
            // UI auf Lichter-Tab umschalten und Objekt-Highlight entfernen
            this.editorSidebarPanel?.switchTab('lights');
            this.editorSidebarPanel?.getTab('objects')?.clearSelection();
        }
    }

    // Event Handler für Objektauswahl
    _onObjectSelected(event) {
        let object;
        
        if (event.detail) {
            // Custom Event vom Click Handler
            object = event.detail.object;
        } else {
            // Direkter Aufruf von der Objektliste in der Sidebar
            object = event;
        }

        // Prüfen, ob das geklickte Objekt PreviewObject ist --> dann ignorieren
        if (this.animController.previewObject) {
            let isPreview = false;
            // Einfacher Check zuerst
            if (object === this.animController.previewObject) isPreview = true;
            
            // Parent Check für Teile des PreviewObjects
            if (!isPreview) {
                object.traverseAncestors((ancestor) => {
                    if (ancestor === this.animController.previewObject) isPreview = true;
                });
            }
            
            if (isPreview) {
                console.log('EditorController: Klick auf Preview ignoriert.');
                return;
            }
        }
        
        this.lightController.clearSelection();
        this.animController.selectObject(object);
        // UI auf Objekte-Tab umschalten und Licht-Highlight entfernen
        this.editorSidebarPanel?.switchTab('objects');
        this.editorSidebarPanel?.getTab('lights')?.clearSelection();

        // Bei Objekt-Selektion in der Timeline zum Objekt scrollen (UI + 3D-Click)
        this.animController?.editorTimeline?.scrollToObject(object?.name);
    }

    // Event Handler für Objektdeselection
    _onObjectDeselected(event) {
        this.animController.deselectObject();
        // Objekt-Highlight in der UI entfernen
        this.editorSidebarPanel?.getTab('objects')?.clearSelection();
    }
    
    _clearObjectSelection() {
        this.animController.deselectObject();
    }

    setInfoElementHandler(handler) {
        this.infoElementHandler = handler;
    }

    setUIHandler(handler) {
        this.uiHandler = handler;
    }

    // Callback für Export der Szenen-Konfiguration
    _onExportSceneConfig() {
        const sceneConfig = this.config?.sceneConfig;
        if (!sceneConfig) return;

        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(sceneConfig, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", "scene-config.json");
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    }

    // Event Handler für Transform-Änderungen (Verschieben/Rotieren/Skalieren)
    // Wird aufgerufen, wenn der Nutzer ein Objekt mit dem Gizmo manipuliert.
    _onTransformChange() {
        // Check Light Controller
        if (this.lightController && this.transformHandler?.controls?.object === this.lightController.selectedLight) {
            this.lightController.updateFromTransform();
            return;
        }

        // Check Animation Controller
        if (this.animController.previewObject && this.transformHandler?.controls?.object === this.animController.previewObject) {
             this.animController.updateFromTransform();
        }
    }
}