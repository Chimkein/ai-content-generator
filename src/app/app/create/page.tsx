"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { FileUpload } from "@/components/file-upload";
import {
  Sparkle,
  VideoCamera,
  Image as ImageIcon,
  TextT,
  Copy,
  Check,
  ArrowsClockwise,
  ArrowLeft,
  FloppyDisk,
  FolderPlus,
  Folder,
  DownloadSimple,
  ShareNetwork,
  X,
  MagicWand,
  BookmarkSimple,
  Trash,
  Crop,
} from "@phosphor-icons/react";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { CaptionResponse } from "@/lib/ai/caption";
import { IMAGE_MODELS } from "@/lib/ai/image";
import { CAPTION_MODELS } from "@/lib/ai/caption-models";
import { TeaserVideoGenerator } from "@/components/teaser-video-generator";
import { ShareDialog } from "@/components/share-dialog";
import Cropper from "react-easy-crop";
import type { Area } from "react-easy-crop";

async function getCroppedImage(
  imageSrc: string,
  pixelCrop: Area
): Promise<{ base64: string; mimeType: string }> {
  const image = new Image();
  image.src = imageSrc;
  await new Promise((resolve) => {
    image.onload = resolve;
  });
  const canvas = document.createElement("canvas");
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );
  const dataUrl = canvas.toDataURL("image/png");
  return {
    base64: dataUrl.split(",")[1],
    mimeType: "image/png",
  };
}

const CONTENT_TYPES = [
  { value: "video", label: "Video", icon: VideoCamera },
  { value: "image", label: "Image", icon: ImageIcon },
  { value: "text", label: "Text", icon: TextT },
] as const;

type ContentType = (typeof CONTENT_TYPES)[number]["value"];

interface CaptionTemplate {
  id: string;
  name: string;
  tone: string;
  length: string;
  language: string;
  include_hashtags: boolean;
  include_emojis: boolean;
  include_cta: boolean;
  instructions: string;
  is_starter: boolean;
}

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

