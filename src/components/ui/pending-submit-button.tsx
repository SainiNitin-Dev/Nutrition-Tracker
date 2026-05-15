"use client";

import { ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";

type PendingSubmitButtonProps = {
  children: ReactNode;
  className: string;
  pendingLabel?: string;
  title?: string;
  ariaLabel?: string;
};

export function PendingSubmitButton({
  children,
  className,
  pendingLabel,
  title,
  ariaLabel,
}: PendingSubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      aria-label={ariaLabel}
      className={className}
      disabled={pending}
      title={title}
      type="submit"
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
