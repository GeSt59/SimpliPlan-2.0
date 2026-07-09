# PROJ-4: Verein-Verwaltung & Voreinstellungen (Tab-Namen)

## Status: Planned
**Created:** 2026-07-09
**Last Updated:** 2026-07-09

## Dependencies
- PROJ-1 (Supabase Infrastruktur Multi-Tenant + RLS) — für RLS-Policies, die den Admin ausschließlich auf Daten des eigenen Vereins beschränken
- PROJ-3 (Authentifizierung) — für eingeloggten Admin-Zugriff (`users.admin`) und die Verein-Zuordnung des Nutzers

## User Stories
- Als Admin möchte ich die Stammdaten meines Vereins (Name, Logo) bearbeiten, damit die App die aktuellen Vereinsinformationen zeigt.
- Als Admin möchte ich die 5 Navigations-Tab-Namen meines Vereins individuell benennen, damit die App-Navigation zur Sprache/Terminologie meines Vereins passt (z.B. "Lions" statt "Mitglieder").
- Als Admin möchte ich den Freischaltcode meines Vereins ändern können, damit ich bei Bedarf (z.B. Kompromittierung) den Zugang zur Registrierung neu vergeben kann.
- Als Admin möchte ich gewarnt werden, bevor ich den Freischaltcode ändere, damit ich nicht versehentlich bereits verteilte Codes ungültig mache.
- Als Mitglied möchte ich beim direkten Aufruf der Einstellungsseite automatisch zur Startseite umgeleitet werden, damit ich keine administrativen Funktionen sehe, die mir nicht zustehen.

## Out of Scope
- Bearbeiten von `vereinsnummer` (interner/historischer Identifier, kein Bearbeitungsbedarf erkennbar)
- Bearbeiten von `freigeschaltet` (exklusiv SuperUser-Steuerung, siehe PROJ-3 Open Questions — kein Feature für SuperUser-Rechtevergabe existiert bisher)
- Anlegen neuer Vereine (gehört zu PROJ-1/Infrastruktur bzw. einem künftigen SuperUser-Feature)
- SuperUser-Zugriff auf Vereinseinstellungen anderer Vereine
- Echte Navigationsleiste mit den 5 Tabs (Anzeige/Routing) — PROJ-4 liefert nur die Textwerte; die eigentliche Navigation entsteht mit späteren Features (Activities, Kategorien, Mitgliederliste, Profil)
- Rollenabhängige Sichtbarkeit der Tabs (Admin sieht 5, Mitglied sieht 2) — Anzeige-Logik ist Teil der künftigen Navigations-Implementierung, nicht dieses Specs
- Zentraler Admin-Guard/Middleware für alle Admin-Seiten — PROJ-4 prüft `users.admin` clientseitig nur für die eigene Seite (siehe PROJ-3 Technical Decisions, Middleware zurückgestellt)

## Acceptance Criteria

**Format:** Angenommen [Vorbedingung] / Wenn [Aktion] / Dann [Ergebnis]

