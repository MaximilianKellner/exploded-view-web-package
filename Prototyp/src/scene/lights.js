import * as THREE from 'three';

/** Diese Funktion verwaltet die Lichter in der Szene. Die Lichter werden aus der Konfiguration ausgelesen und der Szene hinzugefügt.
 * Zudem wird hier die Schatten Konfiguration umgesetzt.
 */

function setupLights(mainConfig, scene, lightsObject) {
    const lightsConfig = mainConfig.sceneConfig.lights;
    for (const lightName in lightsConfig) {
        const config = lightsConfig[lightName];
        if (!config.enabled) continue;

        let light;
        switch (config.type) {
            case 'ambient':
                light = new THREE.AmbientLight(config.color, config.intensity);
                break;
            case 'directional':
                light = new THREE.DirectionalLight(config.color, config.intensity);
                if (mainConfig.sceneConfig.shadowsEnabled) {
                    light.castShadow = true;
                }
                light.position.set(config.position.x, config.position.y, config.position.z);

                if (config.rotation) {
                    light.rotation.set(config.rotation.x, config.rotation.y, config.rotation.z);
                }

                if (!light.target.parent) {
                    scene.add(light.target);
                }

                if (config.lookAtEnabled === false) {
                    const direction = new THREE.Vector3(0, 0, -1).applyEuler(light.rotation);
                    light.target.position.copy(light.position.clone().add(direction));
                } else {
                    const target = config.lookAtTarget || { x: 0, y: 0, z: 0 };
                    light.target.position.set(target.x ?? 0, target.y ?? 0, target.z ?? 0);
                }

                light.shadow.mapSize.width = 2048;
                light.shadow.mapSize.height = 2048;
                light.shadow.camera.near = 0.5;
                light.shadow.camera.far = 500;
                light.shadow.bias = -0.001; // Gegen "shadow acne"

                break;
        }

        if (light) {
            light.name = lightName;
            lightsObject[lightName] = light; // Licht im globalen Objekt speichern
            scene.add(light);
        }
    }
}

export { setupLights };