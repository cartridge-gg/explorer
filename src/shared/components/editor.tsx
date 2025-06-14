import {
  Editor as MonacoEditor,
  EditorProps,
  Monaco,
} from "@monaco-editor/react";
import { useCallback } from "react";

export function Editor({
  beforeMount: beforeMountProp,
  ...props
}: EditorProps) {
  const dark = document.querySelector(".dark");
  const beforeMount = useCallback(
    (monaco: Monaco) => {
      if (dark) {
        monaco.editor.defineTheme("cartridge-dark", {
          base: "vs-dark",
          inherit: true,
          rules: [],
          colors: {
            "editor.background":
              getComputedStyle(dark).getPropertyValue("--background-200"),
          },
        });
      }

      beforeMountProp?.(monaco);
    },
    [dark, beforeMountProp],
  );

  return (
    <MonacoEditor
      beforeMount={beforeMount}
      theme={dark ? "cartridge-dark" : "vs-light"}
      {...props}
    />
  );
}
