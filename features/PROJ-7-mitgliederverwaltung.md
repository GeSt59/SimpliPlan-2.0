# PROJ-7: Mitgliederverwaltung (Admin)

## Status: Deployed
**Created:** 2026-07-11
**Last Updated:** 2026-07-17

> **Refinement (2026-07-12):** Nutzer hat nach dem ersten Deployment ein visuelles Redesign angefordert (Foto-Karten-Ansicht nach Vorbild der alten Adalo-App statt der einfachen Liste) sowie zwei neue Fähigkeiten: Profilbild-Upload/-Anzeige und hartes Löschen von Mitgliedern. Status auf "Planned" zurückgesetzt, da der neue Umfang eine erneute `/architecture`→`/frontend`→`/backend`→`/qa`→`/deploy`-Runde braucht. Die bereits deployte Basisfunktionalität (Liste, Bearbeiten, Anlegen, Aktiv/Admin-Toggle, letzter-Admin-Schutz, SU-Switcher) bleibt unverändert live und funktionsfähig, während diese Erweiterung entsteht.

> **Refinement (2026-07-17):** Neues Feld `telefonnummer` (siehe PROJ-12-Refinement vom selben Tag) wird zusätzlich admin-seitig editierbar — Admin darf die Telefonnummer beliebiger Mitglieder des eigenen Vereins bearbeiten, identisches Muster wie die bereits editierbaren Felder Mitgliedsnummer/Geburtstag/Titel. Kein neuer `/architecture`-Durchlauf nötig (rein additives Formularfeld, keine neuen Berechtigungsfragen), direkt über `/frontend`+`/backend` umgesetzt.

## Dependencies
- PROJ-1 (Supabase Infrastruktur Multi-Tenant + RLS) — für RLS-Policies, die Mitglieder-Zugriff auf den eigenen Verein beschränken
- PROJ-3 (Authentifizierung) — für eingeloggten Admin-Zugriff (`users.admin`), die Verein-Zuordnung des Nutzers und den Supabase-Auth-Account-Mechanismus, der beim manuellen Anlegen wiederverwendet wird
- PROJ-4 (Verein-Verwaltung & Voreinstellungen) — etabliert das Muster für Admin-Only-Seiten und den Startseiten-Button als Einstiegspunkt

## User Stories
- Als Admin möchte ich alle Mitglieder meines Vereins in einer durchsuchbaren Liste sehen, damit ich schnell den passenden Datensatz finde.
- Als Admin möchte ich Stammdaten eines Mitglieds bearbeiten (Name, E-Mail, Telefonnummer, Mitgliedsnummer, Geburtstag, Titel), damit die Daten aktuell bleiben.
- Als Admin möchte ich ein Mitglied deaktivieren/reaktivieren können, damit ausgeschiedene Mitglieder markiert sind, ohne ihre Daten zu verlieren.
- Als Admin möchte ich einem Mitglied Admin-Rechte für meinen Verein verleihen oder entziehen können, damit ich Verantwortung auf mehrere Personen verteilen kann.
- Als Admin möchte ich ein neues Mitglied manuell anlegen können (ohne dass die Person sich selbst mit Freischaltcode registriert), damit ich auch Personen ohne eigene Registrierung Zugang geben kann.
- Als Admin möchte ich beim Entfernen der eigenen Admin-Rechte oder Selbst-Deaktivierung geschützt werden, wenn ich der letzte Admin des Vereins bin, damit sich der Verein nicht versehentlich komplett aussperrt.
- Als Mitglied (kein Admin) möchte ich keinen Zugriff auf die Mitgliederverwaltung haben, damit administrative Funktionen von meiner Ansicht getrennt bleiben.
- Als SuperUser möchte ich zuerst einen Verein auswählen und dann dessen Mitglieder genauso verwalten können wie der jeweilige Verein-Admin, damit ich bei Bedarf vereinsübergreifend unterstützen kann (z.B. wenn ein Verein aktuell keinen aktiven Admin hat).
- Als Admin möchte ich meine Mitglieder in einer Foto-Karten-Ansicht (2 Spalten, Portraitfoto, Name + E-Mail überlagert) sehen, damit ich Personen schneller visuell wiedererkenne — nach Vorbild der bisherigen Adalo-App.
- Als Admin möchte ich zwischen der Foto-Karten-Ansicht und einer einfachen Listenform umschalten können, damit ich je nach Situation (z.B. viele Mitglieder ohne Foto) die passendere Ansicht wählen kann.
- Als Admin möchte ich direkt auf das Profilfoto/die Karte eines Mitglieds klicken, um in den Bearbeiten-Dialog zu gelangen, damit ich nicht extra einen separaten Button treffen muss.
- Als Admin möchte ich das Profilbild eines Mitglieds hochladen/ersetzen können, damit die Foto-Karten-Ansicht auch für Bestandsmitglieder ohne migriertes Foto nutzbar wird.
- Als Admin möchte ich ein Mitglied unwiderruflich löschen können (nicht nur deaktivieren), damit ich Karteileichen und irrtümlich angelegte Accounts vollständig entfernen kann.

## Out of Scope
- Vergabe von SuperUser-Rechten (`users.su`) über die App-UI — der SU setzt das Feld direkt in Supabase (bewusste Nutzerentscheidung), kein Feature dafür in PROJ-7 oder der Roadmap (siehe PROJ-3 Open Questions)
- Bearbeiten von `mitgliedsnumer`, `geburtstag`, `titel_nachher`, `vorher_titel`, `telefonnummer` durch das Mitglied selbst — das ist Teil von PROJ-12 (Profil-Verwaltung); PROJ-7 gibt dem Admin lediglich zusätzlich Schreibzugriff auf dieselben Felder
- Formatvalidierung der Telefonnummer — reines Freitextfeld, identisch zu Mitgliedsnummer (Refinement 2026-07-17)
- Passwort-Reset für ein Mitglied durch den Admin (z.B. "Passwort zurücksetzen"-Button) — Mitglieder nutzen dafür den bestehenden "Passwort vergessen"-Flow aus PROJ-3
- Einladungs-E-Mail-Versand (Supabase Invite/Magic Link) — kein E-Mail-Versand-Service für dieses Projekt verifiziert; Admin gibt das Initial-Passwort stattdessen persönlich weiter
- Mitgliedersuche/-ansicht für normale Mitglieder (Vereinskollegen finden) — eigenes Feature PROJ-13 (Mitglieder-Ansicht/Suche)
- Teilnehmer-/Zuteilungs-Übersicht pro Mitglied (wer ist wann eingeteilt) — eigenes Feature PROJ-11 (Teilnehmer-Übersicht)
- Eindeutigkeits-Constraint auf Mitgliedsnummer — reines Freitextfeld, keine Validierung
- Bulk-Operationen (z.B. mehrere Mitglieder gleichzeitig deaktivieren)
- Anlegen/Verwaltung mehrerer Vereinsmitgliedschaften pro Account (siehe PRD Non-Goals: 1 Account = 1 Verein)
- Selbst-Upload des eigenen Profilbilds durch das Mitglied (ohne Admin) — gehört zu PROJ-12 (Profil-Verwaltung); PROJ-7 deckt nur den Admin-seitigen Upload für beliebige Mitglieder des eigenen Vereins ab
- Bildzuschnitt/-bearbeitung (Crop, Rotation) beim Profilbild-Upload — Bild wird 1:1 wie hochgeladen übernommen, gleiches Muster wie Vereinslogo (PROJ-4) und Kategorie-Bild (PROJ-5)
- Papierkorb/Wiederherstellen gelöschter Mitglieder — hartes Löschen ist endgültig, kein Soft-Delete

## Acceptance Criteria

**Format:** Angenommen [Vorbedingung] / Wenn [Aktion] / Dann [Ergebnis]

- [ ] Angenommen ein Admin ist eingeloggt, wenn er die Startseite aufruft, dann sieht er einen Button "Mitglieder" zu `/mitglieder`
- [ ] Angenommen ein Mitglied (kein Admin) ist eingeloggt, wenn es die Startseite aufruft, dann sieht es keinen Button zu `/mitglieder`
- [ ] Angenommen ein Mitglied (kein Admin) ruft `/mitglieder` direkt über die URL auf, dann wird es sofort zu "/" umgeleitet
- [ ] Angenommen ein Admin ruft `/mitglieder` auf, dann sieht er alle Mitglieder seines eigenen Vereins sortiert nach Nachname, inklusive Status-Anzeige (aktiv/inaktiv, Admin-Flag)
- [ ] Angenommen der Admin gibt einen Suchbegriff ein, dann filtert die Liste live auf Treffer in Vorname, Nachname oder E-Mail
- [ ] Angenommen der Admin wählt den Filter "Nur aktiv" oder "Nur inaktiv", dann zeigt die Liste ausschließlich Mitglieder mit dem entsprechenden Status
- [ ] Angenommen der Verein des Admins hat noch keine Mitglieder außer sich selbst, wenn er `/mitglieder` aufruft, dann sieht er einen Leerzustand mit Hinweistext und einer Aktion zum manuellen Anlegen eines Mitglieds
- [ ] Angenommen der Admin öffnet ein bestehendes Mitglied zum Bearbeiten, dann sind Vorname, Nachname, E-Mail, Telefonnummer, Mitgliedsnummer, Geburtstag und Titel vorausgefüllt
- [ ] Angenommen der Admin ändert Stammdaten eines Mitglieds und speichert, dann werden die Änderungen übernommen und eine Erfolgsmeldung angezeigt
- [ ] Angenommen Vorname, Nachname oder E-Mail werden beim Bearbeiten oder Anlegen leer gelassen, wenn der Admin speichert, dann wird für jedes leere Pflichtfeld ein Validierungsfehler angezeigt und nichts gespeichert
- [ ] Angenommen die eingegebene E-Mail ist bei einem anderen Account bereits registriert, wenn der Admin speichert (Bearbeiten oder Anlegen), dann wird die Fehlermeldung "Diese E-Mail ist bereits registriert" angezeigt und nichts gespeichert
- [ ] Angenommen der Admin schaltet den Aktiv-Status eines anderen Mitglieds um, dann wird die Änderung sofort gespeichert und in der Liste sichtbar
- [ ] Angenommen der Admin schaltet sein eigenes Admin-Flag aus oder deaktiviert sich selbst, und er ist NICHT der einzige Admin des Vereins, dann wird die Änderung normal übernommen
- [ ] Angenommen der Admin ist der einzige verbliebene Admin seines Vereins, wenn er versucht, sein eigenes Admin-Flag zu entfernen oder sich selbst zu deaktivieren, dann wird die Aktion verhindert und eine erklärende Fehlermeldung angezeigt
- [ ] Angenommen der Admin klickt "Neues Mitglied anlegen" und füllt Vorname, Nachname, E-Mail und ein Initial-Passwort aus, dann wird ein neuer Auth-Account samt `users`-Zeile angelegt (zugeordnet zum eigenen Verein, `admin = false`, `aktiv = true`) und erscheint in der Liste
- [ ] Angenommen das Initial-Passwort beim manuellen Anlegen ist kürzer als 6 Zeichen, wenn der Admin speichert, dann wird ein Validierungsfehler angezeigt und kein Account angelegt
- [ ] Angenommen die Supabase-API ist beim Speichern nicht erreichbar, dann wird eine Fehlermeldung angezeigt und die Formulareingaben bleiben erhalten
- [ ] Angenommen ein Admin von Verein A ist eingeloggt, dann sieht und bearbeitet `/mitglieder` ausschließlich Mitglieder von Verein A (nie Mitglieder eines anderen Vereins)
- [ ] Angenommen ein SuperUser ist eingeloggt, wenn er `/mitglieder` aufruft, dann sieht er zuerst eine Auswahl aller Vereine (Verein-Switcher) statt direkt einer Mitgliederliste
- [ ] Angenommen der SuperUser wählt einen Verein aus, dann sieht er dieselbe Mitgliederliste samt aller Aktionen (Suche, Filter, Bearbeiten, Aktiv/Inaktiv, Admin-Flag, manuell anlegen), wie sie ein Admin dieses Vereins sehen würde
- [ ] Angenommen der SuperUser entfernt das Admin-Flag oder den Aktiv-Status eines anderen Nutzers (nicht sich selbst), auch wenn dieser Nutzer der letzte Admin des gewählten Vereins ist, dann wird die Änderung ohne den "letzter Admin"-Schutz übernommen (dieser Schutz gilt ausschließlich bei Selbst-Änderung, unabhängig von der Rolle des Handelnden)
- [ ] Angenommen der Admin ruft `/mitglieder` auf, dann sieht er standardmäßig die Foto-Karten-Ansicht (2 Spalten): Portraitfoto (oder Platzhalter ohne Foto), Name und E-Mail als Overlay unten auf dem Foto, Papierkorb-Icon oben rechts
- [ ] Angenommen der Admin klickt auf den Button "In Listenform", dann wechselt die Ansicht zur einfachen Listenform (wie vor diesem Redesign); ein erneuter Klick wechselt zurück zur Foto-Karten-Ansicht
- [ ] Angenommen der Admin klickt auf das Foto/die Karte eines Mitglieds (in der Foto-Karten-Ansicht), dann öffnet sich derselbe Bearbeiten-Dialog wie über den "Bearbeiten"-Button in der Listenform
- [ ] Angenommen der Admin lädt im Bearbeiten-Dialog ein neues Profilbild hoch (PNG/JPG/SVG, max. 2 MB), dann wird eine Vorschau angezeigt; nach dem Speichern erscheint das neue Foto in der Foto-Karten-Ansicht
- [ ] Angenommen der Admin lädt eine ungültige Datei (falsches Format oder zu groß) als Profilbild hoch, dann wird eine Fehlermeldung angezeigt und der Upload abgebrochen, das bisherige Bild bleibt unverändert
- [ ] Angenommen ein Mitglied hat kein Profilbild, dann zeigt die Foto-Karten-Ansicht einen neutralen Platzhalter anstelle eines Fotos
- [ ] Angenommen der Admin klickt auf das Papierkorb-Icon einer Mitglieds-Karte, dann erscheint ein Bestätigungsdialog ("Mitglied X unwiderruflich löschen?"); nach Bestätigung werden Auth-Account und `users`-Zeile entfernt und das Mitglied verschwindet aus der Liste
- [ ] Angenommen der Admin bricht den Lösch-Bestätigungsdialog ab, dann wird nichts gelöscht
- [ ] Angenommen der Admin versucht, sich selbst (die eigene "Du"-Zeile) zu löschen, dann wird das verhindert (analog zum "letzter Admin"-Schutz — ein Admin kann sich nicht selbst aus der Verwaltung entfernen)

