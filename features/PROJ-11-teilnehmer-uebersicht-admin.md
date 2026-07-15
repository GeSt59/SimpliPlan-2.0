# PROJ-11: Teilnehmer-Übersicht (Admin)

## Status: Planned
**Created:** 2026-07-15
**Last Updated:** 2026-07-15

## Dependencies
- PROJ-1 (Supabase Infrastruktur Multi-Tenant + RLS) — für RLS-Policies, die Zugriff auf den eigenen Verein beschränken
- PROJ-3 (Authentifizierung) — für eingeloggten Admin-Zugriff und die Verein-Zuordnung
- PROJ-9 (Zeitbereiche CRUD) — liefert die `einstellungen`-Tabelle und `eingeteilte_users`-Spalte
- PROJ-10 (Mitglied-Anmeldung zu Zeitbereichen) — liefert die bestehende Übersicht-Seite (`/activities/[id]/uebersicht`), die PROJ-11 um Admin-Aktionen erweitert, sowie das serverseitige Muster für sichere Selbst-/Fremdänderung von `eingeteilte_users`

## User Stories
- Als Admin möchte ich auf der Übersicht-Seite ein Mitglied direkt zu einem Zeitbereich hinzufügen können, damit ich telefonische oder kurzfristige Zusagen sofort eintragen kann, ohne dass das Mitglied selbst die App nutzen muss.
- Als Admin möchte ich ein bereits eingetragenes Mitglied aus einem Zeitbereich entfernen können, damit ich Absagen oder Fehleinträge korrigieren kann.
- Als Admin möchte ich beim Entfernen eine Bestätigung sehen, damit ich nicht versehentlich die Zusage eines anderen Mitglieds lösche.
- Als Admin möchte ich diese Korrekturen auch nach der Activity noch vornehmen können, damit ich die tatsächliche Teilnahme nachträglich dokumentieren kann.
- Als Admin möchte ich eine druckfreundliche Teilnehmerliste einer Activity öffnen können, damit ich sie am Veranstaltungstag griffbereit habe.
- Als Mitglied (kein Admin) möchte ich weiterhin nur die reine Lese-Ansicht der Übersicht sehen, ohne die neuen Admin-Aktionen, damit meine Berechtigungen unverändert bleiben.

## Out of Scope
- Export als CSV oder Datei-Download — nur eine druckfreundliche Ansicht direkt im Browser (Nutzerentscheidung im Interview)
- Kontaktdaten (Telefon, E-Mail) in der Druckansicht — nur Namen, analog zur bestehenden Übersicht-Seite (Datensparsamkeit, gleiche Begründung wie PROJ-10)
- Benachrichtigung des betroffenen Mitglieds bei Admin-Ein-/Austragung (E-Mail/Push) — im Projekt existiert kein Benachrichtigungssystem
- Nachverfolgung, ob eine Zusage durch Selbstanmeldung (PROJ-10) oder Admin-Eintragung (PROJ-11) entstanden ist — beide erzeugen denselben `eingeteilte_users`-Eintrag ohne Unterscheidung
- Überschneidungsprüfung beim admin-seitigen Hinzufügen (ob ein Mitglied bereits für einen anderen Zeitbereich derselben Activity zugesagt hat) — bewusst nicht geprüft, analog zur PROJ-10-Entscheidung
- Harte Kapazitätsgrenze beim admin-seitigen Hinzufügen — kein Blocker, konsistent mit dem PROJ-10-Muster "nur Warnung, kein Blocker"
- Stub-Zeitbereiche (benötigt=0, keine Rolle) in der Admin-Übersicht — bleiben ausgeblendet, analog zu PROJ-10
- Bearbeiten der Zeitbereiche selbst (Label/benötigt/Rolle/Zeiten) — bleibt vollständig PROJ-9
- Eigene Route/URL für die Druckansicht — Drucken läuft direkt über den Browser-Druckdialog von der bestehenden Übersicht-Seite aus (Nutzerentscheidung im Interview)
- Neue Verwaltungsseite — PROJ-11 erweitert ausschließlich die bestehende Übersicht-Seite aus PROJ-10 (Nutzerentscheidung im Interview)

## Acceptance Criteria

**Format:** Angenommen [Vorbedingung] / Wenn [Aktion] / Dann [Ergebnis]

