import { Card } from "../components/ui";

export default function Setup() {
  return (
    <div className="gutter grid min-h-screen place-items-center py-10">
      <Card className="flex max-w-lg flex-col gap-4">
        <h1 className="text-2xl font-extrabold">Connect Mentoral to Supabase</h1>
        <p className="text-muted">The app needs a Supabase project before it can run.</p>
        <ol className="list-decimal space-y-2 pl-5 text-sm">
          <li>Create a free project at supabase.com.</li>
          <li>In the SQL Editor, run the file <code className="font-mono">supabase/schema.sql</code>.</li>
          <li>
            Copy <code className="font-mono">.env.example</code> to <code className="font-mono">.env</code> and fill in your
            Project URL and anon public key (Project Settings → API).
          </li>
          <li>Restart the dev server. On a host, add the same two variables in its settings and redeploy.</li>
        </ol>
      </Card>
    </div>
  );
}