## Edge Cases
- Admin ist der einzige Admin des Vereins und versucht, sich selbst das Admin-Flag zu entziehen oder sich zu deaktivieren → verhindert (siehe AC), Fehlermeldung erklärt den Grund
- Zwei Admins desselben Vereins bearbeiten gleichzeitig unterschiedliche Mitglieder → kein Locking im MVP, unabhängige Operationen, kein Konflikt (konsistent mit PROJ-4/5/6)
- Admin legt ein Mitglied mit einer bereits vergebenen E-Mail manuell an → abgedeckt durch dieselbe "bereits registriert"-Regel wie bei PROJ-3
- Admin versucht, eine leere Mitgliederliste (nur sich selbst als Mitglied) zu durchsuchen → Leerzustand statt kaputter/leerer Liste (siehe AC)
- Direkter URL-Aufruf von `/mitglieder` durch ein Mitglied eines anderen Vereins → derselbe Redirect wie bei jedem Nicht-Admin
- Admin deaktiviert ein Mitglied, das aktuell eingeloggt ist → laut PROJ-3-Entscheidung beeinflusst `aktiv` den Login nicht; die Session des betroffenen Mitglieds bleibt bis zum nächsten regulären Logout aktiv (kein erzwungenes Session-Invalidieren im MVP)
- Migrierte Bestandsmitglieder ohne gesetzte Mitgliedsnummer/Geburtstag/Titel → Felder erscheinen leer im Formular, kein Pflichtfeld, kein Fehler
- SuperUser wählt einen Verein ohne jegliche Mitglieder → derselbe Leerzustand wie bei einem Admin
- SuperUser degradiert den letzten Admin eines Vereins → bewusst erlaubt (kein Schutz bei Fremdänderung durch SU), der Verein hat danach vorübergehend keinen Admin mehr, bis der SU selbst oder ein SuperUser-Eingriff einen neuen Admin setzt
- Admin löscht ein Mitglied, das bereits in einer künftigen Einteilung referenziert ist (`einstellungen.eingeteilte_users`, Feld existiert bereits aus der Adalo-Migration, auch wenn PROJ-9/10 die UI dafür noch nicht bauen) → Lösch-Schutz analog zu PROJ-5/6 (Verwendungs-Check vor dem Löschen), siehe Technical Requirements
- Admin versucht, sich selbst zu löschen → verhindert, unabhängig davon ob weitere Admins existieren (ein Admin darf sich nicht selbst aus der eigenen Verwaltung entfernen)
- Admin löscht ein Mitglied, das gerade eingeloggt ist → Auth-Account wird sofort entfernt, laufende Session des betroffenen Mitglieds wird beim nächsten Request ungültig (Supabase invalidiert den zugehörigen Refresh-Token serverseitig)
- Wechsel zwischen Foto-Karten- und Listenform während eine Suche/ein Filter aktiv ist → Suchbegriff und Filter bleiben über den Ansichtswechsel hinweg erhalten
- Profilbild-Upload schlägt wegen Netzwerkfehler fehl → Fehlermeldung, bisheriges Bild bleibt unverändert (identisches Muster wie Vereinslogo-Upload aus PROJ-4)

## Technical Requirements (optional)
- Security: Zugriff nur für `users.admin = true` des eigenen Vereins ODER `users.su` gesetzt; RLS beschränkt Lese-/Schreibzugriff auf `users`-Zeilen des eigenen Vereins (Cross-Tenant-Schutz, zentrales Projektversprechen) — der SU ist die einzige bewusste, eng geführte Ausnahme von dieser Grenze und muss in `/architecture`/`/backend` entsprechend sorgfältig abgesichert werden (kein pauschaler Bypass, sondern eine explizit auf `su` geprüfte Policy/Route)
- Manuelles Anlegen erfordert wie die Registrierung (PROJ-3) eine serverseitige API-Route, da ein neuer Auth-Account mit Service-Role-Rechten angelegt werden muss
- Initial-Passwort: gleiche Mindestlänge wie Registrierung (6 Zeichen, Supabase-Standard)
- "Letzter Admin"-Schutz muss serverseitig geprüft werden (nicht nur clientseitig), da RLS/API die eigentliche Sicherheitsgrenze ist
- Hartes Löschen erfordert wie das Anlegen eine serverseitige API-Route (Service-Role, um den Auth-Account zu entfernen); serverseitiger Verwendungs-Check gegen `einstellungen.eingeteilte_users` vor dem eigentlichen Löschen (analog zum Rollen-/Kategorien-Lösch-Schutz aus PROJ-5/6), sowie serverseitige Sperre gegen Selbst-Löschung
- Profilbild-Upload: gleiche Constraints wie Vereinslogo/Kategorie-Bild (PNG/JPG/SVG, max. 2 MB), voraussichtlich dieselbe Storage-Bucket `adalo-media` mit einem neuen Pfad-Präfix (z.B. `mitglieder/{user-id}-*`), finale Entscheidung in `/architecture`
- Feld `users.profile_picture_url` existiert bereits in der DB (bisher ungenutzt seit der Adalo-Migration) — wird für den neuen Upload-Pfad verwendet, analog zu `vereine.vereinslogo_url`/`categories.picture_url`

## Open Questions
- [x] Soll die Selbst-Änderung (eigenes Admin-Flag / eigener Aktiv-Status) über dieselbe Liste laufen wie bei anderen Mitgliedern, oder braucht es eine separate UI-Behandlung? → entschieden: dieselbe Liste, eigene Zeile erhält zusätzlich ein "Du"-Badge zur Orientierung (siehe Tech Design)
- [x] Existiert für die 32 migrierten Bestandsmitglieder bereits ein zweiter Admin pro Verein? → per Introspektion geprüft: der einzige reale Verein hat aktuell **4 Admins**, kein "letzter Admin"-Risiko im Live-Betrieb
- [x] E-Mail-Sync-Lücke aus `/frontend` → behoben: Bearbeiten läuft jetzt über eine neue `PATCH /api/mitglieder/[id]`-Route, die bei geänderter E-Mail zusätzlich `auth.users` per Service-Role synchronisiert (siehe Technical Decisions). End-to-End live verifiziert: neue E-Mail funktioniert tatsächlich zum Einloggen.
- [x] Exakter Storage-Pfad/Bucket für Profilbilder → entschieden in `/architecture`: Bucket `adalo-media` (wiederverwendet), neue Uploads unter `users/{vereinId}-{userId}-{dateiname}` (siehe Technical Decisions)
- [x] Soll die zuletzt gewählte Ansicht gemerkt werden? → entschieden: ja, per `localStorage` (Schlüssel `mitglieder-view`), Foto-Karten bleibt der Default beim allerersten Aufruf
- [x] Migrierte Bestandsmitglieder: gibt es bereits Adalo-Profilbilder? → per Introspektion geprüft: **32 von 46** `users`-Zeilen haben bereits ein befülltes `profile_picture_url` (Format `adalo-media/users/{adalo_id}-{hash}.jpg`, öffentlich erreichbar) — keine Migration nötig, PROJ-7 zeigt diese direkt an; neue Admin-Uploads nutzen ein anderes Pfad-Schema (s.o.) und überschreiben `profile_picture_url` mit der neuen URL

## Decision Log

