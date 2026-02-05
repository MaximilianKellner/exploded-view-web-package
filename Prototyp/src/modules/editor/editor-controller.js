import * as THREE from 'three';
import { EditorPanel } from './editor-anim-panel.js';
import { EditorLightPanel } from './editor-light-panel.js';
import { EditorTimeline } from './editor-timeline.js';
import { EditorSidebarPanel } from './editor-sidebar-panel.js';
import '../../css/editor-anim-panel.css';
import '../../css/editor-sidebar-panel.css';
import '../../css/editor-light-panel.css';

export class EditorController {
    constructor({ scene, camera, renderer, clickHandler, animationHandler, explosionConfigPath, config }) {
        this.scene = scene;
        this.camera = camera;
        this.renderer = renderer;
        this.clickHandler = clickHandler;
        this.animationHandler = animationHandler;
        this.explosionConfigPath = explosionConfigPath;
        this.config = config;

        this.enabled = false;
        this.transformHandler = null;
        this.selectedObject = null;
        this.selectedLight = null;
        this.selectedLightKey = null;
        this.previewObject = null;
        this.cameraHandler = null;
        this.lightHelpers = new Map();

        // Event handlers
        this._onObjectSelected = this._onObjectSelected.bind(this);
        this._onObjectDeselected = this._onObjectDeselected.bind(this);
        this._onLightSelected = this._onLightSelected.bind(this);
        this._onLightSelectedEvent = this._onLightSelectedEvent.bind(this);
        this._onTransformChange = this._onTransformChange.bind(this);
        this._onPanelChange = this._onPanelChange.bind(this);
        this._onExportConfig = this._onExportConfig.bind(this);
        this._onExportSceneConfig = this._onExportSceneConfig.bind(this);
        this._onDeleteAnimation = this._onDeleteAnimation.bind(this);
        this._onDeleteLight = this._onDeleteLight.bind(this);
        this._onLightPanelChange = this._onLightPanelChange.bind(this);
        this._onLightModeChange = this._onLightModeChange.bind(this);
        this._onKeyframeChange = this._onKeyframeChange.bind(this);
        this._onPanelTimelineChange = this._onPanelTimelineChange.bind(this);

        // Editor Panel initialisieren
        const container = this.renderer.domElement.parentElement;
        this.editorPanel = new EditorPanel(container);
        this.editorPanel.setCallbacks({
            onChange: this._onPanelChange,
            onExport: this._onExportConfig,
            onDelete: this._onDeleteAnimation
        });

        // Light Panel initialisieren
        this.lightPanel = new EditorLightPanel(container, {
            config: this.config
        });
        this.lightPanel.setCallbacks({
            onDelete: this._onDeleteLight,
            onChange: this._onLightPanelChange,
            onModeChange: this._onLightModeChange
        });

        // Sidebar Panel initialisieren --> Tab-Komponenten
        this.editorSidebarPanel = new EditorSidebarPanel(container, {
            scene: this.scene,
            renderer: this.renderer,
            config: this.config,
            animationHandler: this.animationHandler,
            onLightSelect: this._onLightSelected,
            onExportSceneConfig: this._onExportSceneConfig
        });

        // Editor Timeline initialisieren
        this.editorTimeline = new EditorTimeline(container, animationHandler, this.explosionConfigPath);
        this.editorTimeline.hide(); // Initial versteckt
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
        
        // Timeline anzeigen
        this.editorTimeline?.show();

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
        }

        this._initLightHelpers();
        
        // Keyframe-Callbacks registrieren (Timeline <-> EditorPanel Synchronisation)
        this.editorTimeline?.setKeyframeCallbacks({
            onKeyframeChange: this._onKeyframeChange
        });
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
        
        // Timeline verstecken
        this.editorTimeline?.hide();

        // Sidebar verstecken
        this.editorSidebarPanel?.hide();

        // Light Panel verstecken
        this.lightPanel?.hide();

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
        if (this.selectedObject) {
            this.transformHandler?.detach();
            this._removePreviewObject();
            this.selectedObject = null;
        }

