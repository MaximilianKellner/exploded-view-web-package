import * as THREE from 'three';
import { EditorLightPanel } from './editor-light-panel.js';

export class EditorLightController {
    constructor({ scene, renderer, config }) {
        this.scene = scene;
        this.renderer = renderer;
        this.config = config;

        this.transformHandler = null;
        this.selectedLight = null;
        this.selectedLightKey = null;
        this.lightHelpers = new Map();
        
        // Callbacks für events wie z.B. sidebar update
        this.onSidebarRefresh = null;
        this.onSidebarUpdateItem = null;

        // Panel initialisieren
        const container = this.renderer.domElement.parentElement;
        this.panel = new EditorLightPanel(container, {
            config: this.config
        });

        this.panel.setCallbacks({
            onDelete: (light, key) => this.deleteLight(light, key),
            onChange: (light) => this._onPanelChange(light),
            onModeChange: (mode) => this._onModeChange(mode),
            onTypeChange: (type) => this._onTypeChange(type)
        });
    }

    setTransformHandler(handler) {
        this.transformHandler = handler;
    }
    
    setSidebarCallbacks({ onRefresh, onUpdateItem, onSelect }) {
        this.onSidebarRefresh = onRefresh;
        this.onSidebarUpdateItem = onUpdateItem;
        this.onSidebarSelect = onSelect;
    }

    enable() {
        this.initHelpers();
    }

    disable() {
        this.clearSelection();
        this.clearHelpers();
        this.panel.hide();
    }

    initHelpers() {
        this.clearHelpers();
        this.scene?.traverse((node) => {
            if (node.isDirectionalLight || node.isPointLight || node.isSpotLight) {
                const helper = this._createHelper(node);
                if (helper) {
                    this.lightHelpers.set(node.uuid, helper);
                    this.scene.add(helper);
                }
            }
        });
    }

    clearHelpers() {
        this.lightHelpers.forEach((helper) => {
            if (helper.parent) {
                helper.parent.remove(helper);
            }
        });
        this.lightHelpers.clear();
    }

    selectLight(light) {
        if (!light) return;

        const lightKey = light.name || light.uuid;
        // Überprüfen, dass die Lichtkonfiguration existiert
        const lightsConfig = this._ensureLightsConfig();
        let configEntry = lightsConfig[lightKey];

        if (!configEntry) {
            configEntry = this._createConfig(light);
            lightsConfig[lightKey] = configEntry;
            light.name = lightKey;
        }

        this.panel.show(light, lightKey, configEntry);
        this.selectedLight = light;
        this.selectedLightKey = lightKey;


        this._syncTransformHandler(light);

        this._syncLightState(light, configEntry);
        
        console.log('EditorLightController: Light selected:', lightKey);
    }

    clearSelection() {
        if (this.selectedLight) {
            this._syncTransformHandler(null);
            this.selectedLight = null;
            this.selectedLightKey = null;
            this.panel.hide();
        }
    }

    addLight() {
        const lightsConfig = this._ensureLightsConfig();
        
        let index = 1;
        let lightName;
        
        // Namen finden --> Light-XXX
        do {
            lightName = `Light-${String(index).padStart(3, '0')}`;
            index++;
        } while (lightsConfig[lightName]);
        
        // Standardkonfiguration für neue Lichter
        const lightConfig = {
            type: 'directional',
            enabled: true,
            color: '#ffffff',
            intensity: 1.0,
            position: { x: 0, y: 5, z: 0 },
            rotation: { x: 0, y: 0, z: 0 },
            lookAtEnabled: true,
            lookAtTarget: { x: 0, y: 0, z: 0 }
        };

        // Lich in config einfügen
        lightsConfig[lightName] = lightConfig;

        // Objekt erstellen
        const light = new THREE.DirectionalLight(lightConfig.color, lightConfig.intensity);
        light.position.set(lightConfig.position.x, lightConfig.position.y, lightConfig.position.z);
        light.name = lightName;
        
        this.scene.add(light);
        if (light.target) {
            this.scene.add(light.target);
        }

        // Light Helper hinzufügen
        const helper = this._createHelper(light);
        if (helper) {
            this.lightHelpers.set(light.uuid, helper);
            this.scene.add(helper);
        }
        
        // Sidebar aktualisieren
        if (this.onSidebarRefresh) {
            this.onSidebarRefresh();
        }
        
        // Licht auswählen
        this.selectLight(light);
    }