### Product Decisions
| Decision | Rationale | Date |
|----------|-----------|------|
| Verein-Admin darf anderen Mitgliedern des eigenen Vereins das Admin-Flag (`users.admin`) selbst verleihen/entziehen | Nutzerentscheidung im Interview — bewusste Abweichung von der PRD-Formulierung "SuperUser vergibt Admin-Rechte"; SuperUser bleibt weiterhin exklusiv für `su`-Rechte zuständig | 2026-07-11 |
| ~~Kein hartes Löschen von Mitgliedern, nur `aktiv = false`~~ → **Aufgehoben in `/refine` am 2026-07-12** | Ursprünglich zur Vermeidung verwaister Referenzen; der Nutzer hat sich nach Hinweis auf dieses Risiko bewusst für echtes Löschen entschieden (siehe neue Entscheidung unten) | 2026-07-11 |
| Hartes Löschen von Mitgliedern (Auth-Account + `users`-Zeile) wird eingeführt, mit serverseitigem Verwendungs-Check gegen `einstellungen.eingeteilte_users` vor dem Löschen | Nutzerentscheidung im Refinement-Interview nach dem ersten Deployment (Vorbild: Papierkorb-Icon in der alten Adalo-App); der Verwendungs-Check schließt das ursprünglich befürchtete Risiko verwaister Referenzen | 2026-07-12 |
| Ein Admin kann sich nicht selbst löschen (unabhängig von der Anzahl weiterer Admins) | Eigene Produktentscheidung während `/refine`, nicht explizit vom Nutzer gefordert, aber konsistent mit dem bereits etablierten Prinzip, dass sich ein Admin nicht selbst aus der eigenen Verwaltung entfernen kann (vgl. "letzter Admin"-Schutz) — kann bei Bedarf noch korrigiert werden | 2026-07-12 |
| Foto-Karten-Ansicht (2 Spalten, Portraitfoto + Name/E-Mail-Overlay) wird die neue Standardansicht; zusätzlich ein Toggle zu einer einfachen Listenform (identisch zur bisherigen Ansicht) | Nutzerentscheidung im Refinement-Interview: 1:1-Vorbild der alten Adalo-App; beide Ansichten sollen erhalten bleiben statt nur eine zu ersetzen | 2026-07-12 |
| Profilbild-Upload/-Anzeige wird neu eingeführt (bisher ungenutztes Feld `users.profile_picture_url`); Admin-seitig für beliebige Mitglieder des eigenen Vereins, kein Selbst-Upload durch Mitglieder (das bleibt PROJ-12 vorbehalten) | Nutzerentscheidung im Refinement-Interview: Klick aufs Foto führt zum Bearbeiten, Foto soll dort austauschbar sein | 2026-07-12 |
| Admin kann Mitglieder manuell anlegen (ohne Freischaltcode) | Löst den in PROJ-3 vermerkten Bedarf; deckt den Fall ab, dass ein Mitglied sich nicht selbst registrieren kann/will | 2026-07-11 |
| Initial-Passwort wird vom Admin gesetzt und persönlich weitergegeben, kein Einladungs-E-Mail-Versand | Kein verifizierter E-Mail-Versand-Service im Projekt; Mitglied kann danach jederzeit über den bestehenden "Passwort vergessen"-Flow (PROJ-3) selbst ein neues Passwort setzen | 2026-07-11 |
| Editierbare Felder durch Admin: Vorname, Nachname, E-Mail, Mitgliedsnummer, Geburtstag, Titel (vorher/nachher), aktiv, admin | Deckt die vorhandenen `users`-Spalten aus der Adalo-Migration ab; überschneidet sich bewusst mit PROJ-12 (Mitglied kann dieselben Felder auch selbst pflegen) | 2026-07-11 |
| Kein Eindeutigkeits-Constraint auf Mitgliedsnummer | Migrierte Altdaten sind hinsichtlich Konsistenz dieses Felds nicht verifiziert; eine Prüfung könnte bestehende Konflikte blockieren | 2026-07-11 |
| "Letzter Admin"-Schutz: ein Admin kann sich nicht selbst das Admin-Flag entziehen oder deaktivieren, wenn er der einzige Admin des Vereins ist | Verhindert, dass sich ein Verein versehentlich komplett aussperrt (niemand könnte die Änderung mehr rückgängig machen außer dem SuperUser manuell) | 2026-07-11 |
| Liste zeigt inaktive Mitglieder standardmäßig weiterhin an (ausgegraut), mit optionalem Filter, statt sie zu verstecken | Admin soll nicht versehentlich den Überblick über deaktivierte Mitglieder verlieren; Suchfeld + Filter wegen potenziell vieler (32+) Mitglieder | 2026-07-11 |
| SuperUser sieht alle Mitglieder aller Vereine und hat dieselben Möglichkeiten wie ein Verein-Admin, aber über einen vorgeschalteten Verein-Switcher statt einer vereinsübergreifenden flachen Liste | Nutzerentscheidung im Interview; hält die SU-Ansicht nah am bestehenden Admin-Modell (eine Verein-Kontext-Session statt einer riesigen gemischten Liste aller Vereine) | 2026-07-11 |
| Vergabe des `su`-Flags erfolgt ausschließlich direkt in Supabase, kein UI-Feature dafür | Nutzerentscheidung im Interview; konsistent mit dem PRD-Rollenmodell ("SuperUser als zentrale Kontrollinstanz") — die SU-Ernennung selbst braucht keinen App-seitigen Mechanismus | 2026-07-11 |
| "Letzter Admin"-Schutz gilt ausschließlich bei Selbst-Änderung (die handelnde Person ändert ihr eigenes admin-Flag/aktiv), unabhängig davon ob Admin oder SU handelt — bei Fremdänderung durch den SU greift der Schutz nicht | Nutzerentscheidung im Interview; SU trägt hier bewusst die Verantwortung selbst, z.B. um einen Verein gezielt admin-los zu setzen, bevor ein neuer Admin bestimmt wird | 2026-07-11 |

### Technical Decisions
<!-- Added by /architecture -->
| Decision | Rationale | Date |
|----------|-----------|------|
| Manuelles Anlegen läuft über eine neue serverseitige API-Route (`src/app/api/mitglieder/route.ts`, `POST`) statt eines direkten Browser-Calls | Ein neuer Supabase-Auth-Account mit gesetztem Initial-Passwort kann nur mit dem Service-Role-Key angelegt werden (identischer Grund wie bei `/api/register` in PROJ-3); die Route prüft zusätzlich serverseitig, dass der Aufrufer selbst Admin des Ziel-Vereins oder SU ist | 2026-07-11 |
| Bearbeiten (Stammdaten, Aktiv-Toggle, Admin-Toggle) läuft als direkter Browser→Supabase-Update-Call, keine eigene API-Route | Kein Geheimnis zu schützen (anders als das Initial-Passwort beim Anlegen); konsistent mit dem PROJ-4/5/6-Muster, RLS ist die eigentliche Sicherheitsgrenze | 2026-07-11 |
| "Letzter Admin"-Selbstschutz wird als Datenbank-Trigger (`BEFORE UPDATE` auf `public.users`) umgesetzt, nicht nur als Client-Validierung | Anders als die weichen Validierungen in PROJ-5/6 (z.B. Namens-Eindeutigkeit, nur clientseitig) hätte ein rein clientseitig umgangener Schutz hier eine echte Verfügbarkeits-Konsequenz: ein Verein könnte sich per direktem REST-Call selbst komplett aussperren. Der Trigger vergleicht `auth.uid()` mit `OLD.auth_user_id` (nur bei Selbst-Update aktiv, wie in der Spec festgelegt) und blockiert `admin: true → false` oder `aktiv: true → false`, wenn dadurch kein aktiver Admin für einen der betroffenen Vereine mehr übrig bliebe | 2026-07-11 |
| Neue RLS-Policies auf `public.users`: SELECT/UPDATE für Admins auf alle `users`-Zeilen des eigenen Vereins (bisher existierte nur Selbstlese-Zugriff aus PROJ-3) | PROJ-7 ist die erste Funktion, die einem Admin Zugriff auf *andere* `users`-Zeilen gibt; bisherige Policies (`users_select_own`) reichen dafür nicht aus | 2026-07-11 |
| Zusätzliche RLS-Klausel auf `public.users` und `public.vereine`: SELECT/UPDATE (bzw. nur SELECT bei `vereine`) für Zeilen jedes Vereins, wenn der Aufrufer `users.su is not null` hat | Einzige bewusste, eng geführte Ausnahme von der Cross-Tenant-Grenze — explizit auf das `su`-Feld geprüft (nicht pauschal), deckt sowohl den Verein-Switcher (Lesezugriff auf alle `vereine`) als auch die vereinsübergreifende Mitgliederverwaltung ab | 2026-07-11 |
| `email_taken`-Erkennung in der neuen API-Route über den Fehlertext von `auth.admin.createUser`, identisches Muster wie `/api/register` | Konsistenz mit PROJ-3; Supabase Auth bleibt autoritative Quelle für E-Mail-Eindeutigkeit | 2026-07-11 |
| Bei Fehlschlag des `users`-Inserts in der neuen Route wird der zuvor angelegte Auth-Account wieder gelöscht (`auth.admin.deleteUser`) | Identisches Rollback-Muster wie `/api/register` (PROJ-3), verhindert verwaiste Auth-Accounts | 2026-07-11 |
| Verein-Switcher und Mitgliederliste bleiben eine einzige Client-Komponente (`src/app/mitglieder/page.tsx`) mit lokalem State für den gewählten Verein, keine eigene Unterseite/Route | Kleine Datenmenge (33 Nutzer, 1 Verein aktuell), kein Bedarf für serverseitiges Routing; konsistent mit dem Ein-Seiten-Muster von PROJ-4/5/6 | 2026-07-11 |
| Keine neuen npm-Pakete | `@supabase/supabase-js`, `zod`, `react-hook-form`, sowie die benötigten shadcn/ui-Komponenten (`select` für den Verein-Switcher, `switch` für Aktiv/Admin-Toggle, `dialog`, `form`, `input`, `badge`, `alert`) sind bereits im Projekt vorhanden | 2026-07-11 |
| **Amendment (User-Entscheidung in `/backend`):** Bearbeiten läuft entgegen der ursprünglichen Architektur-Entscheidung NICHT mehr als direkter Browser→Supabase-Call, sondern über eine neue `PATCH /api/mitglieder/[id]`-Route | Der User hat sich bewusst gegen die dokumentierte MVP-Einschränkung entschieden und volle E-Mail-Synchronisation (`public.users.email` UND `auth.users.email`) verlangt. Das erfordert den Service-Role-Key für den `auth.users`-Teil, den der Browser nicht haben darf | 2026-07-11 |
| Die neue PATCH-Route nutzt intern trotzdem einen "scoped client" mit dem JWT des Aufrufers (nicht den Service-Role-Client) für das eigentliche `users`-Tabellen-Update | Erhält die Architektur-Prämisse "RLS ist die eigentliche Sicherheitsgrenze": `auth.uid()` muss innerhalb der Datenbank-Anfrage weiterhin den echten Aufrufer ergeben, sonst würde der "letzter Admin"-Trigger seine Selbst-Erkennung verlieren (siehe Bug-Fund unten). Der Service-Role-Client wird ausschließlich für den schmalen `auth.admin.updateUserById`-Aufruf verwendet | 2026-07-11 |
| Reihenfolge in der PATCH-Route: zuerst `auth.users`-E-Mail synchronisieren (falls geändert), erst danach die `users`-Zeile aktualisieren; schlägt der zweite Schritt fehl, wird die E-Mail-Änderung zurückgerollt | Verhindert einen inkonsistenten Zustand (E-Mail synchronisiert, aber Tabellen-Update z.B. durch den "letzter Admin"-Trigger abgelehnt) — analoges Rollback-Muster wie beim Anlegen (`/api/register`, `/api/mitglieder`) | 2026-07-11 |
| **Bug gefunden & gefixt (bei der SQL-Simulation der neuen Policies):** Die ursprünglichen Policies `users_select_own_verein_admin`/`users_update_own_verein_admin`/`users_select_su`/`users_update_su` fragten `public.users` direkt aus einer Policy AUF `public.users` ab → "infinite recursion detected in policy for relation users". Ersetzt durch zwei `SECURITY DEFINER`-Hilfsfunktionen (`current_user_admin_verein()`, `current_user_is_su()`), die RLS intern umgehen und damit den Zyklus durchbrechen (Standard-Postgres-Pattern für selbstreferenzierende RLS) | Ohne den Fix wäre jeder Zugriff von Admins/SU auf `/mitglieder` fehlgeschlagen — durch Simulation vor dem Frontend-Rollout entdeckt, nicht erst in QA | 2026-07-11 |
| Zusätzlicher Trigger-Schutz (über die Architektur hinausgehend): jede authentifizierte (nicht Service-Role) Änderung des `verein`-Arrays wird blockiert (`VEREIN_AENDERUNG_NICHT_ERLAUBT`) | Bei der Umsetzung erkannt: Ohne diese Sperre hätte ein Admin über einen direkten REST-Call `verein` auf `[eigener_verein, fremder_verein]` setzen können — das erfüllt die `with check`-Bedingung (Überlappung mit dem eigenen Verein reicht), würde aber einem Mitglied heimlich Zugriff auf einen fremden Verein verschaffen. Schließt eine sonst bestehende Rechteausweitungs-Lücke, ohne die geplante Funktionalität einzuschränken (kein UI ändert `verein`) | 2026-07-11 |
| **Erweiterung 2026-07-12 (Redesign):** Neue serverseitige Route `DELETE /api/mitglieder/[id]` für hartes Löschen, gleiches Muster wie die bestehende PATCH-Route (scoped client zur Autorisierung/Sichtbarkeit, Service-Role nur für `auth.admin.deleteUser`) | Löschen des Auth-Accounts erfordert den Service-Role-Key; die Autorisierungsprüfung (Admin des Ziel-Vereins oder SU, kein Selbst-Löschen) läuft über denselben scoped-client-Ansatz wie beim Anlegen/Bearbeiten | 2026-07-12 |
| Verwendungs-Check vor dem Löschen: Route prüft `einstellungen.eingeteilte_users` per Service-Role sowohl gegen `id` als auch `adalo_id` des Ziel-Mitglieds, vor dem eigentlichen Löschen | Identisches Muster wie der Rollen-/Kategorien-Lösch-Schutz (PROJ-5/6): Alt- und Neu-Daten könnten unterschiedliche ID-Räume referenzieren; verhindert verwaiste Referenzen in `einstellungen`, obwohl PROJ-9/10 diese Tabelle noch nicht aktiv befüllen | 2026-07-12 |
| Selbst-Löschen wird serverseitig blockiert (Vergleich `target.auth_user_id` gegen den authentifizierten Aufrufer aus dem scoped client), nicht nur clientseitig ausgeblendet | Gleiche Begründung wie beim "letzter Admin"-Trigger: ein rein clientseitig verstecktes Papierkorb-Icon auf der eigenen Karte würde einen direkten REST-Call nicht verhindern | 2026-07-12 |
| Profilbild-Upload nutzt die bestehende öffentliche Bucket `adalo-media`, neuer Pfad `users/{vereinId}-{userId}-{dateiname}` (statt `users/{adalo_id}-{hash}`, das Format der migrierten Altdaten) | Migrierte Fotos (32/46 Nutzer bereits mit `profile_picture_url` befüllt, per Introspektion bestätigt) bleiben unter ihrem bestehenden Pfad unangetastet erreichbar; das neue Pfadschema mit `vereinId`-Präfix ermöglicht dieselbe Storage-RLS-Scoping-Technik wie bei Vereinslogo (PROJ-4) und Kategorie-Bild (PROJ-5) | 2026-07-12 |
| Neue Storage-Policies auf `storage.objects` für den Pfad `users/{vereinId}-*`: INSERT/SELECT/UPDATE für den Admin des jeweiligen Vereins, zusätzlich eine SU-Ausnahme (`current_user_is_su()`, dieselbe Hilfsfunktion wie bei den `users`/`vereine`-Policies) | Bisher existierten nur Storage-Policies für `vereine/*` und `kategorien/*` (aus PROJ-4/5); `users/*` braucht eigene Policies. Die bereits aus PROJ-4 bekannte SELECT-Policy-Notwendigkeit für `upsert`/`ON CONFLICT` wird von Anfang an mit eingeplant (nicht erst nachträglich wie damals) | 2026-07-12 |
| Foto-Karten-Ansicht und Listenform bleiben Teil derselben `src/app/mitglieder/page.tsx`-Komponente, umgeschaltet über lokalen State + `localStorage` (Schlüssel `mitglieder-view`), keine zweite Route | Konsistent mit dem Ein-Seiten-Muster dieser Seite; beide Ansichten nutzen dieselbe `filteredMitglieder`-Datenquelle, nur unterschiedliches Rendering | 2026-07-12 |
| Header wird für `/mitglieder` auf einen durchgehenden farbigen Balken (`bg-brand-blue`, weißer Titeltext) umgestellt, abweichend vom aktuellen `h1`-Muster von Kategorien/Rollen/Voreinstellungen | Explizite Nutzeranforderung (Bildvorlage); bewusst nur für diese eine Seite geändert, keine rückwirkende Anpassung der anderen Admin-Seiten ohne gesonderten Auftrag (gezielte Änderung statt Bonus-Redesign) | 2026-07-12 |
| "Neues Mitglied"-Button im Seitenkopf entfällt zugunsten eines schwebenden Rundbuttons (FAB) unten, konsistent mit der Bildvorlage | 1:1-Umsetzung der Nutzeranforderung; funktional identisch (öffnet denselben Anlege-Dialog), nur andere Platzierung/Optik | 2026-07-12 |
| **Refinement 2026-07-17:** `telefonnummer` als weiteres optionales Feld in den Bearbeiten-Dialog aufgenommen, `PATCH /api/mitglieder/[id]`-Zod-Schema entsprechend erweitert | Identisches additives Muster wie die bestehenden optionalen Felder; keine neue RLS-Policy nötig (spaltenunabhängige Update-Policies) | 2026-07-17 |

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)

