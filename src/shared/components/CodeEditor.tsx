import React, { useState, useEffect, useRef } from "react";

// This component implements a simple code editor with inline suggestions
const CodeEditorWithSuggestions = () => {
  const [code, setCode] = useState("// Start typing your code here\n");
  const [suggestions, setSuggestions] = useState([]);
  const [suggestionIndex, setSuggestionIndex] = useState(0);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [cursorPosition, setCursorPosition] = useState({ line: 0, ch: 0 });
  const editorRef = useRef(null);

  // Sample suggestions database - in a real app, this would be much more extensive
  const suggestionDatabase = {
    con: ["console", "const", "constructor"],
    "console.": [
      "console.log",
      "console.error",
      "console.warn",
      "console.info",
    ],
    func: ["function", "function()", "function() {}"],
    set: ["setState", "setTimeout", "setInterval"],
    imp: ["import", 'import React from "react"', "implements"],
    use: [
      "useState",
      "useEffect",
      "useRef",
      "useContext",
      "useMemo",
      "useCallback",
    ],
    for: ["for (let i = 0; i < array.length; i++) {}", "forEach"],
    if: ["if (condition) {}", "if (condition) {} else {}"],
  };

  // Get current word that the user is typing
  const getCurrentWord = () => {
    const lines = code.split("\n");
    const currentLine = lines[cursorPosition.line] || "";

    if (cursorPosition.ch === 0) return "";

    let startPos = cursorPosition.ch - 1;
    while (startPos >= 0 && /[a-zA-Z0-9_.]/i.test(currentLine[startPos])) {
      startPos--;
    }

    return currentLine.substring(startPos + 1, cursorPosition.ch);
  };

  // Update suggestions based on current word
  useEffect(() => {
    const currentWord = getCurrentWord();

    if (currentWord.length >= 2) {
      // Look for suggestions in our database
      let matchedSuggestions = [];

      Object.keys(suggestionDatabase).forEach((key) => {
        if (key.startsWith(currentWord.toLowerCase())) {
          matchedSuggestions = [
            ...matchedSuggestions,
            ...suggestionDatabase[key],
          ];
        }
      });

      // Also check if we're typing a method
      if (currentWord.includes(".")) {
        const parts = currentWord.split(".");
        const prefix = parts.slice(0, -1).join(".") + ".";
        const matchingPrefixes = Object.keys(suggestionDatabase).filter(
          (k) => k === prefix
        );

        if (matchingPrefixes.length > 0) {
          matchedSuggestions = [
            ...matchedSuggestions,
            ...suggestionDatabase[prefix],
          ];
        }
      }

      if (matchedSuggestions.length > 0) {
        setSuggestions(matchedSuggestions);
        setSuggestionIndex(0);
        setShowSuggestions(true);
      } else {
        setShowSuggestions(false);
      }
    } else {
      setShowSuggestions(false);
    }
  }, [code, cursorPosition]);

  // Handle key events for navigation and suggestion acceptance
  const handleKeyDown = (e) => {
    if (showSuggestions) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSuggestionIndex((prevIndex) =>
          prevIndex < suggestions.length - 1 ? prevIndex + 1 : 0
        );
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSuggestionIndex((prevIndex) =>
          prevIndex > 0 ? prevIndex - 1 : suggestions.length - 1
        );
      } else if (e.key === "Tab" || e.key === "Enter") {
        e.preventDefault();
        acceptSuggestion(suggestions[suggestionIndex]);
      } else if (e.key === "Escape") {
        setShowSuggestions(false);
      }
    }
  };

  // Accept and apply the selected suggestion
  const acceptSuggestion = (suggestion) => {
    const lines = code.split("\n");
    const currentLine = lines[cursorPosition.line] || "";
    const currentWord = getCurrentWord();

    // Calculate position where the current word starts
    let startPos = cursorPosition.ch - currentWord.length;

    // Replace the current word with the suggestion
    const beforeWord = currentLine.substring(0, startPos);
    const afterWord = currentLine.substring(cursorPosition.ch);
    const newLine = beforeWord + suggestion + afterWord;

    // Update the code
    lines[cursorPosition.line] = newLine;
    setCode(lines.join("\n"));

    // Update cursor position to the end of the inserted suggestion
    const newPosition = startPos + suggestion.length;
    setCursorPosition({ ...cursorPosition, ch: newPosition });

    // Hide suggestions
    setShowSuggestions(false);

    // Focus back on the editor
    if (editorRef.current) {
      editorRef.current.focus();
    }
  };

  // Update cursor position when user clicks or types
  const handleCursorChange = (e) => {
    const target = e.target;
    const selectionStart = target.selectionStart;

    // Calculate line and character position from selectionStart
    const textBeforeCursor = code.substring(0, selectionStart);
    const lines = textBeforeCursor.split("\n");
    const line = lines.length - 1;
    const ch = lines[lines.length - 1].length;

    setCursorPosition({ line, ch });
  };

  const handleChange = (e) => {
    setCode(e.target.value);
    handleCursorChange(e);
  };

  // Calculate suggestion box position
  const getSuggestionBoxStyle = () => {
    if (!editorRef.current) return {};

    const lines = code.split("\n");
    const linesBefore = lines.slice(0, cursorPosition.line);
    const lineHeight = 20; // Approximate line height in pixels

    return {
      position: "absolute",
      top: linesBefore.length * lineHeight + "px",
      left: `${Math.min(
        cursorPosition.ch * 8,
        editorRef.current.clientWidth - 200
      )}px`,
    };
  };

  return (
    <div className="code-editor-container" style={{ position: "relative" }}>
      <textarea
        ref={editorRef}
        className="code-editor"
        value={code}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onClick={handleCursorChange}
        onBlur={() => setTimeout(() => setShowSuggestions(false), 100)}
        style={{
          width: "100%",
          height: "400px",
          padding: "10px",
          fontFamily: "monospace",
          fontSize: "14px",
          lineHeight: "20px",
          backgroundColor: "#1e1e1e",
          color: "#d4d4d4",
          border: "1px solid #333",
          borderRadius: "4px",
          resize: "none",
          outline: "none",
          whiteSpace: "pre",
          overflowWrap: "normal",
          overflowX: "auto",
        }}
      />

      {showSuggestions && (
        <div
          className="suggestions-box"
          style={{
            ...getSuggestionBoxStyle(),
            width: "200px",
            maxHeight: "150px",
            overflowY: "auto",
            backgroundColor: "#252525",
            border: "1px solid #454545",
            borderRadius: "3px",
            zIndex: 1000,
          }}
        >
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {suggestions.map((suggestion, index) => (
              <li
                key={index}
                onClick={() => acceptSuggestion(suggestion)}
                style={{
                  padding: "5px 10px",
                  cursor: "pointer",
                  backgroundColor:
                    index === suggestionIndex ? "#0e639c" : "transparent",
                  color: "#ffffff",
                }}
              >
                {suggestion}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div
        className="instructions"
        style={{ marginTop: "10px", fontSize: "14px", color: "#888" }}
      >
        <p>
          Start typing to see suggestions. Use arrow keys to navigate, Enter/Tab
          to accept.
        </p>
        <p>
          Try typing: "con", "func", "imp", "use", "for", "if", "set" or
          "console."
        </p>
      </div>
    </div>
  );
};

export default CodeEditorWithSuggestions;
