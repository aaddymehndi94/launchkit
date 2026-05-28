import { Boxes } from "lucide-react";
import { useState } from "react";
import type { FormEvent } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Button } from "../components/Button";
import { Field } from "../components/Field";
import { Loading } from "../components/Loading";
import { useAuth } from "../lib/auth";

type AuthMode = "sign-in" | "sign-up" | "confirm";

export function AuthPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<AuthMode>("sign-in");
  const [email, setEmail] = useState("user@example.com");
  const [password, setPassword] = useState("Password123!");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (auth.status === "loading") {
    return <Loading />;
  }

  if (auth.status === "authenticated") {
    return <Navigate to="/dashboard" replace />;
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);

    try {
      if (mode === "sign-in") {
        await auth.signInWithEmail(email, password);
        navigate("/dashboard");
      } else if (mode === "sign-up") {
        await auth.signUpWithEmail(email, password);
        setMode("confirm");
      } else {
        await auth.confirmEmail(email, code);
        await auth.signInWithEmail(email, password);
        navigate("/dashboard");
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Authentication failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="grid min-h-screen bg-[#f6f7f4] lg:grid-cols-[minmax(0,1fr)_440px]">
      <section className="flex items-center px-6 py-10 lg:px-12">
        <div className="max-w-3xl">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-md bg-brand text-white">
              <Boxes className="h-6 w-6" />
            </div>
            <div>
              <p className="text-2xl font-semibold">LaunchKit</p>
              <p className="text-muted">Full-stack AWS starter workspace</p>
            </div>
          </div>
          <h1 className="max-w-2xl text-4xl font-semibold tracking-normal text-ink md:text-5xl">
            A clean base for products that need auth, files, data, and admin control.
          </h1>
          <div className="mt-8 grid gap-3 text-sm text-muted sm:grid-cols-3">
            <p className="rounded-lg border border-line bg-paper p-4">Cognito-backed accounts</p>
            <p className="rounded-lg border border-line bg-paper p-4">Lambda HTTP API</p>
            <p className="rounded-lg border border-line bg-paper p-4">Postgres migrations</p>
          </div>
        </div>
      </section>

      <section className="flex items-center border-l border-line bg-paper px-6 py-10">
        <form onSubmit={(event) => void submit(event)} className="mx-auto grid w-full max-w-sm gap-5">
          <div>
            <p className="text-2xl font-semibold">
              {mode === "sign-in" ? "Sign in" : mode === "sign-up" ? "Create account" : "Confirm email"}
            </p>
            <p className="mt-1 text-sm text-muted">
              Local dev accepts any password. Use admin@example.com to see admin screens.
            </p>
          </div>
          <Field
            label="Email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
          {mode !== "confirm" ? (
            <Field
              label="Password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          ) : (
            <Field
              label="Confirmation code"
              value={code}
              onChange={(event) => setCode(event.target.value)}
              required
            />
          )}
          {error ? <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
          <Button disabled={busy} type="submit">
            {busy ? "Working..." : mode === "sign-in" ? "Sign in" : mode === "sign-up" ? "Create account" : "Confirm"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => setMode(mode === "sign-in" ? "sign-up" : "sign-in")}
          >
            {mode === "sign-in" ? "Create a new account" : "Back to sign in"}
          </Button>
        </form>
      </section>
    </main>
  );
}