- [ ] Angenommen ein Admin ist eingeloggt, wenn er die Startseite aufruft, dann sieht er einen Link "Vereinseinstellungen" zu `/voreinstellung`
- [ ] Angenommen ein Mitglied (kein Admin) ist eingeloggt, wenn es die Startseite aufruft, dann sieht es keinen Link zu `/voreinstellung`
- [ ] Angenommen ein Admin ruft `/voreinstellung` auf, dann sind alle aktuellen Werte seines Vereins (Name, Logo, Tab-Namen, Freischaltcode) im Formular vorausgefüllt
- [ ] Angenommen ein Mitglied (kein Admin) ruft `/voreinstellung` direkt über die URL auf, dann wird es sofort zu "/" umgeleitet
- [ ] Angenommen der Admin ändert den Vereinsnamen und/oder einen oder mehrere Tab-Namen und klickt "Speichern", dann werden die Änderungen gespeichert und eine Erfolgsmeldung angezeigt
- [ ] Angenommen ein Tab-Name-Feld wird geleert, wenn der Admin speichert, dann wird der leere Wert ohne Fehlermeldung übernommen (kein Pflichtfeld)
- [ ] Angenommen der Vereinsname ist leer, wenn der Admin speichert, dann wird ein Validierungsfehler angezeigt und nicht gespeichert
- [ ] Angenommen der Admin lädt eine Bilddatei als neues Logo hoch, wenn der Upload abgeschlossen ist, dann wird eine Vorschau des neuen Logos angezeigt, bevor gespeichert wird
- [ ] Angenommen der Admin lädt eine Datei hoch, die kein unterstütztes Bildformat ist oder die maximale Dateigröße überschreitet, dann wird eine Fehlermeldung angezeigt und der Upload abgebrochen
- [ ] Angenommen der Admin ändert den Freischaltcode und klickt "Speichern", dann erscheint zuerst ein Bestätigungsdialog mit dem Hinweis, dass bereits verteilte Codes danach ungültig werden
- [ ] Angenommen der Bestätigungsdialog zur Freischaltcode-Änderung wird abgebrochen, dann wird nichts gespeichert und das Formular bleibt im Bearbeitungszustand
- [ ] Angenommen der Bestätigungsdialog zur Freischaltcode-Änderung wird bestätigt, dann wird der neue Code gespeichert und ist ab sofort der einzig gültige Code für neue Registrierungen
- [ ] Angenommen die Supabase-API ist beim Speichern nicht erreichbar, dann wird eine Fehlermeldung angezeigt und die Formulareingaben bleiben erhalten
- [ ] Angenommen ein Admin von Verein A ist eingeloggt, dann zeigt und speichert `/voreinstellung` ausschließlich Daten von Verein A (nie Daten eines anderen Vereins)

## Edge Cases
- Admin lässt das Vereinsname-Feld beim Speichern leer → Validierungsfehler, kein Speichern (siehe AC)
- Zwei Admins desselben Vereins bearbeiten gleichzeitig die Einstellungen → kein Locking im MVP, letzter Speichervorgang gewinnt (Last-Write-Wins)
- Admin ändert Freischaltcode, bricht den Bestätigungsdialog aber ab, nachdem er auch Vereinsname/Tabs geändert hat → keines der Felder wird gespeichert (ein gemeinsamer Save-Vorgang, kein Teil-Speichern)
- Admin lädt ein sehr großes oder falsches Dateiformat als Logo hoch → Fehlermeldung, alter Logo-Wert bleibt unverändert
- Direkter URL-Aufruf von `/voreinstellung` durch ein Mitglied eines anderen Vereins → derselbe Redirect wie bei jedem Nicht-Admin (kein Unterschied nach Verein)
- Admin meldet sich ab, während das Formular ungespeicherte Änderungen hat → kein Autosave, ungespeicherte Änderungen gehen verloren (Standard-Browser-Verhalten, kein eigener Warnhinweis im MVP)

## Technical Requirements (optional)
- Security: Zugriff nur für `users.admin = true` des eigenen Vereins; RLS beschränkt Lese-/Schreibzugriff auf `vereine`-Zeile des eigenen Vereins (Cross-Tenant-Schutz, zentrales Projektversprechen)
- Logo-Upload: unterstützte Formate PNG/JPG/SVG, max. Dateigröße (Vorschlag 2 MB) — via Supabase Storage
- Tab-Namen: max. Länge (Vorschlag 20 Zeichen) wegen begrenztem Platz in der Navigationsleiste, aber kein Pflichtfeld

## Open Questions
- [x] Maximale Dateigröße/exakte erlaubte Formate für den Logo-Upload → entschieden: PNG/JPG/SVG, max. 2 MB (siehe Technical Decisions)
- [x] Maximale Zeichenlänge für Tab-Namen → entschieden: 20 Zeichen (siehe Technical Decisions)
- [ ] Soll es einen Warnhinweis bei ungespeicherten Änderungen beim Verlassen der Seite geben? Für MVP bewusst nicht gebaut (siehe Edge Cases)
- [ ] Die zwei bestehenden Lese-RLS-Policies auf `vereine` vergleichen unterschiedliche Felder (`vereine.adalo_id = ANY(u.verein)` vs. `vereine.id IN (unnest(u.verein))`) — möglicher bestehender Bug. `/backend` muss vor Anlage der neuen Update-Policy klären, welches Feld tatsächlich korrekt mit `users.verein` übereinstimmt

