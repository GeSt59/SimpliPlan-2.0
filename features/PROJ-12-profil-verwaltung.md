# PROJ-12: Profil-Verwaltung

## Status: Deployed
**Created:** 2026-07-16
**Last Updated:** 2026-07-17

> **Refinement (2026-07-17):** Nutzer hat nach dem Deployment gemeldet, dass allen Mitgliedern das Feld Telefonnummer fehlt. Neues Feld `telefonnummer` (Freitext, optional, keine Formatvalidierung — identisches Muster wie `mitgliedsnumer`) wird ergänzt: editierbar im eigenen Profil (PROJ-12, dieses Feature), zusätzlich admin-editierbar in der Mitgliederverwaltung (PROJ-7, siehe dortiges Refinement) und angezeigt in der Mitgliedersuche (PROJ-13, siehe dortiges Refinement). Die bereits deployte Basisfunktionalität bleibt unverändert live, während diese Erweiterung entsteht.

## Dependencies
- PROJ-3 (Authentifizierung) — für eingeloggten Nutzer-Kontext (`auth_user_id`), Passwort-Änderungsmechanismus (analog zur bestehenden Reset-Passwort-Seite)
- PROJ-7 (Mitgliederverwaltung Admin) — etabliert dieselben Felder (`mitgliedsnumer`, `geburtstag`, `titel_nachher`, `vorher_titel`, `profile_picture_url`) bereits admin-seitig; PROJ-12 gibt dem Mitglied zusätzlich Schreibzugriff auf seine eigene Zeile

## User Stories
- Als Mitglied möchte ich mein Profil (Name, E-Mail, Telefonnummer, Mitgliedsnummer, Geburtstag, Titel, Profilbild) selbst ansehen und bearbeiten, damit meine Daten aktuell sind, ohne den Admin fragen zu müssen.
- Als Mitglied möchte ich mein Profilbild hochladen oder ersetzen können, damit ich in der Mitglieder-Kartenansicht (PROJ-7) und der Mitgliedersuche (PROJ-13) mit einem aktuellen Foto erscheine.
- Als Mitglied möchte ich mein Passwort ändern können, während ich eingeloggt bin, damit ich es aktualisieren kann, ohne mich auszuloggen und den "Passwort vergessen"-Flow zu nutzen.
- Als Mitglied möchte ich meinen Vereinsnamen im Profil sehen (nur lesend), damit ich Kontext habe, welchem Verein ich zugeordnet bin.
- Als Admin möchte ich zusätzlich zur Vereinseinstellungen-Seite von meinem eigenen Profil aus dorthin gelangen, damit ich (wie bisher) keinen separaten Einstiegspunkt suchen muss.
- Als Mitglied möchte ich mich von meinem Profil aus ausloggen können, damit ich mein Konto auf einem gemeinsam genutzten Gerät schützen kann.

## Out of Scope
- "Meine Einteilungen" (eine vereinsübergreifende Übersicht aller eigenen Zeitbereich-Zusagen) — wird ein eigenes zukünftiges Feature (neuer Roadmap-Eintrag PROJ-16); im Adalo-Mockup vorhanden, aber PROJ-12 bleibt auf Profildaten-Verwaltung fokussiert (Single Responsibility). Aktuell existiert nur eine Activity-bezogene Zusagen-Ansicht aus PROJ-10 (`/activities/[id]`), keine übergreifende Seite.
- Bearbeiten von `admin`- oder `su`-Flag durch das Mitglied selbst — bleibt exklusiv Admin (PROJ-7) bzw. direkt in Supabase (PROJ-3)
- Bearbeiten des `aktiv`-Status durch das Mitglied selbst — bleibt exklusiv Admin (PROJ-7)
- Ändern des eigenen Vereins (`verein`-Array) — read-only in PROJ-12, konsistent mit "1 Account = 1 Verein" (PRD Non-Goal) und dem in PROJ-7 eingeführten Trigger-Schutz gegen `verein`-Änderungen
- Konto/Profil endgültig selbst löschen (Self-Service-Löschung) — nicht angefordert; Löschen bleibt Admin-Funktion (PROJ-7)
- Bildzuschnitt/-bearbeitung (Crop, Rotation) beim Profilbild-Upload — Bild wird 1:1 übernommen, gleiches Muster wie Vereinslogo/Kategorie-Bild/PROJ-7-Mitgliederfoto
- E-Mail-Bestätigungslink bei E-Mail-Änderung — bewusst kein Bestätigungsschritt (siehe Decision Log), kein E-Mail-Versand-Service im Projekt verifiziert (siehe PROJ-3 Open Questions)
- Anzeige/Verwaltung anderer Mitglieder über diese Seite — bleibt PROJ-7 (Admin) bzw. PROJ-13 (Mitgliedersuche)
- Formatvalidierung der Telefonnummer (z.B. Ländervorwahl-Pflicht, Zeichen-Whitelist) — reines Freitextfeld, identisches Muster wie `mitgliedsnumer`, keine Validierung (Refinement 2026-07-17)

## Acceptance Criteria

**Format:** Angenommen [Vorbedingung] / Wenn [Aktion] / Dann [Ergebnis]

