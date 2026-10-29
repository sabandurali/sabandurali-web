export type TitleLine = {
  text: string;
  /** Marked with the signal fill: one line of the title, not a link. */
  accent?: boolean | null;
};

/**
 * The lines of a large title, each on its own line. An accent line gets a
 * signal-orange fill behind ink text (DESIGN-SYSTEM §1.3: on a light ground
 * orange is only a fill), never an underline: underlined text reads as a
 * link (§6). Render inside the `h1`/`h2`; the spaces keep the title one
 * sentence for screen readers and copy.
 */
export default function TitleLines({ lines }: { lines: readonly TitleLine[] }) {
  return lines.map((line, index) => (
    <span key={`${line.text}-${index}`} className="block">
      {line.accent ? (
        <span className="box-decoration-clone bg-signal px-[0.12em]">
          {line.text}
        </span>
      ) : (
        line.text
      )}
      {index < lines.length - 1 ? " " : null}
    </span>
  ));
}
