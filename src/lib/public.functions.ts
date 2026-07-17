import { createServerFn } from "@tanstack/react-start";
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

const PRODUCT_FIELDS =
  "id, name, slug, short_description, price_cents, compare_at_price_cents, pix_price_cents, installment_text, stock, rating_avg, rating_count, cover_image_url, is_featured, is_new, is_promotion, category_id";

function dataOrFallback<T>(response: { data: T | null; error?: { message: string } | null }, fallback: T, label: string): T {
  if (response.error) {
    console.error(`PUBLIC DATA ERROR ${label}`, response.error.message);
    return fallback;
  }
  return response.data ?? fallback;
}

async function attachVariantSummary(sb: any, products: any[]): Promise<any[]> {
  if (!products || products.length === 0) return products ?? [];
  const ids = products.map((p) => p.id).filter(Boolean);
  if (ids.length === 0) return products;
  const { data: variants } = await sb
    .from("product_variants")
    .select("product_id, name, attributes, stock")
    .in("product_id", ids);
  const byProduct = new Map<string, { colors: { name: string; hex: string }[]; sizes: string[] }>();
  for (const v of variants ?? []) {
    const bucket = byProduct.get(v.product_id) ?? { colors: [], sizes: [] };
    const attrs = (v.attributes as any) ?? {};
    // New shape: { size?, color?: {name,hex} }
    const size = attrs.size;
    const color = attrs.color;
    if (size && !bucket.sizes.includes(size)) bucket.sizes.push(size);
    if (color?.hex && !bucket.colors.find((c) => c.hex.toLowerCase() === String(color.hex).toLowerCase())) {
      bucket.colors.push({ name: color.name ?? "", hex: color.hex });
    }
    // Backwards compat: old shape { kind, value, hex }
    if (attrs.kind === "size" && attrs.value && !bucket.sizes.includes(attrs.value)) {
      bucket.sizes.push(attrs.value);
    }
    if (attrs.kind === "color" && attrs.hex && !bucket.colors.find((c) => c.hex.toLowerCase() === String(attrs.hex).toLowerCase())) {
      bucket.colors.push({ name: attrs.value ?? v.name, hex: attrs.hex });
    }
    byProduct.set(v.product_id, bucket);
  }
  return products.map((p) => ({
    ...p,
    colors: byProduct.get(p.id)?.colors ?? [],
    sizes: byProduct.get(p.id)?.sizes ?? [],
  }));
}

function normalizeHomeSection(section: any) {
  if (section.type === "featured") {
    return {
      ...section,
      type: "products_grid",
      config: { source: "featured", limit: 8, ...(section.config ?? {}) },
    };
  }
  if (section.type === "category") {
    return {
      ...section,
      type: "categories",
      config: { limit: 8, ...(section.config ?? {}) },
    };
  }
  if (section.type === "products") {
    return {
      ...section,
      type: "products_grid",
      config: { source: "newest", limit: 8, ...(section.config ?? {}) },
    };
  }
  return section;
}

export const getPublicSettings = createServerFn({ method: "GET" }).handler(async () => {
  const sb = makePublicClient();
  const [appearance, store, contact, whatsapp, promo, payment, tracking, pwa] = await Promise.all([
    sb.from("appearance").select("*").eq("id", 1).maybeSingle(),
    sb.from("store_settings").select("*").eq("id", 1).maybeSingle(),
    sb.from("contact_settings").select("*").eq("id", 1).maybeSingle(),
    sb.from("whatsapp_settings").select("*").eq("id", 1).maybeSingle(),
    sb.from("promo_bar").select("*").eq("id", 1).maybeSingle(),
    sb.from("payment_settings").select("*").eq("id", 1).maybeSingle(),
    sb.from("tracking_settings").select("ga_id, gtm_id, meta_pixel_id, tiktok_pixel_id, google_ads_id, custom_head_html").eq("id", 1).maybeSingle(),
    sb.from("pwa_settings").select("*").eq("id", 1).maybeSingle(),
  ]);
  return {
    appearance: appearance.data, store: store.data, contact: contact.data,
    whatsapp: whatsapp.data, promo: promo.data, payment: payment.data,
    tracking: tracking.data, pwa: pwa.data,
  };
});

export const getPublicProducts = createServerFn({ method: "GET" }).handler(async () => {
  const sb = makePublicClient();
  const { data } = await sb
    .from("products")
    .select(PRODUCT_FIELDS)
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(48);
  return data ?? [];
});

