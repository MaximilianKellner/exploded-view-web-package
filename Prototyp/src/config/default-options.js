// Alle möglichen Optionen, welche der Nutzer anpassen kann mit ihrem zugewiesenen Standardwert.

export const defaultOptions = {
    sceneConfigPath: null, // Pfad zur Szenenkonfiguration
    modelPath: null, // Pfad zum explodierbaren .glb Modell
    explosionConfigPath: null, // Pfad zur Explosions-Konfiguration
    cardDataPath: null, // Pfad zu den Card-Inhalten
    
    editMode: false, // Editor-Mode für visuelle Config-Erstellung
    showDebugUI: false,
    showStats: false, //FPS + Latenz

    infoElementType: 'card', // 'pointer', 'attached-card', 'card'

    highlightOptions: {
        highlightComponent: true,
        mode: 'ghost', // 'wireframe' oder 'ghost'
        wireframeColor: '#aaaaaa',
        ghostColor: '#c4c4c4'
    },
    animationConfig: {
        expFactor: 0,
        useSequenceAnim: false,
        layerDistance: 0.5,
        animationDuration: 2000,
        animationEasing: 'inOut(4)', // alle standart Easing-Funktionen von anime.js sind möglich (https://animejs.com/easing-editor/spring/default)
        globalExpDirection: [1, 1, 1],
        allowScrollAnimation: false,
        scrollSensitivity: 0.001
    },
    cardConfig: {
        animationDuration: 500,
        isDarkmode: true
    },
    pointerConfig: {
        defaultSide: 'auto', // 'left', 'right' oder 'auto'
        rotationY: '0', // 'auto' für Ausrichtung zur Kamera, oder eine Zahl (z.B. 45) für 45°
        maxWidth: 1800,
        titleColor: "#ffffff",
        bodyColor: "#999999",
        lineColor: "#ebebeb"
    },
    sceneConfig: {
        backgroundColor: "#303030",
        showCoordinatesystem: false,
        shadowsEnabled: true,
        camera: {
            position: [5, 3, 5],
            lookAt: [0, 0, 0],
            minDistance: 1,
            maxDistance: 20,
            lockHorizontal: false,
            lockVertical: false,
            zoomSpeed: 1.5,
            rotateSpeed: 1.1,
            dampingFactor: 0.075 // Höherer Wert --> Weniger nachschwingen
        },
        lights: {
            "ambient": {
                "type": "ambient",
                "enabled": true,
                "color": "#ffffff",
                "intensity": 0.5
            },
            "mainDirectional": {
                "type": "directional",
                "enabled": true,
                "color": "#ffffff",
                "intensity": 1.5,
                "position": { "x": 5, "y": 10, "z": 7.5 },
                "lookAtEnabled": true
            },
            "secondDirectional": {
                "type": "directional",
                "enabled": true,
                "color": "#ffffff",
                "intensity": 1.0,
                "position": { "x": -5, "y": 10, "z": -5 },
                "lookAtEnabled": true
            },
        }
    }
};