## Decision Log

### Product Decisions
| Decision | Rationale | Date |
|----------|-----------|------|
| Tab-Namen (tab1–tab5) sind reine Umbenennung der Navigations-Labels, keine Ein-/Ausblend-Funktion | Nutzerentscheidung im Interview; Sichtbarkeit einzelner Tabs ist kein Thema dieses Features | 2026-07-09 |
| Feature ist ausschließlich für den Admin des eigenen Vereins, keine SuperUser-Funktion und keine Vereins-Neuanlage | Konsistent mit PRD-Rollenmodell; Vereins-Neuanlage gehört zu Infrastruktur/PROJ-1 | 2026-07-09 |
| Editierbare Felder: vereinsname, vereinslogo, tab1–tab5, freischaltcode. Nicht editierbar: vereinsnummer, freigeschaltet | vereinsnummer wirkt als interner/historischer Identifier ohne Bearbeitungsbedarf; freigeschaltet ist exklusiv SuperUser-Steuerung (siehe PROJ-3) | 2026-07-09 |
| Tab-Namen dürfen leer bleiben, ohne dass ein Default-Wert einspringt | Nutzerentscheidung im Interview; das Verhalten einer leeren Anzeige liegt bei der künftigen Navigations-Implementierung, nicht bei PROJ-4 | 2026-07-09 |
| Änderung des Freischaltcodes erfordert einen Bestätigungsdialog, alle anderen Felder werden ohne Extra-Warnung gespeichert | Nutzerentscheidung im Interview: alte, bereits verteilte Codes werden beim Ändern sofort ungültig — Admin soll das nicht versehentlich auslösen | 2026-07-09 |
| Einstiegspunkt ist ein sichtbarer Link "Vereinseinstellungen" auf der Startseite für eingeloggte Admins, URL `/voreinstellung` | Es existiert noch keine App-Navigation; einfachste Lösung, die nicht auf ein künftiges Navigations-Feature wartet | 2026-07-09 |
| Zugriffsschutz erfolgt durch client-seitige Prüfung von `users.admin` mit Redirect zu "/", kein zentraler Middleware-Guard | Konsistent mit PROJ-3-Entscheidung, Middleware zurückzustellen, bis mehrere geschützte Seiten existieren; RLS bleibt die eigentliche Sicherheitsgrenze | 2026-07-09 |

### Technical Decisions
| Decision | Rationale | Date |
|----------|-----------|------|
| Update erfolgt als direkter Browser→Supabase-Call, keine eigene API-Route | Der Admin bearbeitet nur seine eigenen Daten, kein Geheimnis muss vor dem Browser verborgen werden (anders als der Freischaltcode-Check bei der Registrierung); konsistent mit PROJ-3s Muster für Login/PW-Reset | 2026-07-09 |
| Neue RLS-Update-Policy auf `vereine`: nur der Admin (`users.admin = true`) des zugeordneten Vereins darf die eigene `vereine`-Zeile ändern | Aktuell existieren auf `vereine`/`users` nur Lese-Policies (aus PROJ-3); die neue Policy ist die eigentliche Sicherheitsgrenze, der clientseitige Redirect ist nur UX-Komfort | 2026-07-09 |
| Logo-Upload nutzt die bestehende öffentliche Storage-Bucket `adalo-media` (bereits aus der Migration vorhanden) statt einer neuen Bucket | Bucket ist bereits public und wird schon für Vereinslogos genutzt (`vereine.vereinslogo_url`); kein Grund für eine zweite Bucket | 2026-07-09 |
| Neue Logo-Uploads schreiben ausschließlich in `vereine.vereinslogo_url` (Pfad `vereine/{verein_id}-{dateiname}`); das Adalo-Altfeld `vereine.vereinslogo` (jsonb) bleibt unangetastet | Trennung von Migrations-Altdaten und app-generierten Daten; `vereinslogo_url` ist bereits die etablierte Anzeige-Quelle (siehe `scripts/migrate-adalo/migrate-images.ts`) | 2026-07-09 |
| Logo-Constraints: PNG/JPG/SVG, max. 2 MB, geprüft im Browser vor dem Upload | Löst die offene Frage aus dem Spec-Interview; ausreichend für Vereinslogos, verhindert versehentlich große/falsche Dateien | 2026-07-09 |
| Tab-Namen: max. 20 Zeichen (kein Pflichtfeld) | Löst die offene Frage aus dem Spec-Interview; begrenzter Platz in der künftigen Navigationsleiste | 2026-07-09 |
| Keine neuen npm-Pakete nötig | `@supabase/supabase-js`, `zod`, `react-hook-form` sowie die benötigten shadcn/ui-Komponenten (`form`, `input`, `button`, `alert-dialog`) sind bereits im Projekt vorhanden | 2026-07-09 |

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)

