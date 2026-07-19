# PROJ-17: Info-Button (Activities) & About-Seite

## Status: Deployed
**Created:** 2026-07-19
**Last Updated:** 2026-07-19

## Deployment
- **Production URL:** https://simpliplan.toolies.eu/about
- **Deployed:** 2026-07-19 via GitHub Actions-Äquivalent (manueller SSH-Pull + `npm ci` + `npm run build` + `pm2 reload SimpliPlan` auf dem Hetzner-Server)
- Server-`HEAD` (`1d9afa9`) verifiziert identisch zu lokalem `HEAD`; `curl` gegen die Produktions-URL liefert 200 mit "SimpliPlan 2.0" im HTML

> Hinweis: Dieses Feature wurde ohne vorherigen `/write-spec`-Durchlauf direkt implementiert (kleine, rein statische UI-Ergänzung, mit dem Nutzer abgestimmt). Dieser Spec wurde nachträglich angelegt, um Acceptance Criteria für QA/Deploy dokumentieren zu können.

## Dependencies
- None (rein statische Seite, kein Datenzugriff)

## User Stories
- Als Nutzer möchte ich auf der Activities-Seite über einen Info-Button erfahren können, was SimpliPlan ist und wie ich Kontakt aufnehmen kann.

## Out of Scope
- Eigener Header/Zurück-Pfeil auf der About-Seite (Rückkehr erfolgt ausschließlich über den "OK"-Button)
- Mehrsprachigkeit
- Dynamische Inhalte (Kontakt/Text sind hart codiert, analog zur alten Adalo-Startscreen-Seite)

## Acceptance Criteria

**Format:** Angenommen [Vorbedingung] / Wenn [Aktion] / Dann [Ergebnis]

- [ ] Angenommen ein Nutzer ist auf `/activities`, dann sieht er oben links in der Titelleiste ein Info-Icon
- [ ] Angenommen der Nutzer klickt auf das Info-Icon, dann gelangt er zu `/about`
- [ ] Angenommen ein Nutzer (auch ohne Login) ruft `/about` direkt über die URL auf, dann wird die Seite angezeigt (kein Redirect, kein Auth-Check)
- [ ] Angenommen der Nutzer ist auf `/about`, dann sieht er: Logo, Titel "SimpliPlan 2.0", Tagline, "Kontakt:", E-Mail-Link `office@toolies.eu`, Website-Link `https://simpliplan.webnode.page/`, Button "OK"
- [ ] Angenommen der Nutzer klickt auf den E-Mail-Link, dann öffnet sich ein `mailto:`-Link
- [ ] Angenommen der Nutzer klickt auf den Website-Link, dann öffnet sich `https://simpliplan.webnode.page/` in einem neuen Tab
- [ ] Angenommen der Nutzer klickt auf "OK", dann gelangt er zurück zu `/activities`

## Tech Notes (nachträglich dokumentiert)
- `src/app/activities/page.tsx`: Titelleiste umgebaut auf `grid-cols-[2rem_1fr_2rem]` (analog zu `kategorien/page.tsx`), Info-Icon (`lucide-react`) links, Link zu `/about`
- `src/app/about/page.tsx`: neue, statische Client-freie Seite (kein `"use client"`, kein Supabase-Zugriff), Logo `public/logo.jpg` in `max-w-[307px]` Container (Ausgangsgröße `max-w-sm` um 20% verkleinert)

---

## QA Test Results

**Tested:** 2026-07-19
**App URL:** http://localhost:3000 (Production-Build via `npm run build && npm run start` für die manuellen/skriptgesteuerten Checks; `npm run dev` für die Playwright-E2E-Suite via `playwright.config.ts`)
**Tester:** QA Engineer (AI)

### Acceptance Criteria Status

#### AC-1: Info-Icon in der Activities-Titelleiste
- [x] Code-Review: identisches Grid-Muster (`grid-cols-[2rem_1fr_2rem]`) wie im bereits produktiven `kategorien/page.tsx`-Header, Info-Icon links, Link zu `/about`
- [ ] BUG: Kein authentifizierter End-to-End-Klicktest möglich — `/activities` leitet ohne Login clientseitig auf `/` um (PROJ-3-Guard) und es liegen keine Supabase-Testzugangsdaten/Service-Role-Key vor (Zugriff auf `.env*` ist projektseitig per `.claude/settings.json` gesperrt). Kein Bug, sondern eine Testabdeckungslücke — siehe Empfehlung unten.

