/*
 * APP - v2.5
 * ==========
 *
 * THE ONE IDEA BEHIND REACT
 * -------------------------
 * In legacy-vanilla/app.js you had to call render() by hand every single time
 * anything changed - after loading, after a click, after typing. Miss one and
 * the screen quietly disagreed with the data.
 *
 * React removes that entirely. You describe what the page should LOOK LIKE for
 * the current data. When the data changes, React redraws for you.
 *
 * Search this file for "render()". There isn't one. That is the whole point.
 */

import { useState, useEffect, useMemo } from 'react';
import type { Job, Status, Counts, JobsResponse } from './types.ts';
import StatsBar from './components/StatsBar.tsx';
import Filters from './components/Filters.tsx';
import SearchBox from './components/SearchBox.tsx';
import JobCard from './components/JobCard.tsx';

export default function App() {
  // -------------------------------------------------------------------------
  // 1. STATE
  // -------------------------------------------------------------------------
  // useState gives you a value and a function to change it:
  //
  //     const [value, setValue] = useState(startingValue);
  //
  // The rule that makes React work: NEVER change the value directly.
  // Always call the setter. Calling the setter is what tells React
  // "this changed, redraw anything that uses it".
  //
  //     jobs.push(newJob)    <- React has no idea anything happened
  //     setJobs([...jobs])   <- React redraws
  //
  // In the old version these were plain `let` variables and you redrew by hand.

  const [jobs, setJobs] = useState<Job[]>([]);
  const [counts, setCounts] = useState<Counts>({});
  const [activeFilter, setActiveFilter] = useState<Status | 'all'>('all');
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // -------------------------------------------------------------------------
  // 2. LOADING THE DATA
  // -------------------------------------------------------------------------
  // useEffect runs code that reaches outside React - fetching, timers, and so on.
  //
  // The [] at the end is the dependency list: "re-run this whenever something
  // in here changes". An empty list means nothing ever changes, so it runs
  // once when the component first appears. That is what we want for loading.

  useEffect(() => {
    let cancelled = false;   // guards against a reply arriving after we've gone

    async function load() {
      try {
        const response = await fetch('/api/jobs');
        if (!response.ok) throw new Error(`Server said ${response.status}`);

        const data: JobsResponse = await response.json();
        if (cancelled) return;

        setJobs(data.jobs);
        setCounts(data.counts);
      } catch (err) {
        if (!cancelled) setError((err as Error).message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    // Returned function runs when the component is removed. Without it, a slow
    // fetch could finish after the user navigated away and try to update
    // something that no longer exists.
    return () => {
      cancelled = true;
    };
  }, []);

  // -------------------------------------------------------------------------
  // 3. CHANGING A STATUS
  // -------------------------------------------------------------------------

  async function handleStatusChange(link: string, status: Status) {
    // Remember what we had, so we can undo if the server refuses.
    const previous = jobs;

    // OPTIMISTIC UPDATE: change the screen immediately, before the server has
    // replied. The click feels instant instead of laggy.
    //
    // .map() builds a NEW array. We never edit the old one - React compares
    // old and new to work out what changed, and editing in place hides the
    // change from it. This is why you see so much copying in React code.
    setJobs(jobs.map((job) => (job.link === link ? { ...job, status } : job)));

    try {
      const response = await fetch('/api/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ link, status }),
      });

      if (!response.ok) throw new Error('Update rejected by server');

      const data = await response.json();
      setCounts(data.counts);
    } catch {
      // The server said no - put the screen back how it was.
      setJobs(previous);
      setError('Could not save that change');
    }
  }

  // -------------------------------------------------------------------------
  // 4. WORKING OUT WHAT TO SHOW
  // -------------------------------------------------------------------------
  // Exactly the same filtering logic as the old version. The difference is
  // WHEN it runs: we no longer decide. React re-runs this whenever jobs,
  // activeFilter or searchText change, because those are listed at the bottom.
  //
  // useMemo means "only redo this work if one of these actually changed".
  // Filtering 100 jobs is fast, but on every keystroke it adds up.

  const visibleJobs = useMemo(() => {
    const needle = searchText.trim().toLowerCase();

    return jobs.filter((job) => {
      const matchesFilter = activeFilter === 'all' || job.status === activeFilter;

      const matchesSearch =
        needle === '' ||
        job.title.toLowerCase().includes(needle) ||
        job.company.toLowerCase().includes(needle) ||
        job.location.toLowerCase().includes(needle);

      return matchesFilter && matchesSearch;
    });
  }, [jobs, activeFilter, searchText]);

  // -------------------------------------------------------------------------
  // 5. WHAT THE PAGE LOOKS LIKE
  // -------------------------------------------------------------------------
  // This is JSX. It looks like HTML but it is JavaScript - Vite converts it.
  //
  // Anything inside { } is real JavaScript. So {visibleJobs.map(...)} means
  // "put one JobCard here for each visible job".
  //
  // Read this as a description, not as instructions. You are not telling React
  // to build anything. You are saying "given this data, the page looks like
  // this" - and React makes it so.

  if (loading) {
    return <p className="empty">Loading jobs...</p>;
  }

  return (
    <>
      <header>
        <h1>Job Hunt Radar</h1>
        <p className="subtitle">Scraped listings, tracked applications.</p>
      </header>

      {/* && means "only show this if there is an error".
          A common React shortcut: false renders nothing. */}
      {error && <p className="error">{error}</p>}

      <StatsBar counts={counts} total={jobs.length} />

      <Filters active={activeFilter} onChange={setActiveFilter} />

      <SearchBox value={searchText} onChange={setSearchText} />

      {visibleJobs.length === 0 ? (
        <p className="empty">No jobs match that.</p>
      ) : (
        visibleJobs.map((job) => (
          // `key` lets React tell items apart between redraws, so it can move
          // existing elements instead of rebuilding the whole list.
          // Always use something genuinely unique - our link is the primary
          // key in the database, so it is perfect. Never use the array index.
          <JobCard key={job.link} job={job} onStatusChange={handleStatusChange} />
        ))
      )}
    </>
  );
}
