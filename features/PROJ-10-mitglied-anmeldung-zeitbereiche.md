# PROJ-10: Mitglied-Anmeldung zu Zeitbereichen

## Status: In Progress
**Created:** 2026-07-15
**Last Updated:** 2026-07-15 (Backend fertig: mitglieder_namen-View + Selbst-Anmeldung end-to-end verifiziert)

## Dependencies
- PROJ-1 (Supabase Infrastruktur Multi-Tenant + RLS) — für RLS-Policies, die Zugriff auf den eigenen Verein beschränken
- PROJ-3 (Authentifizierung) — für eingeloggten Nutzer-Zugriff (Mitglied und Admin) und die Verein-Zuordnung
- PROJ-6 (Rollen-Verwaltung) — liefert das `gleich_angemeldet`-Flag ("Automatisch angemeldet"), dessen Wirkung dort bewusst offengelassen wurde und jetzt in PROJ-10 konkret umgesetzt wird
- PROJ-8 (Activities CRUD) — PROJ-10 erweitert die bestehende Activity-Liste (`/activities`, `/activities/archiv`) und Detailseite (`/activities/[id]`) für Mitglieder-Zugriff
- PROJ-9 (Zeitbereiche CRUD) — liefert die `einstellungen`-Tabelle (Zeitbereich-Entität) inkl. `eingeteilte_users`-Spalte, die PROJ-10 erstmals aktiv beschreibt statt nur zu lesen

## User Stories
- Als Mitglied möchte ich die Liste kommender Activities meines Vereins sehen (wie ein Admin), damit ich weiß, wo und wann Helfer gebraucht werden.
- Als Mitglied möchte ich auf eine Activity klicken und zur Anmeldung-Seite gelangen, damit ich sehe, wo ich mich eintragen kann.
- Als Mitglied möchte ich mich per Checkbox für einen Zeitbereich an- und wieder abmelden, ohne Formular oder Dialog, damit die Zusage so einfach wie möglich ist.
- Als Mitglied möchte ich sehen, wer sich sonst noch für einen Zeitbereich angemeldet hat (Namen), damit ich weiß, mit wem ich zusammen eingeteilt bin.
- Als Mitglied möchte ich in einer Übersicht auf einen Blick sehen, wo noch Helfer fehlen ("zu wenig"), wo genug sind ("genau richtig") oder zu viele zugesagt haben ("zu viel"), damit ich gezielt dort zusage, wo Bedarf besteht.
- Als Mitglied mit einer Rolle, die "automatisch angemeldet" ist (z.B. "Mitglieder"), möchte ich beim Anlegen eines solchen Zeitbereichs automatisch als zugesagt geführt werden, mich aber trotzdem jederzeit abmelden können, falls ich nicht kann.
- Als Mitglied möchte ich auch dann noch sehen und mich anmelden können, wenn ein Zeitbereich bereits voll ist (kommen ≥ benötigt), damit ich flexibel bleibe, falls der Admin den Bedarf zu niedrig angesetzt hat — die Status-Icons zeigen mir die Situation nur als Hinweis an.
- Als Admin möchte ich weiterhin auf "Bearbeiten" und die Zeitbereiche-Verwaltung (PROJ-9) zugreifen können, obwohl die Detailseite jetzt primär die Anmeldung zeigt, damit meine bisherige Verwaltungsfunktion erhalten bleibt.

## Out of Scope
- Teilnehmer-Übersicht mit Admin-Werkzeugen (z.B. Mitglieder manuell ein-/austragen, Export) — PROJ-11
- Kalender-Export (ICS) — PROJ-14
- Rückwirkender Bulk-Insert für bereits bestehende Zeitbereiche mit "automatisch angemeldet"-Rolle, deren `eingeteilte_users` schon Einträge hat oder vor PROJ-10 angelegt wurde — nur ein Speichervorgang (Anlegen oder Bearbeiten) in PROJ-9 mit aktuell leerem `eingeteilte_users` löst den Bulk-Insert aus (analog zur PROJ-9-Entscheidung, dass die 17-Slot-Generierung nicht rückwirkend für Alt-Activities gilt)
- Rückwirkende Ergänzung neu registrierter Mitglieder in bereits befüllte Auto-Zeitbereiche — nur der Mitgliederstand zum Zeitpunkt des Bulk-Inserts wird eingetragen
- Admin trägt fremde Mitglieder direkt ein oder aus — PROJ-10 ist reine Selbstanmeldung; Fremdverwaltung ist PROJ-11
- Anmeldung/Übersicht für vergangene (archivierte) Activities — Archiv bleibt rein lesend, keine Checkbox, kein Übersicht-Button
- Änderungen an der Zeitbereiche-Verwaltung selbst (PROJ-9-UI bleibt unverändert, nur der neue Auto-Enrollment-Trigger beim Speichern kommt hinzu)
- Anzeige von Stub-Zeitbereichen (benötigt=0, keine Rolle) auf Anmeldung- oder Übersicht-Seite — werden herausgefiltert
- Eingeschränkte Namensanzeige (z.B. nur Vorname oder Initialen) — volle Namen (Nachname Vorname), analog zur bestehenden Mitgliederverwaltung (PROJ-7)
- Serverseitige Überschneidungsprüfung, wenn ein Mitglied sich für mehrere Rollen im selben Zeitraum anmeldet — bewusst erlaubt, keine Validierung

## Acceptance Criteria

**Format:** Angenommen [Vorbedingung] / Wenn [Aktion] / Dann [Ergebnis]

