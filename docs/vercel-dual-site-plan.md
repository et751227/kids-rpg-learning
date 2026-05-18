# Vercel Dual Site Deployment Plan

## Goal

Keep the child-facing production site stable while creating a separate portfolio-facing site from the same repository.

## Branch Roles

| Branch | Role | Expected Data Source |
| --- | --- | --- |
| `main` | Production site for daily learning use | Real question source configured in production environment |
| `portfolio` | Portfolio/demo site | Mock vocabulary data or demo-only question source |
| `portfolio-safe-question-source` | PR/refactor branch | Temporary review branch |

## Recommended Vercel Projects

| Vercel Project | Git Branch | Purpose |
| --- | --- | --- |
| existing project | `main` | Keep current production site unchanged |
| `kids-rpg-learning-portfolio` | `portfolio` | Public portfolio/demo site |

## Environment Variable Strategy

### Production learning site

Set the real question source only in the existing production Vercel project:

```env
VITE_QUESTION_API_URL=<real question API URL>
```

### Portfolio site

For the portfolio Vercel project, either:

1. Do not set `VITE_QUESTION_API_URL`, so the app can use mock vocabulary fallback.
2. Or set it to a demo-only endpoint that contains no private learning records.

## Safety Rules

- Do not point the portfolio site to the real learning dataset.
- Do not merge untested changes into `main` while the production site is in active use.
- Do not expose private learner records, family data, credentials, or private service URLs.
- Review image, font, audio, and background licenses before using the portfolio site publicly.

## Validation Checklist

Before using the portfolio site publicly:

- [ ] Confirm `/practice` loads questions.
- [ ] Confirm `/challenge` loads questions.
- [ ] Confirm at least one challenge turn can complete.
- [ ] Confirm browser storage records work.
- [ ] Confirm the portfolio deployment does not call the real production question source.
- [ ] Confirm no real personal or private learning data is visible.

## Current State

The `portfolio` branch was created from the question-source refactor branch. It centralizes question loading through `src/services/questionSource.js` and adds mock vocabulary data in `src/data/mockVocabulary.js`.

The existing production `main` branch is not changed by this plan.
