# PROJ-13: Mitglieder-Ansicht/Suche

## Status: Deployed
**Created:** 2026-07-17
**Last Updated:** 2026-07-17 (Deploy)

> **Refinement (2026-07-17):** Neues Feld `telefonnummer` (siehe PROJ-12-Refinement vom selben Tag) wird zusätzlich im read-only Detail-Dialog angezeigt, identisches Platzierungsmuster wie Mitgliedsnummer/Geburtstag. Kein neuer `/architecture`-Durchlauf nötig (rein additives Anzeigefeld, keine neue RLS-Frage — die bestehende `users_select_own_verein_member`-Policy ist spaltenunabhängig und deckt die neue Spalte bereits ab), direkt über `/frontend` umgesetzt.

> **Refinement (2026-07-17, Listenform + Druck):** Analog zur gleichzeitigen PROJ-7-Änderung wird die Listenform auf eine reine 3-Spalten-Übersicht (Nachname Vorname / E-Mail / Telefonnummer) ohne Badges und ohne Klick-Aktion reduziert (der Detail-Dialog bleibt exklusiv über die Foto-Karten-Ansicht erreichbar); zusätzlich bekommt auch das normale Mitglied einen Drucken-Button in der Listenform, identisches Verhalten wie bei PROJ-7 (neuer Tab, druckfertiges Mitgliederverzeichnis, automatischer Druckdialog). Rein additive/vereinfachende, clientseitige Änderung ohne neue Berechtigungsfragen — kein neuer `/architecture`-Durchlauf nötig, direkt über `/frontend` umgesetzt.

## Dependencies
- PROJ-1 (Supabase Infrastruktur Multi-Tenant + RLS) — für RLS-Policies, die Sichtbarkeit strikt auf den eigenen Verein beschränken
- PROJ-3 (Authentifizierung) — für eingeloggten Mitglied-Zugriff
- PROJ-7 (Mitgliederverwaltung Admin) — etabliert das Datenmodell und die Foto-Karten-Optik (Portraitfoto, Name/E-Mail-Overlay), die PROJ-13 read-only für normale Mitglieder wiederverwendet
- PROJ-15 (Bottom-Tab-Bar) — muss erweitert werden: normale Mitglieder bekommen einen neuen 3. Tab ("Lions"), der zu dieser neuen read-only Ansicht führt (bisher nur Activities/Profil); Admin/SU bleiben unverändert bei 5 Tabs, deren "Lions"-Tab weiterhin zu `/mitglieder` (PROJ-7) führt

## User Stories
- Als Mitglied möchte ich alle Mitglieder meines eigenen Vereins in einer durchsuchbaren Übersicht sehen, damit ich Vereinskollegen schnell finde.
- Als Mitglied möchte ich nach Vorname, Nachname oder E-Mail suchen können, damit ich eine bestimmte Person gezielt finde, ohne die ganze Liste zu durchscrollen.
- Als Mitglied möchte ich auf ein Mitglied klicken und dessen Kontakt- und Stammdaten (E-Mail, Telefonnummer, Mitgliedsnummer, Titel, Geburtstag) in einer schreibgeschützten Ansicht sehen, damit ich es kontaktieren oder wiedererkennen kann.
- Als Mitglied möchte ich erkennen, wer im Verein Admin ist, damit ich weiß, an wen ich mich bei Fragen wenden kann.
- Als Mitglied möchte ich zwischen Foto-Karten- und Listenform umschalten können, damit ich je nach Situation die passendere Ansicht wähle — analog zur Admin-Ansicht aus PROJ-7.
- Als Mitglied möchte ich über einen eigenen Tab in der unteren Navigationsleiste direkt zur Mitgliedersuche gelangen, damit ich sie ohne Umweg über das Profil erreiche.
- Als Mitglied möchte ich ausschließlich Mitglieder meines eigenen Vereins sehen, damit die Vereinstrennung (Cross-Tenant-Schutz) auch hier gewahrt bleibt.
- Als Mitglied möchte ich die aktuell angezeigte Mitgliederliste (Nachname Vorname, E-Mail, Telefonnummer) als druckfertiges Mitgliederverzeichnis mit Tabellenlinien ausdrucken können, damit ich eine Papier-/PDF-Version zur Hand habe — identisch zur Admin-Funktion aus PROJ-7.

## Out of Scope
- Jegliche Schreib-/Bearbeitungsfunktion (Bearbeiten, Anlegen, Löschen, Aktiv-/Admin-Toggle, Profilbild-Upload) — bleibt exklusiv PROJ-7 (Admin) bzw. PROJ-12 (eigenes Profil)
- Zugriff auf Mitglieder anderer Vereine — strikt auf den eigenen Verein beschränkt (RLS), keine Ausnahme (anders als beim SU in PROJ-7)
- SuperUser-Verein-Switcher — PROJ-13 ist eine reine Mitglied-Funktion; SU nutzt weiterhin PROJ-7 für vereinsübergreifende Verwaltung
- Direktkontakt-Funktionen (z.B. "E-Mail schreiben"-Button, In-App-Messaging) — die Ansicht zeigt nur die E-Mail-Adresse als Text an, kein Mailto-Link oder Messaging im MVP
- Kalender-Export/Einteilungs-Übersicht pro Mitglied — nicht Teil dieser Suche
- Bulk-Aktionen jeglicher Art
- Änderung der bestehenden Admin-Route `/mitglieder` (PROJ-7) — bleibt unverändert, PROJ-13 nutzt eine eigene neue Route
- Detail-Dialog/Klick-Aktion aus der Listenform heraus — seit dem Refinement vom 2026-07-17 ist die Listenform eine reine, nicht-interaktive 3-Spalten-Übersicht; der Detail-Dialog ist ausschließlich über die Foto-Karten-Ansicht erreichbar
- Weitere Spalten im Druck-Verzeichnis oder Drucken aus der Foto-Karten-Ansicht — identische Einschränkung wie bei PROJ-7

## Acceptance Criteria

**Format:** Angenommen [Vorbedingung] / Wenn [Aktion] / Dann [Ergebnis]