    deleteLight(light, configKey) {
        if (!light) return;

        if (light.parent) {
            light.parent.remove(light);
        } else {
            this.scene.remove(light);
        }

        const lightsConfig = this.config?.sceneConfig?.lights;
        if (lightsConfig && configKey && lightsConfig[configKey]) {
            delete lightsConfig[configKey];
        }

        const helper = this.lightHelpers.get(light.uuid);
        if (helper && helper.parent) {
            helper.parent.remove(helper);
        }
        this.lightHelpers.delete(light.uuid);

        if (this.selectedLight === light) {
            this.selectedLight = null;
            this.selectedLightKey = null;
            if (this.transformHandler) {
                this.transformHandler.detach();
            }
        }

        this.panel.hide();
        
        if (this.onSidebarRefresh) {
            this.onSidebarRefresh();
        }
    }
    
    updateFromTransform() {
        if (!this.selectedLight || !this.transformHandler || this.transformHandler.controls.object !== this.selectedLight) return;

        const lightsConfig = this.config?.sceneConfig?.lights;
        const configEntry = lightsConfig?.[this.selectedLightKey];

        if (configEntry) {
            if (this.selectedLight.isDirectionalLight || this.selectedLight.isPointLight || this.selectedLight.isSpotLight) {
                configEntry.position = {
                    x: this.selectedLight.position.x,
                    y: this.selectedLight.position.y,
                    z: this.selectedLight.position.z
                };
            }

            if (this.selectedLight.isDirectionalLight || this.selectedLight.isSpotLight) {
                const worldQuat = new THREE.Quaternion();
                this.selectedLight.getWorldQuaternion(worldQuat);
                const worldEuler = new THREE.Euler().setFromQuaternion(worldQuat, this.selectedLight.rotation.order || 'XYZ');
                configEntry.rotation = {
                    x: worldEuler.x,
                    y: worldEuler.y,
                    z: worldEuler.z
                };
            }

            this._syncLightState(this.selectedLight, configEntry);
            this.panel.update(this.selectedLight, this.selectedLightKey, configEntry);
        }
    }

    // --- private methods ---

    _ensureLightsConfig() {
        if (!this.config) {
            this.config = {};
        }
        if (!this.config.sceneConfig) {
            this.config.sceneConfig = {};
        }
        if (!this.config.sceneConfig.lights) {
            this.config.sceneConfig.lights = {};
        }

        return this.config.sceneConfig.lights;
    }

    // Event Handler für Panel Änderungen
    _onPanelChange(light) {
        if (!light) return;
        const lightsConfig = this.config?.sceneConfig?.lights;
        const configEntry = lightsConfig?.[this.selectedLightKey];
        this._syncLightState(light, configEntry);
        
        if (this.onSidebarUpdateItem) {
            this.onSidebarUpdateItem(light);
        }
    }

    _onTypeChange(newType) {
        if (!this.selectedLight || !this.selectedLightKey) return;

        const lightsConfig = this.config?.sceneConfig?.lights;
        const configEntry = lightsConfig?.[this.selectedLightKey];
        if (!configEntry || configEntry.type === newType) return;

        this._applyTypeToConfig(configEntry, newType, this.selectedLight);

        const newLight = this._createLightFromConfig(newType, configEntry);
        if (!newLight) return;

        newLight.name = this.selectedLightKey;
        this._replaceSelectedLight(newLight);
        this.panel.show(newLight, this.selectedLightKey, configEntry);
        this._syncLightState(newLight, configEntry);

        if (this.onSidebarRefresh) {
            this.onSidebarRefresh();
        }
        if (this.onSidebarSelect) {
            this.onSidebarSelect(newLight);
        }
    }

