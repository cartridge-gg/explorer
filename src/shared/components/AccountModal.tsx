import React, { useState } from "react";
import { useCallCart } from "@/store/ShoppingCartProvider";
import * as icons from "lucide-react";
import { truncateString } from "../utils/string";
import { Call } from "starknet";
import { useNavigate } from "react-router-dom";
import { Modal, ModalTitle } from "./Modal";

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
}

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

  // --------------- COMPONENT LOCAL STATE ----------------

  const [executeResult, setExecuteResult] = useState<ExecuteResult>({
    error: null,
    txHash: null,
    loading: false,
  });

  const [expandedCall, setExpandedCall] = useState<{
    index: number;
    call: Call;
  } | null>({ index: 0, call: state.calls?.[0] });

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

  // Reset execution result state
  const resetExecutionResult = () => {
    setExecuteResult({
      txHash: null,
      error: null,
      loading: false,
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="w-[380px] max-w-2xl max-h-[50vh] min-h-[464px] flex flex-col">
        {(() => {
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
              <div className="overflow-y-auto flex-grow">
                {/* Function Calls Cart Section */}
                <div className="h-full grid grid-rows-[min-content_1fr]">
                  <div className="flex justify-between items-end mb-3">
                    <ModalTitle title={`Calls (${state.calls.length})`} />
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
                    </div>
                  )}
                </div>
              </div>
            </>
          );
        })()}
      </div>
    </Modal>
  );
};
