import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertEditor(context: { supabase: any; userId: string }) {
  const { data, error } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (error) throw new Error(error.message);
  if (!data) {
    const { data: editor } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "editor",
    });
    if (!editor) throw new Error("Forbidden: editor/admin only");
  }
}

function slugify(input: string) {
  return input
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

// ============ CATEGORIES ============
export const listCategoriesAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertEditor(context);
    const { data, error } = await context.supabase
      .from("categories")
      .select("*")
      .order("position", { ascending: true });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const upsertCategory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: {
    id?: string;
    name: string;
    slug?: string;
    description?: string | null;
    image_url?: string | null;
    parent_id?: string | null;
    position?: number;
    is_active?: boolean;
  }) => d)
  .handler(async ({ data, context }) => {
    await assertEditor(context);
    const slug = data.slug?.trim() || slugify(data.name);
    const payload: any = {
      name: data.name.trim(),
      slug,
      description: data.description ?? null,
      image_url: data.image_url ?? null,
      parent_id: data.parent_id ?? null,
      position: data.position ?? 0,
      is_active: data.is_active ?? true,
      updated_at: new Date().toISOString(),
    };
    if (data.id) {
      const { error } = await context.supabase.from("categories").update(payload).eq("id", data.id);
      if (error) throw new Error(error.message);
      return { id: data.id };
    }
    const { data: row, error } = await context.supabase.from("categories").insert(payload).select("id").single();
    if (error) throw new Error(error.message);
    return { id: row.id };
  });

export const deleteCategory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => {
    await assertEditor(context);
    const { error } = await context.supabase.from("categories").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ============ PRODUCTS ============
export const listProductsAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { search?: string; categoryId?: string | null } | undefined) => d ?? {})
  .handler(async ({ data, context }) => {
    await assertEditor(context);
    let q = context.supabase
      .from("products")
      .select("id, name, slug, price_cents, compare_at_price_cents, pix_price_cents, stock, is_active, is_featured, is_new, is_promotion, cover_image_url, category_id, position, created_at")
      .order("created_at", { ascending: false })
      .limit(500);
    if (data.search) q = q.ilike("name", `%${data.search}%`);
    if (data.categoryId) q = q.eq("category_id", data.categoryId);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const getProductAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => {
    await assertEditor(context);
    const [productRes, imagesRes, variantsRes, featuresRes] = await Promise.all([
      context.supabase.from("products").select("*").eq("id", data.id).maybeSingle(),
      context.supabase.from("product_images").select("*").eq("product_id", data.id).order("position", { ascending: true }),
      context.supabase.from("product_variants").select("*").eq("product_id", data.id).order("created_at", { ascending: true }),
      context.supabase.from("product_features").select("*").eq("product_id", data.id).order("position", { ascending: true }),
    ]);
    if (productRes.error) throw new Error(productRes.error.message);
    if (!productRes.data) throw new Error("Produto não encontrado");
    return {
      product: productRes.data,
      images: imagesRes.data ?? [],
      variants: variantsRes.data ?? [],
      features: featuresRes.data ?? [],
    };
  });

export const upsertProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: {
    id?: string;
    name: string;
    slug?: string;
    category_id?: string | null;
    short_description?: string | null;
    description?: string | null;
    price_cents: number;
    compare_at_price_cents?: number | null;
    pix_price_cents?: number | null;
    installment_text?: string | null;
    stock?: number;
    sku?: string | null;
    barcode?: string | null;
    is_active?: boolean;
    is_featured?: boolean;
    is_new?: boolean;
    is_promotion?: boolean;
    cover_image_url?: string | null;
    whatsapp_message?: string | null;
  }) => d)
  .handler(async ({ data, context }) => {
    await assertEditor(context);
    if (!data.name?.trim()) throw new Error("Nome obrigatório");
    if (data.price_cents < 0) throw new Error("Preço inválido");
    const slug = data.slug?.trim() || slugify(data.name);
    const payload: any = {
      name: data.name.trim(),
      slug,
      category_id: data.category_id ?? null,
      short_description: data.short_description ?? null,
      description: data.description ?? null,
      price_cents: data.price_cents,
      compare_at_price_cents: data.compare_at_price_cents ?? null,
      pix_price_cents: data.pix_price_cents ?? null,
      installment_text: data.installment_text ?? null,
      stock: data.stock ?? 0,
      sku: data.sku ?? null,
      barcode: data.barcode ?? null,
      is_active: data.is_active ?? true,
      is_featured: data.is_featured ?? false,
      is_new: data.is_new ?? false,
      is_promotion: data.is_promotion ?? false,
      whatsapp_message: data.whatsapp_message ?? null,
      updated_at: new Date().toISOString(),
    };
    // Only touch cover_image_url when the caller explicitly sent it,
    // so saves from the editor don't wipe the current cover.
    if ("cover_image_url" in data) {
      payload.cover_image_url = data.cover_image_url ?? null;
    }
    if (data.id) {
      const { error } = await context.supabase.from("products").update(payload).eq("id", data.id);
      if (error) throw new Error(error.message);
      return { id: data.id };
    }
    const { data: row, error } = await context.supabase.from("products").insert(payload).select("id").single();
    if (error) throw new Error(error.message);
    return { id: row.id };
  });

