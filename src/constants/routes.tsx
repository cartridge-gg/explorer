import BlockDetails from "@/modules/BlockDetails/page";
import BlocksList from "@/modules/BlocksList/page";
import Home from "@/modules/Home/page";
import TransactionDetails from "@/modules/TransactionDetails/page";
import TransactionsList from "@/modules/TransactionsList/page";

export const ROUTES = {
  HOME: {
    urlPath: "/",
    component: <Home />,
  },
  TRANSACTION_DETAILS: {
    urlPath: "/tx/:txHash",
    component: <TransactionDetails />,
  },
  BLOCK_DETAILS: {
    urlPath: "/block/:blockNumber",
    component: <BlockDetails />,
  },
  TRANSACTION_LIST: {
    urlPath: "/txns",
    component: <TransactionsList />,
  },
  BLOCKS_LIST: {
    urlPath: "/blocks",
    component: <BlocksList />,
  },
};
