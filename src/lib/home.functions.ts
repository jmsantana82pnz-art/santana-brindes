import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAdmin(context: { supabase: any; userId: string }) {
  const { data, error } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden: admin only");
}

export const listHomeSections = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { data, error } = await context.supabase
      .from("sections")
      .select("*")
      .order("position", { ascending: true });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const createHomeSection = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: {
    type: string;
    title?: string | null;
    subtitle?: string | null;
    config?: Record<string, unknown>;
  }) => d)
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { data: maxRow } = await context.supabase
      .from("sections")
      .select("position")
      .order("position", { ascending: false })
      .limit(1)
      .maybeSingle();
    const nextPos = (maxRow?.position ?? 0) + 1;
    const { data: row, error } = await context.supabase
      .from("sections")
      .insert({
        type: data.type as any,
        title: data.title ?? null,
        subtitle: data.subtitle ?? null,
        config: (data.config ?? {}) as any,
        position: nextPos,
        is_active: true,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return row;
  });

export const updateHomeSection = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: {
    id: string;
    title?: string | null;
    subtitle?: string | null;
    config?: Record<string, unknown>;
    is_active?: boolean;
  }) => d)
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { id, ...patch } = data;
    const { error } = await context.supabase
      .from("sections")
      .update({ ...(patch as any), updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) throw new Error(error.message);
    return { ok: true };

  });

export const deleteHomeSection = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase.from("sections").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const reorderHomeSections = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { ids: string[] }) => d)
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    // Update positions sequentially
    for (let i = 0; i < data.ids.length; i++) {
      const { error } = await context.supabase
        .from("sections")
        .update({ position: i + 1 })
        .eq("id", data.ids[i]);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

// -------- Dashboard extended --------
export const getDashboardExtended = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const [products, orders, customers, categories, whatsappClicks, pageviews, topProducts] =
      await Promise.all([
        context.supabase.from("products").select("id", { count: "exact", head: true }),
        context.supabase.from("orders").select("id", { count: "exact", head: true }),
        context.supabase.from("customers").select("id", { count: "exact", head: true }),
        context.supabase.from("categories").select("id", { count: "exact", head: true }),
        context.supabase
          .from("analytics_events")
          .select("id", { count: "exact", head: true })
          .eq("event", "whatsapp_click"),
        context.supabase
          .from("analytics_events")
          .select("id", { count: "exact", head: true })
          .eq("event", "pageview"),

        context.supabase
          .from("products")
          .select("id, name, slug, cover_image_url, rating_count")
          .order("rating_count", { ascending: false })
          .limit(5),
      ]);
    return {
      products: products.count ?? 0,
      orders: orders.count ?? 0,
      customers: customers.count ?? 0,
      categories: categories.count ?? 0,
      whatsappClicks: whatsappClicks.count ?? 0,
      pageviews: pageviews.count ?? 0,
      topProducts: topProducts.data ?? [],
    };
  });
