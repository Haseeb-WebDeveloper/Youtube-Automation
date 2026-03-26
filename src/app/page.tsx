"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { ChatTimeline } from "@/components/dashboard/chat-timeline";
import { ModeComposer } from "@/components/dashboard/mode-composer";
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
  const scrollEndRef = useRef<HTMLDivElement>(null);
  const prevItemsLengthRef = useRef(0);

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

  useLayoutEffect(() => {
    const el = scrollEndRef.current;
    if (!el) return;
    const lengthChanged = items.length !== prevItemsLengthRef.current;
    prevItemsLengthRef.current = items.length;
    el.scrollIntoView({
      behavior: lengthChanged ? "smooth" : "auto",
      block: "end",
    });
  }, [items]);

  async function handleChat() {
    const userMessage: TimelineItem = {
      id: uid("user"),
      type: "user",
      text: prompt,
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
    setPrompt("");

    // Exclude empty assistant placeholders (streaming slot) — API requires non-empty content.
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

  async function handleImage() {
    const currentPrompt = prompt;
    setPrompt("");
    const response = await fetch("/api/image/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: currentPrompt,
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
        prompt: currentPrompt,
        urls: result.urls ?? [],
        createdAt: Date.now(),
      },
    ]);
  }

  async function handleVideo() {
    const currentPrompt = prompt;
    const currentFirstFrameImage = firstFrameImage;
    setPrompt("");
    setFirstFrameImage("");

    const response = await fetch("/api/video/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: currentFirstFrameImage ? "MiniMax-Hailuo-2.3-Fast" : "MiniMax-Hailuo-2.3",
        prompt: currentPrompt,
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
        prompt: currentPrompt,
        taskId: result.taskId,
        status: "Preparing",
        createdAt: Date.now(),
      },
    ]);
  }

  async function handleSubmit() {
    if (!prompt.trim()) return;

    setIsSubmitting(true);
    try {
      if (mode === "chat") {
        await handleChat();
      } else if (mode === "image") {
        await handleImage();
      } else {
        await handleVideo();
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
       

        <div className="min-h-0 flex-1 overflow-auto">
          <div className="mx-auto w-full max-w-4xl">
            <ChatTimeline items={items} />
            <div ref={scrollEndRef} aria-hidden className="h-px shrink-0" />
          </div>
        </div>

        <ModeComposer
          mode={mode}
          onModeChange={setMode}
          prompt={prompt}
          onPromptChange={setPrompt}
          firstFrameImage={firstFrameImage}
          onFirstFrameImageChange={setFirstFrameImage}
          isSubmitting={isSubmitting}
          canSubmit={Boolean(prompt.trim())}
          onSubmit={handleSubmit}
        />
      </main>
    </div>
  );
}
