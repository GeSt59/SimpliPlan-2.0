# PROJ-16: Meine Einteilungen (Mitglied-Übersicht eigener Zeitbereich-Zusagen)

## Status: Deployed
**Created:** 2026-07-17
**Last Updated:** 2026-07-17

## Dependencies
- PROJ-1 (Supabase Infrastruktur Multi-Tenant + RLS) — für RLS-Policies, die Zugriff auf den eigenen Verein beschränken
- PROJ-3 (Authentifizierung) — für eingeloggten Nutzer-Zugriff (Mitglied und Admin) und die Verein-Zuordnung
- PROJ-8 (Activities CRUD) — liefert das Activity-Datenmodell (Name, Datum, Zeitraum), das für die Gruppen-Überschriften benötigt wird
- PROJ-9 (Zeitbereiche CRUD) — liefert die `einstellungen`-Tabelle (Zeitbereich-Entität)
- PROJ-10 (Mitglied-Anmeldung zu Zeitbereichen) — liefert `eingeteilte_users`, die Status-Icons (`zu wenig`/`genau richtig`/`zu viel`), die Datums-Grenze Kommend/Vergangen sowie die Activity-Anmeldung-Seite (`/activities/[id]`), zu der aus dieser neuen Übersicht verlinkt wird

## User Stories
- Als eingeloggter Nutzer (Mitglied oder Admin) möchte ich alle meine eigenen Zeitbereich-Zusagen an einem Ort sehen, damit ich einen Überblick habe, wofür ich mich bereits eingetragen habe.
- Als Nutzer möchte ich zwischen kommenden und vergangenen Zusagen umschalten können, damit ich sowohl vorausplanen als auch zurückblicken kann.
- Als Nutzer möchte ich meine Zusagen gruppiert nach Activity sehen, damit ich bei mehreren Zusagen zur selben Activity nicht den Überblick verliere.
- Als Nutzer möchte ich das Status-Icon (zu wenig/genau richtig/zu viel) pro Zeitbereich sehen, damit ich auf einen Blick erkenne, ob dort noch Helfer gebraucht werden.
- Als Nutzer möchte ich auf eine Zusage klicken und zur zugehörigen Activity-Anmeldung-Seite gelangen, damit ich mich dort bei Bedarf wieder abmelden kann.
- Als Nutzer ohne eigene Zusagen möchte ich einen klaren Leerzustand sehen, damit ich weiß, dass ich mich noch nirgends eingetragen habe.
- Als Nutzer möchte ich diese Übersicht über einen Link auf der Profil-Seite erreichen, damit ich sie nicht separat suchen muss.

## Out of Scope
- Direktes Abmelden aus dieser Übersicht (eigene Checkbox) — bleibt exklusiv auf der bestehenden Activity-Anmeldung-Seite aus PROJ-10; diese Übersicht ist rein lesend und verlinkt dorthin
- Anzeige von Ort und Rolle pro Zeitbereich-Zeile — bewusst auf Activity-Name, Datum/Zeit (als Gruppen-Überschrift), Zeitbereich-Label und Status-Icon beschränkt; vollständige Details bleiben einen Klick entfernt auf der Activity-Seite
- Ein eigener 4. Tab in der Bottom-Tab-Bar (PROJ-15) — Zugriff läuft über einen Link auf der Profil-Seite, keine Änderung an der bestehenden Tab-Leiste
- Fremde Einteilungen (andere Mitglieder) — ausschließlich die eigenen Zusagen des eingeloggten Nutzers, unabhängig von dessen Rolle (auch ein Admin sieht hier nur seine eigenen)
- Suche/Filter innerhalb der eigenen Zusagen — bei einer üblicherweise überschaubaren persönlichen Zusagen-Anzahl nicht nötig
- Kalender-Export (ICS) dieser Zusagen — eigenes Feature PROJ-14
- Admin-Werkzeuge (fremde Mitglieder hinzufügen/entfernen) — bleibt exklusiv PROJ-11; diese Seite zeigt ausschließlich die persönliche Sicht
- Benachrichtigungen bei Änderungen an eigenen Zusagen (z.B. wenn ein Admin einen zugesagten Zeitbereich nachträglich verändert) — kein Benachrichtigungssystem im Projekt
- Stub-Zeitbereiche (benötigt=0, keine Rolle) in dieser Übersicht — werden herausgefiltert, analog zu PROJ-10/11

## Acceptance Criteria

**Format:** Angenommen [Vorbedingung] / Wenn [Aktion] / Dann [Ergebnis]

