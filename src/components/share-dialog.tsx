"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  InstagramLogo,
  FacebookLogo,
  XLogo,
  TiktokLogo,
  LinkedinLogo,
  Copy,
  Check,
  DownloadSimple,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import {
  formatForPlatform,
  type Platform,
} from "@/lib/format-for-platform";

const PLATFORMS: { value: Platform; label: string; icon: typeof InstagramLogo; color: string }[] = [
  { value: "instagram", label: "Instagram", icon: InstagramLogo, color: "hover:text-pink-500" },
  { value: "facebook", label: "Facebook", icon: FacebookLogo, color: "hover:text-blue-600" },
  { value: "twitter", label: "X", icon: XLogo, color: "hover:text-foreground" },
  { value: "tiktok", label: "TikTok", icon: TiktokLogo, color: "hover:text-foreground" },
  { value: "linkedin", label: "LinkedIn", icon: LinkedinLogo, color: "hover:text-blue-500" },
];

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  caption: string;
  hashtags: string[];
  cta: string;
  imageUrl?: string | null;
  imageBase64?: string | null;
  imageMimeType?: string | null;
}

export function ShareDialog({
  open,
  onOpenChange,
  caption,
  hashtags,
  cta,
  imageUrl,
  imageBase64,
  imageMimeType,
}: ShareDialogProps) {
  const [selectedPlatform, setSelectedPlatform] = useState<Platform>("instagram");
  const [copied, setCopied] = useState(false);

  const formatted = formatForPlatform(selectedPlatform, caption, hashtags, cta);
  const hasImage = !!(imageUrl || imageBase64);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(formatted.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable in insecure context */
    }
  };

  const handleDownloadImage = async () => {
    const link = document.createElement("a");
    if (imageBase64 && imageMimeType) {
      link.href = `data:${imageMimeType};base64,${imageBase64}`;
      link.download = `teaser-image.${imageMimeType.split("/")[1] || "png"}`;
      link.click();
    } else if (imageUrl) {
      try {
        const res = await fetch(imageUrl);
        const blob = await res.blob();
        const blobUrl = URL.createObjectURL(blob);
        link.href = blobUrl;
        link.download = "teaser-image.png";
        link.click();
        URL.revokeObjectURL(blobUrl);
      } catch {
        window.open(imageUrl, "_blank");
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share Content</DialogTitle>
          <DialogDescription>
            Pick a platform to get a formatted caption ready to paste.
          </DialogDescription>
        </DialogHeader>

        <div className="flex justify-center gap-2">
          {PLATFORMS.map((p) => (
            <button
              key={p.value}
              onClick={() => {
                setSelectedPlatform(p.value);
                setCopied(false);
              }}
              className={cn(
                "flex flex-col items-center gap-1 rounded-lg border p-3 text-xs font-medium transition-all btn-press",
                selectedPlatform === p.value
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-border text-muted-foreground",
                p.color
              )}
            >
              <p.icon className="h-5 w-5" weight={selectedPlatform === p.value ? "fill" : "duotone"} />
              {p.label}
            </button>
          ))}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Formatted for {PLATFORMS.find((p) => p.value === selectedPlatform)?.label}</span>
            {formatted.charLimit && (
              <span className={cn(
                formatted.text.length > formatted.charLimit ? "text-destructive" : ""
              )}>
                {formatted.text.length} / {formatted.charLimit}
              </span>
            )}
          </div>
          <pre className="max-h-60 overflow-y-auto whitespace-pre-wrap rounded-md bg-muted p-3 text-sm leading-relaxed">
            {formatted.text}
          </pre>
        </div>

        <div className="flex gap-2">
          <Button className="flex-1 btn-press" onClick={handleCopy}>
            {copied ? (
              <Check className="mr-2 h-4 w-4" />
            ) : (
              <Copy className="mr-2 h-4 w-4" />
            )}
            {copied ? "Copied!" : "Copy Text"}
          </Button>
          {hasImage && (
            <Button variant="outline" className="btn-press" onClick={handleDownloadImage}>
              <DownloadSimple className="mr-2 h-4 w-4" />
              Image
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
