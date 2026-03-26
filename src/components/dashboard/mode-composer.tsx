"use client";

import type { KeyboardEvent } from "react";
import { Loader2, Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { DashboardMode } from "@/lib/types";
import { cn } from "@/lib/utils";

type ModeComposerProps = {
  mode: DashboardMode;
  onModeChange: (mode: DashboardMode) => void;
  prompt: string;
  onPromptChange: (value: string) => void;
  firstFrameImage: string;
  onFirstFrameImageChange: (value: string) => void;
  isSubmitting: boolean;
  onSubmit: () => void;
  canSubmit: boolean;
};

export function ModeComposer({
  mode,
  onModeChange,
  prompt,
  onPromptChange,
  firstFrameImage,
  onFirstFrameImageChange,
  isSubmitting,
  onSubmit,
  canSubmit,
}: ModeComposerProps) {
  function handlePromptKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== "Enter" || event.shiftKey) return;
    event.preventDefault();
    if (!canSubmit || isSubmitting) return;
    onSubmit();
  }

  return (
    <div className="shrink-0 border-t border-border/60 bg-background/90 px-3 pt-2 pb-3 backdrop-blur-md supports-backdrop-filter:bg-background/75">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-1.5">
        {mode === "video" ? (
          <Input
            value={firstFrameImage}
            onChange={(event) => onFirstFrameImageChange(event.target.value)}
            placeholder="Optional first-frame image URL (i2v)"
            className="h-8 border-dashed text-xs"
          />
        ) : null}

        <div
          className={cn(
            "flex gap-2 rounded-2xl border border-border/80 bg-muted/40 p-1.5 pl-2 ring-1 ring-foreground/5",
            "focus-within:border-ring/50 focus-within:ring-2 focus-within:ring-ring/30",
          )}
        >
          <ToggleGroup
            type="single"
            value={mode}
            onValueChange={(value) => {
              if (value) onModeChange(value as DashboardMode);
            }}
            variant="outline"
            size="sm"
            spacing={0}
            className="hidden shrink-0 sm:flex"
            aria-label="Output mode"
          >
            <ToggleGroupItem value="chat" className="px-2 text-xs">
              Chat
            </ToggleGroupItem>
            <ToggleGroupItem value="image" className="px-2 text-xs">
              Image
            </ToggleGroupItem>
            <ToggleGroupItem value="video" className="px-2 text-xs">
              Video
            </ToggleGroupItem>
          </ToggleGroup>

          <ToggleGroup
            type="single"
            value={mode}
            onValueChange={(value) => {
              if (value) onModeChange(value as DashboardMode);
            }}
            variant="outline"
            size="sm"
            spacing={0}
            className="flex shrink-0 sm:hidden"
            aria-label="Output mode"
          >
            <ToggleGroupItem value="chat" className="px-1.5 text-[0.65rem]">
              Chat
            </ToggleGroupItem>
            <ToggleGroupItem value="image" className="px-1.5 text-[0.65rem]">
              Img
            </ToggleGroupItem>
            <ToggleGroupItem value="video" className="px-1.5 text-[0.65rem]">
              Vid
            </ToggleGroupItem>
          </ToggleGroup>

          <Textarea
            value={prompt}
            onChange={(event) => onPromptChange(event.target.value)}
            onKeyDown={handlePromptKeyDown}
            placeholder={
              mode === "chat"
                ? "Message…"
                : mode === "image"
                  ? "Describe the image…"
                  : "Describe the video…"
            }
            rows={1}
            className={cn(
              "min-h-9 max-h-30 flex-1 resize-none border-0 bg-transparent py-2 text-sm shadow-none",
              "field-sizing-content placeholder:text-muted-foreground/70",
              "focus-visible:ring-0 focus-visible:ring-offset-0",
            )}
          />

          <Button
            type="button"
            size="icon-sm"
            className="shrink-0 self-end rounded-xl"
            onClick={onSubmit}
            disabled={!canSubmit || isSubmitting}
            aria-label="Send"
          >
            {isSubmitting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Send className="size-4" />
            )}
          </Button>
        </div>

        <p className="px-0.5 text-center text-[0.65rem] text-muted-foreground sm:text-left">
          Enter to send · Shift+Enter new line
        </p>
      </div>
    </div>
  );
}
