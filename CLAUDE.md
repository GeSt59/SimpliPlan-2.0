Alle Skills und MCP Server werden immer auf Projektebene installiert.

# Karpathys Regeln

Abwägung: Diese Richtlinien legen Wert auf Vorsicht statt auf Geschwindigkeit.
Bei trivialen Aufgaben ist Urteilsvermögen gefragt.

- \*\*1. Nachdenken vor dem Programmieren: Keine Annahmen treffen. Unklare Unklarheiten nicht verbergen. Abwägungen offenlegen. Vor der Implementierung: - Annahmen explizit formulieren. Bei Unsicherheit nachfragen. - Mehrere Interpretationsmöglichkeiten präsentieren. - Einfachere Ansätze nennen. - Unklare Stellen anhalten. Unklare Stellen benennen.
- \*\*2. Einfachheit zuerst: Minimaler Code, der das Problem löst. Nichts Spekulatives. - Keine zusätzlichen Funktionen. - Keine Abstraktionen für einmalig verwendeten Code. - Keine nicht angeforderte „Flexibilität“. - Keine Fehlerbehandlung für unmögliche Szenarien. - Wenn 200 Zeilen auf 50 reduziert werden könnten, neu schreiben.
- \*\*3. Gezielte Änderungen: Nur das Nötigste ändern. Nur eigene Fehler beheben. - Angrenzenden Code oder die Formatierung nicht „verbessern“. - Refaktoriere nur funktionierende Codeabschnitte. - Behalte den bestehenden Stil bei, auch wenn du es anders machen würdest. - Wenn du toten Code findest, erwähne ihn – lösche ihn nicht.
- \*\*4. Zielorientierte Ausführung: Definiere Erfolgskriterien. Wiederhole den Vorgang, bis er bestätigt ist. Wandle Aufgaben in überprüfbare Ziele um: - „Validierung hinzufügen“ → „Tests schreiben und erfolgreich abschließen“ - „Fehler beheben“ → „Fehler in einem Test reproduzieren und beheben“ - „X refaktorisieren“ → „Sicherstellen, dass die Tests vorher und nachher erfolgreich sind“

# AI Coding Starter Kit

> A Next.js template with an AI-powered development workflow using specialized skills for Requirements, Architecture, Frontend, Backend, QA, and Deployment.

## Tech Stack

- **Framework:** Next.js 16 (App Router), TypeScript
- **Styling:** Tailwind CSS + shadcn/ui (copy-paste components)
- **Backend:** Supabase (PostgreSQL + Auth + Storage) - optional
- **Deployment:** Vercel
- **Validation:** Zod + react-hook-form
- **State:** React useState / Context API

## Project Structure

```
src/
  app/              Pages (Next.js App Router)
  components/
    ui/             shadcn/ui components (NEVER recreate these)
  hooks/            Custom React hooks
  lib/              Utilities (supabase.ts, utils.ts)
features/           Feature specifications (PROJ-X-name.md)
  INDEX.md          Feature status overview
docs/
  PRD.md            Product Requirements Document
  production/       Production guides (Sentry, security, performance)
```

## Development Workflow

1. `/requirements` - Create feature spec from idea
2. `/architecture` - Design tech architecture (PM-friendly, no code)
3. `/frontend` - Build UI components (shadcn/ui first!)
4. `/backend` - Build APIs, database, RLS policies
5. `/qa` - Test against acceptance criteria + security audit
6. `/deploy` - Deploy to Vercel + production-ready checks

## Feature Tracking

All features tracked in `features/INDEX.md`. Every skill reads it at start and updates it when done. Feature specs live in `features/PROJ-X-name.md`.

## Key Conventions

- **Feature IDs:** PROJ-1, PROJ-2, etc. (sequential)
- **Commits:** `feat(PROJ-X): description`, `fix(PROJ-X): description`
- **Single Responsibility:** One feature per spec file
- **shadcn/ui first:** NEVER create custom versions of installed shadcn components
- **Human-in-the-loop:** All workflows have user approval checkpoints

## Build & Test Commands

```bash
npm run dev        # Development server (localhost:3000)
npm run build      # Production build
npm run lint       # ESLint
npm run start      # Production server
```

## Product Context

@docs/PRD.md

## Feature Overview

@features/INDEX.md