- [ ] Angenommen ein Mitglied ist eingeloggt, wenn es `/profil` aufruft, dann sieht es Profilbild (oder Platzhalter), Vorname + Nachname, E-Mail, Vereinsname (read-only) sowie die Buttons "Profil ändern", "Passwort ändern" und "Logout"
- [ ] Angenommen der eingeloggte Nutzer ist Admin, wenn er `/profil` aufruft, dann sieht er zusätzlich den bestehenden Button "Vereinseinstellungen"
- [ ] Angenommen ein Mitglied hat kein Profilbild, dann zeigt `/profil` einen neutralen Platzhalter anstelle eines Fotos (gleicher Platzhalter wie in der PROJ-7-Kartenansicht)
- [ ] Angenommen der Nutzer klickt "Profil ändern", dann öffnet sich ein Formular mit Vorname, Nachname, E-Mail (alle Pflicht) sowie Telefonnummer, Mitgliedsnummer, Geburtstag, Titel vorher/nachher (alle optional, Freitext) und einem Profilbild-Upload-Feld, vorausgefüllt mit den aktuellen Werten
- [ ] Angenommen Vorname, Nachname oder E-Mail werden beim Speichern leer gelassen, dann wird für jedes leere Pflichtfeld ein Validierungsfehler angezeigt und nichts gespeichert
- [ ] Angenommen der Nutzer ändert seine E-Mail auf eine bereits bei einem anderen Account registrierte Adresse, wenn er speichert, dann wird die Fehlermeldung "Diese E-Mail ist bereits registriert" angezeigt und nichts gespeichert
- [ ] Angenommen der Nutzer ändert Stammdaten und/oder E-Mail und speichert erfolgreich, dann werden die Änderungen sofort übernommen (E-Mail ohne zusätzlichen Bestätigungsschritt) und eine Erfolgsmeldung angezeigt; ein anschließender Login funktioniert bereits mit der neuen E-Mail
- [ ] Angenommen der Nutzer lädt ein neues Profilbild hoch (PNG/JPG/SVG, max. 2 MB), dann wird eine Vorschau angezeigt; nach dem Speichern erscheint das neue Foto auf `/profil` sowie in der PROJ-7-Kartenansicht
- [ ] Angenommen der Nutzer lädt eine ungültige Datei (falsches Format oder zu groß) als Profilbild hoch, dann wird eine Fehlermeldung angezeigt, der Upload abgebrochen und das bisherige Bild bleibt unverändert
- [ ] Angenommen der Nutzer klickt "Passwort ändern" und gibt ein neues Passwort (mind. 6 Zeichen) sowie dessen Wiederholung ein, wenn beide übereinstimmen und er speichert, dann wird das Passwort aktualisiert und eine Erfolgsmeldung angezeigt
- [ ] Angenommen neues Passwort und Wiederholung stimmen nicht überein oder das neue Passwort ist kürzer als 6 Zeichen, wenn der Nutzer speichert, dann wird ein Validierungsfehler angezeigt und nichts geändert
- [ ] Angenommen die Supabase-API ist beim Speichern (Profil, Profilbild oder Passwort) nicht erreichbar, dann wird eine Fehlermeldung angezeigt und die Formulareingaben bleiben erhalten
- [ ] Angenommen ein Mitglied von Verein A ist eingeloggt, dann kann es über `/profil` ausschließlich die eigene `users`-Zeile lesen und ändern (nie die eines anderen Mitglieds, auch nicht desselben Vereins)
- [ ] Angenommen der Nutzer klickt "Logout", dann wird die Session beendet und er landet auf der öffentlichen Startseite (bestehendes Verhalten aus PROJ-3, unverändert)

## Edge Cases
- Mitglied ändert die eigene E-Mail auf eine bereits vergebene Adresse → dieselbe "bereits registriert"-Regel wie bei Registrierung (PROJ-3) und Admin-Bearbeiten (PROJ-7)
- Mitglied ändert die eigene E-Mail erfolgreich → keine erzwungene Abmeldung; die laufende Session bleibt bis zum nächsten regulären Logout gültig (konsistent mit dem `aktiv`-Verhalten aus PROJ-3)
- Migriertes Bestandsmitglied ohne gesetzte Telefonnummer/Mitgliedsnummer/Geburtstag/Titel → Felder erscheinen leer im Formular, kein Pflichtfeld, kein Fehler (identisch zu PROJ-7); da `telefonnummer` ein komplett neues Feld ist, betrifft das anfangs ausnahmslos alle Bestandsmitglieder
- Profilbild-Upload schlägt wegen Netzwerkfehler fehl → Fehlermeldung, bisheriges Bild bleibt unverändert (identisches Muster wie Vereinslogo-/Mitgliederfoto-Upload)
- Mitglied versucht per direktem REST-Call `admin`, `aktiv`, `su` oder `verein` der eigenen Zeile zu ändern → serverseitig blockiert (RLS bzw. der bestehende PROJ-7-Trigger gegen `verein`-Änderungen), nicht nur clientseitig ausgeblendet
- Admin bearbeitet gleichzeitig dasselbe Mitglied über PROJ-7, während das Mitglied selbst über PROJ-12 speichert → kein Locking im MVP, letzter Schreibvorgang gewinnt (konsistent mit PROJ-4/5/6/7)
- Zwei Formularfelder (Profildaten vs. Passwort) werden als getrennte Aktionen behandelt → ein fehlgeschlagener Passwortwechsel beeinflusst nicht die bereits gespeicherten Profildaten und umgekehrt

## Technical Requirements (optional)
- Security: Zugriff nur für den eingeloggten Nutzer auf die eigene `users`-Zeile (`auth_user_id = auth.uid()`); bestehende RLS-Policy aus PROJ-3 (`users_select_own`) muss um eine entsprechende UPDATE-Policy für die eigene Zeile erweitert werden
- E-Mail-Änderung ohne Bestätigungslink erfordert denselben Mechanismus wie PROJ-7s Admin-PATCH-Route (Service-Role-Sync von `auth.users.email`, RLS-Update auf `public.users` über einen scoped client) — voraussichtlich eine neue serverseitige Route `PATCH /api/profil`, finale Entscheidung in `/architecture`
- Passwort-Änderung kann als direkter Browser-Call laufen (`supabase.auth.updateUser({ password })`), kein Service-Role nötig, da der Nutzer bereits eine gültige Session hat
- Profilbild-Upload: gleiche Constraints wie PROJ-7 (PNG/JPG/SVG, max. 2 MB), gleicher Storage-Bucket `adalo-media`, gleiches Pfadschema `users/{vereinId}-{userId}-{dateiname}` (Self-Service schreibt in denselben Pfad-Namespace wie der Admin-Upload aus PROJ-7)
- Passwort-Mindestlänge: 6 Zeichen, konsistent mit PROJ-3

## Open Questions
- [ ] Soll für PROJ-16 ("Meine Einteilungen") bereits jetzt ein Platzhalter-Button auf `/profil` verlinkt werden (z.B. zu `/activities`), oder komplett weggelassen bis PROJ-16 gebaut ist? → tendenziell weggelassen, siehe Out of Scope; final in `/frontend` zu entscheiden

## Decision Log

