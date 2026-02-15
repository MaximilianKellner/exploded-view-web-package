import * as THREE from 'three';
import { EditorPanel } from './editor-anim-panel.js';
import { EditorTimeline } from './editor-timeline.js';

export class EditorAnimationController {
    constructor({ scene, renderer, config, animationHandler, explosionConfigPath, clickHandler }) {
        this.scene = scene;
        this.renderer = renderer;
        this.config = config;
        this.animationHandler = animationHandler;
        this.explosionConfigPath = explosionConfigPath;
        this.clickHandler = clickHandler;

        this.enabled = false;
        this.transformHandler = null;
        this.selectedObject = null;
        this.previewObject = null;
        
        this.sidebarCallbacks = {
            onUpdateIcon: () => {}
        };

        // Event binding
        this._onPanelChange = this._onPanelChange.bind(this);
        this._onExportConfig = this._onExportConfig.bind(this);
        this._onDeleteAnimation = this._onDeleteAnimation.bind(this);
        this._onKeyframeChange = this._onKeyframeChange.bind(this);

        // Editor Panel initialisieren
        const container = this.renderer.domElement.parentElement;
        this.editorPanel = new EditorPanel(container);
        this.editorPanel.setCallbacks({
            onChange: this._onPanelChange,
            onExport: this._onExportConfig,
            onDelete: this._onDeleteAnimation
        });

        // Editor Timeline initialisieren
        this.editorTimeline = new EditorTimeline(container, animationHandler, this.explosionConfigPath);
        this.editorTimeline.hide(); // Initial versteckt
        
        // Keyframe-Callbacks registrieren (Timeline <-> EditorPanel Synchronisation)
        this.editorTimeline.setKeyframeCallbacks({
            onKeyframeChange: this._onKeyframeChange
        });
    }

    setSidebarCallbacks(callbacks) {
        this.sidebarCallbacks = { ...this.sidebarCallbacks, ...callbacks };
    }

    setTransformHandler(handler) {
        this.transformHandler = handler;
    }

    enable() {
        this.enabled = true;
        this.editorTimeline.show();
    }

    disable() {
        this.enabled = false;
        this.editorTimeline.hide();
        this.deselectObject();
    }

    //Wählt ein Objekt für die Bearbeitung aus
    selectObject(object) {
        if (this.selectedObject === object) return;
        
        // Vorherige Selektion aufheben
        this.deselectObject();

        this.selectedObject = object;

        // PreviewObject erstellen und Gizmo anhängen
        this._createPreviewObject(object);
        
        if (this.transformHandler) {
            this.transformHandler.setMode('translate');
            this.transformHandler.controls?.setSpace('world');
        }
        
        // Panel anzeigen und mit Daten füllen
        let item = this.animationHandler.getExplodableItem(object);

        // Wenn keine Config existiert, Standardwerte verwenden und Config erstellen
        if (!item) {
            // Standard: Keine Verschiebung (targetLevel 0) --> Springen bug
            const defaultConfig = {
                expDirection: new THREE.Vector3(0, 1, 0),
                targetLevel: 0, 
                rotation: new THREE.Vector3(0, 0, 0),
                start: 0,
                end: 1
            };
            
            // Neue Config im AnimationHandler erstellen
            this.animationHandler.updateObjectConfig(object, defaultConfig);
            item = this.animationHandler.getExplodableItem(object);
            
            // Timeline aktualisieren - objectCount und ggf. neue Items hinzufügen
            this.editorTimeline.updateObjectCount();
            
            // Callback für Icon-Update aufrufen
            if (this.sidebarCallbacks.onUpdateIcon) {
                this.sidebarCallbacks.onUpdateIcon(object.name);
            }
        }
        
        // Panel mit Daten anzeigen
        if (item) {
            this.editorPanel.show({
                name: object.name,
                expDirection: item.expDirection,
                targetLevel: item.targetLevel,
                rotation: item.rotation,
                start: item.start,
                end: item.end
            });
        }
    }

    deselectObject() {
        if (this.selectedObject) {
            this.transformHandler?.detach();
            this._removePreviewObject();
            this.selectedObject = null;
            this.editorPanel.hide();
        }
    }

    // Aaufruf durch transoform gizmo interaktion, aktuallisiert AnimationHandler und Panel
    updateFromTransform() {
        if (!this.previewObject || !this.selectedObject || !this.animationHandler) return;

        const item = this.animationHandler.getExplodableItem(this.selectedObject);
        if (!item) return;

        // Vektor von Start (Original) zu PreviewObject berechnen
        const vector = new THREE.Vector3().subVectors(this.previewObject.position, item.originalPosition);
        
        const distance = vector.length();
        const layerDist = this.config.animationConfig.layerDistance || 1;
        
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
                rotation: updatedItem.rotation,
                start: updatedItem.start,
                end: updatedItem.end
            });
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
            this._updatePreviewTransform(item, 1);
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

    // Aktualisiert Position und Rotation des Preview-Objekts basierend auf Item und Progress
    _updatePreviewTransform(item, progress = 1) {
        if (!this.previewObject || !item) return;

        const transform = this.animationHandler.calculateItemTransform(item, progress);
        if (transform) {
            this.previewObject.position.copy(transform.position);
            this.previewObject.quaternion.copy(transform.quaternion);
        }
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

    // Callback wenn Werte im Panel geändert werden
    _onPanelChange(data) {
        if (!this.selectedObject || !this.previewObject) return;

        // AnimationHandler updaten (alle Werte)
        this.animationHandler.updateObjectConfig(this.selectedObject, data);

        // PreviewObject Transformation aktualisieren
        const item = this.animationHandler.getExplodableItem(this.selectedObject);
        if (item) {
            this._updatePreviewTransform(item, 1);
        }
        
        // Timeline aktualisieren wenn start/end geändert wurden
        if (data.start !== undefined || data.end !== undefined) {
            const startPercent = this.editorTimeline.dataManager?.normalizedToPercent(data.start);
            const endPercent = this.editorTimeline.dataManager?.normalizedToPercent(data.end);
            
            if (startPercent !== undefined && endPercent !== undefined) {
                const keyframeController = this.editorTimeline.keyframeController;
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

    // Callback für Delete Button
    _onDeleteAnimation() {
        if (!this.selectedObject) return;

        const objectName = this.selectedObject.name; // Name speichern für Icon Update
        
        // Animation im AnimationHandler löschen
        this.animationHandler.deleteAnimation(this.selectedObject);

        // Panel ausblenden
        this.editorPanel.hide();

        // Preview-Objekt und Gizmo entfernen
        this.transformHandler?.detach();
        this._removePreviewObject();

        // Callback für Icon-Update aufrufen
        if (this.sidebarCallbacks.onUpdateIcon) {
            this.sidebarCallbacks.onUpdateIcon(objectName);
        }

        // Timeline aktualisieren - Keyframe entfernen
        this.editorTimeline.updateObjectCount();

        // Selektion im ClickHandler zurücksetzen, damit das Objekt sofort wieder wählbar ist
        if (this.clickHandler) {
            this.clickHandler.clearSelectedObject(this.selectedObject);
        }

        // Selektion zurücksetzen
        this.selectedObject = null;
        
        console.log('Animation gelöscht und UI aktualisiert');
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
}
