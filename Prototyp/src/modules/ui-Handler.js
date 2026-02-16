import { Pane } from 'tweakpane';
import { toggleDarkMode } from './theme-handler.js';

/**
 * Verwaltet die Logik für die Tweakpane GUI, welche zum Debugging und Testen genutz wird. 
 */


export class UIHandler{
    constructor() {
        this.pane = null;
        this.config = null;
        this.lights = null;
        this.scene = null;
        this.camera = null;
        this.controls = null;
        this.renderer = null;
        this.animationFolder = null;
        this.sceneFolder = null;
        this.cameraFolder = null;
        this.lightsFolder = null;
        this.cardFolder = null;
        this.animationHandler = null;
        this.cameraHandler = null;
        this.highlightFolder = null;
        this.infoElementFolder = null
    }

    initialize(config, lights, scene, camera, controls, cameraHandler, renderer) {
        this.config = config;
        this.lights = lights;
        this.scene = scene;
        this.camera = camera;
        this.controls = controls;
        this.renderer = renderer;

        // Init Tweakpane
        this.pane = new Pane({
            title: 'Scene Controls',
        });

        this.initAnimationFolder();
        if(this.config.showDebugUI){
            this.initSceneFolder();
            this.initInfoElementFolder();   
        }
        return this.pane;
    }

    setAnimationHandler(animationHandler) {
        this.animationHandler = animationHandler;
    }

    setCameraHandler(cameraHandler) {
        this.cameraHandler = cameraHandler;
    }

    setHighlightHandler(highlightHandler) {
        this.highlightHandler = highlightHandler;
    }

    // --- Animation Einstellungen ---
    initAnimationFolder() {
        this.animationFolder = this.pane.addFolder({ title: 'Animation', expanded: true });

        if (typeof this.config.animationConfig.expFactor !== 'number') {
            this.config.animationConfig.expFactor = 0;
        }

        this.animationFolder.addBinding(
            this.config.animationConfig,
            'expFactor',
            { label: 'Progress', min: 0, max: 1, step: 0.0001 }
        );

        this.triggerAnimationButton = this.animationFolder.addButton(
        {
            title: 'Start Animation',
            label: 'Animate'
        });

        this.triggerAnimationButton.on('click', () => {
            this.animationHandler.toggleAnimation();
        });

        this.animationFolder.addBinding(
            this.config.animationConfig,
            'animationDuration',
            { label: 'Duration (ms)',min: 100, max: 5000, step: 100}
        )
              
        // Scroll animation
        this.animationFolder.addBinding(this.config.animationConfig, 'allowScrollAnimation', {
            label: 'Scroll Animation'
        })
        .on('change', (ev) => {
            this.config.animationConfig.allowScrollAnimation = ev.value
            this.controls.enableZoom = !ev.value
        });

        // Sequenzielle Animation
        this.animationFolder.addBinding(this.config.animationConfig, 'useSequenceAnim', {
            label: 'Sequenzielle Animation'
        })
        .on('change', (ev) => {
            if (ev.value === true) {
                console.warn("Stellen sie sicher, dass die sequenzielle Animation konfiguriert ist")
            }
            this.config.animationConfig.useSequenceAnim = ev.value;
             
        }) 
    }

    // --- Szene ---
    initSceneFolder() {
        this.sceneFolder = this.pane.addFolder({ title: 'Scene'});
        this.sceneFolder.addBinding(this.config.sceneConfig, 'backgroundColor', { label: 'Background' })
        .on('change', (ev) => {
            this.scene.background.set(ev.value);
        });

        this.sceneFolder.addBinding(this.config.sceneConfig, 'shadowsEnabled', { label: 'Shadows' })
        .on('change', (ev) => {
            this.renderer.shadowMap.enabled = ev.value;

            this.scene.traverse(child => {
                if (child.isDirectionalLight || child.isSpotLight || child.isPointLight) {
                    child.castShadow = ev.value;
                }
                if (child.material) {
                    // Neukompilierung der Shader
                    child.material.needsUpdate = true;
                }
            });
        });

        this.sceneFolder.addBinding(this.config.sceneConfig, 'showCoordinatesystem', { label: 'Coordinate system ' })
        .on('change', (ev) => {
            const coordinateSystem = this.scene.getObjectByName('Coordinatesystem')
            
            coordinateSystem ? coordinateSystem.visible = ev.value 
                : console.warn('Coordinatesystem not found in the scene.');

            console.log('Coordinatesystem visibility changed:', ev.value);
        });
        
        this.initCameraFolder();
        this.initLightsFolder();
    }
    
