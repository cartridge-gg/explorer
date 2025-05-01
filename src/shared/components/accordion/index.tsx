import React from "react";
import { AccordionCollapseIcon, AccordionExpandIcon } from "./icons";
import { cn } from "@cartridge/ui-next";

type AccordionProps = {
  /**
   * A function that returns an array of AccordionItem components
   */
  items: () => React.ReactElement<AccordionItemProps>[];
};

export function Accordion({ items }: AccordionProps) {
  const accordionItems = items();

  return (
    <div className="accordion-container [&_div:not(:last-child)_.accordion-header]:mb-[-1px] [&_div:last-child_.shadow-inner]:border-b">
      {accordionItems}
    </div>
  );
}

interface AccordionItemProps {
  /**
   * The content to be displayed in the accordion header
   */
  title: React.ReactNode;
  /**
   * The content to be displayed when the accordion is expanded
   */
  content?: React.ReactNode;
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
  content,
  titleClassName,
  contentClassName,
  containerClassName,
  open = false,
  disabled = false,
}: AccordionItemProps) {
  const [isOpen, setIsOpen] = React.useState<boolean>(open);

  const toggleAccordion = React.useCallback(
    () => setIsOpen((prev) => !prev),
    [setIsOpen]
  );

  return (
    <div className={cn("accordion w-full", containerClassName)}>
      <div
        onClick={disabled ? undefined : toggleAccordion}
        className={cn("accordion-header sticky top-0 bg-white  border border-borderGray px-4 gap-3 py-2 grid grid-cols-[1fr_min-content] items-center", disabled ? "cursor-default" : "cursor-pointer", titleClassName)}
      >
        <div className={"accordion-title overflow-x-auto"}>{title}</div>
        {!disabled && (isOpen ? <AccordionCollapseIcon /> : <AccordionExpandIcon />)}
      </div>

      {isOpen && (
        <div
          className={cn("bg-[#F1F1F1] p-3 border-x border-borderGray shadow-inner", contentClassName)}
        >
          {content || <EmptyAccordionContent />}
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
