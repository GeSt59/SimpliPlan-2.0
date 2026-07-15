# PROJ-11: Teilnehmer-Übersicht (Admin)

## Status: Architected
**Created:** 2026-07-15
**Last Updated:** 2026-07-15 (Tech Design abgeschlossen)

## Dependencies
- PROJ-1 (Supabase Infrastruktur Multi-Tenant + RLS) — für RLS-Policies, die Zugriff auf den eigenen Verein beschränken
- PROJ-3 (Authentifizierung) — für eingeloggten Admin-Zugriff und die Verein-Zuordnung
- PROJ-9 (Zeitbereiche CRUD) — liefert die `einstellungen`-Tabelle und `eingeteilte_users`-Spalte
- PROJ-10 (Mitglied-Anmeldung zu Zeitbereichen) — liefert die bestehende Übersicht-Seite (`/activities/[id]/uebersicht`), die PROJ-11 um Admin-Aktionen erweitert, sowie das serverseitige Muster für sichere Selbst-/Fremdänderung von `eingeteilte_users`

## User Stories
- Als Admin möchte ich auf der Übersicht-Seite ein Mitglied direkt zu einem Zeitbereich hinzufügen können, damit ich telefonische oder kurzfristige Zusagen sofort eintragen kann, ohne dass das Mitglied selbst die App nutzen muss.
- Als Admin möchte ich ein bereits eingetragenes Mitglied aus einem Zeitbereich entfernen können, damit ich Absagen oder Fehleinträge korrigieren kann.
- Als Admin möchte ich beim Entfernen eine Bestätigung sehen, damit ich nicht versehentlich die Zusage eines anderen Mitglieds lösche.
- Als Admin möchte ich diese Korrekturen auch nach der Activity noch vornehmen können, damit ich die tatsächliche Teilnahme nachträglich dokumentieren kann.
- Als Admin möchte ich eine druckfreundliche Teilnehmerliste einer Activity öffnen können, damit ich sie am Veranstaltungstag griffbereit habe.
- Als Mitglied (kein Admin) möchte ich weiterhin nur die reine Lese-Ansicht der Übersicht sehen, ohne die neuen Admin-Aktionen, damit meine Berechtigungen unverändert bleiben.

## Out of Scope
- Export als CSV oder Datei-Download — nur eine druckfreundliche Ansicht direkt im Browser (Nutzerentscheidung im Interview)
- Kontaktdaten (Telefon, E-Mail) in der Druckansicht — nur Namen, analog zur bestehenden Übersicht-Seite (Datensparsamkeit, gleiche Begründung wie PROJ-10)
- Benachrichtigung des betroffenen Mitglieds bei Admin-Ein-/Austragung (E-Mail/Push) — im Projekt existiert kein Benachrichtigungssystem
- Nachverfolgung, ob eine Zusage durch Selbstanmeldung (PROJ-10) oder Admin-Eintragung (PROJ-11) entstanden ist — beide erzeugen denselben `eingeteilte_users`-Eintrag ohne Unterscheidung
- Überschneidungsprüfung beim admin-seitigen Hinzufügen (ob ein Mitglied bereits für einen anderen Zeitbereich derselben Activity zugesagt hat) — bewusst nicht geprüft, analog zur PROJ-10-Entscheidung
- Harte Kapazitätsgrenze beim admin-seitigen Hinzufügen — kein Blocker, konsistent mit dem PROJ-10-Muster "nur Warnung, kein Blocker"
- Stub-Zeitbereiche (benötigt=0, keine Rolle) in der Admin-Übersicht — bleiben ausgeblendet, analog zu PROJ-10
- Bearbeiten der Zeitbereiche selbst (Label/benötigt/Rolle/Zeiten) — bleibt vollständig PROJ-9
- Eigene Route/URL für die Druckansicht — Drucken läuft direkt über den Browser-Druckdialog von der bestehenden Übersicht-Seite aus (Nutzerentscheidung im Interview)
- Neue Verwaltungsseite — PROJ-11 erweitert ausschließlich die bestehende Übersicht-Seite aus PROJ-10 (Nutzerentscheidung im Interview)

## Acceptance Criteria

