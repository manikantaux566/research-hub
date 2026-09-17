import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../lib/auth/useAuth";
import { AuthShell, FieldError, FormNotice, IconInput, LockIcon, MailIcon, PasswordInput, UserIcon } from "./AuthShell";
import { Button } from "../../components/ui/Button";
import { Field } from "../../components/ui/Field";

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function SignupPage() {
  const { signUp, error: sessionError } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{
    displayName?: string;
    email?: string;
    password?: string;
    confirm?: string;
  }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next: typeof fieldErrors = {};
    if (!email.trim()) next.email = "Please enter your email.";
    else if (!isValidEmail(email)) next.email = "Please enter a valid email address.";
    if (!password) next.password = "Please enter a password.";
    else if (password.length < 8) next.password = "Password must be at least 8 characters.";
    if (password !== confirm) next.confirm = "Passwords do not match.";
    setFieldErrors(next);
    if (Object.keys(next).length > 0) return;

    setFormError(null);
    setSubmitting(true);
    try {
      await signUp({ email, password, displayName: displayName.trim() || undefined });
      navigate("/", { replace: true });
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthShell
      title="Create your account"
      subtitle="A few details and you can start researching. Everything you create is stored locally on this device."
      footer={
        <>
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-link hover:text-link">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {sessionError && <FormNotice tone="error">{sessionError}</FormNotice>}
        {formError && <FormNotice tone="error">{formError}</FormNotice>}
        <Field label="Display name" htmlFor="signup-name" hint="Optional. Shown in the app header.">
          <IconInput
            id="signup-name"
            type="text"
            autoComplete="name"
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            placeholder="Jane Researcher"
            icon={<UserIcon />}
          />
          <FieldError>{fieldErrors.displayName}</FieldError>
        </Field>
        <Field label="Email" htmlFor="signup-email" required>
          <IconInput
            id="signup-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            aria-required="true"
            placeholder="you@example.com"
            icon={<MailIcon />}
            error={!!fieldErrors.email}
          />
          <FieldError>{fieldErrors.email}</FieldError>
        </Field>
        <Field label="Password" htmlFor="signup-password" required hint="At least 8 characters.">
          <PasswordInput
            id="signup-password"
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            aria-required="true"
            placeholder="Create a password"
            icon={<LockIcon />}
            error={!!fieldErrors.password}
          />
          <FieldError>{fieldErrors.password}</FieldError>
        </Field>
        <Field label="Confirm password" htmlFor="signup-confirm" required>
          <PasswordInput
            id="signup-confirm"
            autoComplete="new-password"
            value={confirm}
            onChange={(event) => setConfirm(event.target.value)}
            aria-required="true"
            placeholder="Repeat your password"
            icon={<LockIcon />}
            error={!!fieldErrors.confirm}
          />
          <FieldError>{fieldErrors.confirm}</FieldError>
        </Field>
        <Button type="submit" variant="primary" disabled={submitting} className="mt-1 w-full">
          {submitting ? "Creating account…" : "Create account"}
        </Button>
      </form>
    </AuthShell>
  );
}