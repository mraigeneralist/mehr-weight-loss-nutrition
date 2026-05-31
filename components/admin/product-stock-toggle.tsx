"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";

export function ProductStockToggle({
  id,
  active,
}: {
  id: string;
  active: boolean;
}) {
  const [value, setValue] = useState(active);
  const [pending, start] = useTransition();
  const router = useRouter();

  function onToggle(next: boolean) {
    const previous = value;
    setValue(next);
    start(async () => {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ is_active: next }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        toast.error(j.error || "Could not update");
        setValue(previous);
        return;
      }
      toast.success(next ? "Now active" : "Hidden from store");
      router.refresh();
    });
  }

  return (
    <label className="inline-flex items-center gap-2">
      <Switch checked={value} onCheckedChange={onToggle} disabled={pending} />
      <span className="text-xs text-muted-foreground">
        {value ? "Active" : "Hidden"}
      </span>
    </label>
  );
}
