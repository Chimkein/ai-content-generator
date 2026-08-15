"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { FloppyDisk, SpinnerGap, Check, Sun, Moon, Desktop } from "@phosphor-icons/react";
import { useTheme } from "@/components/theme-provider";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { IMAGE_MODELS } from "@/lib/ai/image";
import { CAPTION_MODELS } from "@/lib/ai/caption-models";

const TONES = [
  "Casual",
  "Professional",
  "Funny",
  "Inspirational",
  "Educational",
  "Promotional",
  "Storytelling",
  "Gen Z",
];

const LENGTHS = ["Short", "Medium", "Long"];
const LANGUAGES = ["English", "Filipino", "Cebuano", "Taglish"];
const IMAGE_STYLES = [
  "Modern",
  "Cinematic",
  "Minimal",
  "Promotional",
  "3D",
  "Illustration",
  "Custom",
];
const ASPECT_RATIOS = ["1:1", "4:5", "9:16", "16:9"];

interface Settings {
  default_tone: string;
  default_length: string;
  default_language: string;
  generate_image: boolean;
  default_image_style: string;
  default_image_model: string;
  default_caption_model: string;
  default_aspect_ratio: string;
  default_hashtags: boolean;
  default_emojis: boolean;
  default_cta: boolean;
  generate_video: boolean;
  image_count: number;
}

const DEFAULTS: Settings = {
  default_tone: "Casual",
  default_length: "Medium",
  default_language: "English",
  generate_image: false,
  default_image_style: "Modern",
  default_image_model: "flux",
  default_caption_model: "gemini-flash",
  default_aspect_ratio: "4:5",
  default_hashtags: true,
  default_emojis: false,
  default_cta: false,
  generate_video: false,
  image_count: 3,
};

