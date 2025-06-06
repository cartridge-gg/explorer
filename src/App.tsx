import "./index.css";

import { Routes, Route, useLocation } from "react-router-dom";
import { Header } from "@/shared/components/header";
import { Home } from "@/modules/Home/page";
import { Transaction } from "@/modules/Transaction/page";
import { Block } from "@/modules/Block/page";
import { BlockList } from "@/modules/BlockList/page";
import { Contract } from "@/modules/Contract/page";
import { TransactionList } from "@/modules/TransactionList/page";
import { Event } from "@/modules/Event/page";
import { ClassHash } from "@/modules/ClassHash/page";
import { JsonRpcPlayground } from "@/modules/JsonRpc/page";
import { NotFound } from "@/modules/NotFound/page";
import { World } from "@/modules/World/page";
import { cn } from "@cartridge/ui";

export function App() {
  const location = useLocation();
  const isHomePage = location.pathname === "/";

  return (
    <div
      className={cn(
        "flex flex-col gap-[20px] px-[20px] py-[25px] xl:px-[45px] w-full min-w-[320px]",
        isHomePage ? "h-screen" : "lg:h-screen",
      )}
    >
      {!isHomePage && <Header />}

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/txns" element={<TransactionList />} />
        <Route path="/tx/:txHash" element={<Transaction />} />
        <Route path="/blocks" element={<BlockList />} />
        <Route path="/block/:blockId" element={<Block />} />
        <Route path="/class/:classHash" element={<ClassHash />} />
        <Route path="/contract/:contractAddress" element={<Contract />} />
        <Route path="/event/:eventId" element={<Event />} />
        <Route path="/json-rpc" element={<JsonRpcPlayground />} />
        <Route path="/world" element={<World />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  );
}
