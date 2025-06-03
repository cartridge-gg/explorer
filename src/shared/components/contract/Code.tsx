import ToggleButton from "@/shared/components/ToggleButton";
import { CheckIcon, CopyIcon } from "@cartridge/ui";
import { Editor } from "@/shared/components/editor";
import { useCallback, useEffect, useMemo, useState } from "react";

export type CodeProps = {
  abi?: string;
  sierra?: string;
};

export function Code({ abi, sierra }: CodeProps) {
  const variants = useMemo(() => {
    const _varriants = ["contract abi"];
    if (sierra) {
      _varriants.push("sierra bytecode");
    }
    return _varriants;
  }, [sierra]);

  const [selectedTab, setSelectedTab] = useState<(typeof variants)[number]>(
    variants[0],
  );

  const [copied, setCopied] = useState(false);
  const onCopy = useCallback(() => {
    switch (selectedTab) {
      case "contract abi":
        if (!abi) {
          return;
        }
        navigator.clipboard.writeText(abi);
        setCopied(true);
        break;
      case "sierra bytecode":
        if (!sierra) {
          return;
        }
        navigator.clipboard.writeText(sierra);
        setCopied(true);
        break;
    }
  }, [abi, sierra, selectedTab]);

  useEffect(() => {
    if (copied) {
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    }
  }, [copied]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-between items-center">
        <ToggleButton
          variants={variants}
          selected={selectedTab}
          onChange={setSelectedTab}
        />
        <button
          className="flex items-center gap-2 uppercase bg-black text-white px-2 py-1 text-sm font-bold"
          onClick={onCopy}
          disabled={copied}
        >
          {copied ? (
            <>
              <CheckIcon size="xs" />
              <div>Copied</div>
            </>
          ) : (
            <>
              <CopyIcon size="xs" />
              <div>Copy</div>
            </>
          )}
        </button>
      </div>

      {(() => {
        switch (selectedTab) {
          case "contract abi":
            return (
              <Editor
                className="min-h-[80vh]"
                defaultLanguage="json"
                value={abi}
                options={{
                  readOnly: true,
                  scrollbar: {
                    alwaysConsumeMouseWheel: false,
                  },
                }}
              />
            );
          case "sierra bytecode":
            if (!sierra) {
              return null;
            }

            return (
              <Editor
                className="min-h-[80vh]"
                defaultLanguage="json"
                value={sierra}
                options={{
                  readOnly: true,
                  scrollbar: {
                    alwaysConsumeMouseWheel: false,
                  },
                }}
              />
            );
        }
      })()}
    </div>
  );
}
