import { GoogleGenAI } from "@google/genai";
import Groq from "groq-sdk";
import { CAPTION_MODELS, getFallbackModels } from "./caption-models";

const gemini = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY ?? "" });

export interface CaptionSettings {
  tone: string;
  length: string;
  language: string;
  includeHashtags: boolean;
  includeEmojis: boolean;
  includeCta: boolean;
}

export interface CaptionRequest {
  contentType: "video" | "image" | "text";
  textContent?: string;
  imageBase64?: string;
  imageMimeType?: string;
  videoFileUri?: string;
  videoMimeType?: string;
  postImageBase64?: string;
  postImageMimeType?: string;
  instructions?: string;
  settings: CaptionSettings;
  captionModel?: string;
}

export interface CaptionResponse {
  captions: string[];
  hashtags: string[];
  cta: string;
  imagePrompt: string;
  imagePrompts: string[];
  usedModel?: string;
}

const LENGTH_GUIDE: Record<string, string> = {
  Short: "1-2 sentences, under 50 words",
  Medium: "2-4 sentences, 50-100 words",
  Long: "4-6 sentences, 100-200 words",
};

function buildPrompt(request: CaptionRequest): string {
  const { settings, instructions, contentType, textContent } = request;

  const hasPostImage = !!(request.postImageBase64 && request.postImageMimeType);

  const postImageContext = hasPostImage
    ? `\nIMPORTANT: The user has provided their own post image (attached). Your captions MUST describe and relate to this image. Use the additional instructions below as supporting context for the tone and angle, but the image is the primary subject of the caption.`
    : "";

  return `You are a social media content expert. Generate a caption for a ${contentType} post.

SETTINGS:
- Tone: ${settings.tone}
- Length: ${LENGTH_GUIDE[settings.length] ?? settings.length}
- Language: ${settings.language}
- Include hashtags: ${settings.includeHashtags}
- Include emojis: ${settings.includeEmojis}
- Include call-to-action: ${settings.includeCta}
${postImageContext}
${instructions ? `PRIMARY DIRECTION (follow this closely — it defines the angle, voice, and focus of the caption):\n${instructions}\n` : ""}
${textContent ? `SUPPORTING CONTENT (use as context/theme, but let the primary direction above guide the output):\n${textContent}` : ""}

Respond ONLY with valid JSON in this exact format, no markdown fences:
{
  "captions": ["Caption variation 1", "Caption variation 2", "Caption variation 3"],
  "hashtags": ["#tag1", "#tag2"],
  "cta": "Call to action text or empty string",
  "imagePrompts": ["Image prompt variation 1", "Image prompt variation 2", "Image prompt variation 3"]
}

Rules for captions array:
- Generate exactly 3 distinct caption variations.
- Each variation should have a different angle, hook, or structure while staying true to the tone and content.
- All variations must follow the same length, language, and emoji settings.

Rules for imagePrompts array:
- Generate exactly 3 distinct image prompt variations that share the same theme but differ in composition, angle, or visual approach.
- Each should describe a visually appealing image suitable for social media advertisement.
- Example: if the theme is coffee, one could focus on a close-up latte art shot, another on a cozy cafe scene, and another on beans being poured.

Rules:
- Write the caption in ${settings.language}.
- ${settings.includeEmojis ? "Use emojis naturally in the caption." : "Do not use emojis."}
- ${settings.includeHashtags ? "Include 3-7 relevant hashtags." : "Return an empty hashtags array."}
- ${settings.includeCta ? "Include a compelling call-to-action." : "Return an empty cta string."}`;
}

function stripThinking(text: string): string {
  return text.replace(/<think>[\s\S]*?<\/think>/g, "").trim();
}

function cleanJsonResponse(text: string): string {
  let cleaned = stripThinking(text);
  cleaned = cleaned.replace(/```(?:json)?\s*/g, "").replace(/```\s*/g, "");
  cleaned = cleaned.replace(/^[^{]*/, "").replace(/[^}]*$/, "");
  return cleaned.trim();
}

const CAPTION_MAX_RETRIES = 2;
const CAPTION_RETRY_DELAYS = [3_000, 10_000];

async function generateWithGemini(request: CaptionRequest): Promise<string> {
  const prompt = buildPrompt(request);

  const parts: Array<
    | { text: string }
    | { inlineData: { data: string; mimeType: string } }
    | { fileData: { fileUri: string; mimeType: string } }
  > = [{ text: prompt }];

  if (request.imageBase64 && request.imageMimeType) {
    parts.push({
      inlineData: {
        data: request.imageBase64,
        mimeType: request.imageMimeType,
      },
    });
  }

  if (request.videoFileUri && request.videoMimeType) {
    parts.push({
      fileData: {
        fileUri: request.videoFileUri,
        mimeType: request.videoMimeType,
      },
    });
  }

  if (request.postImageBase64 && request.postImageMimeType) {
    parts.push({
      inlineData: {
        data: request.postImageBase64,
        mimeType: request.postImageMimeType,
      },
    });
  }

  for (let attempt = 0; attempt <= CAPTION_MAX_RETRIES; attempt++) {
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
        msg.includes("UNAVAILABLE") ||
        msg.includes("DEADLINE_EXCEEDED");

      if (isRetryable && attempt < CAPTION_MAX_RETRIES) {
        await new Promise((r) => setTimeout(r, CAPTION_RETRY_DELAYS[attempt]));
        continue;
      }
      throw err;
    }
  }
  return "";
}

