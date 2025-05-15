import { PostHogContext } from "@cartridge/utils";
import { useContext } from "react";

export function usePostHog() {
  const context = useContext(PostHogContext);
  if (!context) {
    throw new Error("usePostHog must be used within a PostHogProvider");
  }
  return context.posthog;
}