### A) Component Structure

```
Startseite "/" (bereits gebaut, PROJ-3)
└── Link "Vereinseinstellungen" (nur sichtbar für eingeloggte Admins) → /voreinstellung

Vereinseinstellungen-Seite "/voreinstellung" (neu)
├── Zugriffsprüfung: liest users.admin, leitet bei false sofort zu "/" weiter
├── Formular (vorausgefüllt mit aktuellen Werten des eigenen Vereins)
│   ├── Abschnitt "Stammdaten"
│   │   ├── Vereinsname (Textfeld, Pflicht)
│   │   └── Vereinslogo (aktuelle Vorschau + Datei-Upload: PNG/JPG/SVG, max. 2 MB)
│   ├── Abschnitt "Navigations-Tabs" (5 Textfelder, optional, max. 20 Zeichen)
│   │   Tab 1–5, mit Platzhalter-Beispielen (Activities, Lions, Activity, Kategorien, Profil)
│   ├── Abschnitt "Freischaltcode" (Textfeld)
│   ├── "Speichern"-Button
│   └── Erfolgs-/Fehlermeldung
└── Bestätigungsdialog "Freischaltcode ändern?" (erscheint nur, wenn dieses Feld geändert wurde, vor dem eigentlichen Speichern)
```

### B) Data Model (fachlich, kein Code)

- Keine neue Tabelle. Nutzt die bereits existierende `vereine`-Zeile des eigenen Vereins: `vereinsname`, `vereinslogo_url` (öffentliche Bild-URL — getrennt vom Adalo-Altfeld `vereinslogo`), `tab1`–`tab5`, `freischaltcode`.
- Logo-Dateien landen in der bereits existierenden öffentlichen Storage-Bucket `adalo-media` (aus der Migration), unter einem neuen Pfad wie `vereine/{verein_id}-{dateiname}`; beim Speichern wird `vereine.vereinslogo_url` auf die neue öffentliche URL gesetzt.
- Nicht angefasst: `vereinsnummer`, `freigeschaltet`, `adalo_id`, alle Beziehungs-Arrays (`rollens`, `activities`, `categories`, `users`, `gemeinde`).
- Welcher Verein "der eigene" ist, wird wie in PROJ-3 über `users.verein` bestimmt.

### C) Tech-Entscheidungen (Begründung für PM)

- **Direkter Browser→Supabase-Update-Call statt eigener API-Route**: Der Admin bearbeitet nur seine eigenen Daten, es gibt kein Geheimnis zu schützen (anders als der Freischaltcode-Check bei der Registrierung) — eine Datenbank-Sicherheitsregel (RLS) kann das sicher direkt erlauben. Konsistent mit PROJ-3s Muster für Login/PW-Reset.
- **Neue RLS-Update-Regel erforderlich**: Aktuell existieren nur Lese-Policies auf `vereine`/`users` (aus PROJ-3). Diese neue Regel ist die eigentliche Sicherheitsgrenze — der Redirect im Frontend ist nur Komfort, kein Schutz.
- **Bestehende `adalo-media`-Bucket wiederverwenden** statt einer neuen — sie ist bereits öffentlich und wird schon für Vereinslogos aus der Migration genutzt.
- **Datei-Constraints (Typ/Größe)** werden im Browser vor dem Upload geprüft — verhindert versehentlich zu große/falsche Dateien.

### D) Dependencies

- Keine neuen Pakete: `@supabase/supabase-js`, `zod`, `react-hook-form`, `shadcn/ui` (`form`, `input`, `button`, `alert-dialog`) — alles bereits im Projekt vorhanden.

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
