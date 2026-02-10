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
            onModeChange: (mode) => this._onModeChange(mode)
        });
    }

    setTransformHandler(handler) {
        this.transformHandler = handler;
    }
    
    setSidebarCallbacks({ onRefresh, onUpdateItem }) {
        this.onSidebarRefresh = onRefresh;
        this.onSidebarUpdateItem = onUpdateItem;
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
        if (this.config && this.config.sceneConfig && !this.config.sceneConfig.lights) {
            this.config.sceneConfig.lights = {};
        }
        const lightsConfig = this.config?.sceneConfig?.lights || {};
        let configEntry = lightsConfig[lightKey];

        if (!configEntry) {
            configEntry = this._createConfig(light);
            lightsConfig[lightKey] = configEntry;
            light.name = lightKey;
        }

        this.panel.show(light, lightKey, configEntry);
        this.selectedLight = light;
        this.selectedLightKey = lightKey;

        if (this.transformHandler) {
            this.transformHandler.attach(light);
            this.transformHandler.setMode('translate');
            if (this.transformHandler.controls) {
                this.transformHandler.controls.setSpace('world');
            }
        }

        this._applyLookAt(light, configEntry);
        this._updateHelper(light);
        
        console.log('EditorLightController: Light selected:', lightKey);
    }

    clearSelection() {
        if (this.selectedLight) {
            if (this.transformHandler) {
                this.transformHandler.detach();
            }
            this.selectedLight = null;
            this.selectedLightKey = null;
            this.panel.hide();
        }
    }

    addLight() {
        if (!this.config.sceneConfig) this.config.sceneConfig = {};
        
        let index = 1;
        let lightName;
        
        // Namen finden --> DirectionalLight-XXX
        do {
            lightName = `DirectionalLight-${String(index).padStart(3, '0')}`;
            index++;
        } while (this.config.sceneConfig.lights && this.config.sceneConfig.lights[lightName]);
        
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
        if (!this.config.sceneConfig.lights) {
            this.config.sceneConfig.lights = {};
        }
        this.config.sceneConfig.lights[lightName] = lightConfig;

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

            this._applyLookAt(this.selectedLight, configEntry);
            this.panel.update(this.selectedLight, this.selectedLightKey, configEntry);
            this._updateHelper(this.selectedLight);
        }
    }

    // --- private methods ---

    // Event Handler für Panel Änderungen
    _onPanelChange(light) {
        if (!light) return;
        const lightsConfig = this.config?.sceneConfig?.lights;
        const configEntry = lightsConfig?.[this.selectedLightKey];
        if (configEntry) {
            this._applyLookAt(light, configEntry);
        }
        this._updateHelper(light);
        
        if (this.onSidebarUpdateItem) {
            this.onSidebarUpdateItem(light);
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

    _createConfig(light) {
        const config = {
            type: 'ambient',
            enabled: light.visible ?? true,
            color: light.color ? `#${light.color.getHexString()}` : '#ffffff',
            intensity: light.intensity ?? 1
        };

        if (light.isDirectionalLight) {
            config.type = 'directional';
            config.position = {
                x: light.position?.x ?? 0,
                y: light.position?.y ?? 0,
                z: light.position?.z ?? 0
            };
            config.rotation = {
                x: light.rotation?.x ?? 0,
                y: light.rotation?.y ?? 0,
                z: light.rotation?.z ?? 0
            };
            config.lookAtEnabled = true;
            config.lookAtTarget = {
                x: light.target?.position?.x ?? 0,
                y: light.target?.position?.y ?? 0,
                z: light.target?.position?.z ?? 0
            };
        } else if (light.isAmbientLight) {
            config.type = 'ambient';
        } else if (light.isPointLight) {
            config.type = 'point';
            config.position = {
                x: light.position?.x ?? 0,
                y: light.position?.y ?? 0,
                z: light.position?.z ?? 0
            };
        } else if (light.isSpotLight) {
            config.type = 'spot';
            config.position = {
                x: light.position?.x ?? 0,
                y: light.position?.y ?? 0,
                z: light.position?.z ?? 0
            };
            config.rotation = {
                x: light.rotation?.x ?? 0,
                y: light.rotation?.y ?? 0,
                z: light.rotation?.z ?? 0
            };
            config.lookAtEnabled = true;
            config.lookAtTarget = {
                x: light.target?.position?.x ?? 0,
                y: light.target?.position?.y ?? 0,
                z: light.target?.position?.z ?? 0
            };
        }

        return config;
    }
}
