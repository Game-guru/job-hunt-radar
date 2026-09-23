/*
 * A COMPONENT
 * ===========
 *
 * A component is a function that returns what something should look like.
 * That is genuinely all it is.
 *
 * The object it receives is called "props" - the data passed in from the
 * parent. Props are READ ONLY. A component never changes its own props;
 * if something needs to change, the parent owns that state and passes down
 * a function to call. You will see that pattern in Filters and JobCard.
 */

import type { Counts, Status } from '../types.ts';
import { STATUSES } from '../types.ts';

// This describes what this component needs to be given.
// Miss one out and TypeScript complains in your editor, before you run it.
type Props = {
  counts: Counts;
  total: number;
};

export default function StatsBar({ counts, total }: Props) {
  // That { counts, total } is destructuring: pull those two fields out of the
  // props object into local variables. Same as:
  //     function StatsBar(props) { const counts = props.counts; ... }

  return (
    <section className="stats">
      {/* className, not class. "class" is a reserved word in JavaScript,
          so JSX uses className instead. Everyone trips on this once. */}
      <Stat label="Total" value={total} />

      {STATUSES.map((status: Status) => (
        // ?? 0 handles a status the server did not mention because no job
        // has it yet. Without it you would render "undefined".
        <Stat key={status} label={status} value={counts[status] ?? 0} />
      ))}
    </section>
  );
}

// A second component in the same file. Perfectly normal when it is small and
// only used here. Splitting every tiny thing into its own file is noise.
function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="stat">
      <span className="stat-value">{value}</span>
      <span className="stat-label">{label}</span>
    </div>
  );
}
