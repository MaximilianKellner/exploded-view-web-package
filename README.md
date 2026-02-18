# Konzeption und Entwicklung eines interaktiven (Visualisierungs-)Systems für Exploded Views im Web.

[![NPM-Version](https://img.shields.io/npm/v/@maximiliankellner/exploded-views)](https://www.npmjs.com/package/explo.js)
[![Lizenz](https://img.shields.io/github/license/MaximilianKellner/exploded-views-web-praxis-projekt)](https://github.com/MaximilianKellner/exploded-views-web-praxis-projekt/blob/main/LICENSE)

Ein Paket zur einfachen Erstellung und Integration von interaktiven Exploded Views mit Beschriftungselementen für das Web.

<p align="center">
  <img src="img/Bildschirmaufnahme2025-10-24202510-ezgif.com-video-to-webp-converter.webp" alt="Exploded View Demo" style="max-height: 450px;"/>
</p>

## Projektbeschreibung

Dieses Projekt, welches im Rahmen des Praxisprojekts an der TH Köln bei Prof. Christian Noss entwickelt wurde, bietet eine Wiederverwendbare Möglichkeit zur Erstellung modularer und interaktiver Exploded Views, als JavaScript-Bibliothek.

## Forschungsfragen

1. Wie lassen sich Exploded Views im Web modular und wiederverwendbar umsetzen und welche Best Practices sowie Herausforderungen existieren dabei?
2. Welche Vorteile und Möglichkeiten bieten 3D Modelle und Exploded Views im Hinblick auf Storytelling?
3. Wie lassen sich Interaktivität und Animation (z.B. Scroll- oder Hover-Effekte) integrieren?

Der Fokus liegt auf:

- **Nahtloser Integration**: Einfache Einbettung in bestehende Web-Layouts.
- **User Experience**: Intuitive Bedienung der Beschriftungselemente und Animationen.
- **Kofigurierbarkeit**: Breiter Funktionsrahmen mit diversen Optionen. 
- **Beschriftungselemente**: Auswahl an verschiedenen Beschriftungselementen. 

## Features

- **Modell-Unterstützung**: Lädt `.glb`-Modelle.
- **Animationssteuerung**: Definiere komplexe Explosionsanimationen über eine `JSON`-Konfigurationsdatei.
- **Interaktivität**: Reagiere auf Klicks, hebe einzelne Bauteile hervor und zeige dynamisch Informationen an.
- **Informationsanzeige**: Stelle Informationen in 2D oder in 3D über "Cards" oder "Pointer" dar.
- **Debugging**: Eine integrierte Debug-UI ([Tweakpane](https://tweakpane.github.io/docs/)) zur einfachen Anpassung von Parametern.
- **Kofigurierbarkeit**: Konfiguriere Kamera, Beleuchtung, Highlighting-Effekte und mehr.

## Installation
Eine detaillierte Anleitung und alle verfügbaren optionen sind in der [**INSTALLATION.md**](https://github.com/MaximilianKellner/exploded-views-web-praxis-projekt/blob/main/INSTALLATION.MD) zu finden. Um Probleme beim Erstellen der Animation zu vermeiden sind hier einige [Tipps](https://github.com/MaximilianKellner/exploded-views-web-praxis-projekt/wiki/empfohlener-Workflow) für das Vorgehen zu finden.

- **Beispieldaten Auto**: [/Prototyp/public/car](https://github.com/MaximilianKellner/exploded-views-web-praxis-projekt/tree/main/Prototyp/public/car)
- **Beispieldaten Kopfhörer**: [/Prototyp/public/kopfhoerer](https://github.com/MaximilianKellner/exploded-views-web-praxis-projekt/tree/main/Prototyp/public/kopfhoerer)
- **Beispieldaten Klemmbaustein Figur**: [/Prototyp/public/lego]((https://github.com/MaximilianKellner/exploded-views-web-praxis-projekt/tree/main/Prototyp/public/lego))
- 
## Beispiel
Um die vorkonfigurierte Beispielanwendung zu starten können sie die folgenden Befehle ausführen. Alternathiv kann sie [hier](https://exploded-views-kellner.de-fender.it/) besucht werden

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


## Links
- [Abschlussvideo](https://youtu.be/Dp-yudm3Sj8)
- [Beispielanwendung](https://exploded-views-kellner.de-fender.it/)
- [Ausarbeitung](https://github.com/MaximilianKellner/exploded-views-web-praxis-projekt/blob/main/Konzeption-und-Entwicklung-eines-interaktiven-Visualisierungs-Systems-f%C3%BCr-Exploded-Views-im-Web-Maximilian-Kellner.pdf)
- [Wiki & Dokumentation](https://github.com/MaximilianKellner/exploded-views-web-praxis-projekt/wiki)
- [Exposé (Kontext des Uni-Projekts)](https://github.com/MaximilianKellner/exploded-views-web-praxis-projekt/wiki/Expos%C3%A9)
- [Figma Jam Board](https://www.figma.com/board/RcSMqqvDBrkwL3dCG0Wz6w/Praxisprojekt?node-id=0-1&t=1YXQVP6LdfrHqSBl-1)
- [Figma Design Board](https://www.figma.com/design/HBe8OrQcXQCB1ZgdsT1rkd/Praxisprojekt?node-id=0-1&t=SbWwg3q3qUSnSkLo-1)

## Autor

[**Maximilian Elias Kellner**](https://github.com/MaximilianKellner)