- [ ] Angenommen ein Mitglied (kein Admin, kein SU) ist eingeloggt, dann sieht es in der unteren Navigationsleiste einen 3. Tab "Lions" zusätzlich zu Activities und Profil
- [ ] Angenommen ein Mitglied klickt auf den Tab "Lions", dann wird es zur neuen Mitgliedersuche-Seite navigiert
- [ ] Angenommen ein Admin oder SuperUser ist eingeloggt, dann bleibt dessen bestehende Tab-Leiste (5 Tabs, "Lions" → `/mitglieder`) unverändert
- [ ] Angenommen ein Mitglied ruft die Mitgliedersuche auf, dann sieht es standardmäßig die Foto-Karten-Ansicht (2 Spalten) aller Mitglieder seines eigenen Vereins, sortiert nach Nachname
- [ ] Angenommen der Verein des Mitglieds hat außer ihm selbst noch keine weiteren Mitglieder, dann sieht es einen Leerzustand mit Hinweistext (keine Aktion zum Anlegen, da PROJ-13 read-only ist)
- [ ] Angenommen das Mitglied gibt einen Suchbegriff ein, dann filtert die Liste live auf Treffer in Vorname, Nachname oder E-Mail
- [ ] Angenommen das Mitglied klickt auf den Button "In Listenform", dann wechselt die Ansicht zu einer reinen 3-Spalten-Übersicht (Nachname Vorname, E-Mail, Telefonnummer) ohne Badges oder Klick-Aktion; ein erneuter Klick wechselt zurück zur Foto-Karten-Ansicht; die zuletzt gewählte Ansicht wird gemerkt (analog zu PROJ-7)
- [ ] Angenommen das Mitglied befindet sich in der Listenform, dann sieht es einen Drucken-Button, der in einem neuen Tab ein druckfertiges Mitgliederverzeichnis (fette Überschrift "Mitgliederverzeichnis", Vereinsname, "Stand [Datum]", Tabelle mit Tabellenlinien) mit der aktuell gefilterten Liste öffnet und automatisch den Browser-Druckdialog auslöst
- [ ] Angenommen das Mitglied klickt auf die Karte/Zeile eines Mitglieds, dann öffnet sich ein schreibgeschützter Dialog mit Foto, Vorname, Nachname, E-Mail, Telefonnummer, Mitgliedsnummer, Geburtstag und Titel (vorher/nachher) — ohne Eingabefelder oder Speichern-Button
- [ ] Angenommen ein Mitglied ist Admin des Vereins, dann erscheint bei ihm in Karte, Liste und Detail-Dialog ein "Admin"-Badge
- [ ] Angenommen ein Mitglied ist inaktiv (`aktiv = false`), dann erscheint es weiterhin in der Suche, jedoch mit einem "Inaktiv"-Badge
- [ ] Angenommen das Mitglied sieht sich selbst in der Liste, dann ist die eigene Karte/Zeile zusätzlich mit einem "Du"-Badge gekennzeichnet
- [ ] Angenommen ein Mitglied von Verein A ist eingeloggt, dann sieht die Mitgliedersuche ausschließlich Mitglieder von Verein A (nie Mitglieder eines anderen Vereins)
- [ ] Angenommen ein Mitglied ruft die Route der Mitgliedersuche direkt über die URL auf, ohne eingeloggt zu sein, dann wird es zu "/" umgeleitet
- [ ] Angenommen ein einzelnes Mitglied hat kein Profilbild, dann zeigt Karte, Liste und Detail-Dialog einen neutralen Platzhalter anstelle eines Fotos

## Edge Cases
- Suchbegriff ergibt keine Treffer → Hinweistext "Keine Mitglieder gefunden" statt leerer Fläche
- Mitglied wechselt zwischen Foto-Karten- und Listenform während eine Suche aktiv ist → Suchbegriff bleibt über den Ansichtswechsel hinweg erhalten (analog PROJ-7)
- Migrierte Bestandsmitglieder ohne gesetzte Telefonnummer/Mitgliedsnummer/Geburtstag/Titel → entsprechendes Feld erscheint im Detail-Dialog schlicht leer/ausgeblendet, kein Fehler
- Mitglied, das gerade selbst deaktiviert wurde, ruft die Suche weiterhin auf → laut PROJ-3/PROJ-7-Präzedenz beeinflusst `aktiv` den Login nicht; die Suche bleibt bis zum nächsten Logout normal nutzbar
- Zwei Mitglieder mit identischem Namen → Liste zeigt beide unabhängig an, E-Mail dient zur eindeutigen Unterscheidung
- Direkter URL-Aufruf der neuen Route durch ein Mitglied eines anderen Vereins → RLS liefert ausschließlich Zeilen des eigenen Vereins, kein Cross-Tenant-Leck möglich

## Technical Requirements (optional)
- Security: Zugriff nur für eingeloggte Nutzer; RLS beschränkt Lesezugriff strikt auf `users`-Zeilen des eigenen Vereins — reine Lesefunktion, keine neue Schreib-Policy nötig
- Keine neue serverseitige API-Route erforderlich (reiner Lesezugriff, kein Geheimnis zu schützen) — analog zum bestehenden Lesezugriff-Muster, sofern die bestehende RLS-Policy aus PROJ-7 (`users_select_own_verein_admin`) allen Vereinsmitgliedern (nicht nur Admins) Lesezugriff auf die `users`-Zeilen des eigenen Vereins erlaubt; falls nicht, wird in `/architecture` eine ergänzende SELECT-Policy für normale Mitglieder benötigt
- Erweiterung der bestehenden Bottom-Tab-Bar-Komponente (PROJ-15) um einen rollenabhängigen 3. Tab für Nicht-Admins

## Open Questions
- [x] Exakte RLS-Policy-Lücke: erlaubt die bestehende PROJ-7-Policy bereits allen Mitgliedern (nicht nur Admins) Lesezugriff auf `users`-Zeilen des eigenen Vereins, oder braucht es eine neue SELECT-Policy? → per Introspektion der Live-Datenbank geprüft: **Nein**, die bestehende Policy `users_select_own_verein_admin` greift nur, wenn der Aufrufer selbst Admin ist (`current_user_admin_verein()` filtert intern auf `admin = true`). Ein normales Mitglied sieht aktuell ausschließlich seine eigene Zeile (`users_select_own`). PROJ-13 braucht eine **neue** SELECT-Policy ohne Admin-Einschränkung (siehe Tech Design)
- [x] Exakter Routen-Name der neuen Seite → entschieden: `/mitgliedersuche`

## Decision Log

