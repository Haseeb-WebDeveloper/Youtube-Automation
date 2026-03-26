"use client";

import Link from "next/link";
import { Sparkles, Settings, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";

type AppSidebarProps = {
  onNewChat: () => void;
};

export function AppSidebar({ onNewChat }: AppSidebarProps) {
  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r bg-muted/30 p-4 md:flex">
      <div className="mb-6 flex items-center gap-2">
        <div className="rounded-md bg-primary/15 p-2 text-primary">
          <Sparkles className="size-4" />
        </div>
        <div>
          <p className="text-sm font-semibold">MiniMax Studio</p>
          <p className="text-xs text-muted-foreground">Claude-like dashboard</p>
        </div>
      </div>

      <Button onClick={onNewChat} className="justify-start gap-2">
        <Plus className="size-4" />
        New chat
      </Button>

      <div className="mt-auto">
        <Button asChild variant="ghost" className="w-full justify-start gap-2">
          <Link href="/settings">
            <Settings className="size-4" />
            Settings
          </Link>
        </Button>
      </div>
    </aside>
  );
}
