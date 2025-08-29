import { cn } from "@cartridge/ui";
import { Link } from "react-router-dom";
import { useLocation } from "react-router-dom";
import { Network } from "../../network";

export const HomeHeader = () => {
  const location = useLocation();

  return (
    <header className="bg-background-100 h-[58px] py-[10px] w-full">
      <div className="flex flex-row items-center justify-center max-w-[1134px]">
        <h1 className="font-mono text-foreground-100 text-[14px]/[20px] font-semibold uppercase mr-[26px]">
          Explorer
        </h1>
        <Network />
        <nav>
          <ul className="flex flex-row gap-[15px]">
            <li>
              <Link
                className={cn(
                  "text-[14px]/[20px] font-normal",
                  location.pathname === "/blocks"
                    ? "text-foreground-100"
                    : "text-foreground-200",
                )}
                to="/blocks"
              >
                Blocks
              </Link>
            </li>
            <li>
              <Link
                className={cn(
                  "text-[14px]/[20px] font-normal",
                  location.pathname === "/txns"
                    ? "text-foreground-100"
                    : "text-foreground-200",
                )}
                to="/txns"
              >
                Transactions
              </Link>
            </li>
            <li>
              <Link
                className={cn(
                  "text-[14px]/[20px] font-normal",
                  location.pathname === "/json-rpc"
                    ? "text-foreground-100"
                    : "text-foreground-200",
                )}
                to="/json-rpc"
              >
                Playground
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
};
