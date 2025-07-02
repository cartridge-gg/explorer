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
          rules: [
            {
              token: "key",
              foreground:
                getComputedStyle(dark).getPropertyValue("--foreground-200"),
            },
            {
              token: "string.key.json",
              foreground:
                getComputedStyle(dark).getPropertyValue("--foreground-200"),
            },
            {
              token: "string.value.json",
              foreground:
                getComputedStyle(dark).getPropertyValue("--foreground-200"),
            },
            {
              token: "keyword.json",
              foreground:
                getComputedStyle(dark).getPropertyValue("--foreground-200"),
            },
            {
              token: "number",
              foreground:
                getComputedStyle(dark).getPropertyValue("--foreground-200"),
            },
          ],
          colors: {
            "editor.background":
              getComputedStyle(dark).getPropertyValue("--spacer-100"),
            "editor.foreground":
              getComputedStyle(dark).getPropertyValue("--foreground-200"),
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
      options={{
        minimap: {
          enabled: false,
        },
        bracketPairColorization: {
          enabled: false,
        },
      }}
      {...props}
    />
  );
}
