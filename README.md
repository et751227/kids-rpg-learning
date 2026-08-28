# Kids RPG Learning

An RPG-style English vocabulary learning product for young learners.

## Product Direction

`Kids RPG Learning` turns English vocabulary practice into an RPG-style learning loop: exploration, practice, battles, character growth, history and future vocabulary mastery views.

The product is no longer a browser-local prototype. Material features follow one integrated product contract:

`User outcome -> canonical learning evidence -> derived learner/progression state -> API contract -> child-facing UX -> runtime/release verification`

For internal governed development, the canonical product/capability execution map is maintained in `et751227/personal-governance-hub` at:

`registries/kids-learning-capability-map.yaml`

That map controls the current product objective, active capability, dependency classification and return-to-roadmap semantics. Local issues are implementation/design records; they do not replace the product roadmap.

## Current Runtime Architecture

Production separates the public child-facing application from canonical learner state:

```text
Child / Family
  -> Vercel application + family session
  -> protected learning proxy / ingress
  -> life-core learning API
  -> PostgreSQL canonical learner data
```

Canonical runtime data includes vocabulary/question evidence, per-question attempts, player progression/stats and battle results. Browser state may still be used for transient interaction/UI concerns, but it is not the authoritative store for material learner progression.

Secrets, private learner records and private runtime configuration are intentionally not stored in this public repository.

## Capability Model

| Capability | Product responsibility |
| --- | --- |
| Family access/session | One family login protects learner APIs and child-facing routes. |
| Learning content | Maintainable canonical vocabulary/question content. |
| Question selection | Shared question path for learning modes; future weighting/repeat control belongs here. |
| Question-attempt evidence | Durable per-player, per-vocabulary learning evidence. |
| Village | Foundational low-friction vocabulary practice. |
| Forest | Battle learning where canonical attempts drive combat and progression. |
| Character | Persistent Level/EXP/STR/VIT/AGI progression and stat reset. |
| Castle | Future battle/session history read model; not combat authority. |
| Word Codex | Future vocabulary learner-state read model derived from attempt evidence. |

The architectural dependency is intentionally evidence-first:

```text
Vocabulary / Question Content
  -> Question Selection
  -> Question Attempt Evidence
  -> Learner State / Progression
  -> Village / Forest experiences
  -> Castle / Word Codex read models
```

## Current Product Objective

The current governed objective is **Forest learning/progression closure**.

Forest work includes its intrinsic Data/API/UX/runtime dependencies, but a shared-control blocker must not silently become the new product roadmap. Once a blocker is removed, execution returns to the Forest capability until its automated production semantics and required user acceptance are complete.

The Word Codex learner-state capability is recorded for future compatibility but its UI is intentionally deferred.

## Confirmed Tech Stack

- React 18
- Vite 4
- React Router 6
- Tailwind CSS 3
- Node/Vercel serverless learning proxy
- PostgreSQL-backed canonical learning runtime on life-core
- Protected public-to-private learning API ingress
- Web Speech API for pronunciation support

## Application Structure

The UI uses `HashRouter` and RPG-style areas/modes. Route/page names may evolve, so architecture should be reasoned from capabilities rather than assuming a route is itself a system boundary.

Current user-facing concepts include:

- World map / navigation
- Village-style vocabulary practice
- Forest battle learning
- Character progression
- Records/history surfaces
- Future Castle and Word Codex read models

## Data and Authority Boundaries

The following rules are architectural invariants:

- Per-question attempts remain the canonical vocabulary-learning evidence.
- Battle summaries are additive; they must not replace question-level evidence.
- Material EXP/Level/battle outcomes are server-authoritative, not trusted from browser submissions.
- Character progression reads/writes canonical learner state.
- Castle is a history/read-model consumer, not combat authority.
- Word discovery/mastery should be derived from canonical evidence rather than a second independent client flag.
- Production secrets and real learner data stay outside this public repository.

## Development

```bash
npm install
npm run dev
```

Build:

```bash
npm run build
```

Preview production build:

```bash
npm run preview
```

## Public Portfolio Boundary

This repository can demonstrate the frontend/product implementation, but public examples should use mock or synthetic learner data. Do not commit credentials, private service configuration, real learner records or unlicensed assets.

Before presenting it as a formal public portfolio demo, review screenshots/media licensing and ensure any demo dataset is synthetic.

## Resume-safe Summary

Designed an RPG-style English vocabulary learning product that connects child-facing practice and battle experiences to canonical question-attempt evidence, persistent progression and protected backend services. The project demonstrates React interaction design, learning-product architecture, API/data authority boundaries, runtime integration and AI-assisted governed development.