- [ ] Angenommen ein Mitglied (kein Admin) ist eingeloggt, wenn es `/activities` aufruft, dann sieht es dieselbe Liste kommender Activities des eigenen Vereins wie ein Admin (Bild, Name, Datum, Ort), aber ohne Löschen-/Bearbeiten-Icons und ohne "Neue Activity"-FAB
- [ ] Angenommen ein Mitglied ruft `/activities/archiv` auf, dann sieht es die vergangenen Activities rein lesend, ohne Anmelde- oder Verwaltungsmöglichkeit
- [ ] Angenommen ein Nutzer (Mitglied oder Admin) klickt in der Liste auf eine Activity-Zeile (nicht auf ein Icon), dann gelangt er zur Anmeldung-Seite `/activities/[id]`
- [ ] Angenommen ein Nutzer klickt in der Liste auf das Listen-Icon oder auf der Anmeldung-Seite auf den Button "Übersicht", dann gelangt er zur neuen Übersicht-Seite `/activities/[id]/uebersicht`
- [ ] Angenommen ein Nutzer öffnet die Anmeldung-Seite einer Activity, dann sieht er alle Zeitbereiche dieser Activity mit benötigt > 0 (in Anlage-Reihenfolge, wie PROJ-9), jeweils mit Rollenname, Zähler "kommen/benötigt", einer Checkbox für die eigene Zu-/Absage sowie den vollständigen Namen (Nachname Vorname) aller bereits zugesagten Mitglieder
- [ ] Angenommen ein Zeitbereich hat benötigt=0 oder keine zugewiesene Rolle, dann wird er weder auf der Anmeldung- noch auf der Übersicht-Seite angezeigt
- [ ] Angenommen ein Mitglied klickt die Checkbox eines Zeitbereichs an, für den es noch nicht zugesagt hat und der noch nicht voll ist (kommen < benötigt), dann wird es zu `eingeteilte_users` hinzugefügt, erscheint sofort in der Namensliste, und der "kommen"-Zähler erhöht sich um 1
- [ ] Angenommen ein Mitglied hat bereits zugesagt und deaktiviert die eigene Checkbox, dann wird es aus `eingeteilte_users` entfernt und verschwindet aus der Namensliste — unabhängig vom aktuellen Auslastungsstatus (Abmelden ist nie blockiert)
- [ ] Angenommen ein Zeitbereich hat bereits kommen ≥ benötigt erreicht ("genau richtig" oder "zu viel"), wenn ein noch nicht zugesagtes Mitglied die Checkbox aktiviert, dann wird die Anmeldung trotzdem gespeichert (kein Blocker) — der Status-Icon-Wechsel auf der Übersicht ist der einzige Hinweis auf die Überbuchung
- [ ] Angenommen ein Zeitbereich hat kommen < benötigt, dann zeigt die Übersicht das Dreieck-Warnsymbol ("zu wenig")
- [ ] Angenommen ein Zeitbereich hat kommen = benötigt, dann zeigt die Übersicht das einfache Häkchen-Symbol ("genau richtig")
- [ ] Angenommen ein Zeitbereich hat kommen > benötigt, dann zeigt die Übersicht das doppelte Häkchen-Symbol ("zu viel")
- [ ] Angenommen die Übersicht-Seite wird geöffnet, dann zeigt sie pro Zeitbereich Zeitbereich-Label, kommen, benötigt (insg.), offen (benötigt − kommen), das passende Status-Icon sowie darunter die vollständigen Namen (Nachname Vorname) aller zugesagten Mitglieder in zwei Spalten, analog zur alten Adalo-Referenzansicht
- [ ] Angenommen ein Admin speichert (PROJ-9) einen Zeitbereich mit einer Rolle, deren `gleich_angemeldet`-Flag aktiv ist, und der Zeitbereich hat aktuell keine eingeteilten Mitglieder, dann werden automatisch alle aktuell aktiven Mitglieder (`aktiv = true`) des Vereins in `eingeteilte_users` eingetragen
- [ ] Angenommen ein Zeitbereich mit "automatisch angemeldet"-Rolle wurde bereits einmal automatisch befüllt, wenn er danach erneut gespeichert wird, dann löst dies keinen erneuten Bulk-Insert aus (bereits abgemeldete Mitglieder bleiben abgemeldet)
- [ ] Angenommen ein Mitglied ist bei einem Zeitbereich mit "automatisch angemeldet"-Rolle automatisch eingetragen, dann kann es sich trotzdem jederzeit über die normale Checkbox wieder abmelden
- [ ] Angenommen ein Nutzer ruft `/activities/[id]` oder `/activities/[id]/uebersicht` mit einer Activity-ID eines anderen Vereins auf, dann sieht er keine Daten (RLS liefert keine Zeile), die Seite zeigt "Nicht gefunden"
- [ ] Angenommen ein Admin öffnet die Anmeldung-Seite, dann sieht er zusätzlich weiterhin den "Bearbeiten"-Button sowie den Zugang zur Zeitbereiche-Verwaltung (PROJ-9); für Mitglieder sind beide nicht sichtbar
- [ ] Angenommen die Supabase-API ist beim Ändern einer Zu-/Absage nicht erreichbar, dann wird eine Fehlermeldung angezeigt und der Checkbox-Status bleibt unverändert
- [ ] Angenommen ein unauthentifizierter Nutzer ruft `/activities`, `/activities/[id]` oder `/activities/[id]/uebersicht` auf, dann wird er zu "/" umgeleitet
- [ ] Angenommen ein Nutzer von Verein A ist eingeloggt, dann sieht und bearbeitet er ausschließlich Anmeldungen von Activities des eigenen Vereins