### Product Decisions
| Decision | Rationale | Date |
|----------|-----------|------|
| Normale Mitglieder bekommen einen neuen 3. Tab "Lions" in der Bottom-Tab-Bar (statt eines Buttons auf der Profil-Seite oder eines Bereichs innerhalb von Profil), der zur neuen Mitgliedersuche führt | Nutzerentscheidung im Interview; erweitert die deployte PROJ-15-Tab-Leiste um einen rollenabhängigen 3. Tab, gleicher Name/Icon wie beim Admin-Tab, aber andere Zielroute | 2026-07-17 |
| Eigene neue Route statt Wiederverwendung von `/mitglieder` (PROJ-7) | Hält Admin-Berechtigungen (Bearbeiten/Löschen/Anlegen) sauber getrennt von der reinen Lese-Ansicht für Mitglieder; verhindert versehentliche Rechteausweitung über eine gemeinsame Route | 2026-07-17 |
| Klick auf eine Karte/Zeile öffnet einen schreibgeschützten Detail-Dialog (Foto, Name, E-Mail, Mitgliedsnummer, Geburtstag, Titel) statt keiner Aktion | Nutzerentscheidung im Interview; die Karten-Overlay-Optik aus PROJ-7 zeigt nur Name+E-Mail, weitere Stammdaten (Mitgliedsnummer, Titel, Geburtstag) wären sonst gar nicht einsehbar | 2026-07-17 |
| Inaktive Mitglieder bleiben sichtbar (mit "Inaktiv"-Badge), statt ausgeblendet zu werden | Nutzerentscheidung im Interview (bewusst gegen die Empfehlung "ausblenden"); konsistent mit dem bestehenden Admin-Verhalten aus PROJ-7 | 2026-07-17 |
| E-Mail-Adresse ist für alle Vereinsmitglieder sichtbar (nicht nur für Admins wie bisher) | Nutzerentscheidung im Interview; ohne Kontaktdaten wäre "Vereinskollegen finden" (PRD-Zielsetzung) kaum nützlich | 2026-07-17 |
| Admin-Status ist über ein Badge erkennbar | Nutzerentscheidung im Interview; hilft Mitgliedern, Ansprechpartner im Verein zu identifizieren | 2026-07-17 |
| Geburtstag ist im Detail-Dialog sichtbar | Nutzerentscheidung im Interview; in Vereinen häufig gewünscht (z.B. Geburtstagsglückwünsche), konsistent mit den übrigen sichtbaren Stammdaten | 2026-07-17 |
| Kein Direktkontakt (Mailto-Link, Messaging) im MVP | Nicht Teil der Interview-Anforderung; E-Mail wird nur als Text angezeigt, Kontaktaufnahme läuft weiterhin außerhalb der App | 2026-07-17 |
| SuperUser nutzt für vereinsübergreifende Verwaltung weiterhin ausschließlich PROJ-7, kein eigener Zugriff auf PROJ-13 | PROJ-13 ist eine reine Mitglied-Funktion für den eigenen Verein; der SU hat über PROJ-7 bereits vollen (und weitergehenden) Zugriff | 2026-07-17 |
| **Refinement 2026-07-17 (analog zu PROJ-7):** Listenform wird auf exakt 3 Spalten reduziert (Nachname Vorname / E-Mail / Telefonnummer), ohne Badges und ohne Klick-Aktion (Detail-Dialog nur noch über die Foto-Karten-Ansicht erreichbar); zusätzlich Drucken-Button in der Listenform | Nutzerentscheidung im Refinement-Interview: dieselbe Bildvorlage/Anforderung wie bei PROJ-7 soll konsistent auch für normale Mitglieder gelten, nicht nur für Admins | 2026-07-17 |
| **Refinement 2026-07-17:** Telefonnummer wird im Detail-Dialog angezeigt (gleiche Stelle wie Mitgliedsnummer/Geburtstag), nicht auf der Karte/in der Liste | Konsistent mit der bereits etablierten Platzierung dieser Kategorie von Zusatzfeldern; Karten-Overlay bleibt bewusst auf Name+E-Mail beschränkt (Platzgründe, siehe ursprüngliche Tech-Design-Entscheidung) | 2026-07-17 |

### Technical Decisions
<!-- Added by /architecture -->
| Decision | Rationale | Date |
|----------|-----------|------|
| Neue Route `/mitgliedersuche` statt Wiederverwendung von `/mitglieder` | Bestätigt die Produktentscheidung: getrennte Route hält Lese-only-Zugriff sauber von den Admin-Schreibrechten (PROJ-7) getrennt; erleichtert außerdem eine eigene, schlankere RLS-Policy statt einer Sonderfall-Verzweigung innerhalb einer einzigen Seite | 2026-07-17 |
| Neue RLS-Policy `users_select_own_verein_member` (SELECT, alle Nutzer, `verein && current_user_verein()`) plus neue Hilfsfunktion `current_user_verein()` (SECURITY DEFINER, wie `current_user_admin_verein()`, aber ohne `admin = true`-Filter) | Per Introspektion der Live-Datenbank bestätigt: die bestehenden Policies aus PROJ-7 lassen normale Mitglieder aktuell nur die eigene Zeile sehen. Eine neue, eng gefasste Policy (nur SELECT, kein UPDATE) schließt exakt diese Lücke, ohne bestehende Admin-/SU-Policies zu verändern oder Schreibzugriff zu gewähren | 2026-07-17 |
| Kein neuer API-Endpunkt — direkter Browser→Supabase-Read-Call, identisches Muster wie die Liste in PROJ-7 | Reiner Lesezugriff ohne Geheimnis (kein Service-Role-Key nötig); RLS ist die alleinige Sicherheitsgrenze, konsistent mit dem bisherigen Architektur-Prinzip dieses Projekts | 2026-07-17 |
| Neue Seite `src/app/mitgliedersuche/page.tsx` als eigenständige Client-Komponente, die den bestehenden Karten-/Listen-Rendering-Code aus `src/app/mitglieder/page.tsx` strukturell wiederverwendet (kopiert, nicht importiert), aber ohne Anlege-/Bearbeiten-/Lösch-Aktionen und ohne Verein-Switcher | Die PROJ-7-Seite ist eng mit den Admin-Aktionen (Dialoge, Mutations-Handlern) verzahnt; eine gemeinsame Komponente würde Berechtigungslogik künstlich verzweigen. Eine eigene, schlankere Seite ist einfacher zu verstehen und zu testen (konsistent mit "Einfachheit zuerst") | 2026-07-17 |
| Erweiterung von `src/components/bottom-tab-bar.tsx`: Nicht-Admin/Nicht-SU-Nutzer bekommen jetzt zusätzlich zu Activities/Profil einen mittleren 3. Tab (Label = `tab2`, identisch zum bestehenden Admin-Tab-Namen, Icon `Users` wiederverwendet) mit Ziel `/mitgliedersuche`; Admin/SU-Zweig bleibt unverändert (`Lions` → `/mitglieder`) | Wiederverwendung von Label/Icon vermeidet ein zweites Namens-Feld in `vereine` nur für diesen Fall; die Rollenverzweigung (`isAdminOrSu`) existiert in der Komponente bereits und wird lediglich um einen `else`-Zweig ergänzt statt neu aufgebaut | 2026-07-17 |
| Detail-Dialog ist eine reine Anzeige-Komponente (kein `react-hook-form`, kein Zod-Schema) | Es gibt nichts zu validieren oder zu speichern; ein Formular-Stack wäre unnötige Komplexität für eine reine Ausgabe (konsistent mit "keine Abstraktionen für einmalig verwendeten Code") | 2026-07-17 |
| Keine neuen npm-Pakete | `@supabase/supabase-js`, `lucide-react`, alle benötigten shadcn/ui-Komponenten (`dialog`, `badge`, `input`, `button`) sind bereits im Projekt vorhanden | 2026-07-17 |
| **`/backend`:** Migration direkt auf der produktiven Datenbank angewendet, nach expliziter Nutzerfreigabe im Vorfeld | Kein separates Staging-/Preview-Datenbank-Setup im Projekt vorhanden (identisches Vorgehen wie bei allen bisherigen Migrationen von PROJ-1 bis PROJ-12); die Migration ist rein additiv (neue Funktion + neue SELECT-Policy), verändert keine bestehende Regel | 2026-07-17 |
| **`/backend`:** Policy-Korrektheit per SQL-Rollenwechsel-Simulation verifiziert statt nur durch Code-Review | Identisches Vorgehen wie der in PROJ-7 dokumentierte Rekursions-Bug-Fund; eine rein gedankliche Prüfung hätte das damalige Rekursionsrisiko nicht zuverlässig ausgeschlossen — die echte Simulation gegen die Live-Daten ist der verlässlichere Nachweis | 2026-07-17 |

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)

