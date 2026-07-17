# PROJ-13: Mitglieder-Ansicht/Suche

## Status: Architected
**Created:** 2026-07-17
**Last Updated:** 2026-07-17

## Dependencies
- PROJ-1 (Supabase Infrastruktur Multi-Tenant + RLS) — für RLS-Policies, die Sichtbarkeit strikt auf den eigenen Verein beschränken
- PROJ-3 (Authentifizierung) — für eingeloggten Mitglied-Zugriff
- PROJ-7 (Mitgliederverwaltung Admin) — etabliert das Datenmodell und die Foto-Karten-Optik (Portraitfoto, Name/E-Mail-Overlay), die PROJ-13 read-only für normale Mitglieder wiederverwendet
- PROJ-15 (Bottom-Tab-Bar) — muss erweitert werden: normale Mitglieder bekommen einen neuen 3. Tab ("Lions"), der zu dieser neuen read-only Ansicht führt (bisher nur Activities/Profil); Admin/SU bleiben unverändert bei 5 Tabs, deren "Lions"-Tab weiterhin zu `/mitglieder` (PROJ-7) führt

## User Stories
- Als Mitglied möchte ich alle Mitglieder meines eigenen Vereins in einer durchsuchbaren Übersicht sehen, damit ich Vereinskollegen schnell finde.
- Als Mitglied möchte ich nach Vorname, Nachname oder E-Mail suchen können, damit ich eine bestimmte Person gezielt finde, ohne die ganze Liste zu durchscrollen.
- Als Mitglied möchte ich auf ein Mitglied klicken und dessen Kontakt- und Stammdaten (E-Mail, Mitgliedsnummer, Titel, Geburtstag) in einer schreibgeschützten Ansicht sehen, damit ich es kontaktieren oder wiedererkennen kann.
- Als Mitglied möchte ich erkennen, wer im Verein Admin ist, damit ich weiß, an wen ich mich bei Fragen wenden kann.
- Als Mitglied möchte ich zwischen Foto-Karten- und Listenform umschalten können, damit ich je nach Situation die passendere Ansicht wähle — analog zur Admin-Ansicht aus PROJ-7.
- Als Mitglied möchte ich über einen eigenen Tab in der unteren Navigationsleiste direkt zur Mitgliedersuche gelangen, damit ich sie ohne Umweg über das Profil erreiche.
- Als Mitglied möchte ich ausschließlich Mitglieder meines eigenen Vereins sehen, damit die Vereinstrennung (Cross-Tenant-Schutz) auch hier gewahrt bleibt.

## Out of Scope
- Jegliche Schreib-/Bearbeitungsfunktion (Bearbeiten, Anlegen, Löschen, Aktiv-/Admin-Toggle, Profilbild-Upload) — bleibt exklusiv PROJ-7 (Admin) bzw. PROJ-12 (eigenes Profil)
- Zugriff auf Mitglieder anderer Vereine — strikt auf den eigenen Verein beschränkt (RLS), keine Ausnahme (anders als beim SU in PROJ-7)
- SuperUser-Verein-Switcher — PROJ-13 ist eine reine Mitglied-Funktion; SU nutzt weiterhin PROJ-7 für vereinsübergreifende Verwaltung
- Direktkontakt-Funktionen (z.B. "E-Mail schreiben"-Button, In-App-Messaging) — die Ansicht zeigt nur die E-Mail-Adresse als Text an, kein Mailto-Link oder Messaging im MVP
- Kalender-Export/Einteilungs-Übersicht pro Mitglied — nicht Teil dieser Suche
- Bulk-Aktionen jeglicher Art
- Änderung der bestehenden Admin-Route `/mitglieder` (PROJ-7) — bleibt unverändert, PROJ-13 nutzt eine eigene neue Route

## Acceptance Criteria

**Format:** Angenommen [Vorbedingung] / Wenn [Aktion] / Dann [Ergebnis]

- [ ] Angenommen ein Mitglied (kein Admin, kein SU) ist eingeloggt, dann sieht es in der unteren Navigationsleiste einen 3. Tab "Lions" zusätzlich zu Activities und Profil
- [ ] Angenommen ein Mitglied klickt auf den Tab "Lions", dann wird es zur neuen Mitgliedersuche-Seite navigiert
- [ ] Angenommen ein Admin oder SuperUser ist eingeloggt, dann bleibt dessen bestehende Tab-Leiste (5 Tabs, "Lions" → `/mitglieder`) unverändert
- [ ] Angenommen ein Mitglied ruft die Mitgliedersuche auf, dann sieht es standardmäßig die Foto-Karten-Ansicht (2 Spalten) aller Mitglieder seines eigenen Vereins, sortiert nach Nachname
- [ ] Angenommen der Verein des Mitglieds hat außer ihm selbst noch keine weiteren Mitglieder, dann sieht es einen Leerzustand mit Hinweistext (keine Aktion zum Anlegen, da PROJ-13 read-only ist)
- [ ] Angenommen das Mitglied gibt einen Suchbegriff ein, dann filtert die Liste live auf Treffer in Vorname, Nachname oder E-Mail
- [ ] Angenommen das Mitglied klickt auf den Button "In Listenform", dann wechselt die Ansicht zur einfachen Listenform; ein erneuter Klick wechselt zurück zur Foto-Karten-Ansicht; die zuletzt gewählte Ansicht wird gemerkt (analog zu PROJ-7)
- [ ] Angenommen das Mitglied klickt auf die Karte/Zeile eines Mitglieds, dann öffnet sich ein schreibgeschützter Dialog mit Foto, Vorname, Nachname, E-Mail, Mitgliedsnummer, Geburtstag und Titel (vorher/nachher) — ohne Eingabefelder oder Speichern-Button
- [ ] Angenommen ein Mitglied ist Admin des Vereins, dann erscheint bei ihm in Karte, Liste und Detail-Dialog ein "Admin"-Badge
- [ ] Angenommen ein Mitglied ist inaktiv (`aktiv = false`), dann erscheint es weiterhin in der Suche, jedoch mit einem "Inaktiv"-Badge
- [ ] Angenommen das Mitglied sieht sich selbst in der Liste, dann ist die eigene Karte/Zeile zusätzlich mit einem "Du"-Badge gekennzeichnet
- [ ] Angenommen ein Mitglied von Verein A ist eingeloggt, dann sieht die Mitgliedersuche ausschließlich Mitglieder von Verein A (nie Mitglieder eines anderen Vereins)
- [ ] Angenommen ein Mitglied ruft die Route der Mitgliedersuche direkt über die URL auf, ohne eingeloggt zu sein, dann wird es zu "/" umgeleitet
- [ ] Angenommen ein einzelnes Mitglied hat kein Profilbild, dann zeigt Karte, Liste und Detail-Dialog einen neutralen Platzhalter anstelle eines Fotos

## Edge Cases
- Suchbegriff ergibt keine Treffer → Hinweistext "Keine Mitglieder gefunden" statt leerer Fläche
- Mitglied wechselt zwischen Foto-Karten- und Listenform während eine Suche aktiv ist → Suchbegriff bleibt über den Ansichtswechsel hinweg erhalten (analog PROJ-7)
- Migrierte Bestandsmitglieder ohne gesetzte Mitgliedsnummer/Geburtstag/Titel → entsprechendes Feld erscheint im Detail-Dialog schlicht leer/ausgeblendet, kein Fehler
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

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