### Product Decisions
| Decision | Rationale | Date |
|----------|-----------|------|
| Mitglied kann Vorname, Nachname, E-Mail, Mitgliedsnummer, Geburtstag, Titel (vorher/nachher) und Profilbild selbst bearbeiten | Nutzerentscheidung im Interview; deckt genau die Felder ab, die PROJ-7 explizit für PROJ-12 vorgemerkt hatte | 2026-07-16 |
| E-Mail-Änderung greift sofort, ohne Bestätigungslink an die neue Adresse | Nutzerentscheidung im Interview; konsistent mit dem bereits etablierten PROJ-7-Admin-Muster (kein verifizierter E-Mail-Versand-Service im Projekt) | 2026-07-16 |
| Mitglied kann sein Passwort im eingeloggten Zustand direkt ändern (ohne erneute Abfrage des aktuellen Passworts) | Nutzerentscheidung im Interview; Nutzer hat bereits eine gültige, authentifizierte Session, zusätzliche Abfrage bringt keinen Sicherheitsgewinn | 2026-07-16 |
| "Meine Einteilungen" wird NICHT Teil von PROJ-12, sondern ein eigenes zukünftiges Feature | Nutzerentscheidung im Interview; wahrt Single Responsibility (Profildaten vs. Zeitbereich-Zusagen sind fachlich getrennte Datenquellen) | 2026-07-16 |
| `admin`, `su`, `aktiv` und `verein` bleiben für das Mitglied nicht editierbar | Eigene Produktentscheidung, konsistent mit dem bestehenden Rechtemodell (diese Felder sind exklusiv Admin/SU/direkt-in-Supabase vorbehalten, siehe PROJ-3/PROJ-7) | 2026-07-16 |
| **Refinement 2026-07-17:** Neues Feld `telefonnummer` wird eingeführt — optionales Freitextfeld, editierbar sowohl im eigenen Profil (dieses Feature) als auch admin-seitig (PROJ-7), sichtbar in der Mitgliedersuche (PROJ-13) | Nutzeranforderung nach dem Deployment ("Bei allen usern fehlt das Feld Telefonnummer"); Platzierung/Bearbeitbarkeit folgt exakt dem bereits etablierten Muster von `mitgliedsnumer` (gleiche drei Features betroffen, gleiche Editierbarkeits-Matrix Admin+Mitglied) | 2026-07-17 |
| Admin darf die Telefonnummer auch für andere Mitglieder bearbeiten (PROJ-7), nicht nur das Mitglied selbst | Nutzerentscheidung im Refinement-Interview; Konsistenz mit allen anderen Stammdatenfeldern, die Admin und Mitglied bereits gleichermaßen bearbeiten dürfen — eine Ausnahme nur für dieses eine Feld wäre eine unbegründete Asymmetrie | 2026-07-17 |

### Technical Decisions
<!-- Added by /architecture -->
| Decision | Rationale | Date |
|----------|-----------|------|
| Neue serverseitige Route `PATCH /api/profil` (kein `id`-Parameter, Ziel ist immer die eigene Zeile des Aufrufers) statt eines direkten Browser→Supabase-Updates | E-Mail-Synchronisation nach `auth.users` ohne Bestätigungslink erfordert den Service-Role-Key, der nicht im Browser laufen darf — identisches Muster wie die bestehende `PATCH /api/mitglieder/[id]`-Route aus PROJ-7, nur ohne Admin-only-Felder und ohne `id`-Parameter | 2026-07-16 |
| Passwort-Änderung läuft als direkter Browser-Call (kein neuer API-Endpunkt) | Der Nutzer hat bereits eine gültige, authentifizierte Session; das Ändern des eigenen Passworts erfordert keinen Service-Role-Zugriff | 2026-07-16 |
| Profilbild-Upload läuft direkt Browser→Supabase-Storage (Bucket `adalo-media`, gleiches Pfadschema `users/{vereinId}-{userId}-{dateiname}` wie PROJ-7) | Kein Geheimnis zu schützen, konsistent mit dem bestehenden Upload-Muster für Vereinslogo/Kategorie-Bild/Admin-Mitgliederfoto; braucht lediglich eine erweiterte Storage-Policy (siehe unten) | 2026-07-16 |
| Neue RLS-Policy `users_update_own` auf `public.users`: Mitglied darf die eigene Zeile aktualisieren (`auth_user_id = auth.uid()`) | Bisher existierte für normale Mitglieder gar keine UPDATE-Policy auf die eigene Zeile (nur `users_select_own`); PROJ-7s Update-Policies gelten ausschließlich für Admins/SU | 2026-07-16 |
| Bestehender PROJ-7-Guard-Trigger (blockiert bereits `verein`-Änderungen bei authentifizierten Selbst-Updates) wird erweitert: blockiert zusätzlich Änderungen an `admin`, `su` oder `aktiv`, wenn der Aufrufer diese Rechte für die betroffene Zeile nicht bereits besitzt | Schließt die durch `users_update_own` neu entstehende Rechteausweitungs-Lücke (ein Mitglied könnte sonst per direktem REST-Call, außerhalb der App-UI, sich selbst `admin`/`su`/`aktiv` setzen) — Nutzerentscheidung im Architektur-Review; konsistent mit dem PROJ-7-Prinzip "kein pauschaler Bypass, nur eng geführte, explizit geprüfte Ausnahmen" | 2026-07-16 |
| Neue Storage-Policy-Klausel auf `storage.objects` für den Pfad `users/{vereinId}-{userId}-*`: zusätzlich INSERT/SELECT/UPDATE für den Eigentümer selbst (nicht nur Admin/SU wie in PROJ-7) | Ermöglicht den Selbst-Upload des eigenen Profilbilds ohne die bestehenden Admin-Storage-Policies aus PROJ-7 aufzuweichen (Pfad-Präfix bleibt weiterhin vereins-/nutzergebunden) | 2026-07-16 |
| Vereinsname wird read-only über die bereits bestehende `vereine_select_own`-Policy (aus PROJ-3) geladen, keine neue Policy nötig | Diese Policy erlaubt einem Mitglied bereits das Lesen der eigenen `vereine`-Zeile; PROJ-12 nutzt sie erstmals für eine sichtbare Anzeige (bisher nur intern für den `freigeschaltet`-Check bei Login verwendet) | 2026-07-16 |
| Bearbeiten-Dialog und Passwort-Dialog werden Teil derselben `src/app/profil/page.tsx`-Komponente (zwei separate Dialoge), keine eigenen Routen | Konsistent mit dem Ein-Seiten-Dialog-Muster von PROJ-4/5/6/7; die Seite ist klein genug (kein Listing, nur ein Datensatz) | 2026-07-16 |
| Keine neuen npm-Pakete | `@supabase/supabase-js`, `zod`, `react-hook-form` sowie die benötigten shadcn/ui-Komponenten (`dialog`, `form`, `input`, `avatar`, `button`, `alert`) sind bereits im Projekt vorhanden | 2026-07-16 |
| **Refinement 2026-07-17:** Neue Spalte `public.users.telefonnummer` (`text`, nullable, kein Default) | Reines Freitextfeld ohne Formatvalidierung, identischer Spaltentyp wie `mitgliedsnumer`; keine neue RLS-Policy nötig — die bestehenden `users_update_own`/`users_update_own_verein_admin`-Policies (PROJ-7/12) sind spaltenunabhängig und decken die neue Spalte automatisch ab | 2026-07-17 |
| `PATCH /api/profil`- und `PATCH /api/mitglieder/[id]`-Zod-Schemas um optionales `telefonnummer: z.string().nullable().optional()` erweitert | Identisches Muster wie die bereits vorhandenen optionalen Freitextfelder (`mitgliedsnumer`, `geburtstag`) in denselben Routen | 2026-07-17 |

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)

