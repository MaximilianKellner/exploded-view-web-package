import * as THREE from 'three';
import { EditorPanel } from './editor-panel.js';
import { EditorTimeline } from './editor-timeline.js';
import '../../css/editor.css';

export class EditorController {
    constructor({ scene, camera, renderer, clickHandler, animationHandler }) {
        this.scene = scene;
        this.camera = camera;
        this.renderer = renderer;
        this.clickHandler = clickHandler;
        this.animationHandler = animationHandler;

        this.enabled = false;
        this.transformHandler = null;
        this.selectedObject = null;
        this.previewObject = null;
        this.cameraHandler = null;

        // Event handlers
        this._onObjectSelected = this._onObjectSelected.bind(this);
        this._onObjectDeselected = this._onObjectDeselected.bind(this);
        this._onTransformChange = this._onTransformChange.bind(this);
        this._onPanelChange = this._onPanelChange.bind(this);
        this._onExportConfig = this._onExportConfig.bind(this);

        // Editor Panel initialisieren
        const container = this.renderer.domElement.parentElement;
        this.editorPanel = new EditorPanel(container);
        this.editorPanel.setCallbacks({
            onChange: this._onPanelChange,
            onExport: this._onExportConfig
        });

        // Editor Timeline initialisieren
        this.editorTimeline = new EditorTimeline(container, animationHandler);
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
        
        // ClickHandler in Edit-Mode setzen
        this.clickHandler?.setEditMode(true);

        // Object Selection Event Listener aktivieren
        window.addEventListener('ev:objectSelected', this._onObjectSelected);
        window.addEventListener('ev:objectDeselected', this._onObjectDeselected);

        // CameraHandler an TransformHandler übergeben für Gizmo-Interaktion
        if (this.transformHandler) {
            this.transformHandler.setCameraHandler(this.cameraHandler);
            
            // Listener für Transform-Änderungen hinzufügen, um Animationen synchron zu halten
            if (this.transformHandler.controls) {
                this.transformHandler.controls.addEventListener('change', this._onTransformChange);
            }
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
        
        // Timeline verstecken
        this.editorTimeline?.hide();
        
        // ClickHandler zurück in Viewer-Mode
        this.clickHandler?.setEditMode(false);

        // Object Selection Event Listener deaktivieren
        window.removeEventListener('ev:objectSelected', this._onObjectSelected);
        window.removeEventListener('ev:objectDeselected', this._onObjectDeselected);

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
    }

    // Event Handler für Objektauswahl
    _onObjectSelected(event) {
        const { object, UUID } = event.detail;

        // Prüfen, ob das geklickte Objekt unser eigener Ghost ist (oder ein Teil davon)
        if (this.ghostObject) {
            let isGhost = false;
            if (object === this.ghostObject) isGhost = true;
            object.traverseAncestors((ancestor) => {
                if (ancestor === this.ghostObject) isGhost = true;
            });
            
            if (isGhost) {
                console.log('EditorController: Klick auf Ghost ignoriert.');
                return;
            }
        }
        
        // Vorheriges Objekt deselektieren
        if (this.selectedObject !== object) {
            this.transformHandler?.detach();
            this._removePreviewObject();
        }

        // Neues Objekt selektieren
        this.selectedObject = object;
        
        // PreviewObject erstellen und Gizmo anhängen
        this._createPreviewObject(object);
        
        // Panel anzeigen und mit Daten füllen
        const item = this.animationHandler.getExplodableItem(object);
        if (item) {
            this.editorPanel.show({
                name: object.name,
                expDirection: item.expDirection,
                targetLevel: item.targetLevel,
                speedMultiplier: item.speedMultiplier,
                start: item.start,
                end: item.end
            });
        }
        
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
    }

    // Callback für Export Button
    _onExportConfig() {
        this.animationHandler.exportConfig();
    }

    // Event Handler für Transform-Änderungen (Verschieben/Rotieren/Skalieren)
    // Wird aufgerufen, wenn der Nutzer ein Objekt mit dem Gizmo manipuliert.
    _onTransformChange() {
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
                    speedMultiplier: updatedItem.speedMultiplier,
                    start: updatedItem.start,
                    end: updatedItem.end
                });
            }
        }
    }
}
