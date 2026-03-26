const MINIMAX_API_KEY = process.env.MINIMAX_API_KEY;

export function getMinimaxApiKey(): string {
  if (!MINIMAX_API_KEY) {
    throw new Error(
      "MINIMAX_API_KEY is missing. Add it to .env.local before running the app.",
    );
  }

  return MINIMAX_API_KEY;
}

export function minimaxKeyConfigured(): boolean {
  return Boolean(MINIMAX_API_KEY);
}

/** Default when your plan does not include Hailuo 2.3 SKUs (e.g. Token Plan). */
export const DEFAULT_MINIMAX_VIDEO_MODEL = "MiniMax-Hailuo-02";

/**
 * Video model for `/api/video/create` when the client does not send one.
 * Override with `MINIMAX_VIDEO_MODEL` in `.env.local` if your account uses another SKU.
 */
export function getDefaultMinimaxVideoModel(): string {
  const fromEnv = process.env.MINIMAX_VIDEO_MODEL?.trim();
  return fromEnv && fromEnv.length > 0 ? fromEnv : DEFAULT_MINIMAX_VIDEO_MODEL;
}
