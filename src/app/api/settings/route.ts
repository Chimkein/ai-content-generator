import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const DEFAULTS = {
  default_language: "English",
  default_tone: "Casual",
  default_length: "Medium",
  generate_image: false,
  default_image_style: "Modern",
  default_aspect_ratio: "4:5",
  default_image_model: "flux",
  default_caption_model: "gemini-flash",
  default_hashtags: true,
  default_emojis: false,
  default_cta: false,
  generate_video: false,
  image_count: 3,
};

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data } = await supabase
    .from("user_settings")
    .select("*")
    .eq("user_id", user.id)
    .single();

  return NextResponse.json(data ?? DEFAULTS);
}

export async function PUT(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  const settings = {
    default_language: body.default_language,
    default_tone: body.default_tone,
    default_length: body.default_length,
    generate_image: body.generate_image,
    default_image_style: body.default_image_style,
    default_aspect_ratio: body.default_aspect_ratio,
    default_image_model: body.default_image_model,
    default_caption_model: body.default_caption_model,
    default_hashtags: body.default_hashtags,
    default_emojis: body.default_emojis,
    default_cta: body.default_cta,
    generate_video: body.generate_video,
    image_count: body.image_count,
  };

  const { data, error } = await supabase
    .from("user_settings")
    .upsert({ user_id: user.id, ...settings }, { onConflict: "user_id" })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