**Format:** Angenommen [Vorbedingung] / Wenn [Aktion] / Dann [Ergebnis]

- [ ] Angenommen ein Admin öffnet die Übersicht-Seite einer Activity, dann sieht er zusätzlich zu den bestehenden Elementen (Zahlen, Status-Icon, Namen) pro Zeitbereich einen "Entfernen"-Button neben jedem Namen sowie einen "Mitglied hinzufügen"-Button
- [ ] Angenommen ein Mitglied (kein Admin) öffnet dieselbe Übersicht-Seite, dann sieht es weiterhin ausschließlich die reine Lese-Ansicht aus PROJ-10, ohne die neuen Admin-Aktionen
- [ ] Angenommen ein Admin klickt "Mitglied hinzufügen" bei einem Zeitbereich, dann öffnet sich eine durchsuchbare Liste aller Vereinsmitglieder, die diesem Zeitbereich noch nicht zugesagt haben
- [ ] Angenommen der Admin wählt ein Mitglied aus dieser Liste aus, dann wird es sofort zum Zeitbereich hinzugefügt, erscheint in der Namensliste, und der "kommen"-Zähler erhöht sich
- [ ] Angenommen ein Zeitbereich ist bereits voll oder überbucht (kommen ≥ benötigt), wenn der Admin trotzdem ein weiteres Mitglied hinzufügt, dann wird das Hinzufügen nicht blockiert
- [ ] Angenommen ein Admin klickt auf "Entfernen" neben einem Namen, dann erscheint ein Bestätigungsdialog; erst nach Bestätigung wird das Mitglied aus dem Zeitbereich entfernt
- [ ] Angenommen der Admin bricht den Bestätigungsdialog ab, dann bleibt das Mitglied unverändert eingetragen
- [ ] Angenommen die Activity liegt bereits in der Vergangenheit (Archiv), dann kann der Admin trotzdem Mitglieder zu Zeitbereichen hinzufügen oder daraus entfernen (im Unterschied zur Selbstanmeldung aus PROJ-10, die für vergangene Activities weiterhin gesperrt bleibt)
- [ ] Angenommen ein Admin klickt auf einen neuen "Drucken"-Button auf der Übersicht-Seite, dann öffnet sich der Browser-Druckdialog mit einer angepassten Druckansicht (App-Navigation, Buttons und Status-Icons ausgeblendet; Zeitbereich-Label, Rolle, kommen/benötigt sowie Namen aller Zugesagten bleiben sichtbar)
- [ ] Angenommen ein Mitglied (kein Admin) ist auf der Übersicht-Seite, dann sieht es den "Drucken"-Button nicht
- [ ] Angenommen ein Admin versucht per direktem API-Aufruf, ein Mitglied eines anderen Vereins zu einem fremden Zeitbereich hinzuzufügen oder daraus zu entfernen, dann wird das serverseitig verweigert
- [ ] Angenommen der Verein hat keine weiteren Mitglieder, die noch nicht zugesagt haben, wenn der Admin "Mitglied hinzufügen" öffnet, dann zeigt die Auswahlliste einen entsprechenden Leerzustand
- [ ] Angenommen die Supabase-API ist beim Hinzufügen/Entfernen nicht erreichbar, dann wird eine Fehlermeldung angezeigt und der zuvor angezeigte Zustand bleibt sichtbar erhalten

## Edge Cases
- Admin entfernt sich selbst aus einem Zeitbereich über die neue Admin-Aktion (statt die eigene Checkbox auf der Anmeldung-Seite aus PROJ-10 zu nutzen) → funktioniert identisch, kein Sonderfall
- Admin fügt ein bereits zugesagtes Mitglied erneut hinzu (z.B. durch eine Race Condition zwischen zwei offenen Admin-Tabs) → kein Duplikat, da dieselbe serverseitige Logik wie bei PROJ-10 verwendet wird
- Zwei Admins bearbeiten gleichzeitig denselben Zeitbereich (einer entfernt ein Mitglied, der andere fügt gleichzeitig ein anderes hinzu) → kein Locking im MVP, Last-Write-Wins, analog zu PROJ-8/9/10
- Admin öffnet die Druckansicht für eine Activity ohne einen einzigen Zeitbereich mit benötigt > 0 → entsprechender Leerzustand statt einer leeren Druckseite
- Ein per Admin hinzugefügtes Mitglied wird zwischenzeitlich deaktiviert (`aktiv=false`) → bleibt im Zeitbereich eingetragen, keine automatische Entfernung (analog zu bestehenden Mustern aus PROJ-10)
- Admin fügt sich selbst oder ein anderes Mitglied zu einem Zeitbereich einer bereits vergangenen Activity hinzu → erlaubt (siehe AC), keine Sonderbehandlung gegenüber kommenden Activities außer dem generell fehlenden Zugriff für Mitglieder (PROJ-10)

