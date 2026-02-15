import ExplodedViewer from './ExplodedViewer.js';

/**
 * Beispielhaftes Setup des Exploded viewers (Viewer-Demo).
 * Dies ist die Entry-Point für die Viewer-Demo (index.html)
 */

// Sportwagen
const sportwagen = {
    sceneConfigPath: '/car/scene-config.json', // Pfad zur Szenenkonfiguration
    modelPath: '/car/911.glb', // Pfad zum explodierbaren .glb Modell
    modelPath: '/car/911-with-ground.glb', // Pfad zum explodierbaren .glb Modell
    explosionConfigPath: '/car/exp-rotate-import-test.json', // Pfad zur Explosions-Konfiguration
    cardDataPath: '/car/911-cards.json', // Pfad zu den Card-Inhalten
    showDebugUI: true,
    showStats: true,

    editMode: true,
    
    sceneConfig: {
        backgroundColor: "#6480be", //old: 353535 -- blue: 6480be
        shadowsEnabled: false,
        camera: {
            position: [5, 3, 9],
            maxDistance: 50,
            lockVertical: false,
        }
    },
    
    highlightOptions: {
        highlightComponent: true,
        mode: "ghost"  // 'wireframe' oder 'ghost'
    },

    infoElementType: 'card', // 'pointer', 'attached-card', 'card'
}

// Klemmbaustein
const klemmbaustein = {
    sceneConfigPath: '/lego/scene-config.json', // Pfad zur Szenenkonfiguration
    modelPath: '/lego/lego-figur.glb', // Pfad zum explodierbaren .glb Modell
    explosionConfigPath: '/lego/exp-config.json', // Pfad zur Explosions-Konfiguration
    showDebugUI: true,
    showStats: true,
}

// Kopfhoerer
const kopfhoerer = {
    sceneConfigPath: '/kopfhoerer/scene-config.json', // Pfad zur Szenenkonfiguration
    modelPath: '/kopfhoerer/nothing-in-ear.glb', // Pfad zum explodierbaren .glb Modell
    explosionConfigPath: '/kopfhoerer/exp-config.json', // Pfad zur Explosions-Konfiguration
    cardDataPath: '/911-cards.json', // Pfad zu den Card-Inhalten
    showDebugUI: true,
    showStats: true,

    sceneConfig: {
        backgroundColor: "#303030",
        shadowsEnabled: false,
    },

    animationConfig: {
        expFactor: 0,
        useSequenceAnim: false,
    },
}

async function main() {
    const container = document.getElementById('exp-container');
    if (!container) {
        console.error('Container #exp-container konnte nicht gefunden werden.');
        return;
    }

    const expOptions = sportwagen;
    // sportwagen || kopfhoerer || klemmbaustein;

    const expViewer = new ExplodedViewer(container, expOptions);
    await expViewer.init();
}

main();