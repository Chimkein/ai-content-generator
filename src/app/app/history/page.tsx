"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Trash,
  Copy,
  CaretDown,
  CaretUp,
  FileText,
  Image as ImageIcon,
  VideoCamera,
  Folder,
  FolderPlus,
  FolderOpen,
  X,
  PencilSimple,
  ShareNetwork,
  Star,
} from "@phosphor-icons/react";
import { cn, parseImageUrls } from "@/lib/utils";
import { ShareDialog } from "@/components/share-dialog";
import { toast } from "sonner";

interface Generation {
  id: string;
  caption: string;
  hashtags: string[];
  cta: string;
  image_url: string | null;
  original_file_type: string;
  folder_id: string | null;
  settings: {
    tone?: string;
    language?: string;
    length?: string;
  };
  created_at: string;
  is_pinned: boolean;
}

interface FolderItem {
  id: string;
  name: string;
  generations: { count: number }[];
}

const typeIcons: Record<string, typeof FileText> = {
  text: FileText,
  image: ImageIcon,
  video: VideoCamera,
};

const typeColors: Record<string, string> = {
  text: "bg-blue-500/10 text-blue-500",
  image: "bg-emerald-500/10 text-emerald-500",
  video: "bg-purple-500/10 text-purple-500",
};

export default function HistoryPage() {
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFolder, setActiveFolder] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [newFolderName, setNewFolderName] = useState("");
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editFolderName, setEditFolderName] = useState("");
  const [shareGenId, setShareGenId] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/history").then((r) => r.json()),
      fetch("/api/folders").then((r) => r.json()),
    ]).then(([gens, flds]) => {
      setGenerations(Array.isArray(gens) ? gens : []);
      setFolders(Array.isArray(flds) ? flds : []);
      setLoading(false);
    });
  }, []);

  const filteredGenerations =
    activeFolder === null
      ? generations
      : activeFolder === "unsorted"
        ? generations.filter((g) => !g.folder_id)
        : generations.filter((g) => g.folder_id === activeFolder);

  const unsortedCount = generations.filter((g) => !g.folder_id).length;

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const response = await fetch(`/api/history/${id}`, { method: "DELETE" });
      if (response.ok) {
        setGenerations((prev) => prev.filter((g) => g.id !== id));
        toast.success("Deleted");
      } else {
        toast.error("Failed to delete");
      }
    } finally {
      setDeletingId(null);
    }
  };

  const handleTogglePin = async (id: string, isPinned: boolean) => {
    try {
      const res = await fetch(`/api/history/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPinned }),
      });
      if (!res.ok) throw new Error();
      setGenerations((prev) =>
        prev.map((g) => (g.id === id ? { ...g, is_pinned: isPinned } : g))
      );
      toast.success(isPinned ? "Pinned to dashboard" : "Unpinned");
    } catch {
      toast.error("Failed to update pin");
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

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    const response = await fetch("/api/folders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newFolderName.trim() }),
    });
    if (response.ok) {
      const folder = await response.json();
      setFolders((prev) =>
        [...prev, { ...folder, generations: [{ count: 0 }] }].sort((a, b) =>
          a.name.localeCompare(b.name)
        )
      );
      setNewFolderName("");
      setShowNewFolder(false);
      toast.success("Folder created");
    }
  };

  const handleRenameFolder = async (id: string) => {
    if (!editFolderName.trim()) return;
    const response = await fetch(`/api/folders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editFolderName.trim() }),
    });
    if (response.ok) {
      setFolders((prev) =>
        prev
          .map((f) => (f.id === id ? { ...f, name: editFolderName.trim() } : f))
          .sort((a, b) => a.name.localeCompare(b.name))
      );
      setEditingFolderId(null);
      toast.success("Folder renamed");
    }
  };

  const handleDeleteFolder = async (id: string) => {
    const response = await fetch(`/api/folders/${id}`, { method: "DELETE" });
    if (response.ok) {
      setFolders((prev) => prev.filter((f) => f.id !== id));
      setGenerations((prev) =>
        prev.map((g) => (g.folder_id === id ? { ...g, folder_id: null } : g))
      );
      if (activeFolder === id) setActiveFolder(null);
      toast.success("Folder deleted");
    }
  };

  const handleMove = async (genId: string, folderId: string) => {
    const response = await fetch(`/api/history/${genId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        folderId: folderId === "none" ? null : folderId,
      }),
    });
    if (response.ok) {
      setGenerations((prev) =>
        prev.map((g) =>
          g.id === genId
            ? { ...g, folder_id: folderId === "none" ? null : folderId }
            : g
        )
      );
    }
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });

  const activeFolderName =
    activeFolder === null
      ? "All"
      : activeFolder === "unsorted"
        ? "Unsorted"
        : folders.find((f) => f.id === activeFolder)?.name ?? "Folder";

  return (
    <div className="space-y-8">
      <div className="animate-fade-in-up stagger-1">
        <h1 className="text-2xl font-bold tracking-tight">History</h1>
        <p className="text-muted-foreground mt-1">
          Your previously generated content.
        </p>
      </div>

      {/* Folders Section */}
      <div className="animate-fade-in-up stagger-2">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FolderOpen className="h-4 w-4 text-muted-foreground" weight="duotone" />
            <h2 className="text-lg font-semibold">Folders</h2>
          </div>
          {!showNewFolder && (
            <Button
              variant="outline"
              size="sm"
              className="btn-press"
              onClick={() => setShowNewFolder(true)}
            >
              <FolderPlus className="mr-1.5 h-3.5 w-3.5" />
              New Folder
            </Button>
          )}
        </div>

        {showNewFolder && (
          <div className="flex items-center gap-2 mb-4 animate-fade-in-up">
            <Input
              placeholder="Folder name"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreateFolder()}
              className="max-w-xs"
              autoFocus
            />
            <Button size="sm" onClick={handleCreateFolder} disabled={!newFolderName.trim()}>
              Create
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
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {/* All items card */}
          <button
            onClick={() => setActiveFolder(null)}
            className={cn(
              "group flex flex-col items-center justify-center gap-3 rounded-xl border p-6 text-center transition-all card-hover btn-press",
              activeFolder === null
                ? "border-primary bg-primary/5 shadow-sm shadow-primary/10"
                : "border-border hover:border-muted-foreground/30 hover:bg-muted/30"
            )}
          >
            <div className={cn(
              "flex h-12 w-12 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-110",
              activeFolder === null ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
            )}>
              <FolderOpen className="h-6 w-6" weight={activeFolder === null ? "fill" : "duotone"} />
            </div>
            <div>
              <p className={cn(
                "text-sm font-semibold",
                activeFolder === null ? "text-primary" : "text-foreground"
              )}>All</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {generations.length} {generations.length === 1 ? "item" : "items"}
              </p>
            </div>
          </button>

          {/* Folder cards */}
          {folders.map((folder, i) => {
            const count = generations.filter((g) => g.folder_id === folder.id).length;
            const isActive = activeFolder === folder.id;
            const isEditing = editingFolderId === folder.id;

            return (
              <div key={folder.id} className={`group relative animate-fade-in-up stagger-${Math.min(i + 3, 8)}`}>
                {isEditing ? (
                  <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-primary p-6">
                    <Input
                      value={editFolderName}
                      onChange={(e) => setEditFolderName(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleRenameFolder(folder.id)}
                      className="text-center text-sm"
                      autoFocus
                    />
                    <div className="flex gap-1">
                      <Button size="sm" variant="default" onClick={() => handleRenameFolder(folder.id)}>
                        Save
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditingFolderId(null)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setActiveFolder(folder.id)}
                    className={cn(
                      "flex w-full flex-col items-center justify-center gap-3 rounded-xl border p-6 text-center transition-all card-hover btn-press",
                      isActive
                        ? "border-primary bg-primary/5 shadow-sm shadow-primary/10"
                        : "border-border hover:border-muted-foreground/30 hover:bg-muted/30"
                    )}
                  >
                    <div className={cn(
                      "flex h-12 w-12 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-110",
                      isActive ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
                    )}>
                      <Folder className="h-6 w-6" weight={isActive ? "fill" : "duotone"} />
                    </div>
                    <div>
                      <p className={cn(
                        "text-sm font-semibold",
                        isActive ? "text-primary" : "text-foreground"
                      )}>{folder.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {count} {count === 1 ? "item" : "items"}
                      </p>
                    </div>
                  </button>
                )}

                {/* Folder actions overlay */}
                {!isEditing && (
                  <div className="absolute top-2 right-2 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 bg-background/80 backdrop-blur-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingFolderId(folder.id);
                        setEditFolderName(folder.name);
                      }}
                    >
                      <PencilSimple className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive bg-background/80 backdrop-blur-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteFolder(folder.id);
                      }}
                    >
                      <Trash className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
            );
          })}

          {/* Unsorted card */}
          {unsortedCount > 0 && (
            <button
              onClick={() => setActiveFolder("unsorted")}
              className={cn(
                "group flex flex-col items-center justify-center gap-3 rounded-xl border p-6 text-center transition-all card-hover btn-press border-dashed",
                activeFolder === "unsorted"
                  ? "border-primary bg-primary/5 shadow-sm shadow-primary/10"
                  : "border-border hover:border-muted-foreground/30 hover:bg-muted/30"
              )}
            >
              <div className={cn(
                "flex h-12 w-12 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-110",
                activeFolder === "unsorted" ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
              )}>
                <FileText className="h-6 w-6" weight={activeFolder === "unsorted" ? "fill" : "duotone"} />
              </div>
              <div>
                <p className={cn(
                  "text-sm font-semibold",
                  activeFolder === "unsorted" ? "text-primary" : "text-foreground"
                )}>Unsorted</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {unsortedCount} {unsortedCount === 1 ? "item" : "items"}
                </p>
              </div>
            </button>
          )}
        </div>
      </div>

      {/* Content list */}
      <div className="animate-fade-in-up stagger-4">
        <div className="flex items-center gap-2 mb-5">
          <FileText className="h-4 w-4 text-muted-foreground" weight="duotone" />
          <h2 className="text-lg font-semibold">
            {activeFolderName} content
          </h2>
          <Badge variant="secondary" className="text-xs">
            {filteredGenerations.length}
          </Badge>
        </div>

        {loading ? (
          <div className="flex flex-col gap-4">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="h-[80px] rounded-xl bg-muted/50 shimmer-bg"
                style={{ animationDelay: `${i * 150}ms` }}
              />
            ))}
          </div>
        ) : filteredGenerations.length === 0 ? (
          <Card className="border-dashed animate-scale-in">
            <CardContent className="flex flex-col items-center justify-center py-14 text-muted-foreground gap-3">
              <div className="rounded-full bg-muted p-4">
                <FileText className="h-7 w-7 text-muted-foreground/60" weight="duotone" />
              </div>
              <div className="text-center">
                <p className="font-medium text-foreground">
                  {activeFolder ? "No content in this folder" : "No history yet"}
                </p>
                <p className="text-sm mt-1">
                  {activeFolder
                    ? "Move content here or generate some new content"
                    : "Generate some content first!"}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="flex flex-col gap-4">
            {filteredGenerations.map((gen, i) => {
              const isExpanded = expandedId === gen.id;
              const Icon = typeIcons[gen.original_file_type] ?? FileText;
              const iconColor = typeColors[gen.original_file_type] ?? "bg-primary/10 text-primary";
              const folder = folders.find((f) => f.id === gen.folder_id);
              const imageUrls = parseImageUrls(gen.image_url);

              return (
                <Card key={gen.id} className={`card-hover animate-fade-in-up stagger-${Math.min(i + 5, 8)}`}>
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      {imageUrls.length > 0 ? (
                        <img
                          src={imageUrls[0]}
                          alt=""
                          className="mt-0.5 h-10 w-10 rounded-lg object-cover shrink-0"
                        />
                      ) : (
                        <div className={`mt-0.5 rounded-lg p-2.5 ${iconColor} transition-transform duration-200 shrink-0`}>
                          <Icon className="h-4 w-4" weight="duotone" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium line-clamp-2">
                          {gen.caption.slice(0, 100)}
                          {gen.caption.length > 100 ? "..." : ""}
                        </p>
                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                          <span className="text-xs text-muted-foreground">
                            {formatDate(gen.created_at)}
                          </span>
                          {folder && (
                            <Badge variant="outline" className="text-xs gap-1">
                              <Folder className="h-2.5 w-2.5" />
                              {folder.name}
                            </Badge>
                          )}
                          {gen.settings?.tone && (
                            <Badge variant="secondary" className="text-xs">
                              {gen.settings.tone}
                            </Badge>
                          )}
                          {gen.settings?.language && (
                            <Badge variant="secondary" className="text-xs">
                              {gen.settings.language}
                            </Badge>
                          )}
                        </div>
                      </div>
                      {gen.is_pinned && (
                        <Star className="h-3.5 w-3.5 text-amber-500 shrink-0" weight="fill" />
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="btn-press"
                        onClick={() =>
                          setExpandedId(isExpanded ? null : gen.id)
                        }
                      >
                        {isExpanded ? (
                          <CaretUp className="h-4 w-4" />
                        ) : (
                          <CaretDown className="h-4 w-4" />
                        )}
                      </Button>
                    </div>

                    {isExpanded && (
                      <div className="mt-4 space-y-4 border-t pt-4 animate-fade-in">
                        <div>
                          <p className="text-sm font-medium mb-2">Caption</p>
                          <p className="text-sm whitespace-pre-wrap rounded-md bg-muted p-3">
                            {gen.caption}
                          </p>
                        </div>

                        {imageUrls.length > 0 && (
                          <div>
                            <p className="text-sm font-medium mb-2">
                              Teaser {imageUrls.length === 1 ? "Image" : "Images"}
                            </p>
                            <div className={cn(
                              "gap-2",
                              imageUrls.length > 1 ? "grid grid-cols-2 sm:grid-cols-3" : ""
                            )}>
                              {imageUrls.map((url, idx) => (
                                <img
                                  key={idx}
                                  src={url}
                                  alt={`Teaser ${idx + 1}`}
                                  className="max-h-64 rounded-md object-contain"
                                />
                              ))}
                            </div>
                          </div>
                        )}

                        {gen.hashtags?.length > 0 && (
                          <div>
                            <p className="text-sm font-medium mb-2">Hashtags</p>
                            <div className="flex flex-wrap gap-1.5">
                              {gen.hashtags.map((tag) => (
                                <Badge
                                  key={tag}
                                  variant="secondary"
                                  className="text-xs"
                                >
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {gen.cta && (
                          <div>
                            <p className="text-sm font-medium mb-2">
                              Call to Action
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {gen.cta}
                            </p>
                          </div>
                        )}

                        <div className="flex gap-2 flex-wrap">
                          <Button
                            variant="outline"
                            size="sm"
                            className="btn-press"
                            onClick={() => handleCopy(gen.caption)}
                          >
                            <Copy className="mr-1.5 h-3.5 w-3.5" />
                            Copy Caption
                          </Button>
                          {gen.hashtags?.length > 0 && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="btn-press"
                              onClick={() => handleCopy(gen.hashtags.join(" "))}
                            >
                              <Copy className="mr-1.5 h-3.5 w-3.5" />
                              Copy Tags
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            className={cn("btn-press", gen.is_pinned && "text-amber-500 hover:text-amber-600")}
                            onClick={() => handleTogglePin(gen.id, !gen.is_pinned)}
                          >
                            <Star className="mr-1.5 h-3.5 w-3.5" weight={gen.is_pinned ? "fill" : "regular"} />
                            {gen.is_pinned ? "Unpin" : "Pin"}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-destructive hover:text-destructive btn-press"
                            onClick={() => handleDelete(gen.id)}
                            disabled={deletingId === gen.id}
                          >
                            <Trash className="mr-1.5 h-3.5 w-3.5" />
                            {deletingId === gen.id ? "Deleting..." : "Delete"}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="btn-press"
                            onClick={() => setShareGenId(gen.id)}
                          >
                            <ShareNetwork className="mr-1.5 h-3.5 w-3.5" />
                            Share
                          </Button>
                        </div>

                        {/* Move to folder */}
                        <div className="flex items-center gap-2">
                          <FolderOpen className="h-4 w-4 text-muted-foreground shrink-0" />
                          <span className="text-sm text-muted-foreground shrink-0">
                            Move to:
                          </span>
                          <Select
                            value={folders.find((f) => f.id === gen.folder_id)?.name ?? "none"}
                            onValueChange={(value) => {
                              if (value === null || value === "none") {
                                handleMove(gen.id, "none");
                              } else {
                                const folder = folders.find((f) => f.name === value);
                                if (folder) handleMove(gen.id, folder.id);
                              }
                            }}
                          >
                            <SelectTrigger className="h-8 text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">
                                No folder (unsorted)
                              </SelectItem>
                              {folders.map((f) => (
                                <SelectItem key={f.id} value={f.name}>
                                  {f.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {(() => {
        const shareGen = generations.find((g) => g.id === shareGenId);
        if (!shareGen) return null;
        const shareUrls = parseImageUrls(shareGen.image_url);
        return (
          <ShareDialog
            open={!!shareGenId}
            onOpenChange={(open) => { if (!open) setShareGenId(null); }}
            caption={shareGen.caption}
            hashtags={shareGen.hashtags}
            cta={shareGen.cta}
            imageUrl={shareUrls[0] ?? null}
          />
        );
      })()}
    </div>
  );
}