    // --- Kamera ---
    initCameraFolder() {
        this.cameraFolder = this.sceneFolder.addFolder({ title: 'Camera', expanded: true });

        const cameraPosition = {
            position: {
                x: this.config.sceneConfig.camera.position[0],
                y: this.config.sceneConfig.camera.position[1],
                z: this.config.sceneConfig.camera.position[2]
            }
        };  

        const maxDist = this.config.sceneConfig.camera.maxDistance;
        const minDist = -1 * maxDist;

        this.cameraFolder.addBinding(cameraPosition, 'position', { 
            label: 'Position', 
            x: {step: 0.1}, 
            y: {step: 0.1}, 
            z: {step: 0.1} 
        })
        .on('change', (ev) => {
            // Kamera-Position aktualisieren
            this.camera.position.set(ev.value.x, ev.value.y, ev.value.z);
            this.controls.update();
        });  

        this.cameraFolder.addBinding(this.controls, 'minDistance', { label: 'Min Zoom', min: 0.1, max: 100, step: 0.1 })
            .on('change', () => {
                this.controls.update();
                this.cameraFolder.refresh();
            });
        this.cameraFolder.addBinding(this.controls, 'maxDistance', { label: 'Max Zoom', min: 0.1, max: 100, step: 0.1 })
            .on('change', () => {
                this.controls.update();
                this.cameraFolder.refresh();
            });

        this.cameraFolder.addBinding(this.controls, 'zoomSpeed', { label: 'Zoom Speed', min: 0.1, max: 5, step: 0.1 });
        this.cameraFolder.addBinding(this.controls, 'rotateSpeed', { label: 'Rotate Speed', min: 0.1, max: 5, step: 0.1 });
        this.cameraFolder.addBinding(this.controls, 'dampingFactor', { label: 'Damping', min: 0, max: 0.2, step: 0.005 });

        this.cameraFolder.addBinding(this.config.sceneConfig.camera, 'lockHorizontal', { label: 'Lock Horizontal' })
            .on('change', (ev) => {
                this.config.sceneConfig.camera.lockHorizontal = ev.value;
                this.cameraHandler.updateLocks();
            });

        this.cameraFolder.addBinding(this.config.sceneConfig.camera, 'lockVertical', { label: 'Lock Vertical' })
            .on('change', (ev) => {
                this.config.sceneConfig.camera.lockVertical = ev.value;
                this.cameraHandler.updateLocks();
            });
    }

    // --- Lichter ---
    initLightsFolder() {
        this.lightsFolder = this.sceneFolder.addFolder({ title: 'Lights', expanded: false });

        // Iteriere über die Lichter in der Konfiguration und erstelle die Steuerelemente
        for (const lightName in this.config.sceneConfig.lights) {
            const lightConfig = this.config.sceneConfig.lights[lightName];
            const lightObject = this.lights[lightName]; // Das korrespondierende THREE.Light Objekt

            if (!lightObject) continue;

            const folder = this.lightsFolder.addFolder({ title: lightName });

            folder.addBinding(lightConfig, 'enabled', { label: 'Enabled' })
                .on('change', (ev) => {
                    lightObject.visible = ev.value;
                });

            folder.addBinding(lightConfig, 'intensity', { label: 'Intensity', min: 0, max: 5, step: 0.1 })
                .on('change', (ev) => {
                    lightObject.intensity = ev.value;
                });

            folder.addBinding(lightConfig, 'color', { label: 'Color' })
                .on('change', (ev) => {
                    lightObject.color.set(ev.value);
                });

            // Füge Positions-Steuerelemente nur für gerichtete Lichter hinzu
            if (lightObject.isDirectionalLight) {
                folder.addBinding(lightConfig, 'position', { label: 'Position', x: {min: -20, max: 20}, y: {min: -20, max: 20}, z: {min: -20, max: 20} })
                    .on('change', (ev) => {
                        lightObject.position.set(ev.value.x, ev.value.y, ev.value.z);
                    });
            }
        }
    }

    // --- Info Element ---
    initInfoElementFolder(){
        this.infoElementFolder =  this.pane.addFolder({ title: 'Info Element', expanded: true });

        this.initHighlightFolder();
        this.initCardFolder();
        this.initPointerFolder();
    }

    // --- Highlight ---
    initHighlightFolder() {
        if (!this.config.highlightOptions) return;

        this.highlightFolder = this.infoElementFolder.addFolder({ title: 'Highlight', expanded: true });

        this.highlightFolder.addBinding(this.config.highlightOptions, 'highlightComponent', {
            label: 'Highlight'
        }).on('change', (ev) => {
            this.config.highlightOptions.highlightComponent = ev.value
        });

        this.highlightFolder.addBinding(this.config.highlightOptions, 'mode', {
            label: 'Mode',
            options: {
                Wireframe: 'wireframe',
                Ghost: 'ghost',
            },
        });

        this.highlightFolder.addBinding(this.config.highlightOptions, 'wireframeColor', {
            label: 'Wireframe Color'
        }).on('change', (ev) => {
            this.highlightHandler.wireframeMaterial.color.set(ev.value);
        });

        this.highlightFolder.addBinding(this.config.highlightOptions, 'ghostColor', {
            label: 'Ghost Color'
        }).on('change', (ev) => {
            this.highlightHandler.ghostMaterial.color.set(ev.value);
        });
    }