const themeOptions = [
  { value: "light" as const, icon: Sun, label: "Light" },
  { value: "system" as const, icon: Desktop, label: "System" },
  { value: "dark" as const, icon: Moon, label: "Dark" },
];

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [original, setOriginal] = useState<Settings>(DEFAULTS);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        const loaded: Settings = {
          default_tone: data.default_tone ?? DEFAULTS.default_tone,
          default_length: data.default_length ?? DEFAULTS.default_length,
          default_language: data.default_language ?? DEFAULTS.default_language,
          generate_image: data.generate_image ?? DEFAULTS.generate_image,
          default_image_style: data.default_image_style ?? DEFAULTS.default_image_style,
          default_image_model: data.default_image_model ?? DEFAULTS.default_image_model,
          default_caption_model: data.default_caption_model ?? DEFAULTS.default_caption_model,
          default_aspect_ratio: data.default_aspect_ratio ?? DEFAULTS.default_aspect_ratio,
          default_hashtags: data.default_hashtags ?? DEFAULTS.default_hashtags,
          default_emojis: data.default_emojis ?? DEFAULTS.default_emojis,
          default_cta: data.default_cta ?? DEFAULTS.default_cta,
          generate_video: data.generate_video ?? DEFAULTS.generate_video,
          image_count: data.image_count ?? DEFAULTS.image_count,
        };
        setSettings(loaded);
        setOriginal(loaded);
      })
      .finally(() => setLoading(false));
  }, []);

  const update = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    setSettings((prev) => {
      const next = { ...prev, [key]: value };
      setDirty(JSON.stringify(next) !== JSON.stringify(original));
      return next;
    });
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (response.ok) {
        setOriginal(settings);
        setDirty(false);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
        toast.success("Settings saved");
      } else {
        toast.error("Failed to save settings");
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground mt-1">Manage your preferences.</p>
        </div>
        <Card>
          <CardContent className="flex items-center justify-center py-12 text-muted-foreground">
            <SpinnerGap className="h-5 w-5 animate-spin mr-2" />
            Loading settings...
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between animate-fade-in-up stagger-1">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground mt-1">
            Set defaults for new content generation.
          </p>
        </div>
        <Button className="btn-press" onClick={handleSave} disabled={saving || !dirty}>
          {saving ? (
            <SpinnerGap className="mr-2 h-4 w-4 animate-spin" />
          ) : saved ? (
            <Check className="mr-2 h-4 w-4" />
          ) : (
            <FloppyDisk className="mr-2 h-4 w-4" />
          )}
          {saving ? "Saving..." : saved ? "Saved" : "Save"}
        </Button>
      </div>

      <Card className="animate-fade-in-up stagger-2">
        <CardHeader>
          <CardTitle className="text-base">Appearance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label>Theme</Label>
            <div className="grid grid-cols-3 gap-2">
              {themeOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setTheme(opt.value)}
                  className={cn(
                    "flex items-center justify-center gap-2 rounded-lg border p-3 text-sm font-medium transition-all",
                    theme === opt.value
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border text-muted-foreground hover:border-muted-foreground/50"
                  )}
                >
                  <opt.icon className="h-4 w-4" />
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="animate-fade-in-up stagger-3">
        <CardHeader>
          <CardTitle className="text-base">Caption Defaults</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <p className="text-sm text-muted-foreground">
            These defaults pre-fill when you create new content. You can always
            override them per generation.
          </p>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label>Default Tone</Label>
              <Select
                value={settings.default_tone}
                onValueChange={(v) => v !== null && update("default_tone", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TONES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Default Length</Label>
              <Select
                value={settings.default_length}
                onValueChange={(v) => v !== null && update("default_length", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LENGTHS.map((l) => (
                    <SelectItem key={l} value={l}>
                      {l}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Default Language</Label>
              <Select
                value={settings.default_language}
                onValueChange={(v) =>
                  v !== null && update("default_language", v)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGES.map((l) => (
                    <SelectItem key={l} value={l}>
                      {l}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <Label className="text-sm font-medium">Caption Options</Label>
            <div className="flex items-center gap-2">
              <Checkbox
                id="default-hashtags"
                checked={settings.default_hashtags}
                onCheckedChange={(v) => update("default_hashtags", v === true)}
              />
              <Label htmlFor="default-hashtags" className="cursor-pointer">
                Include hashtags
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="default-emojis"
                checked={settings.default_emojis}
                onCheckedChange={(v) => update("default_emojis", v === true)}
              />
              <Label htmlFor="default-emojis" className="cursor-pointer">
                Include emojis
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="default-cta"
                checked={settings.default_cta}
                onCheckedChange={(v) => update("default_cta", v === true)}
              />
              <Label htmlFor="default-cta" className="cursor-pointer">
                Include call-to-action
              </Label>
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label>Caption AI Model</Label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {CAPTION_MODELS.map((m) => (
                <button
                  key={m.id}
                  onClick={() => update("default_caption_model", m.id)}
                  className={cn(
                    "flex flex-col items-start rounded-lg border p-2.5 text-left transition-all btn-press",
                    settings.default_caption_model === m.id
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-muted-foreground/50 hover:bg-muted/30"
                  )}
                >
                  <span className={cn(
                    "text-xs font-semibold",
                    settings.default_caption_model === m.id ? "text-primary" : "text-foreground"
                  )}>
                    {m.name}
                  </span>
                  <span className="text-[10px] text-muted-foreground leading-tight mt-0.5">
                    {m.description}
                  </span>
                </button>
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground">
              Auto-switches to another model if rate limited. Image/video content always uses Gemini.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="animate-fade-in-up stagger-4">
        <CardHeader>
          <CardTitle className="text-base">Image Generation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Generate teaser image by default</Label>
              <p className="text-sm text-muted-foreground">
                Automatically generate a teaser image alongside each caption.
              </p>
            </div>
            <Switch
              checked={settings.generate_image}
              onCheckedChange={(checked) => update("generate_image", checked)}
            />
          </div>

          <Separator />

          <div className="space-y-2">
            <Label>Images per Generation</Label>
            <p className="text-sm text-muted-foreground">
              Generate 1 image (faster) or 3 variations (more choices).
            </p>
            <div className="grid grid-cols-2 gap-2 max-w-[200px]">
              {[1, 3].map((n) => (
                <button
                  key={n}
                  onClick={() => update("image_count", n)}
                  className={cn(
                    "rounded-md border px-3 py-1.5 text-sm font-medium transition-colors",
                    settings.image_count === n
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border text-muted-foreground hover:border-muted-foreground/50"
                  )}
                >
                  {n} {n === 1 ? "image" : "images"}
                </button>
              ))}
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label>Default Model</Label>
            <Select
              value={settings.default_image_model}
              onValueChange={(v) => v !== null && update("default_image_model", v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {IMAGE_MODELS.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.name} — {m.description}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Default Style</Label>
              <Select
                value={settings.default_image_style}
                onValueChange={(v) =>
                  v !== null && update("default_image_style", v)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {IMAGE_STYLES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Default Aspect Ratio</Label>
              <div className="grid grid-cols-4 gap-2">
                {ASPECT_RATIOS.map((r) => (
                  <button
                    key={r}
                    onClick={() => update("default_aspect_ratio", r)}
                    className={cn(
                      "rounded-md border px-2 py-1.5 text-xs font-medium transition-colors",
                      settings.default_aspect_ratio === r
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border text-muted-foreground hover:border-muted-foreground/50"
                    )}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="animate-fade-in-up stagger-5">
        <CardHeader>
          <CardTitle className="text-base">Video Generation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Generate teaser video by default</Label>
              <p className="text-sm text-muted-foreground">
                Animate the teaser image into a short Ken Burns effect video.
              </p>
            </div>
            <Switch
              checked={settings.generate_video}
              onCheckedChange={(checked) => update("generate_video", checked)}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="animate-fade-in-up stagger-6">
        <CardHeader>
          <CardTitle className="text-base">About</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Caption model</span>
            <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded">
              {CAPTION_MODELS.find((m) => m.id === settings.default_caption_model)?.name ?? "Gemini 2.5 Flash"} ({CAPTION_MODELS.find((m) => m.id === settings.default_caption_model)?.provider ?? "gemini"})
            </span>
          </div>
          <Separator />
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Image model</span>
            <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded">
              {IMAGE_MODELS.find((m) => m.id === settings.default_image_model)?.name ?? "Flux"} ({IMAGE_MODELS.find((m) => m.id === settings.default_image_model)?.provider ?? "pollinations"})
            </span>
          </div>
          <Separator />
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Video model</span>
            <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded">
              Ken Burns (client-side)
            </span>
          </div>
          <Separator />
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Video processing</span>
            <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded">
              Gemini Files API
            </span>
          </div>
          <Separator />
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Version</span>
            <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded">
              0.1.0
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
