# PROJ-6: Rollen-Verwaltung (Kassier, Kellner, …)

## Status: Approved
**Created:** 2026-07-11
**Last Updated:** 2026-07-11

## Dependencies
- PROJ-1 (Supabase Infrastruktur Multi-Tenant + RLS) — für RLS-Policies, die Rollen-Zugriff auf den eigenen Verein beschränken
- PROJ-3 (Authentifizierung) — für eingeloggten Admin-Zugriff (`users.admin`) und die Verein-Zuordnung des Nutzers
- PROJ-4 (Verein-Verwaltung & Voreinstellungen) — etabliert das Muster für Admin-Only-Seiten und den Startseiten-Button als Einstiegspunkt
- PROJ-5 (Kategorien-Verwaltung) — direktes strukturelles Vorbild (CRUD-Liste + Dialog, Eindeutigkeitsprüfung, Lösch-Schutz gegen eine noch nicht existierende Verbraucher-Funktion)

## User Stories
- Als Admin möchte ich Rollen für meinen Verein anlegen (z.B. "Kassier", "Kellner"), damit ich sie später bei Zeitbereichen als Helfer-Bedarf zuordnen kann (Zuordnung selbst folgt mit PROJ-9).
- Als Admin möchte ich festlegen, ob Mitglieder bei einer Rolle automatisch als angemeldet gelten (z.B. "Mitglieder"-Rolle) oder eine aktive Zusage brauchen (z.B. "Kellner"), damit die spätere Anmeldelogik (PROJ-9/PROJ-10) weiß, wie die Rolle sich verhält.
- Als Admin möchte ich bestehende Rollen umbenennen und dieses Flag ändern, damit die Rollen-Liste aktuell bleibt.
- Als Admin möchte ich nicht mehr benötigte Rollen löschen, damit die Liste übersichtlich bleibt.
- Als Admin möchte ich gewarnt werden, wenn ich eine noch verwendete Rolle löschen will, damit ich keine Zeitbereiche mit einer verwaisten Rollen-Referenz zurücklasse.
- Als Admin möchte ich alle Rollen meines Vereins übersichtlich in einer Liste sehen, damit ich einen Überblick über die vorhandenen Rollen behalte.
- Als Mitglied (kein Admin) möchte ich keinen Zugriff auf die Rollen-Verwaltung haben, damit administrative Funktionen von meiner Ansicht getrennt bleiben.

## Out of Scope
- Zuordnung von Rollen zu einzelnen Zeitbereichen — gehört zu PROJ-9 (Zeitbereiche CRUD), das die `rollen`-Relation auf `einstellungen` setzt
- Die genaue Auswirkung von "automatisch angemeldet" auf den Anmelde-Flow selbst (z.B. ob/wie ein Mitglied trotzdem abgemeldet werden kann) — PROJ-6 speichert nur das Flag, die Anmeldelogik gehört zu PROJ-9/PROJ-10
- Langfristiger Einstiegspunkt über das Veranstaltungs-Formular (PROJ-8 Activities CRUD) — bis PROJ-8 existiert, ist der Startseiten-Button aus PROJ-6 der einzige Zugang (siehe Product Decisions)
- Umsortieren/Drag & Drop der Rollen-Liste — alphabetische Sortierung reicht für MVP
- Geteilte/globale Rollen zwischen mehreren Vereinen — widerspricht dem strikten Multi-Tenant-Modell (siehe PRD)
- Bereinigung der 39 verwaisten Alt-Rollen aus der Adalo-Migration ohne Vereins-Zuordnung (`vereine = null`) — für RLS unsichtbar und ohne Vereinsbezug, kein Feature-Bedarf in PROJ-6
- Massenlöschung / Bulk-Operationen
- Soft-Delete oder Papierkorb-Funktion — hartes Löschen mit vorgeschaltetem Verwendungs-Check
- Bild/Icon pro Rolle — die `rollen`-Tabelle hat (anders als `categories`) kein Bildfeld, kein Bedarf im Interview geäußert

