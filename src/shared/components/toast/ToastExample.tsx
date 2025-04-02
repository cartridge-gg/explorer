import { useToast } from "./ToastContext";

export const ToastExample = () => {
  const { toast: showToast } = useToast();

  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-lg font-medium mb-2">Toast Examples</h3>
      <div className="flex flex-wrap gap-2">
        <button
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          onClick={() =>
            showToast("Operation completed successfully!", "success")
          }
        >
          Success Toast
        </button>
        <button
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          onClick={() =>
            showToast(
              "An error occurred while processing your request.",
              "error"
            )
          }
        >
          Error Toast
        </button>
        <button
          className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
          onClick={() =>
            showToast("Please double-check your input.", "warning")
          }
        >
          Warning Toast
        </button>
        <button
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          onClick={() =>
            showToast("This is an informational message.", "info", 50000)
          }
        >
          Info Toast (5s)
        </button>
      </div>
    </div>
  );
};