### A) Component Structure

Visuelle Vorlage: `public/Profil anzeigen.jpg` (Adalo-Mockup) — Foto-Rahmen, Name in Gelb, Vereinsname als Wasserzeichen-Overlay, blaue/gelbe Buttons. Bindend für `/frontend`.

```
/profil (bestehende Seite, erweitert)
├── Zugriffsprüfung (bestehend, unverändert): keine Session → Redirect zu "/"
├── Profil-Ansicht (NEU, ersetzt die bisherige reine "Eingeloggt als ..."-Zeile)
│   ├── Profilbild (rund, `profile_picture_url`; neutraler Platzhalter falls leer)
│   ├── Vorname + Nachname
│   ├── E-Mail
│   └── Vereinsname (read-only, aus `vereine`-Tabelle nachgeladen)
├── Button "Profil ändern" (NEU) → öffnet Bearbeiten-Dialog
├── Button "Passwort ändern" (NEU) → öffnet Passwort-Dialog
├── Button "Vereinseinstellungen" (bestehend, nur sichtbar für Admin) → /voreinstellung
├── Button "Logout" (bestehend, unverändert)
│
├── Bearbeiten-Dialog "Profil ändern" (NEU)
│   ├── Vorname, Nachname, E-Mail (Pflicht)
│   ├── Mitgliedsnummer, Geburtstag, Titel vorher/nachher (optional, Freitext)
│   ├── Profilbild-Upload (Vorschau, PNG/JPG/SVG, max. 2 MB)
│   ├── "Speichern"-Button
│   └── Fehlermeldung (Duplikat-E-Mail, Validierung, API nicht erreichbar)
│
└── Passwort-Dialog "Passwort ändern" (NEU)
    ├── Neues Passwort, Passwort-Wiederholung (beide Pflicht, min. 6 Zeichen)
    ├── "Ändern"-Button
    └── Fehlermeldung (Mismatch, zu kurz, API nicht erreichbar)
```

### B) Data Model (fachlich, kein Code)

- Keine neue Tabelle. Nutzt weiterhin die bestehende `users`-Tabelle (dieselben Felder wie in PROJ-7: `vorname`, `nachname`, `email`, `mitgliedsnumer`, `geburtstag`, `titel_nachher`, `vorher_titel`, `profile_picture_url`).
- Neu: Mitglied darf diese Felder jetzt auch an der eigenen Zeile schreiben (bisher nur Admin/SU über PROJ-7).
- Weiterhin nicht editierbar durch das Mitglied selbst: `admin`, `su`, `aktiv`, `verein` (siehe Decision Log — technisch abgesichert, nicht nur im Formular versteckt).
- Vereinsname wird zusätzlich (rein lesend) aus `vereine` nachgeladen, referenziert über `users.verein[0]`.
- "Eigene Zeile" bestimmt sich wie überall im Projekt über `users.auth_user_id = auth.uid()`.

### C) Tech-Entscheidungen (Begründung für PM)

- **Neue API-Route nur für Profildaten inkl. E-Mail, nicht fürs Passwort**: Nur die E-Mail-Synchronisation nach `auth.users` (ohne Bestätigungslink, wie im Interview entschieden) erfordert den Service-Role-Key. Das Passwort-Ändern nutzt die bereits bestehende, authentifizierte Session des Nutzers direkt — kein zusätzlicher Endpunkt nötig.
- **Neue Datenbank-Sperre statt reiner Formular-Beschränkung**: Sobald ein Mitglied überhaupt Schreibzugriff auf die eigene Zeile bekommt, könnte es diesen Zugriff theoretisch auch außerhalb der App nutzen (z.B. über einen direkten Programmier-Zugriff auf die Datenbank-Schnittstelle). Deshalb wird die Sperre gegen Selbst-Beförderung (`admin`/`su`/`aktiv`) zusätzlich fest in der Datenbank verankert, nicht nur im Formular versteckt — gleiches Sicherheitsprinzip wie beim "letzter Admin"-Schutz aus PROJ-7.
- **Profilbild-Upload und Vereinsname-Anzeige ohne neue Endpunkte**: Beide nutzen bereits etablierte Muster (Storage-Policy-Erweiterung bzw. bereits vorhandene Lese-Policy aus PROJ-3) — kein zusätzlicher Code-Pfad nötig.
- **Eine Seite statt mehrerer Routen**: Profilansicht, Bearbeiten-Dialog und Passwort-Dialog bleiben Teil derselben `/profil`-Seite — spart zwei fast leere Zusatzseiten für einen einzelnen Datensatz.

### D) Dependencies

- Keine neuen Pakete: `@supabase/supabase-js`, `zod`, `react-hook-form`, `shadcn/ui` (`dialog`, `form`, `input`, `avatar`, `button`, `alert`) — alles bereits im Projekt vorhanden.

## Frontend Implementation Notes

**Gebaut:** `/profil` (`src/app/profil/page.tsx`) vollständig erweitert, gleiche Ein-Seiten-Struktur wie zuvor (Zugriffsprüfung, dann Ansicht), keine neue Route.