## Acceptance Criteria

**Format:** Angenommen [Vorbedingung] / Wenn [Aktion] / Dann [Ergebnis]

- [ ] Angenommen ein Admin ist eingeloggt, wenn er die Startseite aufruft, dann sieht er einen Button "Rollen" zu `/rollen`
- [ ] Angenommen ein Mitglied (kein Admin) ist eingeloggt, wenn es die Startseite aufruft, dann sieht es keinen Button zu `/rollen`
- [ ] Angenommen ein Mitglied (kein Admin) ruft `/rollen` direkt über die URL auf, dann wird es sofort zu "/" umgeleitet
- [ ] Angenommen ein Admin ruft `/rollen` auf, dann sieht er alle Rollen seines eigenen Vereins alphabetisch sortiert (Name + Anzeige, ob "automatisch angemeldet")
- [ ] Angenommen der Verein des Admins hat noch keine Rollen, wenn er `/rollen` aufruft, dann sieht er einen Leerzustand mit Hinweistext und einer Aktion zum Anlegen einer neuen Rolle
- [ ] Angenommen der Admin gibt einen Namen ein und lässt "Automatisch angemeldet" deaktiviert, dann wird die neue Rolle so angelegt und erscheint in der Liste
- [ ] Angenommen der Admin gibt einen Namen ein und aktiviert "Automatisch angemeldet", dann wird die Rolle mit aktivem Flag angelegt und die Liste zeigt das erkennbar an
- [ ] Angenommen das Namensfeld ist beim Anlegen oder Bearbeiten leer, wenn der Admin speichert, dann wird ein Validierungsfehler angezeigt und nichts gespeichert
- [ ] Angenommen im eigenen Verein existiert bereits eine Rolle mit demselben Namen (unabhängig von Groß-/Kleinschreibung), wenn der Admin eine neue Rolle mit diesem Namen anlegt oder eine bestehende so umbenennt, dann wird ein Validierungsfehler angezeigt und nichts gespeichert
- [ ] Angenommen der Admin speichert eine bestehende Rolle unverändert (gleicher Name), dann wird kein Duplikat-Fehler ausgelöst
- [ ] Angenommen der eingegebene Name überschreitet 50 Zeichen, dann wird ein Validierungsfehler angezeigt und nichts gespeichert
- [ ] Angenommen der Admin bearbeitet Name und/oder das "Automatisch angemeldet"-Flag einer bestehenden Rolle und speichert, dann werden die Änderungen übernommen und eine Erfolgsmeldung angezeigt
- [ ] Angenommen eine Rolle ist aktuell keinem Zeitbereich zugeordnet, wenn der Admin auf "Löschen" klickt, dann erscheint ein Bestätigungsdialog; nach Bestätigung wird die Rolle entfernt und verschwindet aus der Liste
- [ ] Angenommen eine Rolle ist mindestens einem Zeitbereich zugeordnet, wenn der Admin auf "Löschen" klickt, dann wird das Löschen verhindert und ein Hinweis angezeigt, dass die Rolle noch verwendet wird
- [ ] Angenommen die Supabase-API ist beim Speichern nicht erreichbar, dann wird eine Fehlermeldung angezeigt und die Formulareingaben bleiben erhalten
- [ ] Angenommen ein Admin von Verein A ist eingeloggt, dann sieht, bearbeitet und löscht `/rollen` ausschließlich Rollen von Verein A (nie Rollen eines anderen Vereins)

