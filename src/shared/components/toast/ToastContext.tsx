import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useCallback,
} from "react";
import { ToastContainer } from "./ToastContainer";
import { ToastType, ToastVariant } from "./Toast";

/**
 * Context API interface for toast functionality
 */
interface ToastContextType {
  /**
   * Displays a toast notification
   * @param message - Text content to show in the toast
   * @param variant - Visual style (success, error, warning, info)
   * @param duration - How long to show in ms (default: 3000ms)
   */
  toast: (
    message: ToastType["message"],
    variant: ToastVariant,
    duration?: number,
  ) => void;

  /**
   * Removes a specific toast by ID
   * @param id - Unique identifier of toast to remove
   */
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<ToastType[]>([]);

  const showToast = useCallback<ToastContextType["toast"]>(
    (message, variant, duration = 3000) => {
      const id =
        Date.now().toString(36) + Math.random().toString(36).substring(2);
      setToasts((prevToasts) => [
        ...prevToasts,
        { id, message, variant, duration },
      ]);
    },
    [],
  );

  const removeToast = useCallback<ToastContextType["removeToast"]>((id) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast: showToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
};