    // Event Handler für Mode Wechsel (translate/rotate)
    _onModeChange(mode) {
        if (!this.selectedLight || !this.transformHandler) return;

        if (mode === 'rotate') {
            const lightsConfig = this.config?.sceneConfig?.lights;
            const configEntry = lightsConfig?.[this.selectedLightKey];
            const allowRotate = (this.selectedLight.isDirectionalLight || this.selectedLight.isSpotLight)
                && (configEntry?.lookAtEnabled === false);

            if (!allowRotate) {
                this.transformHandler.setMode('translate');
                return;
            }
        }

        this.transformHandler.setMode(mode);
        if (this.transformHandler.controls) {
            this.transformHandler.controls.setSpace('world');
        }
    }

    // Light Helper erstellen
    _createHelper(light) {
        let helper = null;

        if (light.isDirectionalLight) {
            helper = new THREE.DirectionalLightHelper(light, 1);
        } else if (light.isPointLight) {
            helper = new THREE.PointLightHelper(light, 0.5);
        } else if (light.isSpotLight) {
            helper = new THREE.SpotLightHelper(light);
        }

        if (!helper) return null;

        helper.traverse((node) => {
            node.userData = node.userData || {};
            node.userData.lightHelper = true;
            node.userData.lightRef = light;
        });

        helper.userData = helper.userData || {};
        helper.userData.lightHelper = true;
        helper.userData.lightRef = light;

        return helper;
    }

    // Light Helper aktualisieren
    _updateHelper(light) {
        const helper = this.lightHelpers.get(light.uuid);
        if (helper && helper.update) {
            helper.update();
        }
    }

    _replaceSelectedLight(newLight) {
        const oldLight = this.selectedLight;
        if (!oldLight) return;

        const oldHelper = this.lightHelpers.get(oldLight.uuid);
        if (oldHelper && oldHelper.parent) {
            oldHelper.parent.remove(oldHelper);
        }
        this.lightHelpers.delete(oldLight.uuid);

        if (oldLight.target && oldLight.target.parent) {
            oldLight.target.parent.remove(oldLight.target);
        }

        if (oldLight.parent) {
            oldLight.parent.remove(oldLight);
        } else {
            this.scene.remove(oldLight);
        }

        this.scene.add(newLight);
        if (newLight.target && !newLight.target.parent) {
            this.scene.add(newLight.target);
        }

        const newHelper = this._createHelper(newLight);
        if (newHelper) {
            this.lightHelpers.set(newLight.uuid, newHelper);
            this.scene.add(newHelper);
        }

        this.selectedLight = newLight;

        this._syncTransformHandler(newLight);
    }

    _syncTransformHandler(light) {
        if (!this.transformHandler) return;

        const canTransform = !!(light && (light.isDirectionalLight || light.isPointLight || light.isSpotLight));
        if (canTransform) {
            this.transformHandler.attach(light);
            this.transformHandler.setMode('translate');
            if (this.transformHandler.controls) {
                this.transformHandler.controls.setSpace('world');
            }
        } else {
            this.transformHandler.detach();
        }
    }

    _applyTypeToConfig(configEntry, newType, light) {
        configEntry.type = newType;

        if (configEntry.enabled === undefined) {
            configEntry.enabled = light?.visible ?? true;
        }

        if (!configEntry.color) {
            configEntry.color = light?.color ? `#${light.color.getHexString()}` : '#ffffff';
        }

        if (typeof configEntry.intensity !== 'number') {
            configEntry.intensity = light?.intensity ?? 1;
        }

        if (newType === 'directional') {
            configEntry.position = configEntry.position || this._buildPosition(light, { x: 0, y: 5, z: 0 });
            configEntry.rotation = configEntry.rotation || this._buildRotation(light, { x: 0, y: 0, z: 0 });
            if (configEntry.lookAtEnabled === undefined) {
                configEntry.lookAtEnabled = true;
            }
            configEntry.lookAtTarget = configEntry.lookAtTarget || this._buildLookAtTarget(light, { x: 0, y: 0, z: 0 });
        } else if (newType === 'point') {
            configEntry.position = configEntry.position || this._buildPosition(light, { x: 0, y: 5, z: 0 });
            delete configEntry.rotation;
            delete configEntry.lookAtEnabled;
            delete configEntry.lookAtTarget;
        } else {
            delete configEntry.position;
            delete configEntry.rotation;
            delete configEntry.lookAtEnabled;
            delete configEntry.lookAtTarget;
        }
    }

