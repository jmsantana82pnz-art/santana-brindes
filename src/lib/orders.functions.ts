import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createClient } from "@supabase/supabase-js";

function publicClient() {
  const url = process.env.SUPABASE_URL!;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY!;
  return createClient(url, key, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if ((key.startsWith("sb_publishable_") || key.startsWith("sb_secret_")) && h.get("Authorization") === `Bearer ${key}`) {
          h.delete("Authorization");
        }
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

async function assertEditor(context: { supabase: any; userId: string }) {
  const { data } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
  if (data) return;
  const { data: ed } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "editor" });
  if (!ed) throw new Error("Forbidden");
}

// ============ PUBLIC CART ============

export const getCart = createServerFn({ method: "POST" })
  .inputValidator((d: { sessionId: string }) => d)
  .handler(async ({ data }) => {
    const { data: cartData, error } = await publicClient().rpc("get_public_cart", { p_session_id: data.sessionId });
    if (error) throw new Error(error.message);
    return cartData as any;
  });

export const addToCart = createServerFn({ method: "POST" })
  .inputValidator((d: { sessionId: string; productId: string; qty?: number }) => d)
  .handler(async ({ data }) => {
    const { error } = await publicClient().rpc("add_public_cart_item", {
      p_session_id: data.sessionId,
      p_product_id: data.productId,
      p_qty: Math.max(1, data.qty ?? 1),
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const updateCartItem = createServerFn({ method: "POST" })
  .inputValidator((d: { sessionId: string; itemId: string; qty: number }) => d)
  .handler(async ({ data }) => {
    const { error } = await publicClient().rpc("update_public_cart_item", {
      p_session_id: data.sessionId,
      p_item_id: data.itemId,
      p_qty: data.qty,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const removeCartItem = createServerFn({ method: "POST" })
  .inputValidator((d: { sessionId: string; itemId: string }) => d)
  .handler(async ({ data }) => {
    const { error } = await publicClient().rpc("remove_public_cart_item", {
      p_session_id: data.sessionId,
      p_item_id: data.itemId,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ============ CHECKOUT via WhatsApp ============

export const checkoutWhatsapp = createServerFn({ method: "POST" })
  .inputValidator(
    (d: {
      sessionId: string;
      customer: { name: string; phone: string; email?: string; city?: string; notes?: string };
    }) => d,
  )
  .handler(async ({ data }) => {
    const name = (data.customer.name || "").trim();
    const phone = (data.customer.phone || "").trim();
    if (!name || !phone) throw new Error("Nome e telefone são obrigatórios");
    const { data: result, error } = await publicClient().rpc("checkout_public_whatsapp_cart", {
      p_session_id: data.sessionId,
      p_customer: {
        name,
        phone,
        email: data.customer.email || null,
        city: data.customer.city || null,
        notes: data.customer.notes || null,
      },
    });
    if (error) throw new Error(error.message);
    return result as any;
  });

// ============ ADMIN ============

export const listOrders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("orders")
      .select("id, number, status, total_cents, channel, notes, created_at, customer:customers(id, name, phone)")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const getOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => {
    const [ord, items, events] = await Promise.all([
      context.supabase
        .from("orders")
        .select("*, customer:customers(*)")
        .eq("id", data.id)
        .maybeSingle(),
      context.supabase.from("order_items").select("*").eq("order_id", data.id),
      context.supabase.from("order_events").select("*").eq("order_id", data.id).order("created_at", { ascending: false }),
    ]);
    if (ord.error) throw new Error(ord.error.message);
    return { order: ord.data, items: items.data ?? [], events: events.data ?? [] };
  });

export const updateOrderStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; status: string }) => d)
  .handler(async ({ data, context }) => {
    await assertEditor(context);
    const { error } = await context.supabase
      .from("orders")
      .update({ status: data.status as any })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    await context.supabase.from("order_events").insert({
      order_id: data.id,
      event: "status_change",
      payload: { status: data.status },
      created_by: context.userId,
    });
    return { ok: true };
  });

export const deleteOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => {
    await assertEditor(context);
    const sb = await admin();
    await sb.from("orders").delete().eq("id", data.id);
    return { ok: true };
  });

// ============ CUSTOMERS ============

export const listCustomers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const sb = await admin();
    const { data: customers } = await sb
      .from("customers")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);
    // aggregate order counts + totals
    const { data: agg } = await sb
      .from("orders")
      .select("customer_id, total_cents, created_at");
    const map = new Map<string, { count: number; total: number; last: string }>();
    (agg ?? []).forEach((o: any) => {
      if (!o.customer_id) return;
      const cur = map.get(o.customer_id) || { count: 0, total: 0, last: "" };
      cur.count += 1;
      cur.total += o.total_cents ?? 0;
      if (!cur.last || o.created_at > cur.last) cur.last = o.created_at;
      map.set(o.customer_id, cur);
    });
    void context;
    return (customers ?? []).map((c: any) => {
      const stat = map.get(c.id) || { count: 0, total: 0, last: "" };
      return { ...c, orders_count: stat.count, total_spent_cents: stat.total, last_order_at: stat.last };
    });
  });

export const getCustomer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => {
    const [cust, orders] = await Promise.all([
      context.supabase.from("customers").select("*").eq("id", data.id).maybeSingle(),
      context.supabase
        .from("orders")
        .select("id, number, status, total_cents, created_at")
        .eq("customer_id", data.id)
        .order("created_at", { ascending: false }),
    ]);
    if (cust.error) throw new Error(cust.error.message);
    return { customer: cust.data, orders: orders.data ?? [] };
  });

export const updateCustomer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; name?: string; phone?: string; email?: string; address?: any }) => d)
  .handler(async ({ data, context }) => {
    await assertEditor(context);
    const { id, ...rest } = data;
    const { error } = await context.supabase.from("customers").update(rest).eq("id", id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ============ AUTO MESSAGES ============

export const listAutoMessages = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertEditor(context);
    const { data } = await context.supabase.from("auto_messages").select("*").order("trigger");
    return data ?? [];
  });

export const saveAutoMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id?: string; trigger: string; template: string; is_active: boolean }) => d)
  .handler(async ({ data, context }) => {
    await assertEditor(context);
    if (data.id) {
      const { error } = await context.supabase
        .from("auto_messages")
        .update({ trigger: data.trigger, template: data.template, is_active: data.is_active })
        .eq("id", data.id);
      if (error) throw new Error(error.message);
      return { ok: true };
    }
    const { error } = await context.supabase.from("auto_messages").insert({
      trigger: data.trigger,
      template: data.template,
      is_active: data.is_active,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteAutoMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => {
    await assertEditor(context);
    await context.supabase.from("auto_messages").delete().eq("id", data.id);
    return { ok: true };
  });

// ============ REPORTS ============

export const getSalesReport = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const now = new Date();
    const startDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const startWeek = new Date(now.getTime() - 7 * 24 * 3600 * 1000).toISOString();
    const startMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    const [today, week, month, byStatus, topItems, recentCustomers, waClicks] = await Promise.all([
      context.supabase.from("orders").select("id", { count: "exact", head: true }).gte("created_at", startDay),
      context.supabase.from("orders").select("id", { count: "exact", head: true }).gte("created_at", startWeek),
      context.supabase.from("orders").select("id, total_cents").gte("created_at", startMonth),
      context.supabase.from("orders").select("status"),
      context.supabase.from("order_items").select("product_id, name_snapshot, qty"),
      context.supabase.from("customers").select("id", { count: "exact", head: true }).gte("created_at", startWeek),
      context.supabase.from("analytics_events").select("id", { count: "exact", head: true }).eq("event", "whatsapp_click").gte("created_at", startWeek),
    ]);

    const statusCounts: Record<string, number> = {};
    (byStatus.data ?? []).forEach((o: any) => (statusCounts[o.status] = (statusCounts[o.status] || 0) + 1));

    const productMap = new Map<string, { name: string; qty: number }>();
    (topItems.data ?? []).forEach((i: any) => {
      const key = i.product_id || i.name_snapshot;
      const cur = productMap.get(key) || { name: i.name_snapshot, qty: 0 };
      cur.qty += i.qty;
      productMap.set(key, cur);
    });
    const topProducts = [...productMap.values()].sort((a, b) => b.qty - a.qty).slice(0, 10);

    const monthTotal = (month.data ?? []).reduce((s: number, o: any) => s + (o.total_cents ?? 0), 0);

    return {
      ordersToday: today.count ?? 0,
      ordersWeek: week.count ?? 0,
      revenueMonthCents: monthTotal,
      statusCounts,
      topProducts,
      newCustomersWeek: recentCustomers.count ?? 0,
      whatsappClicksWeek: waClicks.count ?? 0,
    };
  });
