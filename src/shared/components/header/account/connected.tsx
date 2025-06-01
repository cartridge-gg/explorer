import { useScreen } from "@/shared/hooks/useScreen";
import { truncateString } from "@/shared/utils/string";
import { useCallCart, useCallCartDispatch } from "@/store/ShoppingCartProvider";
import ControllerConnector from "@cartridge/connector/controller";
import {
  Button,
  Dialog,
  DialogTitle,
  DialogHeader,
  DialogContent,
  DialogTrigger,
  Table,
  TableRow,
  TableBody,
  TableCell,
  TableHead,
  TrashIcon,
  ArrowIcon,
  TableHeader,
  Skeleton,
} from "@cartridge/ui";
import { useAccount, useDisconnect } from "@starknet-react/core";
import { useQuery } from "@tanstack/react-query";
import { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Call } from "starknet";

export function Connected() {
  const { isMobile } = useScreen();
  const { address, connector, account } = useAccount();
  const { disconnect } = useDisconnect();
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const { state } = useCallCart();
  const { clearCalls, removeCall } = useCallCartDispatch();
  const [selected, setSelected] = useState<{ i: number; call: Call }>();

  const username = useQuery({
    queryKey: ["username", address],
    queryFn: () => (connector as ControllerConnector)?.controller.username(),
    enabled: !!connector && "controller" in connector,
  });

  const icon = useMemo(() => {
    if (!connector?.icon) {
      return;
    }
    if (typeof connector?.icon === "string") {
      return connector?.icon;
    }
    return connector?.icon.light;
  }, [connector]);

  const onDisconnect = useCallback(() => {
    disconnect();
    localStorage.removeItem("lastUsedConnector");
  }, [disconnect]);

  const execution = useQuery({
    queryKey: ["execute", address, isOpen],
    queryFn: async () => {
      if (!isOpen) {
        return;
      }

      if (!account) {
        throw new Error("Account not found");
      }

      const result = await account.execute(state.calls);
      clearCalls();
      return result;
    },
    enabled: false,
    retry: false,
    gcTime: 0,
  });

  const onDelete = useCallback(
    (i: number) => {
      removeCall(i);
      setSelected(undefined);
    },
    [removeCall],
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="relative gap-3 text-md h-12 w-12 p-0 sm:p-6 sm:w-48 hover:bg-transparent hover:text-foreground hover:cursor-pointer justify-center sm:justify-between"
          size={isMobile ? "icon" : "default"}
        >
          {state.calls.length > 0 && (
            <span className="absolute -top-2 -left-2 bg-primary text-xs w-4 h-4 flex items-center justify-center">
              {state.calls.length}
            </span>
          )}
          <img src={icon} alt="controller" className="size-6" />
          <span className="hidden sm:block">
            {username.isLoading ? (
              <Skeleton className="h-4 w-20" />
            ) : (
              (username.data ?? truncateString(address ?? "", 3))
            )}
          </span>
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-[90%] sm:max-w-[400px] min-h-[464px] max-h-[70%] pt-20 border-2 border-background-500 flex flex-col gap-8 overflow-y-auto">
        <Button
          variant="outline"
          className="absolute border-destructive text-destructive hover:bg-transparent hover:text-destructive hover:border-destructive hover:opacity-80 top-3 right-3"
          onClick={onDisconnect}
        >
          Disconnect
        </Button>
        {execution.data ? (
          <>
            <DialogHeader>
              <DialogTitle className="uppercase">Execution Success</DialogTitle>
            </DialogHeader>

            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <div className="font-bold uppercase">Transaction Hash</div>
                <a
                  onClick={() => {
                    navigate(`../tx/${execution.data.transaction_hash}`);
                    setIsOpen(false);
                  }}
                  className="hover:underline break-all"
                >
                  {execution.data.transaction_hash}
                </a>
              </div>

              <div className="flex flex-col gap-2">
                <div className="font-bold uppercase">Note</div>
                <div>
                  Transaction has been submitted to the network. It may take a
                  few minutes to be processed.
                </div>
              </div>
            </div>
          </>
        ) : execution.error ? (
          <>
            <DialogHeader>
              <DialogTitle className="uppercase">Execution Failed</DialogTitle>
            </DialogHeader>

            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <div className="font-bold uppercase">Error Message</div>
                <div>{execution.error.message ?? "Unknown error occurred"}</div>
              </div>

              <div className="flex flex-col gap-2">
                <div className="font-bold uppercase">Details</div>
                <pre className="text-sm font-mono whitespace-pre-wrap break-all py-2">
                  <code>{JSON.stringify(execution.error, null, 2)}</code>
                </pre>
              </div>
            </div>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="uppercase">
                Calls ({state.calls.length})
              </DialogTitle>
            </DialogHeader>

            {selected ? (
              <div className="flex flex-1 flex-col justify-between gap-4">
                <div className="flex flex-1 max-h-[400px] flex-col gap-4 overflow-y-auto">
                  <div>
                    <div className="font-bold uppercase">contract</div>
                    <div className="break-all">
                      {selected.call.contractAddress}
                    </div>
                  </div>
                  <div>
                    <div className="font-bold uppercase">function</div>
                    <div>{selected.call.entrypoint}</div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <div className="font-bold uppercase">calldata</div>
                    {((selected.call?.calldata as number[]) ?? []).length >
                    0 ? (
                      <div>
                        <Table>
                          <TableHeader>
                            <TableRow className="border-b last:border-b-0">
                              <TableHead className="border border-background-500 text-center w-[40px]">
                                #
                              </TableHead>
                              <TableHead className="border border-background-500">
                                Value
                              </TableHead>
                            </TableRow>
                          </TableHeader>

                          <TableBody>
                            {selected.call.calldata?.map((data, i) => (
                              <TableRow
                                key={i}
                                className="border-b last:border-b-0"
                              >
                                <TableCell className="border border-background-500 text-center">
                                  {i}
                                </TableCell>
                                <TableCell className="border border-background-500">
                                  {data}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <div className="text-gray-500 italic">No calldata</div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <Button
                    variant="secondary"
                    className="w-full"
                    onClick={() => setSelected(undefined)}
                  >
                    <ArrowIcon variant="left" />
                    Back
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full border-destructive text-destructive hover:bg-transparent hover:text-destructive hover:border-destructive hover:opacity-80"
                    onClick={() => onDelete(selected.i)}
                  >
                    <TrashIcon />
                    Delete
                  </Button>
                </div>
              </div>
            ) : state.calls.length === 0 ? (
              <div className="flex flex-1 items-center justify-center text-xs text-foreground-200">
                Empty :(
              </div>
            ) : (
              <div className="flex flex-1 flex-col justify-between gap-4 overflow-y-auto">
                <Table>
                  <TableBody>
                    {state.calls.map((call, i) => (
                      <TableRow
                        key={i}
                        className="cursor-pointer hover:bg-background-300"
                        onClick={() => setSelected({ i: i, call })}
                      >
                        <TableCell className="border border-background-500 text-center w-[40px]">
                          {i + 1}
                        </TableCell>
                        <TableCell className="border border-background-500 w-[100px]">
                          {truncateString(call.contractAddress, 3)}
                        </TableCell>
                        <TableCell className="border border-background-500">
                          {call.entrypoint}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                <Button
                  className="w-full"
                  onClick={() => execution.refetch()}
                  isLoading={execution.isLoading}
                >
                  Execute
                </Button>
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