- [ ] Angenommen ein unauthentifizierter Nutzer ruft die neue Route direkt über die URL auf, dann wird er zu "/" umgeleitet
- [ ] Angenommen ein eingeloggter Nutzer (Mitglied oder Admin) öffnet die Profil-Seite, dann sieht er einen neuen Button/Link "Meine Einteilungen"
- [ ] Angenommen der Nutzer klickt auf "Meine Einteilungen", dann gelangt er zur neuen Übersicht-Seite
- [ ] Angenommen der Nutzer öffnet die neue Seite, dann sieht er standardmäßig den Bereich "Kommend"
- [ ] Angenommen der Nutzer klickt auf den Umschalt-Button, dann wechselt die Ansicht zu "Vergangen"; ein erneuter Klick wechselt zurück zu "Kommend"
- [ ] Angenommen der Nutzer ist für einen oder mehrere Zeitbereiche einer kommenden Activity zugesagt, dann erscheint diese Activity im Bereich "Kommend" mit Activity-Name und Datum/Zeit als Überschrift, darunter je eine Zeile pro zugesagtem Zeitbereich (Zeitbereich-Label + Status-Icon)
- [ ] Angenommen der Nutzer ist für einen oder mehrere Zeitbereiche einer bereits vergangenen Activity zugesagt, dann erscheint diese Activity ausschließlich im Bereich "Vergangen", nicht in "Kommend"
- [ ] Angenommen der Nutzer ist für mehrere Zeitbereiche derselben Activity zugesagt, dann erscheint die Activity nur einmal als Gruppen-Überschrift mit allen zugesagten Zeitbereichen darunter
- [ ] Angenommen ein Zeitbereich hat kommen < benötigt, dann zeigt seine Zeile das "zu wenig"-Icon; bei kommen = benötigt das "genau richtig"-Icon; bei kommen > benötigt das "zu viel"-Icon (identische Icons/Logik wie PROJ-10)
- [ ] Angenommen der Nutzer klickt auf eine Activity-Gruppe oder eine ihrer Zeitbereich-Zeilen, dann gelangt er zur Activity-Anmeldung-Seite `/activities/[id]`, auf der er sich bei Bedarf abmelden kann
- [ ] Angenommen der Nutzer hat aktuell keine einzige kommende Zusage, dann zeigt der Bereich "Kommend" einen Leerzustand mit Hinweistext statt einer leeren Fläche
- [ ] Angenommen der Nutzer hat keine einzige vergangene Zusage, dann zeigt der Bereich "Vergangen" ebenfalls einen entsprechenden Leerzustand
- [ ] Angenommen ein Zeitbereich hat benötigt=0 oder keine zugewiesene Rolle, dann erscheint er auch dann nicht in "Meine Einteilungen", wenn der Nutzer zufällig darin eingetragen ist
- [ ] Angenommen ein Admin ist eingeloggt, dann sieht er auf "Meine Einteilungen" ausschließlich seine eigenen Zusagen, keine Zusagen anderer Mitglieder (keine Admin-Sonderansicht)
- [ ] Angenommen ein Nutzer von Verein A ist eingeloggt, dann zeigt "Meine Einteilungen" ausschließlich Zusagen zu Activities des eigenen Vereins

## Edge Cases
- Nutzer hat gar keine Zusagen (weder kommend noch vergangen) → beide Bereiche zeigen jeweils den passenden Leerzustand
- Eine Activity liegt genau am heutigen Datumsgrenzwert → verwendet dieselbe Kommend/Vergangen-Grenze wie das bestehende Activities-Archiv (PROJ-10, `du_zbis` vs. `startOfTodayIso()`), kein separates Grenzwert-Konzept
- Ein Admin entfernt nachträglich den Nutzer selbst aus einem Zeitbereich (PROJ-11) → die Zusage verschwindet beim nächsten Laden von "Meine Einteilungen", kein Hinweis/Benachrichtigung (siehe Out of Scope)
- Ein Zeitbereich, für den der Nutzer zugesagt hat, wird nachträglich zum Stub degradiert (Rolle entfernt oder benötigt auf 0 gesetzt) → verschwindet aus "Meine Einteilungen", analog zur bestehenden Filterregel
- Nutzer ist über einen migrierten `adalo_id`-Alteintrag in `eingeteilte_users` referenziert statt über die echte `id` → wird trotzdem korrekt als eigene Zusage erkannt (identischer id/adalo_id-Fallback wie in `src/lib/activities.ts` bereits etabliert)
- Zwei Zeitbereiche derselben Activity haben unterschiedliche Status (einer "zu wenig", einer "zu viel") → beide Zeilen zeigen unabhängig voneinander ihr jeweils korrektes Icon innerhalb derselben Activity-Gruppe
- Nutzer klickt auf eine Zusage zu einer Activity, die zwischenzeitlich gelöscht wurde → sollte durch RLS/fehlende Zeile praktisch nicht vorkommen; die Ziel-Route `/activities/[id]` zeigt in diesem Fall "Nicht gefunden" (bestehendes Verhalten, kein neuer Code nötig)

