# Product Requirements Document

## Vision
SimpliPlan hilft Vereinen (z.B. Lions Clubs), den Helfer-Bedarf bei Activities/Events zeitlich exakt zu planen: Admins legen fest, wann wie viele Personen in welcher Rolle gebraucht werden, Mitglieder sagen bequem zu und behalten ihre Termine im eigenen Kalender. Die App wird von einer bestehenden Adalo-Anwendung migriert, nachdem dort ein Datenschutzvorfall (Cross-Tenant-Datenleck zwischen Vereinen) aufgetreten ist.

## Target Users
- **Mitglieder** – sagen Zeitbereichen/Rollen per Klick zu, sehen ihre Einteilungen, exportieren Termine in den eigenen Kalender, suchen Vereinskollegen.
- **Admins** (pro Verein) – legen Activities, Kategorien, Rollen und Zeitbereiche an, verwalten Mitglieder, behalten die Teilnehmerzahl im Blick.
- **SuperUser** (Betreiber) – weist Admin-Rechte pro Verein zu; zentrale Kontrollinstanz gegen Rechteausweitung.

## Core Features (Roadmap)

| Priority | Feature | Status |
|----------|---------|--------|
| P0 (MVP) | Supabase Infrastruktur (Multi-Tenant + RLS) | Planned |
| P0 (MVP) | Öffentliche Startseite (nicht angemeldet) | Planned |
| P0 (MVP) | Authentifizierung (Register/Login/PW vergessen, Rollen) | Planned |
| P0 (MVP) | Verein-Verwaltung & Voreinstellungen (Tab-Namen) | Planned |
| P0 (MVP) | Kategorien-Verwaltung | Planned |
| P0 (MVP) | Rollen-Verwaltung (Kassier, Kellner, …) | Planned |
| P0 (MVP) | Mitgliederverwaltung (Admin) | Planned |
| P0 (MVP) | Activities CRUD | Planned |
| P0 (MVP) | Zeitbereiche CRUD | Planned |
| P0 (MVP) | Mitglied-Anmeldung zu Zeitbereichen | Planned |
| P0 (MVP) | Teilnehmer-Übersicht (Admin) | Planned |
| P0 (MVP) | Profil-Verwaltung | Planned |
| P1 | Meine Einteilungen (Mitglied-Übersicht) | Planned |
| P0 (MVP) | Mitglieder-Ansicht/Suche | Planned |
| P0 (MVP) | Kalender-Export (ICS, 1-Klick) | Planned |

Alle Features sind P0, da es sich um eine 1:1-Migration einer bereits produktiven App handelt — kein abgespecktes MVP.

## Success Metrics
- Volle Feature-Parität zur Adalo-App vor Abschaltung des Altsystems
- Keine Cross-Tenant-Datenzugriffe (verifiziert durch RLS-Tests)
- Migration bestehender Vereine/Mitglieder ohne Datenverlust

## Constraints
- Backend: Supabase (Postgres + Auth + Storage)
- Design-System: siehe `docs/design-system.md` (SimpliPlan CI, aus `public/SimpliPlan PRD.rtf`)
- Multi-Tenant: strikte Datentrennung pro Verein via Row-Level-Security ist nicht verhandelbar (Ursache des Adalo-Sicherheitsvorfalls)
- Bestehende, produktive Nutzerbasis — Migration darf keine Daten verlieren
- 1 Account = 1 Verein (keine Mehrfachmitgliedschaft in dieser Version)

## Non-Goals
- Mehrfachmitgliedschaft in mehreren Vereinen gleichzeitig
- Native Mobile Apps (nur responsive Web)
- Echtes Bezahl-/Kassensystem (Zahlungsabwicklung, Rechnungswesen) — "Kassier" bleibt nur eine wählbare Rollen-Bezeichnung ohne Zahlungslogik

---

Use `/requirements` to create detailed feature specifications for each item in the roadmap above.
