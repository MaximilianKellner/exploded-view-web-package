/**
 * Lichter-Tab: Listet alle Lichter der Szene auf
 * Mit Suchfunktion und Einstellungsmöglichkeiten
 */
const iconSearchUrl = new URL('../../../assets/editor/search.svg', import.meta.url).href;
const iconAddUrl = new URL('../../../assets/editor/add.svg', import.meta.url).href;
const iconDownloadUrl = new URL('../../../assets/editor/download.svg', import.meta.url).href;

export class TabLichter {
    constructor({ scene, onLightSelect, onExportSceneConfig, onAddLight }) {
        this.scene = scene;
        this.onLightSelect = onLightSelect; // Callback wenn Licht ausgewählt
        this.onExportSceneConfig = onExportSceneConfig;
        this.onAddLight = onAddLight;

        this.element = null;
        this.searchInput = null;
        this.lightList = null;
        this.lightItems = {};
        this.filteredLights = [];
        this.allLights = [];

        this._onExternalLightSelected = this._onExternalLightSelected.bind(this);

        this._init();
        this._collectLights();
    }

    _init() {
        // Root Container
        this.element = document.createElement('div');
        this.element.className = 'tab-lichter-content';

        this.element.innerHTML = `
            <div class="tab-search-section">
                    <input type="text" class="tab-search-input" placeholder="Lichter durchsuchen" />

                    <button>
                        <img src="${iconSearchUrl}" class="tab-search-icon" alt="Suche" />
                    </button>
            </div>
            <div class="tab-list-section">
                <ul class="tab-light-list"></ul>
            </div>
            <div class="tab-footer">
                <button class="editor-btn" id="add-light-btn">
                    <img src="${iconAddUrl}" alt="add light icon" />
                    Licht
                </button>

                <button class="editor-btn blue" id="export-lights-btn">
                    <img src="${iconDownloadUrl}" alt="download icon" />
                    scene-config
                </button>
            </div>
        `;

        // Referenzen
        this.searchInput = this.element.querySelector('.tab-search-input');
        this.lightList = this.element.querySelector('.tab-light-list');
        const exportBtn = this.element.querySelector('#export-lights-btn');
        const addBtn = this.element.querySelector('#add-light-btn');

        // Event Listener für Suche
        this.searchInput.addEventListener('input', (e) => this._filterLights(e.target.value));

        // Export Button
        exportBtn.addEventListener('click', () => {
            if (this.onExportSceneConfig) {
                this.onExportSceneConfig();
            }
        });

        // Add Button
        addBtn.addEventListener('click', () => {
            if (this.onAddLight) {
                this.onAddLight();
            }
        });

        // Externe Selektion aus der 3D-Ansicht spiegeln
        window.addEventListener('ev:lightSelected', this._onExternalLightSelected);
    }

    // Sammelt alle Lichter aus der Szene
    _collectLights() {
        this.allLights = [];
        this.scene.traverse((node) => {
            if (node.isLight) {
                this.allLights.push(node);
            }
        });
        this._renderList(this.allLights);
    }

    // Filtert die Lichtliste nach Suchtext
    _filterLights(searchText) {
        const text = searchText.toLowerCase();
        this.filteredLights = this.allLights.filter(light => 
            (light.name && light.name.toLowerCase().includes(text)) ||
            light.constructor.name.toLowerCase().includes(text)
        );
        this._renderList(this.filteredLights);
    }

    //Rendert die Lichtliste
    _renderList(lights) {
        this.lightList.innerHTML = '';
        this.lightItems = {};

        if (lights.length === 0) {
            this.lightList.innerHTML = '<li class="tab-list-empty">Keine Lichter gefunden</li>';
            return;
        }

        lights.forEach((light) => {
            const li = document.createElement('li');
            li.className = 'tab-list-item';

            const lightType = light.constructor.name;
            const intensity = (light.intensity ?? 1).toFixed(2);
            const color = light.color ? '#' + light.color.getHexString() : '#ffffff';
            const isEnabled = light.visible !== false;

            if (!isEnabled) {
                li.classList.add('light-disabled');
            }

            li.innerHTML = `
                <div class="light-item-content">
                    <div class="light-item-header">
                        <span class="item-name">${light.name || '(Unnamed)'}</span>
                        <span class="item-type">${lightType}</span>
                    </div>
                    <div class="light-item-details">
                        <span class="light-color" style="background-color: ${color}"></span>
                        <span class="light-intensity">Intensität: ${intensity}</span>
                    </div>
                </div>
            `;

            li.addEventListener('click', () => {
                this._selectLight(light, li);
            });

            this.lightList.appendChild(li);
            this.lightItems[light.name || light.uuid] = li;
        });
    }

    // Aktualisiert Live-Daten (Farbe/Intensität/Aktiv) in der Liste
    updateLightItem(light) {
        if (!light) return;

        const key = light.name || light.uuid;
        const listItem = this.lightItems[key];
        if (!listItem) return;

        const intensityEl = listItem.querySelector('.light-intensity');
        const colorEl = listItem.querySelector('.light-color');
        const typeEl = listItem.querySelector('.item-type');

        if (intensityEl) {
            const intensity = (light.intensity ?? 1).toFixed(2);
            intensityEl.textContent = `Intensität: ${intensity}`;
        }

        if (colorEl && light.color) {
            colorEl.style.backgroundColor = `#${light.color.getHexString()}`;
        }

        if (typeEl) {
            typeEl.textContent = light.constructor?.name || 'Light';
        }

        const isEnabled = light.visible !== false;
        listItem.classList.toggle('light-disabled', !isEnabled);
    }

    //Selektiert ein Licht und triggert Callback
    _selectLight(light, listItem) {
        // Highlight entfernen
        this._clearActiveSelection();

        // Neues Item hervorheben
        listItem.classList.add('active');

        // Event dispatchen damit EditorController die Koordination übernehmen kann
        // Quelle der Selektion markieren (UI)
        window.dispatchEvent(new CustomEvent('ev:lightSelected', { 
            detail: { 
                light: light,
                source: 'ui'
            } 
        }));
    }

    _onExternalLightSelected(event) {
        // Nur 3D-Clicks sollen die UI steuern
        if (event?.detail?.source !== 'click-handler') return;
        const light = event.detail.light;
        if (!light) return;

        this._setActiveByLight(light);
    }

    _setActiveByLight(light) {
        const key = light.name || light.uuid;
        const listItem = this.lightItems[key];
        if (!listItem) return;

        this._clearActiveSelection();
        listItem.classList.add('active');
    }

    _clearActiveSelection() {
        Object.values(this.lightItems).forEach(item => {
            item.classList.remove('active');
        });
    }

    setActiveByLight(light) {
        this._setActiveByLight(light);
    }

    clearSelection() {
        this._clearActiveSelection();
    }

    // Gibt das Root-Element zurück
    getElement() {
        return this.element;
    }



    // Aktualisiert die Lichtliste
    refresh() {
        this._collectLights();
        this.searchInput.value = '';
    }
}
