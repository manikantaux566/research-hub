import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../lib/auth/useAuth";
import { AuthShell, FieldError, FormNotice, PasswordInput } from "./AuthShell";
import { Button } from "../../components/ui/Button";
import { Field } from "../../components/ui/Field";

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const { resetPassword } = useAuth();
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{ password?: string; confirm?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next: typeof fieldErrors = {};
    if (!password) next.password = "Please enter a new password.";
    else if (password.length < 8) next.password = "Password must be at least 8 characters.";
    if (password !== confirm) next.confirm = "Passwords do not match.";
    setFieldErrors(next);
    if (Object.keys(next).length > 0) return;

    setFormError(null);
    setSubmitting(true);
    try {
      await resetPassword(token, password);
      navigate("/", { replace: true });
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!token) {
    return (
      <AuthShell
        title="Invalid reset link"
        footer={
          <Link to="/forgot-password" className="font-medium text-link hover:text-link">
            Request a new reset link
          </Link>
        }
      >
        <FormNotice tone="error">
          This reset link is missing or invalid. Please request a new one.
        </FormNotice>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Choose a new password"
      subtitle="Enter a new password for your account."
      footer={
        <>
          Remembered your password?{" "}
          <Link to="/login" className="font-medium text-link hover:text-link">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {formError && <FormNotice tone="error">{formError}</FormNotice>}
        <Field label="New password" htmlFor="reset-password" required hint="At least 8 characters.">
          <PasswordInput
            id="reset-password"
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            aria-required="true"
            placeholder="New password"
          />
          <FieldError>{fieldErrors.password}</FieldError>
        </Field>
        <Field label="Confirm new password" htmlFor="reset-confirm" required>
          <PasswordInput
            id="reset-confirm"
            autoComplete="new-password"
            value={confirm}
            onChange={(event) => setConfirm(event.target.value)}
            aria-required="true"
            placeholder="Repeat new password"
          />
          <FieldError>{fieldErrors.confirm}</FieldError>
        </Field>
        <Button type="submit" variant="primary" disabled={submitting} className="w-full">
          {submitting ? "Resetting…" : "Reset password"}
        </Button>
      </form>
    </AuthShell>
  );
}