## Edge Cases
- Zwei Mitglieder klicken nahezu gleichzeitig die Checkbox für den letzten freien Platz eines Zeitbereichs → kein Locking im MVP, Last-Write-Wins; theoretisch kann "kommen" dadurch knapp über "benötigt" landen (kein serverseitiger Constraint) — akzeptiertes Risiko, analog zu PROJ-8/9
- Admin reduziert nachträglich "benötigt" unter die bereits zugesagte Anzahl (PROJ-9) → Zeitbereich zeigt "zu viel", bereits zugesagte Mitglieder bleiben eingetragen, weitere Anmeldungen sind weiterhin möglich (kein Blocker)
- Ein Mitglied mit einer Rolle mit `gleich_angemeldet=true` wird zwischenzeitlich deaktiviert/gelöscht (PROJ-7) → bereits erfolgte Einträge in `eingeteilte_users` bleiben unverändert bestehen (keine automatische Bereinigung)
- Ein Mitglied meldet sich im selben Zeitraum für mehrere Rollen an (z.B. "Begleitung" UND "Mitglieder" um 19-00) → beide Anmeldungen sind unabhängig voneinander erlaubt, keine Überschneidungsprüfung (jeder Zeitbereich ist eine eigenständige Zeile, analog zur PROJ-9-Entscheidung "mehrere Rollen = mehrere Zeilen")
- Ein Zeitbereich mit "automatisch angemeldet"-Rolle wird angelegt, während der Verein aktuell keine aktiven Mitglieder hat → Bulk-Insert trägt 0 Mitglieder ein, kein Fehler
- Direkter URL-Aufruf von `/activities/[id]/uebersicht` mit einer nicht existierenden oder fremden Activity-ID → "Nicht gefunden" (analog zu allen bisherigen Detailseiten)
- Ein Mitglied ruft die Anmeldung-Seite einer Activity ohne einen einzigen Zeitbereich mit benötigt > 0 auf → Leerzustand mit Hinweistext statt leerer Liste

## Technical Requirements (optional)
- Neue Route `/activities/[id]/uebersicht` (Client Component, direkter Browser→Supabase-Call, kein eigener API-Endpunkt — konsistent mit PROJ-3–9)
- `/activities/[id]/page.tsx` wird um die Zeitbereich-Checkbox-Zeilen (inkl. Namensliste) und den "Übersicht"-Button erweitert, statt eine neue Route anzulegen
- `/activities/page.tsx` und `/activities/archiv/page.tsx`: Zugriffsschutz gelockert auf jeden eingeloggten Nutzer des eigenen Vereins (statt nur Admin); admin-spezifische UI-Elemente (Löschen-/Bearbeiten-Icons, FAB "Neue Activity") bleiben bedingt auf `isAdmin` gerendert
- Namensdarstellung: `${nachname} ${vorname}`, analog zur bestehenden Mitgliederverwaltung (PROJ-7)
- Neue/angepasste RLS-Policy auf `einstellungen`: eingeloggte Mitglieder des eigenen Vereins dürfen `eingeteilte_users` selbst ändern (nur die eigene Nutzer-ID hinzufügen/entfernen, keine anderen Felder) — exakte Umsetzung (App-seitige Beschränkung vs. RLS-Constraint) wird in `/architecture` festgelegt
- Bulk-Insert-Trigger für "automatisch angemeldet": ausgelöst beim Speichern eines Zeitbereichs (PROJ-9 Insert/Update) mit `rollen.gleich_angemeldet = true` und aktuell leerem `eingeteilte_users`; befüllt mit den `id`-Werten aller Mitglieder mit `aktiv = true` des zugehörigen Vereins
- Security: Zugriff auf Lese-Ebene für jeden eingeloggten Nutzer des eigenen Vereins; Schreibzugriff auf `eingeteilte_users` beschränkt auf die eigene Nutzer-ID (Selbstanmeldung)

## Open Questions
- [x] Exakte RLS-/App-Umsetzung für "Mitglied darf in `eingeteilte_users` nur die eigene ID hinzufügen/entfernen, sonst nichts" → in `/architecture` entschieden: neuer Server-Endpunkt statt RLS (siehe Tech Design)
- [ ] Soll das bestehende `List`-Icon (lucide) in der Activity-Liste unverändert für den Link zur Übersicht weiterverwendet werden? → funktional unverändert, konkrete Icon-Wahl in `/frontend`

## Decision Log

