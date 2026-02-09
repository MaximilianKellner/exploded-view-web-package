# Installationsanleitung

## Beispiel
Um die vorkonfigurierte Beispielanwendung zu starten können sie die folgenden Befehle ausführen.

```sh
git clone https://github.com/MaximilianKellner/exploded-views-web-praxis-projekt.git
```
```sh
cd .\Prototyp\
```
```
npm i
```
```
npm start
```

## 1. Installation

erstellen sie eine `.npmrc`-Datei im Hauptverzeichnis
```
@maximiliankellner:registry=https://npm.pkg.github.com/
```

Laden sie die relevanten Inhalte herunter
```sh
npm install npm install @maximiliankellner/exploded-views
```

## 2. Setup

fügen sie ein Container-Element in ihre HTML-Struktur ein.
```html
<div id="exp-container" style="width: 100vw; height: 100vh;"></div>
```

bearbeiten sie ihre `main.js`
```js
import ExplodedViewer from '@maximiliankellner/exploded-views';

// (optional) Import default card styling
import '@maximiliankellner/exploded-views/default-card-style.css';


// Container element
const expContainer = document.getElementById('exp-container');
if (!expContainer) {
    console.error('Container #exp-container konnte nicht gefunden werden.');
}

// Optionen für die Szene
const options = {
    modelPath: '/path/to/model.glb',
    sceneConfigPath: '/path/to/scene-config.json',
    explosionConfigPath: '/path/to/exp-config.json',
    cardDataPath: 'path/to/card-content.json',
    showDebugUI: true,
    showStats: true,
};

// Viewer erstellen und initialisieren
const expViewer = new ExplodedViewer(expContainer, options);
expViewer.init();
```

## 3. Konfiguration
Falls sie die Standardeinstellungen  überschreiben wollen, geben sie eine `scene-config.json` an oder fügen sie optionen in die options in ihrer `main.js` ein. die Standardeinstellungen und verfügbare Optionen sind unter [`src/config/default-options.js`](https://github.com/MaximilianKellner/exploded-views-web-praxis-projekt/blob/main/Prototyp/src/config/default-options.js) zu finden.

### Beispiel für eine `scene-config.json`

```json
{
    "infoElementType": "card",
    "highlightOptions": {
        "highlightComponent": false,
        "mode": "ghost"
    },
    "pointerConfig": {
        "defaultSide": "auto"
    },
    "sceneConfig": {
        "camera": {
        "position": [3.5, 2, 5],
        "lookAt": [0, 0, 0],
        "minDistance": 3.5,
        "maxDistance": 10
        }
    }
}
```

### Beispiel für die `main.js` 

```js
const sportwagen = {

    // Pfad zur Szenenkonfiguration
    sceneConfigPath: '/scene-config.json', 

    // Pfad zum explodierbaren .glb Modell
    modelPath: '/911.glb', 
    
    // Pfad zur Explosions-Konfiguration
    explosionConfigPath: '/911-exp-config.json',

    // Pfad zu den Card-Inhalten
    cardDataPath: '/911-cards.json',

    showDebugUI: true,
    showStats: true,
    
    // --------------- OPTIONEN ---------------
    sceneConfig: {
        backgroundColor: "#6480be",
        camera: {
            position: [5, 3, 9],
            maxDistance: 50,
            lockVertical: true,
        }
    },
    
    highlightOptions: {
        highlightComponent: true,
        mode: "ghost"  // 'wireframe' oder 'ghost'
    },
}
```

## 4. Animation erstellen

Um die Animation der Explosionsansicht zu steuern, benötigen Sie eine `exp-config.json`. Diese Datei definiert für jedes Objekt im 3D-Modell, wie es sich während der Explosion verhält.

Die wichtigsten Eigenschaften:
- `level`: Ein Multiplikator für die Explosionsdistanz. Dieser Wert bestimmt auf welcher Ebene sich das Objekt zum Abschluss der Animation befindet.
- `expDirection`: Ein Vektor `[X, Y, Z]`, der die Richtung der Bewegung angibt.
- `sequence` (optional): Definiert die Reihenfolge der Animation. Teile mit der gleichen Sequenznummer bewegen sich gleichzeitig.

### Beispiel für eine `exp-config.json`

```json
{
  "_comment": "Die Richtung der Explosion (expDirection) wird als Vektor [X, Y, Z] angegeben.",
  "objects": {
    "Cube000": {
      "level": 0,
      "expDirection": [-1, -0.5, 0],
      "sequence": 1
    },
    [...]
  }
}
```

# Beispieldaten

Beispiel 1: [Auto](https://github.com/MaximilianKellner/exploded-views-web-praxis-projekt/tree/main/Prototyp/public/car)

Beispiel 2: [Kopfhörer](https://github.com/MaximilianKellner/exploded-views-web-praxis-projekt/tree/main/Prototyp/public/kopfhoerer)
