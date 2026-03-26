import { streamText } from "ai";
import { z } from "zod";

import { minimaxChatModel } from "@/lib/minimax";
import type { ChatMessagePayload } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

const requestSchema = z.object({
  model: z.string().optional(),
  messages: z
    .array(
      z.object({
        role: z.enum(["system", "user", "assistant"]),
        content: z.string().min(1),
      }),
    )
    .min(1),
});

function asModelMessages(messages: ChatMessagePayload[]) {
  return messages.map((message) => ({
    role: message.role,
    content: message.content,
  }));
}

export async function POST(request: Request) {
  try {
    const payload = requestSchema.parse(await request.json());
    const result = streamText({
      model: minimaxChatModel(payload.model),
      messages: asModelMessages(payload.messages),
      temperature: 0.7,
    });

    return result.toTextStreamResponse({
      headers: {
        "Cache-Control": "no-cache, no-transform",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const first = error.issues[0];
      return Response.json(
        {
          error: first
            ? `${first.path.join(".")}: ${first.message}`
            : "Invalid request body",
        },
        { status: 400 },
      );
    }
    const message =
      error instanceof Error ? error.message : "Unable to stream chat response";
    return Response.json({ error: message }, { status: 400 });
  }
}