export const deleteProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => {
    await assertEditor(context);
    const { error } = await context.supabase.from("products").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const toggleProductField = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; field: "is_active" | "is_featured" | "is_new" | "is_promotion"; value: boolean }) => d)
  .handler(async ({ data, context }) => {
    await assertEditor(context);
    const { error } = await context.supabase
      .from("products")
      .update({ [data.field]: data.value, updated_at: new Date().toISOString() } as any)
      .eq("id", data.id);
    if (error) throw new Error(error.message);

    return { ok: true };
  });

export const bulkUpdateProducts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: {
    ids: string[];
    patch: {
      is_active?: boolean;
      is_featured?: boolean;
      is_new?: boolean;
      is_promotion?: boolean;
      category_id?: string | null;
      stock?: number;
      price_adjust_percent?: number;
    };
  }) => d)
  .handler(async ({ data, context }) => {
    await assertEditor(context);
    if (!data.ids?.length) return { ok: true, updated: 0 };

    const { price_adjust_percent, ...rest } = data.patch;
    const basePatch: any = { updated_at: new Date().toISOString() };
    for (const [k, v] of Object.entries(rest)) {
      if (v !== undefined) basePatch[k] = v;
    }

    if (Object.keys(basePatch).length > 1) {
      const { error } = await context.supabase
        .from("products")
        .update(basePatch)
        .in("id", data.ids);
      if (error) throw new Error(error.message);
    }

    if (price_adjust_percent !== undefined && price_adjust_percent !== 0) {
      const { data: rows, error: rErr } = await context.supabase
        .from("products")
        .select("id, price_cents, pix_price_cents")
        .in("id", data.ids);
      if (rErr) throw new Error(rErr.message);
      const factor = 1 + price_adjust_percent / 100;
      for (const r of rows ?? []) {
        const patch: any = { updated_at: new Date().toISOString() };
        if (r.price_cents != null) patch.price_cents = Math.max(0, Math.round(r.price_cents * factor));
        if (r.pix_price_cents != null) patch.pix_price_cents = Math.max(0, Math.round(r.pix_price_cents * factor));
        const { error } = await context.supabase.from("products").update(patch).eq("id", r.id);
        if (error) throw new Error(error.message);
      }
    }

    return { ok: true, updated: data.ids.length };
  });

export const bulkDeleteProducts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { ids: string[] }) => d)
  .handler(async ({ data, context }) => {
    await assertEditor(context);
    if (!data.ids?.length) return { ok: true };
    const { error } = await context.supabase.from("products").delete().in("id", data.ids);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ============ IMAGES ============
export const addProductImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { product_id: string; url: string; alt?: string | null }) => d)
  .handler(async ({ data, context }) => {
    await assertEditor(context);
    const { data: maxRow } = await context.supabase
      .from("product_images")
      .select("position")
      .eq("product_id", data.product_id)
      .order("position", { ascending: false })
      .limit(1)
      .maybeSingle();
    const nextPos = (maxRow?.position ?? -1) + 1;
    const { data: row, error } = await context.supabase
      .from("product_images")
      .insert({ product_id: data.product_id, url: data.url, alt: data.alt ?? null, position: nextPos, is_main: nextPos === 0 })
      .select()
      .single();
    if (error) throw new Error(error.message);
    if (nextPos === 0) {
      await context.supabase.from("products").update({ cover_image_url: data.url }).eq("id", data.product_id);
    }
    return row;
  });