- [ ] Angenommen ein Admin öffnet die Übersicht-Seite einer Activity, dann sieht er zusätzlich zu den bestehenden Elementen (Zahlen, Status-Icon, Namen) pro Zeitbereich einen "Entfernen"-Button neben jedem Namen sowie einen "Mitglied hinzufügen"-Button
- [ ] Angenommen ein Mitglied (kein Admin) öffnet dieselbe Übersicht-Seite, dann sieht es weiterhin ausschließlich die reine Lese-Ansicht aus PROJ-10, ohne die neuen Admin-Aktionen
- [ ] Angenommen ein Admin klickt "Mitglied hinzufügen" bei einem Zeitbereich, dann öffnet sich eine durchsuchbare Liste aller Vereinsmitglieder, die diesem Zeitbereich noch nicht zugesagt haben
- [ ] Angenommen der Admin wählt ein Mitglied aus dieser Liste aus, dann wird es sofort zum Zeitbereich hinzugefügt, erscheint in der Namensliste, und der "kommen"-Zähler erhöht sich
- [ ] Angenommen ein Zeitbereich ist bereits voll oder überbucht (kommen ≥ benötigt), wenn der Admin trotzdem ein weiteres Mitglied hinzufügt, dann wird das Hinzufügen nicht blockiert
- [ ] Angenommen ein Admin klickt auf "Entfernen" neben einem Namen, dann erscheint ein Bestätigungsdialog; erst nach Bestätigung wird das Mitglied aus dem Zeitbereich entfernt
- [ ] Angenommen der Admin bricht den Bestätigungsdialog ab, dann bleibt das Mitglied unverändert eingetragen
- [ ] Angenommen die Activity liegt bereits in der Vergangenheit (Archiv), dann kann der Admin trotzdem Mitglieder zu Zeitbereichen hinzufügen oder daraus entfernen (im Unterschied zur Selbstanmeldung aus PROJ-10, die für vergangene Activities weiterhin gesperrt bleibt)
- [ ] Angenommen ein Admin klickt auf einen neuen "Drucken"-Button auf der Übersicht-Seite, dann öffnet sich der Browser-Druckdialog mit einer angepassten Druckansicht (App-Navigation, Buttons und Status-Icons ausgeblendet; Zeitbereich-Label, Rolle, kommen/benötigt sowie Namen aller Zugesagten bleiben sichtbar)
- [ ] Angenommen ein Mitglied (kein Admin) ist auf der Übersicht-Seite, dann sieht es den "Drucken"-Button nicht
- [ ] Angenommen ein Admin versucht per direktem API-Aufruf, ein Mitglied eines anderen Vereins zu einem fremden Zeitbereich hinzuzufügen oder daraus zu entfernen, dann wird das serverseitig verweigert
- [ ] Angenommen der Verein hat keine weiteren Mitglieder, die noch nicht zugesagt haben, wenn der Admin "Mitglied hinzufügen" öffnet, dann zeigt die Auswahlliste einen entsprechenden Leerzustand
- [ ] Angenommen die Supabase-API ist beim Hinzufügen/Entfernen nicht erreichbar, dann wird eine Fehlermeldung angezeigt und der zuvor angezeigte Zustand bleibt sichtbar erhalten

## Edge Cases
- Admin entfernt sich selbst aus einem Zeitbereich über die neue Admin-Aktion (statt die eigene Checkbox auf der Anmeldung-Seite aus PROJ-10 zu nutzen) → funktioniert identisch, kein Sonderfall
- Admin fügt ein bereits zugesagtes Mitglied erneut hinzu (z.B. durch eine Race Condition zwischen zwei offenen Admin-Tabs) → kein Duplikat, da dieselbe serverseitige Logik wie bei PROJ-10 verwendet wird
- Zwei Admins bearbeiten gleichzeitig denselben Zeitbereich (einer entfernt ein Mitglied, der andere fügt gleichzeitig ein anderes hinzu) → kein Locking im MVP, Last-Write-Wins, analog zu PROJ-8/9/10
- Admin öffnet die Druckansicht für eine Activity ohne einen einzigen Zeitbereich mit benötigt > 0 → entsprechender Leerzustand statt einer leeren Druckseite
- Ein per Admin hinzugefügtes Mitglied wird zwischenzeitlich deaktiviert (`aktiv=false`) → bleibt im Zeitbereich eingetragen, keine automatische Entfernung (analog zu bestehenden Mustern aus PROJ-10)
- Admin fügt sich selbst oder ein anderes Mitglied zu einem Zeitbereich einer bereits vergangenen Activity hinzu → erlaubt (siehe AC), keine Sonderbehandlung gegenüber kommenden Activities außer dem generell fehlenden Zugriff für Mitglieder (PROJ-10)