- Zugriffsschutz unverändert: keine Session → Redirect zu "/". Lädt jetzt zusätzlich alle editierbaren Felder (`vorname`, `nachname`, `email`, `mitgliedsnumer`, `geburtstag`, `vorher_titel`, `titel_nachher`, `profile_picture_url`, `verein`) statt nur `admin`
- Vereinsname wird zusätzlich rein lesend aus `vereine` nachgeladen (`vereine_select_own`-Policy aus PROJ-3 greift bereits, keine neue Policy nötig — end-to-end mit echter Testdaten-Session bestätigt)
- Profilansicht: rundes Profilbild (`profile_picture_url`, `UserRound`-Platzhalter-Icon falls leer, identisches Muster wie PROJ-7), Name in `text-brand-gold`, E-Mail, Vereinsname — Kartenlayout angelehnt an `public/Profil anzeigen.jpg`, aber mit dem bestehenden schlichteren Button-Stil der App (kein Wasserzeichen-Overlay, keine Kopfzeilen-Icons — konsistent mit dem Rest der App statt 1:1-Pixel-Kopie)
- Buttons: "Profil ändern" (blau, Pencil-Icon) → Bearbeiten-Dialog; "Passwort ändern" (outline, KeyRound-Icon) → Passwort-Dialog; "Vereinseinstellungen" (outline, nur Admin, unverändert); "Logout" (unverändert in der Funktion, Farbe auf `outline` umgestellt, damit nur "Profil ändern" als primäre blaue Aktion hervorsticht)
- Bearbeiten-Dialog: identisches Formular-/Upload-Muster wie PROJ-7s Mitglieder-Bearbeiten-Dialog (gleiche Zod-Validierung, gleicher Bucket `adalo-media`, gleiches Pfadschema `users/{vereinId}-{userId}-{dateiname}`), aber ohne die Felder `aktiv`/`admin` (bleiben für Mitglieder nicht editierbar)
- Sendet `PATCH /api/profil` mit `Authorization: Bearer <access_token>`, Body `{ vorname, nachname, email, mitgliedsnumer, geburtstag, vorherTitel, titelNachher, profilePictureUrl }` (kein `id` — Route muss aus dem Token die eigene Zeile bestimmen) — **diese Route existiert noch nicht**, wird in `/backend` gebaut, identisches Vorgehen wie bei PROJ-7s `/api/mitglieder/[id]`. Erwarteter Fehler-Contract: `{ error: "email_taken" }` bei 400 für Duplikat-E-Mail, sonst generische Fehlermeldung
- Passwort-Dialog: direkter Browser-Call `supabase.auth.updateUser({ password })`, kein Backend nötig — **end-to-end mit echter Testdaten-Session erfolgreich verifiziert** (Passwort wurde tatsächlich geändert, kein Mock)
- Client-seitige Passwort-Bestätigung über Zod `.refine()` (Mismatch-Fehler direkt unter dem Wiederholungsfeld)

**Contract für `/backend` (Route existiert noch nicht):**
- Neue Route `PATCH /api/profil`, `Authorization: Bearer <token>`, kein `id`-Parameter (Ziel = eigene Zeile über `auth.uid()`). Body: `{ vorname, nachname, email, mitgliedsnumer, geburtstag, vorherTitel, titelNachher, profilePictureUrl }`. Erwarteter Fehler-Contract: `{ error: "email_taken" }` (400), `{ error: "validation" }` (400), `{ error: "unauthorized" }` (401), sonst `{ error: "server_error" }` (500)
- Neue RLS-Policy `users_update_own` sowie Erweiterung des bestehenden PROJ-7-Guard-Triggers (blockiert Selbst-Beförderung bei `admin`/`su`/`aktiv`) müssen vor der Route stehen, sonst greift die Sicherheitslücke aus dem Architektur-Review
- Neue Storage-Policy-Klausel für `users/{vereinId}-{userId}-*`: Eigentümer-Schreibzugriff zusätzlich zu Admin/SU

**Verifiziert:** `npm run build` läuft sauber durch (`/profil`, keine TypeScript-Fehler). Visuell und funktional per Playwright gegen isolierte, danach wieder vollständig gelöschte Testdaten (temporärer Verein + Nutzer, real signInWithPassword-Session) geprüft: Profilansicht inkl. Vereinsname, Bearbeiten-Dialog (alle Felder + Bild-Upload-UI), Passwort-Dialog. Passwort-Änderung end-to-end erfolgreich (kein Mock). Profildaten-Speichern zeigt wie erwartet die Fehlermeldung "Speichern fehlgeschlagen..." (Route existiert noch nicht) — vollständiger End-to-End-Test folgt in `/backend`/`/qa`.

### Nachbesserung 2026-07-16 (Nutzerfeedback nach erster Ansicht)

**Gebaut:**
- Logout-Button: von schlichtem Outline-Button auf Gold-Outline (`border-brand-gold text-brand-gold`) mit `Power`-Icon umgestellt — 1:1 nach Bildvorlage
- Neuer Button "Meine Einteilungen" (Gold, `bg-brand-gold`, `ListChecks`-Icon) zwischen "Profil ändern" und "Passwort ändern" ergänzt — **bewusst ohne Funktion** (kein `onClick`, kein Link), da PROJ-16 noch nicht existiert; rein visueller Platzhalter auf Nutzerwunsch (widerruft die ursprüngliche Spec-Entscheidung "eher weglassen")
- "Vereinseinstellungen"-Button von Outline auf Blau (`bg-brand-blue`) umgestellt, `Settings`-Icon (Zahnrad) ergänzt — bewusst ein anderes Icon als `Pencil` (das bereits für "Profil ändern" verwendet wird), um die beiden blauen Buttons unterscheidbar zu halten
- Profilbild-/Platzhalter-Kreis von 112px auf 122px vergrößert (`h-28 w-28` → `h-[122px] w-[122px]`)
- Vereinslogo (`vereine.vereinslogo_url`, bereits bestehendes Feld aus PROJ-4) wird jetzt zusätzlich geladen und als abgesoftetes Hintergrundbild (`opacity-20 grayscale`, positioniert hinter Avatar/Name/E-Mail-Block innerhalb der Profilkarte) angezeigt, sofern gesetzt
- **Korrektur (gleicher Tag):** `object-cover` auf `object-contain` umgestellt, da `object-cover` das Logo (insbesondere den unteren "LC PYHRN-PRIEL AUSTRIA"-Schriftzug bei quadratischen Logos) beschnitten hätte — Nutzerwunsch war das vollständige Logo ohne Zuschnitt
- **Zweite Korrektur (gleicher Tag, verworfen):** Versuch mit einer CSS-Masken-Lösung (`mask-image` + `mask-mode: luminance` auf einem einfarbigen `bg-brand-blue/25`-Layer, nur Bergsilhouette sichtbar, Hintergrundfläche transparent) — vom Nutzer als "invers" zurückgemeldet: zu kräftig/flächig eingefärbt statt eines zarten Wasserzeichens, zudem nur klein zentriert (`mask-size: contain`) statt vollflächig
- **Dritte Korrektur (gleicher Tag, final):** Nutzer hat ein Referenzbild (Original-Adalo-Mockup) geliefert — Vereinslogo läuft dort vollflächig über die gesamte Karte (Kante an Kante, auch hinter Avatar/Name/E-Mail, an den Rändern leicht beschnitten) und wirkt nur als sehr zartes, kaum wahrnehmbares Muster. Umgesetzt als einfaches `<img>` mit `object-cover h-full w-full opacity-10 grayscale` (kein Mask-Trick mehr, keine Farbsubstitution) — bei so niedriger Opazität verschwimmen sowohl die dunkelblaue Logo-Fläche als auch die weiße Bergsilhouette fast vollständig mit der weißen Karte, wodurch sich die frühere "Rechteck"-Wahrnehmung von selbst auflöst (kein abgegrenzter Kasten mehr sichtbar, da das Bild jetzt randlos die ganze Karte ausfüllt)

