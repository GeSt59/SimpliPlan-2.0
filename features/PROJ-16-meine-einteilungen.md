# PROJ-16: Meine Einteilungen (Mitglied-Übersicht eigener Zeitbereich-Zusagen)

## Status: Planned
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
| _Wird in `/architecture` ergänzt_ | | |

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)
_To be added by /architecture_

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
