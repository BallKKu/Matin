import { createClient } from "@/utils/supabase/server";

const BUCKET = "saved-designs";
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

async function authenticatedClient() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return { response: Response.json({ error: "กรุณาเข้าสู่ระบบก่อนบันทึกผลงาน" }, { status: 401 }) };
  return { supabase, user };
}

export async function GET() {
  const auth = await authenticatedClient();
  if ("response" in auth) return auth.response;
  const { data, error } = await auth.supabase.from("saved_designs").select("id, image_path, prompt, colors, created_at").eq("user_id", auth.user.id).order("created_at", { ascending: false });
  if (error) return Response.json({ error: "โหลดผลงานไม่สำเร็จ ตรวจสอบการตั้งค่าฐานข้อมูล" }, { status: 500 });

  const designs = await Promise.all((data ?? []).map(async (design) => {
    const { data: signed, error: signedError } = await auth.supabase.storage.from(BUCKET).createSignedUrl(design.image_path, 60 * 60);
    return { id: design.id, image: signedError ? "" : signed.signedUrl, prompt: design.prompt, colors: design.colors, createdAt: design.created_at };
  }));
  return Response.json({ designs });
}

export async function POST(request: Request) {
  const auth = await authenticatedClient();
  if ("response" in auth) return auth.response;
  const body = await request.json().catch(() => null) as { image?: unknown; prompt?: unknown; colors?: unknown } | null;
  if (!body || typeof body.image !== "string" || typeof body.prompt !== "string" || !Array.isArray(body.colors) || !body.colors.every((color) => typeof color === "string")) {
    return Response.json({ error: "ข้อมูลลายไม่ครบถ้วน" }, { status: 400 });
  }
  const match = body.image.match(/^data:image\/(jpeg|png);base64,([A-Za-z0-9+/=]+)$/);
  if (!match) return Response.json({ error: "รูปภาพต้องเป็น PNG หรือ JPEG" }, { status: 400 });
  const image = Buffer.from(match[2], "base64");
  if (!image.length || image.length > MAX_IMAGE_BYTES) return Response.json({ error: "รูปภาพมีขนาดเกิน 10 MB" }, { status: 413 });

  const id = crypto.randomUUID();
  const imagePath = `${auth.user.id}/${id}.${match[1]}`;
  const { error: uploadError } = await auth.supabase.storage.from(BUCKET).upload(imagePath, image, { contentType: `image/${match[1]}`, upsert: false });
  if (uploadError) return Response.json({ error: "อัปโหลดรูปไม่สำเร็จ ตรวจสอบ Storage bucket" }, { status: 500 });
  const { error: insertError } = await auth.supabase.from("saved_designs").insert({ id, user_id: auth.user.id, image_path: imagePath, prompt: body.prompt.slice(0, 5000), colors: body.colors.slice(0, 12) });
  if (insertError) {
    await auth.supabase.storage.from(BUCKET).remove([imagePath]);
    return Response.json({ error: "บันทึกข้อมูลไม่สำเร็จ ตรวจสอบตาราง saved_designs" }, { status: 500 });
  }
  return Response.json({ id }, { status: 201 });
}

export async function DELETE(request: Request) {
  const auth = await authenticatedClient();
  if ("response" in auth) return auth.response;
  const { id } = await request.json().catch(() => ({ id: "" })) as { id?: string };
  if (!id) return Response.json({ error: "ไม่พบรหัสลาย" }, { status: 400 });
  const { data: design, error } = await auth.supabase.from("saved_designs").select("image_path").eq("id", id).eq("user_id", auth.user.id).maybeSingle();
  if (error || !design) return Response.json({ error: "ไม่พบลายที่ต้องการลบ" }, { status: 404 });
  const { error: deleteError } = await auth.supabase.from("saved_designs").delete().eq("id", id).eq("user_id", auth.user.id);
  if (deleteError) return Response.json({ error: "ลบข้อมูลไม่สำเร็จ" }, { status: 500 });
  const { error: storageError } = await auth.supabase.storage.from(BUCKET).remove([design.image_path]);
  if (storageError) console.error("Could not remove saved design image", storageError);
  return Response.json({ ok: true });
}
