import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/auth";
import { ORDER_STATUSES } from "@/lib/constants";

const Body = z.object({
  status: z.enum(ORDER_STATUSES),
  cancel_reason: z.string().optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  const json = await req.json().catch(() => null);
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.message }, { status: 400 });
  }
  const supabase = await createClient();
  const update: Record<string, any> = { status: parsed.data.status };
  const now = new Date().toISOString();
  if (parsed.data.status === "shipped") update.shipped_at = now;
  if (parsed.data.status === "delivered") update.delivered_at = now;
  if (parsed.data.status === "cancelled") {
    update.cancelled_at = now;
    if (parsed.data.cancel_reason)
      update.cancel_reason = parsed.data.cancel_reason;
  }
  const { error } = await supabase.from("orders").update(update).eq("id", id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
