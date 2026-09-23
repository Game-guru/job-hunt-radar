/*
 * JOB CARD
 * ========
 *
 * One job listing. This component is used 100 times on the page, each with
 * different data. That reuse is the main practical reason components exist.
 *
 * NOTE WHAT IS MISSING: there is no escapeHtml() anywhere.
 *
 * In the old version every piece of text had to be escaped by hand, because
 * pasting raw text into innerHTML would run any HTML inside it (an XSS
 * attack). Forget one and you have a security hole.
 *
 * React escapes everything in { } automatically. A job titled
 * "<script>steal()</script>" renders as those literal characters on screen.
 * The whole category of bug is gone by default rather than by discipline.
 */

import type { Job, Status } from '../types.ts';
import { STATUSES } from '../types.ts';

type Props = {
  job: Job;
  onStatusChange: (link: string, status: Status) => void;
};

export default function JobCard({ job, onStatusChange }: Props) {
  return (
    <article className={`job status-${job.status}`}>
      <div className="job-title">
        {/*
          target="_blank" opens in a new tab.
          rel="noopener" is a security must-have with it: without it the new
          page can reach back and redirect yours to a phishing site.
        */}
        <a href={job.link} target="_blank" rel="noopener noreferrer">
          {job.title}
        </a>
      </div>

      <div className="job-meta">
        {job.company} &middot; {job.location} &middot; posted {job.postedDate}
      </div>

      <div className="job-actions">
        {STATUSES.map((status) => (
          <button
            key={status}
            className={`status-btn ${job.status === status ? 'current' : ''}`}
            // We already know which job this is, so the handler passes the
            // link up along with the new status. No data-link attributes and
            // no hunting through the DOM like the old version had to.
            onClick={() => onStatusChange(job.link, status)}
          >
            {status}
          </button>
        ))}
      </div>
    </article>
  );
}
