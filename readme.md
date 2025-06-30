# Dein Wochenplaner - Prototyp (Vanilla JS, Performance-optimiert)

Dies ist ein funktionsfähiger Prototyp einer Web-Anwendung, die rein mit Vanilla JavaScript, HTML und CSS erstellt wurde. Sie hilft Nutzern, personalisierte und budgetfreundliche Essenspläne zu erstellen.

Diese Version ist für die **Veröffentlichung (Deployment)** optimiert, indem Rezeptdaten vorab generiert und statisch ausgeliefert werden.

## Was macht diese Anwendung?

Foodie ist ein digitaler Essensplaner, der Ihnen dabei hilft, Ihre Mahlzeiten für die Woche einfach und effizient zu organisieren. Mit Foodie können Sie:

*   **Wochenpläne erstellen:** Generieren Sie automatisch Essenspläne basierend auf der gewünschten Portionsgröße und speziellen Ernährungsmerkmalen (z.B. vegetarisch, vegan). Wählen Sie aus vorgeschlagenen Rezepten Ihre Favoriten für jeden Tag aus.
*   **Vorräte verwalten:** Erfassen Sie Lebensmittel, die Sie bereits zu Hause haben, in Ihrem digitalen Vorrat. Suchen und fügen Sie Artikel hinzu, inklusive Menge, Einheit und optionalem Haltbarkeitsdatum.
*   **Rezepte entdecken:** Finden Sie passende Rezeptideen basierend auf den Lebensmitteln in Ihrem Vorrat.
*   **Einkaufslisten generieren:** Erstellen Sie automatisch eine Einkaufsliste basierend auf Ihrem bestätigten Wochenplan. Die Liste berücksichtigt bereits vorhandene Artikel aus Ihrem Vorrat, um unnötige Käufe zu vermeiden.
*   **Rezeptdetails einsehen:** Informieren Sie sich über Zutaten, Zubereitungsschritte und Nährwertangaben für jedes Rezept.

Das Ziel von Foodie ist es, die Essensplanung zu vereinfachen, Lebensmittelverschwendung zu reduzieren und Ihnen dabei zu helfen, sich abwechslungsreich und budgetfreundlich zu ernähren. Alle Ihre Daten, wie der aktuelle Wochenplan und Ihr Vorratsinventar, werden lokal in Ihrem Browser gespeichert.

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