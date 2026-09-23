# Job Hunt Radar

An app that automatically collects job listings, scores them against what I want,
and tracks my applications.

Built while learning TypeScript. Currently at **v1**.

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

## Choosing a browser

Near the top of `src/scrape.ts`:

```ts
const USE_EDGE = false;      // true = use my installed Microsoft Edge
const SHOW_BROWSER = false;  // true = watch the browser window while it works
```

**Default (recommended):** Playwright's own bundled Chromium. It was downloaded by
`npx playwright install chromium` and lives in `AppData\Local\ms-playwright`.
It is completely separate from the Chrome/Edge I browse with — that is the point.
Same behaviour on every machine.

**Using Edge instead:** set `USE_EDGE = true`. It works, but only with a visible
window. This machine's Edge is locked down by a system policy:

```
ERROR: Headless mode is disallowed by the system admin.
```

The code forces Edge to visible mode automatically so it doesn't crash.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| `Executable doesn't exist` | Run `npx playwright install chromium` |
| `Headless mode is disallowed by the system admin` | You set `USE_EDGE = true` — either set it back to `false`, or leave it visible |
| Scraper finds 0 jobs | The site's HTML changed. Set `SHOW_BROWSER = true` and watch what actually loads |
| Red squiggles in editor but it runs fine | Type errors. Run `npm run typecheck` to see them all |

---

## What's here so far

```
job-hunt-radar/
├── src/
│   ├── main.ts        <- the conductor. `npm run scrape` starts here.
│   ├── scrape.ts      <- gets jobs off the website. Nothing else.
│   └── db.ts          <- saves jobs, detects new ones. Nothing else.
├── jobs.db            <- the database (created on first run, git-ignored)
├── package.json       <- project name, dependencies, the npm run commands
├── tsconfig.json      <- TypeScript settings
└── .gitignore         <- files git should ignore
```

Three files, one responsibility each. Change how scraping works and only
`scrape.ts` is touched. Change how results are displayed and only `main.ts` is.

**Dependencies: Playwright and TypeScript. That's it.** The database is
`node:sqlite`, built into Node 24 — nothing to install.

---

## What it does now

```
Run 1:  100 NEW jobs
Run 2:  No new jobs since last run.
```

The database remembers what it has seen, so every run answers the only
question that matters: **what changed?**

Duplicates are handled by the database itself — `link` is the PRIMARY KEY, and
`INSERT OR IGNORE` skips anything already stored. No duplicate-checking code.

---

## The build plan

Each version works on its own. Finish one before starting the next.

| Version | What it adds | What I learn |
|---------|--------------|--------------|
| **v0** ✅ | Scrape one site, print to terminal | JavaScript basics, Playwright, selectors |
| **v1** ← here | Save to a database, detect new listings | SQL, primary keys, transactions, modules |
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
# job-hunt-radar