### A) Component Structure

```
Startseite "/" (bestehend, PROJ-4/5/6-Muster)
└── Button "Mitglieder" (sichtbar für Admins UND SuperUser) → /mitglieder

Mitglieder-Seite "/mitglieder" (neu)
├── Zugriffsprüfung: liest users.admin + users.su, leitet bei beidem "nein"/leer sofort zu "/" weiter
├── Verein-Kontext
│   ├── Admin: automatisch der eigene Verein, kein Auswahlschritt (wie PROJ-4/5/6)
│   └── SuperUser: Verein-Switcher (Dropdown/Select aller Vereine) — Liste erscheint erst nach Auswahl
├── Mitgliederliste (für den aktiven Verein-Kontext)
│   ├── Suchfeld (Vorname/Nachname/E-Mail, client-seitig gefiltert)
│   ├── Filter "Alle / Nur aktiv / Nur inaktiv"
│   ├── Sortiert nach Nachname
│   ├── Leerzustand ("Noch keine weiteren Mitglieder" + Aktion "Neues Mitglied anlegen")
│   └── Mitglieds-Zeile: Name · E-Mail · Mitgliedsnr. · Badges ("Inaktiv" falls aktiv=false, "Admin" falls admin=true, "Du" bei der eigenen Zeile) · "Bearbeiten"
├── Button "Neues Mitglied anlegen" → öffnet Anlege-Dialog
├── Anlege-Dialog "Neues Mitglied" (nur Neuanlage)
│   ├── Vorname, Nachname, E-Mail, Initial-Passwort (alle Pflicht, Passwort min. 6 Zeichen)
│   ├── "Anlegen"-Button
│   └── Fehlermeldung (E-Mail bereits vergeben, Passwort zu kurz, API nicht erreichbar)
├── Bearbeiten-Dialog "Mitglied bearbeiten" (bestehendes Mitglied)
│   ├── Vorname, Nachname, E-Mail (Pflicht)
│   ├── Mitgliedsnummer, Geburtstag, Titel vorher/nachher (optional, Freitext)
│   ├── Switch "Aktiv"
│   ├── Switch "Admin"
│   ├── "Speichern"-Button
│   └── Fehlermeldung (Duplikat-E-Mail, "letzter Admin"-Schutz vom Server, API nicht erreichbar)
```

### B) Data Model (fachlich, kein Code)

- Keine neue Tabelle. Nutzt die bereits existierende `users`-Tabelle aus der Adalo-Migration.
- Vom Admin/SU editierbare Felder: `vorname`, `nachname`, `email`, `telefonnummer`, `mitgliedsnumer`, `geburtstag`, `titel_nachher`, `vorher_titel`, `aktiv`, `admin`.
- Nicht editierbar in PROJ-7: `su` (nur direkt in Supabase gesetzt), `voller_name`/`username`/`adalo_id_field`/`berechtigung`/`profile_picture`/`einteilungens`/`created_dates` (Adalo-Altfelder ohne PROJ-7-Bezug).
- Neues Mitglied bekommt wie bei der Registrierung (PROJ-3) einen Supabase-Auth-Account (E-Mail + vom Admin gesetztes Initial-Passwort) und eine verknüpfte `users`-Zeile (`auth_user_id`), zugeordnet zum aktiven Verein-Kontext (`verein`-Array, ein Eintrag), `admin = false`, `aktiv = true`.
- "Eigener Verein"/"eigene Zeile" wird wie in PROJ-3/4/5/6 über `users.auth_user_id = auth.uid()` und darüber `users.verein` bestimmt.
- Verein-Switcher (nur SU) liest alle Zeilen der `vereine`-Tabelle (nur `id`, `vereinsname` nötig).
- "Letzter Admin"-Check: zählt aktive (`aktiv = true`) Zeilen mit `admin = true`, deren `verein`-Array den betroffenen Verein enthält.

### C) Tech-Entscheidungen (Begründung für PM)

- **Neue API-Route nur für das Anlegen, nicht fürs Bearbeiten**: Nur das Anlegen braucht einen neuen Auth-Account mit einem vom Admin gewählten Passwort — das erfordert den Service-Role-Key und darf nicht im Browser laufen (identischer Grund wie bei der Registrierung). Bearbeiten ändert nur bestehende Datenzeilen, dafür reicht die Datenbank-Sicherheitsregel (RLS) wie bei den Vorgänger-Features.
- **"Letzter Admin"-Schutz als Datenbank-Trigger statt nur im Formular**: Alle bisherigen Validierungen in diesem Projekt (z.B. doppelte Rollennamen) sind rein kosmetisch — im schlimmsten Fall entsteht ein Duplikat. Hier wäre der schlimmste Fall aber, dass sich ein ganzer Verein selbst aus der Verwaltung aussperrt, ohne dass die Datenbank das verhindert. Deshalb wird diese eine Regel zusätzlich fest in der Datenbank verankert.
- **SU als eng geführte RLS-Ausnahme**: Die App verspricht strikte Vereinstrennung (Grund für den früheren Adalo-Vorfall). Der SU braucht trotzdem vereinsübergreifenden Zugriff, um genau diese Verwaltungsfunktion zentral ausüben zu können. Diese Ausnahme wird nicht pauschal, sondern explizit nur für Nutzer mit gesetztem `su`-Feld eingeräumt und ausschließlich für diese eine Funktion (Mitgliederverwaltung) — keine generelle Aufweichung der Datentrennung für andere Tabellen.
- **Eine Seite statt mehrerer Routen**: Sowohl Admin- als auch SU-Ansicht laufen über dieselbe `/mitglieder`-Seite, der SU bekommt lediglich zusätzlich den Verein-Switcher vorgeschaltet — spart eine zweite, fast identische Seite.

### D) Dependencies

- Keine neuen Pakete: `@supabase/supabase-js`, `zod`, `react-hook-form`, `shadcn/ui` (`select`, `switch`, `dialog`, `form`, `input`, `badge`, `alert`, `button`) — alles bereits im Projekt vorhanden.

### E) Erweiterung 2026-07-12: Foto-Karten-Ansicht, Profilbild-Upload, hartes Löschen

**Component Structure (Ergänzung zu A):**

```
Mitglieder-Seite "/mitglieder"
├── Header-Balken (NEU): durchgehender blauer Balken, weißer Titel "Mitgliederverwaltung"
│   └── Button "In Listenform" / "In Kartenform" (Toggle, Zustand in localStorage gemerkt)
├── Suchfeld (Platzhalter jetzt dynamisch: "eines von den {N} Mitgliedern suchen...")
├── Ansicht A: Foto-Karten-Grid (NEU, Standard) — 2 Spalten
│   └── Karte je Mitglied: Foto (`profile_picture_url`, Platzhalter falls leer) · Papierkorb-Icon oben rechts ·
│       Name + E-Mail als Overlay unten (Verlauf für Lesbarkeit) · Klick auf Karte → Bearbeiten-Dialog
├── Ansicht B: Listenform (bestehend) — zusätzlich Papierkorb-Icon neben "Bearbeiten" für Feature-Parität
├── FAB (NEU, ersetzt den bisherigen "Neues Mitglied"-Button im Header): schwebender runder Button unten → Anlege-Dialog
├── Bearbeiten-Dialog (bestehend + NEU: Profilbild-Feld — aktuelles Bild/Vorschau, Datei-Upload PNG/JPG/SVG max. 2 MB)
└── Lösch-Bestätigungsdialog (NEU)
    ├── Ziel ist die eigene Zeile → Aktion gar nicht erst angeboten (Papierkorb-Icon auf der "Du"-Karte ausgeblendet)
    ├── Mitglied nicht in `einstellungen.eingeteilte_users` referenziert → normale Bestätigung ("X unwiderruflich löschen?")
    └── Mitglied referenziert → blockierender Hinweis statt Bestätigung, kein Löschen möglich
```

**Data Model (Ergänzung zu B):** Keine neue Spalte. `users.profile_picture_url` wird jetzt aktiv gelesen/geschrieben (32/46 Bestandsmitglieder bereits befüllt, siehe Open Questions). Neue Uploads schreiben nach `adalo-media/users/{vereinId}-{userId}-{dateiname}`; migrierte Altfotos (`users/{adalo_id}-{hash}.jpg`) bleiben unverändert.

**Tech-Entscheidungen (Begründung für PM):**
- **Löschen als eigene Route, nicht direkter Browser-Call**: Genau wie beim Anlegen kann nur der Service-Role-Key den Auth-Account entfernen — ein direkter Browser-Delete auf `public.users` würde einen verwaisten, nicht mehr benutzbaren Auth-Account hinterlassen.
- **Verwendungs-Check vor dem Löschen**: Verhindert, dass ein zukünftiges Feature (Einteilungen, PROJ-9/10) auf eine gelöschte Mitglieds-ID zeigt — dieselbe Lehre wie bei Rollen/Kategorien.
- **Neues Storage-Pfadschema statt Wiederverwendung des Migrations-Formats**: Das alte `{adalo_id}-{hash}`-Format hat keinen Vereins-Bezug im Pfad selbst, wäre also nicht RLS-scopebar. Das neue Schema ist eine reine Erweiterung, keine Änderung an migrierten Daten.
- **Header-Redesign bewusst auf `/mitglieder` begrenzt**: Der Nutzer hat konkret diese eine Seite gezeigt; andere Admin-Seiten (Rollen, Kategorien, Voreinstellungen) bleiben unangetastet, bis dafür ein eigener Auftrag kommt.

