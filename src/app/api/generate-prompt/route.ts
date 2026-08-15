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

const SYSTEM_PROMPT = `You are a social media content strategist. The user will give you a theme — either text describing their topic or an image. Based on this theme, generate a short, creative prompt (2-4 sentences) that tells an AI caption generator what angle, tone, and hook to use.

Rules:
- Focus on what would make this content engaging on social media
- Suggest a specific angle or perspective (e.g. storytelling, humor, emotional, educational)
- Mention the hook or opening strategy
- Keep it concise — this is an instruction for another AI, not the final caption
- Do NOT write the actual caption — just the prompt/instructions
- Respond with ONLY the prompt text, nothing else`;

async function generateWithGemini(
  systemPrompt: string,
  imageBase64?: string,
  imageMimeType?: string
): Promise<string> {
  const parts: Array<
    | { text: string }
    | { inlineData: { data: string; mimeType: string } }
  > = [{ text: systemPrompt }];

  if (imageBase64 && imageMimeType) {
    parts.push({
      inlineData: { data: imageBase64, mimeType: imageMimeType },
    });
  }

  for (let attempt = 0; attempt <= RETRY_DELAYS.length; attempt++) {
    try {
      const response = await gemini.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [{ role: "user", parts }],
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

async function generateWithGroq(systemPrompt: string, modelId: string): Promise<string> {
  const model = CAPTION_MODELS.find((m) => m.id === modelId);
  const groqModel = model?.model ?? "llama-3.3-70b-versatile";

  for (let attempt = 0; attempt <= RETRY_DELAYS.length; attempt++) {
    try {
      const response = await groq.chat.completions.create({
        model: groqModel,
        messages: [{ role: "user", content: systemPrompt }],
        temperature: 0.8,
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
    const { themeText, contentType, imageBase64, imageMimeType, captionModel } =
      await request.json();

    const hasImage = !!(imageBase64 && imageMimeType);
    const hasText = !!themeText?.trim();

    if (!hasText && !hasImage) {
      return NextResponse.json(
        { error: "Theme content is required" },
        { status: 400 }
      );
    }

    const themeDescription = hasText
      ? `Theme: "${themeText.trim()}"`
      : `Content type: ${contentType ?? "image"} (see attached image)`;

    const fullPrompt = `${SYSTEM_PROMPT}\n\n${themeDescription}`;

    const requestedModel = captionModel ?? "gemini-flash";
    const modelId = CAPTION_MODELS.find((m) => m.id === requestedModel)
      ? requestedModel
      : "gemini-flash";
    const fallbacks = getFallbackModels(modelId, false, false);
    const modelsToTry = [modelId, ...fallbacks.map((m) => m.id)];

    let generated = "";
    let usedModelId = modelId;
    let lastError: unknown;

    for (const tryModelId of modelsToTry) {
      const tryModel = CAPTION_MODELS.find((m) => m.id === tryModelId);
      const tryProvider = tryModel?.provider ?? "gemini";

      try {
        if (hasImage) {
          generated = await generateWithGemini(fullPrompt, imageBase64, imageMimeType);
        } else if (tryProvider === "groq") {
          generated = await generateWithGroq(fullPrompt, tryModelId);
        } else {
          generated = await generateWithGemini(fullPrompt);
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
          const isDailyQuota =
            msg.includes("RESOURCE_EXHAUSTED") || msg.toLowerCase().includes("quota");
          return NextResponse.json(
            {
              error: "All models rate limited. Try again later.",
              retryAfter: isDailyQuota ? 0 : 30,
            },
            { status: 429 }
          );
        }
        return NextResponse.json(
          { error: `Prompt generation failed: ${msg.slice(0, 100)}` },
          { status: 500 }
        );
      }
    }

    if (!generated) {
      if (lastError) {
        const msg = lastError instanceof Error ? lastError.message : String(lastError);
        return NextResponse.json(
          { error: `Prompt generation failed: ${msg.slice(0, 100)}` },
          { status: 500 }
        );
      }
      return NextResponse.json(
        { error: "AI returned an empty response. Try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({ generated, usedModel: usedModelId });
  } catch (error) {
    console.error("Prompt generation failed:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Prompt generation failed: ${msg.slice(0, 100)}` },
      { status: 500 }
    );
  }
}
