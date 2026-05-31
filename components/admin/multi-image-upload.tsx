"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { ImagePlus, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Props = {
  value: string[];
  onChange: (urls: string[]) => void;
  max?: number;
};

export function MultiImageUpload({ value, onChange, max = 6 }: Props) {
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function uploadOne(file: File): Promise<string | null> {
    if (!file.type.startsWith("image/")) {
      toast.error(`${file.name}: not an image`);
      return null;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error(`${file.name}: max 5 MB`);
      return null;
    }
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/admin/upload-image", {
      method: "POST",
      body: fd,
    });
    const json = await res.json();
    if (!res.ok) {
      toast.error(`${file.name}: ${json.error || "upload failed"}`);
      return null;
    }
    return json.url as string;
  }

  async function handleFiles(files: FileList | File[]) {
    const remaining = max - value.length;
    if (remaining <= 0) {
      toast.error(`Up to ${max} images`);
      return;
    }
    const list = Array.from(files).slice(0, remaining);
    setUploading(true);
    try {
      const uploaded: string[] = [];
      for (const f of list) {
        const url = await uploadOne(f);
        if (url) uploaded.push(url);
      }
      if (uploaded.length > 0) {
        onChange([...value, ...uploaded]);
        toast.success(
          uploaded.length === 1
            ? "Image added"
            : `${uploaded.length} images added`,
        );
      }
    } finally {
      setUploading(false);
    }
  }

  function remove(idx: number) {
    onChange(value.filter((_, i) => i !== idx));
  }

  const slotsLeft = max - value.length;

  return (
    <div>
      <div className="grid grid-cols-3 gap-2">
        {value.map((url, i) => (
          <div
            key={`${url}-${i}`}
            className="group relative aspect-square overflow-hidden rounded-lg border border-border bg-sand"
          >
            <Image
              src={url}
              alt=""
              width={300}
              height={300}
              className="h-full w-full object-cover"
            />
            <button
              type="button"
              onClick={() => remove(i)}
              aria-label="Remove image"
              className="absolute top-1.5 right-1.5 grid h-6 w-6 place-items-center rounded-full bg-ink/75 text-cream opacity-0 backdrop-blur transition-opacity group-hover:opacity-100"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}

        {slotsLeft > 0 && (
          <label
            htmlFor="multi-image-upload"
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              if (e.dataTransfer.files?.length) {
                handleFiles(e.dataTransfer.files);
              }
            }}
            className={cn(
              "flex aspect-square cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed bg-sand/40 text-center text-xs text-muted-foreground transition-colors",
              dragging
                ? "border-sage-deep bg-sand/70"
                : "border-border hover:border-sage",
            )}
          >
            {uploading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <ImagePlus className="mb-1 h-5 w-5" />
                <span className="font-medium text-foreground">Add</span>
              </>
            )}
          </label>
        )}
      </div>

      <input
        ref={inputRef}
        id="multi-image-upload"
        type="file"
        accept="image/*"
        multiple
        className="sr-only"
        onChange={(e) => {
          if (e.target.files?.length) {
            handleFiles(e.target.files);
            // reset so picking the same file again still triggers change
            e.target.value = "";
          }
        }}
      />
      <p className="mt-2 text-xs text-muted-foreground">
        {value.length} of {max} additional images. Drag-drop or click. Max 5
        MB each.
      </p>
    </div>
  );
}
