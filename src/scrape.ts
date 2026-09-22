/*
 * JOB HUNT RADAR - v0
 * ===================
 *
 * What this file does:
 *   Opens a real web browser, visits a job listings page, reads every job
 *   off the page, and prints them to your terminal.
 *
 * Run it with:   npm run scrape
 *
 * Read the comments top to bottom. Each numbered section teaches one idea.
 */

// ---------------------------------------------------------------------------
// 1. IMPORTS
// ---------------------------------------------------------------------------
// "import" pulls in code that someone else wrote so we can use it.
// "chromium" is a controllable version of the Chrome browser.
// The { } braces mean: grab the specific thing named "chromium" out of that package.

import { chromium } from '@playwright/test';

// ---------------------------------------------------------------------------
// 2. DESCRIBING OUR DATA (this is the "TypeScript" part)
// ---------------------------------------------------------------------------
// A "type" is a description of the shape of some data.
// We are saying: a Job is an object with these five text fields.
//
// Plain JavaScript would let you write job.compnay (typo) and fail silently
// at 3am. TypeScript catches it instantly in your editor. That is the entire
// point of TypeScript - it is JavaScript plus a spell-checker for your data.

type Job = {
  title: string;
  company: string;
  location: string;
  postedDate: string;
  link: string;
};

// ---------------------------------------------------------------------------
// 3. WHERE WE ARE SCRAPING
// ---------------------------------------------------------------------------
// This site exists specifically for people learning to scrape. It is safe,
// legal, and it will not change or block you while you are learning.
//
// IMPORTANT: Do not point this at LinkedIn. They forbid scraping in their
// terms of service and actively block it. Learn the technique here first,
// then move to sites with a public API or a jobs RSS feed.

const TARGET_URL = 'https://realpython.github.io/fake-jobs/';

// ---------------------------------------------------------------------------
// 4. WHICH BROWSER TO USE
// ---------------------------------------------------------------------------
// Playwright downloaded its OWN private copy of Chromium when you ran
// `npx playwright install chromium`. It lives in AppData and has nothing to do
// with the Chrome or Edge you browse the web with.
//
// That is on purpose: a bundled browser behaves identically on your laptop, on
// a colleague's Mac, and on a server. No "works on my machine" surprises.
//
// Set USE_EDGE to true if you would rather drive your installed Microsoft Edge.
//
// NOTE FOR THIS MACHINE: your Edge is managed by a system policy that blocks
// headless (invisible) mode. So if USE_EDGE is true, the browser window MUST
// be visible. The code below handles that for you automatically.

const USE_EDGE = true;

// Show the browser window while it works?
// Watching it is the best debugging tool you have - try SHOW_BROWSER = true.
const SHOW_BROWSER = true;

// ---------------------------------------------------------------------------
// 5. THE MAIN FUNCTION
// ---------------------------------------------------------------------------
// "async" means this function does slow things (like waiting for a website).
// Inside an async function you use "await" to mean "pause here until this
// finishes, then carry on".
//
// Almost everything in Playwright needs await, because everything involves
// waiting for a browser. Forgetting await is the #1 beginner bug - your code
// races ahead before the page has loaded and you get empty results.

async function scrapeJobs(): Promise<Job[]> {
  // -- 5a. Start the browser --------------------------------------------
  // headless: true  = run invisibly in the background (fast)
  // headless: false = watch the browser do it (great for learning/debugging)
  //
  // Edge here is forced to visible mode, because this machine's policy
  // refuses to launch it headless.
  const browser = await chromium.launch({
    channel: USE_EDGE ? 'msedge' : undefined,
    headless: USE_EDGE ? false : !SHOW_BROWSER,
  });

  console.log(USE_EDGE ? 'Using: your installed Microsoft Edge' : 'Using: Playwright bundled Chromium');

  // A "page" is one browser tab.
  const page = await browser.newPage();

  console.log(`Opening ${TARGET_URL} ...`);

  // -- 5b. Go to the page ------------------------------------------------
  // waitUntil: 'domcontentloaded' means "carry on once the HTML has arrived",
  // rather than waiting for every image and advert to finish loading.
  await page.goto(TARGET_URL, { waitUntil: 'domcontentloaded' });

  // -- 5c. Find the things we want ---------------------------------------
  // A "locator" is Playwright's way of saying "the elements matching this
  // description". It does NOT grab them immediately - it is a recipe that
  // gets re-checked each time you use it. That is why Playwright is reliable
  // on pages that load slowly.
  //
  // '.card-content' means "any element with class card-content".
  // On this site each job listing sits inside one of those.
  const jobCards = page.locator('.card-content');

  // Wait until at least the first card actually exists before reading.
  await jobCards.first().waitFor();

  const count = await jobCards.count();
  console.log(`Found ${count} job cards.\n`);

  // -- 5d. Read each card ------------------------------------------------
  const jobs: Job[] = [];

  for (let i = 0; i < count; i++) {
    // .nth(i) picks the card at position i. Counting starts at 0, not 1.
    const card = jobCards.nth(i);

    // Narrow the search to inside this one card, then read its text.
    // .innerText() returns the visible text of an element.
    const title = await card.locator('h2.title').innerText();
    const company = await card.locator('h3.subtitle').innerText();
    const location = await card.locator('p.location').innerText();
    const postedDate = await card.locator('time').innerText();

    // For links we want the href attribute, not the text.
    // getByText('Apply') finds the link labelled "Apply".
    const link = await card.getByText('Apply').getAttribute('href');

    jobs.push({
      // .trim() removes stray spaces and line breaks from the edges.
      title: title.trim(),
      company: company.trim(),
      location: location.trim(),
      postedDate: postedDate.trim(),
      // ?? means "if the left side is null or undefined, use the right side".
      // getAttribute can return null, so we guard against that.
      link: link ?? 'no link found',
    });
  }

  // -- 5e. Always close the browser --------------------------------------
  // If you forget this, invisible Chrome processes pile up and eat your RAM.
  await browser.close();

  return jobs;
}

