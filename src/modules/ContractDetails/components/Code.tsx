import ToggleButton from "@/shared/components/ToggleButton";
import { Editor } from "@monaco-editor/react";
import { useMemo, useState } from "react";

export type CodeProps = {
  abi?: string;
  sierra?: string;
}

export function Code({ abi, sierra }: CodeProps) {
  const variants = useMemo(() => {
    const _varriants = ["contract abi"];
    if (sierra) {
      _varriants.push("sierra bytecode")
    }
    return _varriants;
  }, [sierra]);

  const [selectedTab, setSelectedTab] = useState<
    (typeof variants)[number]
  >(variants[0]);

  return (
    <div className="flex flex-col gap-3">
      <ToggleButton
        variants={variants}
        selected={selectedTab}
        onChange={setSelectedTab}
      />

      {(() => {
        switch (selectedTab) {
          case "contract abi":
            return <Editor
              className="min-h-[80vh]"
              defaultLanguage="json"
              value={abi}
            />
          case "sierra bytecode":
            if (!sierra) {
              return null
            }

            return <Editor
              className="min-h-[80vh]"
              defaultLanguage="json"
              value={sierra}
            />;
        }
      })()}
    </div>
  );
}
