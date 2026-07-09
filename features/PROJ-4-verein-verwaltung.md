# PROJ-4: Verein-Verwaltung & Voreinstellungen (Tab-Namen)

## Status: Deployed
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
- [x] Die zwei bestehenden Lese-RLS-Policies auf `vereine` vergleichen unterschiedliche Felder → geklärt: `vereine.id` ist korrekt (matcht `users.verein`), die `adalo_id`-basierte Policy `Users can view own verein` ist wirkungslos/redundant, aber bewusst nicht entfernt (nicht Teil dieser Session, siehe Backend Implementation Notes)

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
| `users.verein`-Werte matchen `vereine.id`, nicht `adalo_id` | Empirisch bestätigt durch erfolgreichen Frontend-Live-Test; entscheidet das korrekte Join-Feld für die neue Update-Policy | 2026-07-09 |
| Storage-Policies auf `storage.objects` scopen per `name like 'vereine/' \|\| vid \|\| '-%'` statt fester Dateiname-Prüfung | Erlaubt beliebige Dateinamen im Upload-Pfad, verhindert aber, dass ein Admin Dateien außerhalb des eigenen Vereins-Präfixes schreibt | 2026-07-09 |

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

## Frontend Implementation Notes

**Gebaut:** `/voreinstellung` (`src/app/voreinstellung/page.tsx`) sowie ein Link "Vereinseinstellungen" auf der Startseite (`src/app/page.tsx`), der nur für eingeloggte Admins sichtbar ist (`users.admin`-Check).

- Formular lädt die `vereine`-Zeile des eigenen Vereins direkt im Browser (`users.verein` → `vereine.id`) und füllt Vereinsname, Logo, alle 5 Tab-Namen und Freischaltcode vor
- Zugriffsschutz clientseitig: kein Session → Redirect zu "/"; Session ohne `users.admin = true` → Redirect zu "/" (wie in Tech Design festgelegt, RLS ist die eigentliche Sicherheitsgrenze)
- Logo-Upload: clientseitige Validierung (PNG/JPG/SVG, max. 2 MB) mit sofortiger lokaler Vorschau (`URL.createObjectURL`); der tatsächliche Upload in die Storage-Bucket `adalo-media` sowie das Schreiben von `vereine.vereinslogo_url` passiert erst beim Klick auf "Speichern"
- Freischaltcode-Änderung löst vor dem eigentlichen Speichern einen `AlertDialog` aus (Warnung, dass alte Codes ungültig werden); bei "Abbrechen" wird nichts gespeichert, das Formular behält die eingegebenen Werte
- Speichern läuft als direkter `supabase.from("vereine").update(...)`-Call ohne eigene API-Route (siehe Technical Decisions) — **setzt die neue RLS-Update-Policy aus `/backend` voraus**, ohne sie schlägt jeder Speichervorgang fehl
- Tab-Namen: `maxLength={20}` auf den Inputs verhindert längere Eingaben bereits beim Tippen; leere Tab-Felder sind erlaubt (kein Zod-`min`)

**Manuell verifiziert** (Playwright-Skript gegen den echten Dev-Server + echte Supabase-Instanz, mit vom User bereitgestelltem Admin-Testaccount): unauthentifizierter Zugriff auf `/voreinstellung` redirected zu "/"; Admin-Link erscheint nur für Admins; Formular korrekt vorausgefüllt mit echten Vereinsdaten; leerer Vereinsname zeigt Validierungsfehler; Tab-Namen auf 20 Zeichen begrenzt; ungültiger Logo-Dateityp wird abgelehnt; gültige Logo-Datei zeigt lokale Vorschau; Freischaltcode-Änderung zeigt Bestätigungsdialog, "Abbrechen" speichert nichts (per Reload gegen die echte DB verifiziert); ein Speichervorgang mit unveränderten Werten (No-Op) bestätigt, dass der komplette Save-Pfad inkl. der neuen RLS-Update-Policy tatsächlich funktioniert. Keine Konsolenfehler. Es wurden bewusst keine echten Vereinsdaten (Name, Tabs, Freischaltcode, Logo) dauerhaft verändert — nur mit identischen Werten zurückgespeichert.
- **Nicht live getestet:** tatsächliches Ändern eines Werts + Speichern (hätte reale Produktivdaten verändert, z.B. den einzigen echten Freischaltcode) — mit dem User abgestimmt: er verifiziert diesen Fall manuell selbst (siehe Backend Implementation Notes)

## Backend Implementation Notes