## Edge Cases
- Unverändertes Speichern einer bestehenden Rolle löst keinen Duplikat-Fehler gegen sich selbst aus
- Zwei Admins desselben Vereins bearbeiten gleichzeitig unterschiedliche Rollen → kein Locking im MVP, unabhängige Operationen auf unterschiedlichen Zeilen, kein Konflikt
- Admin versucht, eine Rolle zu löschen, während zeitgleich (sobald PROJ-9 existiert) ein Zeitbereich ihr zugewiesen wird → kein Locking im MVP; der Verwendungs-Check zum Zeitpunkt des Lösch-Klicks ist maßgeblich
- Direkter URL-Aufruf von `/rollen` durch ein Mitglied eines anderen Vereins → derselbe Redirect wie bei jedem Nicht-Admin
- Verein hat noch keine einzige Rolle (Erststart) → Leerzustand statt leerer/kaputter Liste

## Technical Requirements (optional)
- Security: Zugriff nur für `users.admin = true` des eigenen Vereins; RLS beschränkt Lese-/Schreib-/Löschzugriff auf `rollen`-Zeilen, deren `vereine`-Relation den eigenen Verein enthält (Cross-Tenant-Schutz)
- Name: Pflichtfeld, max. 50 Zeichen, eindeutig pro Verein (case-insensitive) — identische Regeln wie PROJ-5
- Lösch-Schutz: Löschen wird serverseitig verhindert, wenn die Rolle noch mit mindestens einem Zeitbereich verknüpft ist (`einstellungen.rollen`); genaue Umsetzung (welcher Wertebereich referenziert wird) wird in `/architecture` festgelegt, analog zur `id`-vs-`adalo_id`-Erkenntnis aus PROJ-5

## Open Questions
- [ ] Genauer Effekt von "automatisch angemeldet" auf die Anmeldelogik (PROJ-9/PROJ-10) — für PROJ-6 nicht relevant, aber als Hinweis für die Architektur dieser künftigen Features festzuhalten
- [ ] Sollen die 39 verwaisten Alt-Rollen aus der Adalo-Migration (`vereine = null`) bereinigt werden? Wie bei PROJ-5 kein Teil dieses Features; User kann sie bei Bedarf selbst manuell entfernen

## Decision Log

### Product Decisions
| Decision | Rationale | Date |
|----------|-----------|------|
| Feld `gleich_angemeldet` ("Automatisch angemeldet") ist Teil des MVP, als Checkbox im Formular editierbar | Nutzerentscheidung im Interview; Feld existiert bereits in der DB (aktuell nur bei der Rolle "Mitglieder" gesetzt) und wird für die künftige Anmeldelogik (PROJ-9/PROJ-10) gebraucht | 2026-07-11 |
| Löschen wird verhindert, wenn die Rolle noch mind. einem Zeitbereich zugeordnet ist | Nutzerentscheidung im Interview; identisches Muster wie PROJ-5s Kategorie-Löschschutz gegen Activities | 2026-07-11 |
| Rollennamen müssen pro Verein eindeutig sein (case-insensitive) | Nutzerentscheidung im Interview; identische Regel wie PROJ-5 | 2026-07-11 |
| Einstiegspunkt ist vorerst ein Button "Rollen" auf der Startseite (URL `/rollen`), obwohl der Admin den langfristig sinnvolleren Einstieg über das künftige Veranstaltungs-Formular (PROJ-8) sieht | Nutzerentscheidung im Interview: PROJ-8 existiert noch nicht: PROJ-6 braucht trotzdem einen nutzbaren Einstiegspunkt jetzt, konsistent mit dem PROJ-4/PROJ-5-Muster. Der Button kann später ergänzt/abgelöst werden, sobald der Activity-Workflow (PROJ-8) existiert | 2026-07-11 |
| Max. Namenslänge 50 Zeichen | Konsistent mit PROJ-5, keine gegenteilige Anforderung im Interview | 2026-07-11 |
| Kein Bild/Icon pro Rolle | Die `rollen`-Tabelle hat kein Bildfeld (anders als `categories.picture`), kein Bedarf im Interview geäußert | 2026-07-11 |

