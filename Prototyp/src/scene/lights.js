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

                light.shadow.mapSize.width = 2048; // Höhere Auflösung für schärfere Schatten
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