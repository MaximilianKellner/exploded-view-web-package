import * as THREE from 'three';
import '../../css/editor-components.css';

export class EditorPanel {
    constructor(container) {
        this.container = container;
        this.element = null;
        this.inputs = {};
        this.callbacks = {};
        
        this._init();
    }

    _init() {
        this.element = document.createElement('div');
        this.element.className = 'editor-anim-panel';



        this.element.innerHTML = `
            <div class="editor-content">
                <h3 id="editor-title">No Selection</h3>
                
                <div class="editor-row">
                    <span class="editor-label">Vector</span>
                    <div class="editor-value-display" id="vector-display">0.00 | 0.00 | 0.00</div>
                </div>

                <div class="editor-row">
                    <span class="editor-label">Richtung</span>
                    <div class="editor-input-group">
                        <input type="number" step="0.1" class="editor-input editor-vector-input" id="dir-x" placeholder="X">
                        <span class="vertical-divider"></span>
                        <input type="number" step="0.1" class="editor-input editor-vector-input" id="dir-y" placeholder="Y">
                        <span class="vertical-divider"></span>
                        <input type="number" step="0.1" class="editor-input editor-vector-input" id="dir-z" placeholder="Z">
                    </div>
                </div>

                <div class="editor-row">
                    <span class="editor-label">Ebene</span>
                    <div class="editor-input-group">
                        <input type="number" step="0.1" class="editor-input" id="layer">
                    </div>
                </div>

                <div class="editor-row">
                    <span class="editor-label">Start</span>
                    <div class="editor-input-group">
                        <input type="number" class="editor-input" step="0.01" id="start">
                    </div>
                </div>

                <div class="editor-row">
                    <span class="editor-label">Ende</span>
                    <div class="editor-input-group">
                        <input type="number" class="editor-input" step="0.01" id="end">
                    </div>
                </div>
            </div>

            <div class="editor-actions">
                <button class="editor-btn" id="btn-reset">TODO Reset</button>
                <button class="editor-btn blue" id="btn-export">Export Config</button>
            </div>
        `;

        this.container.appendChild(this.element);

        // Inputs laden
        this.inputs = {
            dirX: this.element.querySelector('#dir-x'),
            dirY: this.element.querySelector('#dir-y'),
            dirZ: this.element.querySelector('#dir-z'),
            layer: this.element.querySelector('#layer'),
            start: this.element.querySelector('#start'),
            end: this.element.querySelector('#end'),
            title: this.element.querySelector('#editor-title'),
            vectorDisplay: this.element.querySelector('#vector-display')
        };

        // Events
        const handleChange = () => this._onInputChange();
        
        this.inputs.dirX.addEventListener('change', handleChange);
        this.inputs.dirY.addEventListener('change', handleChange);
        this.inputs.dirZ.addEventListener('change', handleChange);
        this.inputs.layer.addEventListener('change', handleChange);
        this.inputs.start.addEventListener('change', handleChange);
        this.inputs.end.addEventListener('change', handleChange);

        this.element.querySelector('#btn-export').addEventListener('click', () => {
            if (this.callbacks.onExport) this.callbacks.onExport();
        });
        
        this.element.querySelector('#btn-reset').addEventListener('click', () => {
             // TODO Reset funnktion
        });
    }

    setCallbacks(callbacks) {
        this.callbacks = callbacks;
    }

    // Aktualisiert start/end Werte von außen (z.B. aus Timeline)
    updateStartEnd(start, end) {
        this.inputs.start.value = parseFloat(start).toFixed(2);
        this.inputs.end.value = parseFloat(end).toFixed(2);
    }

    show(objectData) {
        this.element.classList.add('visible');
        this.update(objectData);
    }

    hide() {
        this.element.classList.remove('visible');
    }

    update(data) {
        if (!data) return;

        this.inputs.title.textContent = data.name;
        
        // Inputs aktualisieren ohne Events auszulösen
        this.inputs.dirX.value = parseFloat(data.expDirection.x).toFixed(2);
        this.inputs.dirY.value = parseFloat(data.expDirection.y).toFixed(2);
        this.inputs.dirZ.value = parseFloat(data.expDirection.z).toFixed(2);
        
        this.inputs.layer.value = parseFloat(data.targetLevel).toFixed(2);
        this.inputs.start.value = parseFloat(data.start).toFixed(2);
        this.inputs.end.value = parseFloat(data.end).toFixed(2);

        this._updateVectorDisplay(data);
    }

    _updateVectorDisplay(data) {
        
        // Vektor basierend auf Richtung und Layer berechnen
        const dir = new THREE.Vector3(
            parseFloat(this.inputs.dirX.value),
            parseFloat(this.inputs.dirY.value),
            parseFloat(this.inputs.dirZ.value)
        ).normalize();
        
        // Layer-Wert
        const level = parseFloat(this.inputs.layer.value);
        
        // Normalisierten Vektor mit Layer multiplizieren
        const vec = dir.multiplyScalar(level);
        this.inputs.vectorDisplay.textContent = `${vec.x.toFixed(2)} | ${vec.y.toFixed(2)} | ${vec.z.toFixed(2)}`;
    }

    _onInputChange() {
        const data = {
            expDirection: new THREE.Vector3(
                parseFloat(this.inputs.dirX.value),
                parseFloat(this.inputs.dirY.value),
                parseFloat(this.inputs.dirZ.value)
            ).normalize(),
            targetLevel: parseFloat(this.inputs.layer.value),
            start: parseFloat(this.inputs.start.value),
            end: parseFloat(this.inputs.end.value)
        };

        this._updateVectorDisplay(data);

        if (this.callbacks.onChange) {
            this.callbacks.onChange(data);
        }
    }
}