**F) Dependencies (Ergänzung):** Keine neuen npm-Pakete. Für den Papierkorb/Upload/FAB reichen bereits vorhandene shadcn/ui-Komponenten (`alert-dialog`, `input type="file"`) sowie `lucide-react`-Icons (bereits Projektabhängigkeit, siehe `select.tsx`/`checkbox.tsx`-Icons).

## Frontend Implementation Notes

**Gebaut:** `/mitglieder` (`src/app/mitglieder/page.tsx`) sowie ein Button "Mitglieder" auf der Startseite (`src/app/page.tsx`), sichtbar für Admins UND SuperUser (Startseite lädt dafür jetzt zusätzlich `users.su`, nicht nur `users.admin`).

- Zugriffsschutz clientseitig identisch zu PROJ-4/5/6: kein Session → Redirect zu "/"; Session ohne `users.admin = true` und ohne `users.su` gesetzt → Redirect zu "/"
- SU-Erkennung: `!!userRow.su` (Feld ist `text`, jeder nicht-leere Wert zählt als SU) — Admin-Flag und SU-Flag werden unabhängig geprüft, ein Nutzer kann theoretisch beides oder nur eines von beidem haben
- Admin: Verein-Kontext wird automatisch aus `users.verein[0]` gesetzt, kein Auswahlschritt. SU: zusätzlicher Verein-Switcher (shadcn `Select`) lädt alle Zeilen aus `vereine` (`id`, `vereinsname`); Liste/Formulare erscheinen erst nach Auswahl
- Liste lädt `users` gefiltert per `.contains("verein", [vereinId])`, sortiert nach `nachname`; Suche (Vorname/Nachname/E-Mail) und Status-Filter (Alle/Nur aktiv/Nur inaktiv) laufen rein client-seitig auf der bereits geladenen Liste (konsistent mit der geringen Datenmenge, siehe Tech Design)
- Eigene Zeile bekommt zusätzlich ein "Du"-Badge (`auth_user_id === ownAuthUserId`), analog dazu Badges "Admin" und "Inaktiv"
- Anlegen-Dialog sendet `POST /api/mitglieder` mit `Authorization: Bearer <access_token>` (aus `supabase.auth.getSession()`) und Body `{ vorname, nachname, email, password, vereinId }` — **diese Route existiert noch nicht**, wird in `/backend` gebaut (identisches Vorgehen wie bei PROJ-3s `/api/register`, das ebenfalls zuerst vom Frontend angesprochen und danach implementiert wurde). Erwarteter Fehler-Contract: `{ error: "email_taken" }` bei 400 für Duplikat-E-Mail, sonst generische Fehlermeldung
- Bearbeiten-Dialog sendet **(nach `/backend`-Amendment, siehe Decision Log)** `PATCH /api/mitglieder/[id]` statt eines direkten Supabase-Calls, ebenfalls mit `Authorization: Bearer <access_token>` — die Route synchronisiert bei geänderter E-Mail zusätzlich `auth.users`, sonst identisches Verhalten zum ursprünglich geplanten Direkt-Call (RLS bleibt über den intern verwendeten "scoped client" die eigentliche Sicherheitsgrenze)
- Client-seitige Duplikat-E-Mail-Vorprüfung wurde entfernt — die Route delegiert die Eindeutigkeitsprüfung vollständig an Supabase Auth (autoritative Quelle, konsistent mit PROJ-3), das schließt die ursprünglich dokumentierte Lücke (Prüfung nur gegen die geladene Liste)
- Fehler-Contract der PATCH-Route: JSON `{ error: "email_taken" | "last_admin" | "forbidden" | "validation" | "server_error" }`; Frontend übersetzt das in deutschsprachige Meldungen (kein Text-Matching auf rohe Postgres-Fehlermeldungen mehr nötig, da die Route das serverseitig vorab normalisiert)
- `npm run build` läuft sauber durch (`/mitglieder`, `/api/mitglieder`, `/api/mitglieder/[id]`, keine TypeScript-Fehler)

### Erweiterung 2026-07-12: Foto-Karten-Ansicht, Profilbild-Upload, Löschen

**Gebaut (alles in `src/app/mitglieder/page.tsx`):**
- Vollflächiger blauer Header-Balken ("Mitgliederverwaltung", weiß) statt des bisherigen `h1`
- Toggle-Button "In Listenform"/"In Kartenform", Zustand in `localStorage` (`mitglieder-view`) gemerkt, Foto-Karten ist der Default
- Suchfeld-Platzhalter jetzt dynamisch: `eines von den {N} Mitgliedern suchen...`
- Foto-Karten-Grid (2 Spalten, `aspect-[3/4]`): Foto oder `UserRound`-Platzhalter-Icon, Papierkorb-Icon oben rechts (ausgeblendet auf der eigenen Karte), Du/Admin/Inaktiv-Badges oben links, Name+E-Mail als Verlaufs-Overlay unten, Klick auf die Karte öffnet den Bearbeiten-Dialog (`stopPropagation` auf dem Papierkorb-Icon verhindert Doppelauslösung)
- Listenform (bestehend) um ein Papierkorb-Icon neben "Bearbeiten" ergänzt (ebenfalls ausgeblendet auf der eigenen Zeile) — Feature-Parität zwischen beiden Ansichten
- FAB (schwebender Rundbutton unten rechts, `bg-brand-gold`) ersetzt den bisherigen "Neues Mitglied"-Button im Header; überlappt bewusst wie in der Bildvorlage die untere Kartenreihe (Standard-FAB-Verhalten, kein Bug)
- Bearbeiten-Dialog: neues Profilbild-Feld oben (rundes Vorschaubild oder Platzhalter-Icon, "Profilbild ändern"-Link öffnet einen versteckten Datei-Input, PNG/JPG/SVG max. 2 MB, identische Validierung wie Vereinslogo/Kategorie-Bild)
- Neue Lösch-Bestätigung (`AlertDialog`): zeigt Serverfehler (z.B. "in_use") direkt in der Dialog-Beschreibung an, statt eines separaten Vorab-Checks — einfacher als das zweistufige Rollen/Kategorien-Muster, da die Autorität ohnehin serverseitig liegt

**Contracts für `/backend` (Routen existieren noch nicht):**
- Bild-Upload läuft weiterhin direkt Browser→Supabase-Storage (Bucket `adalo-media`, Pfad `users/{vereinId}-{userId}-{timestamp}-{dateiname}`), analog zu Vereinslogo/Kategorie-Bild — braucht neue Storage-RLS-Policies
- `PATCH /api/mitglieder/[id]` bekommt ein neues optionales Feld `profilePictureUrl` im Body (String oder `null`), das `users.profile_picture_url` setzt — Zod-Schema der bestehenden Route muss erweitert werden
- Neue Route `DELETE /api/mitglieder/[id]`, `Authorization: Bearer <token>`, kein Body. Erwarteter Fehler-Contract: `{ error: "in_use" }` (409), `{ error: "self_delete" }` (400), `{ error: "forbidden" }` (403), sonst generische Fehlermeldung

**Verifiziert:** `npm run build` sauber; visuell per Playwright-Screenshot gegen isolierte Testdaten mit echten (kopierten, nicht veränderten) Profilbild-URLs geprüft — Foto-Karten-Grid, Listenform-Toggle und Bearbeiten-Dialog mit Profilbild-Vorschau sehen wie beabsichtigt aus und entsprechen der Bildvorlage. Löschen und Profilbild-Upload selbst **nicht** end-to-end testbar, da die zugehörigen Backend-Routen/Policies noch fehlen — folgt in `/backend`.

### Erweiterung 2026-07-12 (Fortsetzung nach MCP-Unterbrechung): Storage-Migration für Profilbild-Upload

**Gebaut:** Dritte Migration (per `apply_migration`, mit expliziter User-Freigabe angewendet — die Aufforderung "Storage-Migration anwenden" in der Fortsetzungs-Session zählt als diese Freigabe).

**Migration 3 — `proj7_users_profile_picture_storage_policies`:**
- Drei neue RLS-Policies auf `storage.objects` (Bucket `adalo-media`, Pfad-Präfix `users/{vereinId}-*`): `users_bild_insert_admin_or_su`, `users_bild_select_admin_or_su`, `users_bild_update_admin_or_su`
- Jede Policy kombiniert zwei Bedingungen per OR: (a) Admin-Check identisch zum bestehenden `vereine_logo_*`/`kategorien_bild_*`-Muster (`EXISTS`-Check über `unnest(u.verein)` gegen das `vereinId`-Präfix im Objektnamen), (b) SU-Ausnahme über die bereits aus PROJ-7 bekannte `current_user_is_su()`-Funktion, zusätzlich auf `objects.name like 'users/%'` eingeschränkt (kein pauschaler Bucket-Bypass für SU, nur der `users/`-Pfad)
- Genau wie in PROJ-4 von Anfang an eine SELECT-Policy mit eingeplant, da `upload(..., { upsert: true })` intern einen Exists-Check macht (dieselbe damals in PROJ-4 nachträglich gefundene Lücke wird hier vermieden)

**Live-End-to-End-Verifikation (eigenes, danach vollständig entferntes Testskript gegen die echte Supabase-Instanz `cspljbavgdnsqlqkdxvc`, keine Produktivdaten berührt):**
- 2 isolierte Test-Vereine + 3 Test-Accounts (Admin Verein A, einfaches Mitglied Verein A, SU) real angelegt, per `signInWithPassword` echte Sessions erzeugt, echte Bilddatei (PNG) über die echte Storage-REST-API hochgeladen
- 8/8 Checks bestanden: Admin lädt in eigenen Verein-Pfad hoch ✓, hochgeladene Datei ist über die öffentliche URL abrufbar (HTTP 200) ✓, Admin kann per `upsert` überschreiben (SELECT+UPDATE-Pfad) ✓, Admin wird bei fremdem Verein-Präfix blockiert (RLS-Fehler) ✓, einfaches Mitglied (kein Admin) wird komplett blockiert ✓, SU kann in beliebigen Verein-Präfix hochladen ✓, Cleanup vollständig (0 verbleibende Test-Zeilen in `users`/`vereine`) ✓
- Zusätzlich: `npm test` weiterhin 29/29 grün, `npm run build` weiterhin sauber (keine neuen TypeScript-/Build-Fehler durch die Migration, da rein datenbankseitig)

**Damit ist `/backend` für diese Erweiterung vollständig:** `DELETE /api/mitglieder/[id]`, `PATCH /api/mitglieder/[id]` inkl. `profilePictureUrl` und die Storage-Policies für den Profilbild-Upload sind alle implementiert und live verifiziert.

**Nachjustierung (User-Feedback, gleicher Tag):** Kartengröße auf Nutzerwunsch halbiert (Grid `grid-cols-2` → `grid-cols-4`). Badges, Papierkorb-Icon und Name/E-Mail-Overlay dabei proportional verkleinert (waren bei den kleineren Karten sonst überdimensioniert/abgeschnitten) — visuell erneut per Screenshot mit 8 Testmitgliedern bestätigt.

**Bug gefunden & gefixt (User-Feedback):** Im Bearbeiten-Dialog war kein Scrollen möglich — bei vielen Feldern (Profilbild, 7 Textfelder, 2 Switches) reichte der sichtbare Bereich auf kleineren Fenstern/Handys nicht bis zum "Speichern"-Button. Root Cause: die geteilte shadcn-Komponente `src/components/ui/dialog.tsx` (`DialogContent`) hatte gar kein Höhenlimit mit Scroll-Fähigkeit — fiel bei den bisher kürzeren Dialogen (Kategorien, Rollen, Voreinstellungen) nicht auf. Fix bewusst in der geteilten Komponente (`max-h-[90vh] overflow-y-auto` ergänzt), nicht nur lokal im Mitglieder-Dialog, da der Defekt strukturell die Basis-Komponente betrifft und allen aktuellen wie künftigen Dialogen zugutekommt. Verifiziert per Playwright (`scrollHeight=958` vs. `clientHeight=538`, `overflowY=auto`, Scroll-zu-Ende bestätigt den "Speichern"-Button erreichbar).

