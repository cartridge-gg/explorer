import { ReactNode, useEffect, useRef } from "react";

export interface ModalProps {
  /** Controls whether the modal is displayed */
  isOpen: boolean;
  /** Function to call when the modal should close */
  onClose: () => void;
  /** Content to be rendered inside the modal */
  children?: ReactNode;
}

export interface ModalTitleProps {
  title: string;
}

export function ModalTitle({ title }: ModalTitleProps) {
  return (
    <div className="flex flex-col gap-5 mb-6">
      <h2 className="text-lg font-bold uppercase">{title}</h2>
    </div>
  );
}

export function Modal({ isOpen, onClose, children }: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  // Click outside handler for the entire modal system
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Create a wrapper check that includes both the main modal ref and expanded modal
      const expandedModalElement = document.getElementById("call-detail-modal");
      const isClickInsideExpandedModal = expandedModalElement
        ? expandedModalElement.contains(event.target as Node)
        : false;

      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node) &&
        !isClickInsideExpandedModal
      ) {
        // Only close if click is outside both the main modal and expanded modal
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-[2px] z-50 flex items-center justify-center p-4">
      <div className="relative flex">
        <div
          ref={modalRef}
          className="relative bg-white p-[15px] shadow-lg overflow-hidden flex flex-col border border-borderGray"
        >
          {children}
        </div>
      </div>
    </div>
  );
}