    // --- Card ---
    initCardFolder() {
        this.cardFolder = this.infoElementFolder.addFolder({ title: 'Card', expanded: false });
        this.cardFolder.addBinding(
            this.config.cardConfig,
            'animationDuration',
            { label: 'Duration (ms)',min: 100, max: 5000, step: 100}
        )

        this.cardFolder.addBinding(
            this.config.cardConfig,
            'isDarkmode',
            { label: 'Darkmode' }).on('change', (ev) => {
                toggleDarkMode(ev.value);
            });

            toggleDarkMode(this.config.cardConfig.isDarkmode);
    }

    // --- Pointer ---
    initPointerFolder() {
        this.pointerFolder = this.infoElementFolder.addFolder({ title: 'Pointer', expanded: false});
        this.pointerFolder.addBinding(this.config.pointerConfig, 'defaultSide', { 
            label: 'Default Side',
            options: {
                Auto: 'auto',
                Left: 'left',
                Right: 'right',
            }
        });

        this.pointerFolder.addBinding(this.config.pointerConfig, 'rotationY', { label: 'Rotation Y' });
        this.pointerFolder.addBinding(this.config.pointerConfig, 'maxWidth', { label: 'Size', min: 500, max: 2500, step: 100 });
        this.pointerFolder.addBinding(this.config.pointerConfig, 'titleColor', { label: 'Title Color' });
        this.pointerFolder.addBinding(this.config.pointerConfig, 'lineColor', { label: 'Line Color' });
        this.pointerFolder.addBinding(this.config.pointerConfig, 'bodyColor', { label: 'Body Color' });
    }

    // --- Refresh - Methoden ---
    refreshAnimationFolder() {
        if (this.animationFolder) {
            const state = this.animationHandler.getAnimationState();

            // Buttontitel aktuallisieren
            if (state.isAnimating) {
                this.triggerAnimationButton.title = 'Pause Animation';
            }if (state.isPaused) {
                this.triggerAnimationButton.title = 'Resume Animation';
            } else {
                this.triggerAnimationButton.title = state.isReversed ? 
                'Reverse Animation' : 'Start Animation';
            }

            this.animationFolder.refresh();
        }
    }

    refreshSceneFolder() {
        if (this.sceneFolder) {
            this.sceneFolder.refresh();
        }
    }

    refreshCameraFolder() {
        if (this.cameraFolder) {
            this.cameraFolder.refresh();
        }
    }

    refreshLightsFolder() {
        if (this.lightsFolder) {
            this.lightsFolder.refresh();
        }
    }

    refreshCardFolder() {
        if (this.cardFolder) {
            this.cardFolder.refresh();
        }
    }

    refreshhighlightFolder() {
        if (this.highlightFolder) {
             this.highlightFolder.refresh();
        }
    }

    refreshInfoelementFolder() {
        if (this.infoElementFolder) {
             this.infoElementFolder.refresh();
        }
    }

    refreshPointerFolder() {
        if (this.pointerFolder) {
            this.pointerFolder.refresh();
        }
    }

    refreshPane() {
        this.refreshAnimationFolder();
        this.refreshSceneFolder();
        this.refreshCameraFolder();
        this.refreshLightsFolder();
        this.refreshCardFolder();
        this.refreshhighlightFolder();
        this.refreshInfoelementFolder();
        this.refreshPointerFolder();
    }

    // Getter für den Zugriff auf das Pane-Objekt
    getPane() {
        return this.pane;
    }

    // --- Edit-Mode Helpers ---
    hide() {
        if (this.pane) {
            this.pane.hidden = true;
        }
    }

    show() {
        if (this.pane) {
            this.pane.hidden = false;
        }
    }

    destroy() {
        if (this.pane) {
            this.pane.dispose();
            this.pane = null;
        }
        this.config = null;
        this.lights = null;
        this.scene = null;
        this.camera = null;
        this.controls = null;
        this.animationFolder = null;
        this.sceneFolder = null;
        this.cameraFolder = null;
        this.lightsFolder = null;
        this.cardFolder = null;
        this.animationHandler = null;
        this.highlightFolder = null;
        this.infoElementFolder = null;
        this.pointerFolder = null;
    }
}