export class EditorScenePanel {
    constructor(container, { scene, renderer, config }) {
        this.container = container;
        this.scene = scene;
        this.renderer = renderer;
        this.config = config;

        this.element = null;
        this.inputs = {};

        this._init();
    }

    _init() {
        this.element = document.createElement('div');
        this.element.className = 'editor-scene-panel';

        this.element.innerHTML = `
            <div class="editor-content">
                <h3 class="editor-title">Szenen Einstellungen</h3>

                <details class="editor-details" open>
                    <summary>Szene</summary>
                        <div class="editor-row">
                            <span class="editor-label">Hintergrund</span>
                            <div class="editor-input-group">
                                <input type="color" class="editor-input" id="scene-bg" />
                            </div>
                        </div>
                </details>

                <details class="editor-details" open>
                    <summary>Sun</summary>
                        <div class="editor-row">
                            <span class="editor-label">Farbe</span>
                            <div class="editor-input-group">
                                <input type="color" class="editor-input" id="scene-bg" />
                            </div>
                        </div>

                        <div class="editor-row">
                            <span class="editor-label">Stärke</span>
                            <div class="editor-input-group">
                                <input type="range" class="editor-input" id="scene-bg" />
                            </div>
                        </div>

                        <div class="editor-row">
                            <span class="editor-label">Position</span>
                            <div class="editor-input-group">
                                <input type="range" class="editor-input" id="scene-bg" />
                            </div>
                        </div>
                </details>
            </div>
        `;

        this.container.appendChild(this.element);

        this.inputs = {
            background: this.element.querySelector('#scene-bg'),
        };

        this.inputs.background.addEventListener('input', () => {
            this._onBackgroundChange();
        });

        this.update();
    }

    show() {
        this.element.classList.add('visible');
        this.update();
    }

    hide() {
        this.element.classList.remove('visible');
    }

    update() {
        const sceneConfig = this.config?.sceneConfig;
        if (!sceneConfig) return;

        if (typeof sceneConfig.backgroundColor === 'string') {
            this.inputs.background.value = sceneConfig.backgroundColor;
        }
    }

    _onBackgroundChange() {
        const sceneConfig = this.config?.sceneConfig;
        if (!sceneConfig) return;

        const color = this.inputs.background.value;
        sceneConfig.backgroundColor = color;
        this.scene?.background?.set(color);
    }
}
