import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { minimaxKeyConfigured } from "@/lib/env";

export default function SettingsPage() {
  const configured = minimaxKeyConfigured();

  return (
    <main className="mx-auto w-full max-w-3xl space-y-4 p-6">
      <div>
        <h1 className="text-xl font-semibold">Settings</h1>
        <p className="text-sm text-muted-foreground">
          MiniMax key is managed server-side from environment variables.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Connection</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            Status:{" "}
            <span className={configured ? "text-emerald-600" : "text-amber-600"}>
              {configured ? "Configured" : "Missing API key"}
            </span>
          </p>
          <p className="text-muted-foreground">
            Add `MINIMAX_API_KEY=your_key_here` to `.env.local`, then restart your
            dev server.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Default Models</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-sm text-muted-foreground">
          <p>Chat: `MiniMax-M2.7`</p>
          <p>Image: `image-01`</p>
          <p>Video: `MiniMax-Hailuo-2.3` / `MiniMax-Hailuo-2.3-Fast`</p>
        </CardContent>
      </Card>

      <Link className="text-sm underline" href="/">
        Back to dashboard
      </Link>
    </main>
  );
}
