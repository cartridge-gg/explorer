import { Toast, ToastType } from "./Toast";

interface ToastContainerProps {
  toasts: ToastType[];
  removeToast: (id: string) => void;
}

export const ToastContainer = ({
  toasts,
  removeToast,
}: ToastContainerProps) => {
  return (
    <div className="fixed bottom-4 left-4 z-40 flex flex-col items-start">
      {toasts.map((toast) => (
        <Toast
          id={toast.id}
          key={toast.id}
          variant={toast.variant}
          message={toast.message}
          duration={toast.duration}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );
};
