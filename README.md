# Kids RPG Learning

An RPG-style English vocabulary learning tool for young learners.

## Project Overview

`Kids RPG Learning` is an interactive learning tool that turns English vocabulary practice into RPG-style exploration, missions, battles, levels, rewards, and records.

The project is based on a real learning scenario: vocabulary memorization can feel repetitive, so the goal is to make practice more engaging through game-like interaction and a maintainable question bank.

## Current Status

This repository is a public portfolio candidate.

It already contains the core application structure and gameplay flow, but it still needs endpoint cleanup, mock data preparation, and asset review before it should be treated as a formal portfolio demo.

## Confirmed Tech Stack

- React 18
- Vite 4
- React Router 6
- Tailwind CSS 3
- Browser `localStorage` for local progress and challenge records
- Web Speech API usage for pronunciation support
- Vercel-compatible build script

## Application Structure

The application uses `HashRouter` and currently defines four main routes:

| Route | Page | Purpose |
| --- | --- | --- |
| `/` | `WorldMap` | RPG-style world map and mode entry |
| `/practice` | `PracticeMode` | Vocabulary spelling practice |
| `/challenge` | `ChallengeMode` | Battle-style challenge mode |
| `/records` | `RecordsPage` | Challenge result records |

## Implemented Capabilities

- World map navigation
- Practice mode for Chinese-to-English vocabulary spelling
- On-screen alphabet input
- Answer validation and feedback
- EXP and level progression
- HP-style feedback loop
- Challenge battle mode with monster HP and timed answer impact
- Accuracy, wrong-answer list, coin reward, and time-used record structure
- Local challenge history stored in browser storage
- Basic pronunciation support through browser speech synthesis

## Problem and Design Direction

| Problem | Design Direction |
| --- | --- |
| Vocabulary practice can become repetitive | Use missions, levels, and rewards to increase engagement |
| Learning content changes over time | Keep the vocabulary bank extensible |
| Practice progress needs to be visible | Track level, EXP, challenge records, accuracy, and mistakes |
| Content should be maintainable | Separate vocabulary data, difficulty, categories, and progress |
| Young learners may need guided interaction | Use large buttons, visual feedback, and game-like flow |

## Portfolio Value

This project demonstrates:

- Frontend interaction design
- Requirement breakdown from a real-life use case
- Product thinking for educational tools
- Data model planning for vocabulary, missions, progress, and records
- Browser-side state handling
- Game-like feedback loop design
- Iterative development with AI / Agent assistance
- Turning a practical learning need into a usable web application

## Setup

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

## Portfolio Readiness Checklist

Before using this as a formal portfolio item, complete the following:

- [ ] Replace direct external question-source endpoint usage with a safer configuration pattern.
- [ ] Provide mock or synthetic vocabulary data for public demo use.
- [ ] Add `.env.example` if environment-based configuration is introduced.
- [ ] Add screenshots or a short demo GIF.
- [ ] Add a deployed demo link after endpoint and asset review.
- [ ] Review image, background, icon, audio, and font licenses.
- [ ] Confirm the repository contains no private learner records or private service URLs.
- [ ] Add a short data model note for vocabulary, challenge records, and progress.

## Data Boundary

This repository should only use mock or synthetic learning data when presented publicly.

Do not include private learner records, real personal information, credentials, private service URLs, or unlicensed assets.

## Resume-safe Summary

Designed an RPG-style English vocabulary learning tool that transforms memorization practice into exploration, missions, battle challenges, levels, and reward flows. The project demonstrates React frontend interaction design, requirement analysis, educational product thinking, browser-side state handling, data model planning, and AI-assisted development workflow.
