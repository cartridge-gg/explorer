import { useNavigate } from "react-router-dom";
import { useLocation } from "react-router-dom";
import { toHash } from "../utils/string";

export function useHashLinkTabs(defaultValue: string) {
  const { hash } = useLocation();
  const navigate = useNavigate();

  const onChange = (tab: string) => {
    const newHash = toHash(tab);
    if (newHash === hash) return;
    navigate({ pathname: ".", hash: newHash }, { replace: true });
  };

  return { selected: hash.replace("#", "") || defaultValue, onChange };
}