### A) Component Structure

```
Bottom-Tab-Bar (bestehend, PROJ-15 — wird erweitert)
├── Admin/SU: unverändert 5 Tabs, "Lions" → /mitglieder (PROJ-7)
└── Mitglied (kein Admin, kein SU): NEU 3 Tabs statt 2
    ├── Activities (bestehend)
    ├── "Lions" (NEU, mittig, Personen-Icon) → /mitgliedersuche
    └── Profil (bestehend)

Mitgliedersuche-Seite "/mitgliedersuche" (NEU)
├── Zugriffsprüfung: keine Session → Redirect zu "/" (kein Admin-/SU-Check nötig, jeder eingeloggte Nutzer darf rein)
├── Lädt eigenen Verein-Kontext (users.verein[0] des Aufrufers, kein Switcher)
├── Header-Balken (gleiche Optik wie /mitglieder aus PROJ-7): "Mitgliedersuche", ohne "In Listenform"-Button-Pendant im Header (Toggle sitzt wie bei PROJ-7 darunter)
├── Suchfeld ("eines von den {N} Mitgliedern suchen...", identisch zu PROJ-7)
├── Toggle "In Listenform" / "In Kartenform" (Zustand in localStorage, eigener Schlüssel getrennt von PROJ-7)
├── Ansicht A: Foto-Karten-Grid (Standard) — 2 Spalten
│   └── Karte je Mitglied: Foto (Platzhalter falls leer) · Du/Admin/Inaktiv-Badges · Name+E-Mail-Overlay · Klick → Detail-Dialog
│   └── KEIN Papierkorb-Icon (read-only)
├── Ansicht B: Listenform — Name · E-Mail · Badges · KEIN "Bearbeiten"-Button, ganze Zeile klickbar → Detail-Dialog
├── Leerzustand ("Noch keine weiteren Mitglieder in deinem Verein" — ohne Anlege-Aktion)
├── "Keine Treffer"-Zustand bei erfolgloser Suche
└── Detail-Dialog "Mitglied ansehen" (NEU, reine Anzeige)
    ├── Foto (groß, oder Platzhalter)
    ├── Name, Titel (vorher/nachher), Mitgliedsnummer, Geburtstag, E-Mail — alle nur Text, keine Eingabefelder
    ├── Du/Admin/Inaktiv-Badges
    └── "Schließen"-Button (kein "Speichern")
```

### B) Data Model (fachlich, kein Code)

- Keine neue Tabelle. Liest ausschließlich die bereits bestehende `users`-Tabelle (identische Felder wie PROJ-7/12: `vorname`, `nachname`, `email`, `mitgliedsnumer`, `geburtstag`, `titel_nachher`, `vorher_titel`, `aktiv`, `admin`, `profile_picture_url`).
- Reiner Lesezugriff — PROJ-13 schreibt an keiner Stelle in `users`.
- Neue Datenbankregel (keine neue Tabelle, aber eine neue Zugriffsregel): jedes eingeloggte Mitglied darf ab jetzt alle `users`-Zeilen seines eigenen Vereins lesen (bisher nur die eigene Zeile), abgegrenzt exakt auf Lesen — Schreibzugriff bleibt unverändert exklusiv Admin/SU/eigene Zeile vorbehalten.
- "Eigener Verein" wird wie in allen bisherigen Features über `users.auth_user_id = auth.uid()` und darüber `users.verein` bestimmt.

### C) Tech-Entscheidungen (Begründung für PM)

- **Neue, eng gefasste Datenbankregel statt Wiederverwendung der Admin-Regel**: Die bestehende Regel aus PROJ-7 gibt nur Admins Einblick in die Mitgliederliste ihres Vereins. Für PROJ-13 muss *jedes* Mitglied das dürfen — aber ausdrücklich nur lesend. Die neue Regel ist bewusst eine Kopie mit einer Einschränkung weniger (kein Admin-Filter), keine Erweiterung der bestehenden Schreibregeln — Cross-Tenant-Schutz und die strikte Trennung Lesen/Schreiben bleiben vollständig erhalten.
- **Kein neuer API-Endpunkt nötig**: Anders als beim Anlegen/Löschen in PROJ-7 (die einen Auth-Account-Eingriff mit Service-Role-Key brauchen) ist Lesen ungefährlich genug, um direkt vom Browser aus über die Datenbankregel zu laufen — spart eine Route, ohne Sicherheit zu verlieren.
- **Eigene Seite statt Erweiterung von `/mitglieder`**: Eine gemeinsame Seite für Admin-Verwaltung und Mitglied-Ansicht hätte bedeutet, Lösch-/Bearbeiten-Buttons pro Rolle ein-/auszublenden — fehleranfälliger als zwei getrennte, einfache Seiten mit klar getrennter Berechtigungslage.
- **Bottom-Tab-Bar bekommt einen dritten Zweig statt einer neuen Komponente**: Die Rollenverzweigung existiert dort bereits (Admin/SU vs. Mitglied); ein zusätzlicher Tab im Mitglied-Zweig ist eine kleine, lokal begrenzte Änderung an einer bereits bestehenden, funktionierenden Komponente.

### D) Dependencies

- Keine neuen Pakete: `@supabase/supabase-js`, `lucide-react`, `shadcn/ui` (`dialog`, `badge`, `input`, `button`) — alles bereits im Projekt vorhanden.

## Frontend Implementation Notes

