import React, { useEffect, useState } from "react";
import CloseIcon from "../assets/CloseIcon";
import { createPortal } from "react-dom";
import { cn } from "~~/utils/classNames";

interface Props {
  children: React.ReactNode;
  closeDialog: () => void;
  className?: string;
  open: boolean;
  disableClose?: boolean;
}

function BaseDialog({ children, closeDialog, className, open, disableClose }: Props) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !open) return null;

  return createPortal(
    <div className="fixed inset-0 w-screen h-screen bg-black/90 z-50 flex justify-center items-center">
      <div className={cn("bg-secondary p-6 rounded-lg shadow-lg relative", className)}>
        <button
          className={cn(
            "absolute w-[20px] right-2 text-[20px] font-semibold top-4 cursor-pointer",
            disableClose && "opacity-50",
          )}
          onClick={() => closeDialog()}
          disabled={disableClose}
        >
          <CloseIcon />
        </button>
        <div className="w-full h-full">{children}</div>
      </div>
    </div>,
    document.body,
  );
}

export default BaseDialog;
