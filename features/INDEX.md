# Feature Index

> Central tracking for all features. Updated by skills automatically.

## Status Legend
- **Roadmap** - `/init` done, feature identified in feature map, no spec file yet
- **Planned** - `/write-spec` done, full spec written, architecture not yet designed
- **Architected** - `/architecture` done, tech design approved, ready to build
- **In Progress** - `/frontend` or `/backend` active or completed, not yet in QA
- **In Review** - `/qa` active, testing in progress
- **Approved** - `/qa` passed, no critical/high bugs, ready to deploy
- **Deployed** - `/deploy` done, live in production

## Features

| ID | Feature | Priority | Status | Dependencies | Spec | Created |
|----|---------|----------|--------|---------------|------|---------|
| PROJ-1 | Supabase Infrastruktur (Multi-Tenant + RLS) | P0 | Roadmap | None | - | 2026-07-08 |
| PROJ-2 | Öffentliche Startseite (nicht angemeldet) | P0 | Roadmap | None | - | 2026-07-08 |
| PROJ-3 | Authentifizierung (Register/Login/PW vergessen, Rollen) | P0 | Approved | PROJ-1 | [PROJ-3](PROJ-3-authentifizierung.md) | 2026-07-08 |
| PROJ-4 | Verein-Verwaltung & Voreinstellungen (Tab-Namen) | P0 | Deployed | PROJ-1, PROJ-3 | [PROJ-4](PROJ-4-verein-verwaltung.md) | 2026-07-08 |
| PROJ-5 | Kategorien-Verwaltung | P0 | Deployed | PROJ-4 | [PROJ-5](PROJ-5-kategorien-verwaltung.md) | 2026-07-08 |
| PROJ-6 | Rollen-Verwaltung (Kassier, Kellner, …) | P0 | Deployed | PROJ-4 | [PROJ-6](PROJ-6-rollen-verwaltung.md) | 2026-07-08 |
| PROJ-7 | Mitgliederverwaltung (Admin) | P0 | Roadmap | PROJ-4 | - | 2026-07-08 |
| PROJ-8 | Activities CRUD | P0 | Roadmap | PROJ-5 | - | 2026-07-08 |
| PROJ-9 | Zeitbereiche CRUD | P0 | Roadmap | PROJ-8, PROJ-6 | - | 2026-07-08 |
| PROJ-10 | Mitglied-Anmeldung zu Zeitbereichen | P0 | Roadmap | PROJ-9 | - | 2026-07-08 |
| PROJ-11 | Teilnehmer-Übersicht (Admin) | P0 | Roadmap | PROJ-9, PROJ-10 | - | 2026-07-08 |
| PROJ-12 | Profil-Verwaltung | P0 | Roadmap | PROJ-3 | - | 2026-07-08 |
| PROJ-13 | Mitglieder-Ansicht/Suche | P0 | Roadmap | PROJ-7 | - | 2026-07-08 |
| PROJ-14 | Kalender-Export (ICS, 1-Klick) | P0 | Roadmap | PROJ-10 | - | 2026-07-08 |

<!-- Add features above this line -->

## Next Available ID: PROJ-15