## Technical Requirements (optional)
- Security: Nur für eingeloggte Nutzer, kein Admin-Erfordernis; liest ausschließlich `einstellungen`/`activities` des eigenen Vereins (bereits durch bestehende RLS aus PROJ-8/9/10 für jeden Vereins-Nutzer freigegeben) und filtert clientseitig auf die eigene Nutzer-ID/`adalo_id` in `eingeteilte_users`
- Kein neuer API-Endpunkt und keine neue DB-Migration erwartet — rein lesende Funktion auf bereits vorhandenen, bereits für alle Vereins-Nutzer freigegebenen Tabellen (analog zur Übersicht-Seite aus PROJ-10); finale Bestätigung in `/architecture`
- Neue Route (voraussichtlich `/meine-einteilungen`), Client Component, direkter Browser→Supabase-Read (konsistent mit PROJ-3–13-Muster)
- Wiederverwendung bestehender Hilfsfunktionen aus `src/lib/activities.ts`: `computeSignupStatus`, `SIGNUP_STATUS_ICON`, `isMemberInRefs`, `formatActivityDateTime`/`formatActivityRange`, `startOfTodayIso` — keine neue Logik-Duplikation
- Gruppierung/Sortierung erfolgt clientseitig nach dem Laden: "Kommend" aufsteigend nach Activity-Datum (nächste zuerst), "Vergangen" absteigend (jüngste zuerst)

## Open Questions
Keine offenen Fragen aus dem Interview — alle Kernentscheidungen wurden getroffen.

## Decision Log

### Product Decisions
| Decision | Rationale | Date |
|----------|-----------|------|
| Übersicht zeigt sowohl kommende als auch vergangene Zusagen, umschaltbar über einen Toggle-Button auf einer einzigen Seite (nicht zwei getrennte Routen) | Nutzerentscheidung im Interview; analog zum bestehenden Listenform/Kartenform-Toggle-Muster (PROJ-7/13), einfacher als zwei separate Routen wie bei Activities/Archiv | 2026-07-17 |
| Zugriff über einen neuen Button/Link auf der bestehenden Profil-Seite, kein neuer 4. Tab in der Bottom-Tab-Bar | Nutzerentscheidung im Interview; kleinstmögliche Änderung, keine erneute Anpassung der bereits mehrfach geänderten PROJ-15-Tab-Leiste | 2026-07-17 |
| Seite ist rein lesend; Abmelden bleibt exklusiv über die bestehende Checkbox auf der Activity-Anmeldung-Seite (PROJ-10), Klick auf eine Zusage verlinkt dorthin | Nutzerentscheidung im Interview; keine Duplikation der bereits bestehenden, bereits verifizierten Anmelde-/Abmelde-Logik aus PROJ-10 | 2026-07-17 |
| Zeilen zeigen nur Activity-Name, Datum/Zeit (als Gruppen-Überschrift), Zeitbereich-Label und Status-Icon — bewusst ohne Ort und Rolle | Nutzerentscheidung im Interview; hält die Übersicht kompakt, vollständige Details sind einen Klick entfernt auf der Activity-Seite bereits vorhanden | 2026-07-17 |
| Mehrere Zusagen zur selben Activity werden gruppiert unter einer gemeinsamen Activity-Überschrift dargestellt, nicht als redundante Einzelzeilen | Nutzerentscheidung im Interview; übersichtlicher, wenn ein Nutzer für mehrere Zeitbereiche derselben Activity zugesagt hat | 2026-07-17 |
| Status-Icon (zu wenig/genau richtig/zu viel) wird pro Zeitbereich-Zeile mit angezeigt | Nutzerentscheidung im Interview; gibt dem Nutzer auf einen Blick einen Hinweis, ob sein Zeitbereich noch Helfer braucht, ohne extra auf die Activity klicken zu müssen | 2026-07-17 |
| Seite ist für alle eingeloggten Nutzer verfügbar (Mitglied UND Admin), keine Admin-Sonderansicht | Nutzerentscheidung im Interview; auch Admins sind Vereinsmitglieder mit eigenen Zusagen — Admin-spezifische Fremdverwaltung bleibt weiterhin exklusiv PROJ-11 | 2026-07-17 |
| Sortierung: "Kommend" aufsteigend (nächste Activity zuerst), "Vergangen" absteigend (jüngste zuerst) | Eigene Produktentscheidung, nicht explizit im Interview abgefragt, aber konsistent mit dem naheliegenden Nutzerbedürfnis ("was steht als Nächstes an" bzw. "was war zuletzt") | 2026-07-17 |
| Stub-Zeitbereiche (benötigt=0, keine Rolle) werden ausgeblendet, auch wenn der Nutzer technisch darin eingetragen sein sollte | Konsistent mit der bereits etablierten PROJ-10/11-Regel; vermeidet Rauschen durch Zeitbereiche, die praktisch keine echte Zusage darstellen | 2026-07-17 |

