import { z } from "zod";

import { queryVideoTask, retrieveFile } from "@/lib/minimax";

export const runtime = "nodejs";

const querySchema = z.object({
  taskId: z.string().min(1),
});

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const { taskId } = querySchema.parse({
      taskId: url.searchParams.get("taskId"),
    });

    const statusResult = await queryVideoTask(taskId);
    let downloadUrl: string | undefined;

    if (statusResult.status === "Success" && statusResult.file_id) {
      const fileResult = await retrieveFile(statusResult.file_id);
      downloadUrl = fileResult.file.download_url;
    }

    return Response.json({
      taskId: statusResult.task_id,
      status: statusResult.status,
      fileId: statusResult.file_id,
      width: statusResult.video_width,
      height: statusResult.video_height,
      downloadUrl,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to query video status";
    return Response.json({ error: message }, { status: 400 });
  }
}
