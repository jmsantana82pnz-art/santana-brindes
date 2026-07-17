import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertEditor(context: { supabase: any; userId: string }) {
  const { data } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (data) return;
  const { data: editor } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "editor",
  });
  if (!editor) throw new Error("Forbidden");
}

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
        ) h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

export const getPwaSettings = createServerFn({ method: "GET" }).handler(async () => {
  const sb = makePublicClient();
  const { data } = await sb.from("pwa_settings").select("*").eq("id", 1).maybeSingle();
  return data;
});

export const getPwaSettingsAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertEditor(context);
    const { data } = await context.supabase
      .from("pwa_settings")
      .select("*")
      .eq("id", 1)
      .maybeSingle();
    return data;
  });

export const savePwaSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: Record<string, unknown>) => d)
  .handler(async ({ data, context }) => {
    await assertEditor(context);
    const { error } = await context.supabase
      .from("pwa_settings")
      .upsert({ id: 1, ...data, updated_at: new Date().toISOString() });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---------------- Export / backup ----------------

export const exportBackup = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertEditor(context);
    const tables = [
      "products",
      "categories",
      "product_images",
      "product_variants",
      "product_features",
      "product_tags",
      "banners",
      "sections",
      "pages",
      "coupons",
      "campaigns",
      "appearance",
      "store_settings",
      "contact_settings",
      "whatsapp_settings",
      "promo_bar",
      "payment_settings",
      "tracking_settings",
      "seo",
      "pwa_settings",
      "countdown_settings",
      "auto_messages",
    ] as const;

    const out: Record<string, any> = {
      exported_at: new Date().toISOString(),
    };
    for (const t of tables) {
      const { data } = await context.supabase.from(t as any).select("*");
      out[t] = data ?? [];
    }
    return out as Record<string, any>;
  });
