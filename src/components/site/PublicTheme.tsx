import { useEffect } from "react";
import { useRouterState } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { getPublicSettings } from "@/lib/public.functions";
import { applyThemeVars } from "@/lib/theme-palettes";

/**
 * PublicTheme applies the store's palette + font as CSS variables on the
 * <html> element ONLY when the user is browsing a public catalog route.
 * The admin (/admin/*) keeps its default design system untouched.
 */
export function PublicTheme() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isAdmin = pathname.startsWith("/admin") || pathname.startsWith("/auth");

  const fn = useServerFn(getPublicSettings);
  const { data } = useQuery({
    queryKey: ["public-settings-theme"],
    queryFn: () => fn(),
    staleTime: 60_000,
  });

  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    const body = document.body;

    // Dynamic favicon from PWA settings — no default Lovable favicon.
    const iconUrl = (data as any)?.pwa?.icon_url as string | undefined;
    const head = document.head;
    head
      .querySelectorAll('link[rel="icon"], link[rel="apple-touch-icon"], link[rel="shortcut icon"]')
      .forEach((el) => el.remove());
    if (iconUrl) {
      const icon = document.createElement("link");
      icon.rel = "icon";
      icon.href = iconUrl;
      head.appendChild(icon);
      const apple = document.createElement("link");
      apple.rel = "apple-touch-icon";
      apple.href = iconUrl;
      head.appendChild(apple);
    }

    if (isAdmin) {
      // Ensure admin never inherits catalog vars/font.
      root.removeAttribute("data-catalog-theme");
      body.style.removeProperty("font-family");
      return;
    }

    const appearance = (data as any)?.appearance;
    if (!appearance) return;
    applyThemeVars(root, appearance);
    root.setAttribute("data-catalog-theme", "1");
    if (appearance.font_family) {
      body.style.setProperty("font-family", `'${appearance.font_family}', system-ui, sans-serif`);
    }
  }, [data, isAdmin]);

  return null;
}
