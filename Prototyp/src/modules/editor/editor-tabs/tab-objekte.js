/**
 * Objekte-Tab: Listet alle Objekte der Szene auf
 * Mit Suchfunktion und Möglichkeit zur Auswahl/Bearbeitung
 * Nutzt das gleiche Event System wie der ClickHandler zur Auswahl und Vorschau
 */
const iconSearchUrl = new URL('../../../assets/editor/search.svg', import.meta.url).href;
const iconDownloadUrl = new URL('../../../assets/editor/download.svg', import.meta.url).href;
const iconAnimatedUrl = new URL('../../../assets/editor/animated.svg', import.meta.url).href;

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
                        <img src="${iconSearchUrl}" class="tab-search-icon" alt="Suche" />
                    </button>
            </div>
            <div class="tab-list-section">
                <ul class="tab-object-list"></ul>
            </div>
            <div class="tab-footer">
                <button class="editor-btn blue" id="export-exp-config-btn">
                    <img src="${iconDownloadUrl}" alt="download icon" />        
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

        if (objects.length === 0) {
            this.objectList.innerHTML = '<li class="tab-list-empty">Keine Objekte gefunden</li>';
            return;
        }

        objects.forEach((obj) => {
            const li = document.createElement('li');
            li.className = 'tab-list-item';
            
            // Prüfen, ob das Objekt animiert ist
            const isAnimated = this._isObjectAnimated(obj);
            const animatedIconHTML = isAnimated 
                ? `<img src="${iconAnimatedUrl}" alt="animated icon" />` 
                : '';
            
            li.innerHTML = `
                <span class="item-name">${obj.name}</span>
                ${animatedIconHTML}
            `;

            li.addEventListener('click', () => {
                this._selectObject(obj, li);
            });

            this.objectList.appendChild(li);
            this.objectItems[obj.name] = li;
        });
    }

    // Prüft, ob ein Objekt in den explodableObjects/eine Animation hat
    _isObjectAnimated(object) {
        if (!this.animationHandler?.explodableObjects) {
            return false;
        }
        
        return this.animationHandler.explodableObjects.some(
            explodable => explodable.object.uuid === object.uuid
        );
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

    // Aktualisirrt das animated icon eines spezifischen Objekts --> performanter als kompletter refresh
    updateObjectIcon(objectName) {
        const listItem = this.objectItems[objectName];
        if (!listItem) return;
        
        const object = this.allObjects.find(obj => obj.name === objectName);
        if (!object) return;
        
        const isAnimated = this._isObjectAnimated(object);
        const animatedIconHTML = isAnimated 
            ? `<img src="${iconAnimatedUrl}" alt="animated icon" />` 
            : '';
        
        listItem.innerHTML = `
            <span class="item-name">${objectName}</span>
            ${animatedIconHTML}
        `;
        
        // Event Listener neu binden, da innerHTML überschrieben wurde
        listItem.addEventListener('click', () => {
            this._selectObject(object, listItem);
        });
    }
}
