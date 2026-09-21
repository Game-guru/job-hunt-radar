# Job Hunt Radar

An app that automatically collects job listings, scores them against what I want,
and tracks my applications.

Built while learning TypeScript. Currently at **v0**.

---

## Running it

```bash
npm run scrape      # scrape jobs and print them
npm run typecheck   # check for type errors
```

If `npm run scrape` fails the very first time, run this once:

```bash
npx playwright install chromium
```

---

## What's here so far

```
job-hunt-radar/
├── src/
│   └── scrape.ts      <- the whole app right now. Start reading here.
├── package.json       <- project name, dependencies, the npm run commands
├── tsconfig.json      <- TypeScript settings
└── .gitignore         <- files git should ignore
```

---

## The build plan

Each version works on its own. Finish one before starting the next.

| Version | What it adds | What I learn |
|---------|--------------|--------------|
| **v0** ← here | Scrape one site, print to terminal | JavaScript basics, Playwright, selectors |
| v1 | Save to a database, detect new listings | data storage, avoiding duplicates |
| v2 | A web page to browse and track applications | React, frontend, APIs |
| v3 | Runs automatically every morning, deployed online | scheduled jobs, deployment |
| v4 | Playwright tests, match scoring, stats chart | automated testing, algorithms |

---

## Rules I'm following when scraping

1. Check `robots.txt` before scraping any new site
2. Never scrape sites that forbid it in their terms (LinkedIn does)
3. Prefer an official API or RSS feed when one exists
4. Add a delay between requests — don't hammer anyone's server
5. Personal use only, don't republish someone else's data

---

## Notes to self

- `headless: false` in `scrape.ts` makes the browser visible. Best debugging tool there is.
- Errors are information, not failure. Read them properly before changing anything.
- Finish the exercises at the bottom of `scrape.ts` before moving to v1.