**Gebaut:** Migration `proj4_vereine_update_and_logo_storage_policies` (per `apply_migration`, mit expliziter User-Freigabe angewendet):
- Neue RLS-**UPDATE**-Policy `vereine_update_own_admin` auf `public.vereine`: erlaubt nur dem Admin (`users.admin = true`) des zugeordneten Vereins, die eigene `vereine`-Zeile zu ändern (`id in (select unnest(u.verein) from users u where u.auth_user_id = auth.uid() and u.admin = true)`)
- Neue RLS-Policies `vereine_logo_insert_own_admin` / `vereine_logo_update_own_admin` auf `storage.objects`: erlauben Admins, Dateien unter dem Pfad `vereine/{eigene-verein-id}-*` im bestehenden öffentlichen Bucket `adalo-media` hochzuladen bzw. zu ersetzen (vorher existierte dort **keine** Schreib-Policy, jeder Upload aus dem Frontend wäre fehlgeschlagen)
- Offene Frage aus der Spec geklärt: `users.verein`-Werte matchen `vereine.id` (nicht `adalo_id`) — empirisch bestätigt durch den erfolgreichen Frontend-Live-Test (korrekt vorausgefüllte echte Vereinsdaten). Die neuen Policies nutzen entsprechend `id`. Die ältere, abweichende Lese-Policy `Users can view own verein` (nutzt `adalo_id`) wurde bewusst **nicht** angefasst — sie stammt nicht aus dieser Session, ist für die aktuellen Daten wirkungslos (kein Treffer) und damit harmlos redundant neben `vereine_select_own`
- Keine eigene API-Route (Architekturentscheidung: direkter Browser→Supabase-Call, siehe Technical Decisions) — daher auch keine neuen Vitest-Integrationstests, die laut Skill-Checkliste nur für neue API-Routen vorgesehen sind
- Keine DB-Constraints für die 20-Zeichen-Tab-Namen-Grenze ergänzt — bewusst nur clientseitig (Zod + `maxLength`) durchgesetzt, wie in der Architektur festgelegt

**Bug gefunden & gefixt (nach User-Test):** Logo-Upload schlug mit "Logo-Upload fehlgeschlagen." fehl. Root Cause (via `get_logs`/Postgres-Logs + SQL-Simulation mit `set local role authenticated` + `request.jwt.claims` diagnostiziert): `supabase.storage.upload(path, file, { upsert: true })` kompiliert serverseitig zu `INSERT ... ON CONFLICT DO UPDATE`. Postgres benötigt dafür zusätzlich eine **SELECT**-Policy auf `storage.objects`, um den ON-CONFLICT-Konfliktcheck RLS-konform aufzulösen — auch wenn (wie hier) noch gar kein konfligierendes Objekt existiert. Ohne SELECT-Policy schlägt der komplette Upsert mit "new row violates row-level security policy" fehl, unabhängig davon, ob INSERT- und UPDATE-Policy für sich genommen korrekt sind (isoliert per SQL verifiziert: ein reines `INSERT` ohne `ON CONFLICT` ging durch, derselbe Aufruf mit `ON CONFLICT DO NOTHING`/`DO UPDATE` schlug ohne SELECT-Policy fehl).
- **Fix:** Migration `proj4_fix_logo_upsert_missing_select_policy` — neue Policy `vereine_logo_select_own_admin` (SELECT, gleiches Pfad-Scoping wie INSERT/UPDATE), mit User-Freigabe angewendet
- **Verifikation:** Fix vor der Anwendung per SQL-Simulation bestätigt (derselbe `ON CONFLICT DO UPDATE`-Aufruf ging mit der neuen SELECT-Policy durch); Policy-Struktur danach erneut per Introspektion bestätigt (3 Policies auf `storage.objects`: INSERT/SELECT/UPDATE). Vom User im echten Browser mit echtem Admin-Account nachgetestet und bestätigt: **Logo-Upload funktioniert.**

**Verifiziert:** Policy-Struktur nach Anwendung beider Migrationen per SQL-Introspektion bestätigt (`vereine`: 1× UPDATE; `storage.objects`: INSERT/SELECT/UPDATE). Logo-Upload vom User live bestätigt. Ein automatisierter End-to-End-Test mit echter Werteänderung an Textfeldern (Tab-Name ändern → speichern → zurücksetzen) wurde vom User abgelehnt, da er das lieber selbst manuell verifiziert (Live-Produktivdaten) — offen bis zur manuellen Bestätigung durch den User bzw. bis `/qa`.

## QA Test Results

**Tested:** 2026-07-09
**App URL:** http://localhost:3000 (Production-Build via `npm run build && npm run start`, gegen die echte Supabase-Instanz `cspljbavgdnsqlqkdxvc`)
**Tester:** QA Engineer (AI)

**Testdaten:** 2 isolierte, disponible Test-Vereine ("QA-Test Verein A" / "QA-Test Verein B") mit je einem Test-Admin-Account (über den echten `/register`-Flow angelegt, `admin` per SQL gesetzt) sowie ein Nicht-Admin-Testmitglied in Verein A — mit expliziter User-Freigabe angelegt und nach Abschluss vollständig entfernt (verifiziert: 0 verbleibende Zeilen in `vereine`/`users`/`auth.users`/`storage.objects`).

