# MiniMax Claude-Like Dashboard

Unified dashboard for MiniMax:
- Chat (streaming text)
- Image generation
- Video generation (async task + polling)
- Settings page with server-side API key status

## Tech Stack

- Next.js 16 App Router
- React 19 + TypeScript
- AI SDK v6 (`ai`) + OpenAI-compatible provider (`@ai-sdk/openai-compatible`)
- Tailwind + shadcn/ui components

## Setup

1. Install dependencies:

```bash
pnpm install
```

2. Create `.env.local` in project root:

```bash
MINIMAX_API_KEY=your_minimax_api_key

# Optional: default video model (see MiniMax docs for your plan)
# Token Plan often does not include Hailuo 2.3; the app defaults to MiniMax-Hailuo-02.
# MINIMAX_VIDEO_MODEL=MiniMax-Hailuo-02
```

3. Start dev server:

```bash
pnpm dev
```

4. Open [http://localhost:3000](http://localhost:3000)

## Routes

### App Pages
- `/` dashboard UI
- `/settings` key status + model defaults

### API Endpoints
- `POST /api/chat/stream`
  - Streams chat text response from MiniMax (`MiniMax-M2.7` by default)
- `POST /api/image/generate`
  - Generates images via MiniMax image API
- `POST /api/video/create`
  - Creates async video generation task
- `GET /api/video/status?taskId=...`
  - Polls task status and resolves downloadable URL when complete
- `GET /api/settings/status`
  - Returns `{ configured: boolean }`

## Default Models

- Chat: `MiniMax-M2.7`
- Image: `image-01`
- Video: `MiniMax-Hailuo-02` by default (text-to-video and image-to-video), overridable with `MINIMAX_VIDEO_MODEL`. Some plans reject Hailuo 2.3 SKUs (e.g. `MiniMax-Hailuo-2.3-6s-768p` with API error `2061`).

## Notes and Limits

- Video generation is asynchronous. The dashboard polls task status every few seconds.
- Image URL responses from MiniMax can expire (provider-side behavior).
- Rate limits and pricing depend on your MiniMax account tier and model.
- API key is server-side only (`process.env.MINIMAX_API_KEY`), not stored in browser.

## Scripts

```bash
pnpm dev
pnpm lint
pnpm build
pnpm start
```