### Technical Decisions
<!-- Added by /architecture -->
| Decision | Rationale | Date |
|----------|-----------|------|
| Kein neuer API-Endpunkt, keine neue RLS-Policy, keine Migration | Per direkter Introspektion der Live-Datenbank bestätigt: `einstellungen_select_own` und die bestehende `activities`-SELECT-Policy ("Users can view own verein's activities") erlauben bereits jedem eingeloggten Vereinsmitglied (nicht nur Admins) Lesezugriff auf die relevanten Zeilen des eigenen Vereins — exakt das, was PROJ-16 braucht, ohne jede Änderung | 2026-07-17 |
| Filterung auf "eigene Zusage" (eigene `id` oder `adalo_id` in `eingeteilte_users`) läuft als Datenbank-Filter (contains-Abfrage), nicht als vollständiger Tabellen-Download mit Client-seitiger Filterung | Kleinere übertragene Datenmenge; identisches Filter-Muster bereits etabliert beim Lösch-Verwendungscheck (PROJ-7, `einstellungen.eingeteilte_users.cs.{id}`) | 2026-07-17 |
| Neue, eigenständige Route/Seite statt Wiederverwendung der bestehenden Übersicht-Seite (`/activities/[id]/uebersicht`, PROJ-10/11) | Unterschiedliche Datenrichtung: die bestehende Seite zeigt ALLE Mitglieder EINER Activity, PROJ-16 zeigt die EIGENEN Zusagen über ALLE Activities hinweg — eine gemeinsame Seite für beide Blickrichtungen zu verbiegen wäre komplexer als eine kleine eigene Seite | 2026-07-17 |
| Gruppierung, Sortierung und Kommend/Vergangen-Aufteilung bleiben clientseitig, keine serverseitige Aggregation | Persönliche Zusagen-Menge ist typischerweise klein; identisches Prinzip wie bei allen bisherigen Lese-Seiten (PROJ-8-13), kein Bedarf für zusätzliche Backend-Komplexität | 2026-07-17 |
| Wiederverwendung bestehender Hilfsfunktionen aus `src/lib/activities.ts` (`computeSignupStatus`, `SIGNUP_STATUS_ICON`, `isMemberInRefs`, `formatActivityDateTime`, `startOfTodayIso`) statt neuer, paralleler Implementierungen | Identische Logik wird bereits in PROJ-10/11 verwendet und ist dort bereits verifiziert; vermeidet Logik-Duplikation und Inkonsistenzrisiko (z.B. abweichende Kommend/Vergangen-Grenze) | 2026-07-17 |
| Kein neues npm-Paket | `@supabase/supabase-js`, `lucide-react`, `shadcn/ui` (`button`) — alles bereits im Projekt vorhanden | 2026-07-17 |

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)

### A) Component Structure

```
Profil-Seite "/profil" (bestehend, ERWEITERT)
└── NEU: Button/Link "Meine Einteilungen" → /meine-einteilungen

Meine-Einteilungen-Seite "/meine-einteilungen" (NEU)
├── Zugriffsprüfung: nur Session erforderlich (jeder eingeloggte Nutzer,
│   kein Admin-Erfordernis); unauthentifiziert → Redirect zu "/"
├── Toggle-Button "Kommend" / "Vergangen" (Standard: Kommend)
├── Lädt die eigenen Zeitbereich-Zusagen: alle einstellungen-Zeilen, in
│   deren eingeteilte_users die eigene id oder adalo_id vorkommt, sowie die
│   zugehörigen Activities (Name, Datum/Zeitraum) — beides bereits durch
│   bestehende RLS automatisch auf den eigenen Verein beschränkt
├── Filtert Stub-Zeitbereiche heraus (benötigt=0 oder keine Rolle),
│   identisch zu PROJ-10/11
├── Teilt die verbleibenden Zusagen anhand des Activity-Zeitraums in
│   Kommend/Vergangen (gleiche Grenze wie das bestehende Activities-Archiv)
├── Gruppiert nach Activity (Name + Datum/Zeit als Überschrift), sortiert:
│   Kommend aufsteigend (nächste zuerst), Vergangen absteigend (jüngste zuerst)
├── Je zugesagtem Zeitbereich eine Zeile: Zeitbereich-Label + Status-Icon
│   (zu wenig/genau richtig/zu viel, identische Icons wie PROJ-10)
├── Klick auf eine Activity-Gruppe oder eine ihrer Zeilen → Navigation zu
│   /activities/[id] (bestehende Anmeldung-Seite, Abmelden erfolgt dort)
└── Je Bereich (Kommend/Vergangen) ein eigener Leerzustand mit Hinweistext,
    wenn keine Zusagen vorhanden sind
```

