import { createContext, useContext, useState, ReactNode } from "react";
import { ToastContainer } from "./ToastContainer";
import { ToastType } from "./Toast";

type Toast = {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
};

/**
 * Context API interface for toast functionality
 */
interface ToastContextType {
  /**
   * Displays a toast notification
   * @param message - Text content to show in the toast
   * @param type - Visual style (success, error, warning, info)
   * @param duration - How long to show in ms (default: 3000ms)
   */
  toast: (message: string, type: ToastType, duration?: number) => void;
  
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
  const [toasts, setToasts] = useState<Toast[]>([]);

  const generateUniqueId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  };

  const showToast = (message: string, type: ToastType, duration = 3000) => {
    const id = generateUniqueId();
    setToasts((prevToasts) => [...prevToasts, { id, message, type, duration }]);
  };

  const removeToast = (id: string) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
  };

  return (
    <ToastContext.Provider value={{ toast: showToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
};
