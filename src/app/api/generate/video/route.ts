import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { uploadVideoToGemini } from "@/lib/ai/transcription";
import { generateCaption } from "@/lib/ai/caption";
import type { CaptionSettings } from "@/lib/ai/caption";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const videoFile = formData.get("video") as File | null;
  const settingsJson = formData.get("settings") as string | null;
  const instructions = (formData.get("instructions") as string) ?? "";
  const postImageBase64 = (formData.get("postImageBase64") as string) || undefined;
  const postImageMimeType = (formData.get("postImageMimeType") as string) || undefined;
  const captionModel = (formData.get("captionModel") as string) || undefined;

  if (!videoFile) {
    return NextResponse.json({ error: "No video file provided" }, { status: 400 });
  }

  const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime", "video/x-msvideo", "video/x-matroska"];
  if (!ALLOWED_VIDEO_TYPES.includes(videoFile.type)) {
    return NextResponse.json({ error: "Invalid video format" }, { status: 400 });
  }

  const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB
  if (videoFile.size > MAX_VIDEO_SIZE) {
    return NextResponse.json({ error: "Video too large (max 100MB)" }, { status: 400 });
  }

  let settings: CaptionSettings;
  try {
    settings = JSON.parse(settingsJson ?? "{}");
  } catch {
    return NextResponse.json({ error: "Invalid settings" }, { status: 400 });
  }

  try {
    const buffer = Buffer.from(await videoFile.arrayBuffer());
    const { fileUri, mimeType } = await uploadVideoToGemini(
      buffer,
      videoFile.type,
      videoFile.name
    );

    const result = await generateCaption({
      contentType: "video",
      videoFileUri: fileUri,
      videoMimeType: mimeType,
      postImageBase64,
      postImageMimeType,
      instructions,
      captionModel,
      settings,
    });

    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Video processing failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