// ---------------------------------------------------------------------------
// 6. PRINTING THE RESULTS
// ---------------------------------------------------------------------------
// Splitting "get the data" from "show the data" into two functions is a habit
// worth forming early. Later, v1 will swap this out for "save to database"
// without touching the scraping code at all.

function printJobs(jobs: Job[]): void {
   const texasJobs = jobs.filter((job) => job.location.includes('TX'));
  for (const job of texasJobs) {
    console.log(`${job.title}`);
    console.log(`   Company:  ${job.company}`);
    console.log(`   Location: ${job.location}`);
    console.log(`   Posted:   ${job.postedDate}`);
    console.log(`   Link:     ${job.link}`);
    console.log('');
  }

  console.log('-----------------------------------------');
  console.log(`Total: ${texasJobs.length} jobs`);
}

// ---------------------------------------------------------------------------
// 7. RUN IT
// ---------------------------------------------------------------------------
// This is the starting pistol. We call scrapeJobs(), wait for it, then print.
//
// .catch() handles the case where something goes wrong (no internet, site
// changed its HTML, etc). Without it you get an ugly unhandled crash.

scrapeJobs()
  .then(printJobs)
  .catch((error) => {
    console.error('Something went wrong:');
    console.error(error);
    // Exit code 1 tells the operating system "this failed".
    process.exit(1);
  });

// ---------------------------------------------------------------------------
// YOUR EXERCISES - do these before moving to v1
// ---------------------------------------------------------------------------
//
// Reading code teaches you very little. Breaking and fixing it teaches you
// everything. Do these in order:
//
// 1. Set SHOW_BROWSER to true and run it. Watch the browser work by itself.
//    Set it back to false when you are done - invisible is faster.
//
// 1b. Set USE_EDGE to true and run it. It drives your real Edge browser.
//     Notice it stays visible no matter what - your system policy blocks
//     headless Edge. Set it back to false afterwards; bundled Chromium is
//     faster and more predictable.
//
// 2. Deliberately break it: change '.card-content' to '.card-contentXYZ'.
//    Run it. Read the error message carefully. Errors are information, not
//    punishment - getting comfortable reading them is most of the job.
//    Then change it back.
//
// 3. Only print jobs where the location contains "AE". You should get 37.
//    Then try "AP" (32) and "AA" (31).
//    This practice site uses fake state codes - AE, AP and AA are the only
//    ones that exist. Before filtering on real data, always look at the data
//    first: console.log(jobs.map(j => j.location).slice(0, 10));
//    "0 results" can mean broken code OR genuinely nothing matched, and
//    checking the data tells you which in ten seconds.
//    Hint: look up "JavaScript array filter" and "JavaScript string includes".
//
// 4. Print the jobs sorted alphabetically by company name.
//    Hint: look up "JavaScript array sort".
//
// 5. Open https://realpython.github.io/fake-jobs/ in Chrome, right-click a
//    job title, choose Inspect. Find where 'h2.title' comes from in the HTML.
//    This is how you work out selectors for any site, forever.
//
// 6. Hard one: each job has a "Learn" link to a detail page containing a full
//    description. Visit the first job's detail page and print its description.
//    Hint: you will need another page.goto().