### B) Data Model (fachlich, kein Code)

- Keine neue Tabelle, keine neue Spalte. Nutzt ausschließlich die bereits bestehenden Tabellen `einstellungen` (Zeitbereich-Entität, PROJ-9) und `activities` (PROJ-8).
- Eine Zusage liegt vor, wenn die eigene `id` oder `adalo_id` in der `eingeteilte_users`-Liste einer `einstellungen`-Zeile vorkommt (identisches id/adalo_id-Fallback-Prinzip wie an allen bisherigen Stellen im Projekt, z.B. PROJ-7-Löschschutz, PROJ-10/11-Namensauflösung).
- Zur Gruppierung wird jede gefundene Zusage über das `activity`-Feld der `einstellungen`-Zeile der zugehörigen Activity zugeordnet (Name, Start-/Endzeitpunkt für Überschrift und Kommend/Vergangen-Einordnung).
- Kein neues Feld, kein neuer Status — "Meine Einteilungen" ist eine reine, andere Darstellung bereits vorhandener Daten.

### C) Tech-Entscheidungen (Begründung für PM)

- **Kein Backend-Aufwand nötig**: Die Datenbank erlaubt bereits heute jedem Vereinsmitglied (nicht nur Admins) Lesezugriff auf die Zeitbereiche und Activities des eigenen Vereins — das wurde direkt in der Datenbank überprüft, nicht nur angenommen. PROJ-16 ist dadurch eine reine Oberflächen-Funktion ohne neue Datenbank- oder Sicherheitsänderung.
- **Eigene neue Seite statt Wiederverwendung der bestehenden Übersicht-Seite**: Die bestehende Seite aus PROJ-10/11 beantwortet "wer ist bei dieser einen Activity alles dabei", PROJ-16 beantwortet "wo bin ich selbst überall dabei" — umgekehrte Blickrichtung über viele Activities hinweg. Eine gemeinsame Seite für beide Fragen zu verbiegen wäre unübersichtlicher als eine kleine, eigenständige neue Seite.
- **Wiederverwendung bestehender Bausteine** (Status-Icons, Datumsformatierung, Kommend/Vergangen-Grenze, id/adalo_id-Fallback): Vermeidet doppelt gepflegte Logik und stellt sicher, dass sich PROJ-16 exakt wie die bereits vertrauten PROJ-10/11-Regeln verhält.
- **Alles bleibt clientseitig lesend**: Wie bei allen bisherigen Übersichts-Seiten des Projekts (PROJ-8–13) genügt ein direkter Browser→Datenbank-Lesezugriff; es gibt nichts zu schreiben, also auch keinen Bedarf für einen neuen serverseitigen Endpunkt.

### D) Dependencies

- Keine neuen Pakete: `@supabase/supabase-js`, `lucide-react`, `shadcn/ui` (`button`) — alles bereits im Projekt vorhanden.

## Frontend Implementation Notes

