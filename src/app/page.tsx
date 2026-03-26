"use client";

import { useEffect, useMemo, useState } from "react";

import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { ChatTimeline } from "@/components/dashboard/chat-timeline";
import { ModeComposer } from "@/components/dashboard/mode-composer";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import type { ChatMessagePayload, DashboardMode, TimelineItem } from "@/lib/types";

function uid(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function isVideoTimelineItem(
  item: TimelineItem,
): item is Extract<TimelineItem, { type: "video" }> {
  return item.type === "video";
}

function isTextTimelineItem(
  item: TimelineItem,
): item is Extract<TimelineItem, { type: "user" | "assistant" }> {
  return item.type === "user" || item.type === "assistant";
}

export default function Home() {
  const [mode, setMode] = useState<DashboardMode>("chat");
  const [prompt, setPrompt] = useState("");
  const [firstFrameImage, setFirstFrameImage] = useState("");
  const [items, setItems] = useState<TimelineItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isStreamingChat = useMemo(
    () =>
      items.some(
        (item) => item.type === "assistant" && item.isStreaming === true,
      ),
    [items],
  );

  const activeVideoTasks = useMemo(
    () =>
      items
        .filter(isVideoTimelineItem)
        .filter((item) => item.status !== "Success" && item.status !== "Fail"),
    [items],
  );

  useEffect(() => {
    if (activeVideoTasks.length === 0) return;

    const interval = setInterval(async () => {
      for (const task of activeVideoTasks) {
        const response = await fetch(
          `/api/video/status?taskId=${encodeURIComponent(task.taskId)}`,
          { method: "GET" },
        );
        const result = await response.json();
        if (!response.ok) {
          setItems((previous) =>
            previous.map((item) =>
              item.type === "video" && item.taskId === task.taskId
                ? { ...item, status: "Fail", error: result.error ?? "Video failed" }
                : item,
            ),
          );
          continue;
        }

        setItems((previous) =>
          previous.map((item) =>
            item.type === "video" && item.taskId === task.taskId
              ? {
                  ...item,
                  status: result.status,
                  fileId: result.fileId,
                  downloadUrl: result.downloadUrl,
                }
              : item,
          ),
        );
      }
    }, 8000);

    return () => clearInterval(interval);
  }, [activeVideoTasks]);

  async function handleChat(text: string) {
    const userMessage: TimelineItem = {
      id: uid("user"),
      type: "user",
      text,
      createdAt: Date.now(),
    };
    const assistantId = uid("assistant");
    const assistantMessage: TimelineItem = {
      id: assistantId,
      type: "assistant",
      text: "",
      isStreaming: true,
      createdAt: Date.now(),
    };

    const nextItems = [...items, userMessage, assistantMessage];
    setItems(nextItems);

    const messages: ChatMessagePayload[] = nextItems
      .filter(isTextTimelineItem)
      .filter((item) => item.text.trim().length > 0)
      .map((item) => ({
        role: item.type === "user" ? "user" : "assistant",
        content: item.text,
      }));

    const response = await fetch("/api/chat/stream", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages }),
    });

    if (!response.ok || !response.body) {
      const err = await response.json().catch(() => ({}));
      setItems((previous) =>
        previous.map((item) =>
          item.id === assistantId
            ? {
                ...item,
                text: err.error ?? "Chat stream failed.",
                isStreaming: false,
              }
            : item,
        ),
      );
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullText = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      fullText += decoder.decode(value, { stream: true });
      setItems((previous) =>
        previous.map((item) =>
          item.id === assistantId ? { ...item, text: fullText } : item,
        ),
      );
    }

    setItems((previous) =>
      previous.map((item) =>
        item.id === assistantId ? { ...item, isStreaming: false } : item,
      ),
    );
  }

  async function handleImage(text: string) {
    const response = await fetch("/api/image/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: text,
        model: "image-01",
        aspectRatio: "1:1",
      }),
    });
    const result = await response.json();
    if (!response.ok) {
      setItems((previous) => [
        ...previous,
        {
          id: uid("assistant"),
          type: "assistant",
          text: result.error ?? "Image generation failed.",
          createdAt: Date.now(),
        },
      ]);
      return;
    }

    setItems((previous) => [
      ...previous,
      {
        id: uid("image"),
        type: "image",
        prompt: text,
        urls: result.urls ?? [],
        createdAt: Date.now(),
      },
    ]);
  }

  async function handleVideo(text: string) {
    const currentFirstFrameImage = firstFrameImage;

    const response = await fetch("/api/video/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: text,
        firstFrameImage: currentFirstFrameImage || undefined,
        duration: 6,
        resolution: "768P",
      }),
    });
    const result = await response.json();
    if (!response.ok) {
      setItems((previous) => [
        ...previous,
        {
          id: uid("assistant"),
          type: "assistant",
          text: result.error ?? "Video generation failed.",
          createdAt: Date.now(),
        },
      ]);
      return;
    }

    setItems((previous) => [
      ...previous,
      {
        id: uid("video"),
        type: "video",
        prompt: text,
        taskId: result.taskId,
        status: "Preparing",
        createdAt: Date.now(),
      },
    ]);
  }

  async function handleSubmit(text: string) {
    if (!text.trim()) return;

    setPrompt("");
    setIsSubmitting(true);
    try {
      if (mode === "chat") {
        await handleChat(text);
      } else if (mode === "image") {
        await handleImage(text);
      } else {
        setFirstFrameImage("");
        await handleVideo(text);
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleNewChat() {
    setItems([]);
    setPrompt("");
    setFirstFrameImage("");
    setMode("chat");
  }

  return (
    <div className="flex h-dvh">
      <AppSidebar onNewChat={handleNewChat} />
      <main className="flex min-w-0 flex-1 flex-col">
        <Conversation className="min-h-0 flex-1">
          <ConversationContent className="mx-auto w-full px-2 pt-4 pb-2">
            <ChatTimeline items={items} />
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>

        <ModeComposer
          mode={mode}
          onModeChange={setMode}
          prompt={prompt}
          onPromptChange={setPrompt}
          firstFrameImage={firstFrameImage}
          onFirstFrameImageChange={setFirstFrameImage}
          isSubmitting={isSubmitting}
          isStreamingChat={isStreamingChat}
          canSubmit={Boolean(prompt.trim())}
          onSubmit={handleSubmit}
        />
      </main>
    </div>
  );
}
