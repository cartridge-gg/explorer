import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useLocation } from "react-router-dom";
import { toHash } from "../utils/string";

export function useHashLinkTabs(tabs: string[]) {
  const { hash } = useLocation();
  const selected = useMemo(
    () => tabs.find((id) => toHash(id) === hash) ?? tabs[0],
    [tabs, hash],
  );
  const navigate = useNavigate();

  const onTabChange = (tab: string) => {
    const newHash = toHash(tab);
    if (newHash === hash) return;
    navigate({ pathname: ".", hash: newHash });
  };
  const items = useMemo(
    () =>
      tabs.map((tab) => ({
        name: tab,
        value: tab,
      })),
    [tabs],
  );

  return { selected, onTabChange, tabs: items };
}