**Gebaut:**
- `src/app/profil/page.tsx` (GEÄNDERT) — der bereits vorhandene, aber funktionslose Button "Meine Einteilungen" (Icon `ListChecks`, `bg-brand-gold`) wurde verdrahtet (`asChild` + `Link href="/meine-einteilungen"`), kein zweiter Button angelegt
- `src/app/meine-einteilungen/page.tsx` (NEU) — eigenständige Client-Komponente, Zugriffsschutz identisch zu `/mitgliedersuche` (nur Session, kein Admin-Erfordernis; kein Verein zugeordnet → Hinweistext statt Redirect)
- Lädt einmalig alle `activities` des eigenen Vereins (RLS-automatisch gescoped) sowie alle `einstellungen`-Zeilen, in deren `eingeteilte_users` die eigene `id` oder `adalo_id` vorkommt (`.or("eingeteilte_users.cs.{id}", "eingeteilte_users.cs.{adalo_id}")`, identisches Filter-Muster wie der PROJ-7-Lösch-Verwendungscheck), gefiltert auf `ben > 0` und vorhandene Rolle (Stub-Zeitbereiche raus)
- Page-lokale Hilfsfunktion `findActivity` (id/adalo_id-Fallback, analog zu `findMember`/`findRole` aus `src/lib/activities.ts`) löst den `activity`-Verweis jeder Zusage auf die zugehörige Activity auf — bewusst nicht in die geteilte Lib verschoben, da aktuell nur an dieser einen Stelle gebraucht (keine verfrühte Abstraktion)
- Gruppierung nach Activity-ID, Aufteilung Kommend/Vergangen über `du_zbis` vs. `startOfTodayIso()` (identische Grenze wie das bestehende Activities-Archiv), Sortierung: Kommend aufsteigend, Vergangen absteigend
- Toggle-Button ("Vergangene anzeigen" / "Kommende anzeigen", Standard: Kommend), keine `localStorage`-Persistenz (nicht in den Acceptance Criteria gefordert, bewusst nicht ergänzt)
- Jede Activity-Gruppe ist eine Karte (Activity-Name + `formatActivityDateTime`, darunter je Zeitbereich eine Zeile mit Label + Status-Icon aus `SIGNUP_STATUS_ICON`); die gesamte Karte ist ein `<Link href="/activities/[id]">`, Klick auf Gruppe oder eine ihrer Zeilen führt beide zur bestehenden Activity-Anmeldung-Seite
- Leerzustand je Bereich ("Du hast noch keine kommenden/vergangenen Einteilungen.")

**Verifiziert (eigenes, danach vollständig entferntes Playwright-Skript gegen den Production-Build, isolierte Testdaten — 1 Verein, 1 Test-Mitglied, 1 kommende + 1 vergangene Activity, 5 Zeitbereiche inkl. Stub und einem nicht zugesagten):** 13/13 Checks bestanden — Profil-Button navigiert korrekt zur neuen Seite, Standardansicht zeigt nur die kommende Activity, Toggle wechselt korrekt zu "Vergangen" und zurück, beide zugesagten Zeitbereiche der kommenden Activity erscheinen mit korrektem Status-Icon (19-20 "zu wenig", 20-21 "genau richtig"), Stub-Zeitbereich und ein nicht zugesagter Zeitbereich derselben Activity erscheinen zu Recht nicht, Klick auf eine Gruppe navigiert zur richtigen Activity-Seite, Cleanup vollständig. `npm run build` und `npm test` (95/95) bleiben sauber.

**Kein Backend nötig:** Wie im Tech Design festgehalten, erlauben die bestehenden RLS-Policies bereits jedem Vereinsmitglied Lesezugriff auf die benötigten Daten — kein `/backend`-Durchlauf für dieses Feature erforderlich.

## QA Test Results

**Tested:** 2026-07-17
**App URL:** http://localhost:3000 (Production-Build via `npm run build && npm run start`, gegen die echte Supabase-Instanz `cspljbavgdnsqlqkdxvc`)
**Tester:** QA Engineer (AI)

**Testdaten:** Zwei isolierte Test-Vereine (Verein A: 1 Test-Mitglied, 1 Test-Admin, 1 Rolle, 1 kommende + 1 vergangene Activity mit insgesamt 5 Zeitbereichen inkl. Stub und einem nicht zugesagten; Verein B: 1 Test-Mitglied für den Cross-Tenant-Check) sowie ein separates Set für den Cross-Browser/Responsive-Durchlauf (1 Verein mit bewusst langem Namen, 1 Mitglied mit langem Namen, 1 Activity mit langem Namen) — über zwei eigene, scriptgesteuerte Playwright-Läufe mit echten Logins gegen die echte Instanz erzeugt und danach vollständig entfernt (verifiziert: 0 verbleibende Zeilen in `vereine`/`users`).

### Acceptance Criteria Status