**BUG-4 gefunden & gefixt (User-Feedback nach Deployment, Android Chrome):** Im Bearbeiten-Dialog ließ sich weder vollständig nach oben noch nach unten scrollen — z.B. nach einer Namensänderung war der "Speichern"-Button nicht direkt erreichbar; erst ein Tipp in das letzte sichtbare Feld gab weitere ~4 Zeilen Scroll-Spielraum frei.
- **Repro-Versuch (Desktop, Playwright, verkleinertes Fenster 500×600):** Mausrad-Scroll und direktes Setzen von `scrollTop = scrollHeight` erreichten zuverlässig das Container-Ende (`scrollHeight`/`clientHeight`/`maxScroll` blieben vor und nach einer Texteingabe identisch: 958/538/420) — auf dem Desktop **nicht reproduzierbar**, echte virtuelle Tastatur eines Mobilgeräts lässt sich in dieser Umgebung nicht simulieren
- **Root Cause (abgeleitet, durch Nutzer als Android-Chrome-Fall bestätigt):** Der vorherige Fix begrenzte die Dialog-Höhe mit `max-h-[90vh]`. Die CSS-Einheit `vh` bezieht sich auf den vollen Layout-Viewport und schrumpft in Android Chrome nicht, wenn die virtuelle Tastatur eingeblendet wird. Der per `position: fixed` + `top-[50%]`/`translate-y-[-50%]` zentrierte Dialog reicht dadurch weiterhin bis zu 90 % der vollen (tastaturfreien) Bildschirmhöhe — ein Teil davon liegt dann faktisch hinter der eingeblendeten Tastatur, obwohl der interne Scroll-Container sein eigenes Scroll-Ende bereits erreicht hat. Erst das Fokussieren eines Eingabefelds löst das native "scroll caret into view"-Verhalten des Browsers aus, das zusätzlich den sichtbaren Bereich verschiebt — das erklärt die beobachteten "4 Zeilen mehr" nach dem Tippen
- **Fix:** `src/components/ui/dialog.tsx`: `max-h-[90vh]` → `max-h-[90dvh]` (dynamic viewport height, seit Chrome 108 / iOS Safari 15.4 von allen relevanten mobilen Browsern unterstützt) — passt die maximale Dialog-Höhe live an den tatsächlich sichtbaren visuellen Viewport an, inkl. eingeblendeter Tastatur. Wie beim vorherigen Fix bewusst in der geteilten Komponente geändert, nicht nur lokal im Mitglieder-Dialog
- **Verifikation:** `npm run build` und `npm test` (41/41) laufen weiterhin sauber; das reine CSS-Einheiten-Update verhält sich auf dem Desktop identisch zu vorher (per erneutem Playwright-Check bestätigt: `scrollHeight`/`clientHeight`/`maxScroll` unverändert 958/538/420). Die eigentliche mobile Kern-Ursache (Tastatur-Resize) lässt sich in dieser Umgebung nicht automatisiert nachstellen — Verifikation auf einem echten Android-Gerät steht noch aus (Nutzer gebeten, nach Deployment erneut zu prüfen)
- **Priority:** Fix vor erneuter Bestätigung durch den Nutzer bereits ausgerollt (siehe Deployment unten), da risikoarm (reine CSS-Einheiten-Änderung, keine Verhaltensänderung außerhalb des Tastatur-Falls)

## Backend Implementation Notes

**Gebaut:** Zwei Migrationen (per `apply_migration`, mit expliziter User-Freigabe angewendet), zwei neue API-Routen, zwei neue Vitest-Test-Dateien.

**Migration 1 — `proj7_mitglieder_rls_and_letzter_admin_trigger`:**
- Neue RLS-Policies auf `public.users`: `users_select_own_verein_admin`/`users_update_own_verein_admin` (Admin sieht/bearbeitet alle Zeilen des eigenen Vereins), `users_select_su`/`users_update_su` (SU sieht/bearbeitet vereinsübergreifend)
- Neue RLS-Policy `vereine_select_su` auf `public.vereine` (SU-Zugriff für den Verein-Switcher)
- Neuer `BEFORE UPDATE`-Trigger `trg_users_before_update_guard` auf `public.users`: (1) "letzter Admin"-Selbstschutz, (2) Sperre gegen `verein`-Array-Änderungen über reguläre (nicht Service-Role-)Updates

**Migration 2 — `proj7_fix_users_policy_infinite_recursion`:** behebt einen bei der Verifikation gefundenen Bug (siehe Decision Log) — ersetzt die vier direkt selbstreferenzierenden `users`-Policies durch zwei `SECURITY DEFINER`-Funktionen `current_user_admin_verein()`/`current_user_is_su()`.

**API-Routen:**
- `POST /api/mitglieder` (`src/app/api/mitglieder/route.ts`): manuelles Anlegen. Erwartet `Authorization: Bearer <token>`; prüft serverseitig via "scoped client" (JWT des Aufrufers), dass der Aufrufer Admin des Ziel-Vereins oder SU ist — verhindert, dass ein Admin einen beliebigen `vereinId` im Request-Body missbraucht, um Mitglieder in einem fremden Verein anzulegen. Legt danach per Service-Role-Client (`supabaseAdmin`) den Auth-Account + `users`-Zeile an, mit Rollback bei Fehlschlag (identisches Muster wie `/api/register`)
- `PATCH /api/mitglieder/[id]` (`src/app/api/mitglieder/[id]/route.ts`): Bearbeiten inkl. E-Mail-Sync. Liest die Zielzeile über den "scoped client" (RLS entscheidet Sichtbarkeit — kein Treffer heißt "nicht berechtigt", nicht "nicht gefunden", daher 403 statt 404 zur Vermeidung von Informationslecks über Nutzer-Existenz); synchronisiert bei geänderter E-Mail zuerst `auth.users` per Service-Role, aktualisiert danach die `users`-Zeile über denselben "scoped client" (nicht Service-Role!), damit `auth.uid()` innerhalb der Datenbank-Anfrage weiterhin dem echten Aufrufer entspricht und der "letzter Admin"-Trigger korrekt zwischen Selbst- und Fremdänderung unterscheiden kann. Erkennt RLS-bedingte No-Ops (Update betrifft 0 Zeilen ohne Fehler) explizit über `.select("id")` nach dem Update — ein reines `.update().eq()` ohne `.select()` hätte einen RLS-blockierten Schreibversuch fälschlich als Erfolg gemeldet
- Beide Routen nutzen einen neuen gemeinsamen Helper `src/lib/supabase-scoped.ts` (`scopedClientFromRequest`), der einen Supabase-Client mit dem `Authorization`-Header des Aufrufers baut

**Sicherheits-relevante Funde während der Umsetzung (beide vor Live-Verifikation gefixt, siehe Decision Log):**
1. Endlosrekursion in den ursprünglich entworfenen RLS-Policies (`infinite recursion detected in policy for relation users`) — gefunden durch eine eigene SQL-Simulation mit isolierten Testdaten, bevor das Frontend gegen echte Accounts getestet wurde
2. Fehlende Sperre gegen `verein`-Array-Änderungen — die geplanten Policies hätten einem Admin technisch erlaubt, ein Mitglied per direktem REST-Call einem zusätzlichen fremden Verein hinzuzufügen (Rechteausweitungs-Lücke, kein UI-Pfad dafür vorhanden, aber ein direkter API-Call wäre nicht blockiert gewesen)

**Verifikation (zwei eigenständige Testläufe, beide mit vollständig isolierten, danach wieder gelöschten Testdaten — keine Produktivdaten berührt):**
1. **RLS + Trigger per SQL-Simulation** (echte, temporär angelegte Auth-Accounts + `signInWithPassword`, kein `set local role`-Mocking): 8/8 Szenarien bestanden — letzter-Admin-Selbstschutz blockiert korrekt, Fremdänderung durch SU umgeht ihn korrekt, `verein`-Änderung wird blockiert, Cross-Tenant-Isolation hält (weder Lesen noch Schreiben fremder Vereine), SU kann alle Vereine lesen, Admin kann andere Mitglieder des eigenen Vereins bearbeiten, ein einfaches Mitglied kann niemanden bearbeiten
2. **API-Endpunkte per echtem HTTP gegen den laufenden Dev-Server** (`npm run dev` + `fetch` gegen `localhost:3000`): 10/10 Checks bestanden, u.a. unauthentifiziert → 401, Cross-Tenant-Anlegen/-Bearbeiten → 403, Duplikat-E-Mail → 400, letzter-Admin-Selbstdegradierung → 400, und **End-to-Ende bestätigt: nach E-Mail-Änderung durch den Admin kann sich das Mitglied tatsächlich mit der neuen E-Mail einloggen**

**Vitest-Integrationstests:** `src/app/api/mitglieder/mitglieder.test.ts` (6 Tests, POST) und `src/app/api/mitglieder/[id]/mitglieder-id.test.ts` (8 Tests, PATCH) — beide gemockt, schreiben nicht in die echte Datenbank. Gesamte Suite (`npm test`): 19/19 grün (inkl. der 5 bestehenden `/api/register`-Tests).

**Bewusst nicht gebaut:** keine Bereinigung der beiden redundanten/legacy `vereine`-Lese-Policies aus PROJ-3/4 (`Users can view own verein`, `adalo_id`-basiert) — außerhalb des PROJ-7-Scopes, wie schon in PROJ-4 vermerkt.

## QA Test Results

**Tested:** 2026-07-12
**App URL:** http://localhost:3000 (Production-Build via `npm run build && npm run start`, gegen die echte Supabase-Instanz `cspljbavgdnsqlqkdxvc`)
**Tester:** QA Engineer (AI)

**Testdaten:** Mehrere isolierte, disponible Test-Vereine (3–4 je Testlauf) mit Test-Admin-, Test-Mitglieder-, Test-SU- und Test-Cross-Tenant-Accounts (direkt per Service-Role angelegt, kein manueller `/register`-Umweg nötig, da PROJ-7 selbst das Anlegen testet) — für jeden Testlauf frisch erzeugt und danach vollständig entfernt (verifiziert: 0 verbleibende Zeilen). Getestet über ein eigenes Playwright-Skript (echter Browser, echte HTTP-Requests, kein Mocking), nicht nur über die API wie in `/backend`.

**Hinweis Testumgebung:** Erste Testläufe gegen `npm run dev` (Turbopack) zeigten dieselbe bereits in PROJ-4 dokumentierte sporadische Instabilität unter vielen parallelen/schnell aufeinanderfolgenden Playwright-Sessions; wie dort wurde für einen stabilen Lauf auf den Production-Build umgeschaltet.

### Acceptance Criteria Status

