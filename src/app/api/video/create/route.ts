import { z } from "zod";

import { createVideoTask } from "@/lib/minimax";

export const runtime = "nodejs";

const videoCreateSchema = z.object({
  model: z
    .enum(["MiniMax-Hailuo-2.3", "MiniMax-Hailuo-2.3-Fast", "MiniMax-Hailuo-02"])
    .default("MiniMax-Hailuo-2.3"),
  prompt: z.string().max(2000).optional(),
  firstFrameImage: z.string().url().optional(),
  lastFrameImage: z.string().url().optional(),
  duration: z.union([z.literal(6), z.literal(10)]).optional(),
  resolution: z.enum(["512P", "720P", "768P", "1080P"]).optional(),
});

export async function POST(request: Request) {
  try {
    const body = videoCreateSchema.parse(await request.json());
    if (!body.prompt && !body.firstFrameImage) {
      return Response.json(
        { error: "Provide a prompt or a first frame image." },
        { status: 400 },
      );
    }

    const task = await createVideoTask({
      model: body.model,
      prompt: body.prompt,
      first_frame_image: body.firstFrameImage,
      last_frame_image: body.lastFrameImage,
      duration: body.duration,
      resolution: body.resolution,
      prompt_optimizer: true,
    });

    return Response.json({ taskId: task.task_id });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to create video task";
    return Response.json({ error: message }, { status: 400 });
  }
}