### Product Decisions
| Decision | Rationale | Date |
|----------|-----------|------|
| Übersicht-Seite ist für alle eingeloggten Mitglieder sichtbar, nicht nur Admins | Nutzerentscheidung im Interview; hilft allen, gezielt dort zuzusagen, wo noch Helfer fehlen — Admin-spezifische Werkzeuge (Fremdverwaltung) kommen erst mit PROJ-11 | 2026-07-15 |
| An-/Abmeldung läuft über eine Checkbox pro Zeitbereich-Zeile (nicht Klick auf die ganze Zeile) | Nutzerentscheidung im Interview; eindeutiger als Zeilen-Klick | 2026-07-15 |
| `rollen.gleich_angemeldet` bedeutet: beim Anlegen/Bearbeiten eines Zeitbereichs mit dieser Rolle werden alle aktuell aktiven Vereinsmitglieder automatisch in `eingeteilte_users` eingetragen (einmaliger Bulk-Insert, kein dauerhafter Automatismus); Mitglieder können sich danach normal per Checkbox wieder abmelden | Nutzerentscheidung im Interview, erklärt die Referenz-Zahlen im Screenshot (18 von 32 "Mitglieder"-Zusagen = ursprünglich alle eingetragen, 14 haben sich abgemeldet); einfachste Umsetzung mit dem bestehenden Datenmodell (nur ein Array-Feld, kein separates "Anwesenheitsstatus"-Feld) | 2026-07-15 |
| Kein rückwirkender Bulk-Insert für bereits bestehende Zeitbereiche oder später beigetretene Mitglieder | Nutzerentscheidung im Interview (implizit durch die einmalige Bulk-Insert-Regel); rückwirkende Änderungen an Produktivdaten sind nicht angefordert, analog zur PROJ-9-Entscheidung bei der 17-Slot-Generierung | 2026-07-15 |
| Stub-Zeitbereiche (benötigt=0, keine Rolle) werden auf Anmeldung- und Übersicht-Seite ausgeblendet | Nutzerentscheidung im Interview; vermeidet Rauschen durch bis zu 17 leere Zeilen pro Activity | 2026-07-15 |
| Status-Icons: kommen > benötigt = "zu viel" (2 Häkchen), kommen = benötigt = "genau richtig" (1 Häkchen), kommen < benötigt = "zu wenig" (Dreieck mit Rufzeichen) | Nutzerentscheidung im Interview, Icon-Dateien bereits in `public/` vorhanden (`zu viel.jpg`, `genau richtig.jpg`, `zu wenig.jpg`) | 2026-07-15 |
| Neuanmeldung wird nicht blockiert, auch wenn kommen ≥ benötigt (keine harte Kapazitätsgrenze); Abmelden ist ohnehin nie blockiert | Nutzerentscheidung im Interview (Korrektur einer ersten Fehlentscheidung); folgt dem etablierten "nur Warnung, kein Blocker"-Muster aus PROJ-8/9 statt davon abzuweichen | 2026-07-15 |
| Anmeldung-Seite zeigt volle Namen (Nachname Vorname) aller bereits zugesagten Mitglieder pro Zeitbereich | Nutzerentscheidung im Interview; entspricht der alten Adalo-Referenz, volle Transparenz, wer mit wem eingeteilt ist | 2026-07-15 |
| **Korrektur nach erster Nutzung der gebauten Übersicht-Seite:** Übersicht zeigt nun doch zusätzlich die vollständigen Namen aller Zugesagten pro Zeitbereich, in zwei Spalten unter der Zahlen-Zeile — ursprüngliche Entscheidung ("nur Zahlen, keine Namen") revidiert | User-Feedback beim ersten Live-Test: die reine Zahlen-Ansicht ohne Namen war nicht das gewünschte Verhalten; Referenzbild (alte Adalo-Ansicht der Activity "Hofübergabe") zeigt das gewünschte zweispaltige Namensraster pro Zeitbereich, direkt unter der bereits gebauten Zahlen-/Icon-Zeile | 2026-07-15 |
| `/activities` und `/activities/archiv` werden für alle eingeloggten Nutzer des Vereins geöffnet (nicht mehr admin-only); admin-spezifische Aktionen (Löschen, Bearbeiten, Neu anlegen) bleiben conditional auf `isAdmin` | Nutzerentscheidung im Interview; kleinstmögliche Erweiterung der bestehenden PROJ-8-Seiten statt einer separaten Mitglieder-Liste | 2026-07-15 |
| Bestehende Detailseite `/activities/[id]` wird zur Anmeldung-Seite erweitert, statt eine neue parallele Route anzulegen | Nutzerentscheidung im Interview; die Seite zeigt inhaltlich bereits Foto/Name/Datum/Ort wie im Referenz-Screenshot, "Bearbeiten" bleibt als admin-only Button erhalten | 2026-07-15 |
| Listen-Icon in der Activity-Liste sowie "Übersicht"-Button auf der Anmeldung-Seite führen beide zur neuen Übersicht-Seite `/activities/[id]/uebersicht` | Nutzerentscheidung im Interview, entspricht den beiden roten Pfeilen im Referenz-Screenshot | 2026-07-15 |

### Technical Decisions
<!-- Added by /architecture -->
| Decision | Rationale | Date |
|----------|-----------|------|
| Selbst-An-/Abmeldung läuft über einen neuen Server-Endpunkt (App-Code prüft Berechtigung + schreibt), nicht über direkten Browser→Datenbank-Zugriff mit RLS | RLS kann bei einem gemeinsam genutzten Array-Feld (`eingeteilte_users`) nicht zuverlässig erzwingen, dass ein Nutzer nur seine eigene ID ändert, ohne eine Datenbank-Automatisierung (Trigger) einzuführen — die das Projekt bewusst vermeidet (siehe PROJ-9). Gleiches Muster wie der bereits bestehende `/api/mitglieder/[id]`-Endpunkt | 2026-07-15 |
| Automatische Erst-Befüllung bei "Automatisch angemeldet"-Rollen bleibt ein direkter Admin-Schreibzugriff über die bestehende PROJ-9-Zeitbereiche-Seite, kein eigener Endpunkt | Admins haben auf `einstellungen` bereits volle Schreibrechte (PROJ-9); die automatische Befüllung ist nur eine Erweiterung dieser bereits erlaubten Aktion | 2026-07-15 |
| Lesen der Zusagenliste (Anmeldung- und Übersicht-Seite) bleibt direkter Browser→Datenbank-Zugriff, nur das Schreiben der eigenen Zusage läuft über den neuen Endpunkt | Nur das Schreiben hat das Abgrenzungsproblem "eigene vs. fremde ID"; Lesen ist unverändert unkritisch und folgt dem bestehenden PROJ-3–9-Muster | 2026-07-15 |
| Bestehende Detailseite `/activities/[id]` wird direkt erweitert statt eine neue Route zu duplizieren; Übersicht bekommt eine eigene neue Route `/activities/[id]/uebersicht` | Vermeidet zwei fast identische Seiten für dieselben Activity-Infos; die Übersicht ist inhaltlich eigenständig genug (aggregierte Tabellen-Ansicht mit Icon-Status) für eine eigene Route | 2026-07-15 |
| Status-Icons nutzen die drei bereits vorhandenen Bilddateien (`zu viel.jpg`, `genau richtig.jpg`, `zu wenig.jpg` in `public/`) direkt, keine neuen Icon-Komponenten | Bereits vom Nutzer bereitgestellt, entspricht exakt dem Referenz-Screenshot | 2026-07-15 |

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)

