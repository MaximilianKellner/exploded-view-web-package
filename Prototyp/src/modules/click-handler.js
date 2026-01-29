import * as THREE from 'three';

/**
 * Verwaltet die Logik zum öffnen und schließen der Beschriftungselemente. Über einen Raycaster werden die geklickten objekte festgestellt
 * und das entsprechende Infoelement wird geöffnet
 */

export class ClickHandler {
    constructor(camera, scene, infoElementHandler, renderer, highlightHandler) {
        this.camera = camera;
        this.scene = scene;
        this.infoElementHandler = infoElementHandler;
        this.renderer = renderer;
        this.highlightHandler = highlightHandler;
        this.transformHandler = null;

        this.lastHighlightedObject = null;
        this.lastSelectedObject = null; // Für Edit-Mode
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.editMode = false;

        // 'this'-Kontext wird an den ClickHandler gebunden. (bei click wird nicht auf window.<> verwiesen sondern auf Clickhandler.camera, .raycaster usw.)
        this._onObjectClick = this._onObjectClick.bind(this);
    }

    initialize() {
        window.addEventListener('click', this._onObjectClick);
    }

    // --- Verarbeitung vom click Event ---
    _onObjectClick(event) {
        // Klick ignorieren wenn gerade mit TransformControls gedragged wurde
        if (this.transformHandler?.preventNextClick) {
            return;
        }

        // Die Bounding Box des Canvas-Elements abrufen
        const rect = this.renderer.domElement.getBoundingClientRect();

        // 1. Mausposition normalisieren (-1 bis +1) --> Raycaster verwendet -1 bis +1 pro achse, Mittelpunkt ist (0,0) basierend auf dem canvas
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        // 2. Raycaster mit Kamera und Mausposition aktualisieren
        this.raycaster.setFromCamera(this.mouse, this.camera);

        // 3. Schnittpunkte mit den Objekten in der Szene berechnen
        let intersects = this.raycaster.intersectObjects(this.scene.children, true);

        // 4. Filtern von helper Elementen
        const filteredIntersects = this._filterHelperElements(intersects);

        intersects = filteredIntersects;

        if (intersects.length > 0) {
            const clickedObject = intersects[0].object;
            console.log('Objekt geklickt:', clickedObject.name);

            let topLevelObject = this._findTopLevelObject(clickedObject);

            // === EDIT MODE ===
            if (this.editMode) {
                // Beim 2. Klick auf das gleiche Objekt wird die Selektion aufgehoben
                if (this.lastSelectedObject && topLevelObject === this.lastSelectedObject) {
                    window.dispatchEvent(new CustomEvent('ev:objectDeselected', {
                        detail: {
                            object: topLevelObject,
                            UUID: topLevelObject.uuid
                        }
                    }));
                    this.lastSelectedObject = null;
                    return;
                }

                // Im Edit-Mode: Objekt selektieren statt InfoElement öffnen
                this._handleEditorClick(topLevelObject, event);
                return;
            }


            // === VIEWER MODE ===
            //console.log(this.lastHighlightedObject)

            // Beim 2. Klick auf ein Objekt wird der zustand wieder zurückgesetzt
            if( this.lastHighlightedObject && topLevelObject === this.lastHighlightedObject) {
                if (this.infoElementHandler) {
                    this.infoElementHandler.close();
                    this.lastHighlightedObject = null;
                }
                return;
            }

            // 5. Den infoElementHandler mit dem geklickten Objekt aufrufen
            if (this.infoElementHandler) {
                this.lastHighlightedObject = topLevelObject;
                this.infoElementHandler.open(topLevelObject);
            }
            
            if (this.highlightHandler) {
                this.highlightHandler.highlightClickedComponent(topLevelObject, this.infoElementHandler);
            }
        }
    }

    // Helperelemente, wie das Koordinatensystem werden von klicks ausgeschlossen. Diese Methode würde auch andere Helper abfangen
    _filterHelperElements(elements){
        return elements.filter(element => {
            const obj = element.object;

            // Markierte Helfer (z.B. TransformControls, Koordinatensystem) und Nicht-Meshes ignorieren
            if (obj.userData?.nonSelectable) return false;
            if (!obj.isMesh) return false;

            return !(obj instanceof THREE.AxesHelper || 
                obj instanceof THREE.GridHelper || (obj.parent && obj.parent.name === 'Coordinatesystem'));
        });
    }

    // Das Parent Objekt wird gefunden. dies ist wichig um die richige Beschrifung zu finden.
    _findTopLevelObject(clickedObject){
        while (clickedObject.parent && clickedObject.parent.parent.type !== "Scene") {
            clickedObject = clickedObject.parent;
            console.log('topLevelObject:', clickedObject.name);
        }

        const topLevelObject = clickedObject
        return topLevelObject
    }

    // --- Editor-Mode Click-Handler ---
    _handleEditorClick(object, event) {
        const isMultiSelect = event.ctrlKey || event.metaKey; // Ctrl/Cmd für Multi-Selection
        
        // Custom Event für Editor dispatchen
        window.dispatchEvent(new CustomEvent('ev:objectSelected', { 
            detail: { 
                object: object,
                UUID: object.uuid,
                position: object.position.clone(),  // Vektor
                isMultiSelect: isMultiSelect
            } 
        }));

        this.lastSelectedObject = object;
        console.log('Editor: Objekt selektiert:', object.name, 'Multi:', isMultiSelect);
    }

    // --- Editor-Mode Umschalten ---
    setEditMode(enabled) {
        this.editMode = enabled;
        
        // Beim Umschalten zurücksetzen
        if (enabled) {
            // InfoElemente schließen
            this.infoElementHandler.close();
            this.lastHighlightedObject = null;
        } else {
            // Edit-Mode deaktivieren - Selection zurücksetzen
            this.lastSelectedObject = null;
        }
    }

    setTransformHandler(transformHandler) {
        this.transformHandler = transformHandler;
    }

    destroy() {
        // Event-Listener entfernen
        window.removeEventListener('click', this._onObjectClick);
        if (this._cardClosedListener) {
            window.removeEventListener('cardClosed', this._cardClosedListener);
            this._cardClosedListener = null;
        }

        // Speicher freigeben
        this.infoElementHandler = null;
        this.renderer = null;
        this.raycaster = null;
        this.mouse = null;
        this.scene = null;
        this.camera = null;
    }
}