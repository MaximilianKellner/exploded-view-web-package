import '../../css/editor-sidebar-panel.css';
import '../../css/editor-tabs.css';
import { TabScene } from './editor-tabs/tab-szene.js';
import { TabObjekte } from './editor-tabs/tab-objekte.js';
import { TabLichter } from './editor-tabs/tab-lichter.js';

export class EditorSidebarPanel {
    constructor(container, { scene, renderer, config, animationHandler, onLightSelect } = {}) {
        this.container = container;
        this.scene = scene;
        this.renderer = renderer;
        this.config = config;
        this.animationHandler = animationHandler;
        this.onLightSelect = onLightSelect;

        this.sidebarContent = null;
        this.tabButtons = {};
        this.tabContents = {};
        this.tabs = {}; // Speichert Tab-Komponenten
        this.activeTab = 'scene';
        this.einklappenBtn = null;

        this._init();
    }

    _init() {
        // Sidebar Content Container
        this.sidebarContent = document.createElement('div');
        this.sidebarContent.className = 'editor-sidebar-panel';
        
        const sidebarHeader = document.createElement('div');
        sidebarHeader.className = 'editor-sidebar-header';
        sidebarHeader.id = 'editor-sidebar-header';
        sidebarHeader.innerHTML = `
            <img src="../logo-block.svg" alt="Logo">
            <button class="einklappen-btn" id="einklappen-sidebar">
                <img src="/icon/editor/einklappen.svg" alt="Logo">
            </button>
        `;
        
        this.sidebarContent.appendChild(sidebarHeader);
        
        // Tab-Navigationssystem
        const tabNav = document.createElement('div');
        tabNav.className = 'editor-sidebar-tabs';
        
        const tabs = ['scene', 'objects', 'lights'];
        const tabLabels = {
            scene: 'Szene',
            objects: 'Objekte',
            lights: 'Lichter'
        };
        
        // Tab-Buttons erstellen
        tabs.forEach(tabId => {
            const button = document.createElement('button');
            button.className = `editor-sidebar-tab-btn ${tabId === 'scene' ? 'active' : ''}`;
            button.textContent = tabLabels[tabId];
            button.dataset.tab = tabId;
            button.addEventListener('click', () => this._switchTab(tabId));
            
            this.tabButtons[tabId] = button;
            tabNav.appendChild(button);
        });
        
        // Tab-Inhalts-Container erstellen
        const tabContentsContainer = document.createElement('div');
        tabContentsContainer.className = 'editor-sidebar-tab-contents';
        
        // Tab-Komponenten initialisieren und einhängen
        tabs.forEach(tabId => {
            const content = document.createElement('div');
            content.className = `editor-sidebar-tab-content ${tabId === 'scene' ? 'active' : ''}`;
            content.dataset.tab = tabId;
            
            // Entsprechende Tab-Komponente erstellen
            if (tabId === 'scene') {
                this.tabs.scene = new TabScene({
                    scene: this.scene,
                    renderer: this.renderer,
                    config: this.config
                });
                content.appendChild(this.tabs.scene.getElement());
            } else if (tabId === 'objects') {
                this.tabs.objects = new TabObjekte({
                    scene: this.scene,
                    animationHandler: this.animationHandler
                });
                content.appendChild(this.tabs.objects.getElement());
            } else if (tabId === 'lights') {
                this.tabs.lights = new TabLichter({
                    scene: this.scene,
                    onLightSelect: this.onLightSelect
                });
                content.appendChild(this.tabs.lights.getElement());
            }
            
            this.tabContents[tabId] = content;
            tabContentsContainer.appendChild(content);
        });
        
        // Struktur zusammenbauen
        this.sidebarContent.appendChild(tabNav);
        this.sidebarContent.appendChild(tabContentsContainer);
        
        this.container.appendChild(this.sidebarContent);
        
        // DOM-Elemente cachen und Einklappen-Button initialisieren
        this._cacheDOMElements();
        this._initEinklappenButton();
    }

    _switchTab(tabId) {
        if (this.activeTab === tabId) return;
        
        // Alten Tab deaktivieren
        this.tabButtons[this.activeTab].classList.remove('active');
        this.tabContents[this.activeTab].classList.remove('active');
        
        // Neuen Tab aktivieren
        this.activeTab = tabId;
        this.tabButtons[tabId].classList.add('active');
        this.tabContents[tabId].classList.add('active');
    }

    _cacheDOMElements() {
        this.einklappenBtn = this.sidebarContent.querySelector('#einklappen-sidebar');
    }

    _initEinklappenButton() {
        if (this.einklappenBtn) {
            this.einklappenBtn.addEventListener('click', () => {
                this.sidebarContent.classList.toggle('eingeklappt');
                this.einklappenBtn.classList.toggle('eingeklappt');
            });
        }
    }

    //Setzt den Inhalt eines Tabs (wird vom Benutzer aufgerufen)
    setTabContent(tabId, content) {
        if (!this.tabContents[tabId]) return;
        
        // Placeholder entfernen und neuen Inhalt setzen
        this.tabContents[tabId].innerHTML = '';
        this.tabContents[tabId].appendChild(content);
    }

    // Gibt eine Tab-Komponente zurück (z. B. TabScene, TabObjekte, TabLichter)
    getTab(tabId) {
        return this.tabs[tabId] || null;
    }

    // Zeigt die Sidebar an
    show() {
        this.sidebarContent.style.display = 'flex';
    }

    // Versteckt die Sidebar
    hide() {
        this.sidebarContent.style.display = 'none';
    }

    // Gibt den Content Container eines Tabs zurück
    getTabContentContainer(tabId) {
        return this.tabContents[tabId];
    }
}