## Technical Requirements (optional)
- Security: Admin-Aktionen (Hinzufügen/Entfernen) nur für Admins des eigenen Vereins; serverseitige Prüfung, dass sowohl der Zeitbereich als auch das betroffene Mitglied zum eigenen Verein gehören
- Vermutlich Erweiterung des bestehenden Selbst-Anmeldung-Server-Endpunkts aus PROJ-10 um einen admin-spezifischen Pfad, oder ein neuer, getrennter Endpunkt — technische Entscheidung folgt in `/architecture`
- Druckansicht: reines CSS-Print-Stylesheet auf der bestehenden Übersicht-Seite (kein Server-seitiges PDF, keine neue Route) — Details zur Umsetzung folgen in `/architecture`
- Mitglieder-Suche im "Hinzufügen"-Dialog: durchsuchbare Liste aller Vereinsmitglieder ohne bestehende Zusage zu diesem Zeitbereich — voraussichtlich Wiederverwendung der `mitglieder_namen`-View aus PROJ-10 oder ähnlicher Namensauflösung

## Open Questions
Keine offenen Fragen aus dem Interview — alle Kernentscheidungen wurden getroffen.

## Decision Log

### Product Decisions
| Decision | Rationale | Date |
|----------|-----------|------|
| PROJ-11 erweitert die bestehende Übersicht-Seite aus PROJ-10 um Admin-Aktionen, statt eine neue Verwaltungsseite zu bauen | Nutzerentscheidung im Interview; kleinstmögliche Erweiterung, kein Duplikat der bereits vorhandenen Zeitbereich-Liste mit Zahlen/Namen | 2026-07-15 |
| Mitglied hinzufügen läuft über eine durchsuchbare Auswahlliste aller noch nicht zugesagten Vereinsmitglieder, nicht per Freitext-Suche | Nutzerentscheidung im Interview; robuster bei ähnlichen Namen, analog zur bestehenden Mitgliedersuche (PROJ-7) | 2026-07-15 |
| Entfernen eines Mitglieds durch den Admin erfordert einen Bestätigungsdialog | Nutzerentscheidung im Interview; der Admin handelt hier stellvertretend für ein fremdes Mitglied (nicht die eigene Zusage wie bei PROJ-10), ein Schutz vor Versehen ist daher gerechtfertigt — analog zum bestehenden Lösch-Bestätigungsmuster aus PROJ-8/9 | 2026-07-15 |
| Admin-Hinzufügen wird nicht blockiert, auch wenn der Zeitbereich bereits voll/übervoll ist | Nutzerentscheidung im Interview; konsistent mit dem in PROJ-10 etablierten "nur Warnung, kein Blocker"-Muster | 2026-07-15 |
| Export bewusst in PROJ-11 aufgenommen (nicht auf ein späteres Feature verschoben), aber nur als druckfreundliche Browser-Ansicht, kein CSV-Download | Nutzerentscheidung im Interview; deckt den unmittelbaren Bedarf (Liste am Veranstaltungstag griffbereit) minimal-invasiv ab, ohne Datei-Export-Infrastruktur aufzubauen | 2026-07-15 |
| Druckansicht zeigt nur Namen, keine Kontaktdaten (Telefon/E-Mail) | Nutzerentscheidung im Interview; konsistent mit dem datensparsamen Ansatz aus PROJ-10 — eine druckbare/teilbare Ansicht ist ein höheres Datenschutz-Risiko als eine reine App-Ansicht | 2026-07-15 |
| Drucken läuft direkt über den Browser-Druckdialog von der bestehenden Übersicht-Seite aus, keine eigene Druck-Route | Nutzerentscheidung im Interview; kleinstmögliche Umsetzung, kein zusätzlicher Seiten-/Routing-Aufwand | 2026-07-15 |
| Admin-Aktionen (Hinzufügen/Entfernen) sind auch für bereits vergangene (archivierte) Activities erlaubt | Nutzerentscheidung im Interview; Admins korrigieren häufig nachträglich die tatsächliche Teilnahme — im Unterschied zur Selbstanmeldung aus PROJ-10, die für die Vergangenheit bewusst gesperrt bleibt, da sie keinen Sinn ergibt | 2026-07-15 |

