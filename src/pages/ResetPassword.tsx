import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { errorMessage, supabase } from "../lib/supabase";
import { Button, Card, Field, Input, Spinner } from "../components/ui";
import { useToast } from "../components/Toast";

export default function ResetPassword() {
  const { user, loading } = useAuth();
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) return toast(errorMessage(error), "error");
    toast("Password updated");
    navigate("/dashboard");
  }

  return (
    <div className="gutter grid min-h-screen place-items-center py-10">
      <Card className="flex w-full max-w-md flex-col gap-4 p-7">
        <h1 className="text-2xl font-extrabold">Choose a new password</h1>
        {loading ? (
          <Spinner />
        ) : !user ? (
          <p className="text-sm text-muted">
            This reset link has expired or was already used. <Link to="/auth?mode=forgot" className="font-semibold text-accent">Request a new link</Link>.
          </p>
        ) : (
          <form onSubmit={submit} className="flex flex-col gap-3">
            <Field label="New password" hint="At least 8 characters.">
              <Input id="new-password" type="password" minLength={8} required value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
            </Field>
            <Button type="submit" loading={busy}>Save password</Button>
          </form>
        )}
      </Card>
    </div>
  );
}