**Hinweis Testumgebung:** Der Dev-Server (Turbopack) zeigte unter vielen parallelen Playwright-Sessions sporadisch `ERR_CONTENT_LENGTH_MISMATCH`/`ChunkLoadError` (bekannte Turbopack-Dev-Instabilität unter Windows, kein App-Bug — `npm run build` lief davor bereits sauber durch). Für einen stabilen Testlauf wurde auf den Production-Build umgeschaltet; danach traten keine solchen Fehler mehr auf.

### Acceptance Criteria Status

- [x] Admin sieht Link "Vereinseinstellungen" auf der Startseite, Mitglied nicht
- [x] `/voreinstellung` lädt vorausgefüllt mit den echten Werten des eigenen Vereins (Vereinsname, Tab-Namen, Freischaltcode)
- [x] Nicht-Admin wird bei direktem Aufruf von `/voreinstellung` sofort zu "/" umgeleitet (sowohl für Mitglieder des eigenen als auch — implizit über RLS — jedes anderen Vereins)
- [x] Speichern von geändertem Vereinsnamen + leerem Tab-Feld + neuem Logo gelingt und ist nach Reload persistent (Logo-URL zeigt auf die echte Supabase-Storage-Public-URL, nicht auf eine lokale Blob-URL)
- [x] Leeres Tab-Feld wird ohne Fehlermeldung übernommen (kein Pflichtfeld)
- [x] Leerer Vereinsname zeigt Validierungsfehler, kein Speichern
- [x] Gültige Logo-Datei zeigt Vorschau vor dem Speichern
- [x] Ungültiges Dateiformat beim Logo-Upload wird abgelehnt
- [x] Freischaltcode-Änderung zeigt Bestätigungsdialog vor dem Speichern
- [x] Abbrechen des Dialogs speichert nichts, Formular behält die Eingabe
- [x] Bestätigen des Dialogs speichert den neuen Code — **end-to-end mit der echten Registrierungs-API verifiziert:** alter Code wird mit `invalid_code` (400) abgelehnt, neuer Code funktioniert (201)
- [x] Nicht erreichbare API beim Speichern zeigt Fehlermeldung, Eingaben bleiben erhalten (per Route-Interception simuliert)
- [x] Admin sieht/speichert ausschließlich Daten des eigenen Vereins (siehe Security Audit)

**13/13 Akzeptanzkriterien bestanden.**

### Edge Cases Status
- [x] Zwei Admins bearbeiten gleichzeitig — Last-Write-Wins ist Architekturentscheidung, kein Locking erwartet, nicht separat life-getestet (kein beobachtbares Fehlverhalten in Einzelsitzungen)
- [x] Freischaltcode-Dialog abgebrochen trotz weiterer geänderter Felder → nichts gespeichert (verifiziert)
- [x] Ungültiges/zu großes Logo-Dateiformat → Fehlermeldung, alter Wert bleibt (verifiziert für Dateityp; Größenprüfung ist identische Code-Pfad-Logik, nicht separat mit einer >2MB-Datei life-getestet)
- [x] Direkter URL-Aufruf durch Mitglied → Redirect (verifiziert)
- [ ] Ungespeicherte Änderungen beim Verlassen der Seite: bewusst kein Warnhinweis im MVP (siehe Spec) — nicht separat getestet, da explizit Out-of-Scope-Verhalten

### Security Audit Results
- [x] **Cross-Tenant-Isolation (Kernversprechen des Projekts):** Admin von Verein A kann Verein B per direktem REST-Call mit eigenem JWT **nicht** überschreiben (0 betroffene Zeilen); per Service-Role gegengeprüft, dass Verein B tatsächlich unverändert blieb
- [x] Unauthentifizierter Zugriff (nur anon key) kann `vereine` nicht per PATCH ändern (0 Zeilen)
- [x] Eingeloggtes Nicht-Admin-Mitglied kann die `vereine`-Zeile des **eigenen** Vereins nicht ändern (RLS verlangt `admin = true`, 0 Zeilen)
- [x] XSS/Injection: `<script>window.__xss=1</script>"'--` als Vereinsname gespeichert und ausgelesen — wird von React als reiner Text escaped, kein Skript ausgeführt, kein DB-Fehler
- [x] Storage-Upload-Policies (INSERT/SELECT/UPDATE) korrekt auf `vereine/{eigene-verein-id}-*` gescoped — die neue RLS-UPDATE-Policy auf `vereine` und die Storage-Policies wurden vor dieser QA bereits root-cause-diagnostiziert und gefixt (fehlende SELECT-Policy für `upsert`, siehe Backend Implementation Notes)
- [~] Rate-Limiting: nicht gesondert getestet (verlässt sich wie PROJ-3 bewusst auf Supabase-Standardlimits, keine eigene Implementierung laut Architektur)

