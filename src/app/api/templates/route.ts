import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const STARTER_TEMPLATES = [
  {
    name: "Instagram Reel Caption",
    tone: "Casual",
    length: "Short",
    language: "English",
    include_hashtags: true,
    include_emojis: true,
    include_cta: false,
    instructions: "Write a short, raw, unpolished caption for an Instagram Reel. Lead with a hook that makes people stop scrolling. Keep it authentic and relatable — avoid sounding overly produced. Use keywords naturally instead of stuffing hashtags (max 5 hashtags). Optimize for DM shares — write something people want to send to a friend.",
    is_starter: true,
  },
  {
    name: "TikTok Viral Hook",
    tone: "Gen Z",
    length: "Short",
    language: "English",
    include_hashtags: false,
    include_emojis: false,
    include_cta: false,
    instructions: "Write a punchy TikTok caption under 50 characters that hooks in the first line. Use curiosity-driven formats like 'Nobody talks about this enough' or 'This changed everything.' Keep the hook clean — no emojis in the first line. Make the caption create tension with the video so viewers want to watch. Sound casual and personality-driven, not polished or promotional.",
    is_starter: true,
  },
  {
    name: "LinkedIn Thought Leader",
    tone: "Professional",
    length: "Long",
    language: "English",
    include_hashtags: false,
    include_emojis: false,
    include_cta: true,
    instructions: "Write an authentic LinkedIn post in a 'build in public' storytelling style. Open with a bold or surprising one-liner to hook the feed. Use short paragraphs (1-2 sentences each) with line breaks for readability. Share a personal insight or lesson learned, not generic advice. End with a question that invites replies — the algorithm rewards comments and saves over likes. No hashtags — they no longer boost reach on LinkedIn.",
    is_starter: true,
  },
  {
    name: "Facebook Community Post",
    tone: "Casual",
    length: "Medium",
    language: "English",
    include_hashtags: false,
    include_emojis: true,
    include_cta: false,
    instructions: "Write a conversational Facebook post that sparks genuine discussion. Focus on relatable, emotion-driven content — humor, nostalgia, or inspiration outperform promotional posts. Never explicitly ask for likes or shares (Facebook penalizes engagement bait). Write something that feels like talking to a friend, not broadcasting to an audience. Keep it shareable — albums and carousel-style content get the most shares.",
    is_starter: true,
  },
  {
    name: "X/Twitter Thread Opener",
    tone: "Professional",
    length: "Short",
    language: "English",
    include_hashtags: false,
    include_emojis: false,
    include_cta: false,
    instructions: "Write a concise, opinionated tweet that invites replies and quote tweets. Lead with a clear, bold take — the algorithm rewards replies and saves over likes and retweets. Use zero hashtags (they no longer boost distribution and signal low-quality content). Keep it under 280 characters. Sound like an original thought, not a generic statement. Make people want to agree, disagree, or add their own take.",
    is_starter: true,
  },
  {
    name: "Filipino Taglish Promo",
    tone: "Promotional",
    length: "Medium",
    language: "Taglish",
    include_hashtags: true,
    include_emojis: true,
    include_cta: true,
    instructions: "Write an engaging promotional post for a Filipino audience using natural Taglish — blend Tagalog and English the way Filipinos actually talk, not forced code-switching. Keep it conversational, friendly, and value-packed. Filipinos spend 3-4 hours daily on social media so the hook needs to stand out. Focus on community feel over hard selling. Works best for Facebook (95.8M Filipino users) and TikTok.",
    is_starter: true,
  },
  {
    name: "Instagram Carousel Story",
    tone: "Educational",
    length: "Medium",
    language: "English",
    include_hashtags: true,
    include_emojis: false,
    include_cta: true,
    instructions: "Write a caption for an educational Instagram carousel post. Start with a hook question or surprising fact. Structure the caption to complement a multi-slide format — summarize the key takeaway without giving everything away (drive people to swipe). Use keyword-rich language for Instagram's search (caption SEO matters more than hashtags now). Max 5 hashtags. End with a save-worthy call to action.",
    is_starter: true,
  },
  {
    name: "TikTok Filipino Humor",
    tone: "Funny",
    length: "Short",
    language: "Taglish",
    include_hashtags: true,
    include_emojis: true,
    include_cta: false,
    instructions: "Write a funny, relatable TikTok caption in natural Taglish that Filipino viewers will want to share. Use humor that resonates with everyday Filipino life — work culture, family dynamics, food, or trending local topics. Keep the caption short and punchy (under 50 characters). The humor should make people tag their friends or send via DM. Sound like a real person, not a brand.",
    is_starter: true,
  },
];

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("caption_templates")
    .select("*")
    .eq("user_id", user.id)
    .order("is_starter", { ascending: false })
    .order("created_at");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (data && data.length === 0) {
    const rows = STARTER_TEMPLATES.map((t) => ({ ...t, user_id: user.id }));
    const { data: seeded, error: seedErr } = await supabase
      .from("caption_templates")
      .insert(rows)
      .select();

    if (seedErr) {
      return NextResponse.json({ error: seedErr.message }, { status: 500 });
    }
    return NextResponse.json(seeded);
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

  if (!body.name?.trim()) {
    return NextResponse.json({ error: "Template name is required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("caption_templates")
    .insert({
      user_id: user.id,
      name: body.name.trim(),
      tone: body.tone ?? "Casual",
      length: body.length ?? "Medium",
      language: body.language ?? "English",
      include_hashtags: body.include_hashtags ?? true,
      include_emojis: body.include_emojis ?? false,
      include_cta: body.include_cta ?? false,
      instructions: body.instructions ?? "",
      is_starter: false,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
