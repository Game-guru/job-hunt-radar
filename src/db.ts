/*
 * DATABASE - v1
 * =============
 *
 * The scraper forgets everything the moment it finishes. This file gives it
 * a memory, so it can tell you "3 new jobs since yesterday".
 *
 * We use SQLite: a whole database that lives in a single file on your disk
 * (jobs.db). No server to install, no password, nothing to configure.
 *
 * Even better - Node 24 has SQLite built in. Nothing to npm install.
 */

import { DatabaseSync } from 'node:sqlite';
import type { Job } from './scrape.ts';

// ---------------------------------------------------------------------------
// 1. OPENING THE DATABASE
// ---------------------------------------------------------------------------
// If jobs.db does not exist, SQLite creates it. If it does, SQLite opens it.
// That is why your data survives between runs.

const db = new DatabaseSync('jobs.db');

// ---------------------------------------------------------------------------
// 2. CREATING THE TABLE
// ---------------------------------------------------------------------------
// A table is a spreadsheet: columns describe the shape, rows hold the data.
//
// "IF NOT EXISTS" means: make it on first run, do nothing on every run after.
// Without that, run number two would crash with "table already exists".
//
// PRIMARY KEY is the important bit. It means "this column is the unique
// identifier - no two rows may share a value here".
//
// We chose `link` as the key, because a job's URL is unique to that job.
// Two listings could share a title AND a company AND a location (one firm
// hiring three identical roles), but never a URL.
//
// Picking the right key is most of database design. Get it wrong and you
// either store duplicates or reject things you shouldn't.
//
// NOT NULL means "this column may never be empty" - it catches broken
// scrapes early rather than storing half a job.

db.exec(`
  CREATE TABLE IF NOT EXISTS jobs (
    link          TEXT PRIMARY KEY,
    title         TEXT NOT NULL,
    company       TEXT NOT NULL,
    location      TEXT NOT NULL,
    posted_date   TEXT NOT NULL,
    first_seen_at TEXT NOT NULL
  )
`);

// ---------------------------------------------------------------------------
// 2b. CHANGING A TABLE THAT ALREADY EXISTS (a "migration")
// ---------------------------------------------------------------------------
// The block above only runs on a brand new database. If the table already
// exists, SQLite skips it entirely - it does not compare columns.
//
// So we cannot add a new column by editing CREATE TABLE. To change a table
// that already holds data we need ALTER TABLE.
//
//   CREATE TABLE = make me a new table
//   ALTER TABLE  = change the table I already have
//
// This is called a migration. Every real app needs them, because databases
// full of real data cannot simply be thrown away and rebuilt.

function migrate(): void {
  // Ask SQLite to describe its own table, so we can see which columns exist.
  const columns = db.prepare(`SELECT name FROM pragma_table_info('jobs')`).all() as { name: string }[];

  const hasLastSeen = columns.some((c) => c.name === 'last_seen_at');

  if (!hasLastSeen) {
    console.log('Migrating database: adding last_seen_at column...');

    // No NOT NULL here. The 100 rows already in the table have never had
    // this column, and SQLite refuses to add a "never empty" column without
    // being told what to put in those existing rows.
    db.exec(`ALTER TABLE jobs ADD COLUMN last_seen_at TEXT`);

    // Backfill: for jobs we already knew about, the best guess for
    // "last seen" is when we first saw them. Leaving them empty would be
    // a lie, and lying data causes bugs later.
    db.exec(`UPDATE jobs SET last_seen_at = first_seen_at WHERE last_seen_at IS NULL`);
  }
}

// Safe to run every time. First run it adds the column; after that it does
// nothing, because the column is already there.
migrate();

// ---------------------------------------------------------------------------
// 3. SAVING JOBS, AND SPOTTING THE NEW ONES
// ---------------------------------------------------------------------------