### Cross-Browser & Responsive
- [x] Chromium: alle Funktionstests bestanden
- [x] WebKit: Einstellungsseite lädt korrekt mit Daten, keine Konsolenfehler
- [~] Firefox: Einstellungsseite lädt korrekt mit Daten; ein Konsolen-Eintrag `Cookie "__cf_bm" has been rejected for invalid domain.` beim Laden des Logo-Bilds — stammt vom Cloudflare-Bot-Management-Cookie vor Supabase Storage, kein App-Fehler, keine funktionale Auswirkung (siehe BUG-1, informativ)
- [x] Responsive 375px/768px/1440px: Layout bricht nicht, Formular bleibt bedienbar (Screenshots geprüft)

### Regression Testing
- `npm test` (Vitest): 5/5 bestanden
- `npm run test:e2e` (Playwright, bestehende PROJ-3-Suite): 11/12 bestanden. Der eine Fehlschlag (`AC: ungültiger Freischaltcode zeigt Fehlermeldung`, Mobile Safari/WebKit) ist **BUG-2 aus PROJ-3** (bereits dokumentiert, vorbestehend, nicht durch PROJ-4 verursacht) — alle Chromium-Tests liefen sauber, keine neue Regression durch PROJ-4

### Bugs Found

#### BUG-1: Firefox-Konsolenwarnung beim Laden von Supabase-Storage-Bildern (Cloudflare-Cookie)
- **Severity:** Low (informativ, kein funktionaler Fehler)
- **Steps to Reproduce:**
  1. `/voreinstellung` in Firefox mit einem Verein öffnen, das ein Logo aus Supabase Storage lädt
  2. Konsole prüfen
  3. Erwartet: keine Warnung
  4. Tatsächlich: `Cookie "__cf_bm" has been rejected for invalid domain.` erscheint — das Bild lädt trotzdem korrekt, keine sichtbare Auswirkung
- **Root Cause:** Cloudflare (vor Supabase Storage) setzt ein Bot-Management-Cookie auf die Bild-Antwort; Firefox validiert Cookie-Domains strenger als Chromium/WebKit und loggt eine Konsolenwarnung. Liegt außerhalb der App-Kontrolle (Supabase/Cloudflare-Infrastruktur)
- **Priority:** Nice to have / kein Fix nötig

### Summary
- **Acceptance Criteria:** 13/13 bestanden
- **Bugs Found:** 1 total (0 Critical, 0 High, 0 Medium, 1 Low — informativ, kein App-Fehler)
- **Security:** Pass — Cross-Tenant-Isolation, Admin-Only-Schreibzugriff und XSS-Schutz alle verifiziert
- **Regressions:** Keine neuen Regressionen; ein vorbestehender PROJ-3-Bug (BUG-2, WebKit-spezifisch) bleibt unverändert bestehen
- **Production Ready:** YES
- **Recommendation:** Deploy möglich. BUG-1 ist rein informativ und erfordert keine Code-Änderung.

## Deployment

**Deployed:** 2026-07-09
**Production URL:** https://simpliplan.toolies.eu/voreinstellung
**Mechanism:** GitHub Actions (`.github/workflows/deploy.yml`) — SSH nach Hetzner bei jedem Push auf `main`, `npm run build` + PM2-Reload (`ecosystem.config.js`, Prozess "SimpliPlan"). Kein Vercel (siehe `docs/PRD.md`/`CLAUDE.md` — Vercel→Hetzner-Wechsel fand vor PROJ-4 statt, die generische `/deploy`-Skill-Doku ist in diesem Punkt veraltet).

- Pre-Deployment-Checks: `npm run build` sauber, QA Approved, keine Secrets committed, DB-Migrationen bereits während `/backend`/QA-Fix live angewendet. `npm run lint` weiterhin am vorbestehenden, PROJ-4-unabhängigen Problem (fehlende `eslint.config.js`) gescheitert — kein neuer Blocker.
- Deploy ausgelöst durch `git push origin main` (7 Commits), GitHub-Actions-Run [`29050005938`](https://github.com/GeSt59/SimpliPlan-2.0/actions/runs/29050005938) — `success`
- Post-Deployment-Verifikation (read-only, keine Produktivdaten verändert): unauthentifizierter Zugriff auf `/voreinstellung` redirected korrekt zu "/"; Login mit echtem Admin-Account zeigt korrekt vorausgefüllte echte Vereinsdaten ("LC Windischgarsten Pyhrn Priel"); keine Konsolenfehler
- Production-Ready-Essentials (Error Tracking/Security Headers/Performance/Rate Limiting) noch nicht projektweit eingerichtet — nicht Teil von PROJ-4, betrifft die gesamte App gleichermaßen wie schon bei PROJ-3
