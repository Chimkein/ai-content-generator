import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { GoogleGenAI } from "@google/genai";
import Groq from "groq-sdk";
import { CAPTION_MODELS, getFallbackModels } from "@/lib/ai/caption-models";

const gemini = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY ?? "" });

const RETRY_DELAYS = [3_000, 10_000];

function stripThinking(text: string): string {
  return text.replace(/<think>[\s\S]*?<\/think>/g, "").trim();
}

async function enhanceWithGemini(systemPrompt: string): Promise<string> {
  for (let attempt = 0; attempt <= RETRY_DELAYS.length; attempt++) {
    try {
      const response = await gemini.models.generateContent({
        model: "gemini-2.5-flash",
        contents: systemPrompt,
      });
      const text = response.text?.trim() ?? "";
      if (text) return text;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      const isRetryable =
        msg.includes("429") ||
        msg.includes("503") ||
        msg.includes("RESOURCE_EXHAUSTED") ||
        msg.includes("UNAVAILABLE");

      if (isRetryable && attempt < RETRY_DELAYS.length) {
        await new Promise((r) => setTimeout(r, RETRY_DELAYS[attempt]));
        continue;
      }
      throw err;
    }
  }
  return "";
}

async function enhanceWithGroq(systemPrompt: string, modelId: string): Promise<string> {
  const model = CAPTION_MODELS.find((m) => m.id === modelId);
  const groqModel = model?.model ?? "llama-3.3-70b-versatile";

  for (let attempt = 0; attempt <= RETRY_DELAYS.length; attempt++) {
    try {
      const response = await groq.chat.completions.create({
        model: groqModel,
        messages: [{ role: "user", content: systemPrompt }],
        temperature: 0.7,
      });
      const text = stripThinking(response.choices[0]?.message?.content?.trim() ?? "");
      if (text) return text;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      const isRetryable = msg.includes("429") || msg.includes("503") || msg.includes("rate_limit");

      if (isRetryable && attempt < RETRY_DELAYS.length) {
        await new Promise((r) => setTimeout(r, RETRY_DELAYS[attempt]));
        continue;
      }
      throw err;
    }
  }
  return "";
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { prompt, contentType, target, captionModel } = await request.json();

    if (!prompt?.trim()) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    if (prompt.length > 10000) {
      return NextResponse.json(
        { error: "Prompt too long (max 10,000 characters)" },
        { status: 400 }
      );
    }

    const systemPrompt = target === "content"
      ? `You are a content writing expert for social media. Take the user's rough draft or notes and rewrite them into polished, engaging content ready for caption generation.

Content type: ${contentType ?? "text"}

User's original content:
"${prompt}"

Rules:
- Keep the same core message and meaning
- Make it clearer, more engaging, and better structured
- Fix grammar, awkward phrasing, and improve flow
- Keep a natural, human tone — not robotic or overly formal
- Maintain roughly the same length (don't over-expand short notes)
- Respond with ONLY the enhanced content text, nothing else`
      : `You are a prompt enhancement expert for social media content generation. Take the user's rough instructions and rewrite them into a clear, detailed, and effective prompt that will produce better AI-generated captions.

Content type: ${contentType ?? "text"}

User's original instructions:
"${prompt}"

Rules:
- Keep the same intent and meaning
- Make it more specific and descriptive
- Add relevant context that would help generate better captions
- Keep it concise (2-4 sentences max)
- Do NOT add instructions about format, hashtags, or emojis — those are handled separately
- Respond with ONLY the enhanced prompt text, nothing else`;

    const requestedModel = captionModel ?? "gemini-flash";
    const modelId = CAPTION_MODELS.find((m) => m.id === requestedModel) ? requestedModel : "gemini-flash";
    const fallbacks = getFallbackModels(modelId, false, false);
    const modelsToTry = [modelId, ...fallbacks.map((m) => m.id)];

    let enhanced = "";
    let usedModelId = modelId;
    let lastError: unknown;

    for (const tryModelId of modelsToTry) {
      const tryModel = CAPTION_MODELS.find((m) => m.id === tryModelId);
      const tryProvider = tryModel?.provider ?? "gemini";

      try {
        if (tryProvider === "groq") {
          enhanced = await enhanceWithGroq(systemPrompt, tryModelId);
        } else {
          enhanced = await enhanceWithGemini(systemPrompt);
        }
        usedModelId = tryModelId;
        break;
      } catch (err) {
        lastError = err;
        const msg = err instanceof Error ? err.message : String(err);
        const isRateLimit =
          msg.includes("429") ||
          msg.includes("RESOURCE_EXHAUSTED") ||
          msg.toLowerCase().includes("quota") ||
          msg.includes("rate_limit");

        if (isRateLimit && tryModelId !== modelsToTry[modelsToTry.length - 1]) {
          continue;
        }

        if (isRateLimit) {
          return NextResponse.json(
            { error: "All models rate limited. Try again later.", retryAfter: 30 },
            { status: 429 }
          );
        }
        return NextResponse.json(
          { error: `Enhancement failed: ${msg.slice(0, 100)}` },
          { status: 500 }
        );
      }
    }

    if (!enhanced) {
      if (lastError) {
        const msg = lastError instanceof Error ? lastError.message : String(lastError);
        return NextResponse.json(
          { error: `Enhancement failed: ${msg.slice(0, 100)}` },
          { status: 500 }
        );
      }
      return NextResponse.json(
        { error: "AI returned an empty response. Try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({ enhanced, usedModel: usedModelId });
  } catch (error) {
    console.error("Prompt enhancement failed:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Enhancement failed: ${msg.slice(0, 100)}` },
      { status: 500 }
    );
  }
}
