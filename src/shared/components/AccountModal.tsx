import React, { useCallback, useEffect, useRef, useState } from "react";
import { useCallCart, useCallCartDispatch } from "@/store/ShoppingCartProvider";
import { useAccount, useDisconnect } from "@starknet-react/core";
import FeltDisplay from "./FeltDisplay";
import * as icons from "lucide-react";
import { truncateString } from "../utils/string";
import { Call } from "starknet";
import { useNavigate } from "react-router-dom";

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Component for detailed call view
interface CallDetailModalProps {
  index: number;
  call: Call;
  onClose: () => void;
}

const CallDetailModal: React.FC<CallDetailModalProps> = ({
  index,
  call,
  onClose,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const { removeCall } = useCallCartDispatch();

  // Format call data for display
  const formatCallData = () => {
    return {
      contractAddress: call.contractAddress,
      entrypoint: call.entrypoint,
      calldata: call.calldata || [],
    };
  };

  const formattedCall = formatCallData();

  return (
    <div
      id="call-detail-modal"
      ref={modalRef}
      className="absolute top-0 left-full ml-2 bg-white border border-borderGray shadow-lg p-[15px] w-[400px] max-h-full overflow-y-auto"
      style={{ maxHeight: "calc(50vh)" }}
    >
      <div className="w-full flex mb-4">
        <div className="w-full grid grid-cols-[25px_25px] justify-between">
          <button
            onClick={onClose}
            className="flex items-center justify-center border border-borderGray w-[25px] h-[25px] hover:bg-primary hover:border-0 hover:text-white"
          >
            <icons.ChevronLeft strokeWidth={1.5} width={15} height={15} />
          </button>

          <button
            onClick={() => {
              removeCall(index);
              onClose(); // Close the detail modal after deleting
            }}
            className="flex items-center justify-center border border-[#D25D73] w-full h-[25px] hover:bg-[#D25D73] hover:text-white text-[#D25D73] uppercase font-bold"
            title="Delete call"
          >
            <icons.Trash strokeWidth={1.5} width={12} height={12} />
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {/* Contract Address */}
        <div className="">
          <div className="font-bold uppercase mb-1">Contract</div>
          <div className="break-all">
            <FeltDisplay
              value={formattedCall.contractAddress}
              displayAs="hex"
            />
          </div>
        </div>

        {/* Function Name */}
        <div className="">
          <div className="font-bold uppercase mb-1">Function</div>
          <div className="text-primary italic">{formattedCall.entrypoint}</div>
        </div>

        {/* Calldata */}
        <div className="">
          <div className="font-bold uppercase mb-1">Arguments</div>
          {formattedCall.calldata.length === 0 ? (
            <div className="text-gray-500 italic">No arguments</div>
          ) : (
            <div>
              <table className="w-full">
                <thead className="border-b">
                  <tr>
                    <th className="text-gray-600 w-[40px]">#</th>
                    <th className="text-left text-gray-600 uppercase">Value</th>
                  </tr>
                </thead>

                <tbody>
                  {formattedCall.calldata.map((data, i) => (
                    <tr key={i} className="border-b last:border-b-0">
                      <td className="px-2 text-gray-500">{i}</td>
                      <td className="px-2 text-left break-all">{data}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Execution result view component
interface ExecutionResultViewProps {
  txHash: string;
  onBack: () => void;
  onModalClose: () => void;
}

function ExecutionResultView({
  txHash,
  onBack,
  onModalClose,
}: ExecutionResultViewProps) {
  const navigate = useNavigate();

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={onBack}
          className="flex items-center justify-center border border-borderGray w-[25px] h-[25px] hover:bg-primary hover:border-0 hover:text-white"
        >
          <icons.ChevronLeft strokeWidth={1.5} width={15} height={15} />
        </button>
      </div>

      <div className="flex flex-col flex-1 overflow-y-auto">
        <h3 className="font-bold uppercase text-lg mb-3">Submitted</h3>

        <div className="flex flex-col justify-between flex-1">
          <div className="border border-borderGray p-[10px]">
            <div className="font-bold uppercase mb-1">Tx Hash</div>
            <a
              onClick={() => {
                onModalClose();
                navigate(`../tx/${txHash}`);
              }}
              className="break-all cursor-pointer hover:underline"
            >
              {txHash}
            </a>
          </div>

          <div className="flex items-center gap-5 p-[10px] text-xs bg-borderGray">
            <div className="font-bold uppercase">Note</div>
            <div>
              Transaction has been submitted to the network. It may take a few
              minutes to be processed.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Error result component
interface ErrorResultViewProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  error: any;
  onBack: () => void;
}

const ErrorResultView: React.FC<ErrorResultViewProps> = ({ error, onBack }) => {
  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={onBack}
          className="flex items-center justify-center border border-borderGray w-[25px] h-[25px] hover:bg-primary hover:border-0 hover:text-white"
        >
          <icons.ChevronLeft strokeWidth={1.5} width={15} height={15} />
        </button>
        {/* <h2 className="text-md font-bold uppercase">Transaction Failed</h2> */}
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="flex items-center gap-2 mb-4">
          {/* <div className="w-6 h-6 bg-red-100 flex items-center justify-center">
            <icons.X
              className="text-red-600"
              strokeWidth={2}
              width={14}
              height={14}
            />
          </div> */}
          <h3 className="font-bold uppercase">Error During Execution</h3>
        </div>

        <div className="space-y-4">
          <div className="border border-borderGray p-[10px]">
            <div className="font-bold uppercase mb-1">Message</div>
            <div className="text-red-600">
              {error?.message || "Unknown error occurred"}
            </div>
          </div>

          <div className="border border-borderGray p-[10px]">
            <div className="font-bold uppercase mb-1">Details</div>
            <pre className="text-sm font-mono whitespace-pre-wrap break-all py-2">
              {JSON.stringify(error, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};

type ExecuteResult = {
  txHash: string | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  error: any;
  loading: boolean;
};

export const AccountModal: React.FC<AccountModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { state } = useCallCart();
  const { account } = useAccount();
  const { disconnect } = useDisconnect();
  const modalRef = useRef<HTMLDivElement>(null);
  const { clearCalls } = useCallCartDispatch();

  // --------------- COMPONENT LOCAL STATE ----------------

  const [executeResult, setExecuteResult] = useState<ExecuteResult>({
    error: null,
    txHash: null,
    loading: false,
  });

  const [expandedCall, setExpandedCall] = useState<{
    index: number;
    call: Call;
  } | null>(null);

  // ------------------------------------------------------

  const handleExecute = useCallback(() => {
    if (!account) {
      return;
    }

    setExecuteResult({ loading: true, error: null, txHash: null });

    account
      .execute(state.calls)
      .then((result) => {
        setExecuteResult({
          error: null,
          loading: false,
          txHash: result.transaction_hash,
        });
        // Clear calls from the cart after successful execution
        clearCalls();
      })
      .catch((error) => {
        console.error("failed to execute function calls", error);
        setExecuteResult({
          error,
          txHash: null,
          loading: false,
        });
      });
  }, [account, state.calls, clearCalls]);

  // Handle clicking on a call
  const handleCallClick = (index: number, call: Call) => {
    if (!expandedCall) {
      setExpandedCall({ index, call });
      return;
    }

    if (expandedCall.index === index) {
      setExpandedCall(null);
    } else {
      setExpandedCall({ index, call });
    }
  };

  // Close expanded call view
  const closeExpandedCall = () => {
    setExpandedCall(null);
  };

  // Reset execution result state
  const resetExecutionResult = () => {
    setExecuteResult({
      txHash: null,
      error: null,
      loading: false,
    });
  };

  // Click outside handler for the entire modal system
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Create a wrapper check that includes both the main modal ref and expanded modal
      const expandedModalElement = document.getElementById("call-detail-modal");
      const isClickInsideExpandedModal = expandedModalElement
        ? expandedModalElement.contains(event.target as Node)
        : false;

      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node) &&
        !isClickInsideExpandedModal
      ) {
        // Only close if click is outside both the main modal and expanded modal
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Close all modals when ESC key is pressed
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (expandedCall) {
          closeExpandedCall(); // Close expanded call first if it's open
        } else if (executeResult.txHash || executeResult.error) {
          resetExecutionResult(); // Reset execution result if active
        } else {
          onClose(); // Otherwise close the main modal
        }
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscKey);
    }
    return () => {
      document.removeEventListener("keydown", handleEscKey);
    };
  }, [isOpen, onClose, expandedCall, executeResult]);

  // Stop scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Reset all states when main modal is closed
  useEffect(() => {
    if (!isOpen) {
      setExpandedCall(null);
      resetExecutionResult();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const renderMainContent = () => {
    // If transaction execution has completed (success or error)
    if (executeResult.txHash) {
      return (
        <ExecutionResultView
          onModalClose={onClose}
          txHash={executeResult.txHash}
          onBack={resetExecutionResult}
        />
      );
    }

    // If transaction execution has failed
    if (executeResult.error) {
      return (
        <ErrorResultView
          error={executeResult.error}
          onBack={resetExecutionResult}
        />
      );
    }

    // Default view - calls list
    return (
      <>
        <div className="flex flex-row justify-between gap-5 mb-6">
          <button
            onClick={onClose}
            className="flex items-center justify-center border border-borderGray w-[25px] h-[25px] hover:bg-primary hover:border-0 hover:text-white"
          >
            <icons.X strokeWidth={1.5} width={15} height={15} />
          </button>

          <button
            onClick={() => {
              disconnect();
              localStorage.removeItem("lastUsedConnector");
              onClose();
            }}
            className="px-2 py-1 w-[73px] text-xs text-[#D25D73]/50 uppercase font-bold border border-[#D25D73] hover:bg-[#D25D73] hover:text-white"
          >
            Disconnect
          </button>
        </div>

        <div className="overflow-y-auto flex-grow">
          {/* Function Calls Cart Section */}
          <div className="h-full grid grid-rows-[min-content_1fr]">
            <div className="flex justify-between items-end mb-3">
              <h2 className="w-full flex justify-between gap-3 text-md font-bold uppercase">
                Calls ({state.calls.length})
              </h2>
            </div>

            {state.calls.length === 0 ? (
              <div className="flex items-center justify-center pt-4 text-xs text-gray-500 lowercase">
                Empty :(
              </div>
            ) : (
              <div className="flex flex-col justify-between gap-3">
                <table className="w-full h-min">
                  <tbody>
                    {state.calls.map((call, index) => (
                      <tr
                        key={index}
                        onClick={() => handleCallClick(index, call)}
                        className={`account-call-entry hover:bg-gray-100 cursor-pointer ${
                          expandedCall && expandedCall.index === index
                            ? "bg-gray-100"
                            : ""
                        }`}
                      >
                        <td className="w-[40px]">{index + 1}</td>
                        <td className="w-[92px] px-[10px]">
                          {truncateString(call.contractAddress, 3)}
                        </td>
                        <td className="italic px-[10px] text-left">
                          {call.entrypoint}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <button
                  onClick={handleExecute}
                  disabled={executeResult.loading}
                  className={`
                    bg-primary uppercase font-bold text-white p-2
                    ${
                      executeResult.loading
                        ? "opacity-50 cursor-not-allowed"
                        : "hover:bg-opacity-80"
                    }
                  `}
                >
                  {executeResult.loading ? (
                    <div className="flex items-center justify-center gap-2">
                      <icons.Loader
                        className="animate-spin"
                        strokeWidth={1.5}
                        width={16}
                        height={16}
                      />
                      <span>Executing...</span>
                    </div>
                  ) : (
                    "Execute"
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-[2px] z-50 flex items-center justify-center p-4">
      <div className="relative flex">
        {/* Main Account Modal */}
        <div
          ref={modalRef}
          className="relative bg-white p-[15px] w-[380px] shadow-lg max-w-2xl max-h-[50vh] min-h-[464px] overflow-hidden flex flex-col border border-borderGray"
        >
          {renderMainContent()}
        </div>

        {/* Call Detail Modal - only show when in normal view (not execution result view) */}
        {expandedCall && !executeResult.txHash && !executeResult.error && (
          <div onClick={(e) => e.stopPropagation()}>
            <CallDetailModal
              call={expandedCall.call}
              index={expandedCall.index}
              onClose={closeExpandedCall}
            />
          </div>
        )}
      </div>
    </div>
  );
};
