import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

import { getMinimaxApiKey } from "@/lib/env";

const minimaxBaseUrl = "https://api.minimax.io/v1";

type MiniMaxBaseResp = {
  status_code?: number;
  status_msg?: string;
};

type MiniMaxWrappedResponse<T> = T & {
  base_resp?: MiniMaxBaseResp;
};

export type MiniMaxVideoCreatePayload = {
  model: string;
  prompt?: string;
  first_frame_image?: string;
  last_frame_image?: string;
  duration?: number;
  resolution?: "512P" | "720P" | "768P" | "1080P";
  prompt_optimizer?: boolean;
};

export type MiniMaxImagePayload = {
  model: "image-01" | "image-01-live";
  prompt: string;
  aspect_ratio?: "1:1" | "16:9" | "4:3" | "3:2" | "2:3" | "3:4" | "9:16" | "21:9";
  width?: number;
  height?: number;
  response_format?: "url" | "base64";
  n?: number;
  prompt_optimizer?: boolean;
  subject_reference?: Array<{ type: "character"; image_file: string }>;
};

async function minimaxFetch<T>(
  path: string,
  init: RequestInit = {},
): Promise<MiniMaxWrappedResponse<T>> {
  const response = await fetch(`${minimaxBaseUrl}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${getMinimaxApiKey()}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`MiniMax HTTP ${response.status}: ${text}`);
  }

  const json = (await response.json()) as MiniMaxWrappedResponse<T>;
  const statusCode = json.base_resp?.status_code ?? 0;
  if (statusCode !== 0) {
    throw new Error(
      `MiniMax API ${statusCode}: ${json.base_resp?.status_msg ?? "Unknown error"}`,
    );
  }

  return json;
}

export function minimaxChatModel(model = "MiniMax-M2.7") {
  const provider = createOpenAICompatible({
    name: "minimax",
    apiKey: getMinimaxApiKey(),
    baseURL: minimaxBaseUrl,
    includeUsage: true,
  });

  return provider.chatModel(model);
}

export async function createVideoTask(payload: MiniMaxVideoCreatePayload) {
  return minimaxFetch<{ task_id: string }>("/video_generation", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function queryVideoTask(taskId: string) {
  return minimaxFetch<{
    task_id: string;
    status: "Preparing" | "Queueing" | "Processing" | "Success" | "Fail";
    file_id?: string;
    video_width?: number;
    video_height?: number;
  }>(
    `/query/video_generation?task_id=${encodeURIComponent(taskId)}`,
    { method: "GET" },
  );
}

export async function retrieveFile(fileId: string) {
  return minimaxFetch<{
    file: {
      file_id: number;
      bytes: number;
      created_at: number;
      filename: string;
      purpose: string;
      download_url?: string;
    };
  }>(
    `/files/retrieve?file_id=${encodeURIComponent(fileId)}`,
    { method: "GET" },
  );
}

export async function generateImage(payload: MiniMaxImagePayload) {
  return minimaxFetch<{
    id: string;
    data: {
      image_urls?: string[];
      image_base64?: string[];
    };
    metadata?: {
      success_count?: number;
      failed_count?: number;
    };
  }>("/image_generation", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