**Verifiziert:** `npm run build` sauber. Mehrfach per Playwright gegen isolierte Testdaten (inkl. eines echten migrierten Vereinslogos) geprüft — finaler Stand entspricht visuell sehr genau der vom Nutzer gelieferten Referenz: vollflächiges, zartes Bergsilhouetten-Wasserzeichen ohne sichtbare Kastenkante.

- **Vierte Korrektur (gleicher Tag):** `object-cover` beschnitt bei quadratischem Logo vs. hochformatiger Karte weiterhin einen Teil des Bildes (u.a. die untere "AUSTRIA"-Zeile) — auf Nutzerwunsch ("proportional darstellen") auf `object-contain` umgestellt: zeigt das komplette Logo unbeschnitten und unverzerrt, mit schmalen leeren Rändern links/rechts statt Zuschnitt. Die niedrige Opazität (10%) sorgt weiterhin dafür, dass keine sichtbare Kastenkante entsteht

**Verifiziert:** `npm run build` sauber, erneut per Playwright bestätigt — komplettes Logo (inkl. Schriftzug) proportional und unbeschnitten sichtbar.

**Offen für `/refine` (PROJ-16):** Sobald "Meine Einteilungen" als eigenes Feature gebaut wird, muss dieser Platzhalter-Button in `/profil` auf die neue Route verlinkt werden.

## Backend Implementation Notes

**Gebaut (Migration `proj12_profil_self_update_rls_and_guard`, per `apply_migration` mit expliziter User-Freigabe aus dem Architektur-Review angewendet):**

- Neue RLS-Policy `users_update_own` auf `public.users`: `USING/WITH CHECK (auth_user_id = auth.uid())` — jedes Mitglied darf jetzt die eigene Zeile aktualisieren (bisher nur Admin/SU-Zeilen via PROJ-7-Policies)
- Bestehender PROJ-7-Guard-Trigger `users_before_update_guard()` um eine dritte Klausel erweitert: blockiert bei Selbst-Updates Änderungen an `admin`, `su` oder `aktiv`, wenn der Aufrufer diese Rechte für die betroffene Zeile nicht bereits besitzt (`coalesce(old.admin,false)=false and old.su is null`). Bestehende Klauseln (`verein`-Änderungssperre, "letzter Admin"-Schutz) unverändert
- Drei neue Storage-Policies auf `storage.objects` (`users_bild_insert_owner`, `users_bild_select_owner`, `users_bild_update_owner`): Eigentümer-Schreib-/Lesezugriff auf den eigenen Pfad `users/{vereinId}-{userId}-*`, als eigenständige Policies neben den bestehenden PROJ-7-Admin/SU-Policies (nicht verändert, um die bereits getestete Admin/SU-Regel nicht anzufassen)
- Neue Route `PATCH /api/profil` (`src/app/api/profil/route.ts`): identisches Muster wie `PATCH /api/mitglieder/[id]` (scoped client für die eigentliche Autorisierung/Update, Service-Role nur für den schmalen `auth.admin.updateUserById`-E-Mail-Sync), aber **kein `id`-Parameter** — Ziel ist immer `auth_user_id = auth.uid()` aus dem Token, kein Weg für den Aufrufer, eine fremde Zeile zu adressieren. Zod-Schema enthält bewusst kein `aktiv`/`admin`/`su`/`verein`
- Fehler-Contract identisch zum Frontend-Contract: `{ error: "email_taken" }` (400), `{ error: "validation" }` (400), `{ error: "unauthorized" }` (401), `{ error: "forbidden" }` (403, z.B. falls der DB-Trigger eine Änderung blockiert), sonst `{ error: "server_error" }` (500)
- Rollback-Muster bei fehlgeschlagenem Zeilen-Update nach bereits erfolgter E-Mail-Synchronisation identisch zu PROJ-7 (E-Mail wird in `auth.users` zurückgesetzt)
- Integrationstest `src/app/api/profil/profil.test.ts` (10 Tests, Vitest, gleiches Mock-Muster wie `mitglieder-id.test.ts`): deckt 401/400/403, E-Mail-Sync nur bei tatsächlicher Änderung, Duplikat-E-Mail-Vorprüfung, Rollback bei blockiertem Update, Profilbild-Feld sowie explizit ab, dass `admin`/`aktiv`/`su`/`verein` niemals im Update-Payload landen

**Verifiziert:**
- SQL-Simulation (echter Test-Auth-Account, `set_config('request.jwt.claims', ...)`): Selbst-Beförderung zu `admin=true` wird vom Trigger blockiert (Zeile bleibt `admin=false`); eine legitime Selbst-Änderung (`vorname`) geht durch — bestätigt, dass die neue Policy weder zu restriktiv noch die neue Trigger-Klausel zu großzügig ist
- `npx vitest run`: alle 95 Tests im Projekt grün (10 neue + 85 bestehende, keine Regression)
- `npm run build`: sauber, keine TypeScript-Fehler
- End-to-End per Playwright gegen isolierte, danach vollständig gelöschte Testdaten (echter Verein + 2 Nutzer, real `signInWithPassword`-Sessions): Speichern von Mitgliedsnummer/Geburtstag über die echte UI→Route→DB-Kette bestätigt (Wert bleibt nach Reload erhalten); Duplikat-E-Mail wird mit der korrekten Meldung abgelehnt; echte E-Mail-Änderung wird sofort übernommen und ein anschließender Login mit der neuen E-Mail funktioniert (kein Bestätigungsschritt, wie in der Spec entschieden)
- Profilbild-Upload (Storage-Policy) technisch angelegt, aber nicht separat end-to-end hochgeladen getestet, da bereits dasselbe Pfad-/Bucket-Muster wie PROJ-7 (dort bereits verifiziert) verwendet wird — volle Abdeckung inkl. UI-Upload-Flow folgt in `/qa`

