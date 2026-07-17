import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertEditor(context: { supabase: any; userId: string }) {
  const { data } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (!data) {
    const { data: editor } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "editor",
    });
    if (!editor) throw new Error("Forbidden: admin/editor only");
  }
}

export const listBanners = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertEditor(context);
    const { data, error } = await context.supabase
      .from("banners")
      .select("*")
      .order("position", { ascending: true });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const upsertBanner = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: {
    id?: string;
    title?: string | null;
    subtitle?: string | null;
    cta_label?: string | null;
    link_url?: string | null;
    image_url?: string | null;
    image_mobile_url?: string | null;
    position?: number;
    is_active?: boolean;
    starts_at?: string | null;
    ends_at?: string | null;
  }) => d)
  .handler(async ({ data, context }) => {
    await assertEditor(context);
    const payload: any = {
      title: data.title ?? null,
      subtitle: data.subtitle ?? null,
      cta_label: data.cta_label ?? null,
      link_url: data.link_url ?? null,
      image_url: data.image_url ?? null,
      image_mobile_url: data.image_mobile_url ?? null,
      position: data.position ?? 0,
      is_active: data.is_active ?? true,
      starts_at: data.starts_at ?? null,
      ends_at: data.ends_at ?? null,
      updated_at: new Date().toISOString(),
    };
    if (data.id) {
      const { error } = await context.supabase.from("banners").update(payload).eq("id", data.id);
      if (error) throw new Error(error.message);
      return { id: data.id };
    }
    const { data: row, error } = await context.supabase
      .from("banners")
      .insert(payload)
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: row.id };
  });

export const deleteBanner = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => {
    await assertEditor(context);
    const { error } = await context.supabase.from("banners").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const reorderBanners = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { ids: string[] }) => d)
  .handler(async ({ data, context }) => {
    await assertEditor(context);
    for (let i = 0; i < data.ids.length; i++) {
      await context.supabase.from("banners").update({ position: i }).eq("id", data.ids[i]);
    }
    return { ok: true };
  });