### Technical Decisions
<!-- Added by /architecture -->
| Decision | Rationale | Date |
|----------|-----------|------|
| `rollen.adalo_id` muss in `/backend` proaktiv auf `NULLABLE` gestellt werden, bevor Insert-Funktionalität gebaut wird | Per Introspektion bestätigt: `adalo_id` ist aktuell `NOT NULL` ohne Default (identisches Problem wie bei `categories` vor dem PROJ-5-Fix) — diesmal vorab bekannt, kein erneuter Blocker-Zyklus über `/frontend` nötig | 2026-07-11 |
| Auf `rollen` existiert bislang **gar keine** RLS-Policy (nicht einmal SELECT) | Anders als bei `categories` (hatte schon eine SELECT-Policy aus der Basis-Infrastruktur) muss `/backend` für `rollen` alle vier Policies (SELECT/INSERT/UPDATE/DELETE) neu anlegen | 2026-07-11 |
| Verwendungs-Check vor dem Löschen prüft `einstellungen.rollen` sowohl gegen die Supabase-`id` als auch gegen die `adalo_id` der Rolle | Per Introspektion bestätigt: die beiden vorhandenen `einstellungen`-Zeilen referenzieren Rollen über Werte (95, 130), die weder als `id` noch als `adalo_id` in der aktuellen `rollen`-Tabelle auflösbar sind — vermutlich Altdaten aus einer nicht vollständig migrierten Beziehung. Um dasselbe Muster wie in PROJ-5 (`activities.category`) robust zu behandeln, prüft der Check von Anfang an beide Wertebereiche, statt das Problem erst bei echten Testdaten zu entdecken | 2026-07-11 |
| Checkbox-Komponente (`shadcn/ui checkbox`) für "Automatisch angemeldet" — bereits im Projekt installiert | Kein neues Paket nötig | 2026-07-11 |
| Anlegen/Bearbeiten laufen in einem Dialog (Modal) auf derselben `/rollen`-Seite statt auf einer eigenen Unterseite | Kleines Formular (Name + Checkbox); identisches Muster wie PROJ-5 | 2026-07-11 |
| Create/Update/Delete laufen als direkte Browser→Supabase-Calls, keine eigene API-Route | Kein Geheimnis zu schützen, RLS ist die eigentliche Sicherheitsgrenze; konsistent mit PROJ-3/PROJ-4/PROJ-5 | 2026-07-11 |
| Name-Eindeutigkeit (pro Verein, case-insensitive) läuft als Anwendungslogik vor dem Schreiben, keine DB-Constraint | Konsistent mit PROJ-5 | 2026-07-11 |

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)

### A) Component Structure

```
Startseite "/" (bereits gebaut, PROJ-4/PROJ-5-Muster)
└── Button "Rollen" (nur sichtbar für eingeloggte Admins) → /rollen

Rollen-Seite "/rollen" (neu)
├── Zugriffsprüfung: liest users.admin, leitet bei false sofort zu "/" weiter
├── Rollen-Liste (alphabetisch nach Name sortiert)
│   ├── Leerzustand ("Noch keine Rollen" + Aktion "Neue Rolle anlegen")
│   └── Rollen-Zeile: Name · Hinweis/Badge "Automatisch angemeldet" falls aktiv · "Bearbeiten" · "Löschen"
├── Button "Neue Rolle anlegen" → öffnet Formular-Dialog (leer)
├── Formular-Dialog "Rolle anlegen/bearbeiten" (eine Komponente für beide Fälle)
│   ├── Name (Textfeld, Pflicht, max. 50 Zeichen)
│   ├── Checkbox "Automatisch angemeldet"
│   ├── "Speichern"-Button
│   └── Fehlermeldung (Duplikat-Name, API nicht erreichbar)
└── Lösch-Bestätigungsdialog
    ├── Rolle nicht verwendet → normale Bestätigung ("Wirklich löschen?")
    └── Rolle verwendet (≥1 Zeitbereich) → blockierender Hinweis statt Bestätigung, kein Löschen möglich
```

### B) Data Model (fachlich, kein Code)

