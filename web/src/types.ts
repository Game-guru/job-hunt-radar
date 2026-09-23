/*
 * SHARED TYPES
 * ============
 *
 * These describe the data the server sends us. They mirror the types in
 * src/db.ts on the back end.
 *
 * Keeping them in one file means every component agrees on what a Job is.
 */

export type Status = 'new' | 'applied' | 'interviewing' | 'rejected';

// This is a union type: a Status is one of exactly those four strings.
// Not "any string" - those four. Type a fifth and TypeScript stops you
// before the code ever runs.
export const STATUSES: Status[] = ['new', 'applied', 'interviewing', 'rejected'];

export type Job = {
  link: string;
  title: string;
  company: string;
  location: string;
  postedDate: string;
  status: Status;
  firstSeenAt: string;
};

export type Counts = Partial<Record<Status, number>>;

// Partial means every field is optional - if no job is 'rejected' yet, the
// server simply will not include that key. Marking it Partial forces us to
// handle the missing case instead of crashing on undefined.

export type JobsResponse = {
  jobs: Job[];
  counts: Counts;
};
