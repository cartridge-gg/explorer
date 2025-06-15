import { useEffect, useRef } from "react";

interface UseScrollToOptions<T> {
  item: T | undefined;
  getItemKey: (item: T) => string;
}

export function useScrollTo<T>({ item, getItemKey }: UseScrollToOptions<T>) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const selectedItemRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  useEffect(() => {
    if (!item || !scrollContainerRef.current) return;

    const itemKey = getItemKey(item);
    const selectedElement = selectedItemRefs.current[itemKey];
    if (!selectedElement) return;

    const container = scrollContainerRef.current;
    const containerRect = container.getBoundingClientRect();
    const elementRect = selectedElement.getBoundingClientRect();

    const isAbove = elementRect.top < containerRect.top;
    const isBelow = elementRect.bottom > containerRect.bottom;

    if (isAbove || isBelow) {
      selectedElement.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [item, getItemKey]);

  const setItemRef = (item: T, element: HTMLDivElement | null) => {
    const itemKey = getItemKey(item);
    selectedItemRefs.current[itemKey] = element;
  };

  return {
    scrollContainerRef,
    setItemRef,
  };
}