#### AC-2: Klick auf Info-Icon navigiert zu `/about`
- [x] Verifiziert über den `href`/Link-Ziel im Code (identisch zum manuell/automatisiert geprüften `/about`-Ziel)

#### AC-3: `/about` ohne Login erreichbar
- [x] Playwright: `GET /about` → Status 200, keine Redirect, `next build` weist die Route als `○ (Static)` aus (kein serverseitiger Auth-Gate)

#### AC-4: Inhalt der `/about`-Seite
- [x] Logo (`img[alt="SimpliPlan Logo"]`) sichtbar
- [x] Titel "SimpliPlan 2.0" sichtbar
- [x] Tagline "Clevere Planung und Organisation für Clubabende und erfolgreiche Activities" sichtbar
- [x] "Kontakt:" sichtbar
- [x] E-Mail-Link `mailto:office@toolies.eu` vorhanden
- [x] Website-Link `https://simpliplan.webnode.page/` vorhanden, öffnet in neuem Tab (`target="_blank"`, `rel="noopener noreferrer"`)
- [x] "OK"-Button vorhanden

#### AC-5: E-Mail-Link öffnet `mailto:`
- [x] `href="mailto:office@toolies.eu"` verifiziert

#### AC-6: Website-Link öffnet neuen Tab
- [x] `target="_blank"` + `rel="noopener noreferrer"` verifiziert

#### AC-7: "OK" navigiert zurück zu `/activities`
- [x] `href="/activities"` verifiziert (bewusst nicht über die tatsächliche Post-Klick-URL getestet, da diese ohne Login durch den PROJ-3-Auth-Guard auf `/` weiterspringt — das ist Verhalten von `/activities`, nicht von diesem Button)

### Edge Cases Status

#### EC-1: Responsive (375px / 768px / 1440px)
- [x] Alle drei Breakpoints per Screenshot geprüft — Layout bleibt zentriert, kein Overflow, Logo/Text/Button skalieren sauber (Container `max-w-[600px]`)

#### EC-2: Direkter URL-Aufruf ohne vorherige Navigation über den Info-Button
- [x] Funktioniert (statische Route, kein Abhängigkeit vom Navigationsursprung)

### Security Audit Results
- [x] Keine Formulareingaben, keine Query-Parameter, kein Supabase-/DB-Zugriff auf dieser Seite → keine XSS-/Injection-Angriffsfläche
- [x] Keine Auth-Daten oder sensiblen Informationen im Client-Bundle (statischer Text, öffentliche Kontaktdaten)
- [x] Externer Link (`webnode.page`) korrekt mit `rel="noopener noreferrer"` abgesichert
- [x] Keine Konsolenfehler beim Laden der Seite (Playwright `console --errors` leer)

### Regression Testing
- [x] `npm test` (Vitest): 95/95 bestanden, keine Regressionen
- [x] `npm run build`: erfolgreich, TypeScript-Check sauber, `/about` korrekt als neue statische Route gelistet
- [x] `npm run test:e2e` (volle Suite, 52 Tests): 50 direkt bestanden, 2 initiale Fehlschläge (`PROJ-4-verein-verwaltung`, `PROJ-3-authentifizierung`) — beide bei isoliertem Re-Run (ohne die 6-fache Worker-Parallelität) grün; nicht mit PROJ-17 in Zusammenhang, keine der geänderten Dateien betroffen

### Bugs Found

Keine Critical/High/Medium/Low-Bugs.

**Hinweis (keine Bug-Severity, sondern Testabdeckungs-Lücke):** Der Info-Icon-Klickpfad direkt auf `/activities` konnte mangels Test-Account nicht end-to-end (eingeloggt) verifiziert werden — nur per Code-Review gegen das bereits deployte, identische Header-Muster. Empfehlung: nach Deploy einmal manuell auf `https://simpliplan.toolies.eu/activities` gegenprüfen.

### Summary
- **Acceptance Criteria:** 7/7 (davon 1 nur per Code-Review statt Live-Login verifiziert)
- **Bugs Found:** 0
- **Security:** Pass (keine Angriffsfläche, rein statischer Inhalt)
- **Production Ready:** YES
- **Recommendation:** Deploy — mit der Empfehlung, den Info-Button nach dem Go-Live einmal eingeloggt in Produktion zu bestätigen