**Contract unverändert gegenüber den Frontend-Notizen** — keine Anpassungen an `src/app/profil/page.tsx` nötig, die Route erfüllt exakt den dort bereits dokumentierten Aufruf.

### Refinement 2026-07-17: Telefonnummer

**Gebaut:** `public.users.telefonnummer` (neue Spalte, `text`, nullable) per Migration angelegt; `src/app/profil/page.tsx` um ein Formularfeld "Telefonnummer (optional)" erweitert (nach E-Mail, vor Mitgliedsnummer); `PATCH /api/profil`-Zod-Schema und Update-Payload entsprechend erweitert. Identisches, additives Muster wie die bestehenden optionalen Felder — keine neue RLS-Policy nötig (spaltenunabhängig).

**Verifiziert (echte, disposable Test-Accounts, danach gelöscht):** Mitglied setzt eigene Telefonnummer über `/profil` → bleibt nach Reload erhalten; Admin sieht denselben Wert vorausgefüllt im PROJ-7-Bearbeiten-Dialog und kann ihn überschreiben (siehe PROJ-7-Notizen); der aktualisierte Wert erscheint korrekt im PROJ-13-Detail-Dialog. `npm test` (95/95) und `npm run test:e2e --project=chromium` (22/22) bleiben grün, `npm run build` sauber.

## QA Test Results

**Tested:** 2026-07-16
**App URL:** http://localhost:3000 (lokaler Dev-Server)
**Tester:** QA Engineer (AI)

Testaufbau: 2 isolierte Vereine, 4 Testnutzer (2 Mitglieder + 1 Admin in Verein A, 1 Mitglied in Verein B), jeweils mit echtem Supabase-Auth-Account und `signInWithPassword`-Session — gleiches Muster wie in PROJ-3/4/5/6/7/10/11. Alle Testdaten wurden nach dem Lauf vollständig gelöscht (verifiziert: 0 verbleibende Zeilen).

### Acceptance Criteria Status

#### AC-1: Profilansicht (Mitglied)
- [x] Zeigt Profilbild-Platzhalter, Name, E-Mail, Vereinsname, Buttons "Profil ändern"/"Passwort ändern"/"Logout"
- [x] Nicht-Admin sieht KEINEN "Vereinseinstellungen"-Button

#### AC-2: Profilansicht (Admin)
- [x] Admin sieht zusätzlich "Vereinseinstellungen"

#### AC-3: Profilbild-Platzhalter
- [x] Ohne `profile_picture_url` erscheint der neutrale Platzhalter (identisch zu PROJ-7)

#### AC-4: Bearbeiten-Dialog vorausgefüllt
- [x] Vorname/Nachname/E-Mail korrekt vorausgefüllt beim Öffnen

#### AC-5: Validierung Pflichtfelder
- [x] Leeres Pflichtfeld blockiert das Speichern, Dialog bleibt offen

#### AC-6: Duplikat-E-Mail
- [x] E-Mail eines anderen Accounts → "Diese E-Mail ist bereits registriert", nichts gespeichert

#### AC-7: Erfolgreiches Speichern
- [x] Änderungen (inkl. Mitgliedsnummer/Geburtstag/Titel) sofort übernommen, bleiben nach Reload erhalten
- [x] E-Mail-Änderung ohne Bestätigungsschritt sofort wirksam; Login mit neuer E-Mail funktioniert (echter Test, kein Mock)

#### AC-8: Profilbild-Upload (gültig)
- [x] Vorschau nach Auswahl sichtbar
- [x] Nach Speichern erscheint das neue Foto auf `/profil`

#### AC-9: Profilbild-Upload (ungültig)
- [x] Falsches Format (`.txt`) → Fehlermeldung, Upload abgebrochen
- [x] Zu große Datei (>2 MB) → Fehlermeldung, Upload abgebrochen

#### AC-10: Passwort ändern (gültig)
- [x] Erfolgreiche Änderung, Dialog schließt; anschließender Login mit neuem Passwort funktioniert (echter Test)

#### AC-11: Passwort ändern (ungültig)
- [x] Mismatch zwischen Passwort/Wiederholung → Validierungsfehler
- [x] Zu kurzes Passwort (<6 Zeichen) → Validierungsfehler

#### AC-12: API nicht erreichbar
- [x] Simulierter Netzwerkfehler (Route abgefangen) → Fehlermeldung, Formulareingaben bleiben erhalten

#### AC-13: Logout
- [x] Session beendet, Redirect zur öffentlichen Startseite

#### AC-14: Cross-Tenant-/Cross-User-Isolation
- [x] Mitglied kann ausschließlich die eigene Zeile lesen/ändern (siehe Security Audit unten)

### Edge Cases Status

#### EC-1: Migriertes Mitglied ohne Mitgliedsnummer/Geburtstag/Titel
- [x] Felder erscheinen leer, kein Validierungsfehler (verifiziert mit unberührtem Testnutzer, nachdem ein erster Versuch fälschlich fehlschlug — Ursache war Datenverschmutzung durch einen eigenen vorherigen QA-Regressionstest, kein Produkt-Bug, siehe Hinweis unten)

#### EC-2: Keine erzwungene Abmeldung nach eigener E-Mail-Änderung
- [x] Session bleibt nach E-Mail-Änderung gültig, kein Redirect zum Login

#### EC-3: Getrennte Fehlerbehandlung Profildaten vs. Passwort
- [x] Implizit durch getrennte Dialoge/Endpunkte bestätigt (kein gemeinsamer State zwischen Profil- und Passwort-Formular)

