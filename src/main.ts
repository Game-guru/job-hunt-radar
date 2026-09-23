/*
 * MAIN - v1
 * =========
 *
 * The conductor. It does no scraping and no database work itself - it just
 * calls the two files that do, in the right order, and reports the result.
 *
 * Run it with:   npm run scrape
 *
 * The whole app in one sentence:
 *   scrape the site  ->  save to database  ->  tell me what's new
 */

import { scrapeJobs, type Job } from './scrape.ts';
import { saveJobs, countJobs, getDisappearedJobs } from './db.ts';

// ---------------------------------------------------------------------------
// 1. DISPLAY
// ---------------------------------------------------------------------------
// Moved here from scrape.ts, with your alphabetical sort kept.
//
// One change worth noticing: [...jobs] makes a copy before sorting.
// .sort() rearranges the original array in place, which would quietly
// reorder the caller's data too - a bug that is genuinely hard to track down.
// Copying first means this function cannot damage anything outside itself.

function printJobs(jobs: Job[]): void {
  const sorted = [...jobs].sort((a, b) => a.company.localeCompare(b.company));

  for (const job of sorted) {
    console.log(`${job.title}`);
    console.log(`   Company:  ${job.company}`);
    console.log(`   Location: ${job.location}`);
    console.log(`   Posted:   ${job.postedDate}`);
    console.log(`   Link:     ${job.link}`);
    console.log('');
  }
}

// ---------------------------------------------------------------------------
// 2. THE RUN
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  // Step 1: scrape
  const scraped = await scrapeJobs();

  // Step 2: save, and find out which ones we had never seen before
  const newJobs = saveJobs(scraped);

  // Step 3: report
  console.log('');
  console.log('=========================================');

  if (newJobs.length === 0) {
    // This is the normal result from the second run onwards, and it is the
    // app working correctly - not a failure.
    console.log('No new jobs since last run.');
  } else {
    console.log(`${newJobs.length} NEW job${newJobs.length === 1 ? '' : 's'}:`);
    console.log('=========================================');
    console.log('');
    printJobs(newJobs);
  }

  // Step 4: anything that vanished from the site since a previous run
  const gone = getDisappearedJobs();
  if (gone.length > 0) {
    console.log('');
    console.log(`${gone.length} job${gone.length === 1 ? '' : 's'} no longer listed (probably filled):`);
    for (const job of gone) {
      console.log(`   - ${job.title} @ ${job.company}`);
    }
  }

  console.log('-----------------------------------------');
  console.log(`Scraped this run:  ${scraped.length}`);
  console.log(`New this run:      ${newJobs.length}`);
  console.log(`No longer listed:  ${gone.length}`);
  console.log(`Total known jobs:  ${countJobs()}`);
}

// ---------------------------------------------------------------------------
// 3. START
// ---------------------------------------------------------------------------
// Same pattern as v0: run main, and if anything throws, print it properly
// and exit with a failure code.

main().catch((error) => {
  console.error('Something went wrong:');
  console.error(error);
  process.exit(1);
});

// ---------------------------------------------------------------------------
// TRY THIS
// ---------------------------------------------------------------------------
//
// Run `npm run scrape` twice in a row.
//
//   First run:  100 NEW jobs
//   Second run: No new jobs since last run.
//
// That difference is the entire point of v1. Your app now has a memory,
// which means it can answer a question it could not answer yesterday:
// "what changed?"
//
// Every useful monitoring tool ever built is a variation on this idea.
