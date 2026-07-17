import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";

function makeClient() {
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

export const Route = createFileRoute("/api/manifest")({
  server: {
    handlers: {
      GET: async () => {
        const sb = makeClient();
        const { data } = await sb.from("pwa_settings").select("*").eq("id", 1).maybeSingle();
        const p = data ?? ({} as any);
        const icon = p.icon_url || "/favicon.ico";
        const manifest = {
          name: p.app_name || "Minha Loja",
          short_name: p.short_name || "Loja",
          description: p.description || "Catálogo de produtos",
          start_url: "/",
          scope: "/",
          display: "standalone",
          orientation: "portrait",
          background_color: p.background_color || "#ffffff",
          theme_color: p.theme_color || "#000000",
          icons: [
            { src: icon, sizes: "192x192", type: "image/png", purpose: "any maskable" },
            { src: icon, sizes: "512x512", type: "image/png", purpose: "any maskable" },
          ],
        };
        return new Response(JSON.stringify(manifest), {
          headers: {
            "Content-Type": "application/manifest+json; charset=utf-8",
            "Cache-Control": "public, max-age=300",
          },
        });
      },
    },
  },
});
