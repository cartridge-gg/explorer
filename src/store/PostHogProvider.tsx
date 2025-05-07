import { PropsWithChildren } from "react";
import { PostHogProvider as PH } from "posthog-js/react";

export function PostHogProvider({ children }: PropsWithChildren) {
  if (!import.meta.env.VITE_POSTHOG_KEY) {
    return <>{children}</>;
  }

  return (
    <PH
      apiKey={import.meta.env.VITE_POSTHOG_KEY}
      options={{
        api_host: import.meta.env.VITE_POSTHOG_HOST,
      }}
    >
      {children}
    </PH>
  );
}
