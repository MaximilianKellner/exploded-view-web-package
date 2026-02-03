/**
 * Objekte-Tab: Listet alle Objekte der Szene auf
 * Mit Suchfunktion und Möglichkeit zur Auswahl/Bearbeitung
 * Nutzt das gleiche Event System wie der ClickHandler zur Auswahl und Vorschau
 */
export class TabObjekte {
    constructor({ scene, animationHandler }) {
        this.scene = scene;
        this.animationHandler = animationHandler;

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
                    <input type="text" class="tab-search-input" placeholder="Objekte durchsuchen" />

                    <button>
                        <img src="../icon/editor/search.svg" class="tab-search-icon" alt="Suche" />
                    </button>
            </div>
            <div class="tab-list-section">
                <ul class="tab-object-list"></ul>
            </div>
            <div class="tab-footer">
                <button class="editor-btn blue" id="export-exp-config-btn">
                    <img src="../icon/editor/download.svg" alt="download icon" />        
                    exp-config
                </button>
            </div>
        `;

        // Referenzen
        this.searchInput = this.element.querySelector('.tab-search-input');
        this.objectList = this.element.querySelector('.tab-object-list');
        const exportBtn = this.element.querySelector('#export-exp-config-btn');

        // Event Listener für Suche
        this.searchInput.addEventListener('input', (e) => this._filterObjects(e.target.value));

        // Export Button
        exportBtn.addEventListener('click', () => {
            if (this.animationHandler?.exportConfig) {
                this.animationHandler.exportConfig();
            }
        });
    }

    //Sammelt alle animierbaren Objekte (model.children) --> explodableObjects und potenzielle explodableObjects
    _collectObjects() {
        this.allObjects = [];
        
        // Findet das root Modell --> normalerweise das erste Group-Objekt in der Scene
        let modelRoot = null;
        for (let child of this.scene.children) {
            if (child.isGroup || (child.isMesh && child.children.length > 0)) {
                modelRoot = child;
                break;
            }
        }
        
        // Sammle alle children des Modells
        if (modelRoot && modelRoot.children.length > 0) {
            this.allObjects = Array.from(modelRoot.children).filter(child => 
                child.name && !child.name.startsWith('_')
            );
        }
        
        this._renderList(this.allObjects);
    }

    // Filtert die Objektliste nach Suchtext
    _filterObjects(searchText) {
        const text = searchText.toLowerCase();
        this.filteredObjects = this.allObjects.filter(obj => 
            obj.name.toLowerCase().includes(text)
        );
        this._renderList(this.filteredObjects);
    }

    //Rendert die Objektliste
    _renderList(objects) {
        this.objectList.innerHTML = '';
        this.objectItems = {};

        objects.forEach((obj) => {
            const li = document.createElement('li');
            li.className = 'tab-list-item';
            li.innerHTML = `
                <span class="item-name">${obj.name}</span>
            `;

            li.addEventListener('click', () => {
                this._selectObject(obj, li);
            });

            this.objectList.appendChild(li);
            this.objectItems[obj.name] = li;
        });
    }

    // Selektiert ein Objekt und dispatcht Custom Event (wie ClickHandler)
    _selectObject(object, listItem) {
        // Highlight entfernen
        Object.values(this.objectItems).forEach(item => {
            item.classList.remove('active');
        });

        // Neues Item hervorheben
        listItem.classList.add('active');

        // Custom Event dispatchen (nutzt die bestehende Logik vom ClickHandler)
        window.dispatchEvent(new CustomEvent('ev:objectSelected', { 
            detail: { 
                object: object,
                UUID: object.uuid,
                position: object.position.clone(),
                isMultiSelect: false
            } 
        }));
    }

    // Gibt das Root-Element zurück
    getElement() {
        return this.element;
    }

    // Aktualisiert die Objektliste
    refresh() {
        this._collectObjects();
        this.searchInput.value = '';
    }
}
