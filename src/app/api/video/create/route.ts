import { z } from "zod";

import { getDefaultMinimaxVideoModel } from "@/lib/env";
import { createVideoTask } from "@/lib/minimax";

export const runtime = "nodejs";

const videoCreateSchema = z.object({
  /** If omitted, uses `MINIMAX_VIDEO_MODEL` or `MiniMax-Hailuo-02` (Token Plan–friendly). */
  model: z.string().trim().min(1).optional(),
  prompt: z.string().max(2000).optional(),
  firstFrameImage: z.string().url().optional(),
  lastFrameImage: z.string().url().optional(),
  duration: z.union([z.literal(6), z.literal(10)]).optional(),
  resolution: z.enum(["512P", "720P", "768P", "1080P"]).optional(),
});

type VideoAttempt = {
  model: string;
  duration?: 6 | 10;
  resolution?: "512P" | "720P" | "768P" | "1080P";
};

function dedupeAttempts(attempts: VideoAttempt[]) {
  const seen = new Set<string>();
  return attempts.filter((attempt) => {
    const key = `${attempt.model}|${attempt.duration ?? "x"}|${attempt.resolution ?? "x"}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function buildAttempts(
  body: z.infer<typeof videoCreateSchema>,
  defaultModel: string,
): VideoAttempt[] {
  const baseDuration = body.duration ?? 6;
  const baseResolution = body.resolution ?? "768P";
  const primary: VideoAttempt = {
    model: body.model ?? defaultModel,
    duration: baseDuration,
    resolution: baseResolution,
  };

  // i2v and t2v have different supported model families.
  const i2vFallbacks: VideoAttempt[] = [
    { model: "MiniMax-Hailuo-02", duration: 6, resolution: "512P" },
    { model: "MiniMax-Hailuo-02", duration: 6, resolution: "768P" },
    { model: "MiniMax-Hailuo-2.3-Fast", duration: 6, resolution: "768P" },
    { model: "I2V-01", duration: 6, resolution: "720P" },
    { model: "I2V-01-live", duration: 6, resolution: "720P" },
    { model: "I2V-01-Director", duration: 6, resolution: "720P" },
  ];

  const t2vFallbacks: VideoAttempt[] = [
    { model: "MiniMax-Hailuo-02", duration: 6, resolution: "768P" },
    { model: "MiniMax-Hailuo-02", duration: 6, resolution: "512P" },
    { model: "MiniMax-Hailuo-2.3", duration: 6, resolution: "768P" },
    { model: "T2V-01", duration: 6, resolution: "720P" },
    { model: "T2V-01-Director", duration: 6, resolution: "720P" },
  ];

  return dedupeAttempts([
    primary,
    ...(body.firstFrameImage ? i2vFallbacks : t2vFallbacks),
  ]);
}

function isRetryableModelError(error: unknown) {
  if (!(error instanceof Error)) return false;
  return (
    error.message.includes("MiniMax API 2061") ||
    error.message.includes("MiniMax API 2013")
  );
}

export async function POST(request: Request) {
  try {
    const body = videoCreateSchema.parse(await request.json());
    if (!body.prompt && !body.firstFrameImage) {
      return Response.json(
        { error: "Provide a prompt or a first frame image." },
        { status: 400 },
      );
    }

    const attempts = buildAttempts(body, getDefaultMinimaxVideoModel());
    const tried: string[] = [];
    let lastError: unknown = null;

    for (const attempt of attempts) {
      tried.push(
        `${attempt.model}${attempt.duration ? `-${attempt.duration}s` : ""}${attempt.resolution ? `-${attempt.resolution}` : ""}`,
      );
      try {
        const task = await createVideoTask({
          model: attempt.model,
          prompt: body.prompt,
          first_frame_image: body.firstFrameImage,
          last_frame_image: body.lastFrameImage,
          duration: attempt.duration,
          resolution: attempt.resolution,
          prompt_optimizer: true,
        });

        return Response.json({
          taskId: task.task_id,
          modelUsed: attempt.model,
          durationUsed: attempt.duration,
          resolutionUsed: attempt.resolution,
        });
      } catch (error) {
        lastError = error;
        if (!isRetryableModelError(error)) {
          throw error;
        }
      }
    }

    const message =
      lastError instanceof Error
        ? `${lastError.message}. Tried models: ${tried.join(", ")}`
        : `Unable to create video task. Tried models: ${tried.join(", ")}`;
    return Response.json({ error: message }, { status: 400 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to create video task";
    return Response.json({ error: message }, { status: 400 });
  }
}