- Keine neue Tabelle. Nutzt die bereits existierende `rollen`-Tabelle aus der Adalo-Migration: `name`, `gleich_angemeldet` (Boolean, neu editierbar), `vereine` (Relation zum eigenen Verein, wird beim Anlegen auf den Verein des Admins gesetzt — Rohwert-Kopie aus `users.verein`, wie in PROJ-5 etabliert, kein Umweg über `vereine.id`).
- Nicht angefasst: `adalo_id` (wird nur auf nullable gestellt, nicht befüllt), `einteilungens` (Adalo-Altdatenmirror, wie `categories.events` in PROJ-5 ignoriert).
- Welcher Verein "der eigene" ist, wird wie in PROJ-3/4/5 über `users.verein` bestimmt.
- Verwendungs-Check vor dem Löschen: prüft, ob mindestens eine Zeile in `einstellungen` existiert, deren `rollen`-Relation auf die zu löschende Rolle zeigt — geprüft gegen `id` **und** `adalo_id` (siehe Technical Decisions).

### C) Tech-Entscheidungen (Begründung für PM)

- **Direkte strukturelle Wiederverwendung des PROJ-5-Musters**: Rollen-Verwaltung ist fachlich fast identisch zu Kategorien-Verwaltung (Admin-CRUD, Eindeutigkeit pro Verein, Lösch-Schutz gegen eine später zugreifende Funktion) — dieselbe Seiten-/Dialog-Struktur, dieselben Validierungsregeln, kein Grund für einen anderen Ansatz.
- **Kein Bild-Upload**: Die `rollen`-Tabelle hat kein Bildfeld, im Interview auch nicht gewünscht — entsprechend einfacher als PROJ-5 (kein Storage-Bucket-Bedarf).
- **Proaktive Vorab-Korrektur des `adalo_id`-Constraints**: Bei PROJ-5 wurde dieser Blocker erst mitten in `/frontend` entdeckt und musste nachträglich vom User gefixt werden. Diesmal ist er von Anfang an bekannt und wird direkt zu Beginn von `/backend` behoben.
- **Verwendungs-Check von Anfang an gegen beide Wertebereiche (`id` und `adalo_id`)**: Dieselbe Lehre aus PROJ-5, hier aber vorab in die Architektur eingebaut statt erst bei der Implementierung entdeckt zu werden.
- **Direkter Browser→Supabase-Call statt eigener API-Route**: Der Admin bearbeitet nur Rollen des eigenen Vereins, RLS ist die eigentliche Schutzgrenze. Konsistent mit PROJ-3/4/5.

### D) Dependencies

- Keine neuen Pakete: `@supabase/supabase-js`, `zod`, `react-hook-form`, `shadcn/ui` (`dialog`, `alert-dialog`, `form`, `input`, `checkbox`, `button`, `label`) — alles bereits im Projekt vorhanden.

## Frontend Implementation Notes

**Gebaut:** `/rollen` (`src/app/rollen/page.tsx`) sowie ein Button "Rollen" auf der Startseite (`src/app/page.tsx`), analog zu "Kategorien"/"Vereinseinstellungen", nur für eingeloggte Admins sichtbar.

- Zugriffsschutz clientseitig identisch zu PROJ-4/PROJ-5: kein Session → Redirect zu "/"; Session ohne `users.admin = true` → Redirect zu "/"
- Liste lädt `rollen` gefiltert per `.contains("vereine", [vereinId])`, sortiert alphabetisch nach `name`
- Anlegen/Bearbeiten laufen in einem gemeinsamen `Dialog` (shadcn) mit Formular: Name (Zod max. 50 Zeichen + `maxLength`) und Checkbox "Automatisch angemeldet" (`gleich_angemeldet`, shadcn `Checkbox`, bereits im Projekt vorhanden)
- Liste zeigt ein Badge "Automatisch angemeldet" bei Rollen mit aktivem Flag
- Namens-Eindeutigkeit clientseitig gegen die bereits geladene Liste geprüft (case-insensitive, eigene ID beim Bearbeiten ausgenommen) — kein DB-Constraint
- Löschen: vor dem Bestätigungsdialog wird `einstellungen` per `.or()` sowohl gegen `id` als auch gegen `adalo_id` der Rolle auf Verwendung geprüft (Lehre aus PROJ-5 direkt übernommen, siehe Tech Design); bei Treffer blockierender Hinweis statt Bestätigung
- Leerzustand mit CTA "Neue Rolle anlegen"
- Kein Bild-Upload (Tabelle hat kein Bildfeld, siehe Architektur)

