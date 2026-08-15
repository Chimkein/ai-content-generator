"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { DownloadSimple, FilmStrip, SpinnerGap, ArrowsClockwise } from "@phosphor-icons/react";
import { createKenBurnsVideo } from "@/lib/video/ken-burns";

const DURATIONS = [
  { value: "3000", label: "3 seconds" },
  { value: "5000", label: "5 seconds" },
  { value: "8000", label: "8 seconds" },
];

const EFFECTS = [
  { value: "zoom-in", label: "Zoom In" },
  { value: "zoom-out", label: "Zoom Out" },
  { value: "pan-right", label: "Pan Right" },
  { value: "pan-left", label: "Pan Left" },
];

interface TeaserVideoGeneratorProps {
  imageBase64: string;
  imageMimeType: string;
}

export function TeaserVideoGenerator({
  imageBase64,
  imageMimeType,
}: TeaserVideoGeneratorProps) {
  const [duration, setDuration] = useState("5000");
  const [effect, setEffect] = useState("zoom-in");
  const [generating, setGenerating] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const effectOptions = {
    "zoom-in": { zoomStart: 1.0, zoomEnd: 1.3, panX: 0.1, panY: 0.05 },
    "zoom-out": { zoomStart: 1.3, zoomEnd: 1.0, panX: -0.1, panY: -0.05 },
    "pan-right": { zoomStart: 1.15, zoomEnd: 1.15, panX: 0.4, panY: 0.0 },
    "pan-left": { zoomStart: 1.15, zoomEnd: 1.15, panX: -0.4, panY: 0.0 },
  };

  const [videoError, setVideoError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setGenerating(true);
    setVideoError(null);
    try {
      if (videoUrl) URL.revokeObjectURL(videoUrl);

      const imageDataUrl = `data:${imageMimeType};base64,${imageBase64}`;
      const opts = effectOptions[effect as keyof typeof effectOptions];
      const blob = await createKenBurnsVideo(imageDataUrl, {
        durationMs: parseInt(duration),
        ...opts,
      });
      setVideoUrl(URL.createObjectURL(blob));
    } catch {
      setVideoError("Video generation failed. Your browser may not support this feature.");
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!videoUrl) return;
    const a = document.createElement("a");
    a.href = videoUrl;
    const supportsMP4 = MediaRecorder.isTypeSupported("video/mp4");
    a.download = `teaser-video.${supportsMP4 ? "mp4" : "webm"}`;
    a.click();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Teaser Video</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>Duration</Label>
            <Select
              value={duration}
              onValueChange={(v) => v !== null && setDuration(v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DURATIONS.map((d) => (
                  <SelectItem key={d.value} value={d.value}>
                    {d.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Effect</Label>
            <Select
              value={effect}
              onValueChange={(v) => v !== null && setEffect(v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EFFECTS.map((e) => (
                  <SelectItem key={e.value} value={e.value}>
                    {e.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {videoError && (
          <p className="text-sm text-destructive">{videoError}</p>
        )}

        {videoUrl && (
          <video
            ref={videoRef}
            src={videoUrl}
            controls
            className="w-full rounded-md"
          />
        )}

        <div className="flex gap-2">
          <Button
            variant={videoUrl ? "outline" : "default"}
            onClick={handleGenerate}
            disabled={generating}
          >
            {generating ? (
              <SpinnerGap className="mr-2 h-4 w-4 animate-spin" />
            ) : videoUrl ? (
              <ArrowsClockwise className="mr-2 h-4 w-4" />
            ) : (
              <FilmStrip className="mr-2 h-4 w-4" weight="duotone" />
            )}
            {generating
              ? "Generating..."
              : videoUrl
                ? "Regenerate"
                : "Generate Video"}
          </Button>
          {videoUrl && (
            <Button variant="outline" onClick={handleDownload}>
              <DownloadSimple className="mr-2 h-4 w-4" />
              Download
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
