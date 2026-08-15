import { GoogleGenAI } from "@google/genai";

export interface ImageRequest {
  prompt: string;
  style: string;
  aspectRatio: string;
  model?: string;
}

export interface ImageResult {
  base64: string;
  mimeType: string;
}

export type ImageModel = {
  id: string;
  name: string;
  provider: "pollinations" | "gemini";
  description: string;
};

export const IMAGE_MODELS: ImageModel[] = [
  { id: "flux", name: "Flux", provider: "pollinations", description: "Fast, high-quality default" },
  { id: "gpt-image-2", name: "GPT Image 2", provider: "pollinations", description: "OpenAI quality via Pollinations" },
  { id: "zimage", name: "Z-Image Turbo", provider: "pollinations", description: "Fast Alibaba model" },
  { id: "dreamshaper", name: "DreamShaper", provider: "pollinations", description: "Stylized, artistic output" },
  { id: "klein", name: "Flux Klein", provider: "pollinations", description: "Lightweight 4B model" },
  { id: "nova-canvas", name: "Nova Canvas", provider: "pollinations", description: "Amazon image model" },
  { id: "gemini-2.5-flash-image", name: "Gemini Flash", provider: "gemini", description: "Google AI — may have daily limits" },
];

const ASPECT_RATIO_DIMENSIONS: Record<string, { width: number; height: number }> = {
  "1:1": { width: 1024, height: 1024 },
  "4:5": { width: 1024, height: 1280 },
  "9:16": { width: 720, height: 1280 },
  "16:9": { width: 1280, height: 720 },
};

const POLLINATIONS_TIMEOUT_MS = 60_000;
const MAX_RETRIES = 2;
const RETRY_DELAYS = [5_000, 15_000];

async function fetchWithTimeout(url: string, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function generateWithPollinations(
  request: ImageRequest,
  modelId: string
): Promise<ImageResult> {
  const styledPrompt = `${request.style} style. ${request.prompt}. High quality, professional, suitable for social media advertisement.`;
  const dimensions = ASPECT_RATIO_DIMENSIONS[request.aspectRatio] ?? ASPECT_RATIO_DIMENSIONS["1:1"];

  const url = new URL("https://image.pollinations.ai/prompt/" + encodeURIComponent(styledPrompt));
  url.searchParams.set("width", String(dimensions.width));
  url.searchParams.set("height", String(dimensions.height));
  url.searchParams.set("model", modelId);
  url.searchParams.set("seed", String(Math.floor(Math.random() * 2147483647)));
  url.searchParams.set("nologo", "true");

  let lastError: Error | undefined;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    if (attempt > 0) {
      await new Promise((r) => setTimeout(r, RETRY_DELAYS[attempt - 1] ?? 15_000));
    }
    try {
      const response = await fetchWithTimeout(url.toString(), POLLINATIONS_TIMEOUT_MS);

      if (response.status === 429) {
        lastError = new Error("Rate limited — too many requests");
        continue;
      }

      if (!response.ok) {
        lastError = new Error(`Image generation failed (${response.status})`);
        continue;
      }

      const buffer = await response.arrayBuffer();
      const base64 = Buffer.from(buffer).toString("base64");
      const mimeType = response.headers.get("content-type") || "image/jpeg";

      return { base64, mimeType };
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        lastError = new Error("Image generation timed out — the server took too long to respond");
      } else {
        lastError = err instanceof Error ? err : new Error(String(err));
      }
    }
  }
  throw lastError ?? new Error("Image generation failed");
}

const GEMINI_ASPECT_MAP: Record<string, string> = {
  "1:1": "1:1",
  "4:5": "3:4",
  "9:16": "9:16",
  "16:9": "16:9",
};

async function generateWithGemini(
  request: ImageRequest
): Promise<ImageResult> {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

  const styledPrompt = `Generate an image: ${request.style} style. ${request.prompt}. High quality, professional, suitable for social media advertisement.`;
  const geminiAspect = GEMINI_ASPECT_MAP[request.aspectRatio] ?? "1:1";

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-image",
    contents: styledPrompt,
    config: {
      responseModalities: ["TEXT", "IMAGE"],
      imageConfig: {
        aspectRatio: geminiAspect,
      },
    },
  });

  const parts = response.candidates?.[0]?.content?.parts;
  if (!parts) {
    throw new Error("No response from Gemini image generation");
  }

  for (const part of parts) {
    if (part.inlineData?.data) {
      return {
        base64: part.inlineData.data,
        mimeType: part.inlineData.mimeType || "image/png",
      };
    }
  }

  throw new Error("Gemini did not return an image");
}

export class ImageQuotaError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ImageQuotaError";
  }
}

export async function generateImage(request: ImageRequest): Promise<ImageResult> {
  const modelId = request.model || "flux";
  const modelDef = IMAGE_MODELS.find((m) => m.id === modelId);

  if (!modelDef || modelDef.provider === "pollinations") {
    return generateWithPollinations(request, modelId);
  }

  if (modelDef.provider === "gemini") {
    try {
      return await generateWithGemini(request);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (
        message.includes("429") ||
        message.includes("quota") ||
        message.includes("RESOURCE_EXHAUSTED") ||
        message.includes("rate limit")
      ) {
        throw new ImageQuotaError(
          "Gemini image generation limit reached. Try switching to a Pollinations model (Flux, DreamShaper, etc.)."
        );
      }
      if (
        message.includes("SAFETY") ||
        message.includes("PROHIBITED") ||
        message.includes("blocked")
      ) {
        throw new Error(
          "Gemini blocked this image prompt for safety reasons. Try a different prompt or switch to a Pollinations model."
        );
      }
      throw new Error(
        `Gemini image generation failed: ${message.slice(0, 200)}. Try switching to a Pollinations model.`
      );
    }
  }

  return generateWithPollinations(request, "flux");
}
