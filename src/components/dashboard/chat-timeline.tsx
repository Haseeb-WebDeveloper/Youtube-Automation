"use client";

import Image from "next/image";

import { ConversationEmptyState } from "@/components/ai-elements/conversation";
import {
  Message,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { TimelineItem } from "@/lib/types";

type ChatTimelineProps = {
  items: TimelineItem[];
};

export function ChatTimeline({ items }: ChatTimelineProps) {
  if (items.length === 0) {
    return (
      <ConversationEmptyState
        className="min-h-[min(420px,50vh)]"
        description="Chat with MiniMax, generate images, or queue a video from the composer."
        title="What can I help with?"
      />
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 py-2">
        {items.map((item) => {
          if (item.type === "user" || item.type === "assistant") {
            const isUser = item.type === "user";
            return (
              <Message key={item.id} from={item.type}>
                <MessageContent
                  className={
                    isUser
                      ? "max-w-[min(100%,42rem)] rounded-[1.5rem] px-4 py-3"
                      : "max-w-[min(100%,48rem)] px-4 py-3 shadow-sm"
                  }
                >
                  {isUser ? (
                    <p className="whitespace-pre-wrap">{item.text}</p>
                  ) : item.isStreaming && !item.text.trim() ? (
                    <span className="inline-flex items-center gap-2 text-muted-foreground">
                      <span className="size-2 animate-pulse rounded-full bg-muted-foreground/70" />
                      <span className="text-sm">Thinking…</span>
                    </span>
                  ) : (
                    <MessageResponse>{item.text}</MessageResponse>
                  )}
                </MessageContent>
              </Message>
            );
          }

          if (item.type === "image") {
            return (
              <Card
                key={item.id}
                className="overflow-hidden rounded-2xl border-border/80 shadow-sm"
              >
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center justify-between text-base font-medium">
                    <span>Image</span>
                    <Badge variant="secondary">image-01</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 pt-0">
                  <p className="text-xs text-muted-foreground">{item.prompt}</p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {item.urls.map((url) => (
                      <Image
                        key={url}
                        src={url}
                        alt="Generated"
                        width={1024}
                        height={1024}
                        unoptimized
                        className="h-auto w-full rounded-xl border border-border/60"
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          }

          if (item.type === "video") {
            return (
              <Card
                key={item.id}
                className="overflow-hidden rounded-2xl border-border/80 shadow-sm"
              >
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center justify-between text-base font-medium">
                    <span>Video</span>
                    <Badge variant="secondary">{item.status}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 pt-0">
                  <p className="text-xs text-muted-foreground">{item.prompt}</p>
                  <p className="font-mono text-[0.65rem] text-muted-foreground">
                    Task: {item.taskId}
                  </p>
                  {item.downloadUrl ? (
                    <video
                      controls
                      className="w-full rounded-xl border border-border/60"
                    >
                      <source src={item.downloadUrl} type="video/mp4" />
                    </video>
                  ) : null}
                  {item.error ? (
                    <p className="text-xs text-destructive">{item.error}</p>
                  ) : null}
                </CardContent>
              </Card>
            );
          }

          return null;
        })}
    </div>
  );
}
