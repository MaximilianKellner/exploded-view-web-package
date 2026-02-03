/**
 * Objekte-Tab: Listet alle Objekte der Szene auf
 * Mit Suchfunktion und Möglichkeit zur Auswahl/Bearbeitung
 */
export class TabObjekte {
    constructor({ scene, animationHandler, onObjectSelect }) {
        this.scene = scene;
        this.animationHandler = animationHandler;
        this.onObjectSelect = onObjectSelect; // Callback wenn Objekt ausgewählt

        this.element = null;
        this.searchInput = null;
        this.objectList = null;
        this.objectItems = {};
        this.filteredObjects = [];
        this.allObjects = [];

        this._init();
        this._collectObjects();
    }

    _init() {
        // Root Container
        this.element = document.createElement('div');
        this.element.className = 'tab-objekte-content';

        this.element.innerHTML = `
            <div class="tab-search-section">
                <input type="text" class="tab-search-input" placeholder="Objekte durchsuchen..." />
            </div>
            <div class="tab-list-section">
                <ul class="tab-object-list"></ul>
            </div>
            <div class="tab-footer">
                <button class="editor-btn blue" id="export-config-btn">Config herunterladen</button>
            </div>
        `;

        // Referenzen
        this.searchInput = this.element.querySelector('.tab-search-input');
        this.objectList = this.element.querySelector('.tab-object-list');
        const exportBtn = this.element.querySelector('#export-config-btn');

        // Event Listener für Suche
        this.searchInput.addEventListener('input', (e) => this._filterObjects(e.target.value));

        // Export Button
        exportBtn.addEventListener('click', () => {
            if (this.animationHandler?.exportConfig) {
                this.animationHandler.exportConfig();
            }
        });
    }

    /**
     * Sammelt alle Mesh-Objekte aus der Szene
     */
    _collectObjects() {
        this.allObjects = [];
        this.scene.traverse((node) => {
            // Nur Meshes mit Namen erfassen
            if (node.isMesh && node.name && !node.name.startsWith('_')) {
                this.allObjects.push(node);
            }
        });
        this._renderList(this.allObjects);
    }

    /**
     * Filtert die Objektliste nach Suchtext
     */
    _filterObjects(searchText) {
        const text = searchText.toLowerCase();
        this.filteredObjects = this.allObjects.filter(obj => 
            obj.name.toLowerCase().includes(text)
        );
        this._renderList(this.filteredObjects);
    }

    /**
     * Rendert die Objektliste
     */
    _renderList(objects) {
        this.objectList.innerHTML = '';
        this.objectItems = {};

        objects.forEach((obj) => {
            const li = document.createElement('li');
            li.className = 'tab-list-item';
            li.innerHTML = `
                <span class="item-name">${obj.name}</span>
                <span class="item-info">${obj.geometry?.type || 'Mesh'}</span>
            `;

            li.addEventListener('click', () => {
                this._selectObject(obj, li);
            });

            this.objectList.appendChild(li);
            this.objectItems[obj.name] = li;
        });
    }

    /**
     * Selektiert ein Objekt und triggert Callback
     */
    _selectObject(object, listItem) {
        // Highlight entfernen
        Object.values(this.objectItems).forEach(item => {
            item.classList.remove('active');
        });

        // Neues Item hervorheben
        listItem.classList.add('active');

        // Callback aufrufen (EditorController kümmert sich um Gizmo etc.)
        if (this.onObjectSelect) {
            this.onObjectSelect(object);
        }
    }

    /**
     * Gibt das Root-Element zurück
     */
    getElement() {
        return this.element;
    }

    /**
     * Aktualisiert die Objektliste (z. B. wenn neue Objekte hinzugefügt)
     */
    refresh() {
        this._collectObjects();
        this.searchInput.value = '';
    }
}
