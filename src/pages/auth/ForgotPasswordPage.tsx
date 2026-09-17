import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../lib/auth/useAuth";
import { AuthShell, FieldError, FormNotice } from "./AuthShell";
import { Button } from "../../components/ui/Button";
import { Field, TextInput } from "../../components/ui/Field";

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function ForgotPasswordPage() {
  const { requestPasswordReset } = useAuth();
  const [email, setEmail] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [resetLink, setResetLink] = useState<string | undefined>(undefined);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!email.trim()) {
      setFieldError("Please enter your email.");
      return;
    }
    if (!isValidEmail(email)) {
      setFieldError("Please enter a valid email address.");
      return;
    }
    setFieldError(null);
    setSubmitting(true);
    try {
      const result = await requestPasswordReset(email);
      setResetLink(result.resetLink);
      setDone(true);
    } catch {
      setDone(true);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthShell
      title="Reset your password"
      subtitle="Enter the email address for your account."
      footer={
        <>
          Remembered your password?{" "}
          <Link to="/login" className="font-medium text-link hover:text-link">
            Sign in
          </Link>
        </>
      }
    >
      {done ? (
        <div className="space-y-4">
          <FormNotice tone="info">
            If an account exists with that email, a reset link has been sent.
          </FormNotice>
          {resetLink && (
            <div className="space-y-2">
              <p className="text-xs text-muted">
                Development mode: this local server has no email delivery, so the
                reset link is displayed here for testing.
              </p>
              <a
                href={resetLink}
                className="inline-block w-full truncate rounded-md border border-strong bg-surface-muted px-3 py-2 text-xs text-link break-all"
              >
                {resetLink}
              </a>
            </div>
          )}
          <Button variant="secondary" className="w-full" onClick={() => setDone(false)}>
            Back
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <Field label="Email" htmlFor="forgot-email" required>
            <TextInput
              id="forgot-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
            />
            <FieldError>{fieldError}</FieldError>
          </Field>
          <Button type="submit" variant="primary" disabled={submitting} className="w-full">
            {submitting ? "Sending…" : "Send reset link"}
          </Button>
        </form>
      )}
    </AuthShell>
  );
}