### Technical Decisions
<!-- Added by /architecture -->
| Decision | Rationale | Date |
|----------|-----------|------|
| Neuer, getrennter Server-Endpunkt für Admin-Teilnehmerverwaltung statt Erweiterung des bestehenden PROJ-10-Selbst-Anmeldung-Endpunkts | Nutzerentscheidung im Interview; hält die einfache Sicherheitsgarantie des bestehenden Endpunkts ("nur eigene ID") unangetastet, statt zwei Berechtigungsmodelle in einer Funktion zu mischen. Gleiches Muster wie der bereits bestehende dedizierte `/api/mitglieder/[id]`-Admin-Endpunkt | 2026-07-15 |
| Auswahlliste im "Hinzufügen"-Dialog nutzt die bestehende `mitglieder_namen`-View (PROJ-10) und filtert clientseitig gegen die bereits geladene `eingeteilte_users`-Liste | Keine neue Datenbank-Abfrage nötig; die View wurde in PROJ-10 bereits genau für die verein-beschränkte Namensauflösung gebaut | 2026-07-15 |
| Druckansicht als CSS-Print-Stylesheet auf der bestehenden Übersicht-Seite, keine eigene Route/Komponente | Setzt die Spec-Entscheidung um (kein eigenständiger Export); deutlich weniger Aufwand als eine zweite gepflegte Ansicht derselben Daten | 2026-07-15 |
| Keine zusätzliche Datumsprüfung für die neuen Admin-Elemente auf der Übersicht-Seite | Die Seite ist bereits unabhängig vom Activity-Datum erreichbar (PROJ-10-Korrektur über das Archiv); Admin-Korrekturen sollen laut Spec explizit auch für vergangene Activities funktionieren | 2026-07-15 |
| Auswahlliste nutzt die bereits installierte shadcn-`command`-Komponente, Bestätigungsdialog die bereits installierte `alert-dialog`-Komponente | Keine neuen Pakete nötig, konsistent mit dem bereits im Projekt etablierten Lösch-Bestätigungsmuster (PROJ-8/9) | 2026-07-15 |

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)

### A) Component Structure

```
Übersicht-Seite "/activities/[id]/uebersicht" (PROJ-10, ERWEITERT)
├── Zugriffsprüfung unverändert (jeder eingeloggte Nutzer des eigenen Vereins)
├── NEU: "Drucken"-Button (nur für Admins sichtbar) → öffnet den Browser-
│   Druckdialog; ein Druck-Stylesheet blendet Navigation, Buttons und
│   Status-Icons aus, Zeitbereich-Label/Rolle/kommen/benötigt/Namen bleiben
├── Je Zeitbereich-Zeile (nur für Admins zusätzlich sichtbar):
│   ├── NEU: "Entfernen"-Icon neben jedem Namen in der Namensliste
│   │   → öffnet Bestätigungsdialog → nach Bestätigung: Mitglied entfernt
│   └── NEU: Button "Mitglied hinzufügen"
│       → öffnet eine durchsuchbare Auswahlliste (bereits zugesagte
│         Mitglieder sind ausgeblendet; leerer Vereinsbestand → Leerzustand)
│       → Auswahl trägt das Mitglied sofort ein, kein weiterer Klick nötig
└── Für Mitglieder (kein Admin): unverändert reine Lese-Ansicht aus PROJ-10,
    keines der drei neuen Elemente sichtbar

Neuer Server-Endpunkt "Zeitbereich-Teilnehmer verwalten" (NEU, kein UI)
└── Getrennt vom bestehenden Selbst-Anmeldung-Endpunkt aus PROJ-10 (der bleibt
    unverändert: akzeptiert nie eine fremde Mitglieds-ID). Der neue Endpunkt:
    Prüft zuerst, ob der Aufrufer wirklich Admin des Vereins ist, zu dem der
    Zeitbereich gehört. Erst danach akzeptiert er eine im Request angegebene
    Ziel-Mitglieds-ID und trägt genau diese ein oder aus — unabhängig davon,
    ob es sich um den Admin selbst oder ein beliebiges anderes Mitglied des
    eigenen Vereins handelt. Kein Zugriff auf Zeitbereiche fremder Vereine.
```