**Gebaut:**
- Neue Seite `src/app/mitgliedersuche/page.tsx` — eigenständige, schlanke Client-Komponente (kein Wiederverwenden von `/mitglieder`, siehe Technical Decisions)
- Zugriffsschutz: keine Session → Redirect zu "/" (kein Admin-/SU-Check, jeder eingeloggte Nutzer darf rein, siehe Tech Design)
- Lädt eigenen Verein-Kontext aus `users.verein[0]` des Aufrufers, kein Verein-Switcher (kein SU-Anwendungsfall in PROJ-13)
- Liste lädt `users` gefiltert per `.contains("verein", [vereinId])`, sortiert nach `nachname` — identische Query wie PROJ-7, aber ohne `adalo_id` (nicht benötigt, da kein Lösch-Verwendungs-Check)
- Suche (Vorname/Nachname/E-Mail) läuft client-seitig auf der geladenen Liste, identisch zu PROJ-7; **kein** Status-Filter (Alle/Aktiv/Inaktiv) — nicht Teil der Spec, inaktive Mitglieder erscheinen immer mit Badge
- Foto-Karten-Grid (Standard, `grid-cols-4`, identische Optik zu PROJ-7: Overlay Name+E-Mail, Du/Admin/Inaktiv-Badges oben links) und Listenform, Toggle-Zustand in `localStorage` unter eigenem Schlüssel `mitgliedersuche-view` (getrennt von PROJ-7s `mitglieder-view`)
- **Kein** Papierkorb-Icon, **kein** FAB, **kein** "Neues Mitglied"-Button — rein lesend
- Klick auf Karte/Zeile öffnet einen neuen read-only Detail-Dialog (`Dialog`, kein `react-hook-form`/Zod): Foto, Name (inkl. Titel vorher/nachher), E-Mail, Mitgliedsnummer (falls gesetzt), Geburtstag (falls gesetzt), Du/Admin/Inaktiv-Badges, "Schließen"-Button
- `src/components/bottom-tab-bar.tsx` erweitert: Nicht-Admin/Nicht-SU-Zweig bekommt jetzt einen mittleren 3. Tab (Label `tab2`, Icon `Users`, wie beim Admin-Tab) mit Ziel `/mitgliedersuche` statt bisher nur Activities+Profil; Admin/SU-Zweig unverändert
- `npm run build` läuft sauber durch (`/mitgliedersuche` erscheint in der Routen-Liste, keine TypeScript-Fehler)
- Unauthentifizierter Zugriff auf `/mitgliedersuche` per Playwright verifiziert: Redirect zu "/" funktioniert wie erwartet

**Contract für `/backend` (zum Zeitpunkt von `/frontend` noch nicht vorhanden — mittlerweile umgesetzt, siehe Backend Implementation Notes unten):**
- Neue RLS-Policy auf `public.users` (SELECT, alle eingeloggten Nutzer, `verein && current_user_verein()`) plus neue Hilfsfunktion `current_user_verein()` (SECURITY DEFINER, wie `current_user_admin_verein()` aus PROJ-7, aber ohne `admin = true`-Filter) — siehe Tech Design. **Ohne diese Policy sah ein normales Mitglied auf `/mitgliedersuche` nur seine eigene Zeile**, da die bestehenden Policies aus PROJ-7 Lesezugriff auf andere Mitglieder exklusiv Admins vorbehalten
- Kein neuer API-Endpunkt nötig (reiner Browser→Supabase-Read, siehe Technical Decisions)

**Nicht end-to-end testbar in `/frontend`:** Die eigentliche Mitgliederliste (Karten/Liste mit mehreren Personen, Badges, Detail-Dialog) konnte erst nach der neuen RLS-Policy aus `/backend` mit echten Testdaten sichtbar geprüft werden — identisches Muster wie bei PROJ-7 (Backend-Contract zuerst dokumentiert, dann in `/backend` gebaut und verifiziert). Vollständige UI-E2E-Verifikation mit einem echten, eingeloggten Mitglied-Account folgt in `/qa`.

### Nachtrag (2026-07-17, nach QA): BUG-1-Fix

`/qa` fand ein Low-Bug: Admin/SU sahen kurz nach dem Login für ~200–800ms fälschlich die 3-Tab-Mitglied-Ansicht (inkl. "Lions" → `/mitgliedersuche` statt `/mitglieder`), bis die asynchrone Rollen-Abfrage in `bottom-tab-bar.tsx` zurückkam — Ursache war, dass der neue Mitglied-`else`-Zweig bereits beim initialen Default-Zustand (`isAdminOrSu = false`) griff. Gefixt durch einen neuen `roleLoaded`-Status: die `<nav>` rendert jetzt erst, wenn die Rolle tatsächlich geladen ist (vorher: sobald nur die Session bekannt war). Re-verifiziert mit einem frischen Testaccount (siehe QA Test Results, BUG-1).

### Refinement 2026-07-17: Listenform vereinfacht + Drucken-Button (analog zu PROJ-7)

**Anlass:** Der Nutzer forderte für PROJ-7 eine vereinfachte Listenform samt Drucken-Button einer Bildvorlage folgend und stellte danach explizit klar, dass "GENAU dieselbe Ansicht" auch dem normalen Mitglied (nicht nur dem Admin) zur Verfügung stehen soll.

**Gebaut (`src/app/mitgliedersuche/page.tsx`):**
- Listenform von der bisherigen `<li>`-Zeile (Badges, Klick öffnet Detail-Dialog) auf ein reines 3-Spalten-Grid reduziert (`grid-cols-[1fr_1fr_auto]`): Nachname Vorname, E-Mail, Telefonnummer — keine Badges, kein Klick-Handler mehr. Der Detail-Dialog bleibt ausschließlich über die Foto-Karten-Ansicht erreichbar (dort unverändert)
- Neuer Drucken-Button (Printer-Icon) neben dem Listenform/Kartenform-Toggle, nur sichtbar wenn `view === "liste"` — identisches Verhalten wie bei PROJ-7: sammelt die aktuell gefilterte Liste + Vereinsname + heutiges Datum in `sessionStorage` (Schlüssel `mitgliedersuche-druck-payload`, bewusst ein eigener Schlüssel statt des PROJ-7-Schlüssels, um beide Features unabhängig zu halten) und öffnet `/mitgliedersuche/drucken` per `window.open`
- Neuer State `vereinName`, einmalig per `vereine.select("vereinsname").eq("id", vereinId)` nachgeladen (kein Verein-Switcher in PROJ-13, daher kein SU-Sonderfall nötig)
- Neue Route `src/app/mitgliedersuche/drucken/page.tsx`: eigener Zugriffsschutz identisch zu `/mitgliedersuche` selbst (nur Session-Check, **kein** Admin/SU-Erfordernis — jedes Vereinsmitglied darf drucken), sonst strukturell identisch zur PROJ-7-Druckseite (eigene Datei statt gemeinsamer Komponente, konsistent mit der bereits bestehenden Trennung zwischen `/mitglieder` und `/mitgliedersuche`)