### A) Component Structure

```
Activities-Liste "/activities" (bestehend, GEÄNDERT)
├── Zugriffsprüfung gelockert: jeder eingeloggte Nutzer mit Vereins-Zuordnung darf
│   öffnen (vorher: nur Admin) — unauthentifiziert weiterhin Redirect zu "/"
├── Admin-spezifische Elemente (Löschen-/Bearbeiten-Icons, FAB "Neue Activity")
│   bleiben unverändert nur für Admins sichtbar
└── Listen-Icon je Activity-Zeile zeigt jetzt für ALLE Nutzer zur neuen
    Übersicht-Seite (vorher: zur Detailseite, nur für Admins sichtbar)

Activities-Archiv "/activities/archiv" (bestehend, GEÄNDERT)
└── Zugriffsprüfung identisch gelockert; bleibt rein lesend, keine Anmelde-Elemente

Activity-Detailseite "/activities/[id]" (bestehend, ERWEITERT zur Anmeldung-Seite)
├── Zugriffsprüfung gelockert wie oben
├── Bestehende Anzeige (Foto, Name, Datum, Ort, Beschreibung) bleibt unverändert
├── "Bearbeiten"-Button und der Zugang zur Zeitbereiche-Verwaltung (PROJ-9)
│   bleiben ausschließlich für Admins sichtbar
├── NEU: Button "Übersicht" (für alle sichtbar) → /activities/[id]/uebersicht
└── NEU: Liste der Zeitbereiche mit benötigt > 0, in Anlage-Reihenfolge (wie PROJ-9)
    ├── Stub-Zeitbereiche (benötigt=0 oder ohne Rolle) werden herausgefiltert
    └── Je Zeitbereich-Zeile:
        ├── Rollenname, Zähler "kommen von benötigt"
        ├── Checkbox "Ich bin dabei" (eigener Anmeldestatus, nie für andere änderbar)
        └── Namensliste (Nachname Vorname) aller bereits zugesagten Mitglieder

Übersicht-Seite "/activities/[id]/uebersicht" (NEU)
├── Zugriffsprüfung: identisch zur Anmeldung-Seite (jeder eingeloggte Nutzer
│   des eigenen Vereins); fremde/ungültige Activity-ID → "Nicht gefunden"
├── Header: Activity-Name + Zurück-Pfeil (analog zu bestehenden Detailseiten)
└── Tabelle je Zeitbereich (nur benötigt > 0, Anlage-Reihenfolge):
    Zeitbereich-Label | kommen | insg. (benötigt) | offen (benötigt − kommen) |
    Status-Icon (zu wenig / genau richtig / zu viel); darunter zweispaltiges
    Namensraster (Nachname Vorname) aller Zugesagten, analog zur alten
    Adalo-Referenzansicht (Korrektur nach erstem Live-Test, siehe Decision Log)

Zeitbereiche-Verwaltung "/activities/[id]/zeitbereiche" (PROJ-9, GEÄNDERT)
└── Beim Speichern (Anlegen über "+" oder Bearbeiten) eines Zeitbereichs mit einer
    Rolle, deren "Automatisch angemeldet"-Flag aktiv ist, UND aktuell leerer
    Zusagenliste: alle aktuell aktiven Mitglieder des Vereins werden einmalig
    automatisch eingetragen (admin-seitige Aktion, nutzt die bereits bestehende
    Admin-Schreibberechtigung auf Zeitbereiche — keine neue Berechtigung nötig)

Neuer Server-Endpunkt "Zeitbereich-Anmeldung" (NEU, kein UI)
└── Nimmt die Selbst-An-/Abmeldung eines Mitglieds für einen Zeitbereich entgegen.
    Prüft: Ist der Anfragende wirklich eingeloggt? Gehört der Zeitbereich zum
    eigenen Verein? Ist der Zeitbereich anmeldefähig (Rolle vorhanden, benötigt > 0)?
    Trägt danach ausschließlich die eigene Mitglieds-ID ein oder aus der Zusagenliste
    ein bzw. aus — verändert nie die Einträge eines anderen Mitglieds. Sowohl die
    Anmeldung- als auch die Übersicht-Seite lesen die Zusagenliste weiterhin direkt
    aus der Datenbank (nur das Schreiben der eigenen Zusage läuft über den neuen
    Endpunkt).
```

### B) Data Model (fachlich, kein Code)

