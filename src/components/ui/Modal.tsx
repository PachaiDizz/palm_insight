"use client";

import { useEffect, useRef, useCallback, ReactNode } from "react";
import { X } from "lucide-react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  /** Wider content area for forms with many fields */
  size?: "sm" | "md" | "lg";
  className?: string;
  /** Pinned footer (outside the scrollable body). */
  footer?: ReactNode;
  /** On phones, fill the viewport as a full-height bottom sheet. */
  mobileFull?: boolean;
}

const sizeClasses = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
};

/**
 * Shared modal shell: overlay, Escape, focus trap, restore focus, z-modal token.
 */
export default function Modal({
  open,
  onClose,
  title,
  children,
  size = "md",
  className = "",
  footer,
  mobileFull = false,
}: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const wasOpenRef = useRef(false);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onCloseRef.current();
        return;
      }
      if (e.key !== "Tab" || !panelRef.current) return;

      const focusable = panelRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    },
    []
  );

  useEffect(() => {
    if (!open) {
      wasOpenRef.current = false;
      return;
    }

    previousFocus.current = document.activeElement as HTMLElement | null;
    document.addEventListener("keydown", handleKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // Only focus first interactive element on initial open, not on re-renders
    if (!wasOpenRef.current) {
      wasOpenRef.current = true;
      requestAnimationFrame(() => {
        const panel = panelRef.current;
        if (!panel) return;
        const first = panel.querySelector<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        (first || panel).focus();
      });
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = prevOverflow;
      previousFocus.current?.focus?.();
    };
  }, [open, handleKeyDown]);

  if (!open) return null;

  const widthClass = sizeClasses[size];
  const heightClass = mobileFull
    ? "h-[100dvh] max-h-[100dvh] rounded-none sm:h-auto sm:max-h-[90vh] sm:rounded-2xl"
    : "max-h-[90vh] sm:rounded-2xl rounded-t-2xl";

  return (
    <div
      className="fixed inset-0 flex items-end sm:items-center justify-center sm:p-4"
      style={{ zIndex: "var(--z-modal)" }}
      role="presentation"
    >
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? "modal-title" : undefined}
        tabIndex={-1}
        className={`relative w-full ${widthClass} ${heightClass} flex flex-col card-glow shadow-2xl outline-none ${className}`}
        style={{ backgroundColor: "var(--bg-card)" }}
      >
        {title && (
          <div
            className="flex items-center justify-between gap-3 px-5 py-4 border-b shrink-0"
            style={{ borderColor: "var(--border-default)" }}
          >
            <h2 id="modal-title" className="section-heading text-base text-theme">
              {title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="p-1.5 rounded-lg transition-colors hover:bg-[var(--hover-subtle)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]"
              style={{ color: "var(--text-muted)" }}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        <div className="overflow-y-auto flex-1 p-5">{children}</div>
        {footer && (
          <div
            className="shrink-0 px-5 py-4 border-t"
            style={{ borderColor: "var(--border-default)" }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
