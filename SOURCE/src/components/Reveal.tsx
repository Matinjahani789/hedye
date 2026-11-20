import { Fragment, useEffect, useState, type CSSProperties, type ElementType } from "react";

/**
 * Staggered Persian text reveal. Words (never single letters) are animated so
 * Arabic-script shaping and joining is always preserved.
 */
export function Reveal({
  text,
  on,
  delay = 0,
  step = 90,
  as: Tag = "span",
  className = "",
}: {
  text: string;
  on: boolean;
  delay?: number;
  step?: number;
  as?: ElementType;
  className?: string;
}) {
  const words = text.split(" ");
  // flip the class one frame after mount so the CSS transition always plays
  const [shown, setShown] = useState(false);
  useEffect(() => {
    if (!on) { setShown(false); return; }
    let r2 = 0;
    const r1 = requestAnimationFrame(() => { r2 = requestAnimationFrame(() => setShown(true)); });
    return () => { cancelAnimationFrame(r1); cancelAnimationFrame(r2); };
  }, [on]);
  return (
    <Tag className={`rv ${shown ? "rv-on" : ""} ${className}`}>
      {words.map((w, i) => (
        <Fragment key={i}>
          <span className="rv-word" style={{ "--d": `${delay + i * step}ms` } as CSSProperties}>
            {w}
          </span>
          {i < words.length - 1 ? " " : ""}
        </Fragment>
      ))}
    </Tag>
  );
}
