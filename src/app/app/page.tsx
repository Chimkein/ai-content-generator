"use client";

import Link from "next/link";
import { useEffect, useState, useMemo } from "react";
import { parseImageUrls } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  PlusCircle,
  FileText,
  Image as ImageIcon,
  VideoCamera,
  Clock,
  ArrowRight,
  ChartBar,
  CalendarBlank,
  MusicNote,
  Copy,
  Star,
} from "@phosphor-icons/react";
import { toast } from "sonner";

interface Generation {
  id: string;
  caption: string;
  original_file_type: string;
  image_url: string | null;
  settings: { tone?: string };
  created_at: string;
  is_pinned: boolean;
}

const typeIcons: Record<string, typeof FileText> = {
  text: FileText,
  image: ImageIcon,
  video: VideoCamera,
};

export default function DashboardPage() {
  const [allGenerations, setAllGenerations] = useState<Generation[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetch("/api/history")
      .then((r) => r.json())
      .then((data) => setAllGenerations(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  }, []);

  const pinned = allGenerations.filter((g) => g.is_pinned);
  const recent = allGenerations.filter((g) => !g.is_pinned).slice(0, 5);

  const handleTogglePin = async (id: string, isPinned: boolean) => {
    try {
      const res = await fetch(`/api/history/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPinned }),
      });
      if (!res.ok) throw new Error();
      setAllGenerations((prev) =>
        prev.map((g) => (g.id === id ? { ...g, is_pinned: isPinned } : g))
      );
      toast.success(isPinned ? "Pinned to dashboard" : "Unpinned");
    } catch {
      toast.error("Failed to update pin");
    }
  };

  const stats = useMemo(() => {
    const total = allGenerations.length;

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const thisWeek = allGenerations.filter(
      (g) => new Date(g.created_at) >= weekAgo
    ).length;

    const toneCounts: Record<string, number> = {};
    for (const g of allGenerations) {
      const tone = g.settings?.tone;
      if (tone) toneCounts[tone] = (toneCounts[tone] || 0) + 1;
    }
    const topTone =
      Object.entries(toneCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";

    return { total, thisWeek, topTone };
  }, [allGenerations]);

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });

  const handleCopy = async (caption: string) => {
    try {
      await navigator.clipboard.writeText(caption);
      toast.success("Copied to clipboard");
    } catch {
      toast.error("Failed to copy");
    }
  };

  return (
    <div className="space-y-10">
      <div className="animate-fade-in-up stagger-1">
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Create and manage your AI-generated content.
        </p>
      </div>

      <Link
        href="/app/create"
        className="group flex items-center gap-4 rounded-xl border border-dashed border-primary/30 bg-primary/5 p-6 transition-colors hover:border-primary/50 hover:bg-primary/10 btn-press animate-fade-in-up stagger-2"
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <PlusCircle className="h-6 w-6" weight="duotone" />
        </div>
        <div>
          <p className="font-heading font-semibold text-foreground">
            Create Content
          </p>
          <p className="text-sm text-muted-foreground">
            Generate captions and teaser images from your content
          </p>
        </div>
        <ArrowRight className="ml-auto h-5 w-5 text-primary/40 group-hover:text-primary/70 transition-colors" />
      </Link>

      {!loading && allGenerations.length > 0 && (
        <div className="grid grid-cols-3 gap-3 animate-fade-in-up stagger-3">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2">
                <ChartBar className="h-4 w-4 text-primary" weight="duotone" />
              </div>
              <div>
                <p className="text-2xl font-heading font-semibold tracking-tight">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="rounded-lg bg-warm/10 p-2">
                <CalendarBlank className="h-4 w-4 text-warm" weight="duotone" />
              </div>
              <div>
                <p className="text-2xl font-heading font-semibold tracking-tight">{stats.thisWeek}</p>
                <p className="text-xs text-muted-foreground">This week</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="rounded-lg bg-muted p-2">
                <MusicNote className="h-4 w-4 text-muted-foreground" weight="duotone" />
              </div>
              <div>
                <p className="text-2xl font-heading font-semibold tracking-tight truncate max-w-[80px]">{stats.topTone}</p>
                <p className="text-xs text-muted-foreground">Top tone</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {!loading && pinned.length > 0 && (
        <div className="animate-fade-in-up stagger-4">
          <div className="flex items-center gap-2 mb-5">
            <Star className="h-4 w-4 text-warm" weight="fill" />
            <h2 className="font-heading text-lg font-semibold">Pinned</h2>
          </div>
          <div className="flex flex-col gap-3">
            {pinned.map((gen, i) => {
              const Icon = typeIcons[gen.original_file_type] ?? FileText;
              const thumbUrl = parseImageUrls(gen.image_url)[0];
              return (
                <Card key={gen.id} className={`group border-warm/20 hover:border-warm/40 transition-colors animate-fade-in-up stagger-${i + 5}`}>
                  <CardContent className="flex items-center gap-4 p-4">
                    {thumbUrl ? (
                      <img
                        src={thumbUrl}
                        alt=""
                        className="h-12 w-12 rounded-lg object-cover shrink-0"
                      />
                    ) : (
                      <div className="rounded-lg p-2.5 bg-primary/10 text-primary shrink-0">
                        <Icon className="h-4 w-4" weight="duotone" />
                      </div>
                    )}
                    <Link href="/app/history" className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {gen.caption.slice(0, 80)}
                        {gen.caption.length > 80 ? "..." : ""}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Generated {formatDate(gen.created_at)}
                      </p>
                    </Link>
                    {gen.settings?.tone && (
                      <Badge variant="secondary" className="text-xs shrink-0 hidden sm:inline-flex">
                        {gen.settings.tone}
                      </Badge>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.preventDefault();
                        handleCopy(gen.caption);
                      }}
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0 text-warm opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.preventDefault();
                        handleTogglePin(gen.id, false);
                      }}
                    >
                      <Star className="h-3.5 w-3.5" weight="fill" />
                    </Button>
                    <Link href="/app/history" className="shrink-0">
                      <ArrowRight className="h-4 w-4 text-muted-foreground/0 group-hover:text-muted-foreground transition-all" />
                    </Link>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      <div className="animate-fade-in-up stagger-4">
        <div className="flex items-center gap-2 mb-5">
          <Clock className="h-4 w-4 text-muted-foreground" weight="duotone" />
          <h2 className="font-heading text-lg font-semibold">Recent content</h2>
        </div>
        {loading ? (
          <div className="flex flex-col gap-3">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className={`h-[76px] rounded-xl bg-muted/50 shimmer-bg stagger-${i + 5}`}
                style={{ animationDelay: `${i * 150}ms` }}
              />
            ))}
          </div>
        ) : recent.length === 0 && pinned.length === 0 ? (
          <Card className="border-dashed animate-scale-in">
            <CardContent className="flex flex-col items-center justify-center py-14 text-muted-foreground gap-3">
              <div className="rounded-full bg-muted p-4">
                <FileText className="h-7 w-7 text-muted-foreground/60" weight="duotone" />
              </div>
              <div className="text-center">
                <p className="font-heading font-medium text-foreground">No content yet</p>
                <p className="text-sm mt-1">Create your first one to get started</p>
              </div>
            </CardContent>
          </Card>
        ) : recent.length > 0 ? (
          <div className="flex flex-col gap-3">
            {recent.map((gen, i) => {
              const Icon = typeIcons[gen.original_file_type] ?? FileText;
              const thumbUrl = parseImageUrls(gen.image_url)[0];
              return (
                <Card key={gen.id} className={`group transition-colors hover:border-primary/20 animate-fade-in-up stagger-${i + 5}`}>
                  <CardContent className="flex items-center gap-4 p-4">
                    {thumbUrl ? (
                      <img
                        src={thumbUrl}
                        alt=""
                        className="h-12 w-12 rounded-lg object-cover shrink-0"
                      />
                    ) : (
                      <div className="rounded-lg p-2.5 bg-primary/10 text-primary shrink-0">
                        <Icon className="h-4 w-4" weight="duotone" />
                      </div>
                    )}
                    <Link href="/app/history" className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {gen.caption.slice(0, 80)}
                        {gen.caption.length > 80 ? "..." : ""}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Generated {formatDate(gen.created_at)}
                      </p>
                    </Link>
                    {gen.settings?.tone && (
                      <Badge variant="secondary" className="text-xs shrink-0 hidden sm:inline-flex">
                        {gen.settings.tone}
                      </Badge>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.preventDefault();
                        handleCopy(gen.caption);
                      }}
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.preventDefault();
                        handleTogglePin(gen.id, true);
                      }}
                    >
                      <Star className="h-3.5 w-3.5" />
                    </Button>
                    <Link href="/app/history" className="shrink-0">
                      <ArrowRight className="h-4 w-4 text-muted-foreground/0 group-hover:text-muted-foreground transition-all" />
                    </Link>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : null}
      </div>
    </div>
  );
}