- [x] Unauthentifizierter Zugriff auf `/meine-einteilungen` leitet zu "/" um
- [x] Profil-Seite zeigt den Button "Meine Einteilungen" (der zuvor bereits vorhandene, funktionslose Button ist jetzt korrekt verdrahtet)
- [x] Klick auf den Button navigiert zur neuen Seite
- [x] Standardansicht ist "Kommend"
- [x] Toggle wechselt zu "Vergangen" und zurück zu "Kommend"
- [x] Kommende zugesagte Zeitbereiche erscheinen unter der zugehörigen Activity (Name + Datum/Zeit als Überschrift), inkl. Zeitbereich-Label und Status-Icon
- [x] Eine vergangene Activity erscheint ausschließlich im Bereich "Vergangen"
- [x] Mehrere Zusagen zur selben Activity werden unter einer gemeinsamen Überschrift gruppiert (beide Zeitbereiche 10-11/11-12 der Test-Activity erschienen korrekt zusammen)
- [x] Status-Icons korrekt: "zu viel" bei kommen > benötigt (2 von 1), "zu wenig" bei kommen < benötigt (1 von 3) — beide live mit echten Werten verifiziert
- [x] Klick auf eine Activity-Gruppe/Zeile navigiert zu `/activities/[id]`
- [x] Leerzustand "Kommend" erscheint korrekt bei einem Mitglied ohne Zusagen
- [x] Leerzustand "Vergangen" erscheint korrekt bei einem Mitglied ohne vergangene Zusagen
- [x] Stub-Zeitbereich (benötigt=0, keine Rolle) erscheint nicht, obwohl das Mitglied technisch eingetragen ist
- [x] Admin sieht auf dieser Seite ausschließlich die eigenen Zusagen (verifiziert: Test-Admin sah den gemeinsam mit dem Mitglied zugesagten Zeitbereich, nicht aber den, für den nur das Mitglied allein zugesagt hatte — keine Admin-Sonderansicht)
- [x] Nutzer von Verein A sieht ausschließlich Zusagen zu Activities des eigenen Vereins (Cross-Tenant-Check unten)

**14/14 Akzeptanzkriterien bestanden.**

### Edge Cases Status
- [x] Mitglied ohne jegliche Zusagen → beide Bereiche zeigen den passenden Leerzustand
- [x] Zeitbereich, für den das Mitglied nicht zugesagt hat, erscheint nicht (unabhängig davon, dass ein anderes Mitglied für denselben Zeitbereich zugesagt hat)
- [x] Zwei Zeitbereiche derselben Activity mit unterschiedlichem Status → beide Icons unabhängig korrekt (zu viel / zu wenig gleichzeitig sichtbar in derselben Gruppe)
- [~] Admin entfernt Mitglied nachträglich aus einem Zeitbereich (PROJ-11) → laut Spec kein automatisches Update ohne Neuladen; nicht separat simuliert, da rein clientseitiges Neuladen-bei-Navigation-Verhalten, kein neuer Code-Pfad
- [~] Zeitbereich wird nachträglich zum Stub degradiert → identischer Filter-Code-Pfad wie der bereits getestete "Stub trotz Zusage"-Fall, nicht separat wiederholt
- [x] id/adalo_id-Fallback: alle Testdaten nutzten echte Supabase-`id`-Werte (neu angelegte Testdaten haben keine `adalo_id`-Referenzen in `eingeteilte_users`); der Fallback-Mechanismus selbst ist identisch zum bereits in PROJ-10/11 verifizierten `resolveMemberName`/`isMemberInRefs`-Code und wird hier unverändert wiederverwendet (`findActivity` folgt demselben Muster) — nicht erneut isoliert manuell nachgetestet, da kein neuer Algorithmus

### Security Audit Results
- [x] **Cross-Tenant-Isolation:** Mitglied aus Verein B sieht auf `/meine-einteilungen` ausschließlich den Leerzustand, keine Daten von Verein A
- [x] **RLS hält auch bei manipuliertem Filter stand:** Direkter Datenbank-Request als Verein-B-Mitglied mit einem Filter auf die `id` eines Verein-A-Mitglieds (`eingeteilte_users.cs.{fremde_id}`) liefert 0 Zeilen — die Cross-Tenant-Grenze sitzt in der RLS-Policy selbst (Join gegen `activities.vereine`), nicht im clientseitigen Query, und ist damit robust gegen einen manipulierten oder vergessenen Filter im Frontend-Code
- [x] **XSS/Injection:** `<img src=x onerror="window.__xss=1">` als Activity-Name gespeichert und live gerendert — von React als reiner Text escaped, `window.__xss` blieb `undefined`
- [x] **Autorisierung (Admin vs. Mitglied):** Kein Admin-spezifischer Datenzugriff oder UI-Unterschied vorhanden; Admin sieht nachweislich exakt dieselbe, auf die eigene Person beschränkte Sicht wie ein normales Mitglied
- [x] Unauthentifizierter Zugriff redirected zu "/" (kein Datenzugriff ohne Session möglich)
- [~] Rate-Limiting: nicht gesondert getestet (verlässt sich wie PROJ-3–13/15 bewusst auf Supabase-Standardlimits)

