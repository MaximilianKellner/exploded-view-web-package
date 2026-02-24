# explo.js - Optimierung und Erweiterung eines webbasierten Frameworks für interaktive 3D-Exploded-View-Animationen

[![NPM-Version](https://img.shields.io/npm/v/explo.js)](https://www.npmjs.com/package/explo.js)
[![Lizenz](https://img.shields.io/github/license/MaximilianKellner/exploded-views-web-praxis-projekt)](https://github.com/MaximilianKellner/exploded-views-web-praxis-projekt/blob/main/LICENSE)

Ein Paket zur einfachen Erstellung, Bearbeitung und Integration von interaktiven Exploded Views mit Beschriftungselementen für das Web – inklusive eines integrierten visuellen WYSIWYG-Editors.

<p align="center">
  <img src="img/Bildschirmaufnahme2025-10-24202510-ezgif.com-video-to-webp-converter.webp" alt="Exploded View Demo" style="max-height: 450px;"/>
</p>

## Projektbeschreibung

Dieses Projekt wurde im Rahmen meiner Bachelorarbeit an der TH Köln weiterentwickelt und optimiert. Es baut auf einem vorangegangenen Praxisprojekt auf und bietet eine wiederverwendbare JavaScript-Bibliothek zur Erstellung modularer und interaktiver Exploded Views. 

Das zentrale neue Element ist ein **interaktiver WYSIWYG-Editor**, der die bisherige rein codebasierte JSON-Konfiguration durch eine visuelle Benutzeroberfläche (mit Timeline, Transform-Controls und Keyframes) ersetzt, um die Einstiegshürde maßgeblich zu senken. Zudem wurde der Funktionumfang und die Szenenkonfigurationsmöglichkeiten erweitert, um weitere Anwendungsfälle abzudecken.

## Forschungsfragen (Bachelorarbeit)

1. Welche zentralen Probleme und Defizite von Explo.js beeinflussen den Workflow und die Nutzbarkeit, und wie lassen sich diese durch gezielte konzeptionelle und technische Anpassungen verbessern?
2. Welche Visualisierungs- und Interaktionsmuster aus etablierter 3D-Software lassen sich sinnvoll auf einen webbasierten Exploded-View-Editor übertragen, um die Konfiguration, Steuerung und Vorschau von Animationen zu verbessern?

Der Fokus liegt auf:

- **Visueller Editor (WYSIWYG)**: Intuitive UI zur direkten Konfiguration und Vorschau der Animationen und der Szene im Browser.
- **Nahtloser Integration**: Einfache Einbettung in bestehende Web-Layouts und verbesserte Installation über die offizielle NPM-Registry.
- **User Experience & Animationslogik**: Intuitive Bedienung durch etablierte 3D-UI-Muster. Erweiterte Animationssteuerung durch Intervalle, Keyframes, Easing-Effekte, Vektoren und Rotation.
- **Konfigurierbarkeit**: Breiter Funktionsrahmen für die einfache Anpassung von Licht (Ambient, Directional, Point), Kamera und Highlighting-Effekten (Wireframe- und Ghost-Modus).
- **Beschriftungselemente**: Auswahl an verschiedenen 2D- und 3D-Beschriftungselementen

## Features

- **Modell-Unterstützung**: Lädt `.glb`-Modelle.
- **Visuelle Konfiguration**: Nutze den Online-Editor, um Bauteile visuell auszuwählen, Positionen über Transform-Controls anzupassen und auf einer Timeline zu organisieren.
- **JSON-Export**: Exportiere komplexe Explosionsanimationen und Szeneneinstellungen mit einem Klick als `JSON`-Konfigurationsdatei.
- **Interaktivität**: Reagiere auf Klicks, hebe einzelne Bauteile hervor und zeige dynamisch Zusatzinformationen an.
- **Debugging & Lokaler EditMode**: Der Editor kann zur schnellen Anpassung auch lokal im eigenen Projekt direkt über das Framework aufgerufen werden (`editMode: true`).

## Installation

Die Installation wurde im Rahmen der Bachelorarbeit deutlich vereinfacht (es wird kein GitHub Access-Token mehr benötigt). Installiere das Paket direkt über NPM:

```sh
npm i explo.js
```

Eine detaillierte Anleitung und alle verfügbaren optionen sind in der [**INSTALLATION.md**](https://github.com/MaximilianKellner/exploded-view-web-package/blob/main/INSTALLATION.MD) zu finden.

- **Beispieldaten Auto**: [/Prototyp/public/car](https://github.com/MaximilianKellner/exploded-view-web-package/tree/main/Prototyp/public/car)
- **Beispieldaten Kopfhörer**: [/Prototyp/public/kopfhoerer](https://github.com/MaximilianKellner/exploded-view-web-package/tree/main/Prototyp/public/kopfhoerer)
- **Beispieldaten Klemmbaustein Figur**: [/Prototyp/public/lego]((https://github.com/MaximilianKellner/exploded-view-web-package/tree/main/Prototyp/public/lego))

## Beispiel

Um den neuen visuellen Editor direkt im Browser zu testen und eigene .glb-Modelle ohne Programmierung zu animieren, besuche die dedizierte Web-Applikation: [https://exploded-views-kellner.de-fender.it/](https://exploded-views-kellner.de-fender.it/)

Alternativ kann die Beispielumgebung lokal gestartet werden:
```sh
git clone https://github.com/MaximilianKellner/exploded-view-web-package.git
```
```sh
cd .\Prototyp\
```
```
npm i
```
```
npm run dev
```


## Links
- [Abschlussvideo](https://youtu.be/zfNJg03HQ-Y)
- [Beispielanwendung & Editor](https://exploded-views-kellner.de-fender.it/)
- [Ausarbeitung](https://github.com/MaximilianKellner/exploded-view-web-package/blob/main/bachelorarbeit-maximilian-elias-kellner-11158861.pdf)
- [Wiki & Dokumentation](https://github.com/MaximilianKellner/exploded-view-web-package/wiki)
- [Demo & Onboarding Repo](https://github.com/MaximilianKellner/exploded-view-web-editor)
- [Figma Design Board](https://www.figma.com/design/fngrAbHoOEJdR6A51TaMCG/Bachelor?node-id=0-1&t=Vi3Ns6Gp1smo0xzk-1)

## Autor

[**Maximilian Elias Kellner**](https://github.com/MaximilianKellner)

