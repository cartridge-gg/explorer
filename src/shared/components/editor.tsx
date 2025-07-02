import {
  Editor as MonacoEditor,
  type EditorProps,
  type Monaco,
} from "@monaco-editor/react";
import { useCallback } from "react";

export function Editor({
  beforeMount: beforeMountProp,
  ...props
}: EditorProps) {
  // Extract options from props to prevent complete override
  const { options: propsOptions, ...otherProps } = props;
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
            "editor.indentGuide.background":
              getComputedStyle(dark).getPropertyValue("--spacer-100"),
            "editor.indentGuide.activeBackground":
              getComputedStyle(dark).getPropertyValue("--spacer-100"),
          },
        });
      }

      beforeMountProp?.(monaco);
    },
    [dark, beforeMountProp],
  );

  const defaultOptions = {
    guides: {
      indentation: false,
    },
    bracketPairColorization: {
      enabled: false,
    },
  };

  return (
    <MonacoEditor
      beforeMount={beforeMount}
      theme={dark ? "cartridge-dark" : "vs-light"}
      options={{
        ...defaultOptions,
        ...propsOptions,
      }}
      {...otherProps}
    />
  );
}