### Security Audit Results (Red-Team)
- [x] **Cross-User-UPDATE blockiert:** Mitglied A kann per direktem REST-Call `public.users` von Mitglied B (selber Verein) nicht ändern (0 betroffene Zeilen, RLS greift)
- [x] **Cross-Verein-SELECT blockiert:** Mitglied kann die Zeile eines Mitglieds aus einem anderen Verein nicht lesen (RLS liefert `null`)
- [x] **Selbst-Beförderung zu `admin=true` blockiert:** Trigger wirft `SELBST_BEFOERDERUNG_NICHT_ERLAUBT`, per direktem REST-Call verifiziert (nicht nur SQL-Simulation aus `/backend`)
- [x] **Selbst-Beförderung zu `su` blockiert:** identischer Trigger-Schutz greift
- [x] **Selbst-Änderung von `verein` blockiert:** bestehender PROJ-7-Schutz (`VEREIN_AENDERUNG_NICHT_ERLAUBT`) greift weiterhin
- [x] **`PATCH /api/profil` ignoriert `admin`/`su`/`aktiv` im Body:** Zusatzfelder in einem manipulierten Request werden vom Zod-Schema nicht verarbeitet, Zeile bleibt unverändert (per direktem `fetch`-Aufruf mit echtem Token verifiziert, nicht nur über die UI)
- [x] **XSS:** `<script>`-Payload in Vorname wird als reiner Text gespeichert und von React escaped gerendert; kein Skript wird ausgeführt (per `page.on("dialog")`-Listener und `window`-Flag-Check bestätigt), auch nicht in der PROJ-7-Admin-Kartenansicht (Regressionscheck)
- [x] Keine Service-Role-Keys oder sonstigen Secrets im Client-Bundle/Netzwerkverkehr sichtbar (architektonisch durch serverseitige Route abgesichert)
- [ ] Rate Limiting: nicht implementiert — bestehende, projektweite Lücke (kein Feature im Projekt hat Rate Limiting), kein PROJ-12-spezifisches Problem, siehe `docs/production/rate-limiting.md`

### Regression Testing
- [x] PROJ-7 (Mitgliederverwaltung Admin): Admin kann weiterhin ein anderes Mitglied bearbeiten — die neue `users_update_own`-Policy und die Trigger-Erweiterung beeinträchtigen den Admin-Bearbeiten-Flow nicht
- [x] PROJ-7-Kartenansicht rendert einen Namen mit XSS-Payload ohne Absturz oder Skriptausführung
- [x] PROJ-3 (Login/Logout): Login mit geänderter E-Mail bzw. geändertem Passwort funktioniert; Logout-Flow unverändert

### Responsive & Cross-Browser
- [x] Chromium: 375px (Mobile), 768px (Tablet), 1440px (Desktop) — sauberes Layout auf allen Breakpoints, Inhalt bleibt zentriert (`max-w-[600px]`, konsistent mit dem Rest der App)
- [x] WebKit (Safari-Engine, Mobile-Viewport via `playwright.config.ts`-Projekt "Mobile Safari"): identisches Rendering, keine Layout-Brüche

### Automatisierte Tests
- [x] `npm test` (Vitest): 95/95 Tests grün (10 neue für `PATCH /api/profil`, keine Regression)
- [x] `npm run test:e2e` (neue Datei `tests/PROJ-12-profil-verwaltung.spec.ts`): 2/2 grün (Chromium + Mobile Safari) — deckt den nicht-authentifizierten Redirect ab; alle Kriterien, die einen echten eingeloggten Account erfordern, wurden wie oben beschrieben per Skript gegen echte Testdaten verifiziert (kein Seed-Fixture-Mechanismus im Projekt, siehe PROJ-1/PROJ-3–7/10/11)
- [x] `npm run build`: sauber, keine TypeScript-Fehler

### Bugs Found
Keine.

### Summary
- **Acceptance Criteria:** 14/14 passed (inkl. aller Unterkriterien)
- **Bugs Found:** 0 (0 critical, 0 high, 0 medium, 0 low)
- **Security:** Pass — Cross-Tenant-Isolation, Selbst-Beförderungs-Schutz und XSS-Escaping per Red-Team-Test bestätigt; Rate Limiting ist eine bekannte, projektweite Lücke außerhalb des PROJ-12-Scopes
- **Production Ready:** YES
- **Recommendation:** Deploy

## Deployment

**Deployed:** 2026-07-17
**Production URL:** https://simpliplan.toolies.eu/profil
**Mechanism:** GitHub Actions (`.github/workflows/deploy.yml`) — SSH nach Hetzner bei jedem Push auf `main`, `npm run build` + PM2-Reload (`ecosystem.config.js`, Prozess "SimpliPlan"). Kein Vercel (siehe PROJ-4).

- Pre-Deployment-Checks: `npm run build` sauber, QA Approved (14/14 AC, 0 Bugs), DB-Migration `proj12_profil_self_update_rls_and_guard` bereits in `/backend` angewendet, kein neuer Eintrag in `.env.local.example` nötig (keine neuen Env-Variablen), Diff auf Secrets geprüft (keine gefunden). `npm run lint` weiterhin am vorbestehenden, projektunabhängigen Problem (fehlende `eslint.config.js`) gescheitert — kein neuer Blocker.
- Commit `feat(PROJ-12): Implement Profil-Verwaltung (spec, architecture, frontend, backend, QA)` (konsolidierter Commit für alle Phasen, analog zu PROJ-6) gepusht nach `main`. `.claude/settings.json` sowie zwei nicht mit PROJ-12 zusammenhängende, bereits vorher lose im Repo liegende Dateien (`public/LC PP.jpg`, `public/Mitgliederverwaltung.jpg`) blieben bewusst ungetrackt/uncommitted
- Deploy ausgelöst durch `git push origin main`, GitHub-Actions-Run [`29537775896`](https://github.com/GeSt59/SimpliPlan-2.0/actions/runs/29537775896) — `completed` / `success`
- Tag `v1.10.0-PROJ-12` erstellt und gepusht
- Post-Deployment-Verifikation (read-only, gegen die echte Domain): `/`, `/profil`, `/mitglieder` liefern HTTP 200; `PATCH /api/profil` ohne Authorization-Header liefert 401 (Route korrekt abgesichert); unauthentifizierter Zugriff auf `/profil` redirected per Playwright korrekt zu `/`; keine Browser-Konsolenfehler
- Production-Ready-Essentials (Error Tracking/Security Headers/Performance/Rate Limiting) weiterhin nicht projektweit eingerichtet — nicht Teil von PROJ-12, betrifft die gesamte App gleichermaßen wie schon bei PROJ-3–11/15
