# R. Tasholli – Website-Vorschau

Statische Website für Reinigung, Umzüge und Gartenpflege aus Kirchzarten.

**Vorschau:** https://kastriottafolli.github.io/r-tasholli-reinigung-umzuege/

## Inhalt

Die veröffentlichte Website liegt in `docs/`. GitHub Pages veröffentlicht den Ordner aus dem Hauptbranch. HTML, CSS, JavaScript, Schriften und Bilder werden ohne Build-Schritt ausgeliefert. `.nojekyll` verhindert eine Verarbeitung durch Jekyll.

Die Website enthält drei ausführliche Leistungsseiten, FAQ, ein Mobilmenü, ein animiertes RT-Markenmotiv und einen Anfrage-Assistenten. Der Assistent sendet keine Anfrage an einen Server; er bereitet eine E-Mail zur Prüfung und zum Versand durch den Besucher vor.

## Animierte Szenen

Die Startseite bietet drei direkt wählbare Echtzeit-Illustrationen: Fensterreinigung mit Glanz und Staubsauger, ein Transporter mit bewegten Rädern und verladenen Kartons sowie Gartenpflege mit Mäher und Heckenschere. Beim Scrollen wechseln die Illustrationen passend zur jeweiligen Leistung. Jede Leistungsseite enthält zusätzlich ihre eigene Szene.

Die Szenen werden mit nativem WebGL gezeichnet und benötigen keine externen Bibliotheken oder Mediendownloads. Bei fehlender WebGL-Unterstützung erscheinen animierte Vektorillustrationen. Die Abbildungen sind illustrative Darstellungen der Leistungen und keine Dokumentation eines tatsächlichen Fuhrparks.

Die Animationen lassen sich über die Pause-Taste im Kopfbereich anhalten. Reduzierte Bewegung wird beim Start berücksichtigt. Render-Schleifen pausieren außerhalb des sichtbaren Bereichs und bei verborgenem Browser-Tab; die Pixeldichte wird begrenzt. Szenenwahl und Anfrage sind mit der Tastatur bedienbar.

Geometrien, Matrizen, Animationszeitpunkte, Fallback, Szenensteuerung und Anfrage-Logik wurden separat geprüft. Eine echte GPU-/Browserdarstellung konnte in der Arbeitsumgebung wegen einer nicht verfügbaren administrativen Browser-Sicherheitsprüfung nicht geprüft werden.

## Entwurfsstand

Diese Seite ist eine Gestaltungs-Vorschau. Die rechtlichen Anbieterangaben und die endgültigen Datenschutzhinweise sind noch zu vervollständigen. Suchmaschinenindexierung ist vorläufig deaktiviert. Preise, Bewertungen und Versicherungsangaben wurden nicht erfunden.

Die Fotos sind generierte Symbolbilder, keine Referenzaufnahmen. Die RT-Grafik ist eine Vektoradaption des übergebenen Markenmotivs. Manrope wird lokal geladen; die SIL-Open-Font-Lizenz liegt in `docs/assets/Manrope-OFL.txt`.

## Änderungen

Änderungen an `docs/` werden nach einem Push von GitHub Pages veröffentlicht. Die relativen Verweise funktionieren auch unter dem Projektpfad der GitHub-Pages-Adresse. `docs/assets/flyer-a5.pdf` enthält den überarbeiteten Flyer.
