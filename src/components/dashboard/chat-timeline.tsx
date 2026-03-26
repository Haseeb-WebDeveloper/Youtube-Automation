"use client";

import Image from "next/image";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { TimelineItem } from "@/lib/types";

type ChatTimelineProps = {
  items: TimelineItem[];
};

export function ChatTimeline({ items }: ChatTimelineProps) {
  if (items.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        Start with chat, image, or video from the composer below.
      </div>
    );
  }

  return (
    <div className="space-y-3 p-4">
      {items.map((item) => {
        if (item.type === "user" || item.type === "assistant") {
          const isUser = item.type === "user";
          return (
            <div
              key={item.id}
              className={`flex ${isUser ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-3xl rounded-2xl px-4 py-2 text-sm ${
                  isUser
                    ? "bg-primary text-primary-foreground"
                    : "bg-card ring-1 ring-border"
                }`}
              >
                <p className="whitespace-pre-wrap">{item.text}</p>
                {item.isStreaming ? (
                  <p className="mt-1 text-xs opacity-70">Streaming...</p>
                ) : null}
              </div>
            </div>
          );
        }

        if (item.type === "image") {
          return (
            <Card key={item.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Image Result</span>
                  <Badge variant="secondary">Image</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
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
                      className="h-auto w-full rounded-lg border"
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        }

        if (item.type === "video") {
          return (
            <Card key={item.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Video Job</span>
                  <Badge variant="secondary">{item.status}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-xs text-muted-foreground">{item.prompt}</p>
                <p className="text-xs">Task ID: {item.taskId}</p>
                {item.downloadUrl ? (
                  <video controls className="w-full rounded-lg border">
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