**Verifiziert:** `npm run build` läuft sauber durch (`/rollen` als statische Route). Playwright-Check bestätigt: unauthentifizierter Direktaufruf von `/rollen` redirected zu "/", Homepage lädt fehlerfrei (keine Konsolenfehler).
**Nicht getestet:** die eigentliche CRUD-Funktionalität mit einem echten Admin-Account — analog zu PROJ-5 wird dies nach `/backend` verifiziert, sobald die RLS-Policies existieren und `rollen.adalo_id` nullable gestellt ist (siehe Tech Design Technical Decisions).

## Backend Implementation Notes

**Gebaut:** Zwei Migrationen (per `apply_migration`, mit expliziter User-Freigabe angewendet):

1. `proj6_rollen_nullable_adalo_id_and_rls_policies`:
   - `rollen.adalo_id` auf `NULLABLE` gestellt (proaktiv, wie in `/architecture` festgelegt)
   - Vier neue RLS-Policies auf `public.rollen`: `rollen_select_own` (jeder eingeloggte Nutzer des eigenen Vereins darf lesen, analog `categories`), `rollen_insert_own_admin` / `rollen_update_own_admin` / `rollen_delete_own_admin` (nur Admin des eigenen Vereins darf schreiben) — vorher existierte auf `rollen` **keine einzige** Policy
2. `proj6_einstellungen_select_policy_for_role_usage_check` — **beim Testen entdeckter zusätzlicher Blocker, nicht Teil der ursprünglichen Architektur:** `einstellungen` (Zeitbereiche) hatte ebenfalls keine einzige RLS-Policy. Ohne SELECT-Policy hätte der Rollen-Löschschutz aus PROJ-6 immer "nicht verwendet" gemeldet, unabhängig von echten Daten — der Lösch-Schutz wäre lautlos wirkungslos gewesen. Neue Policy `einstellungen_select_own`: scoped auf den eigenen Verein über die verknüpfte `activities`-Zeile (`einstellungen.activity` referenziert `activities` über `id` **oder** `adalo_id`, je nach Alt-/Neu-Daten — gleiches Muster wie beim Verwendungs-Check selbst)

- Policy-Struktur nach Anwendung per SQL-Introspektion bestätigt: `rollen` hat jetzt SELECT/INSERT/UPDATE/DELETE, `einstellungen` hat jetzt eine SELECT-Policy
- `rollen.adalo_id` nullable per Introspektion verifiziert
- Keine neue API-Route (Architekturentscheidung: direkter Browser→Supabase-Call, siehe Technical Decisions) — daher auch keine neuen Vitest-Integrationstests

**Empirischer Fund zur Alt-Datenlage von `einstellungen`:** Die beiden vorhandenen Zeilen referenzieren ihre Activity über `adalo_id` (`activity: ["1137"]` matcht `activities.adalo_id = 1137`, die reale migrierte Activity "Hofübergabe"), ihre Rolle aber über Werte (95, 130), die in der aktuellen `rollen`-Tabelle weder als `id` noch als `adalo_id` auflösbar sind — vermutlich Reste einer nicht vollständig migrierten Beziehung. Für PROJ-6 folgenlos (kein reales Match, also keine falsch-positive Blockierung), aber relevant als Hinweis für PROJ-9.

