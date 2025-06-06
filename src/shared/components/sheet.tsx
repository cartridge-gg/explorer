export { Sheet, SheetTrigger } from "@cartridge/ui";

import { SheetContent as UISheetContent, cn } from "@cartridge/ui";

export function SheetContent({
  className,
  ...props
}: React.ComponentProps<typeof UISheetContent>) {
  return (
    <UISheetContent
      {...props}
      className={cn(className, "px-2 pt-12 border-background-300")}
    />
  );
}
