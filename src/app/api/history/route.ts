import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("generations")
    .select("*")
    .eq("user_id", user.id)
    .order("is_pinned", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  const imageUrls: string[] = [];

  const imagesToUpload: Array<{ base64: string; mimeType: string }> =
    Array.isArray(body.images) ? body.images :
    body.imageBase64 && body.imageMimeType ? [{ base64: body.imageBase64, mimeType: body.imageMimeType }] :
    [];

  for (let i = 0; i < imagesToUpload.length; i++) {
    const img = imagesToUpload[i];
    const ext = img.mimeType.split("/")[1] || "png";
    const fileName = `${user.id}/${Date.now()}-teaser-${i}.${ext}`;
    const buffer = Buffer.from(img.base64, "base64");

    const { error: uploadError } = await supabase.storage
      .from("generated-images")
      .upload(fileName, buffer, {
        contentType: img.mimeType,
        upsert: false,
      });

    if (!uploadError) {
      const { data: urlData } = await supabase.storage
        .from("generated-images")
        .createSignedUrl(fileName, 60 * 60 * 24 * 365 * 10);
      if (urlData?.signedUrl) {
        imageUrls.push(urlData.signedUrl);
      }
    }
  }

  const imageUrl = imageUrls.length > 0
    ? (imageUrls.length === 1 ? imageUrls[0] : JSON.stringify(imageUrls))
    : (body.imageUrl || null);

  const { data, error } = await supabase
    .from("generations")
    .insert({
      user_id: user.id,
      original_file_url: body.originalFileUrl || null,
      original_file_type: body.originalFileType || null,
      caption: body.caption,
      hashtags: body.hashtags || [],
      cta: body.cta || null,
      image_prompt: body.imagePrompt || null,
      image_url: imageUrl,
      folder_id: body.folderId || null,
      settings: body.settings || {},
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
