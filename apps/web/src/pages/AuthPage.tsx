import { Boxes, Cloud, Database, LockKeyhole, Route, UploadCloud } from "lucide-react";
import { useState } from "react";
import type { FormEvent } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Button } from "../components/Button";
import { Field } from "../components/Field";
import { Loading } from "../components/Loading";
import { useAuth } from "../lib/auth";

type AuthMode = "sign-in" | "sign-up" | "confirm";

const stackItems = [
  { label: "Cognito", value: "Identity", icon: LockKeyhole },
  { label: "HTTP API", value: "Routing", icon: Route },
  { label: "S3", value: "Files", icon: UploadCloud },
  { label: "Postgres", value: "Data", icon: Database }
];

export function AuthPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<AuthMode>("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
        <div className="w-full max-w-4xl">
          <div className="mb-10 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-md bg-brand text-white shadow-panel">
              <Boxes className="h-6 w-6" />
            </div>
            <div>
              <p className="text-2xl font-semibold">LaunchKit</p>
              <p className="text-muted">Full-stack AWS starter workspace</p>
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
            <div>
              <p className="mb-3 inline-flex items-center gap-2 rounded-md bg-soft px-3 py-1 text-sm font-medium text-brand">
                <Cloud className="h-4 w-4" />
                Dev cloud ready
              </p>
              <h1 className="max-w-2xl text-4xl font-semibold tracking-normal text-ink md:text-5xl">
                A calm starting point for real product work.
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-muted">
                Sign in to see the deployed starter workspace with identity, files, database records, and
                admin controls connected.
              </p>
            </div>

            <div className="rounded-lg border border-line bg-paper p-4 shadow-panel">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm font-semibold text-ink">Stack status</p>
                <span className="rounded-md bg-soft px-2 py-1 text-xs font-medium text-brand">Online</span>
              </div>
              <div className="grid gap-2">
                {stackItems.map((item) => (
                  <div key={item.label} className="flex items-center gap-3 rounded-md bg-field px-3 py-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-md bg-paper text-brand">
                      <item.icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-ink">{item.label}</p>
                      <p className="text-xs text-muted">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
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
              {mode === "confirm"
                ? "Enter the confirmation code from Cognito."
                : "Use the account connected to this environment."}
            </p>
          </div>
          <Field
            label="Email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            required
          />
          {mode !== "confirm" ? (
            <Field
              label="Password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Your password"
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
