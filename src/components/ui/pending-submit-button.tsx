"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";

type PendingSubmitButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  className: string;
  pendingLabel?: string;
};

export function PendingSubmitButton({
  children,
  className,
  pendingLabel,
  disabled,
  type = "submit",
  ...buttonProps
}: PendingSubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      {...buttonProps}
      className={className}
      disabled={pending || disabled}
      type={type}
    >
      {pending ? (
        pendingLabel ? (
          pendingLabel
        ) : (
          <Loader2 className="animate-spin" size={16} aria-hidden />
        )
      ) : (
        children
      )}
    </button>
  );
}