        this._clearLightSelection();
        this._clearLightHelpers();
    }

    _onLightSelectedEvent(event) {
        const light = event?.detail?.light;
        if (light) {
            this._onLightSelected(light);
        }
    }

    // Event Handler für Objektauswahl
    _onObjectSelected(event) {
        // Wenn event ein Custom Event ist (von window.addEventListener)
        let object, UUID;
        
        if (event.detail) {
            // Custom Event vom Click Handler
            object = event.detail.object;
            UUID = event.detail.UUID;
        } else {
            // Direkter Aufruf von der Objektliste in der Sidebar
            object = event;
        }

        // Prüfen, ob das geklickte Objekt PreviewObject ist --> dann ignorieren
        if (this.previewObject) {
            let isPreview = false;
            if (object === this.previewObject) isPreview = true;
            object.traverseAncestors((ancestor) => {
                if (ancestor === this.previewObject) isPreview = true;
            });
            
            if (isPreview) {
                console.log('EditorController: Klick auf Preview ignoriert.');
                return;
            }
        }

        this._clearLightSelection();
        
        // Wenn dasselbe Objekt nochmal geklickt wird, nichts tun
        if (this.selectedObject === object) {
            console.log('EditorController: Objekt bereits ausgewählt:', object.name);
            return;
        }
        
        // Vorheriges Objekt deselektieren - Preview immer entfernen
        this.transformHandler?.detach();
        this._removePreviewObject();

        // Neues Objekt selektieren
        this.selectedObject = object;
        
        // PreviewObject erstellen und Gizmo anhängen
        this._createPreviewObject(object);
        
        // Panel anzeigen und mit Daten füllen
        let item = this.animationHandler.getExplodableItem(object);
        
        // Wenn keine Config existiert, Standardwerte verwenden und Config erstellen
        if (!item) {
            const defaultConfig = {
                expDirection: new THREE.Vector3(0, 1, 0),
                targetLevel: 1,
                start: 0,
                end: 1
            };
            
            // Neue Config im AnimationHandler erstellen
            this.animationHandler.updateObjectConfig(object, defaultConfig);
            item = this.animationHandler.getExplodableItem(object);
            
            // Timeline aktualisieren - objectCount und ggf. neue Items hinzufügen
            this.editorTimeline?.updateObjectCount();
            
            // Objektliste im Sidebar aktualisieren --> animated icon hinzufügen
            this.editorSidebarPanel?.getTab('objects')?.updateObjectIcon(object.name);
        }
        
        // Panel mit Daten anzeigen
        if (item) {
            this.editorPanel.show({
                name: object.name,
                expDirection: item.expDirection,
                targetLevel: item.targetLevel,
                start: item.start,
                end: item.end
            });
        }

        this.lightPanel?.hide();
        
        console.log('EditorController: Objekt ausgewählt, PreviewObject erstellt:', object.name);
    }

    // Event Handler für Objektdeselection
    _onObjectDeselected(event) {
        const { object, UUID } = event.detail;
        
        // Gizmo entfernen wenn es das ausgewählte Objekt ist
        if (this.selectedObject === object) {
            this.transformHandler?.detach();
            this._removePreviewObject();
            this.selectedObject = null;
            this.editorPanel.hide();
            console.log('EditorController: Objekt deselektiert:', object.name);
        }
    }

    //Event Handler für Licht-Auswahl aus der Sidebar
    _onLightSelected(light) {
        if (!light) return;

        this._clearObjectSelection();

        const lightKey = light.name || light.uuid;
        if (this.config && this.config.sceneConfig && !this.config.sceneConfig.lights) {
            this.config.sceneConfig.lights = {};
        }
        const lightsConfig = this.config?.sceneConfig?.lights || {};
        let configEntry = lightsConfig[lightKey];

        if (!configEntry) {
            configEntry = this._createLightConfigFromObject(light);
            lightsConfig[lightKey] = configEntry;
            light.name = lightKey;
        }
        this.editorPanel.hide();
        this.lightPanel.show(light, lightKey, configEntry);
        this.selectedLight = light;
        this.selectedLightKey = lightKey;
        this.transformHandler?.attach(light);
        this.transformHandler?.setMode('translate');
        this.transformHandler?.controls?.setSpace('world');
        this._applyLightLookAt(light, configEntry);
        this._updateLightHelper(light);
        console.log('EditorController: Licht ausgewählt:', lightKey);
    }

    _clearObjectSelection() {
        if (this.selectedObject) {
            this.transformHandler?.detach();
            this._removePreviewObject();
            this.selectedObject = null;
            this.editorPanel.hide();
        }
    }

    _clearLightSelection() {
        if (this.selectedLight) {
            this.transformHandler?.detach();
            this.selectedLight = null;
            this.selectedLightKey = null;
            this.lightPanel?.hide();
        }
    }

    _initLightHelpers() {
        this._clearLightHelpers();
        this.scene?.traverse((node) => {
            if (node.isDirectionalLight || node.isPointLight || node.isSpotLight) {
                const helper = this._createLightHelper(node);
                if (helper) {
                    this.lightHelpers.set(node.uuid, helper);
                    this.scene.add(helper);
                }
            }
        });
    }

    _clearLightHelpers() {
        this.lightHelpers.forEach((helper) => {
            if (helper.parent) {
                helper.parent.remove(helper);
            }
        });
        this.lightHelpers.clear();
    }

    _createLightHelper(light) {
        let helper = null;

        if (light.isDirectionalLight) {
            helper = new THREE.DirectionalLightHelper(light, 1);
        } else if (light.isPointLight) {
            helper = new THREE.PointLightHelper(light, 0.5);
        } else if (light.isSpotLight) {
            helper = new THREE.SpotLightHelper(light);
        }

        if (!helper) return null;

        helper.traverse((node) => {
            node.userData = node.userData || {};
            node.userData.lightHelper = true;
            node.userData.lightRef = light;
        });

        helper.userData = helper.userData || {};
        helper.userData.lightHelper = true;
        helper.userData.lightRef = light;

        return helper;
    }

    _updateLightHelper(light) {
        const helper = this.lightHelpers.get(light.uuid);
        if (helper && helper.update) {
            helper.update();
        }
    }

    _applyLightLookAt(light, configEntry) {
        if (!(light && configEntry)) return;

        if (light.isDirectionalLight || light.isSpotLight) {
            const lookAtEnabled = configEntry.lookAtEnabled !== false;
            if (!light.target.parent) {
                this.scene.add(light.target);
            }

            if (lookAtEnabled) {
                light.target.position.set(0, 0, 0);
            } else {
                const worldQuat = new THREE.Quaternion();
                light.getWorldQuaternion(worldQuat);
                const direction = new THREE.Vector3(0, 0, -1).applyQuaternion(worldQuat);
                const targetPosition = light.getWorldPosition(new THREE.Vector3()).add(direction);
                light.target.position.copy(targetPosition);
            }
        }
    }

    // Temporäres Objekt zur visualisierung der Transformation erstellen
    _createPreviewObject(originalObject) {
        // Preview erstellen (Klonen)
        this.previewObject = originalObject.clone();
        
        // Editor-Material erstellen (Weiß, Wireframe)
        const ghostMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            wireframe: true,
            transparent: true,
            opacity: 0.5
        });

        // Material auf alle Meshes im PreviewObject anwenden
        this.previewObject.traverse((node) => {
            // Raycasting deaktivieren
            node.raycast = () => {};
            
            if (node.isMesh) {
                node.material = ghostMaterial;
            }
        });

        // PreviewObject an der Endposition platzieren
        const item = this.animationHandler.getExplodableItem(originalObject);
        if (item) {
            const layerDist = this.animationHandler.config.animationConfig.layerDistance || 1;
            const offset = item.expDirection.clone().multiplyScalar(item.targetLevel * layerDist);
            this.previewObject.position.copy(item.originalPosition).add(offset);
        } else {
            // Fallback: Original-Position verwenden, wenn keine Config existiert
            this.previewObject.position.copy(originalObject.position);
        }

        // PreviewObject als Sibling hinzufügen (gleicher Parent)
        if (originalObject.parent) {
            originalObject.parent.add(this.previewObject);
        } else {
            this.scene.add(this.previewObject);
        }

        // Gizmo an PreviewObject hängen
        this.transformHandler?.attach(this.previewObject);
    }

    _removePreviewObject() {
        if (this.previewObject) {
            // Gizmo entfernen
            this.transformHandler?.detach();
            
            // Aus Szene entfernen
            if (this.previewObject.parent) {
                this.previewObject.parent.remove(this.previewObject);
            }
            this.previewObject = null;
        }
    }

    setInfoElementHandler(handler) {
        this.infoElementHandler = handler;
    }

    setUIHandler(handler) {
        this.uiHandler = handler;
    }

    // Callback wenn Werte im Panel geändert werden
    _onPanelChange(data) {
        if (!this.selectedObject || !this.previewObject) return;

        // AnimationHandler updaten (alle Werte)
        this.animationHandler.updateObjectConfig(this.selectedObject, data);

        // PreviewObject Position aktualisieren
        const item = this.animationHandler.getExplodableItem(this.selectedObject);
        if (item) {
            const layerDist = this.animationHandler.config.animationConfig.layerDistance || 1;
            const offset = item.expDirection.clone().multiplyScalar(item.targetLevel * layerDist);
            this.previewObject.position.copy(item.originalPosition).add(offset);
        }
        
        // Timeline aktualisieren wenn start/end geändert wurden
        if (data.start !== undefined || data.end !== undefined) {
            const startPercent = this.editorTimeline?.dataManager?.normalizedToPercent(data.start);
            const endPercent = this.editorTimeline?.dataManager?.normalizedToPercent(data.end);
            
            if (startPercent !== undefined && endPercent !== undefined) {
                const keyframeController = this.editorTimeline?.keyframeController;
                if (keyframeController) {
                    keyframeController.updateKeyframeBar(this.selectedObject.name, startPercent, endPercent);
                }
            }
        }
    }

    // Callback für Export Button
    _onExportConfig() {
        this.animationHandler.exportConfig();
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

    // Callback für Delete Button
    _onDeleteAnimation() {
        if (!this.selectedObject) return;

        // Animation im AnimationHandler löschen
        this.animationHandler.deleteAnimation(this.selectedObject);

        // Panel ausblenden
        this.editorPanel.hide();

        // Preview-Objekt und Gizmo entfernen
        this.transformHandler?.detach();
        this._removePreviewObject();

        // Objektliste im Sidebar aktualisieren (animated icon entfernen)
        this.editorSidebarPanel?.getTab('objects')?.updateObjectIcon(this.selectedObject.name);

        // Timeline aktualisieren - Keyframe entfernen
        this.editorTimeline?.updateObjectCount();

        // Selektion zurücksetzen
        this.selectedObject = null;

        console.log('Animation gelöscht und UI aktualisiert');
    }

    _onDeleteLight(light, configKey) {
        if (!light) return;

        if (light.parent) {
            light.parent.remove(light);
        } else {
            this.scene.remove(light);
        }

        const lightsConfig = this.config?.sceneConfig?.lights;
        if (lightsConfig && configKey && lightsConfig[configKey]) {
            delete lightsConfig[configKey];
        }

        const helper = this.lightHelpers.get(light.uuid);
        if (helper && helper.parent) {
            helper.parent.remove(helper);
        }
        this.lightHelpers.delete(light.uuid);

        if (this.selectedLight === light) {
            this.selectedLight = null;
            this.selectedLightKey = null;
            this.transformHandler?.detach();
        }

        this.lightPanel?.hide();
        this.editorSidebarPanel?.getTab('lights')?.refresh();
    }

    _onLightPanelChange(light) {
        if (!light) return;
        const lightsConfig = this.config?.sceneConfig?.lights;
        const configEntry = lightsConfig?.[this.selectedLightKey];
        if (configEntry) {
            this._applyLightLookAt(light, configEntry);
        }
        this._updateLightHelper(light);
    }

    _onLightModeChange(mode) {
        if (!this.selectedLight || !this.transformHandler) return;

        if (mode === 'rotate') {
            const lightsConfig = this.config?.sceneConfig?.lights;
            const configEntry = lightsConfig?.[this.selectedLightKey];
            const allowRotate = (this.selectedLight.isDirectionalLight || this.selectedLight.isSpotLight)
                && (configEntry?.lookAtEnabled === false);

            if (!allowRotate) {
                this.transformHandler.setMode('translate');
                return;
            }
        }

        this.transformHandler.setMode(mode);
        this.transformHandler.controls?.setSpace('world');
    }

    _createLightConfigFromObject(light) {
        const config = {
            type: 'ambient',
            enabled: light.visible ?? true,
            color: light.color ? `#${light.color.getHexString()}` : '#ffffff',
            intensity: light.intensity ?? 1
        };

        if (light.isDirectionalLight) {
            config.type = 'directional';
            config.position = {
                x: light.position?.x ?? 0,
                y: light.position?.y ?? 0,
                z: light.position?.z ?? 0
            };
            config.rotation = {
                x: light.rotation?.x ?? 0,
                y: light.rotation?.y ?? 0,
                z: light.rotation?.z ?? 0
            };
            config.lookAtEnabled = true;
        } else if (light.isAmbientLight) {
            config.type = 'ambient';
        } else if (light.isPointLight) {
            config.type = 'point';
            config.position = {
                x: light.position?.x ?? 0,
                y: light.position?.y ?? 0,
                z: light.position?.z ?? 0
            };
        } else if (light.isSpotLight) {
            config.type = 'spot';
            config.position = {
                x: light.position?.x ?? 0,
                y: light.position?.y ?? 0,
                z: light.position?.z ?? 0
            };
            config.rotation = {
                x: light.rotation?.x ?? 0,
                y: light.rotation?.y ?? 0,
                z: light.rotation?.z ?? 0
            };
            config.lookAtEnabled = true;
        }

        return config;
    }

    // Event Handler für Transform-Änderungen (Verschieben/Rotieren/Skalieren)
    // Wird aufgerufen, wenn der Nutzer ein Objekt mit dem Gizmo manipuliert.
    _onTransformChange() {
        if (this.selectedLight && this.transformHandler?.controls?.object === this.selectedLight) {
            const lightsConfig = this.config?.sceneConfig?.lights;
            const configEntry = lightsConfig?.[this.selectedLightKey];

            if (configEntry) {
                if (this.selectedLight.isDirectionalLight || this.selectedLight.isPointLight || this.selectedLight.isSpotLight) {
                    configEntry.position = {
                        x: this.selectedLight.position.x,
                        y: this.selectedLight.position.y,
                        z: this.selectedLight.position.z
                    };
                }

                if (this.selectedLight.isDirectionalLight || this.selectedLight.isSpotLight) {
                    const worldQuat = new THREE.Quaternion();
                    this.selectedLight.getWorldQuaternion(worldQuat);
                    const worldEuler = new THREE.Euler().setFromQuaternion(worldQuat, this.selectedLight.rotation.order || 'XYZ');
                    configEntry.rotation = {
                        x: worldEuler.x,
                        y: worldEuler.y,
                        z: worldEuler.z
                    };
                }

                this._applyLightLookAt(this.selectedLight, configEntry);
                this.lightPanel?.update(this.selectedLight, this.selectedLightKey, configEntry);
                this._updateLightHelper(this.selectedLight);
            }

            return;
        }

        if (this.previewObject && this.selectedObject && this.animationHandler) {
            const item = this.animationHandler.getExplodableItem(this.selectedObject);
            if (!item) return;

            // Vektor von Start (Original) zu PreviewObject berechnen
            const vector = new THREE.Vector3().subVectors(this.previewObject.position, item.originalPosition);
            
            const distance = vector.length();
            const layerDist = this.animationHandler.config.animationConfig.layerDistance || 1;
            
            // Richtung normalisieren (nur wenn Distanz > 0)
            const direction = distance > 0.000001 ? vector.normalize() : new THREE.Vector3(0, 1, 0); // Fallback Up-Vector

            // AnimationHandler updaten
            this.animationHandler.updateExplosionTarget(
                this.selectedObject, 
                direction, 
                distance / layerDist
            );

            // Panel updaten
            const updatedItem = this.animationHandler.getExplodableItem(this.selectedObject);
            if (updatedItem) {
                this.editorPanel.update({
                    name: this.selectedObject.name,
                    expDirection: updatedItem.expDirection,
                    targetLevel: updatedItem.targetLevel,
                    start: updatedItem.start,
                    end: updatedItem.end
                });
            }
        }
    }

    /**
     * Callback wenn Keyframes in der Timeline geändert werden
     * Aktualisiert das EditorPanel mit neuen start/end Werten
     */
    _onKeyframeChange(objectId, normalizedStart, normalizedEnd) {
        // Prüfen, ob das geänderte Objekt das aktuell ausgewählte ist
        if (this.selectedObject && this.selectedObject.name === objectId) {
            // Falls ja offenees EditorPanel mit neuen Werten aktualisieren
            this.editorPanel.updateStartEnd(normalizedStart, normalizedEnd);
        }
    }

    /**
     * Callback wenn start/end im EditorPanel geändert werden
     * Aktualisiert die Timeline mit neuen Keyframe-Werten
     */
    _onPanelTimelineChange(start, end) {
        if (!this.selectedObject) return;
        
        // Timeline aktualisieren
        const dataManager = this.editorTimeline?.dataManager;
        if (dataManager) {
            const startPercent = dataManager.normalizedToPercent(start);
            const endPercent = dataManager.normalizedToPercent(end);
            
            const keyframeController = this.editorTimeline?.keyframeController;
            if (keyframeController) {
                keyframeController.updateKeyframeBar(this.selectedObject.name, startPercent, endPercent);
            }
        }
    }
}

