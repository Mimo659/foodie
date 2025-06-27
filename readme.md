# Dein Wochenplaner - Prototyp (Vanilla JS, Performance-optimiert)

Dies ist ein funktionsfähiger Prototyp einer Web-Anwendung, die rein mit Vanilla JavaScript, HTML und CSS erstellt wurde. Sie hilft Nutzern, personalisierte und budgetfreundliche Essenspläne zu erstellen.

Diese Version ist für die **Veröffentlichung (Deployment)** optimiert, indem Rezeptdaten vorab generiert und statisch ausgeliefert werden.

## Features

- **Performance-Optimierung**:
  - **Statisches JSON**: Über 500 Rezepte sind in einer `recipes.json` vorab generiert und werden per `fetch` geladen. Dies eliminiert die rechenintensive Generierung im Browser.
  - **Loading Screen**: Ein animierter Ladebildschirm überbrückt die Ladezeit der Rezeptdatei.
  - **Lazy-Loaded UI**: Rezeptkarten im Wochenplan werden mittels `IntersectionObserver` erst dann gerendert, wenn sie in den sichtbaren Bereich des Nutzers scrollen.
- **Plan-Generator, Vorrats-Check & Einkaufsliste**: Kernfunktionen sind voll implementiert.
- **Persistenz**: Alle Nutzerdaten werden im `localStorage` des Browsers gespeichert.

## Ausführung & Entwicklung

### Lokale Ausführung
Es ist kein Webserver oder Build-Schritt für die reine Ausführung notwendig.
1. Lade alle Dateien in einen Ordner.
2. Öffne `index.html` direkt in einem modernen Webbrowser.

### (Optional) Rezepte neu generieren
Wenn du die Rezeptdaten ändern oder erweitern möchtest, kannst du das `generate-recipes.js`-Skript verwenden.
1. Stelle sicher, dass du [Node.js](https://nodejs.org/) installiert hast.
2. Öffne ein Terminal im Projektverzeichnis.
3. Führe den folgenden Befehl aus:
   ```bash
   node generate-recipes.js