## Technical Requirements (optional)
- Security: Admin-Aktionen (Hinzufügen/Entfernen) nur für Admins des eigenen Vereins; serverseitige Prüfung, dass sowohl der Zeitbereich als auch das betroffene Mitglied zum eigenen Verein gehören
- Vermutlich Erweiterung des bestehenden Selbst-Anmeldung-Server-Endpunkts aus PROJ-10 um einen admin-spezifischen Pfad, oder ein neuer, getrennter Endpunkt — technische Entscheidung folgt in `/architecture`
- Druckansicht: reines CSS-Print-Stylesheet auf der bestehenden Übersicht-Seite (kein Server-seitiges PDF, keine neue Route) — Details zur Umsetzung folgen in `/architecture`
- Mitglieder-Suche im "Hinzufügen"-Dialog: durchsuchbare Liste aller Vereinsmitglieder ohne bestehende Zusage zu diesem Zeitbereich — voraussichtlich Wiederverwendung der `mitglieder_namen`-View aus PROJ-10 oder ähnlicher Namensauflösung

## Open Questions
Keine offenen Fragen aus dem Interview — alle Kernentscheidungen wurden getroffen.

## Decision Log

### Product Decisions
| Decision | Rationale | Date |
|----------|-----------|------|
| PROJ-11 erweitert die bestehende Übersicht-Seite aus PROJ-10 um Admin-Aktionen, statt eine neue Verwaltungsseite zu bauen | Nutzerentscheidung im Interview; kleinstmögliche Erweiterung, kein Duplikat der bereits vorhandenen Zeitbereich-Liste mit Zahlen/Namen | 2026-07-15 |
| Mitglied hinzufügen läuft über eine durchsuchbare Auswahlliste aller noch nicht zugesagten Vereinsmitglieder, nicht per Freitext-Suche | Nutzerentscheidung im Interview; robuster bei ähnlichen Namen, analog zur bestehenden Mitgliedersuche (PROJ-7) | 2026-07-15 |
| Entfernen eines Mitglieds durch den Admin erfordert einen Bestätigungsdialog | Nutzerentscheidung im Interview; der Admin handelt hier stellvertretend für ein fremdes Mitglied (nicht die eigene Zusage wie bei PROJ-10), ein Schutz vor Versehen ist daher gerechtfertigt — analog zum bestehenden Lösch-Bestätigungsmuster aus PROJ-8/9 | 2026-07-15 |
| Admin-Hinzufügen wird nicht blockiert, auch wenn der Zeitbereich bereits voll/übervoll ist | Nutzerentscheidung im Interview; konsistent mit dem in PROJ-10 etablierten "nur Warnung, kein Blocker"-Muster | 2026-07-15 |
| Export bewusst in PROJ-11 aufgenommen (nicht auf ein späteres Feature verschoben), aber nur als druckfreundliche Browser-Ansicht, kein CSV-Download | Nutzerentscheidung im Interview; deckt den unmittelbaren Bedarf (Liste am Veranstaltungstag griffbereit) minimal-invasiv ab, ohne Datei-Export-Infrastruktur aufzubauen | 2026-07-15 |
| Druckansicht zeigt nur Namen, keine Kontaktdaten (Telefon/E-Mail) | Nutzerentscheidung im Interview; konsistent mit dem datensparsamen Ansatz aus PROJ-10 — eine druckbare/teilbare Ansicht ist ein höheres Datenschutz-Risiko als eine reine App-Ansicht | 2026-07-15 |
| Drucken läuft direkt über den Browser-Druckdialog von der bestehenden Übersicht-Seite aus, keine eigene Druck-Route | Nutzerentscheidung im Interview; kleinstmögliche Umsetzung, kein zusätzlicher Seiten-/Routing-Aufwand | 2026-07-15 |
| Admin-Aktionen (Hinzufügen/Entfernen) sind auch für bereits vergangene (archivierte) Activities erlaubt | Nutzerentscheidung im Interview; Admins korrigieren häufig nachträglich die tatsächliche Teilnahme — im Unterschied zur Selbstanmeldung aus PROJ-10, die für die Vergangenheit bewusst gesperrt bleibt, da sie keinen Sinn ergibt | 2026-07-15 |

### Technical Decisions
<!-- Added by /architecture -->
| Decision | Rationale | Date |
|----------|-----------|------|

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)
_To be added by /architecture_

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
