/*
 * SEARCH BOX
 * ==========
 *
 * A "controlled component" - one of React's core patterns.
 *
 * Normally a text box remembers what you typed all by itself. Here it does
 * not. Its value comes from App's state, and every keystroke asks App to
 * update that state, which flows back down as the new value.
 *
 *     you type -> onChange -> App's setSearchText -> new value -> box updates
 *
 * That round trip seems pointless until you need to clear the box from a
 * button elsewhere, or save a draft, or validate as the user types. Because
 * App owns the value, it can change it at any time and the box obeys.
 *
 * The rule: the data has ONE home, and the input is just a view of it.
 */

type Props = {
  value: string;
  onChange: (value: string) => void;
};

export default function SearchBox({ value, onChange }: Props) {
  return (
    <input
      type="search"
      className="search"
      placeholder="Search title, company or location..."
      value={value}
      // event.target is the input element; .value is what is in it now.
      onChange={(event) => onChange(event.target.value)}
    />
  );
}
