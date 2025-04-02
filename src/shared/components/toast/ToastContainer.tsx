import { Toast, ToastProps } from "./Toast";

interface ToastContainerProps {
  toasts: ToastProps[];
  removeToast: (id: string) => void;
}

export const ToastContainer = ({
  toasts,
  removeToast,
}: ToastContainerProps) => {
  return (
    <div className="fixed bottom-4 left-4 z-50 flex flex-col items-start">
      {toasts.map((toast) => (
        <Toast
          id={toast.id}
          key={toast.id}
          type={toast.type}
          message={toast.message}
          duration={toast.duration}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );
};