async function generateWithGroq(request: CaptionRequest, modelId: string): Promise<string> {
  const model = CAPTION_MODELS.find((m) => m.id === modelId);
  const groqModel = model?.model ?? "llama-3.3-70b-versatile";
  const prompt = buildPrompt(request);

  for (let attempt = 0; attempt <= CAPTION_MAX_RETRIES; attempt++) {
    try {
      const response = await groq.chat.completions.create({
        model: groqModel,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.8,
      });
      const text = stripThinking(response.choices[0]?.message?.content?.trim() ?? "");
      if (text) return text;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      const isRetryable =
        msg.includes("429") ||
        msg.includes("503") ||
        msg.includes("rate_limit");

      if (isRetryable && attempt < CAPTION_MAX_RETRIES) {
        await new Promise((r) => setTimeout(r, CAPTION_RETRY_DELAYS[attempt]));
        continue;
      }
      throw err;
    }
  }
  return "";
}

async function generateWithGroqVision(request: CaptionRequest, modelId: string): Promise<string> {
  const model = CAPTION_MODELS.find((m) => m.id === modelId);
  const groqModel = model?.model ?? "qwen/qwen3.6-27b";
  const prompt = buildPrompt(request);

  const content: Array<
    | { type: "text"; text: string }
    | { type: "image_url"; image_url: { url: string } }
  > = [{ type: "text", text: prompt }];

  if (request.imageBase64 && request.imageMimeType) {
    content.push({
      type: "image_url",
      image_url: { url: `data:${request.imageMimeType};base64,${request.imageBase64}` },
    });
  }

  if (request.postImageBase64 && request.postImageMimeType) {
    content.push({
      type: "image_url",
      image_url: { url: `data:${request.postImageMimeType};base64,${request.postImageBase64}` },
    });
  }

  for (let attempt = 0; attempt <= CAPTION_MAX_RETRIES; attempt++) {
    try {
      const response = await groq.chat.completions.create({
        model: groqModel,
        messages: [{ role: "user", content }],
        temperature: 0.8,
      });
      const text = stripThinking(response.choices[0]?.message?.content?.trim() ?? "");
      if (text) return text;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      const isRetryable =
        msg.includes("429") ||
        msg.includes("503") ||
        msg.includes("rate_limit");

      if (isRetryable && attempt < CAPTION_MAX_RETRIES) {
        await new Promise((r) => setTimeout(r, CAPTION_RETRY_DELAYS[attempt]));
        continue;
      }
      throw err;
    }
  }
  return "";
}

function isParseError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return (
    msg.includes("Failed to parse AI response") ||
    msg.includes("Unexpected token") ||
    msg.includes("is not valid JSON")
  );
}

function isRateLimitError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return (
    msg.includes("429") ||
    msg.includes("RESOURCE_EXHAUSTED") ||
    msg.toLowerCase().includes("quota") ||
    msg.includes("rate_limit")
  );
}

async function tryGenerate(request: CaptionRequest, modelId: string): Promise<string> {
  const model = CAPTION_MODELS.find((m) => m.id === modelId);
  const provider = model?.provider ?? "gemini";
  const hasVideo = !!request.videoFileUri;
  const hasImages = !!(request.imageBase64 || request.postImageBase64);

  if (provider === "gemini" || hasVideo) {
    return generateWithGemini(request);
  }
  if (hasImages && model?.vision) {
    return generateWithGroqVision(request, modelId);
  }
  return generateWithGroq(request, modelId);
}

export async function generateCaption(
  request: CaptionRequest
): Promise<CaptionResponse> {
  const requestedModel = request.captionModel ?? "gemini-flash";
  const modelId = CAPTION_MODELS.find((m) => m.id === requestedModel) ? requestedModel : "gemini-flash";
  const hasMedia = !!(request.imageBase64 || request.videoFileUri || request.postImageBase64);
  const hasVideo = !!request.videoFileUri;
  const fallbacks = getFallbackModels(modelId, hasMedia, hasVideo);

  let lastError: unknown;
  let usedModelId = modelId;

  const modelsToTry = [modelId, ...fallbacks.map((m) => m.id)];

  for (const tryModelId of modelsToTry) {
    try {
      const text = await tryGenerate(request, tryModelId);
      usedModelId = tryModelId;

      const cleaned = cleanJsonResponse(text);
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("Failed to parse AI response");
      }

      const parsed = JSON.parse(jsonMatch[0]);

      const captions = Array.isArray(parsed.captions)
        ? parsed.captions
        : parsed.caption
          ? [parsed.caption]
          : [""];

      const imagePrompts = Array.isArray(parsed.imagePrompts)
        ? parsed.imagePrompts
        : parsed.imagePrompt
          ? [parsed.imagePrompt]
          : [];

      return {
        captions,
        hashtags: Array.isArray(parsed.hashtags) ? parsed.hashtags : [],
        cta: parsed.cta ?? "",
        imagePrompt: imagePrompts[0] ?? "",
        imagePrompts,
        usedModel: usedModelId,
      };
    } catch (err) {
      lastError = err;
      const isLast = tryModelId === modelsToTry[modelsToTry.length - 1];
      if (!isLast && (isRateLimitError(err) || isParseError(err))) {
        continue;
      }
      throw err;
    }
  }

  throw lastError;
}