**Verifiziert (eigenes, danach entferntes Playwright-Skript, echter nicht-Admin Mitglied-Testaccount + 1 Vereinskollege, isolierte Testdaten):** 11/11 Checks bestanden — Drucken-Button nur in Listenform sichtbar, Telefonnummer und Kollegen-Name korrekt in der Liste sichtbar, kein Mitgliedsnummer-Text mehr, neuer Tab zeigt Überschrift/Vereinsname/beide Mitglieder, `window.print()` automatisch ausgelöst, unauthentifizierter Direktaufruf leitet zu "/" um, Cleanup vollständig. `npm test` (95/95) und `npm run build` bleiben sauber.

## Backend Implementation Notes

**Gebaut:**
- Migration `proj13_users_select_own_verein_member` per `apply_migration` auf der Live-Datenbank (Projekt "SimpliPlan") angewendet, nach expliziter Nutzerfreigabe (siehe Decision Log)
- Neue Hilfsfunktion `public.current_user_verein()` — `SQL`, `SECURITY DEFINER`, `STABLE`, `search_path = public`, exakte strukturelle Kopie von `current_user_admin_verein()` (PROJ-7), aber ohne den `admin = true`-Filter: gibt das `verein`-Array der aufrufenden Person zurück, unabhängig vom Admin-Status
- Neue Policy `users_select_own_verein_member` (`FOR SELECT`, `USING (verein && current_user_verein())`) auf `public.users` — rein additiv, keine bestehende Policy verändert oder entfernt
- Kein neuer API-Endpunkt (Architektur-Entscheidung bestätigt: reiner Lesezugriff, RLS ist die Sicherheitsgrenze, kein Service-Role-Key nötig) — die bereits im Frontend gebaute Seite `src/app/mitgliedersuche/page.tsx` braucht keine Anpassung, ihr direkter Browser→Supabase-Read-Call greift jetzt automatisch

**Verifiziert (direkt gegen die Live-Datenbank, per SQL-Rollenwechsel-Simulation analog zu PROJ-7):**
- Als ein echtes, nicht-admin Mitglied von Verein 1 simuliert (`SET LOCAL ROLE authenticated` + `request.jwt.claims` auf dessen `auth_user_id`, innerhalb `BEGIN...ROLLBACK`, keine Datenänderung): `SELECT * FROM public.users` liefert jetzt 34 Zeilen (alle Mitglieder von Verein 1) statt vorher nur der eigenen Zeile
- Cross-Tenant-Schutz bestätigt: dieselbe Simulation liefert ausschließlich Zeilen mit `verein = {1}`, keine Zeilen der anderen in der DB vorhandenen Vereine (u.a. 61, 37, 27, 68 und weitere Alt-/Testvereine aus der Adalo-Migration)
- Keine Rekursion (das aus PROJ-7 bekannte "infinite recursion"-Risiko bei selbstreferenzierenden `users`-Policies) — durch die `SECURITY DEFINER`-Hilfsfunktion strukturell ausgeschlossen, identisches Muster wie die bereits produktiv laufende `current_user_admin_verein()`
- `get_advisors` (security) nach der Migration geprüft: keine neuen ERROR-Findings; die neue Funktion erzeugt dieselben (bereits vorher bei `current_user_admin_verein()`/`current_user_is_su()` bestehenden) INFO/WARN-Hinweise zu öffentlich aufrufbaren `SECURITY DEFINER`-RPC-Funktionen — bewusst in Kauf genommen, identisches, bereits akzeptiertes Muster, keine neue Risikokategorie

**Kein Vitest-Test hinzugefügt:** Es gibt keine neue API-Route zu testen (reiner RLS-Zugriff); die Verifikation lief wie oben beschrieben per direkter SQL-Simulation gegen die Live-Policy, konsistent mit dem bisherigen Projektmuster für RLS-Änderungen (kein Seed-Fixture-Mechanismus, siehe PROJ-1/3–7/10–12).

### Refinement 2026-07-17: Telefonnummer

**Gebaut:** `src/app/mitgliedersuche/page.tsx` — Detail-Dialog um ein bedingtes Feld "Telefonnummer" erweitert (gleiche Stelle/Muster wie Mitgliedsnummer/Geburtstag, nur sichtbar wenn gesetzt). Keine Backend-Änderung nötig: die bestehende `users_select_own_verein_member`-Policy ist spaltenunabhängig und deckt `telefonnummer` bereits ab.

**Verifiziert (echte, disposable Test-Accounts, danach gelöscht):** Ein von Admin gesetzter Telefonnummer-Wert erscheint korrekt im Detail-Dialog eines Mitglieds in der Mitgliedersuche (End-to-End über PROJ-12 → PROJ-7 → PROJ-13 verifiziert, siehe dortige Notizen). `npm test` (95/95), `npm run test:e2e --project=chromium` (22/22), `npm run build` — alle grün.

## QA Test Results

**Tested:** 2026-07-17
**App URL:** http://localhost:3000
**Tester:** QA Engineer (AI)

**Methodik:** `npm test` (Vitest) und `npm run test:e2e` (Playwright-Regressionssuite) zuerst ausgeführt. Für die eingeloggten Szenarien (Karten-/Listenansicht, Suche, Badges, Detail-Dialog, Tab-Bar pro Rolle, Cross-Tenant-Isolation, XSS) wurde ein disposable Skript gegen die **Live-Supabase-Datenbank** ausgeführt: 3 isolierte Test-Vereine + 7 echte Test-Accounts (5× Verein A — aktives Mitglied "Du", zweites aktives Mitglied, Admin, inaktives Mitglied, XSS-Payload-Name —, 1× Verein B für Cross-Tenant-Check, 1× Verein C als einziges Mitglied für den Leerzustand) wurden über die Supabase Admin-API angelegt, per echtem UI-Login (Playwright, `chromium`) durchgespielt und danach vollständig wieder gelöscht (verifiziert: 0 verbleibende Test-Zeilen). Identisches Vorgehen wie bei PROJ-7/12/15 (kein Seed-Fixture-Mechanismus, siehe PROJ-1).

### Automatisierte Tests
- `npm test`: **95/95 grün**, keine Regression
- `npm run test:e2e` (chromium, isoliert): **21/21 grün**. Der volle Cross-Browser-Lauf (chromium+firefox+webkit gleichzeitig) zeigte 3 sporadische Timeouts auf unrelated Routen (`/activities`, `/activities/archiv`, `/kategorien`, `/register`) — bei isoliertem Re-Run jeweils grün, unterschiedliche Tests betroffen je Durchlauf. Das ist Ressourcen-Flakiness der parallelen Browser-Last auf dieser Maschine (identisches Muster wie das in PROJ-15 dokumentierte WebKit-Flake), **keine PROJ-13-Regression** — keine der betroffenen Routen berührt code, das PROJ-13 geändert hat
- Neuer Test `tests/PROJ-13-mitglieder-ansicht-suche.spec.ts` (unauthentifizierter Redirect) hinzugefügt, grün
- Kein neuer Vitest-Unit-Test: keine extrahierte, eigenständig testbare Logik (Suche/Filter ist ein einfacher Inline-`.filter()`, identisches, unextrahiertes Muster wie in PROJ-7 — vollständig durch die manuelle/E2E-Prüfung unten abgedeckt)

