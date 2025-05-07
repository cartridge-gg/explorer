import { PropsWithChildren } from "react";
import { PostHogContext, PostHogWrapper } from "@cartridge/utils";

const posthog = new PostHogWrapper(import.meta.env.VITE_POSTHOG_KEY!, {
  host: import.meta.env.VITE_POSTHOG_HOST,
  autocapture: true,
});

export function PostHogProvider({ children }: PropsWithChildren) {
  if (!import.meta.env.VITE_POSTHOG_KEY) {
    return <>{children}</>;
  }

  return (
    <PostHogContext.Provider value={{ posthog }}>
      {children}
    </PostHogContext.Provider>
  );
}
