import { GoogleGenAI, FileState } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export async function uploadVideoToGemini(
  buffer: Buffer,
  mimeType: string,
  fileName: string
): Promise<{ fileUri: string; mimeType: string }> {
  const blob = new Blob([new Uint8Array(buffer)], { type: mimeType });

  const uploaded = await ai.files.upload({
    file: blob,
    config: { mimeType, displayName: fileName },
  });

  if (!uploaded.name) {
    throw new Error("File upload returned no name");
  }

  let file = uploaded;
  const maxAttempts = 60;
  for (let i = 0; i < maxAttempts; i++) {
    if (file.state === FileState.ACTIVE) break;
    if (file.state === FileState.FAILED) {
      throw new Error("Video processing failed");
    }
    await new Promise((r) => setTimeout(r, 2000));
    file = await ai.files.get({ name: uploaded.name! });
  }

  if (file.state !== FileState.ACTIVE) {
    throw new Error("Video processing timed out");
  }

  return { fileUri: file.uri!, mimeType: file.mimeType ?? mimeType };
}
