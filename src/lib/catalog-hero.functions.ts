import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createClient } from "@supabase/supabase-js";

function makePublicClient() {
  const url = process.env.SUPABASE_URL!;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY!;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (
          (key.startsWith("sb_publishable_") || key.startsWith("sb_secret_")) &&
          h.get("Authorization") === `Bearer ${key}`
        ) {
          h.delete("Authorization");
        }
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

async function assertCanEdit(context: { supabase: any; userId: string }) {
  const [{ data: isAdmin }, { data: isEditor }] = await Promise.all([
    context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" }),
    context.supabase.rpc("has_role", { _user_id: context.userId, _role: "editor" }),
  ]);
  if (!isAdmin && !isEditor) throw new Error("Forbidden: admin or editor only");
}

export type CatalogHeroSlide = {
  id: string;
  position: number;
  is_active: boolean;
  brand_logo_url: string | null;
  eyebrow: string | null;
  title: string;
  highlight_prefix: string | null;
  highlight_value: string | null;
  highlight_suffix: string | null;
  button_text: string | null;
  button_link: string | null;
  disclaimer: string | null;
  image_desktop_url: string | null;
  image_mobile_url: string | null;
  background_color: string | null;
  text_color: string | null;
  button_bg_color: string | null;
  button_text_color: string | null;
};

export const getPublicCatalogHero = createServerFn({ method: "GET" }).handler(async () => {
  const sb = makePublicClient();
  const { data, error } = await sb
    .from("catalog_hero_slides")
    .select("*")
    .eq("is_active", true)
    .order("position", { ascending: true });
  if (error) {
    console.error("catalog_hero_slides public read", error.message);
    return [] as CatalogHeroSlide[];
  }
  return (data ?? []) as CatalogHeroSlide[];
});

export const listCatalogHeroSlides = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertCanEdit(context);
    const { data, error } = await context.supabase
      .from("catalog_hero_slides")
      .select("*")
      .order("position", { ascending: true });
    if (error) throw new Error(error.message);
    return (data ?? []) as CatalogHeroSlide[];
  });

export const createCatalogHeroSlide = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: Partial<CatalogHeroSlide>) => d)
  .handler(async ({ data, context }) => {
    await assertCanEdit(context);
    const { data: maxRow } = await context.supabase
      .from("catalog_hero_slides")
      .select("position")
      .order("position", { ascending: false })
      .limit(1)
      .maybeSingle();
    const nextPos = (maxRow?.position ?? 0) + 1;
    const { data: row, error } = await context.supabase
      .from("catalog_hero_slides")
      .insert({
        position: nextPos,
        is_active: true,
        title: data.title ?? "Novo slide",
        eyebrow: data.eyebrow ?? null,
        highlight_prefix: data.highlight_prefix ?? "com até",
        highlight_value: data.highlight_value ?? "50%",
        highlight_suffix: data.highlight_suffix ?? "off",
        button_text: data.button_text ?? "aproveite",
        button_link: data.button_link ?? "/",
        disclaimer: data.disclaimer ?? "Imagem ilustrativa",
        brand_logo_url: data.brand_logo_url ?? null,
        image_desktop_url: data.image_desktop_url ?? null,
        image_mobile_url: data.image_mobile_url ?? null,
        background_color: data.background_color ?? "#f4f1ec",
        text_color: data.text_color ?? "#111111",
        button_bg_color: data.button_bg_color ?? "#0f766e",
        button_text_color: data.button_text_color ?? "#ffffff",
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const updateCatalogHeroSlide = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: Partial<CatalogHeroSlide> & { id: string }) => d)
  .handler(async ({ data, context }) => {
    await assertCanEdit(context);
    const { id, ...patch } = data;
    const { error } = await context.supabase
      .from("catalog_hero_slides")
      .update(patch as any)
      .eq("id", id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteCatalogHeroSlide = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => {
    await assertCanEdit(context);
    const { error } = await context.supabase
      .from("catalog_hero_slides")
      .delete()
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const reorderCatalogHeroSlides = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { ids: string[] }) => d)
  .handler(async ({ data, context }) => {
    await assertCanEdit(context);
    for (let i = 0; i < data.ids.length; i++) {
      const { error } = await context.supabase
        .from("catalog_hero_slides")
        .update({ position: i + 1 })
        .eq("id", data.ids[i]);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });
