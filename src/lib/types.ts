export type DashboardMode = "chat" | "image" | "video";

export type TimelineItem =
  | {
      id: string;
      type: "user" | "assistant";
      text: string;
      isStreaming?: boolean;
      createdAt: number;
    }
  | {
      id: string;
      type: "image";
      prompt: string;
      urls: string[];
      createdAt: number;
    }
  | {
      id: string;
      type: "video";
      prompt: string;
      taskId: string;
      status: "Preparing" | "Queueing" | "Processing" | "Success" | "Fail";
      fileId?: string;
      downloadUrl?: string;
      createdAt: number;
      error?: string;
    };

export type ChatMessagePayload = {
  role: "system" | "user" | "assistant";
  content: string;
};