export default function CreatePage() {
  const [contentType, setContentType] = useState<ContentType>("video");
  const [file, setFile] = useState<File | null>(null);
  const [textContent, setTextContent] = useState("");
  const [instructions, setInstructions] = useState("");

  const [tone, setTone] = useState("Casual");
  const [length, setLength] = useState("Medium");
  const [language, setLanguage] = useState("English");
  const [includeHashtags, setIncludeHashtags] = useState(true);
  const [includeEmojis, setIncludeEmojis] = useState(false);
  const [includeCta, setIncludeCta] = useState(false);

  const [generateImage, setGenerateImage] = useState(false);
  const [generateVideo, setGenerateVideo] = useState(false);
  const [imageSource, setImageSource] = useState<"ai" | "upload">("ai");
  const [uploadedPostImage, setUploadedPostImage] = useState<File | null>(null);
  const [imageStyle, setImageStyle] = useState("Modern");
  const [aspectRatio, setAspectRatio] = useState("4:5");
  const [imageModel, setImageModel] = useState("flux");
  const [imageCount, setImageCount] = useState(3);
  const [captionModel, setCaptionModel] = useState("gemini-flash");
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [enhanceCooldown, setEnhanceCooldown] = useState(0);
  const [isEnhancingContent, setIsEnhancingContent] = useState(false);
  const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false);

  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingStep, setGeneratingStep] = useState("");
  const [isGeneratingImages, setIsGeneratingImages] = useState(false);
  const [result, setResult] = useState<CaptionResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Result state
  const [generatedImages, setGeneratedImages] = useState<
    Array<{ base64: string; mimeType: string; isUserUpload?: boolean }>
  >([]);
  const [selectedImageIndices, setSelectedImageIndices] = useState<Set<number>>(new Set());
  const [selectedVariation, setSelectedVariation] = useState(0);
  const [editedCaptions, setEditedCaptions] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [folders, setFolders] = useState<{ id: string; name: string }[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string>("");
  const [newFolderName, setNewFolderName] = useState("");
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [fallbackNotice, setFallbackNotice] = useState<string | null>(null);
  const [cropImageIndex, setCropImageIndex] = useState<number | null>(null);
  const [cropState, setCropState] = useState({ x: 0, y: 0 });
  const [cropZoom, setCropZoom] = useState(1);
  const [cropAspect, setCropAspect] = useState<number | undefined>(undefined);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const onCropComplete = useCallback((_: Area, croppedPixels: Area) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);
  const [templates, setTemplates] = useState<CaptionTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState("");
  const router = useRouter();

  const filePreviewUrl = useMemo(
    () => (file ? URL.createObjectURL(file) : null),
    [file]
  );
  useEffect(() => {
    return () => {
      if (filePreviewUrl) URL.revokeObjectURL(filePreviewUrl);
    };
  }, [filePreviewUrl]);

  const postImagePreviewUrl = useMemo(
    () => (uploadedPostImage ? URL.createObjectURL(uploadedPostImage) : null),
    [uploadedPostImage]
  );
  useEffect(() => {
    return () => {
      if (postImagePreviewUrl) URL.revokeObjectURL(postImagePreviewUrl);
    };
  }, [postImagePreviewUrl]);

  useEffect(() => {
    if (enhanceCooldown <= 0) return;
    const timer = setInterval(() => {
      setEnhanceCooldown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [enhanceCooldown]);

  useEffect(() => {
    fetch("/api/folders")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setFolders(data);
      });
    // Templates fetch disabled while UI is hidden
    // fetch("/api/templates")
    //   .then((r) => r.json())
    //   .then((data) => {
    //     if (Array.isArray(data)) setTemplates(data);
    //   });
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        if (data.default_tone) setTone(data.default_tone);
        if (data.default_length) setLength(data.default_length);
        if (data.default_language) setLanguage(data.default_language);
        if (data.generate_image != null) setGenerateImage(data.generate_image);
        if (data.default_image_style) setImageStyle(data.default_image_style);
        if (data.default_aspect_ratio) setAspectRatio(data.default_aspect_ratio);
        if (data.default_hashtags != null) setIncludeHashtags(data.default_hashtags);
        if (data.default_emojis != null) setIncludeEmojis(data.default_emojis);
        if (data.default_cta != null) setIncludeCta(data.default_cta);
        if (data.generate_video != null) setGenerateVideo(data.generate_video);
        if (data.default_image_model) setImageModel(data.default_image_model);
        if (data.default_caption_model) setCaptionModel(data.default_caption_model);
        if (data.image_count != null) setImageCount(data.image_count);
      });
  }, []);

  const canGenerate =
    contentType === "text" ? textContent.trim().length > 0 : file !== null;

  const selectedTemplateName = templates.find((t) => t.id === selectedTemplateId)?.name ?? "";

  const applyTemplate = (name: string) => {
    const t = templates.find((tpl) => tpl.name === name);
    if (!t) return;
    setSelectedTemplateId(t.id);
    setTone(t.tone);
    setLength(t.length);
    setLanguage(t.language);
    setIncludeHashtags(t.include_hashtags);
    setIncludeEmojis(t.include_emojis);
    setIncludeCta(t.include_cta);
    if (t.instructions) setInstructions(t.instructions);
  };

  const handleSaveTemplate = async () => {
    if (!newTemplateName.trim()) return;
    setSavingTemplate(true);
    try {
      const res = await fetch("/api/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newTemplateName.trim(),
          tone,
          length,
          language,
          include_hashtags: includeHashtags,
          include_emojis: includeEmojis,
          include_cta: includeCta,
          instructions,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setTemplates((prev) => [...prev, data]);
        setSelectedTemplateId(data.id);
        setShowSaveTemplate(false);
        setNewTemplateName("");
      }
    } finally {
      setSavingTemplate(false);
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    const res = await fetch(`/api/templates/${id}`, { method: "DELETE" });
    if (res.ok) {
      setTemplates((prev) => prev.filter((t) => t.id !== id));
      if (selectedTemplateId === id) setSelectedTemplateId("");
    }
  };

  const hasThemeContent =
    contentType === "text" ? textContent.trim().length > 0 : file !== null;

  const handleGeneratePrompt = async () => {
    setIsGeneratingPrompt(true);
    try {
      let imageBase64: string | undefined;
      let imageMimeType: string | undefined;

      if (contentType === "image" && file) {
        const buffer = await file.arrayBuffer();
        imageBase64 = btoa(
          new Uint8Array(buffer).reduce(
            (d, byte) => d + String.fromCharCode(byte),
            ""
          )
        );
        imageMimeType = file.type;
      }

      const res = await fetch("/api/generate-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          themeText: contentType === "text" ? textContent : undefined,
          contentType,
          imageBase64,
          imageMimeType,
          captionModel,
        }),
      });
      const data = await res.json();
      if (res.ok && data.generated) {
        setInstructions(data.generated);
        const fbModel =
          data.usedModel && data.usedModel !== captionModel
            ? CAPTION_MODELS.find((m) => m.id === data.usedModel)
            : null;
        toast.success(fbModel ? `Prompt generated via ${fbModel.name} (fallback)` : "Prompt generated!");
      } else if (res.status === 429 && data.retryAfter) {
        setEnhanceCooldown(data.retryAfter);
        toast.error(data.retryAfter > 0
          ? `Rate limited. Try again in ${data.retryAfter}s.`
          : "Daily quota exhausted. Resets at midnight PT.");
      } else {
        toast.error(data.error ?? "Failed to generate prompt.");
      }
    } catch {
      toast.error("Failed to generate prompt. Please try again.");
    } finally {
      setIsGeneratingPrompt(false);
    }
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);
    setFallbackNotice(null);
    setGeneratingStep("Analyzing content...");

    try {
      let postImageBase64: string | undefined;
      let postImageMimeType: string | undefined;

      if (generateImage && imageSource === "upload" && uploadedPostImage) {
        setGeneratingStep("Processing post image...");
        const buf = await uploadedPostImage.arrayBuffer();
        postImageBase64 = btoa(
          new Uint8Array(buf).reduce(
            (d, byte) => d + String.fromCharCode(byte),
            ""
          )
        );
        postImageMimeType = uploadedPostImage.type;
      }

      let data: CaptionResponse;

      if (contentType === "video" && file) {
        setGeneratingStep("Uploading video...");
        const formData = new FormData();
        formData.append("video", file);
        formData.append(
          "settings",
          JSON.stringify({
            tone,
            length,
            language,
            includeHashtags,
            includeEmojis,
            includeCta,
          })
        );
        formData.append("instructions", instructions);
        formData.append("captionModel", captionModel);
        if (postImageBase64 && postImageMimeType) {
          formData.append("postImageBase64", postImageBase64);
          formData.append("postImageMimeType", postImageMimeType);
        }

        setGeneratingStep("Processing video (this may take a moment)...");
        const response = await fetch("/api/generate/video", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const err = await response.json();
          throw new Error(err.error || "Video processing failed");
        }

        data = await response.json();
      } else {
        let imageBase64: string | undefined;
        let imageMimeType: string | undefined;

        if (contentType === "image" && file) {
          setGeneratingStep("Processing image...");
          const buffer = await file.arrayBuffer();
          imageBase64 = btoa(
            new Uint8Array(buffer).reduce(
              (d, byte) => d + String.fromCharCode(byte),
              ""
            )
          );
          imageMimeType = file.type;
        }

        setGeneratingStep("Generating caption...");

        const response = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contentType,
            textContent:
              contentType === "text"
                ? textContent
                : contentType === "image"
                  ? instructions
                  : undefined,
            imageBase64,
            imageMimeType,
            postImageBase64,
            postImageMimeType,
            instructions,
            captionModel,
            settings: {
              tone,
              length,
              language,
              includeHashtags,
              includeEmojis,
              includeCta,
            },
          }),
        });

        if (!response.ok) {
          const err = await response.json();
          throw new Error(err.error || "Generation failed");
        }

        data = await response.json();
      }
      if (data.usedModel && data.usedModel !== captionModel) {
        const fallbackModel = CAPTION_MODELS.find((m) => m.id === data.usedModel);
        if (fallbackModel) {
          setFallbackNotice(
            `Auto-switched to ${fallbackModel.name} (${fallbackModel.provider}) — selected model was rate limited.`
          );
        }
      }
      setResult(data);
      setEditedCaptions([...data.captions]);
      setSelectedVariation(0);

      if (generateImage && data.imagePrompts.length > 0) {
        setGeneratingStep("Generating teaser images...");
        setIsGeneratingImages(true);
        const images: Array<{ base64: string; mimeType: string; isUserUpload?: boolean }> = [];

        if (imageSource === "upload" && postImageBase64 && postImageMimeType) {
          images.push({ base64: postImageBase64, mimeType: postImageMimeType, isUserUpload: true });
        }

        try {
          const prompts = data.imagePrompts.slice(0, imageCount);
          while (prompts.length < imageCount) prompts.push(prompts[0]);

          let failCount = 0;
          const failReasons: string[] = [];
          for (let i = 0; i < prompts.length; i++) {
            try {
              const res = await fetch("/api/generate-image", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ prompt: prompts[i], style: imageStyle, aspectRatio, model: imageModel }),
              });
              if (res.ok) {
                const imgData = await res.json();
                images.push(imgData);
                setGeneratedImages([...images]);
                setSelectedImageIndices(new Set(images.map((_, idx) => idx)));
              } else {
                failCount++;
                try {
                  const errData = await res.json();
                  if (errData.error) failReasons.push(errData.error);
                } catch { /* ignore */ }
              }
            } catch (e) {
              failCount++;
              failReasons.push(e instanceof Error ? e.message : "Network error");
            }
          }

          const reasonHint = failReasons.length > 0 ? ` (${failReasons[0]})` : "";
          if (images.filter((i) => !i.isUserUpload).length === 0) {
            setError(`Caption generated, but all image generations failed.${reasonHint}`);
          } else if (failCount > 0) {
            setError(`${failCount} of ${imageCount} image generations failed.${reasonHint}`);
          }
        } catch (imgError) {
          console.error("Image generation error:", imgError);
          if (images.filter((i) => !i.isUserUpload).length === 0) {
            setError("Caption generated, but image generation failed.");
          }
        }

        setGeneratedImages(images);
        setSelectedImageIndices(new Set(images.map((_, i) => i)));
        setIsGeneratingImages(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsGenerating(false);
      setIsGeneratingImages(false);
      setGeneratingStep("");
    }
  };

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied to clipboard");
    } catch {
      toast.error("Failed to copy");
    }
  };

  const handleRegenerate = () => {
    setGeneratedImages([]);
    setSelectedImageIndices(new Set());
    setError(null);
    handleGenerate();
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    setCreatingFolder(true);
    try {
      const response = await fetch("/api/folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newFolderName.trim() }),
      });
      if (response.ok) {
        const folder = await response.json();
        setFolders((prev) => [...prev, folder].sort((a, b) => a.name.localeCompare(b.name)));
        setSelectedFolder(folder.id);
        setNewFolderName("");
        setShowNewFolder(false);
        toast.success("Folder created");
      }
    } finally {
      setCreatingFolder(false);
    }
  };

  const selectedImages = generatedImages.filter((_, i) => selectedImageIndices.has(i));

  const handleSave = async () => {
    if (!result) return;
    setIsSaving(true);
    try {
      const images = selectedImages.map((img) => ({
        base64: img.base64,
        mimeType: img.mimeType,
      }));

      const response = await fetch("/api/history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          caption: editedCaptions[selectedVariation],
          hashtags: result.hashtags,
          cta: result.cta,
          imagePrompt: result.imagePrompt,
          images: images.length > 0 ? images : null,
          originalFileType: contentType,
          folderId: selectedFolder && selectedFolder !== "none" ? selectedFolder : null,
          settings: {
            tone,
            length,
            language,
            includeHashtags,
            includeEmojis,
            includeCta,
          },
        }),
      });
      if (!response.ok) throw new Error("Save failed");
      setSaved(true);
      toast.success("Content saved!");
      setTimeout(() => router.push("/app/history"), 1000);
    } catch {
      toast.error("Failed to save. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleBack = () => {
    setResult(null);
    setGeneratedImages([]);
    setSelectedImageIndices(new Set());
    setEditedCaptions([]);
    setSelectedVariation(0);
    setError(null);
    setFallbackNotice(null);
    setSaved(false);
    setUploadedPostImage(null);
  };

  const handleEditCaption = (value: string) => {
    setEditedCaptions((prev) => {
      const updated = [...prev];
      updated[selectedVariation] = value;
      return updated;
    });
  };

  // Results view
  if (result) {
    return (
      <div className="space-y-6 pb-12">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={handleBack} className="rounded-lg">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Generated Content
            </h1>
            <p className="text-muted-foreground mt-1">
              Review and edit your generated caption.
            </p>
          </div>
        </div>

        {/* Fallback notice */}
        {fallbackNotice && (
          <div className="rounded-lg border border-warm/50 bg-warm/10 p-4 text-sm text-warm animate-fade-in-up flex items-center justify-between">
            <span>{fallbackNotice}</span>
            <button onClick={() => setFallbackNotice(null)} className="ml-3 shrink-0">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Error banner */}
        {error && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive animate-fade-in-up">
            {error}
          </div>
        )}

        {/* Original content preview */}
        {file && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Original Content</CardTitle>
            </CardHeader>
            <CardContent>
              {contentType === "image" && filePreviewUrl ? (
                <img
                  src={filePreviewUrl}
                  alt="Original"
                  className="max-h-64 rounded-md object-contain"
                />
              ) : contentType === "video" && filePreviewUrl ? (
                <video
                  src={filePreviewUrl}
                  controls
                  className="max-h-64 rounded-md"
                />
              ) : null}
            </CardContent>
          </Card>
        )}

        {/* Caption Variations */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Caption</CardTitle>
              {editedCaptions.length > 1 && (
                <span className="text-xs text-muted-foreground">
                  Variation {selectedVariation + 1} of {editedCaptions.length}
                </span>
              )}
            </div>
            {editedCaptions.length > 1 && (
              <div className="flex gap-1.5 pt-1">
                {editedCaptions.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedVariation(i)}
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-md text-xs font-semibold transition-all btn-press",
                      selectedVariation === i
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "border border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
                    )}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={editedCaptions[selectedVariation] ?? ""}
              onChange={(e) => handleEditCaption(e.target.value)}
              rows={6}
              className="text-base"
            />
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={() => handleCopy(editedCaptions[selectedVariation] ?? "")}
              >
                <Copy className="mr-2 h-4 w-4" />
                Copy Caption
              </Button>
              <Button variant="outline" onClick={handleRegenerate}>
                <ArrowsClockwise className="mr-2 h-4 w-4" />
                Regenerate
              </Button>
              <Button variant="outline" onClick={() => setShareOpen(true)}>
                <ShareNetwork className="mr-2 h-4 w-4" />
                Share
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Hashtags */}
        {result.hashtags.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Hashtags</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {result.hashtags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-sm">
                    {tag}
                  </Badge>
                ))}
              </div>
              <Button
                variant="outline"
                onClick={() => handleCopy(result.hashtags.join(" "))}
              >
                <Copy className="mr-2 h-4 w-4" />
                Copy Hashtags
              </Button>
            </CardContent>
          </Card>
        )}

        {/* CTA */}
        {result.cta && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Call to Action</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-base">{result.cta}</p>
            </CardContent>
          </Card>
        )}

        {/* Teaser Images */}
        {(generatedImages.length > 0 || isGeneratingImages) && (
          <Card className="animate-fade-in-up">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">
                  Teaser Images
                </CardTitle>
                <span className="text-xs text-muted-foreground">
                  {isGeneratingImages
                    ? `Generating... (${generatedImages.filter((i) => !i.isUserUpload).length} of ${imageCount} ready)`
                    : `${selectedImageIndices.size} of ${generatedImages.length} selected`}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                {isGeneratingImages
                  ? "AI images are being generated — each appears as it's ready."
                  : "Click to select which images to save. Selected images are highlighted."}
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {generatedImages.map((img, i) => {
                  const isSelected = selectedImageIndices.has(i);
                  return (
                    <div
                      key={`img-${i}`}
                      role="button"
                      tabIndex={0}
                      onClick={() => {
                        setSelectedImageIndices((prev) => {
                          const next = new Set(prev);
                          if (next.has(i)) next.delete(i);
                          else next.add(i);
                          return next;
                        });
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setSelectedImageIndices((prev) => {
                            const next = new Set(prev);
                            if (next.has(i)) next.delete(i);
                            else next.add(i);
                            return next;
                          });
                        }
                      }}
                      className={cn(
                        "group relative rounded-lg overflow-hidden border-2 transition-all btn-press cursor-pointer",
                        isSelected
                          ? "border-primary shadow-sm shadow-primary/20"
                          : "border-transparent opacity-50 hover:opacity-75"
                      )}
                    >
                      <img
                        src={`data:${img.mimeType};base64,${img.base64}`}
                        alt={img.isUserUpload ? "Your uploaded image" : `AI teaser ${i + 1}`}
                        className="w-full aspect-square object-cover"
                      />
                      <div className={cn(
                        "absolute top-2 left-2 flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold transition-colors",
                        isSelected
                          ? "bg-primary text-primary-foreground"
                          : "bg-background/80 text-muted-foreground border border-border"
                      )}>
                        {isSelected ? <Check className="h-3.5 w-3.5" /> : i + 1}
                      </div>
                      {img.isUserUpload && (
                        <Badge className="absolute top-2 right-2 text-[10px] px-1.5 py-0.5">
                          Yours
                        </Badge>
                      )}
                      <button
                        type="button"
                        className="absolute bottom-2 right-2 flex h-7 w-7 items-center justify-center rounded-md bg-background/80 text-foreground opacity-0 group-hover:opacity-100 hover:bg-background transition-all border border-border/50"
                        onClick={(e) => {
                          e.stopPropagation();
                          setCropImageIndex(i);
                          setCropState({ x: 0, y: 0 });
                          setCropZoom(1);
                          setCropAspect(undefined);
                          setCroppedAreaPixels(null);
                        }}
                      >
                        <Crop className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  );
                })}
                {isGeneratingImages && Array.from({ length: Math.max(0, imageCount - generatedImages.filter((i) => !i.isUserUpload).length) }).map((_, n) => (
                  <div
                    key={`skeleton-${n}`}
                    className="relative rounded-lg overflow-hidden border-2 border-border aspect-square bg-muted/50 flex flex-col items-center justify-center gap-3"
                  >
                    <ArrowsClockwise className="h-6 w-6 text-muted-foreground animate-spin" />
                    <span className="text-xs text-muted-foreground">Generating...</span>
                    <div className="absolute inset-0 bg-gradient-to-t from-muted/30 to-transparent animate-pulse" />
                  </div>
                ))}
              </div>

              <div className="flex gap-2 flex-wrap">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (selectedImageIndices.size === generatedImages.length) {
                      setSelectedImageIndices(new Set());
                    } else {
                      setSelectedImageIndices(new Set(generatedImages.map((_, i) => i)));
                    }
                  }}
                >
                  {selectedImageIndices.size === generatedImages.length ? "Deselect All" : "Select All"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    selectedImages.forEach((img, idx) => {
                      const link = document.createElement("a");
                      link.href = `data:${img.mimeType};base64,${img.base64}`;
                      link.download = `teaser-image-${idx + 1}.${img.mimeType.split("/")[1] || "png"}`;
                      link.click();
                    });
                  }}
                  disabled={selectedImageIndices.size === 0}
                >
                  <DownloadSimple className="mr-1.5 h-3.5 w-3.5" />
                  Download Selected
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    setGeneratingStep("Regenerating images...");
                    setIsGenerating(true);
                    setIsGeneratingImages(true);
                    setGeneratedImages((prev) => prev.filter((img) => img.isUserUpload));
                    try {
                      const prompts = result?.imagePrompts?.slice(0, imageCount) ?? [result?.imagePrompt ?? ""];
                      while (prompts.length < imageCount) prompts.push(prompts[0]);
                      const userUploads = generatedImages.filter((img) => img.isUserUpload);

                      const newImages = [...userUploads];
                      let failCount = 0;
                      const failReasons: string[] = [];
                      for (let i = 0; i < prompts.length; i++) {
                        try {
                          const res = await fetch("/api/generate-image", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ prompt: prompts[i], style: imageStyle, aspectRatio, model: imageModel }),
                          });
                          if (res.ok) {
                            newImages.push(await res.json());
                            setGeneratedImages([...newImages]);
                            setSelectedImageIndices(new Set(newImages.map((_, idx) => idx)));
                          } else {
                            failCount++;
                            try {
                              const errData = await res.json();
                              if (errData.error) failReasons.push(errData.error);
                            } catch { /* ignore */ }
                          }
                        } catch (e) {
                          failCount++;
                          failReasons.push(e instanceof Error ? e.message : "Network error");
                        }
                      }
                      setGeneratedImages(newImages);
                      setSelectedImageIndices(new Set(newImages.map((_, i) => i)));
                      if (failCount > 0 && failCount < imageCount) {
                        const hint = failReasons.length > 0 ? ` (${failReasons[0]})` : "";
                        setError(`${failCount} of ${imageCount} image regenerations failed.${hint}`);
                      } else if (failCount === imageCount) {
                        const hint = failReasons.length > 0 ? ` (${failReasons[0]})` : "";
                        setError(`All image regenerations failed.${hint}`);
                      }
                    } catch {
                      setError("Image regeneration failed.");
                    } finally {
                      setIsGenerating(false);
                      setIsGeneratingImages(false);
                      setGeneratingStep("");
                    }
                  }}
                  disabled={isGenerating}
                >
                  <ArrowsClockwise className="mr-1.5 h-3.5 w-3.5" />
                  Regenerate AI Images
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Crop Modal */}
        {cropImageIndex !== null && generatedImages[cropImageIndex] && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <Card className="w-full max-w-2xl mx-4">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-base">Crop Image</CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setCropImageIndex(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative w-full h-[400px] bg-muted rounded-lg overflow-hidden">
                  <Cropper
                    image={`data:${generatedImages[cropImageIndex].mimeType};base64,${generatedImages[cropImageIndex].base64}`}
                    crop={cropState}
                    zoom={cropZoom}
                    aspect={cropAspect}
                    onCropChange={setCropState}
                    onZoomChange={setCropZoom}
                    onCropComplete={onCropComplete}
                  />
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Label className="text-sm shrink-0">Zoom</Label>
                    <input
                      type="range"
                      min={1}
                      max={3}
                      step={0.1}
                      value={cropZoom}
                      onChange={(e) => setCropZoom(Number(e.target.value))}
                      className="flex-1 accent-primary"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Label className="text-sm shrink-0">Ratio</Label>
                    {([
                      { label: "Free", value: undefined },
                      { label: "1:1", value: 1 },
                      { label: "4:5", value: 4 / 5 },
                      { label: "16:9", value: 16 / 9 },
                    ] as const).map((opt) => (
                      <Button
                        key={opt.label}
                        variant={cropAspect === opt.value ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCropAspect(opt.value)}
                      >
                        {opt.label}
                      </Button>
                    ))}
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setCropImageIndex(null)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={async () => {
                      if (!croppedAreaPixels) return;
                      const img = generatedImages[cropImageIndex];
                      const cropped = await getCroppedImage(
                        `data:${img.mimeType};base64,${img.base64}`,
                        croppedAreaPixels
                      );
                      setGeneratedImages((prev) => {
                        const next = [...prev];
                        next[cropImageIndex] = {
                          ...next[cropImageIndex],
                          base64: cropped.base64,
                          mimeType: cropped.mimeType,
                        };
                        return next;
                      });
                      setCropImageIndex(null);
                      toast.success("Image cropped");
                    }}
                  >
                    <Crop className="mr-1.5 h-3.5 w-3.5" />
                    Apply Crop
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Teaser Video */}
        {generateVideo && selectedImages.length > 0 && (
          <TeaserVideoGenerator
            imageBase64={selectedImages[0].base64}
            imageMimeType={selectedImages[0].mimeType}
          />
        )}

        {/* Save to Folder */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Save to Folder</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Select
              value={folders.find((f) => f.id === selectedFolder)?.name ?? "none"}
              onValueChange={(v) => {
                if (v === null || v === "none") {
                  setSelectedFolder("");
                } else {
                  const folder = folders.find((f) => f.name === v);
                  if (folder) setSelectedFolder(folder.id);
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="No folder (unsorted)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No folder (unsorted)</SelectItem>
                {folders.map((f) => (
                  <SelectItem key={f.id} value={f.name}>
                    {f.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {showNewFolder ? (
              <div className="flex gap-2">
                <Input
                  placeholder="Folder name"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCreateFolder()}
                />
                <Button
                  onClick={handleCreateFolder}
                  disabled={creatingFolder || !newFolderName.trim()}
                  size="sm"
                >
                  {creatingFolder ? "..." : "Create"}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowNewFolder(false);
                    setNewFolderName("");
                  }}
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowNewFolder(true)}
              >
                <FolderPlus className="mr-2 h-4 w-4" />
                New Folder
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Save Button */}
        <Button
          size="lg"
          className="w-full text-base"
          onClick={handleSave}
          disabled={isSaving || saved}
        >
          {saved ? (
            <>
              <Check className="mr-2 h-5 w-5" />
              Saved! Redirecting...
            </>
          ) : (
            <>
              <FloppyDisk className="mr-2 h-5 w-5" />
              {isSaving ? "Saving..." : "Save"}
            </>
          )}
        </Button>

        <ShareDialog
          open={shareOpen}
          onOpenChange={setShareOpen}
          caption={editedCaptions[selectedVariation] ?? ""}
          hashtags={result.hashtags}
          cta={result.cta}
          imageBase64={selectedImages[0]?.base64}
          imageMimeType={selectedImages[0]?.mimeType}
        />
      </div>
    );
  }

  // Create form view
  return (
    <div className="space-y-6 pb-12">
      <div className="animate-fade-in-up stagger-1">
        <h1 className="text-2xl font-semibold tracking-tight">Create Content</h1>
        <p className="text-muted-foreground mt-1">
          Upload a video, image, or enter text to generate captions.
        </p>
      </div>

      {/* Content Type */}
      <Card className="animate-fade-in-up stagger-2">
        <CardHeader>
          <CardTitle className="text-base">Content Type</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-2">
            {CONTENT_TYPES.map((ct) => (
              <button
                key={ct.value}
                onClick={() => {
                  setContentType(ct.value);
                  setFile(null);
                  setTextContent("");
                }}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-lg border p-4 text-sm font-medium transition-all btn-press",
                  contentType === ct.value
                    ? "border-primary bg-primary/5 text-primary shadow-sm shadow-primary/10"
                    : "border-border text-muted-foreground hover:border-muted-foreground/50 hover:bg-muted/30"
                )}
              >
                <ct.icon className={cn("h-5 w-5 transition-transform", contentType === ct.value && "scale-110")} />
                {ct.label}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Upload / Text Input */}
      <Card className="animate-fade-in-up stagger-3">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">
              {contentType === "text" ? "Your Content" : "Upload File"}
            </CardTitle>
            {contentType === "text" && (
              <Button
                variant="outline"
                size="sm"
                disabled={isEnhancingContent || !textContent.trim() || enhanceCooldown > 0}
                onClick={async () => {
                  setIsEnhancingContent(true);
                  try {
                    const res = await fetch("/api/enhance-prompt", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ prompt: textContent, contentType, target: "content", captionModel }),
                    });
                    const data = await res.json();
                    if (res.ok && data.enhanced) {
                      setTextContent(data.enhanced);
                      const fbModel = data.usedModel && data.usedModel !== captionModel
                        ? CAPTION_MODELS.find((m) => m.id === data.usedModel)
                        : null;
                      toast.success(fbModel ? `Enhanced via ${fbModel.name} (fallback)` : "Content enhanced!");
                    } else if (res.status === 429 && data.retryAfter) {
                      setEnhanceCooldown(data.retryAfter);
                      toast.error(data.retryAfter > 0 ? `Rate limited. Try again in ${data.retryAfter}s.` : "Daily quota exhausted. Resets at midnight PT.");
                    } else {
                      toast.error(data.error ?? "Failed to enhance content.");
                    }
                  } catch {
                    toast.error("Failed to enhance content. Please try again.");
                  } finally {
                    setIsEnhancingContent(false);
                  }
                }}
              >
                {isEnhancingContent ? (
                  <ArrowsClockwise className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <MagicWand className="mr-1.5 h-3.5 w-3.5" />
                )}
                {isEnhancingContent ? "Enhancing..." : enhanceCooldown > 0 ? `Wait ${enhanceCooldown}s` : "Enhance"}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {contentType === "text" ? (
            <>
              <div className="relative">
                <Textarea
                  placeholder="Enter your content here..."
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                  rows={6}
                  disabled={isEnhancingContent}
                  className={cn(isEnhancingContent && "opacity-50")}
                />
                {isEnhancingContent && (
                  <div className="absolute inset-0 flex items-center justify-center rounded-md bg-background/60 backdrop-blur-[1px]">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <ArrowsClockwise className="h-4 w-4 animate-spin text-primary" />
                      Enhancing your content...
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <FileUpload
              contentType={contentType}
              file={file}
              onFileChange={setFile}
            />
          )}
        </CardContent>
      </Card>

      {/* Additional Instructions */}
      <Card className="animate-fade-in-up stagger-4">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Additional Instructions</CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={isGeneratingPrompt || !hasThemeContent || enhanceCooldown > 0}
                onClick={handleGeneratePrompt}
              >
                {isGeneratingPrompt ? (
                  <ArrowsClockwise className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Sparkle className="mr-1.5 h-3.5 w-3.5" />
                )}
                {isGeneratingPrompt ? "Generating..." : enhanceCooldown > 0 ? `Wait ${enhanceCooldown}s` : "Generate Prompt"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={isEnhancing || !instructions.trim() || enhanceCooldown > 0}
                onClick={async () => {
                  setIsEnhancing(true);
                  try {
                    const res = await fetch("/api/enhance-prompt", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ prompt: instructions, contentType, captionModel }),
                    });
                    const data = await res.json();
                    if (res.ok && data.enhanced) {
                      setInstructions(data.enhanced);
                      const fbModel = data.usedModel && data.usedModel !== captionModel
                        ? CAPTION_MODELS.find((m) => m.id === data.usedModel)
                        : null;
                      toast.success(fbModel ? `Enhanced via ${fbModel.name} (fallback)` : "Prompt enhanced!");
                    } else if (res.status === 429 && data.retryAfter) {
                      setEnhanceCooldown(data.retryAfter);
                      toast.error(data.retryAfter > 0 ? `Rate limited. Try again in ${data.retryAfter}s.` : "Daily quota exhausted. Resets at midnight PT.");
                    } else {
                      toast.error(data.error ?? "Failed to enhance prompt.");
                    }
                  } catch {
                    toast.error("Failed to enhance prompt. Please try again.");
                  } finally {
                    setIsEnhancing(false);
                  }
                }}
              >
                {isEnhancing ? (
                  <ArrowsClockwise className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <MagicWand className="mr-1.5 h-3.5 w-3.5" />
                )}
                {isEnhancing ? "Enhancing..." : enhanceCooldown > 0 ? `Wait ${enhanceCooldown}s` : "Enhance"}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Textarea
              placeholder='Tell the AI anything important, or click "Generate Prompt" to create one from your content above.'
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              rows={3}
              disabled={isEnhancing || isGeneratingPrompt}
              className={cn((isEnhancing || isGeneratingPrompt) && "opacity-50")}
            />
            {(isEnhancing || isGeneratingPrompt) && (
              <div className="absolute inset-0 flex items-center justify-center rounded-md bg-background/60 backdrop-blur-[1px]">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <ArrowsClockwise className="h-4 w-4 animate-spin text-primary" />
                  {isGeneratingPrompt ? "Generating prompt from your content..." : "Enhancing your prompt..."}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Caption Template — hidden for now
      <Card className="animate-fade-in-up stagger-5">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Caption Template</CardTitle>
            {!showSaveTemplate && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSaveTemplate(true)}
              >
                <BookmarkSimple className="mr-1.5 h-3.5 w-3.5" />
                Save Current
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <Select value={selectedTemplateName || "none"} onValueChange={(v) => {
            if (v === null || v === "none") {
              setSelectedTemplateId("");
            } else {
              applyTemplate(v);
            }
          }}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Choose a template..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              {templates.map((t) => (
                <SelectItem key={t.id} value={t.name}>
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedTemplateId && (
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                {templates.find((t) => t.id === selectedTemplateId)?.tone} · {templates.find((t) => t.id === selectedTemplateId)?.length} · {templates.find((t) => t.id === selectedTemplateId)?.language}
              </p>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-destructive hover:text-destructive"
                onClick={() => handleDeleteTemplate(selectedTemplateId)}
              >
                <Trash className="mr-1 h-3 w-3" />
                Delete
              </Button>
            </div>
          )}
          {showSaveTemplate && (
            <div className="flex items-center gap-2">
              <Input
                placeholder="Template name"
                value={newTemplateName}
                onChange={(e) => setNewTemplateName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSaveTemplate()}
              />
              <Button
                onClick={handleSaveTemplate}
                disabled={savingTemplate || !newTemplateName.trim()}
                size="sm"
              >
                {savingTemplate ? "..." : "Save"}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowSaveTemplate(false);
                  setNewTemplateName("");
                }}
              >
                Cancel
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      */}

      {/* Caption Settings */}
      <Card className="animate-fade-in-up stagger-6">
        <CardHeader>
          <CardTitle className="text-base">Caption Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label>Caption Model</Label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {CAPTION_MODELS.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setCaptionModel(m.id)}
                  className={cn(
                    "flex flex-col items-start rounded-lg border p-2.5 text-left transition-all btn-press",
                    captionModel === m.id
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-muted-foreground/50 hover:bg-muted/30"
                  )}
                >
                  <span className={cn(
                    "text-xs font-semibold",
                    captionModel === m.id ? "text-primary" : "text-foreground"
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

          <Separator />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label>Tone</Label>
              <Select value={tone} onValueChange={(v) => v !== null && setTone(v)}>
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
              <Label>Length</Label>
              <Select value={length} onValueChange={(v) => v !== null && setLength(v)}>
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
              <Label>Language</Label>
              <Select value={language} onValueChange={(v) => v !== null && setLanguage(v)}>
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
            <div className="flex items-center gap-2">
              <Checkbox
                id="hashtags"
                checked={includeHashtags}
                onCheckedChange={(v) => setIncludeHashtags(v === true)}
              />
              <Label htmlFor="hashtags" className="cursor-pointer">
                Include hashtags
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="emojis"
                checked={includeEmojis}
                onCheckedChange={(v) => setIncludeEmojis(v === true)}
              />
              <Label htmlFor="emojis" className="cursor-pointer">
                Include emojis
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="cta"
                checked={includeCta}
                onCheckedChange={(v) => setIncludeCta(v === true)}
              />
              <Label htmlFor="cta" className="cursor-pointer">
                Include call-to-action
              </Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Post Image */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Post Image</CardTitle>
            <Switch
              checked={generateImage}
              onCheckedChange={(v) => {
                setGenerateImage(v);
                if (!v) {
                  setUploadedPostImage(null);
                  setImageSource("ai");
                }
              }}
            />
          </div>
        </CardHeader>
        {generateImage && (
          <CardContent className="space-y-4">
            {/* Image source toggle */}
            <div className="space-y-2">
              <Label>Source</Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => { setImageSource("ai"); setUploadedPostImage(null); }}
                  className={cn(
                    "flex items-center justify-center gap-2 rounded-lg border p-3 text-sm font-medium transition-all btn-press",
                    imageSource === "ai"
                      ? "border-primary bg-primary/5 text-primary shadow-sm shadow-primary/10"
                      : "border-border text-muted-foreground hover:border-muted-foreground/50 hover:bg-muted/30"
                  )}
                >
                  <Sparkle className="h-4 w-4" weight={imageSource === "ai" ? "fill" : "regular"} />
                  AI Generate
                </button>
                <button
                  onClick={() => setImageSource("upload")}
                  className={cn(
                    "flex items-center justify-center gap-2 rounded-lg border p-3 text-sm font-medium transition-all btn-press",
                    imageSource === "upload"
                      ? "border-primary bg-primary/5 text-primary shadow-sm shadow-primary/10"
                      : "border-border text-muted-foreground hover:border-muted-foreground/50 hover:bg-muted/30"
                  )}
                >
                  <ImageIcon className="h-4 w-4" weight={imageSource === "upload" ? "fill" : "regular"} />
                  Upload Own
                </button>
              </div>
            </div>

            {imageSource === "upload" ? (
              <div className="space-y-3">
                {uploadedPostImage && postImagePreviewUrl ? (
                  <div className="rounded-lg border bg-muted/30 p-4">
                    <div className="flex items-start gap-4">
                      <img
                        src={postImagePreviewUrl}
                        alt="Post image preview"
                        className="h-20 w-20 rounded-md object-cover shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{uploadedPostImage.name}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {uploadedPostImage.size < 1024 * 1024
                            ? `${(uploadedPostImage.size / 1024).toFixed(1)} KB`
                            : `${(uploadedPostImage.size / (1024 * 1024)).toFixed(1)} MB`}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="shrink-0"
                        onClick={() => setUploadedPostImage(null)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <FileUpload
                    contentType="image"
                    file={uploadedPostImage}
                    onFileChange={setUploadedPostImage}
                  />
                )}
                <p className="text-xs text-muted-foreground">
                  Captions will be generated based on this image.
                </p>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label>Model</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                    {IMAGE_MODELS.map((m) => (
                      <button
                        key={m.id}
                        onClick={() => setImageModel(m.id)}
                        className={cn(
                          "flex flex-col items-start rounded-lg border p-2.5 text-left transition-all btn-press",
                          imageModel === m.id
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-muted-foreground/50 hover:bg-muted/30"
                        )}
                      >
                        <span className={cn(
                          "text-xs font-semibold",
                          imageModel === m.id ? "text-primary" : "text-foreground"
                        )}>
                          {m.name}
                        </span>
                        <span className="text-[10px] text-muted-foreground leading-tight mt-0.5">
                          {m.description}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Style</Label>
                    <Select value={imageStyle} onValueChange={(v) => v !== null && setImageStyle(v)}>
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
                    <Label>Aspect Ratio</Label>
                    <div className="grid grid-cols-4 gap-2">
                      {ASPECT_RATIOS.map((r) => (
                        <button
                          key={r}
                          onClick={() => setAspectRatio(r)}
                          className={cn(
                            "rounded-md border px-2 py-1.5 text-xs font-medium transition-colors",
                            aspectRatio === r
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

                <div className="space-y-2">
                  <Label>Number of Images</Label>
                  <div className="grid grid-cols-2 gap-2 max-w-[200px]">
                    {[1, 3].map((n) => (
                      <button
                        key={n}
                        onClick={() => setImageCount(n)}
                        className={cn(
                          "rounded-md border px-3 py-1.5 text-xs font-medium transition-colors",
                          imageCount === n
                            ? "border-primary bg-primary/5 text-primary"
                            : "border-border text-muted-foreground hover:border-muted-foreground/50"
                        )}
                      >
                        {n} {n === 1 ? "image" : "images"}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        )}
      </Card>

      {/* Teaser Video */}
      {generateImage && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Generate Teaser Video</CardTitle>
              <Switch
                checked={generateVideo}
                onCheckedChange={setGenerateVideo}
              />
            </div>
          </CardHeader>
          {generateVideo && (
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Animates the teaser image into a short Ken Burns effect video
                you can download.
              </p>
            </CardContent>
          )}
        </Card>
      )}

      {/* Error message */}
      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Generate Button */}
      <Button
        size="lg"
        className="w-full text-base shadow-sm btn-press hover:shadow-lg hover:shadow-primary/20 transition-all animate-fade-in-up stagger-7"
        disabled={!canGenerate || isGenerating}
        onClick={handleGenerate}
      >
        {isGenerating ? (
          <>
            <ArrowsClockwise className="mr-2 h-5 w-5 animate-spin" />
            {generatingStep}
          </>
        ) : (
          <>
            <Sparkle className="mr-2 h-5 w-5" weight="fill" />
            Generate Content
          </>
        )}
      </Button>
    </div>
  );
}
