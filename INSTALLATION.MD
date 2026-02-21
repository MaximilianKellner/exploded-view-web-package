# Installationsanleitung

## Beispiel: Schnellstart

Um die vorkonfigurierte Beispielanwendung zu starten, führen Sie folgende Befehle aus:

```sh
git clone https://github.com/MaximilianKellner/exploded-view-web-package.git
cd Prototyp
npm install
npm run dev
```

---
# Explo.js: Installation & Integration

Diese Anleitung beschreibt die Installation und Integration von **Explo.js**, einem Framework zur Erstellung interaktiver 3D-Exploded-View-Animationen im Web.

## 1. Installation

Das Paket ist über die offizielle npm-Registry verfügbar:

```sh
npm install explo.js
```

---
## 2. Schnelleinstieg

### HTML: Container für die 3D-Szene

```html
<div id="explo-viewer" style="width: 100%; height: 500px;"></div>
```

### JavaScript: Initialisierung

```js
import ExplodedViewer from 'explo.js';

// Optional: Standard-Design für Beschriftungen (Cards) importieren
import 'explo.js/default-card-style.css';

const container = document.getElementById('explo-viewer');

const options = {
        modelPath: '/path/to/model.glb',
        sceneConfigPath: '/path/to/scene-config.json',
        explosionConfigPath: '/path/to/exp-config.json',
        cardDataPath: '/path/to/cards.json',
        editMode: true, // Aktiviert den visuellen Editor zur Konfiguration
        showStats: false,
};

const viewer = new ExplodedViewer(container, options);
viewer.init();
```

---
## 3. Visueller Editor (Editmode)

Die effizienteste Art, Animationen zu erstellen, ist der integrierte visuelle Editor.

**Schritte:**

1. Setze `editMode: true` in deinen Optionen.
2. Starte deine Anwendung und öffne sie im Browser.
3. Nutze das Interface:
        - **Objekt-Selektion:** Klicke Teile des Modells direkt an.
        - **Manipulation:** Verschiebe oder rotiere Teile mit den Transform-Controls.
        - **Timeline:** Nutze die Timeline am unteren Rand, um Start- und Endpunkte der Animation per Drag-and-Drop festzulegen.
4. **Export:** Klicke auf den Export-Button im Menü, um die fertigen JSON-Dateien herunterzuladen und dauerhaft in dein Projekt zu integrieren.

---
## 4. Konfigurationsdateien im Detail

### Animations-Konfiguration (`exp-config.json`)

Diese Datei steuert das Verhalten der Einzelteile während der Explosion.

**Wichtigste Parameter:**

- `level`: Multiplikator für die Distanz der Verschiebung.
- `expDirection`: Richtungsvektor der Bewegung `[X, Y, Z]`.
- `rotation`: Rotation in Grad während der Animation `[X, Y, Z]`.
- `start`: Startzeitpunkt der Animation im Gesamtverlauf (0.0 bis 1.0).
- `end`: Endzeitpunkt der Animation (muss größer als start sein).

**Beispiel:**

```json
{
    "objects": {
        "Spoiler_Heck": {
            "level": 0.5,
            "expDirection": [0, 1, 0],
            "rotation": [45, 0, 0],
            "start": 0.1,
            "end": 0.9
        }
    }
}
```

### Szenen-Konfiguration (`scene-config.json`)

Definiert die Umgebung und Interaktions-Parameter.

**Beispiel:**

```json
{
        "sceneConfig": {
                "backgroundColor": "#1a1a1a",
                "camera": {
                        "position": [5, 3, 9],
                        "lookAt": [0, 0, 0],
                        "maxDistance": 20
                }
        },
        "highlightOptions": {
                "mode": "ghost",
                "highlightComponent": true
        }
}
```

---
## 5. Links & Ressourcen

- **Onboarding-Tool:** [exploded-views-kellner.de-fender.it](https://exploded-views-kellner.de-fender.it/)
- **Dokumentation:** Vollständige Parameterliste unter `src/config/default-options.js`.

---
## 6. Beispieldaten

- [Auto](https://github.com/MaximilianKellner/exploded-views-web-praxis-projekt/tree/main/Prototyp/public/car)
- [Kopfhörer](https://github.com/MaximilianKellner/exploded-views-web-praxis-projekt/tree/main/Prototyp/public/kopfhoerer)