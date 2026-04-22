import {
  Sheet,
  SheetTrigger,
  SheetContent as UISheetContent,
} from "@/shared/components/ui/sheet";
import { cn } from "@/lib/utils";

export { Sheet, SheetTrigger };

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
