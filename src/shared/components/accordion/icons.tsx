export function AccordionExpandIcon(
  props: React.HTMLAttributes<HTMLSpanElement>,
) {
  return (
    <span {...props} className="select-none">
      [+]
    </span>
  );
}

export function AccordionCollapseIcon(
  props: React.HTMLAttributes<HTMLSpanElement>,
) {
  return (
    <span {...props} className="select-none">
      [-]
    </span>
  );
}