- Keine neue Tabelle, keine neue Spalte. Nutzt weiterhin die bestehende `einstellungen`-Tabelle (Zeitbereich-Entität, PROJ-9) sowie `users` (für Namen und Aktiv-Status) und `rollen` (für das "Automatisch angemeldet"-Flag, PROJ-6).
- `eingeteilte_users` (bestehend auf `einstellungen`, bisher nur von PROJ-9 gelesen) wird jetzt aktiv beschrieben:
  - Selbst-An-/Abmeldung eines Mitglieds → genau ein Eintrag (die eigene Nutzer-ID) wird hinzugefügt oder entfernt
  - Automatische Erst-Befüllung bei "Automatisch angemeldet"-Rollen → alle `id`-Werte der aktuell aktiven Mitglieder (`users.aktiv = true`) des Vereins auf einmal
- `users.vorname`/`users.nachname` werden für die Namensanzeige gelesen (Format "Nachname Vorname", analog zu PROJ-7), `users.aktiv` bestimmt, wer bei der automatischen Erst-Befüllung berücksichtigt wird
- `rollen.gleich_angemeldet` (bestehend, bisher ungenutzt) bestimmt, ob ein neu befüllter Zeitbereich die automatische Erst-Befüllung auslöst
- Kein neuer Status/kein neues Feld für "abgemeldet" — Abmelden bedeutet schlicht: die eigene ID wird aus `eingeteilte_users` entfernt, nicht anders markiert

### C) Tech-Entscheidungen (Begründung für PM)

- **Neuer Server-Endpunkt statt direktem Browser→Datenbank-Zugriff für die Selbst-Anmeldung**: Bei allen bisherigen Features (PROJ-3–9) genügte eine reine Datenbank-Regel (RLS), weil jede Zeile komplett einem Verein gehört. Hier ist die Situation anders: Innerhalb *derselben* Zeitbereich-Zeile darf ein Mitglied nur seine *eigene* Zusage ändern, nicht die eines Vereinskollegen — eine Datenbank-Regel kann diesen Unterschied bei einem gemeinsam genutzten Datenfeld nicht zuverlässig erzwingen, ohne eine Datenbank-Automatisierung (Trigger) einzuführen, die das Projekt bewusst vermeidet (siehe PROJ-9-Entscheidung). Die App übernimmt diese Prüfung stattdessen serverseitig — genau das gleiche Muster, das bereits für das Löschen von Mitgliedern (`/api/mitglieder/[id]`) verwendet wird.
- **Automatische Erst-Befüllung bleibt ein direkter Admin-Schreibzugriff**: Admins dürfen Zeitbereiche bereits vollständig bearbeiten (PROJ-9); die neue automatische Befüllung ist nur eine Erweiterung dieser bestehenden, bereits erlaubten Aktion — kein neuer Berechtigungs-Mechanismus nötig.
- **Bestehende Detailseite wird erweitert statt eine Route zu duplizieren**: Vermeidet zwei fast identische Seiten (Aktivitäts-Infos erscheinen nur einmal), kleinstmögliche Änderung am bestehenden Code.
- **Lesen bleibt weiterhin direkter Browser→Datenbank-Zugriff**: Nur das *Schreiben* der eigenen Zusage hat das oben beschriebene Abgrenzungsproblem; das reine Anzeigen der Zusagenliste und der Übersicht-Zahlen ist unverändert unkritisch und folgt dem bestehenden Muster aller bisherigen Seiten.
- **Status-Icons als bestehende Bilddateien**: Die drei bereits vom Nutzer bereitgestellten Bilder (`zu viel.jpg`, `genau richtig.jpg`, `zu wenig.jpg` in `public/`) werden direkt verwendet statt neuer selbstgebauter Icon-Komponenten.
- **Kein Locking, keine harte Kapazitätsgrenze**: Konsistent mit der Spec-Entscheidung (nur Warnung, kein Blocker) und dem bereits etablierten PROJ-8/9-Muster — vermeidet zusätzliche Komplexität für ein seltenes Wettlauf-Szenario.

### D) Dependencies

- Keine neuen Pakete: `@supabase/supabase-js`, `zod`, `shadcn/ui` (`checkbox`, bereits installiert) — alles bereits im Projekt vorhanden
- Der neue Server-Endpunkt nutzt dieselbe bereits vorhandene Infrastruktur wie `/api/mitglieder/[id]` (Zugriffsprüfung anhand der Anfrage + privilegierter Datenbankzugriff für die eigentliche Änderung)

## Frontend Implementation Notes

**Korrektur gegenüber Tech Design:** `/activities`, `/activities/archiv` und `/activities/[id]` hatten bereits vor PROJ-10 keinen Admin-Gate in ihrem Zugriffscheck (nur Session + Vereins-Zuordnung wurden geprüft; `isAdmin` wurde nur für bedingtes UI-Rendering verwendet). Der im Tech Design angenommene Schritt "Zugriffsprüfung lockern" war für diese drei Seiten daher bereits erledigt — abweichend von PROJ-8s eigener QA-Dokumentation (die einen Admin-Redirect für Mitglieder als bestanden vermerkt hatte). Es waren keine Code-Änderungen an den Zugriffsprüfungen selbst nötig, nur an den UI-Elementen (Icon-Ziel, Klick-Verhalten, neue Anmeldung-Sektion).