### Cross-Browser & Responsive
- [x] Chromium: alle Funktionstests bestanden; 375px/768px/1440px kein horizontales Overflow (mit bewusst langem Vereins-, Mitglieds- und Activity-Namen getestet)
- [x] WebKit (Desktop-Engine, gleiche Breakpoints): 375px/768px/1440px ebenfalls kein horizontales Overflow; lange Activity-Namen truncaten sauber mit Ellipsis statt umzubrechen oder zu überlaufen

### Regression Testing
- `npm test` (Vitest): 95/95 weiterhin grün — keine neuen Unit-Tests hinzugefügt, da die einzige neue Logik (`findActivity`, page-lokal) strukturell identisch zu den bereits getesteten `findMember`/`findRole`-Funktionen ist und vollständig durch die obigen E2E-Checks abgedeckt wird
- `npm run build`: sauber, neue Route `/meine-einteilungen` kompiliert fehlerfrei
- `npx playwright test --project=chromium`: 22/22 bestehende Tests weiterhin grün (keine Regression durch die Profil-Seiten-Änderung oder die neue Route)
- Neuer E2E-Test `tests/PROJ-16-meine-einteilungen.spec.ts` (1 unauthentifizierter Redirect-Check) hinzugefügt und grün; alle übrigen Kriterien per zwei scriptgesteuerten Playwright-Läufen mit isolierten Testdaten manuell verifiziert (siehe oben), aus denselben Gründen wie PROJ-3–13/15 nicht dauerhaft automatisiert (keine seedbare Test-Fixture-Strategie bisher, siehe PROJ-1)

### Bugs Found
Keine. Ein anfänglicher Testfehlschlag ("Profil-Seite zeigt den Button") stellte sich bei der Root-Cause-Analyse als Timing-Artefakt des eigenen QA-Skripts heraus (Prüfung erfolgte, bevor die Profil-Seite ihren asynchronen Ladevorgang abgeschlossen hatte) — mit einer kurzen Wartezeit und per Screenshot bestätigt: der Button ist korrekt vorhanden und funktioniert.

### Summary
- **Acceptance Criteria:** 14/14 bestanden
- **Bugs Found:** 0
- **Security:** Pass — Cross-Tenant-Isolation (inkl. direktem RLS-Bypass-Versuch), XSS-Schutz, korrekte Admin/Mitglied-Gleichbehandlung alle verifiziert
- **Regressions:** Keine — bestehende Suite (22 E2E + 95 Unit) weiterhin grün, `npm run build` sauber
- **Production Ready:** **YES** — kein offener Bug jeglicher Severity.
- **Recommendation:** Deploy möglich.

## Deployment

**Deployed:** 2026-07-17
**Production URL:** https://simpliplan.toolies.eu/meine-einteilungen (erreichbar über den Button auf https://simpliplan.toolies.eu/profil)
**Mechanism:** GitHub Actions (`.github/workflows/deploy.yml`) — SSH nach Hetzner bei Push auf `main`, `npm ci` + `npm run build` + PM2-Reload (Prozess "SimpliPlan"). Kein Vercel.

- Pre-Deployment-Checks: `npm run build` sauber, `npm test` 95/95, QA Approved (14/14 AC, 0 Bugs), keine DB-Migration nötig (rein clientseitige Funktion, bestätigt in `/architecture`), keine Secrets im Diff. `npm run lint` weiterhin am vorbestehenden, projektunabhängigen Problem (fehlende `eslint.config.js`) gescheitert — kein neuer Blocker.
- Drei Commits gepusht nach `main`: `feat(PROJ-16): Write feature specification...` (`679b95d`), `feat(PROJ-16): Implement frontend...` (`fe08e92`), `test(PROJ-16): Add QA test results...` (`981944d`)
- Deploy ausgelöst durch `git push origin main`, GitHub-Actions-Workflow "Deploy to Hetzner"
- Tag `v1.14.0-PROJ-16` erstellt und gepusht
- Post-Deployment-Verifikation: Server-Checkout auf `981944d` per SSH bestätigt, PM2 frisch neu geladen (Uptime 11s, Restart-Counter erhöht); `https://simpliplan.toolies.eu/profil` und `/meine-einteilungen` liefern beide HTTP 200
- Production-Ready-Essentials (Error Tracking/Security Headers/Performance/Rate Limiting) weiterhin nicht projektweit eingerichtet — nicht Teil von PROJ-16, betrifft die gesamte App gleichermaßen wie schon bei PROJ-3–13/15
