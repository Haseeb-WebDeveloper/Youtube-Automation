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