**Gebaut:**
- `src/lib/activities.ts` — `ZeitbereichRole.gleich_angemeldet`, `Member`-Typ, `resolveMemberName` (id/adalo_id-Fallback, analog zu `resolveRoleName`), `computeSignupStatus`, `SIGNUP_STATUS_ICON` (verlinkt auf die drei vorhandenen Bilddateien in `public/`, URL-encoded wegen Leerzeichen im Dateinamen)
- `src/app/api/einstellungen/[id]/anmeldung/route.ts` (NEU) — POST-Endpunkt für Selbst-An-/Abmeldung, analog zum `/api/mitglieder/[id]`-Muster: `scopedClientFromRequest` prüft Identität + liest den Zeitbereich RLS-scoped (nicht sichtbar = 403), berechnet serverseitig ausschließlich die eigene id/adalo_id-Differenz, schreibt per `supabaseAdmin` (Service-Role)
- `src/app/activities/page.tsx` (GEÄNDERT) — Listen-Icon zeigt jetzt für alle Nutzer zu `/activities/[id]/uebersicht` (vorher: zur Detailseite); Klick auf die Zeile (außerhalb der Icon-Spalte) navigiert zu `/activities/[id]`, Icon-Buttons stoppen die Propagation
- `src/app/activities/[id]/page.tsx` (GEÄNDERT) — erweitert um die Anmeldung-Sektion (Checkbox „Ich bin dabei", Namensliste, „Übersicht"-Button), sichtbar für alle Nutzer, aber nur wenn die Activity noch nicht vergangen ist (`du_zbis` vs. `startOfTodayIso()`, gleiche Grenze wie Archiv); Stub-Zeitbereiche (`ben=0` oder keine Rolle) werden serverseitig (`gt("ben", 0)`) bzw. clientseitig herausgefiltert; Checkbox bleibt unverändert stehen, bis die Server-Antwort eintrifft (kein optimistisches UI, erfüllt AC zur Fehlermeldung bei nicht erreichbarer API)
- `src/app/activities/[id]/uebersicht/page.tsx` (NEU) — Tabelle je Zeitbereich (Label, Rolle als Sekundärzeile, kommen/insg./offen, Status-Icon), gleicher Zugriffsschutz wie die Anmeldung-Seite
- `src/app/activities/[id]/zeitbereiche/page.tsx` (GEÄNDERT) — `loadRoles` lädt zusätzlich `gleich_angemeldet`; neue Hilfsfunktion `fetchActiveMemberIds`; `handleSaveRow` befüllt `eingeteilte_users` einmalig mit allen aktiven Mitgliedern, wenn die gewählte Rolle `gleich_angemeldet=true` hat und die Zeile aktuell 0 Zusagen hat (deckt sowohl Neuanlage als auch Bearbeiten ab, da beide Fälle bei 0 starten)

**Nicht optimistisch, sondern serverseitig berechnet:** Der neue Endpunkt vertraut nie einer vom Client mitgesendeten Mitglieds-ID — er ermittelt den Aufrufer ausschließlich aus dem JWT und ändert nur dessen eigenen Eintrag. Das setzt die in `/architecture` getroffene Entscheidung direkt um.

**Neuer, beim Architektur-Entwurf nicht erkannter Blocker für `/backend`:** Die Anmeldung-Seite liest für die Namensauflösung direkt `supabase.from("users").select(...).contains("verein", [vId])` als beliebiger eingeloggter Nutzer (nicht nur Admin). Die bestehende `users`-SELECT-Policy (`users_select_own_verein_admin`, aus PROJ-7) ist jedoch admin-beschränkt — ein normales Mitglied sieht mit der aktuellen RLS-Lage nur die eigene Zeile, nicht die anderer Mitglieder. Dadurch werden die Namenslisten auf der Anmeldung-Seite für Mitglieder aktuell leer/„Unbekannt" bleiben, bis `/backend` eine passende SELECT-Policy ergänzt (z.B. beschränkt auf `id, adalo_id, vorname, nachname`, analog zum bereits etablierten Muster „lesen ja, aber nur eingeschränkte Felder"). Betrifft nur die Namensauflösung, nicht die Zähler (kommen/benötigt), die direkt aus `einstellungen.eingeteilte_users.length` kommen und bereits für alle Mitglieder lesbar sind (siehe unten).

**Bereits ausreichend (keine neue Policy nötig):** `activities`- und `einstellungen`-SELECT sind laut PROJ-8/PROJ-6-Backend-Notizen bereits für jeden Vereins-Nutzer freigegeben (nicht nur Admins) — verifiziert per SQL-Introspektion in früheren Phasen. Die Zähler auf Übersicht- und Anmeldung-Seite funktionieren daher bereits ohne weitere Backend-Änderung. Die Namensauflösung auf der Übersicht-Seite (nachträglich ergänzt, siehe Decision Log) nutzt dieselbe `mitglieder_namen`-View wie die Anmeldung-Seite — keine zusätzliche Backend-Änderung nötig, da die View bereits für jeden Vereins-Nutzer freigegeben ist.

**Nicht getestet (erwartete Blocker für `/backend`, analog zu PROJ-5–9):**
- Selbst-An-/Abmeldung über den neuen Endpunkt konnte noch nicht end-to-end gegen echte Daten verifiziert werden (RLS auf `einstellungen` ist für den Service-Role-Schreibzugriff im Endpunkt zwar irrelevant, aber der Endpunkt selbst wurde nur gegen den TypeScript-Compiler geprüft, nicht live aufgerufen)
- Die Namensauflösung auf der Anmeldung-Seite (siehe Blocker oben)
- Die Auto-Anmeldung bei "automatisch angemeldet"-Rollen (PROJ-9-Zeitbereiche-Seite) wurde nicht live mit echten Mitgliedsdaten getestet

