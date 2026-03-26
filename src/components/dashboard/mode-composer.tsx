"use client";

import { ImageIcon, MessageSquare, Video } from "lucide-react";

import {
  PromptInput,
  type PromptInputMessage,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
} from "@/components/ai-elements/prompt-input";
import { Suggestion, Suggestions } from "@/components/ai-elements/suggestion";
import { Input } from "@/components/ui/input";
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
  isStreamingChat: boolean;
  onSubmit: (text: string) => void | Promise<void>;
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
  isStreamingChat,
  onSubmit,
  canSubmit,
}: ModeComposerProps) {
  const busy = isSubmitting || isStreamingChat;

  function handlePromptSubmit(message: PromptInputMessage) {
    const text = message.text?.trim() ?? "";
    if (!text || busy || !canSubmit) return;
    return onSubmit(text);
  }

  const modeSuggestions: { label: string; text: string }[] =
    mode === "chat"
      ? [
          { label: "Explain an error", text: "What's causing this error?" },
          { label: "Refactor", text: "Refactor this for clarity and tests." },
        ]
      : mode === "image"
      ? [
          { label: "Product shot", text: "Minimal product photo, soft light." },
          {
            label: "Icon",
            text: "Flat app icon, rounded square, blue accent.",
          },
        ]
      : [
          {
            label: "B-roll",
            text: "Slow cinematic drone shot over coastline.",
          },
          {
            label: "Abstract",
            text: "Abstract fluid motion, dark background.",
          },
        ];

  return (
    <div className="shrink-0 border-t border-border/60 bg-background/90 px-3 pt-2 pb-3 backdrop-blur-md supports-backdrop-filter:bg-background/75">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-3">
        <Suggestions className="px-0.5">
          {modeSuggestions.map(({ label, text }) => (
            <Suggestion
              suggestion={text}
              key={label}
              className="border-border/80 bg-muted/30 text-xs font-normal"
              onClick={() => {
                onPromptChange(text);
              }}
              variant="outline"
            >
              {text}
            </Suggestion>
          ))}
        </Suggestions>

        {mode === "video" ? (
          <Input
            value={firstFrameImage}
            onChange={(event) => onFirstFrameImageChange(event.target.value)}
            placeholder="Optional first-frame image URL (image-to-video)"
            className="h-9 rounded-xl border-dashed text-xs"
          />
        ) : null}

        <PromptInput
          className="rounded-[1.75rem] border border-border/80 bg-muted/40 shadow-sm ring-1 ring-black/5 dark:ring-white/10"
          onSubmit={handlePromptSubmit}
        >
          <PromptInputTextarea
            className="px-4 text-base md:text-sm"
            onChange={(e) => onPromptChange(e.target.value)}
            placeholder={
              mode === "chat"
                ? "Ask anything"
                : mode === "image"
                ? "Describe the image…"
                : "Describe the video…"
            }
            value={prompt}
            disabled={busy}
          />
          <PromptInputFooter className="border-t border-border/50 p-2">
            <PromptInputTools>
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
                <ToggleGroupItem
                  value="chat"
                  className="gap-1.5 px-2.5 text-xs"
                >
                  <MessageSquare className="size-3.5 opacity-70" />
                  Chat
                </ToggleGroupItem>
                <ToggleGroupItem
                  value="image"
                  className="gap-1.5 px-2.5 text-xs"
                >
                  <ImageIcon className="size-3.5 opacity-70" />
                  Image
                </ToggleGroupItem>
                <ToggleGroupItem
                  value="video"
                  className="gap-1.5 px-2.5 text-xs"
                >
                  <Video className="size-3.5 opacity-70" />
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
                <ToggleGroupItem value="chat" className="px-2 text-[0.65rem]">
                  Chat
                </ToggleGroupItem>
                <ToggleGroupItem value="image" className="px-2 text-[0.65rem]">
                  Img
                </ToggleGroupItem>
                <ToggleGroupItem value="video" className="px-2 text-[0.65rem]">
                  Vid
                </ToggleGroupItem>
              </ToggleGroup>
            </PromptInputTools>

            <PromptInputSubmit
              className={cn(
                "rounded-xl",
                !canSubmit || busy ? "opacity-60" : "shadow-sm"
              )}
              disabled={!canSubmit || busy}
              status={isSubmitting || isStreamingChat ? "submitted" : undefined}
            />
          </PromptInputFooter>
        </PromptInput>

        <p className="px-1 text-center text-[0.65rem] text-muted-foreground sm:text-left">
          Enter to send · Shift+Enter for a new line · AI can make mistakes.
        </p>
      </div>
    </div>
  );
}
