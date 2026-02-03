/**
 * Lichter-Tab: Listet alle Lichter der Szene auf
 * Mit Suchfunktion und Einstellungsmöglichkeiten
 */
export class TabLichter {
    constructor({ scene, onLightSelect }) {
        this.scene = scene;
        this.onLightSelect = onLightSelect; // Callback wenn Licht ausgewählt

        this.element = null;
        this.searchInput = null;
        this.lightList = null;
        this.lightItems = {};
        this.filteredLights = [];
        this.allLights = [];

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
                        <img src="../icon/editor/search.svg" class="tab-search-icon" alt="Suche" />
                    </button>
            </div>
            <div class="tab-list-section">
                <ul class="tab-light-list"></ul>
            </div>
            <div class="tab-footer">
                <button class="editor-btn blue" id="export-lights-btn">scene-config exportieren</button>
            </div>
        `;

        // Referenzen
        this.searchInput = this.element.querySelector('.tab-search-input');
        this.lightList = this.element.querySelector('.tab-light-list');
        const exportBtn = this.element.querySelector('#export-lights-btn');

        // Event Listener für Suche
        this.searchInput.addEventListener('input', (e) => this._filterLights(e.target.value));

        // Export Button
        exportBtn.addEventListener('click', () => {
            this._exportLights();
        });
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

    //Selektiert ein Licht und triggert Callback
    _selectLight(light, listItem) {
        // Highlight entfernen
        Object.values(this.lightItems).forEach(item => {
            item.classList.remove('active');
        });

        // Neues Item hervorheben
        listItem.classList.add('active');

        // Callback aufrufen
        if (this.onLightSelect) {
            this.onLightSelect(light);
        }
    }

    // Gibt das Root-Element zurück
    getElement() {
        return this.element;
    }

    // Exportiert die Lichter-Konfiguration
    _exportLights() {
        const lightsConfig = this.allLights.map(light => ({
            name: light.name,
            type: light.constructor.name,
            color: light.color ? light.color.getHexString() : '#ffffff',
            intensity: light.intensity ?? 1,
            position: light.position ? { x: light.position.x, y: light.position.y, z: light.position.z } : null,
            target: light.target ? { x: light.target.position.x, y: light.target.position.y, z: light.target.position.z } : null,
        }));

        const json = JSON.stringify(lightsConfig, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `lights-config-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    // Aktualisiert die Lichtliste
    refresh() {
        this._collectLights();
        this.searchInput.value = '';
    }
}
