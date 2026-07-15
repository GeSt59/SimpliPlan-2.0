# PROJ-11: Teilnehmer-Übersicht (Admin)

## Status: In Progress
**Created:** 2026-07-15
**Last Updated:** 2026-07-15 (Backend fertig: Endpunkt end-to-end verifiziert, 15 Integrationstests)

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

## Frontend Implementation Notes

**Gebaut:**
- `src/lib/activities.ts` — `resolveMemberId` (löst einen `eingeteilte_users`-Eintrag auf die echte Supabase-`id` auf, auch bei einem adalo_id-Alteintrag; der neue Admin-Endpunkt braucht immer die echte `id`), `isMemberInRefs` (prüft, ob ein Mitglied per `id`/`adalo_id` bereits in einer Liste steckt — Basis für die "wer kann noch hinzugefügt werden"-Filterung)
- `src/app/api/einstellungen/[id]/teilnehmer/route.ts` (NEU) — POST-Endpunkt, getrennt vom PROJ-10-Selbst-Anmeldung-Endpunkt: prüft zuerst `users.admin`, dann dass sowohl der Zeitbereich (RLS-scoped SELECT) als auch das Ziel-Mitglied (Lookup über `mitglieder_namen`, ebenfalls verein-beschränkt) zum eigenen Verein gehören; erst danach wird die im Request angegebene `mitgliedId` ein-/ausgetragen
- `src/app/activities/[id]/uebersicht/page.tsx` (GEÄNDERT) — lädt zusätzlich `isAdmin` und die volle Mitgliederliste (`mitglieder_namen`); pro Zeile jetzt: "Entfernen"-Icon je Name (nur Admin, mit `AlertDialog`-Bestätigung), "Mitglied hinzufügen"-Button (nur Admin) öffnet einen gemeinsamen `CommandDialog` mit durchsuchbarer, gefilterter Mitgliederliste (bereits Zugesagte ausgeblendet über `isMemberInRefs`), "Drucken"-Button (nur Admin) ruft `window.print()`
- `src/app/globals.css` (GEÄNDERT) — globale `@media print`-Regel blendet `nav`-Elemente (Bottom-Tab-Bar) beim Drucken aus; auf der Übersicht-Seite selbst blenden `print:hidden`-Klassen Zurück-Pfeil, Drucken-Button, Status-Icons, Entfernen-/Hinzufügen-Buttons und den "Zurück zur Anmeldung"-Button aus — Zeitbereich-Label, Rolle, Zahlen und Namen bleiben sichtbar

**Keine Datumsprüfung ergänzt (wie geplant):** Die Seite prüft weiterhin nicht, ob die Activity vergangen ist — Admin-Aktionen funktionieren dadurch bereits für archivierte Activities, ohne zusätzlichen Code (Architektur-Entscheidung bereits umgesetzt).

**Hinweis zur Commit-Historie:** `src/app/activities/[id]/uebersicht/page.tsx` enthielt bereits vor Beginn von PROJ-11 ein unfertiges, nicht committetes Layout-Redesign (zentrierter `max-w-[600px]`-Container, neue Schatten-/Rahmenstile) aus einer separaten, parallelen Arbeit des Users. Da die neuen PROJ-11-Elemente direkt auf dieser bestehenden Struktur aufbauen mussten, lässt sich dieser Layout-Anteil nicht mehr sauber vom PROJ-11-Funktionsanteil trennen — der Commit für PROJ-11 trägt ihn für diese eine Datei zwangsläufig mit. Alle anderen Dateien mit demselben unfertigen Redesign (Rollen/Kategorien/Mitglieder/Profil/Bottom-Tab-Bar-Komponente selbst/weitere Activity-Unterseiten) bleiben weiterhin unangetastet und uncommitted.

**Nicht getestet (erwartete Blocker für `/backend`, analog zu allen bisherigen Features):**
- Der neue Endpunkt wurde nur gegen den TypeScript-Compiler geprüft, noch nicht live mit echten Admin-/Mitglieds-Accounts gegen die echte Supabase-Instanz
- Die tatsächliche Berechtigungsprüfung (Admin-Check, Cross-Tenant-Schutz über `mitglieder_namen`) ist im Code vorhanden, aber noch nicht end-to-end verifiziert

**Verifiziert:** `npm run build` läuft sauber durch (neue Route `/api/einstellungen/[id]/teilnehmer` kompiliert fehlerfrei). `npm test`: 70/70 (63 bestehend + 7 neue Unit-Tests für `resolveMemberId`/`isMemberInRefs`). Dev-Server-Smoke-Test der Übersicht-Route ohne Serverfehler.

## Backend Implementation Notes

**Keine DB-Migration nötig.** PROJ-11 nutzt ausschließlich bereits vorhandene Infrastruktur aus PROJ-9/10 (`einstellungen.eingeteilte_users`, `mitglieder_namen`-View, `users.admin`) — keine neue Tabelle, Spalte, Policy oder View.

**Gebaut:**
- `src/app/api/einstellungen/[id]/teilnehmer/teilnehmer.test.ts` (NEU) — 15 Vitest-Integrationstests für den in `/frontend` gebauten Endpunkt: ungültige/fehlende Eingaben (400), fehlende/ungültige Session (401), Nicht-Admin-Aufrufer (403), RLS-verstecktes Zeitbereich (403), Ziel-Mitglied aus fremdem Verein via `mitglieder_namen` nicht sichtbar (403), Hinzufügen (inkl. Idempotenz bei bereits vorhandenem Eintrag), Entfernen (inkl. `adalo_id`-Altdaten-Fallback, inkl. No-Op bei nicht vorhandenem Mitglied), Datenbankfehler (500) — durchgängig mit gemockten `supabase-scoped`/`supabase-admin`-Clients, analog zum bereits etablierten Testmuster aus `mitglieder-id.test.ts`

**Manuell verifiziert** (per Skript mit echten JWTs gegen die echte Supabase-Instanz und den laufenden Dev-Server, mit isolierten, danach vollständig entfernten Testdaten — 2 Test-Vereine, 1 Test-Admin + 2 Test-Mitglieder in Verein A, 1 Test-Mitglied in Verein B, 1 echter Zeitbereich mit `ben=3`):
- **Hinzufügen:** Admin trägt ein Mitglied erfolgreich ein (200); erneutes Hinzufügen erzeugt keinen Duplikat-Eintrag
- **Entfernen:** Admin entfernt das Mitglied wieder erfolgreich (200), Eintrag verschwindet aus der Liste
- **Autorisierung:** Nicht-Admin-Mitglied erhält 403 beim Versuch, jemanden hinzuzufügen
- **Cross-Tenant-Schutz (Ziel):** Admin kann kein Mitglied eines fremden Vereins hinzufügen (403), Datenbank-Zustand danach per Service-Role-Abfrage bestätigt unverändert
- **Cross-Tenant-Schutz (Zeitbereich):** Ein Mitglied eines fremden Vereins kann nicht einmal einen Versuch gegen einen fremden Zeitbereich starten (403, RLS versteckt die Zeile bereits)
- **Auth/Validierung:** Unauthentifizierte Anfrage liefert 401, ungültiger `action`-Wert liefert 400

**Verifiziert:** `npm run build` weiterhin sauber, `npm test`: 85/85 (70 bestehend + 15 neue Integrationstests für den Teilnehmer-Endpunkt).

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
