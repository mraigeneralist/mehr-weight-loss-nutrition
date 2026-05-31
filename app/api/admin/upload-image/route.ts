import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/auth";

const BUCKET = "product-images";
const MAX_BYTES = 5 * 1024 * 1024;

export async function POST(req: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file" }, { status: 400 });
  }
  if (!file.type.startsWith("image/")) {
    return NextResponse.json(
      { error: "Image files only" },
      { status: 400 },
    );
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Max 5 MB" }, { status: 400 });
  }

  // Pick extension from MIME type, fall back to jpg
  const ext =
    file.type === "image/png"
      ? "png"
      : file.type === "image/webp"
        ? "webp"
        : file.type === "image/svg+xml"
          ? "svg"
          : "jpg";
  const key = `products/${randomUUID()}.${ext}`;

  // Upload using service role so RLS is irrelevant — admin already verified above.
  const svc = createServiceClient();
  const buf = Buffer.from(await file.arrayBuffer());
  const { error } = await svc.storage.from(BUCKET).upload(key, buf, {
    contentType: file.type,
    upsert: false,
  });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Use the user-context client to compute the public URL (URL is the same).
  const supabase = await createClient();
  const {
    data: { publicUrl },
  } = supabase.storage.from(BUCKET).getPublicUrl(key);

  return NextResponse.json({ url: publicUrl, key });
}