### Acceptance Criteria Status

#### AC-1 bis AC-3: Bottom-Tab-Bar
- [x] Mitglied sieht 3. Tab "Lions" zusätzlich zu Activities/Profil
- [x] Klick auf "Lions" navigiert zu `/mitgliedersuche`
- [ ] BUG-1 (Low): Admin/SU-Tab-Leiste zeigt kurzzeitig (~200–800ms, bis die Rollen-Abfrage zurückkommt) fälschlich die 3-Tab-Mitglied-Ansicht mit "Lions" → `/mitgliedersuche`, bevor sie auf die korrekten 5 Tabs mit "Lions" → `/mitglieder` wechselt — siehe Bugs Found

#### AC-4: Standardansicht Foto-Karten
- [x] Karten-Ansicht ist Standard, zeigt alle 5 Mitglieder von Verein A, sortiert nach Nachname (Aktiv, Bergmann, Chef, Dormant, XSSTest)
- [x] Dokumentationshinweis (kein Bug): AC-Text sagt "2 Spalten", Implementierung rendert `grid-cols-4` — identisch zum bereits produktiven PROJ-7-Verhalten und dem Mockup `public/Mitgliederverwaltung.jpg`. Empfehlung: AC-Text in einem künftigen `/refine` auf "4 Spalten" korrigieren, kein funktionaler Fehler

#### AC-5: Leerzustand
- [x] Verein C (nur 1 Mitglied = der Aufrufer selbst) zeigt den Leerzustand-Hinweistext, keine Anlege-Aktion

#### AC-6: Suche
- [x] Suche nach "Bruno" filtert live auf 1 Treffer

#### AC-7: Ansichts-Toggle + Persistenz
- [x] Toggle zu Listenform funktioniert
- [x] Ansicht bleibt nach Page-Reload erhalten (`localStorage`, Schlüssel `mitgliedersuche-view`)

#### AC-8: Detail-Dialog
- [x] Klick auf Karte/Zeile öffnet read-only Dialog mit Name, E-Mail, Mitgliedsnummer, Geburtstag (am Testnutzer "Bruno Bergmann" verifiziert, der beide optionalen Felder gesetzt hatte)
- [x] Per Code-Review verifiziert (nicht separat live angeklickt): fehlende Mitgliedsnummer/Geburtstag/Titel werden bedingt ausgeblendet (`{detailTarget.mitgliedsnumer && (...)}`), kein Fehler — Testnutzer "Anna"/"Carla" hatten diese Felder leer

#### AC-9 bis AC-11: Badges
- [x] "Admin"-Badge bei Carla (admin=true)
- [x] "Inaktiv"-Badge bei Dora (aktiv=false), Foto/Platzhalter zusätzlich grayscale
- [x] "Du"-Badge bei Anna (eigene Zeile)

#### AC-12: Cross-Tenant-Isolation
- [x] UI: Verein-B-Mitglied "Erik" erscheint nie in Annas (Verein A) Kartenansicht (5 statt 6 Karten)
- [x] Direkter REST-Zugriffstest (siehe Security Audit): bestätigt auch außerhalb der UI

#### AC-13: Unauthentifizierter Zugriff
- [x] Redirect zu "/" — manuell und per neuem automatisiertem Playwright-Test bestätigt

#### AC-14: Kein Profilbild → Platzhalter
- [x] Alle Testmitglieder (kein `profile_picture_url` gesetzt) zeigen das `UserRound`-Platzhalter-Icon

### Edge Cases Status

#### EC-1: Suchbegriff ohne Treffer
- [x] Per Code-Review verifiziert (identische Logik wie PROJ-7, nicht separat live mit einem garantiert leeren Suchbegriff durchgeklickt): `filteredMitglieder.length === 0` rendert "Keine Mitglieder gefunden."

#### EC-2: Ansicht/Suche bleibt bei Toggle erhalten
- [x] Reload-Persistenz der Ansicht live verifiziert; dass der Suchbegriff selbst einen reinen View-Toggle (ohne Reload) übersteht, ist strukturell verifiziert (`search`-State wird von `toggleView()` nicht angefasst), nicht separat live durchgeklickt

#### EC-3: Fehlende Mitgliedsnummer/Geburtstag/Titel
- [x] Siehe AC-8

#### EC-4: Cross-Tenant-Direktaufruf
- [x] Siehe AC-12 / Security Audit

#### EC-5: Zwei Mitglieder mit identischem Namen
- [~] Nicht live getestet (trivial, E-Mail dient zur Unterscheidung, keine Code-Pfad-Verzweigung dafür vorhanden, die brechen könnte)

### Security Audit Results
- [x] Authentication: kein Zugriff ohne Login (automatisiert getestet)
- [x] Authorization/Cross-Tenant: **direkter REST-Aufruf** (nicht nur UI-Klick) als echtes Verein-A-Mitglied gegen `public.users` liefert exakt 5 Zeilen (alle Verein A), 0 Zeilen außerhalb — die neue RLS-Policy hält auch bei umgangener UI
- [x] Authentication (anonym, kein Session-Token): direkter REST-Aufruf liefert 0 Zeilen — kein Leak an nicht eingeloggte Clients
- [x] Input validation/XSS: Testmitglied mit Payload-Namen `<img src=x onerror=alert(1)>` als Vorname — rendert als reiner Text (React-Escaping), kein `alert()`-Dialog ausgelöst (per `page.on("dialog")`-Listener bestätigt)
- [x] Keine neuen Secrets im Client-Bundle: kein neuer API-Endpoint gebaut (Architektur-Entscheidung), Seite nutzt ausschließlich den bereits vorhandenen Anon-Key-Browser-Client — strukturell durch die Architektur ausgeschlossen, nicht separat per Network-Tab-Audit erneut geprüft
- [ ] Rate Limiting: nicht anwendbar (reiner Lesezugriff über RLS, kein neuer Schreib-/API-Endpoint, siehe Architektur-Entscheidung)

### Bugs Found

#### BUG-1: Admin/SU sieht kurzzeitig die Mitglied-Tab-Leiste mit falschem "Lions"-Ziel
- **Severity:** Low
- **Steps to Reproduce:**
  1. Als Admin oder SuperUser einloggen
  2. Sofort nach dem Laden einer beliebigen Seite (im Zeitfenster, bevor die asynchrone Rollen-Abfrage in `bottom-tab-bar.tsx` zurückkommt, ca. 200–800ms) die untere Tab-Leiste betrachten oder auf "Lions" klicken
  3. Erwartet: Tab-Leiste zeigt durchgehend 5 Tabs, "Lions" → `/mitglieder`
  4. Tatsächlich: Für dieses kurze Zeitfenster zeigt die Leiste den neuen 3-Tab-Mitglied-Zweig (Activities, Lions, Profil) mit "Lions" → `/mitgliedersuche`, bevor sie sich auf den korrekten 5-Tab-Zustand korrigiert
