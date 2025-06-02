import { useNavigate } from "react-router-dom";
import { useLocation } from "react-router-dom";
import { toHash } from "../utils/string";

export function useHashLinkTabs() {
  const { hash } = useLocation();
  const navigate = useNavigate();

  const onTabChange = (tab: string) => {
    const newHash = toHash(tab);
    if (newHash === hash) return;
    navigate({ pathname: ".", hash: newHash });
  };

  return { onTabChange };
}