- [x] Admin sieht Button "Mitglieder" auf der Startseite, verlinkt auf `/mitglieder`
- [x] Mitglied (Nicht-Admin, nicht-SU) sieht keinen Button zu `/mitglieder`
- [x] Mitglied wird bei direktem Aufruf von `/mitglieder` sofort zu "/" umgeleitet
- [x] Admin sieht alle Mitglieder des eigenen Vereins sortiert nach Nachname (verifiziert: Alpha, Mitte, Zeta in korrekter Reihenfolge)
- [x] Suchfeld filtert live auf Vorname/Nachname/E-Mail
- [x] Status-Filter (Alle/Nur aktiv/Nur inaktiv) funktioniert
- [x] Leerzustand bei einem Verein ohne weitere Mitglieder außer dem Admin selbst — **BUG-1 gefunden, gefixt und erneut verifiziert** (siehe unten)
- [x] Bearbeiten-Dialog zeigt Vorname, Nachname, E-Mail, Mitgliedsnummer, Geburtstag, Titel vorausgefüllt
- [x] Stammdaten-Änderungen werden gespeichert (Mitgliedsnummer + Geburtstag end-to-end verifiziert, danach in der Liste sichtbar)
- [x] Leeres Pflichtfeld (Vorname) zeigt Validierungsfehler, nichts wird gespeichert
- [x] Duplikat-E-Mail beim Bearbeiten zeigt Fehlermeldung — **BUG-2 gefunden & gefixt während QA** (siehe unten), danach verifiziert
- [x] Aktiv-Status eines anderen Mitglieds umschalten funktioniert
- [x] Selbst-Demotion (eigenes Admin-Flag) erlaubt, wenn ein zweiter aktiver Admin existiert
- [x] Selbst-Demotion blockiert mit erklärender Meldung, wenn Admin der einzige aktive Admin ist
- [x] Neues Mitglied anlegen (Vorname, Nachname, E-Mail, Initial-Passwort) funktioniert, erscheint korrekt in der Liste (`admin=false`, `aktiv=true`, richtiger Verein)
- [x] Initial-Passwort unter 6 Zeichen zeigt Validierungsfehler, kein Account wird angelegt
- [x] Duplikat-E-Mail beim Anlegen zeigt Fehlermeldung
- [x] Admin sieht/bearbeitet ausschließlich Mitglieder des eigenen Vereins (Cross-Tenant-Isolation, siehe Security Audit)
- [x] SuperUser sieht beim Aufruf von `/mitglieder` zuerst einen Verein-Switcher statt direkt einer Liste
- [x] SuperUser sieht nach Verein-Auswahl dieselbe Liste/Aktionen wie ein Admin dieses Vereins
- [x] SuperUser kann den letzten Admin eines fremden Vereins degradieren, ohne durch den "letzter Admin"-Schutz blockiert zu werden (Fremdänderung, wie spezifiziert)

**20/20 Akzeptanzkriterien bestanden** (BUG-1 während QA gefunden, direkt gefixt und erneut verifiziert).

### Edge Cases Status
- [x] Admin ist einziger Admin und versucht Selbst-Degradierung → blockiert mit Meldung
- [x] Duplikat-E-Mail beim manuellen Anlegen → abgedeckt durch dieselbe Regel wie Bearbeiten
- [x] Verein hat außer dem Admin keine weiteren Mitglieder → Leerzustand korrekt (siehe BUG-1, gefixt)
- [x] Direkter URL-Aufruf durch Mitglied eines anderen Vereins → derselbe Redirect wie jeder Nicht-Admin (RLS-unabhängig, da bereits der `admin`/`su`-Check fehlschlägt)
- [x] XSS-Payload (`<script>window.__xss=1</script>`) in Vorname → als reiner Text escaped, kein Skript ausgeführt, kein `window.__xss` gesetzt
- [ ] Zwei Admins bearbeiten gleichzeitig unterschiedliche Mitglieder — kein Locking laut Spec, nicht separat getestet (analog PROJ-4/5/6)
- [ ] Race Condition beim gleichzeitigen Löschen der Verwendung während eines Lösch-Checks — entfällt für PROJ-7 (kein Löschen implementiert, siehe Out of Scope)

### Security Audit Results
- [x] **Cross-Tenant-Isolation (Kernversprechen des Projekts):** Admin von Verein B sieht Mitglieder von Verein A weder in der Liste noch per direktem REST-Call (0 Zeilen bei Lesen und Schreiben); verifiziert sowohl per SQL-Simulation (`/backend`) als auch per echtem Browser-Test (`/qa`)
- [x] Unauthentifizierter Zugriff auf `/mitglieder` und die zugehörigen API-Routen wird verweigert (401/Redirect)
- [x] Ein einfaches Mitglied (kein Admin/SU) kann über die API keine anderen Nutzer bearbeiten (RLS blockiert, 0 betroffene Zeilen)
- [x] SU-Ausnahme von der Cross-Tenant-Grenze ist eng geführt (nur `su`-Feld-geprüft) und funktioniert wie spezifiziert (liest/bearbeitet alle Vereine, aber nachvollziehbar über den Verein-Switcher)
- [x] Rechteausweitung über das `verein`-Array eines Mitglieds ist blockiert (bereits in `/backend` gefunden & gefixt, hier erneut implizit mitverifiziert, da kein UI-Pfad das Feld anfasst)
- [x] XSS/Injection: `<script>`-Payload in Vorname wird von React als reiner Text escaped, kein Skript ausgeführt
- [x] Kein Service-Role-Key im Client-Bundle (`.next/static` durchsucht, keine Treffer für `service_role` oder `SUPABASE_SERVICE_ROLE_KEY`)
- [x] **BUG-2 (Critical, während QA gefunden):** Duplikat-E-Mail beim Bearbeiten führte zu HTTP 500 statt einer kontrollierten Fehlermeldung (Root Cause: Supabase Auths `updateUserById` liefert keine erkennbare Fehlermeldung für Duplikate, anders als `createUser`) — noch während QA gefixt (serverseitige Vorab-Prüfung gegen `public.users`) und danach end-to-end erneut verifiziert
- [~] Rate-Limiting: nicht gesondert getestet (verlässt sich wie PROJ-3/4/5/6 bewusst auf Supabase-Standardlimits)

### Cross-Browser & Responsive
- [x] Chromium: alle Funktionstests bestanden (siehe Acceptance Criteria)
- [x] Firefox: `/mitglieder` lädt korrekt mit Daten bei 768px und 1440px, keine Konsolenfehler
- [x] WebKit: `/mitglieder` lädt korrekt mit Daten bei 768px und 1440px, kein horizontales Overflow
- [~] WebKit zeigt Konsolenfehler zu blockierten RSC-Prefetch-Requests für `/rollen` und `/kategorien` (nicht `/mitglieder` selbst) — vorbestehendes Next.js-Link-Prefetch-Verhalten auf der Startseite, nicht PROJ-7-spezifisch, rein informativ (siehe BUG-3)
- [x] Responsive 375px: kein horizontales Overflow (automatisiert per Playwright `scrollWidth`-Check bestätigt)
- [x] Responsive 768px/1440px: kein horizontales Overflow

### Regression Testing
- `npm test` (Vitest): 20/20 bestanden (14 vorbestehende + 6 neue PROJ-7-Tests für `POST /api/mitglieder`, 8 neue für `PATCH /api/mitglieder/[id]`, korrigiert: 5 PROJ-3 + 6 PROJ-7-POST + 9 PROJ-7-PATCH = 20)
- `npm run test:e2e` (Playwright, bestehende Suite inkl. neuem PROJ-7-Test, gegen Production-Build): 17/18 bestanden. Der eine Fehlschlag (`AC: ungültiger Freischaltcode zeigt Fehlermeldung`, Mobile Safari/WebKit) ist der bereits in PROJ-3/4/5/6 dokumentierte **BUG-2 aus PROJ-3** (vorbestehend, nicht durch PROJ-7 verursacht)
- Neuer E2E-Test `tests/PROJ-7-mitgliederverwaltung.spec.ts` (unauthentifizierter Redirect, Chromium + Mobile Safari) hinzugefügt und grün; alle übrigen Kriterien über ein eigenes Playwright-Skript mit echten, isolierten Testdaten verifiziert (siehe oben) — aus denselben Gründen wie PROJ-3/4/5/6 nicht als dauerhafte E2E-Tests committet (keine seedbare Test-Fixture-Strategie bisher, siehe PROJ-1)

### Bugs Found

#### BUG-1: Leerzustand erscheint nie, da die Admin-eigene Zeile mitgezählt wird — ✅ FIXED & VERIFIED (2026-07-12)
- **Severity:** Medium
- **Steps to Reproduce:**
  1. Als Admin eines Vereins einloggen, der außer dem Admin selbst keine weiteren Mitglieder hat
  2. `/mitglieder` aufrufen
  3. Erwartet (laut Spec-AC): Leerzustand mit Hinweistext "Noch keine weiteren Mitglieder vorhanden." und CTA "Neues Mitglied anlegen"
  4. Tatsächlich (vor dem Fix): Die normale Liste erscheint mit genau einer Zeile (dem Admin selbst, "Du"-Badge), kein Leerzustand
- **Root Cause:** `src/app/mitglieder/page.tsx` prüfte `mitglieder.length === 0`, aber die geladene Liste enthält immer auch die eigene Zeile des Admins (er ist ja Mitglied seines eigenen Vereins).
- **Fix:** Neue abgeleitete Variable `hasOtherMitglieder = mitglieder.some(m => m.auth_user_id !== ownAuthUserId)`. Alle drei Listen-Zustände (Leerzustand / "Keine Mitglieder gefunden" bei Suche ohne Treffer / normale Liste) nutzen jetzt konsistent `hasOtherMitglieder` als Gate, damit sie sich gegenseitig ausschließen
- **Bei der Fix-Verifikation zusätzlich gefunden & mitgefixt:** Der erste Fix-Versuch (nur die Leerzustand-Bedingung geändert) hätte dazu geführt, dass Leerzustand UND die normale Liste (mit der einzelnen Admin-Zeile) gleichzeitig gerendert werden — durch einen eigenen Regressionscheck vor Abschluss entdeckt und durch dieselbe `hasOtherMitglieder`-Bedingung auch auf den normalen Listen-Block angewendet
- **Verifikation:** Per echtem Browser-Test (Playwright, Production-Build, isolierte Testdaten) verifiziert: (1) Leerzustand + CTA erscheinen korrekt bei einem Solo-Admin-Verein, keine doppelte Listenzeile mehr; (2) normale Liste zeigt weiterhin korrekt beide Mitglieder bei einem Verein mit einem zusätzlichen Mitglied; (3) "Keine Mitglieder gefunden" erscheint weiterhin korrekt bei einer nicht-treffenden Suche. `npm test` (20/20) und `npm run build` laufen sauber
- **Priority:** Erledigt

#### BUG-2: Duplikat-E-Mail beim Bearbeiten führte zu HTTP 500 statt kontrollierter Fehlermeldung — ✅ FIXED & VERIFIED (2026-07-12)
- **Severity:** Critical (unkontrollierter 500er auf einem regulären, leicht auslösbaren Nutzerpfad)
- **Steps to Reproduce:**
  1. Als Admin ein Mitglied bearbeiten, E-Mail auf eine bereits vergebene E-Mail (z.B. die eines anderen Vereinsmitglieds) ändern, speichern
  2. Erwartet: Fehlermeldung "Diese E-Mail ist bereits registriert.", nichts gespeichert
  3. Tatsächlich (vor dem Fix): HTTP 500, generische "Speichern fehlgeschlagen"-Meldung
- **Root Cause:** `supabaseAdmin.auth.admin.updateUserById()` liefert bei einer Duplikat-E-Mail keine erkennbare Fehlermeldung (`message: "Error updating user"`, `code: "unexpected_failure"`, Status 500) — anders als `createUser()`, dessen Fehlermeldung den Text "already registered" enthält. Per Auth-Logs bestätigt: dahinter steckt ein `duplicate key value violates unique constraint "users_email_partial_key"` (SQLSTATE 23505), von GoTrue in eine generische 500-Antwort gewrappt
- **Fix:** `src/app/api/mitglieder/[id]/route.ts` prüft jetzt vor dem `updateUserById`-Aufruf explizit per Service-Role-Client, ob bereits eine andere `public.users`-Zeile dieselbe E-Mail hat, und gibt in diesem Fall direkt `{ error: "email_taken" }` (400) zurück, ohne `updateUserById` überhaupt aufzurufen. Der ursprüngliche Error-Message-Abgleich bleibt als sekundäres Sicherheitsnetz erhalten
- **Verifikation:** Per echtem Browser-Test (Playwright, Production-Build) end-to-end erneut durchgespielt — Fehlermeldung erscheint korrekt, kein 500 mehr. Zusätzlich per Vitest-Test abgesichert (`falls back to error-message matching ... (pre-check safety net)`). `npm test` (20/20) und `npm run build` laufen weiterhin sauber
- **Priority:** Erledigt

#### BUG-3: WebKit blockiert RSC-Prefetch-Requests für /rollen und /kategorien auf der Startseite (informativ)
- **Severity:** Low (informativ, kein funktionaler Fehler, nicht PROJ-7-spezifisch)
- **Steps to Reproduce:**
  1. Startseite in WebKit mit einem eingeloggten Admin öffnen
  2. Konsole prüfen
  3. Tatsächlich: `Fetch API cannot load .../rollen?_rsc=... due to access control checks.` und dieselbe Meldung für `/kategorien` — betrifft nicht `/mitglieder`
