import { useState } from "react";
import type { InputHTMLAttributes, ReactNode } from "react";

type IconProps = { className?: string };

function svgProps(className?: string) {
  return {
    className: className ?? "h-4 w-4",
    fill: "none",
    viewBox: "0 0 24 24",
    strokeWidth: 1.8,
    stroke: "currentColor",
  } as const;
}

export function MailIcon({ className }: IconProps) {
  return (
    <svg {...svgProps(className)}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
    </svg>
  );
}

export function LockIcon({ className }: IconProps) {
  return (
    <svg {...svgProps(className)}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
    </svg>
  );
}

export function UserIcon({ className }: IconProps) {
  return (
    <svg {...svgProps(className)}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
      />
    </svg>
  );
}

function BookIcon({ className }: IconProps) {
  return (
    <svg {...svgProps(className)}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
    </svg>
  );
}

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-10">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-48 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-primary/10 blur-3xl"
      />
      <div className="relative w-full max-w-sm">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-white shadow-lg shadow-primary/25">
            <BookIcon className="h-6 w-6" />
          </div>
          <h1 className="text-lg font-semibold tracking-tight text-foreground">Research Hub</h1>
          <p className="mt-1 text-xs text-muted">A local-first workspace for your research.</p>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm sm:p-7">
          <h2 className="text-lg font-semibold tracking-tight text-foreground">{title}</h2>
          {subtitle && <p className="mt-1 text-sm leading-relaxed text-muted">{subtitle}</p>}
          <div className="mt-6">{children}</div>
        </div>

        {footer && <div className="mt-5 text-center text-sm text-muted">{footer}</div>}

        <p className="mt-8 flex items-center justify-center gap-1.5 text-center text-xs text-faint">
          <LockIcon className="h-3.5 w-3.5" />
          Your research stays on this device.
        </p>
      </div>
    </div>
  );
}

export function PasswordInput({
  icon,
  error,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { icon?: ReactNode; error?: boolean }) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      {icon && (
        <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-faint">
          {icon}
        </span>
      )}
      <input
        {...props}
        type={visible ? "text" : "password"}
        className={`w-full rounded-lg border bg-surface py-2.5 text-sm text-foreground placeholder:text-faint shadow-xs transition-colors ${
          icon ? "pl-9" : "pl-3"
        } pr-10 focus:outline-none focus:ring-2 ${
          error
            ? "border-danger focus:border-danger focus:ring-danger/40"
            : "border-border-strong hover:border-strong focus:border-primary focus:ring-focus/30"
        }`}
      />
      <button
        type="button"
        onClick={() => setVisible((value) => !value)}
        aria-label={visible ? "Hide password" : "Show password"}
        className="absolute inset-y-0 right-0 flex w-9 items-center justify-center text-faint hover:text-foreground"
      >
        {visible ? (
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88"
            />
          </svg>
        ) : (
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z"
            />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
          </svg>
        )}
      </button>
    </div>
  );
}

export function IconInput({
  icon,
  error,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { icon?: ReactNode; error?: boolean }) {
  return (
    <div className="relative">
      {icon && (
        <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-faint">
          {icon}
        </span>
      )}
      <input
        {...props}
        className={`w-full rounded-lg border bg-surface py-2.5 text-sm text-foreground placeholder:text-faint shadow-xs transition-colors ${
          icon ? "pl-9" : "pl-3"
        } pr-3 focus:outline-none focus:ring-2 ${
          error
            ? "border-danger focus:border-danger focus:ring-danger/40"
            : "border-border-strong hover:border-strong focus:border-primary focus:ring-focus/30"
        }`}
      />
    </div>
  );
}

export function FieldError({ children }: { children: string | null | undefined }) {
  if (!children) return null;
  return (
    <p role="alert" className="mt-1 text-xs font-medium text-danger">
      {children}
    </p>
  );
}

export function FormNotice({
  tone,
  children,
}: {
  tone: "error" | "info" | "success";
  children: ReactNode;
}) {
  const toneClasses =
    tone === "error"
      ? "border-danger/30 bg-danger/10 text-danger"
      : tone === "success"
        ? "border-success/30 bg-success/10 text-success"
        : "border-info/30 bg-info/10 text-info";
  return (
    <div
      role={tone === "error" ? "alert" : undefined}
      className={`flex items-start gap-2 rounded-lg border px-3 py-2 text-sm leading-relaxed ${toneClasses}`}
    >
      {tone === "error" && (
        <svg aria-hidden className="mt-0.5 h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
        </svg>
      )}
      <div>{children}</div>
    </div>
  );
}