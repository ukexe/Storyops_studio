# StoryOps Studio frontend

This directory contains the Next.js 16 frontend for StoryOps Studio.

Use Node.js 22.13 or newer:

```bash
npm ci
cp .env.local.example .env.local
npm run dev
```

Cloudflare validation and deployment:

```bash
npm run cf-typegen
npm run cf-typecheck
npm run build:worker
npm run dry-run
npm run deploy
```

Release checks:

```bash
npm audit --audit-level=moderate
npm run lint
npm test
npm run typecheck
npm run cf-typecheck
npm run build:worker
npm run dry-run
```

See the [repository README](../README.md) for full setup, architecture,
deployment, and demo instructions.

Live URL: [storyops.ukexe06.workers.dev](https://storyops.ukexe06.workers.dev)