**Verifiziert:** Direkter SQL-Simulationstest mit echter Admin-Identität wurde wie schon bei PROJ-5 nicht durchgeführt (Auto-Mode stuft Schreibzugriffe mit fremder JWT-Identität auf Produktionsdaten als riskant ein). Stattdessen hat der User den kompletten CRUD-Flow (Anlegen, Bearbeiten, Löschen einer Rolle, inkl. Text-Feld und "Automatisch angemeldet"-Checkbox) selbst manuell im Browser gegen den laufenden Production-Build mit seinem echten Admin-Account getestet — **bestätigt funktionsfähig.** Damit sind die neuen RLS-Policies (`rollen` INSERT/UPDATE/DELETE, `einstellungen` SELECT für den Lösch-Check) end-to-end bestätigt.

## QA Test Results

**Tested:** 2026-07-11
**App URL:** http://localhost:3000 (Production-Build via `npm run build && npm run start`, gegen die echte Supabase-Instanz `cspljbavgdnsqlqkdxvc`)
**Tester:** QA Engineer (AI)

**Testdaten:** 2 isolierte, disponible Test-Vereine ("QA-Test Verein A" id=9, "QA-Test Verein B" id=10) mit je einem Test-Admin-Account (über den echten `/register`-Flow angelegt, `admin` per SQL gesetzt) sowie ein Nicht-Admin-Testmitglied in Verein A, plus 1 temporäre Test-Activity und 1 temporäre Test-`einstellungen`-Zeile (für den Verwendungs-Check) — mit expliziter User-Freigabe in mehreren Schritten angelegt und nach Abschluss vollständig entfernt (verifiziert: 0 verbleibende Zeilen in `vereine`/`users`/`auth.users`/`rollen`/`activities`/`einstellungen`).

### Acceptance Criteria Status

- [x] Admin sieht Button "Rollen" auf der Startseite
- [x] Mitglied (Nicht-Admin) sieht keinen Button zu `/rollen`
- [x] Mitglied wird bei direktem Aufruf von `/rollen` sofort zu "/" umgeleitet
- [x] Admin sieht alle Rollen des eigenen Vereins alphabetisch sortiert, mit Anzeige des "Automatisch angemeldet"-Status (Badge)
- [x] Leerzustand mit Hinweistext + Anlegen-Aktion bei einem Verein ohne Rollen
- [x] Rolle ohne "Automatisch angemeldet" anlegen funktioniert, erscheint in der Liste ohne Badge
- [x] Rolle mit "Automatisch angemeldet" anlegen funktioniert, Badge erscheint in der Liste
- [x] Leeres Namensfeld zeigt Validierungsfehler, nichts wird gespeichert
- [x] Duplikat-Name (case-insensitive) im eigenen Verein wird abgelehnt
- [x] Unverändertes Speichern einer bestehenden Rolle löst keinen Duplikat-Fehler gegen sich selbst aus
- [x] Name über 50 Zeichen wird verhindert (`maxLength`, per Test bestätigt: Eingabe bei 50 Zeichen gekappt)
- [x] Bearbeiten von Name und Flag wird übernommen, Erfolg sichtbar (Badge erscheint/verschwindet korrekt)
- [x] Löschen einer ungenutzten Rolle zeigt Bestätigungsdialog, danach entfernt
- [x] Löschen einer von einem Zeitbereich verwendeten Rolle wird blockiert, mit Hinweistext statt Löschoption — **end-to-end verifiziert** (echte Test-`einstellungen`-Zeile referenzierte die Rolle per `id`)
- [x] Nicht erreichbare API beim Speichern zeigt Fehlermeldung, Eingabe bleibt erhalten (per Route-Interception simuliert)
- [x] Admin sieht/bearbeitet/löscht ausschließlich Rollen des eigenen Vereins (siehe Security Audit)

**16/16 Akzeptanzkriterien bestanden.**

