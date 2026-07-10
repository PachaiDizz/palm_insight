import { InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes, forwardRef } from "react";

const fieldBase =
  "w-full px-3 py-2.5 rounded-xl text-sm outline-none border transition-colors bg-[var(--bg-input-field)] border-[var(--border-input-field)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent-primary)] focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]/30 disabled:opacity-50";

interface FieldShellProps {
  label?: string;
  error?: string;
  hint?: string;
  htmlFor?: string;
  className?: string;
  children: React.ReactNode;
}

function FieldShell({ label, error, hint, htmlFor, className = "", children }: FieldShellProps) {
  return (
    <div className={className}>
      {label && (
        <label
          htmlFor={htmlFor}
          className="block text-sm font-medium mb-1.5"
          style={{ color: "var(--text-secondary)" }}
        >
          {label}
        </label>
      )}
      {children}
      {error && (
        <p className="mt-1.5 text-xs" style={{ color: "var(--accent-red)" }} role="alert">
          {error}
        </p>
      )}
      {hint && !error && (
        <p className="mt-1.5 text-xs" style={{ color: "var(--text-muted)" }}>
          {hint}
        </p>
      )}
    </div>
  );
}

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  containerClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, id, className = "", containerClassName = "", ...rest }, ref) => {
    const fieldId = id || rest.name;
    return (
      <FieldShell label={label} error={error} hint={hint} htmlFor={fieldId} className={containerClassName}>
        <input
          ref={ref}
          id={fieldId}
          className={`${fieldBase} ${error ? "border-[var(--accent-red)]" : ""} ${className}`}
          aria-invalid={error ? true : undefined}
          {...rest}
        />
      </FieldShell>
    );
  }
);
Input.displayName = "Input";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
  containerClassName?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, id, className = "", containerClassName = "", ...rest }, ref) => {
    const fieldId = id || rest.name;
    return (
      <FieldShell label={label} error={error} hint={hint} htmlFor={fieldId} className={containerClassName}>
        <textarea
          ref={ref}
          id={fieldId}
          className={`${fieldBase} resize-none ${error ? "border-[var(--accent-red)]" : ""} ${className}`}
          aria-invalid={error ? true : undefined}
          {...rest}
        />
      </FieldShell>
    );
  }
);
Textarea.displayName = "Textarea";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
  containerClassName?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, hint, id, className = "", containerClassName = "", children, ...rest }, ref) => {
    const fieldId = id || rest.name;
    return (
      <FieldShell label={label} error={error} hint={hint} htmlFor={fieldId} className={containerClassName}>
        <select
          ref={ref}
          id={fieldId}
          className={`${fieldBase} ${error ? "border-[var(--accent-red)]" : ""} ${className}`}
          aria-invalid={error ? true : undefined}
          {...rest}
        >
          {children}
        </select>
      </FieldShell>
    );
  }
);
Select.displayName = "Select";

export default Input;