- **Root Cause (Hinweis für die Entwicklung, nicht behoben):** `src/components/bottom-tab-bar.tsx` — der neue `else`-Zweig für Nicht-Admins greift bereits beim initialen Default-Zustand `isAdminOrSu = false`, nicht erst nach dessen Bestätigung. Vor PROJ-13 bedeutete dasselbe Zeitfenster nur "noch keine Zusatz-Tabs sichtbar" (unvollständig, aber nie falsch); jetzt zeigt es kurzzeitig ein falsches Linkziel
- **Kein Sicherheitsrisiko:** kein Datenzugriff auf fremde Vereine möglich, `/mitgliedersuche` funktioniert für den Admin technisch korrekt (er sieht nur seine eigenen Vereinsdaten) — lediglich das falsche Ziel für diesen einen Tab in diesem kurzen Fenster
- **Priority:** Empfehlung: vor dem Deployment fixen (vermutlich günstig zu beheben, z.B. Tab-Liste erst rendern, wenn die Rolle geladen ist) — Priorisierung liegt beim Nutzer
- **Status: Behoben (2026-07-17, `/frontend`-Rücksprung nach QA):** `src/components/bottom-tab-bar.tsx` rendert die `<nav>` jetzt erst, wenn zusätzlich zu `ready`/`session` auch ein neuer `roleLoaded`-Status `true` ist (wird erst gesetzt, nachdem die Rollen-/Label-Abfrage abgeschlossen ist, und bei jedem neuen Login/Auth-State-Wechsel wieder zurückgesetzt). Re-verifiziert mit einem frischen, disposablen Admin-Testaccount: 77 Messungen des "Lions"-Tab-Hrefs im ersten ~2,3-Sekunden-Fenster nach dem Login, alle zeigten durchgehend `/mitglieder` (korrekt), 0× das fälschliche `/mitgliedersuche`. `npm test` (95/95) und `npm run test:e2e --project=chromium` (22/22) bleiben grün.

### Summary
- **Acceptance Criteria:** 14/14 funktional bestanden (1 Low-Bug bei AC-3, 1 reine Dokumentationskorrektur bei AC-4, keine funktionale Auswirkung)
- **Bugs Found:** 1 total (0 critical, 0 high, 0 medium, 1 low)
- **Security:** Pass — Cross-Tenant-Schutz per direktem REST-Aufruf verifiziert, kein XSS, kein anonymer Datenzugriff
- **Production Ready:** YES (kein Critical/High-Bug)
- **Recommendation:** Deploy möglich; BUG-1 (Low) vor oder kurz nach dem Deployment beheben lassen, da günstig zu fixen und die Admin-UX kurz beeinträchtigt

## Deployment

**Production URL:** https://simpliplan.toolies.eu/mitgliedersuche
**Deployed:** 2026-07-17
**Deploy-Mechanismus:** Push auf `main` → GitHub Actions (`.github/workflows/deploy.yml`) → SSH auf Hetzner, `git pull` + `npm ci` + `npm run build` + `pm2 reload` (kein Vercel — abweichend vom generischen Skript-Text)

**Pre-Deployment-Checks:**
- [x] `npm run build` lokal erfolgreich (inkl. TypeScript-Check)
- [ ] `npm run lint` — **nicht ausführbar**: `next lint` existiert in Next.js 16 nicht mehr, und die vorhandene `.eslintrc.json` ist mit der installierten ESLint-9-Version inkompatibel (fehlende `eslint.config.js`). Vorbestehendes Tooling-Problem, unabhängig von PROJ-13, nicht behoben (außerhalb des Scopes dieses Features). TypeScript-Korrektheit ist über `npm run build` weiterhin abgedeckt
- [x] QA freigegeben, keine offenen Critical/High-Bugs (siehe QA Test Results)
- [x] Keine neuen Umgebungsvariablen nötig (kein neuer API-Endpoint, gleicher Anon-Key wie bestehend)
- [x] Keine Secrets committet
- [x] DB-Migration bereits in `/backend` direkt auf der Live-Datenbank angewendet (kein lokaler Migrations-Ordner in diesem Projekt, identisches Muster wie PROJ-1–12)
- [x] Alle Commits gepusht (`f88c2b7` → `main`)

**Post-Deployment-Verifikation:**
- [x] `https://simpliplan.toolies.eu/mitgliedersuche` antwortet mit HTTP 200 (Route existierte vor diesem Deploy nicht — starker Beleg für erfolgreichen Rollout)
- [x] Regressions-Check: `/`, `/mitglieder`, `/activities`, `/profil` weiterhin HTTP 200
- [x] Echter End-to-End-Smoke-Test mit einem frischen, disposablen Mitglied-Testaccount direkt gegen Produktion (nicht nur localhost): Login → 3-Tab-Leiste (Activities/Lions/Profil) → Klick "Lions" → `/mitgliedersuche` → korrekter Titel → Leerzustand korrekt gerendert (isolierter Test-Verein) → **keine Browser-Konsolen-Fehler**. Testdaten danach vollständig gelöscht (verifiziert)

**Git Tag:** `v1.11.0-PROJ-13`

### Erweiterung 2026-07-17: Deployment (Telefonnummer)

Gemeinsamer Deploy mit PROJ-7 und PROJ-12 — siehe PROJ-7 "Erweiterung 2026-07-17: Deployment" für die vollständigen Details (Commit `01fa496`, Tag `v1.12.0-PROJ-7-12-13`, End-to-End-Verifikation in Produktion inkl. `/mitgliedersuche`).

### Refinement 2026-07-17: Deployment (Listenform vereinfacht + Drucken-Button)

**Deployed:** 2026-07-17
**Production URL:** https://simpliplan.toolies.eu/mitgliedersuche (Listenform) bzw. https://simpliplan.toolies.eu/mitgliedersuche/drucken

Gemeinsam mit der identischen PROJ-7-Änderung in einem Push deployt — siehe PROJ-7 "Refinement 2026-07-17: Deployment (Listenform auf 3 Spalten reduziert)". Commit `feat(PROJ-13): Simplify list view + add print button for members` (`40fb57b`). Post-Deployment-Verifikation: Server-Checkout auf `40fb57b` per SSH bestätigt, PM2 frisch neu geladen; `https://simpliplan.toolies.eu/mitgliedersuche` und `/mitgliedersuche/drucken` liefern beide HTTP 200.
