import React from "react";
import { cn } from "~~/utils/classNames";

type BadgeProps = {
  children: React.ReactNode;
  type?: "number" | "text" | "code";
};

const TYPE_BADGE = {
  number: "w-5",
  text: "w-max px-2",
  code: "bg-btn-secondary px-2 w-max text-sm text-white font-normal",
};

function Badge({ children, type = "text" }: BadgeProps) {
  return (
    <div
      className={cn(
        "bg-brand-lime rounded-full h-5 flex items-center justify-center text-black font-bold text-xs",
        TYPE_BADGE[type],
      )}
    >
      {children}
    </div>
  );
}

export default Badge;
