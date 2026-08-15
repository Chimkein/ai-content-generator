import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateImage, ImageQuotaError } from "@/lib/ai/image";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();

    if (!body.prompt?.trim()) {
      return NextResponse.json(
        { error: "Image prompt is required" },
        { status: 400 }
      );
    }

    const result = await generateImage({
      prompt: body.prompt,
      style: body.style || "Modern",
      aspectRatio: body.aspectRatio || "4:5",
      model: body.model || "flux",
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof ImageQuotaError) {
      return NextResponse.json(
        { error: error.message, quotaExceeded: true },
        { status: 429 }
      );
    }
    console.error("Image generation failed:", error);
    const message =
      error instanceof Error ? error.message : "Image generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