- **Root Cause:** Next.js' Link-Prefetching (React Server Components) für die Admin-Buttons auf der Startseite; WebKits striktere Access-Control-Behandlung blockiert den Prefetch-Request. Vorbestehendes Verhalten der Startseite (PROJ-4/5/6-Buttons), nicht durch PROJ-7 verursacht oder verschlimmert — nur durch den neuen, gründlicheren WebKit-Testlauf in dieser QA-Runde erstmals sichtbar geworden
- **Priority:** Nice to have / kein Fix im Rahmen von PROJ-7 nötig

### Summary
- **Acceptance Criteria:** 20/20 bestanden
- **Bugs Found:** 3 total (1 Critical — **behoben & verifiziert**, 1 Medium — **behoben & verifiziert**, 1 Low offen/informativ und nicht PROJ-7-spezifisch)
- **Security:** Pass — Cross-Tenant-Isolation, SU-Ausnahme, RLS-Rekursionsfix und Rechteausweitungs-Schutz (beide aus `/backend`) sowie der Duplikat-E-Mail-500er (BUG-2) alle verifiziert korrekt/behoben
- **Regressions:** Keine neuen Regressionen (der eine E2E-Fehlschlag ist der vorbestehende, dokumentierte PROJ-3-BUG-2/WebKit)
- **Production Ready:** YES
- **Recommendation:** Deploy möglich. BUG-3 ist rein informativ (nicht PROJ-7-spezifisch) und erfordert keinen Fix im Rahmen dieses Features.

### Erweiterung 2026-07-12: QA für Foto-Karten-Ansicht, Profilbild-Upload, hartes Löschen

**Tested:** 2026-07-12
**App URL:** http://localhost:3000 (Production-Build via `npm run build && npm run start`, gegen die echte Supabase-Instanz `cspljbavgdnsqlqkdxvc`, gleiches Vorgehen wie beim ursprünglichen PROJ-7-QA-Lauf)
**Tester:** QA Engineer (AI)

**Testdaten:** Zwei isolierte Test-Vereine mit Test-Admin- (eigener und fremder Verein), Test-Mitglieder- (mit/ohne Profilbild, in `einstellungen.eingeteilte_users` referenziert) und ohne SU-Account (bereits in `/backend` gegen die Storage-Policies verifiziert, hier nicht erneut). Alle direkt per Service-Role angelegt, über ein eigenes Playwright-Skript (echter Browser, echte HTTP-Requests) getestet und danach vollständig entfernt (verifiziert: 0 verbleibende Test-Zeilen in `users`/`vereine`).

#### Acceptance Criteria Status (nur die neuen Kriterien dieser Erweiterung; die Basiskriterien aus dem ersten QA-Lauf oben sind unverändert und wurden per Regressionstest erneut stichprobenartig bestätigt)

- [x] Admin sieht standardmäßig die Foto-Karten-Ansicht (`localStorage`-Wert `null`/`karten`)
- [x] Toggle "In Listenform" wechselt zur Listenform und merkt sich das (`localStorage` = `liste`), erneuter Klick wechselt zurück (`karten`)
- [x] Klick auf eine Karte öffnet denselben Bearbeiten-Dialog wie der "Bearbeiten"-Button in der Listenform
- [x] Mitglied ohne Profilbild zeigt den `UserRound`-Platzhalter statt eines Fotos
- [x] Mitglied mit `profile_picture_url` zeigt das tatsächliche Foto (verifiziert per Netzwerk-Log: externe Test-URL lädt mit HTTP 200, `<img src>` entspricht dem gespeicherten Wert)
- [x] Gültiger Profilbild-Upload (PNG, im Dialog) zeigt eine Vorschau, nach "Speichern" erscheint das neue Foto in der Karten-Ansicht
- [x] Ungültiger Upload (falscher Dateityp) zeigt eine Fehlermeldung, Upload wird abgebrochen
- [x] Papierkorb-Icon vorhanden auf allen Karten außer der eigenen ("Du"-Karte hat kein Icon)
- [x] Klick auf Papierkorb öffnet Bestätigungsdialog ("Mitglied löschen?"); Abbrechen löscht nichts
- [x] Bestätigtes Löschen entfernt das Mitglied tatsächlich aus der Liste (Auth-Account + `users`-Zeile, per DB-Check verifiziert)
- [x] Löschen eines in `einstellungen.eingeteilte_users` referenzierten Mitglieds wird blockiert (Mitglied bleibt in der Liste sichtbar)
- [x] FAB (schwebender Rundbutton) vorhanden und öffnet den Anlege-Dialog

**12/12 neue Akzeptanzkriterien bestanden.**

#### Security Audit Results (Erweiterung)
- [x] Cross-Tenant-Isolation gilt auch für die neue `DELETE`-Route: Admin von Verein B erhält `403 forbidden` bei direktem API-Aufruf gegen ein Mitglied von Verein A (RLS versteckt die Zeile, kein Treffer im scoped client)
- [x] Selbst-Löschen ist serverseitig blockiert, nicht nur clientseitig versteckt: direkter API-Aufruf gegen die eigene ID liefert `400 self_delete`, unabhängig vom (fehlenden) Papierkorb-Icon auf der eigenen Karte
- [x] Storage-RLS für den Profilbild-Upload ist eng geführt (siehe `/backend`-Live-Verifikation): Admin kann ausschließlich in den eigenen Verein-Pfad hochladen, ein einfaches Mitglied (kein Admin) kann gar nicht hochladen, SU-Ausnahme funktioniert wie spezifiziert
- [x] Kein Service-Role-Key im Client-Bundle (`.next/static` erneut durchsucht nach `service_role`/`SUPABASE_SERVICE_ROLE_KEY`, keine Treffer)

#### Regression Testing
- `npm test` (Vitest): 29/29 grün (14 vorbestehende + 6 PROJ-7-POST + 9 PROJ-7-PATCH aus dem ersten Lauf sind darin bereits enthalten, siehe `/backend`)
- `npm run test:e2e` (Playwright, bestehende committete Suite): 19/20 bestanden — der eine Fehlschlag ist weiterhin der bereits dokumentierte, vorbestehende PROJ-3-BUG-2/WebKit-Fall (Mobile Safari), keine neue Regression durch diese Erweiterung
- Basis-Funktionalität (Suche, Status-Filter, Bearbeiten, Aktiv/Admin-Toggle, letzter-Admin-Schutz) manuell stichprobenartig erneut bestätigt, da `src/app/mitglieder/page.tsx` für diese Erweiterung strukturell stark verändert wurde (Header, View-Umschaltung, FAB)

#### Cross-Browser & Responsive
- [x] Chromium: alle 12 neuen Kriterien bestanden (siehe oben)
- [x] Responsive 375px/768px/1440px: kein horizontales Overflow (per Playwright `scrollWidth`-Check bestätigt); Karten-Grid bleibt bei allen drei Breiten 4-spaltig (konsistent mit der dokumentierten Nachjustierung in den Frontend-Notes) und zeigt echte Fotos korrekt skaliert an (siehe Screenshots)

#### Bugs Found
Keine neuen Bugs gefunden. Ein anfänglicher Testfehlschlag ("Foto card shows the actual profile picture") stellte sich bei der Root-Cause-Analyse als Artefakt des eigenen QA-Skripts heraus, nicht als Produktfehler: eine frühere Skript-Ausführung hatte das Testbild eines Mitglieds bereits über den Upload-Dialog auf eine neue URL überschrieben, wodurch eine hart codierte Erwartung ("URL enthält `picsum`") in einem späteren Lauf naturgemäß nicht mehr zutraf. Per gezieltem Diagnose-Skript (Netzwerk-Log) bestätigt: das `<img>`-Element rendert korrekt mit dem tatsächlich gespeicherten `profile_picture_url` und lädt mit HTTP 200 — kein Fehlverhalten der App.

#### Summary
- **Acceptance Criteria (Erweiterung):** 12/12 bestanden
- **Bugs Found:** 0 (ein scheinbarer Fund wurde als Testskript-Artefakt widerlegt, siehe oben)
- **Security:** Pass — Cross-Tenant-Isolation und Selbst-Löschen-Sperre für die neue DELETE-Route sowie die Storage-RLS-Policies (aus `/backend`) alle verifiziert
- **Regressions:** Keine neuen Regressionen (der eine E2E-Fehlschlag ist weiterhin der vorbestehende PROJ-3-BUG-2/WebKit-Fall)
- **Production Ready:** YES
- **Recommendation:** Deploy möglich.

## Deployment

**Deployed:** 2026-07-12
**Production URL:** https://simpliplan.toolies.eu/mitglieder
**Mechanism:** GitHub Actions (`.github/workflows/deploy.yml`) — SSH nach Hetzner bei Push auf `main`, `npm ci` + `npm run build` + PM2-Reload (`ecosystem.config.js`, Prozess "SimpliPlan"). Kein Vercel (siehe PROJ-4/5/6).

- Pre-Deployment-Checks: `npm run build` sauber, `npm test` 20/20, QA Approved (20/20 AC, 0 offene Critical/High-Bugs), keine Secrets im Diff (nur PROJ-7-relevante Dateien gestaged, das vorbestehende, unabhängige `.claude/settings.json` bewusst ausgeschlossen), DB-Migrationen bereits während `/backend` live angewendet. `npm run lint` weiterhin am vorbestehenden, PROJ-7-unabhängigen Problem (fehlende `eslint.config.js`) gescheitert — kein neuer Blocker.
- Ein Commit `feat(PROJ-7): ...` gepusht nach `main` (Spec, Architecture, Frontend, Backend und QA gebündelt, wie schon bei PROJ-5/6)
- Deploy ausgelöst durch `git push origin main`, GitHub-Actions-Workflow "Deploy to Hetzner"
- Tag `v1.3.0-PROJ-7` erstellt und gepusht
- Post-Deployment-Verifikation: `https://simpliplan.toolies.eu/` und `/mitglieder` liefern beide HTTP 200; per SSH bestätigt, dass der Server-Checkout auf dem neuen Commit steht (`eaa9792`) und der PM2-Prozess "SimpliPlan" nach dem Reload online ist
- Production-Ready-Essentials (Error Tracking/Security Headers/Performance/Rate Limiting) weiterhin nicht projektweit eingerichtet — nicht Teil von PROJ-7, betrifft die gesamte App gleichermaßen wie schon bei PROJ-3–6

### Erweiterung 2026-07-12: Deployment (Foto-Karten-Ansicht, Profilbild-Upload, hartes Löschen)

**Deployed:** 2026-07-12
**Production URL:** https://simpliplan.toolies.eu/mitglieder
**Mechanism:** GitHub Actions (`.github/workflows/deploy.yml`) — SSH nach Hetzner bei Push auf `main`, `npm ci` + `npm run build` + PM2-Reload (Prozess "SimpliPlan"), identisch zum bestehenden Mechanismus.

- Pre-Deployment-Checks: `npm run build` sauber, `npm test` 29/29, QA Approved (12/12 neue AC, 0 Bugs), keine Secrets im Diff, DB-Migrationen (inkl. der neuen Storage-Policies) bereits vor dem Deploy live angewendet und end-to-end verifiziert. `npm run lint` weiterhin am vorbestehenden, PROJ-7-unabhängigen Problem (fehlende `eslint.config.js`) gescheitert — kein neuer Blocker.
- Bewusst NICHT mit committet: `.claude/settings.json` (unabhängige, vorbestehende Permissions-Änderung außerhalb des PROJ-7-Scopes, gleiches Vorgehen wie beim ersten PROJ-7-Deploy)
- Commit `feat(PROJ-7): Add photo-card view, profile picture upload, hard delete` (`5564703`) gepusht nach `main`
- Deploy ausgelöst durch `git push origin main`, GitHub-Actions-Workflow "Deploy to Hetzner"
- Tag `v1.4.0-PROJ-7` erstellt und gepusht
- Post-Deployment-Verifikation: per SSH bestätigt, dass der Server-Checkout auf `5564703` steht und der PM2-Prozess "SimpliPlan" nach dem Reload online ist (Uptime 64s zum Prüfzeitpunkt); `https://simpliplan.toolies.eu/` und `/mitglieder` liefern beide HTTP 200
- Production-Ready-Essentials weiterhin unverändert (nicht Teil dieser Erweiterung)
