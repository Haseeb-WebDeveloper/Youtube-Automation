import { z } from "zod";

import { generateImage } from "@/lib/minimax";

export const runtime = "nodejs";

const imageRequestSchema = z.object({
  prompt: z.string().min(1).max(1500),
  model: z.enum(["image-01", "image-01-live"]).default("image-01"),
  aspectRatio: z
    .enum(["1:1", "16:9", "4:3", "3:2", "2:3", "3:4", "9:16", "21:9"])
    .optional(),
  n: z.number().int().min(1).max(4).optional(),
});

export async function POST(request: Request) {
  try {
    const body = imageRequestSchema.parse(await request.json());
    const imageResponse = await generateImage({
      model: body.model,
      prompt: body.prompt,
      aspect_ratio: body.aspectRatio,
      response_format: "url",
      n: body.n ?? 1,
      prompt_optimizer: true,
    });

    return Response.json({
      id: imageResponse.id,
      urls: imageResponse.data.image_urls ?? [],
      metadata: imageResponse.metadata ?? null,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to generate image";
    return Response.json({ error: message }, { status: 400 });
  }
}