export function saveJobs(jobs: Job[]): Job[] {
  // -- 3a. Prepared statements -------------------------------------------
  // The ? marks are placeholders. We hand SQLite the query shape once, then
  // feed values into it separately.
  //
  // WHY THIS MATTERS, and it is not about speed:
  //
  // The tempting alternative is gluing strings together:
  //     `INSERT INTO jobs VALUES ('${job.title}')`     <-- NEVER DO THIS
  //
  // If a job title contains a quote mark, that breaks. And if someone
  // deliberately puts SQL inside a job title, it *runs*. That attack is
  // called SQL injection and it is still one of the most common serious
  // vulnerabilities on the web, decades after it was discovered.
  //
  // Placeholders make it impossible: SQLite treats the values as data,
  // never as commands. Always use ?. No exceptions, ever.
  const insert = db.prepare(`
    INSERT OR IGNORE INTO jobs
      (link, title, company, location, posted_date, first_seen_at, last_seen_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  // Stamps today's date onto a job we have seen before.
  // This is how we know a listing is still on the site.
  const touch = db.prepare(`UPDATE jobs SET last_seen_at = ? WHERE link = ?`);

  // "OR IGNORE" tells SQLite: if a row with this link already exists,
  // silently skip it instead of throwing an error.
  //
  // That single word is our entire duplicate-handling strategy. The database
  // enforces uniqueness for us, so we never have to check "have I seen this
  // before?" in JavaScript. Let the database do what it is good at.

  const newJobs: Job[] = [];
  const now = new Date().toISOString();

  // -- 3b. A transaction --------------------------------------------------
  // Without this, SQLite writes each row to disk separately - 100 separate
  // disk writes. Wrapping them makes it one write at the end.
  //
  // It is also all-or-nothing: if something fails halfway, nothing is saved.
  // You never end up with half a scrape stored.
  db.exec('BEGIN TRANSACTION');

  try {
    for (const job of jobs) {
      const result = insert.run(
        job.link,
        job.title,
        job.company,
        job.location,
        job.postedDate,
        now,
        now,
      );

      // `changes` is how many rows were actually written.
      // 1 = this job is new. 0 = we already had it, and OR IGNORE skipped it.
      // That is how we detect new listings, for free.
      if (result.changes === 1) {
        newJobs.push(job);
      } else {
        // We already knew about this job, and it is still on the site today.
        // Update its last_seen_at so we know it has not disappeared.
        touch.run(now, job.link);
      }
    }

    db.exec('COMMIT');
  } catch (error) {
    // Something went wrong - undo everything in this transaction.
    db.exec('ROLLBACK');
    throw error;
  }

  return newJobs;
}

// ---------------------------------------------------------------------------
// 4. READING BACK OUT
// ---------------------------------------------------------------------------
// .all() returns every matching row. .get() returns just the first one.
//
// ORDER BY first_seen_at DESC puts the most recently discovered jobs first.
// DESC = descending. ASC = ascending (the default).

export function getAllJobs(): Job[] {
  const rows = db.prepare(`
    SELECT link, title, company, location, posted_date
    FROM jobs
    ORDER BY first_seen_at DESC
  `).all();

  // SQLite gives us column names like posted_date (database convention).
  // Our TypeScript uses postedDate (JavaScript convention). This translates
  // between the two worlds.
  return rows.map((row) => ({
    link: row.link as string,
    title: row.title as string,
    company: row.company as string,
    location: row.location as string,
    postedDate: row.posted_date as string,
  }));
}

export function countJobs(): number {
  // COUNT(*) asks SQLite to count rows without sending them all to us.
  // Far faster than fetching everything and checking .length.
  const row = db.prepare('SELECT COUNT(*) AS total FROM jobs').get();
  return row?.total as number;
}

// ---------------------------------------------------------------------------
// 5. JOBS THAT HAVE DISAPPEARED
// ---------------------------------------------------------------------------
// Every run stamps last_seen_at on every job still on the site.
//
// So any job whose last_seen_at is OLDER than the newest one in the table
// was not on the site this time. It has been taken down - usually because
// the role was filled.
//
// MAX(last_seen_at) is the timestamp of the most recent run.

export function getDisappearedJobs(): Job[] {
  const rows = db.prepare(`
    SELECT link, title, company, location, posted_date
    FROM jobs
    WHERE last_seen_at < (SELECT MAX(last_seen_at) FROM jobs)
    ORDER BY last_seen_at DESC
  `).all();

  return rows.map((row) => ({
    link: row.link as string,
    title: row.title as string,
    company: row.company as string,
    location: row.location as string,
    postedDate: row.posted_date as string,
  }));
}

export function getJobsByCompany(company: string): Job[] {
  const rows = db.prepare(`
    SELECT link, title, company, location, posted_date
    FROM jobs
    WHERE company = ?
    ORDER BY first_seen_at DESC
  `).all(company);

  return rows.map((row) => ({
    link: row.link as string,
    title: row.title as string,
    company: row.company as string,
    location: row.location as string,
    postedDate: row.posted_date as string,
  }));
}

// ---------------------------------------------------------------------------
// YOUR EXERCISES - v1
// ---------------------------------------------------------------------------
//
// 1. Run `npm run scrape` twice. First run: 100 new. Second run: 0 new.
//    That is the database remembering. Look for the jobs.db file that appears.
//
// 2. Delete jobs.db and run again. All 100 are "new" once more.
//    Deleting the file deletes the database - that is all a SQLite DB is.
//
// 3. Write a function getJobsByCompany(company: string) that returns only
//    that company's jobs.
//    Hint: SELECT ... WHERE company = ?     <- use a placeholder, not glue
//
// 4. Add a column for whether you have applied. You will need:
//       ALTER TABLE jobs ADD COLUMN applied INTEGER DEFAULT 0
//    SQLite has no true/false type - 0 and 1 are used instead.
//    Careful: CREATE TABLE IF NOT EXISTS will NOT add a column to a table
//    that already exists. Changing a live database is called a "migration"
//    and it is one of the genuinely hard parts of backend work.
//
// 5. Harder: right now we only record first_seen_at. Add last_seen_at and
//    update it every run. That would let you spot listings that have
//    disappeared - usually meaning the role was filled.
