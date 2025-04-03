import {
  BlockNumberContext,
  BlockNumberContextType,
} from "@/store/BlockNumberProvider";
import { useContext } from "react";

export function useBlockNumber(): BlockNumberContextType {
  const context = useContext(BlockNumberContext);

  if (context === undefined) {
    throw new Error("useBlockNumber must be used within a BlockNumberProvider");
  }

  return context;
}