### Edge Cases Status
- [x] Unverändertes Speichern löst keinen Duplikat-Fehler aus (verifiziert)
- [x] Verein ohne Rollen zeigt Leerzustand (verifiziert)
- [x] Direkter URL-Aufruf durch Mitglied → Redirect (verifiziert)
- [ ] Zwei Admins bearbeiten gleichzeitig unterschiedliche Rollen — kein Locking laut Spec, nicht separat getestet (analog PROJ-4/5)
- [ ] Löschen während zeitgleicher Zeitbereich-Zuordnung (Race Condition) — kein Locking im MVP, nicht separat getestet (seltenes, akzeptiertes Edge Case)

### Security Audit Results
- [x] **Cross-Tenant-Isolation:** Admin von Verein B sieht Rollen von Verein A nicht in der Liste; direkter REST-PATCH/-DELETE auf eine fremde Rolle mit echtem JWT liefert 0 betroffene Zeilen; direkter REST-INSERT mit gefälschtem `vereine: [fremde-id]` wird von RLS mit 403 verweigert
- [x] Unauthentifizierter Zugriff (nur anon key): SELECT liefert 0 Zeilen, INSERT wird verweigert (401, RLS-Policy-Fehler)
- [x] XSS/Injection: `<script>window.__xss=1</script>"'--` als Rollenname gespeichert und ausgelesen — von React als reiner Text escaped, kein Skript ausgeführt, kein `window.__xss` gesetzt, kein Dialog/Alert ausgelöst
- [~] Rate-Limiting: nicht gesondert getestet (verlässt sich wie PROJ-3/4/5 bewusst auf Supabase-Standardlimits)

### Cross-Browser & Responsive
- [x] Chromium: alle Funktionstests bestanden
- [x] Firefox: `/rollen` lädt korrekt mit Daten, keine Konsolenfehler
- [x] WebKit: `/rollen` lädt korrekt mit Daten, keine Konsolenfehler
- [x] Responsive 375px/768px/1440px: kein horizontales Overflow (die in PROJ-5/BUG-1 gelernte Layout-Struktur wurde von Anfang an übernommen, kein erneuter Bug)

### Regression Testing
- `npm test` (Vitest): 5/5 bestanden
- `npm run test:e2e` (Playwright, bestehende Suite inkl. neuem PROJ-6-Test): 17/18 bestanden. Der eine Fehlschlag (`AC: ungültiger Freischaltcode zeigt Fehlermeldung`, Mobile Safari/WebKit) ist der bereits in PROJ-3/4/5 dokumentierte **BUG-2** (vorbestehend, nicht durch PROJ-6 verursacht)
- Neuer E2E-Test `tests/PROJ-6-rollen-verwaltung.spec.ts` (unauthentifizierter Redirect) hinzugefügt und grün; alle übrigen Kriterien manuell mit isolierten Testdaten verifiziert (siehe oben), aus denselben Gründen wie PROJ-3/4/5 nicht automatisiert (keine seedbare Test-Fixture-Strategie bisher, siehe PROJ-1)

### Bugs Found
Keine neuen Bugs gefunden. Die proaktiv in `/architecture`/`/backend` vorgenommenen Korrekturen (Nullable-`adalo_id`, vollständige RLS-Policies, zweifacher id/adalo_id-Verwendungs-Check, `einstellungen`-SELECT-Policy) haben verhindert, dass dieselben Probleme wie bei PROJ-5 erneut während QA entdeckt werden mussten.

### Summary
- **Acceptance Criteria:** 16/16 bestanden
- **Bugs Found:** 0 neue (1 vorbestehender, nicht PROJ-6-bezogener BUG-2, WebKit-spezifisch, unverändert)
- **Security:** Pass — Cross-Tenant-Isolation, Admin-Only-Schreibzugriff, XSS-Schutz und Anon-Zugriffsschutz alle verifiziert
- **Regressions:** Keine neuen Regressionen
- **Production Ready:** YES
- **Recommendation:** Deploy möglich.

## Deployment
_To be added by /deploy_
