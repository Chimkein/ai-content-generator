export interface KenBurnsOptions {
  durationMs: number;
  fps: number;
  zoomStart: number;
  zoomEnd: number;
  panX: number;
  panY: number;
  width: number;
  height: number;
}

const DEFAULT_OPTIONS: KenBurnsOptions = {
  durationMs: 5000,
  fps: 30,
  zoomStart: 1.0,
  zoomEnd: 1.3,
  panX: 0.1,
  panY: 0.05,
  width: 1024,
  height: 1280,
};

export async function createKenBurnsVideo(
  imageDataUrl: string,
  options: Partial<KenBurnsOptions> = {}
): Promise<Blob> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const { durationMs, fps, zoomStart, zoomEnd, panX, panY, width, height } =
    opts;

  const img = await loadImage(imageDataUrl);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;

  const mimeType = MediaRecorder.isTypeSupported("video/mp4")
    ? "video/mp4"
    : "video/webm";
  const stream = canvas.captureStream(fps);
  const recorder = new MediaRecorder(stream, { mimeType });
  const chunks: Blob[] = [];

  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data);
  };

  const totalFrames = Math.ceil((durationMs / 1000) * fps);
  const frameDuration = 1000 / fps;

  return new Promise((resolve, reject) => {
    recorder.onstop = () => {
      resolve(new Blob(chunks, { type: mimeType }));
    };
    recorder.onerror = () => reject(new Error("Recording failed"));

    recorder.start();

    let frame = 0;
    const drawFrame = () => {
      if (frame >= totalFrames) {
        recorder.stop();
        return;
      }

      const t = frame / totalFrames;
      const zoom = zoomStart + (zoomEnd - zoomStart) * t;
      const cx = panX * t;
      const cy = panY * t;

      const sw = img.width / zoom;
      const sh = img.height / zoom;
      const sx = (img.width - sw) / 2 + cx * (img.width - sw);
      const sy = (img.height - sh) / 2 + cy * (img.height - sh);

      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, width, height);

      frame++;
      setTimeout(drawFrame, frameDuration);
    };

    drawFrame();
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}