**Verifiziert:** `npm run build` läuft sauber durch (neue Routen `/activities/[id]/uebersicht` und `/api/einstellungen/[id]/anmeldung` kompilieren fehlerfrei). `npm test` weiterhin 55/55, keine Regression. `npm run lint` weiterhin am vorbestehenden, projektunabhängigen Problem (fehlende `eslint.config.js`) gescheitert — kein neuer Blocker.

## Backend Implementation Notes

**Sicherheitsproblem vor der Umsetzung entdeckt und mit dem User geklärt:** Die im Tech Design vorgesehene einfache Lösung ("jeder Vereins-Nutzer darf `users`-Zeilen des eigenen Vereins lesen") hätte über RLS nicht nur Vorname/Nachname freigegeben, sondern auch E-Mail, Geburtstag, Mitgliedsnummer und Admin-Status aller Vereinskollegen — abrufbar per direktem REST-Call, nicht nur über die App-UI (RLS schützt ganze Zeilen, keine einzelnen Spalten). Nach Rücksprache mit dem User (explizite Freigabe der konkreten Migration) stattdessen umgesetzt:

**Gebaut:** Migration `proj10_mitglieder_namen_view` (per `apply_migration`, mit expliziter User-Freigabe angewendet):
- Neue Funktion `current_user_verein()` (SECURITY DEFINER, analog zur bereits bestehenden `current_user_admin_verein()`, aber ohne `admin = true`-Filter) — gibt das eigene `verein`-Array des Aufrufers zurück
- Neue View `public.mitglieder_namen`: `SELECT id, adalo_id, vorname, nachname, verein FROM users WHERE verein && current_user_verein()` — exponiert bewusst nur nicht-sensible Spalten; filtert sich selbst über `current_user_verein()` auf den eigenen Verein, sodass kein Mitglied fremde Vereine oder sensible Spalten (E-Mail, Geburtstag, Mitgliedsnummer, Admin-Status) einsehen kann
- `GRANT SELECT ON mitglieder_namen TO authenticated`
- Die zugrunde liegende `users`-Tabelle selbst bleibt unverändert (weiterhin nur `users_select_own` / `users_select_own_verein_admin` / `users_select_su`)
- `src/app/activities/[id]/page.tsx` (GEÄNDERT) — Namensauflösung liest jetzt `mitglieder_namen` statt `users`

**Erwartete Linter-Meldung, kein Bug:** `get_advisors` (security) meldet `security_definer_view` für `mitglieder_namen` als ERROR. Das ist der beabsichtigte Mechanismus (die View muss die admin-only-Policy von `users` gezielt umgehen können, um Namen anderer Vereinsmitglieder zu zeigen) — abgesichert durch die selbst eingebaute `WHERE verein && current_user_verein()`-Einschränkung in der View-Definition, die den echten `auth.uid()` des Aufrufers auswertet (nicht den View-Besitzer). Ebenfalls vorbestehend (nicht neu durch PROJ-10 verursacht): `current_user_verein()` ist wie die bereits existierende `current_user_admin_verein()` auch von `anon` aufrufbar (WARN) — folgenlos, da bei fehlendem `auth.uid()` nur ein leeres Array zurückkommt.

**Nebenfund (nicht PROJ-10-Scope):** `vereine.adalo_id` ist weiterhin `NOT NULL` ohne Default (gleiches Migrationsmuster wie bei `activities`/`categories`/`rollen`/`einstellungen` vor deren jeweiligem Fix) — betrifft PROJ-10 nicht (kein Feature-Code legt neue Vereine an), nur beim Aufbau isolierter Testdaten aufgefallen. Für ein künftiges Feature rund um Vereins-Anlage vormerken.

**Manuell verifiziert** (per Skript mit echten JWTs gegen die echte Supabase-Instanz und den laufenden Dev-Server, mit isolierten, danach vollständig entfernten Testdaten — 2 Test-Vereine, 2 Test-Mitglieder + 1 Test-Admin in Verein A, 1 Test-Mitglied in Verein B, 1 echter Zeitbereich mit `ben=2`, 1 Stub-Zeitbereich mit `ben=0`):
- **`mitglieder_namen`-View:** Mitglied sieht alle 3 Namen des eigenen Vereins; sieht 0 Zeilen für den fremden Verein; `select email` auf der View schlägt fehl ("column does not exist") — die Spalte ist auf DB-Ebene gar nicht vorhanden, kein Zugriff über Umwege möglich
- **Selbst-Anmeldung (`POST /api/einstellungen/[id]/anmeldung`):** `anmelden` trägt die eigene ID ein (200); erneutes `anmelden` erzeugt keinen Duplikat-Eintrag (Idempotenz); `abmelden` entfernt ausschließlich die eigene ID, ein zweites zugesagtes Mitglied bleibt unangetastet
- **Cross-Tenant-Schutz:** Mitglied aus Verein B erhält 403 beim Versuch, einen Zeitbereich von Verein A zu ändern; Datenbank-Zustand danach per Service-Role-Abfrage bestätigt unverändert
- **Nicht-anmeldefähiger Stub-Zeitbereich** (`ben=0`, keine Rolle): Anfrage liefert 400
- **Unauthentifizierte Anfrage:** liefert 401

**Nicht separat getestet:** Die Auto-Anmeldung bei "automatisch angemeldet"-Rollen (clientseitige Logik in der PROJ-9-Zeitbereiche-Seite) — nutzt ausschließlich bereits verifizierte Admin-Berechtigungen (volles CRUD auf `einstellungen`, Lesen von `users` als Admin), kein neuer RLS-Pfad, daher nicht isoliert erneut getestet.

**Verifiziert:** `npm run build` weiterhin sauber, `npm test` weiterhin 55/55.

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
