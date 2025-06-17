export { Accordion, AccordionContent } from "@cartridge/ui";

import {
  cn,
  AccordionItem as UIAccordionItem,
  AccordionTrigger as UIAccordionTrigger,
} from "@cartridge/ui";

export function AccordionItem({
  className,
  ...props
}: React.ComponentProps<typeof UIAccordionItem>) {
  return (
    <UIAccordionItem
      {...props}
      className={cn(
        "border border-b-0 last:border-b first:rounded-t last:rounded-b border-background-200",
        className,
      )}
    />
  );
}

export function AccordionTrigger({
  className,
  parentClassName,
  ...props
}: React.ComponentProps<typeof UIAccordionTrigger>) {
  return (
    <UIAccordionTrigger
      {...props}
      className={cn("gap-2 text-foreground-200", className)}
      parentClassName={cn(
        " border-background-200 p-3 font-semibold [&[data-state=open]>div]:text-foreground",
        parentClassName,
      )}
    />
  );
}
