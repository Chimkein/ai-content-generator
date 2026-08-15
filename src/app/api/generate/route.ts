import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateCaption, type CaptionRequest } from "@/lib/ai/caption";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body: CaptionRequest = await request.json();

    if (body.contentType === "text" && !body.textContent?.trim()) {
      return NextResponse.json(
        { error: "Text content is required" },
        { status: 400 }
      );
    }

    const result = await generateCaption(body);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Caption generation failed:", error);
    const errMsg = error instanceof Error ? error.message : "";
    const isDailyQuota = errMsg.includes("RESOURCE_EXHAUSTED") || errMsg.toLowerCase().includes("quota");
    const isRateLimit = errMsg.includes("429") || isDailyQuota || errMsg.includes("rate_limit");
    const errorMessage = isDailyQuota
      ? "All caption models exhausted. Try again later."
      : isRateLimit
        ? "All caption models rate limited. Please wait a moment and try again."
        : `Caption generation failed: ${errMsg.slice(0, 200) || "Unknown error"}`;
    return NextResponse.json(
      { error: errorMessage },
      { status: isRateLimit ? 429 : 500 }
    );
  }
}
