import { useEffect, RefObject } from "react";

export function useClickOutside(
  refs: RefObject<HTMLElement>[] | RefObject<HTMLElement>,
  handler: () => void,
  enabled: boolean = true,
) {
  useEffect(() => {
    if (!enabled) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      // Check if click is outside all provided refs
      const isOutside = (Array.isArray(refs) ? refs : [refs]).every(
        (ref) => !ref.current || !ref.current.contains(target),
      );

      if (isOutside) {
        handler();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [refs, handler, enabled]);
}
