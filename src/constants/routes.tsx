import BlockDetails from "@/modules/BlockDetails/page";
import BlocksList from "@/modules/BlocksList/page";
import ClassHashDetails from "@/modules/ClassHash/page";
import ContractDetails from "@/modules/ContractDetails/page";
import EventDetails from "@/modules/EventDetails/page";
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
  EVENT_DETAILS: {
    urlPath: "/event/:eventId",
    component: <EventDetails />,
  },
  CONTRACT_DETAILS: {
    urlPath: "/contract/:contractAddress",
    component: <ContractDetails />,
  },
  CLASS_HASH_DETAILS: {
    urlPath: "/class/:classHash",
    component: <ClassHashDetails />,
  },
};
