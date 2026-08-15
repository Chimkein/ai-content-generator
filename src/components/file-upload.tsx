"use client";

import { useCallback, useRef, useState, useMemo, useEffect } from "react";
import { UploadSimple, X, FileVideo, FileImage, File } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const VIDEO_TYPES = ["video/mp4", "video/quicktime", "video/webm"];
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

const ACCEPT_MAP = {
  video: VIDEO_TYPES,
  image: IMAGE_TYPES,
};

const ACCEPT_STRING_MAP = {
  video: ".mp4,.mov,.webm",
  image: ".jpg,.jpeg,.png,.webp",
};

const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB

interface FileUploadProps {
  contentType: "video" | "image";
  file: File | null;
  onFileChange: (file: File | null) => void;
}

export function FileUpload({ contentType, file, onFileChange }: FileUploadProps) {
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateFile = useCallback(
    (f: File): string | null => {
      const allowedTypes = ACCEPT_MAP[contentType];
      if (!allowedTypes.includes(f.type)) {
        return `Invalid file type. Please upload a ${contentType === "video" ? "MP4, MOV, or WEBM" : "JPG, PNG, or WEBP"} file.`;
      }
      if (f.size > MAX_FILE_SIZE) {
        return "File is too large. Maximum size is 500MB.";
      }
      return null;
    },
    [contentType]
  );

  const handleFile = useCallback(
    (f: File) => {
      const err = validateFile(f);
      if (err) {
        setError(err);
        return;
      }
      setError(null);
      onFileChange(f);
    },
    [validateFile, onFileChange]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const f = e.dataTransfer.files[0];
      if (f) handleFile(f);
    },
    [handleFile]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      if (f) handleFile(f);
      if (inputRef.current) inputRef.current.value = "";
    },
    [handleFile]
  );

  const removeFile = useCallback(() => {
    onFileChange(null);
    setError(null);
  }, [onFileChange]);

  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const previewUrl = useMemo(
    () => (file ? URL.createObjectURL(file) : null),
    [file]
  );
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  if (file && previewUrl) {
    const isVideo = VIDEO_TYPES.includes(file.type);
    const Icon = isVideo ? FileVideo : FileImage;

    return (
      <div className="rounded-lg border bg-muted/30 p-4">
        <div className="flex items-start gap-4">
          <div className="shrink-0">
            {isVideo ? (
              <video
                src={previewUrl}
                className="h-20 w-20 rounded-md object-cover"
                muted
              />
            ) : (
              <img
                src={previewUrl}
                alt="Preview"
                className="h-20 w-20 rounded-md object-cover"
              />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
              <p className="text-sm font-medium truncate">{file.name}</p>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {formatSize(file.size)}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0"
            onClick={removeFile}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-8 cursor-pointer transition-colors",
          dragOver
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-muted-foreground/50"
        )}
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
          <UploadSimple className="h-6 w-6 text-primary" weight="duotone" />
        </div>
        <div className="text-center">
          <p className="text-sm font-medium">Drag & drop your file</p>
          <p className="text-xs text-muted-foreground mt-1">
            or click to browse
          </p>
        </div>
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept={ACCEPT_STRING_MAP[contentType]}
          onChange={handleInputChange}
        />
      </div>
      {error && <p className="text-sm text-destructive mt-2">{error}</p>}
    </div>
  );
}
