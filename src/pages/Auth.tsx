import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { errorMessage, supabase } from "../lib/supabase";
import { Button, Card, Field, Input } from "../components/ui";
import { useToast } from "../components/Toast";

type Mode = "signin" | "signup" | "forgot";

/** Only allow in-app paths as redirect targets. */
const safeNext = (n: string | null) => (n && n.startsWith("/") && !n.startsWith("//") ? n : "/dashboard");

export default function Auth() {
  const [params] = useSearchParams();
  const next = safeNext(params.get("next"));
  const [mode, setMode] = useState<Mode>((params.get("mode") as Mode) || "signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState<string | null>(null);
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  useEffect(() => {
    if (!loading && user) navigate(next, { replace: true });
  }, [user, loading, navigate, next]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: name.trim() }, emailRedirectTo: `${window.location.origin}/onboarding` },
        });
        if (error) throw error;
        if (!data.session) setSent(`We sent a confirmation link to ${email}. Open it to finish creating your account.`);
      } else if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast("Signed in");
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        setSent(`If an account exists for ${email}, a reset link is on its way.`);
      }
    } catch (err) {
      toast(errorMessage(err), "error");
    } finally {
      setBusy(false);
    }
  }

  async function google() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}${next}` },
    });
    if (error) toast(errorMessage(error), "error");
  }

  const titles: Record<Mode, [string, string]> = {
    signin: ["Welcome back", "Sign in to your Mentoral account."],
    signup: ["Create your account", "Free for learners and guides."],
    forgot: ["Reset your password", "We will email you a link to choose a new one."],
  };

  return (
    <div className="gutter grid min-h-screen place-items-center bg-surface2/40 py-10">
      <Card className="flex w-full max-w-md flex-col gap-5 p-7">
        <div>
          <Link to="/" className="text-sm text-muted hover:underline">← Back to Mentoral</Link>
          <h1 className="mt-3 text-2xl font-extrabold">{titles[mode][0]}</h1>
          <p className="mt-1 text-sm text-muted">{titles[mode][1]}</p>
        </div>

        {sent ? (
          <div className="rounded-lg bg-accentsoft p-4 text-sm">{sent}</div>
        ) : (
          <>
            {mode !== "forgot" && (
              <>
                <Button variant="ghost" className="w-full" onClick={google} type="button">Continue with Google</Button>
                <div className="flex items-center gap-3 text-xs text-muted">
                  <span className="h-px flex-1 bg-line" /> or <span className="h-px flex-1 bg-line" />
                </div>
              </>
            )}
            <form onSubmit={submit} className="flex flex-col gap-3">
              {mode === "signup" && (
                <Field label="Full name">
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required autoComplete="name" />
                </Field>
              )}
              <Field label="Email">
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
              </Field>
              {mode !== "forgot" && (
                <Field label="Password" hint={mode === "signup" ? "At least 8 characters." : undefined}>
                  <Input
                    id="password"
                    type="password"
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete={mode === "signup" ? "new-password" : "current-password"}
                  />
                </Field>
              )}
              <Button type="submit" loading={busy} className="mt-1 w-full">
                {mode === "signin" ? "Sign in" : mode === "signup" ? "Create account" : "Send reset link"}
              </Button>
            </form>
          </>
        )}

        <div className="flex flex-wrap justify-between gap-2 text-sm">
          {mode === "signin" ? (
            <>
              <button className="font-semibold text-accent" onClick={() => setMode("signup")}>Create an account</button>
              <button className="text-muted hover:text-fg" onClick={() => setMode("forgot")}>Forgot password?</button>
            </>
          ) : (
            <button className="font-semibold text-accent" onClick={() => { setMode("signin"); setSent(null); }}>
              I already have an account
            </button>
          )}
        </div>
        {mode === "signup" && (
          <p className="text-xs text-muted">
            By creating an account you agree to our <Link to="/terms" className="underline">Terms</Link> and{" "}
            <Link to="/privacy" className="underline">Privacy policy</Link>.
          </p>
        )}
      </Card>
    </div>
  );
}