export const setMainImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { product_id: string; image_id: string }) => d)
  .handler(async ({ data, context }) => {
    await assertEditor(context);
    await context.supabase.from("product_images").update({ is_main: false }).eq("product_id", data.product_id);
    const { data: img, error } = await context.supabase
      .from("product_images")
      .update({ is_main: true })
      .eq("id", data.image_id)
      .select("url")
      .single();
    if (error) throw new Error(error.message);
    await context.supabase.from("products").update({ cover_image_url: img.url }).eq("id", data.product_id);
    return { ok: true };
  });

export const deleteProductImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => {
    await assertEditor(context);
    const { error } = await context.supabase.from("product_images").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const reorderProductImages = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { ids: string[] }) => d)
  .handler(async ({ data, context }) => {
    await assertEditor(context);
    for (let i = 0; i < data.ids.length; i++) {
      await context.supabase.from("product_images").update({ position: i }).eq("id", data.ids[i]);
    }
    return { ok: true };
  });

// ============ VARIANTS ============
export const upsertVariant = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: {
    id?: string;
    product_id: string;
    name: string;
    sku?: string | null;
    price_cents?: number | null;
    stock?: number;
    attributes?: Record<string, unknown>;
  }) => d)
  .handler(async ({ data, context }) => {
    await assertEditor(context);
    const payload: any = {
      product_id: data.product_id,
      name: data.name,
      sku: data.sku ?? null,
      price_cents: data.price_cents ?? null,
      stock: data.stock ?? 0,
      attributes: (data.attributes ?? {}) as any,
      updated_at: new Date().toISOString(),
    };
    if (data.id) {
      const { error } = await context.supabase.from("product_variants").update(payload).eq("id", data.id);
      if (error) throw new Error(error.message);
      return { id: data.id };
    }
    const { data: row, error } = await context.supabase.from("product_variants").insert(payload).select("id").single();
    if (error) throw new Error(error.message);
    return { id: row.id };
  });

export const deleteVariant = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => {
    await assertEditor(context);
    const { error } = await context.supabase.from("product_variants").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const saveProductVariants = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: {
    product_id: string;
    variants: Array<{
      name: string;
      price_cents?: number | null;
      stock?: number;
      image_url?: string | null;
      attributes: {
        size?: string | null;
        color?: { name: string; hex: string } | null;
      };
    }>;
  }) => d)
  .handler(async ({ data, context }) => {
    await assertEditor(context);
    const key = (v: any) => {
      const size = v.attributes?.size ?? "";
      const color = v.attributes?.color?.name ?? "";
      return `${String(size).toLowerCase()}|${String(color).toLowerCase()}`;
    };

    const { data: existing, error: exErr } = await context.supabase
      .from("product_variants")
      .select("*")
      .eq("product_id", data.product_id);
    if (exErr) throw new Error(exErr.message);
    const existMap = new Map<string, any>();
    for (const row of existing ?? []) existMap.set(key(row), row);

    const desiredKeys = new Set<string>();
    for (const v of data.variants) {
      const k = key(v);
      desiredKeys.add(k);
      const found = existMap.get(k);
      const payload: any = {
        product_id: data.product_id,
        name: v.name,
        price_cents: v.price_cents ?? null,
        stock: v.stock ?? 0,
        image_url: v.image_url ?? null,
        attributes: v.attributes as any,
        updated_at: new Date().toISOString(),
      };
      if (found) {
        const { error } = await context.supabase
          .from("product_variants")
          .update(payload)
          .eq("id", found.id);
        if (error) throw new Error(error.message);
      } else {
        const { error } = await context.supabase.from("product_variants").insert(payload);
        if (error) throw new Error(error.message);
      }
    }
    for (const [k, row] of existMap.entries()) {
      if (!desiredKeys.has(k)) {
        await context.supabase.from("product_variants").delete().eq("id", row.id);
      }
    }
    return { ok: true };
  });

// ============ FEATURES ============
export const saveFeatures = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: {
    product_id: string;
    features: { id?: string; label: string; value: string }[];
  }) => d)
  .handler(async ({ data, context }) => {
    await assertEditor(context);
    // Simple strategy: delete all + reinsert
    await context.supabase.from("product_features").delete().eq("product_id", data.product_id);
    if (data.features.length > 0) {
      const rows = data.features
        .filter((f) => f.label.trim() && f.value.trim())
        .map((f, i) => ({
          product_id: data.product_id,
          label: f.label.trim(),
          value: f.value.trim(),
          position: i,
        }));
      if (rows.length > 0) {
        const { error } = await context.supabase.from("product_features").insert(rows);
        if (error) throw new Error(error.message);
      }
    }
    return { ok: true };
  });
