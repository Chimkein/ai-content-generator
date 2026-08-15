export interface CaptionModel {
  id: string;
  name: string;
  provider: "gemini" | "groq";
  model: string;
  description: string;
  vision?: boolean;
}

export const CAPTION_MODELS: CaptionModel[] = [
  {
    id: "gemini-flash",
    name: "Gemini 2.5 Flash",
    provider: "gemini",
    model: "gemini-2.5-flash",
    description: "Fast, multimodal (images/video)",
    vision: true,
  },
  {
    id: "groq-qwen36-27b",
    name: "Qwen 3.6 27B",
    provider: "groq",
    model: "qwen/qwen3.6-27b",
    description: "Multimodal (images + text), fast",
    vision: true,
  },
  {
    id: "groq-llama-70b",
    name: "Llama 3.3 70B",
    provider: "groq",
    model: "llama-3.3-70b-versatile",
    description: "Fast, high quality, text only",
  },
  {
    id: "groq-gpt-oss-120b",
    name: "GPT-OSS 120B",
    provider: "groq",
    model: "openai/gpt-oss-120b",
    description: "High quality, text only",
  },
];

export function getFallbackModels(currentId: string, hasMedia: boolean, hasVideo: boolean): CaptionModel[] {
  const current = CAPTION_MODELS.find((m) => m.id === currentId);
  const others = CAPTION_MODELS.filter((m) => m.id !== currentId);

  if (hasVideo) {
    return others.filter((m) => m.provider === "gemini");
  }

  if (hasMedia) {
    return others.filter((m) => m.vision);
  }

  if (current?.provider === "gemini") {
    return others;
  }
  return [...others.filter((m) => m.provider === "groq"), ...others.filter((m) => m.provider === "gemini")];
}
