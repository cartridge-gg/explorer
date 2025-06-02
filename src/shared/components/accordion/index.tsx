import React, { PropsWithChildren } from "react";
import { AccordionCollapseIcon, AccordionExpandIcon } from "./icons";
import { cn } from "@cartridge/ui";

export function Accordion({ children }: PropsWithChildren) {
  return (
    <div className="accordion-container [&_div:not(:last-child)_.accordion-header]:mb-[-1px]">
      {children}
    </div>
  );
}

interface AccordionItemProps extends PropsWithChildren {
  /**
   * The content to be displayed in the accordion header
   */
  title: React.ReactNode;
  /**
   * Optional custom styling for the title section
   */
  containerClassName?: string;
  /**
   * Optional custom styling for the title section
   */
  titleClassName?: string;
  /**
   * Optional custom styling for the content section
   */
  contentClassName?: string;
  /**
   * Open accordion item by default
   */
  open?: boolean;
  /**
   * Whether the accordion is disabled
   */
  disabled?: boolean;
}

export function AccordionItem({
  title,
  titleClassName,
  contentClassName,
  containerClassName,
  open = false,
  disabled = false,
  children,
}: AccordionItemProps) {
  const [isOpen, setIsOpen] = React.useState<boolean>(open);

  const toggleAccordion = React.useCallback(
    () => setIsOpen((prev) => !prev),
    [setIsOpen],
  );

  return (
    <div className={cn("accordion w-full", containerClassName)}>
      <div
        onClick={disabled ? undefined : toggleAccordion}
        className={cn(
          "accordion-header sticky top-0 bg-white  border border-borderGray px-4 gap-3 py-2 grid grid-cols-[1fr_min-content] items-center z-10",
          disabled ? "cursor-default" : "cursor-pointer",
          titleClassName,
        )}
      >
        <div className={"accordion-title overflow-x-auto"}>{title}</div>
        {!disabled &&
          (isOpen ? <AccordionCollapseIcon /> : <AccordionExpandIcon />)}
      </div>

      {isOpen && (
        <div
          className={cn(
            "bg-[#F1F1F1] p-3 border-x border-borderGray shadow-inner",
            contentClassName,
          )}
        >
          {children || <EmptyAccordionContent />}
        </div>
      )}
    </div>
  );
}

/**
 * Empty content component for when no content is provided
 */
function EmptyAccordionContent() {
  return (
    <div className="text-gray-400 italic h-6 flex items-center justify-center"></div>
  );
}
