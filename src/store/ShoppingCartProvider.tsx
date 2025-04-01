import React, { createContext, useContext, useReducer, ReactNode } from "react";
import type { Call } from "starknet";
import { useAccount } from "@starknet-react/core";

// Define the state structure
interface CallCartState {
  calls: Call[];
}

// Define actions
type CallCartAction =
  | { type: "ADD_CALL"; call: Call }
  | { type: "REMOVE_CALL"; index: number }
  | { type: "CLEAR_CALLS" };

// Initial state
const initialState: CallCartState = {
  calls: [],
};

// Create the context
const CallCartContext = createContext<
  | {
      state: CallCartState;
      dispatch: React.Dispatch<CallCartAction>;
    }
  | undefined
>(undefined);

// Reducer function
function callCartReducer(
  state: CallCartState,
  action: CallCartAction
): CallCartState {
  switch (action.type) {
    case "ADD_CALL":
      return { ...state, calls: [...state.calls, action.call] };
    case "REMOVE_CALL":
      return {
        ...state,
        calls: state.calls.filter((_, index) => index !== action.index),
      };
    case "CLEAR_CALLS":
      return { ...state, calls: [] };
    default:
      return state;
  }
}

// Provider component
export function CallCartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(callCartReducer, initialState);

  return (
    <CallCartContext.Provider value={{ state, dispatch }}>
      {children}
    </CallCartContext.Provider>
  );
}

// Custom hook for using the context
export function useCallCart() {
  const context = useContext(CallCartContext);
  if (context === undefined) {
    throw new Error("useCallCart must be used within a CallCartProvider");
  }
  return context;
}

// Utility functions for common operations with wallet connection check
export function useCallCartActions() {
  const { status } = useAccount();
  const { dispatch } = useCallCart();

  const isWalletConnected = status === "connected";

  return {
    addCall: (call: Call) => {
      if (!isWalletConnected) {
        console.warn("cannot add call: wallet not connected");
        return;
      }

      dispatch({ type: "ADD_CALL", call });
    },
    removeCall: (index: number) => {
      if (!isWalletConnected) {
        console.warn("cannot remove call: wallet not connected");
        return;
      }

      dispatch({ type: "REMOVE_CALL", index });
    },
    clearCalls: () => {
      if (!isWalletConnected) {
        console.warn("cannot clear calls: wallet not connected");
        return;
      }

      dispatch({ type: "CLEAR_CALLS" });
    },
    isWalletConnected,
  };
}