### B) Data Model (fachlich, kein Code)

- Keine neue Tabelle, keine neue Spalte. Nutzt weiterhin `einstellungen.eingeteilte_users` (PROJ-9/10) sowie die bereits bestehende `mitglieder_namen`-View (PROJ-10) für die Namensauflösung in der Auswahlliste des "Hinzufügen"-Dialogs.
- Die Auswahlliste im "Hinzufügen"-Dialog wird aus zwei bereits vorhandenen Datenquellen gebildet: allen Mitgliedern des Vereins (`mitglieder_namen`) minus der bereits im Zeitbereich eingetragenen (`eingeteilte_users`) — keine neue Abfrage-Logik auf Datenbankebene nötig, reine Differenzbildung.
- Kein neues Feld zur Unterscheidung "Selbstanmeldung vs. Admin-Eintragung" (siehe Out of Scope) — beide Wege schreiben denselben `eingeteilte_users`-Eintrag.

### C) Tech-Entscheidungen (Begründung für PM)

- **Getrennter neuer Endpunkt statt Erweiterung des bestehenden Selbst-Anmeldung-Endpunkts**: Der PROJ-10-Endpunkt hat eine einfache, leicht nachvollziehbare Sicherheitsgarantie ("ändert ausschließlich die eigene ID, nie die eines anderen"). Würde man ihn um einen Admin-Zweig erweitern, hätte eine einzige Funktion zwei unterschiedliche Berechtigungsmodelle gleichzeitig zu prüfen — fehleranfälliger und schwerer zu überblicken als zwei kleine, jeweils einzweckige Endpunkte. Gleiches Muster wie bereits an anderer Stelle im Projekt: `/api/mitglieder/[id]` ist ebenfalls ein dedizierter Admin-Endpunkt, getrennt von den Selbstbedienungs-Pfaden.
- **Kein neues UI-Paket für die Auswahlliste**: Die shadcn-Komponente `command` (durchsuchbare Auswahlliste) ist bereits im Projekt installiert und wird direkt wiederverwendet.
- **Druckansicht über CSS statt eigener Route/Komponente**: Ein Druck-spezifisches Stylesheet auf der bestehenden Seite blendet nur die interaktiven/App-spezifischen Elemente aus — deutlich einfacher als eine zweite, gepflegte Ansicht derselben Daten.
- **Keine Datumsgrenze für Admin-Aktionen**: Anders als die Selbstanmeldung (PROJ-10) prüft die Übersicht-Seite für die neuen Admin-Elemente nicht, ob die Activity in der Vergangenheit liegt — sie war ohnehin schon über das Archiv erreichbar (PROJ-10-Korrektur), Admin-Korrekturen sollen dort laut Spec ausdrücklich weiter möglich sein.
- **Wiederverwendung von `mitglieder_namen` statt einer neuen View**: Die View wurde in PROJ-10 bereits für genau diesen Zweck (Namensauflösung, auf den eigenen Verein beschränkt) gebaut und deckt exakt den Bedarf der neuen Auswahlliste ab.

### D) Dependencies

- Keine neuen Pakete: `@supabase/supabase-js`, `zod`, `shadcn/ui` (`command`, `alert-dialog` — beide bereits installiert)
- Der neue Endpunkt nutzt dieselbe bereits vorhandene Infrastruktur wie `/api/mitglieder/[id]` und `/api/einstellungen/[id]/anmeldung` (Zugriffsprüfung anhand der Anfrage + privilegierter Datenbankzugriff für die eigentliche Änderung)

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