export const getPublicHome = createServerFn({ method: "GET" }).handler(async () => {
  const sb = makePublicClient();
  const nowIso = new Date().toISOString();
  const [settingsRes, sectionsRes, bannersRes, productsRes, categoriesRes, campaignsRes, countdownRes, couponsRes, trackingRes] = await Promise.all([
    Promise.all([
      sb.from("appearance").select("*").eq("id", 1).maybeSingle(),
      sb.from("store_settings").select("*").eq("id", 1).maybeSingle(),
      sb.from("contact_settings").select("*").eq("id", 1).maybeSingle(),
      sb.from("whatsapp_settings").select("*").eq("id", 1).maybeSingle(),
      sb.from("promo_bar").select("*").eq("id", 1).maybeSingle(),
      sb.from("payment_settings").select("*").eq("id", 1).maybeSingle(),
    ]),
    sb.from("sections").select("*").eq("is_active", true).order("position", { ascending: true }),
    sb.from("banners").select("*").eq("is_active", true).order("position", { ascending: true }),
    sb.from("products").select(PRODUCT_FIELDS + ", promotion_label")
      .eq("is_active", true).order("created_at", { ascending: false }).limit(24),
    sb.from("categories").select("id, name, slug, image_url")
      .eq("is_active", true).order("position", { ascending: true }),
    sb.from("campaigns").select("*").eq("active", true).order("position", { ascending: true }),
    sb.from("countdown_settings").select("*").eq("id", 1).maybeSingle(),
    sb.from("coupons").select("code, description, discount_type, discount_value, expires_at")
      .eq("is_active", true).limit(12),
    sb.from("tracking_settings").select("ga_id, gtm_id, meta_pixel_id, tiktok_pixel_id, google_ads_id, hotjar_id, clarity_id, custom_head_html, custom_body_html").eq("id", 1).maybeSingle(),
  ]);
  const [appearance, store, contact, whatsapp, promo, payment] = settingsRes;
  const sections = dataOrFallback(sectionsRes, [] as any[], "sections").map(normalizeHomeSection);
  const activeCampaigns = dataOrFallback(campaignsRes, [] as any[], "campaigns").filter((c: any) =>
    (!c.start_date || c.start_date <= nowIso) && (!c.end_date || c.end_date >= nowIso)
  );
  console.log("PUBLIC HOME SECTIONS", sections);
  return {
    settings: {
      appearance: dataOrFallback(appearance, null, "appearance"),
      store: dataOrFallback(store, null, "store_settings"),
      contact: dataOrFallback(contact, null, "contact_settings"),
      whatsapp: dataOrFallback(whatsapp, null, "whatsapp_settings"),
      promo: dataOrFallback(promo, null, "promo_bar"),
      payment: dataOrFallback(payment, null, "payment_settings"),
      tracking: dataOrFallback(trackingRes, null, "tracking_settings"),
      countdown: dataOrFallback(countdownRes, null, "countdown_settings"),
    },
    sections,
    banners: dataOrFallback(bannersRes, [] as any[], "banners"),
    products: await attachVariantSummary(sb, dataOrFallback(productsRes, [] as any[], "products")),
    categories: dataOrFallback(categoriesRes, [] as any[], "categories"),
    campaigns: activeCampaigns,
    coupons: dataOrFallback(couponsRes, [] as any[], "coupons"),
  };
});

export const getPublicTracking = createServerFn({ method: "GET" }).handler(async () => {
  const sb = makePublicClient();
  const { data } = await sb.from("tracking_settings")
    .select("ga_id, gtm_id, meta_pixel_id, tiktok_pixel_id, google_ads_id, hotjar_id, clarity_id, custom_head_html, custom_body_html")
    .eq("id", 1).maybeSingle();
  return data ?? null;
});

export const getPublicCatalog = createServerFn({ method: "GET" })
  .inputValidator((d: { search?: string; category?: string; sort?: string; min?: number; max?: number } | undefined) => d ?? {})
  .handler(async ({ data }) => {
    const sb = makePublicClient();
    let q = sb.from("products").select(PRODUCT_FIELDS).eq("is_active", true);
    if (data.search) q = q.ilike("name", `%${data.search}%`);
    if (data.category) {
      const { data: cat } = await sb.from("categories").select("id").eq("slug", data.category).maybeSingle();
      if (cat?.id) q = q.eq("category_id", cat.id);
    }
    if (typeof data.min === "number") q = q.gte("price_cents", data.min * 100);
    if (typeof data.max === "number") q = q.lte("price_cents", data.max * 100);
    switch (data.sort) {
      case "price_asc":
        q = q.order("price_cents", { ascending: true });
        break;
      case "price_desc":
        q = q.order("price_cents", { ascending: false });
        break;
      default:
        q = q.order("created_at", { ascending: false });
    }
    const { data: products } = await q.limit(96);
    const { data: categories } = await sb
      .from("categories")
      .select("id, name, slug, image_url")
      .eq("is_active", true)
      .order("position", { ascending: true });
    const withVariants = await attachVariantSummary(sb, products ?? []);
    return { products: withVariants, categories: categories ?? [] };
  });

export const getPublicProduct = createServerFn({ method: "GET" })
  .inputValidator((d: { slug: string }) => d)
  .handler(async ({ data }) => {
    const sb = makePublicClient();
    const { data: product } = await sb
      .from("products")
      .select("*")
      .eq("slug", data.slug)
      .eq("is_active", true)
      .maybeSingle();
    if (!product) return null;
    const [imgs, variants, features, related, category] = await Promise.all([
      sb.from("product_images").select("*").eq("product_id", product.id).order("position", { ascending: true }),
      sb.from("product_variants").select("*").eq("product_id", product.id).order("created_at", { ascending: true }),
      sb.from("product_features").select("*").eq("product_id", product.id).order("position", { ascending: true }),
      sb
        .from("products")
        .select(PRODUCT_FIELDS)
        .eq("is_active", true)
        .neq("id", product.id)
        .eq("category_id", (product as any).category_id ?? "")
        .limit(8),
      product.category_id
        ? sb.from("categories").select("id, name, slug").eq("id", product.category_id).maybeSingle()
        : Promise.resolve({ data: null }),
    ]);
    return {
      product,
      images: imgs.data ?? [],
      variants: variants.data ?? [],
      features: features.data ?? [],
      related: related.data ?? [],
      category: (category as any).data ?? null,
    };
  });
