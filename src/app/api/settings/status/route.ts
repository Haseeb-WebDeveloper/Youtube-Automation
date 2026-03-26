import { minimaxKeyConfigured } from "@/lib/env";

export async function GET() {
  return Response.json({
    configured: minimaxKeyConfigured(),
  });
}