    _createLightFromConfig(type, configEntry) {
        const color = configEntry.color || '#ffffff';
        const intensity = configEntry.intensity ?? 1;
        let light = null;

        if (type === 'directional') {
            light = new THREE.DirectionalLight(color, intensity);
            const position = configEntry.position || { x: 0, y: 5, z: 0 };
            light.position.set(position.x ?? 0, position.y ?? 0, position.z ?? 0);
            if (configEntry.rotation) {
                light.rotation.set(configEntry.rotation.x ?? 0, configEntry.rotation.y ?? 0, configEntry.rotation.z ?? 0);
            }
        } else if (type === 'point') {
            light = new THREE.PointLight(color, intensity);
            const position = configEntry.position || { x: 0, y: 5, z: 0 };
            light.position.set(position.x ?? 0, position.y ?? 0, position.z ?? 0);
        } else if (type === 'ambient') {
            light = new THREE.AmbientLight(color, intensity);
        }

        if (!light) return null;

        light.visible = configEntry.enabled ?? true;
        return light;
    }

    _applyLookAt(light, configEntry) {
        if (!(light && configEntry)) return;

        if (light.isDirectionalLight || light.isSpotLight) {
            const lookAtEnabled = configEntry.lookAtEnabled !== false;
            // überprüfen, ob target in der Szene ist, bevor es positioniert wird
            if (light.target && !light.target.parent) {
                this.scene.add(light.target);
            }

            if (lookAtEnabled) {
                const target = configEntry.lookAtTarget || { x: 0, y: 0, z: 0 };
                if (light.target) {
                    light.target.position.set(target.x ?? 0, target.y ?? 0, target.z ?? 0);
                }
            } else {
                const worldQuat = new THREE.Quaternion();
                light.getWorldQuaternion(worldQuat);
                const direction = new THREE.Vector3(0, 0, -1).applyQuaternion(worldQuat);
                const targetPosition = light.getWorldPosition(new THREE.Vector3()).add(direction);
                if (light.target) {
                    light.target.position.copy(targetPosition);
                }
            }
        }
    }

    _buildPosition(light, fallback) {
        return {
            x: light?.position?.x ?? fallback.x,
            y: light?.position?.y ?? fallback.y,
            z: light?.position?.z ?? fallback.z
        };
    }

    _buildRotation(light, fallback) {
        return {
            x: light?.rotation?.x ?? fallback.x,
            y: light?.rotation?.y ?? fallback.y,
            z: light?.rotation?.z ?? fallback.z
        };
    }

    _buildLookAtTarget(light, fallback) {
        return {
            x: light?.target?.position?.x ?? fallback.x,
            y: light?.target?.position?.y ?? fallback.y,
            z: light?.target?.position?.z ?? fallback.z
        };
    }

    _syncLightState(light, configEntry) {
        if (!(light && configEntry)) return;

        this._applyLookAt(light, configEntry);
        this._updateHelper(light);
    }

    _createConfig(light) {
        const config = {
            type: 'ambient',
            enabled: light.visible ?? true,
            color: light.color ? `#${light.color.getHexString()}` : '#ffffff',
            intensity: light.intensity ?? 1
        };

        if (light.isDirectionalLight) {
            config.type = 'directional';
            config.position = this._buildPosition(light, { x: 0, y: 0, z: 0 });
            config.rotation = this._buildRotation(light, { x: 0, y: 0, z: 0 });
            config.lookAtEnabled = true;
            config.lookAtTarget = this._buildLookAtTarget(light, { x: 0, y: 0, z: 0 });
        } else if (light.isAmbientLight) {
            config.type = 'ambient';
        } else if (light.isPointLight) {
            config.type = 'point';
            config.position = this._buildPosition(light, { x: 0, y: 0, z: 0 });
        } else if (light.isSpotLight) {
            config.type = 'spot';
            config.position = this._buildPosition(light, { x: 0, y: 0, z: 0 });
            config.rotation = this._buildRotation(light, { x: 0, y: 0, z: 0 });
            config.lookAtEnabled = true;
            config.lookAtTarget = this._buildLookAtTarget(light, { x: 0, y: 0, z: 0 });
        }

        return config;
    }
}