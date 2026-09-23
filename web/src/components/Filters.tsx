/*
 * FILTERS
 * =======
 *
 * Shows the filter buttons and reports back which one was clicked.
 *
 * Notice what this component does NOT do: it does not filter anything, and it
 * does not remember which button is selected. It is given `active` and it is
 * given `onChange`. It renders, and it reports clicks upward.
 *
 * That is the standard React shape - state lives in ONE place (App), and
 * flows downward. Children ask the parent to change it.
 *
 * If every component kept its own copy of the filter, they would drift out of
 * sync. One owner means one truth.
 */

import type { Status } from '../types.ts';
import { STATUSES } from '../types.ts';

type Props = {
  active: Status | 'all';
  // A function type: takes a filter value, returns nothing.
  // The parent decides what actually happens when it is called.
  onChange: (value: Status | 'all') => void;
};

export default function Filters({ active, onChange }: Props) {
  const options: (Status | 'all')[] = ['all', ...STATUSES];

  return (
    <nav className="filters">
      {options.map((option) => (
        <button
          key={option}
          // Template string: add the "active" class only to the selected one.
          className={`filter-btn ${active === option ? 'active' : ''}`}
          // In the old version you attached one listener to the container and
          // worked out which button was clicked. React lets you write the
          // handler directly on the element without the performance cost -
          // it uses one shared listener behind the scenes.
          onClick={() => onChange(option)}
        >
          {option}
        </button>
      ))}
    </nav>
  );
}
