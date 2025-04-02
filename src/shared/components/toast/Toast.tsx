import { useCallback, useEffect, useState } from "react";
import { cn } from "@cartridge/ui-next";
import * as icons from "lucide-react";

export type ToastType = "success" | "error" | "info" | "warning";

export interface ToastProps {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
  onClose: () => void;
}

export const Toast = ({
  id,
  message,
  type,
  duration = 3000,
  onClose,
}: ToastProps) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300); // Allow animation to complete before removing
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const getColors = useCallback(() => {
    switch (type) {
      case "success":
        return {
          bgColor: "bg-white",
          textColor: "text-primary",
          borderColor: "border-borderGray",
        };
      case "error":
        return {
          bgColor: "bg-white",
          borderColor: "border-borderGray",
          textColor: "text-primary",
        };
      case "warning":
        return {
          bgColor: "bg-white",
          borderColor: "border-borderGray",
          textColor: "text-primary",
        };
      case "info":
      default:
        return {
          bgColor: "bg-white",
          borderColor: "border-borderGray",
          textColor: "text-primary",
        };
    }
  }, [type]);

  const { bgColor, borderColor, textColor } = getColors();

  return (
    <div
      className={cn(
        "text-sm flex items-center gap-2 p-2 mb-1 max-w-xs shadow-sm transition-all duration-300 ease-in-out border",
        bgColor,
        textColor,
        borderColor,
        isVisible ? "translate-x-0 opacity-100" : "-translate-x-full opacity-0"
      )}
      role="alert"
    >
      <button
        type="button"
        className="text-primary hover:outline hover:outline-1 hover:outline-borderGray"
        aria-label="Close"
        onClick={() => {
          setIsVisible(false);
          setTimeout(onClose, 300);
        }}
      >
        <span className="sr-only">Close</span>
        <icons.X strokeWidth={1.5} width={10} height={10} />
      </button>

      <div className="text-sm font-medium">{message}</div>
    </div>
  );
};
