export type Palette = {
  id: string;
  name: string;
  style: string;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  bg_color: string;
  text_color: string;
  button_color: string;
  button_text_color: string;
  header_bg_color: string;
  header_text_color: string;
  footer_bg_color: string;
  footer_text_color: string;
  card_color: string;
};

export const PALETTES: Palette[] = [
  { id: "minimal-black", name: "Minimal Black", style: "Luxo / Moda", primary_color: "#111111", secondary_color: "#4B4B4B", accent_color: "#D4AF37", bg_color: "#FFFFFF", text_color: "#111111", button_color: "#111111", button_text_color: "#FFFFFF", header_bg_color: "#FFFFFF", header_text_color: "#111111", footer_bg_color: "#111111", footer_text_color: "#FFFFFF", card_color: "#FFFFFF" },
  { id: "clean-white", name: "Clean White", style: "Lojas modernas", primary_color: "#2563EB", secondary_color: "#64748B", accent_color: "#F59E0B", bg_color: "#FFFFFF", text_color: "#0F172A", button_color: "#2563EB", button_text_color: "#FFFFFF", header_bg_color: "#FFFFFF", header_text_color: "#0F172A", footer_bg_color: "#F1F5F9", footer_text_color: "#0F172A", card_color: "#FFFFFF" },
  { id: "premium-gold", name: "Premium Gold", style: "Luxo", primary_color: "#1A1A1A", secondary_color: "#8B7355", accent_color: "#D4AF37", bg_color: "#FAF7F2", text_color: "#1A1A1A", button_color: "#D4AF37", button_text_color: "#1A1A1A", header_bg_color: "#1A1A1A", header_text_color: "#D4AF37", footer_bg_color: "#1A1A1A", footer_text_color: "#D4AF37", card_color: "#FFFFFF" },
  { id: "elegance-nude", name: "Elegance Nude", style: "Beleza / Feminino", primary_color: "#B8896B", secondary_color: "#D4A88C", accent_color: "#E8B4B8", bg_color: "#FAF3EE", text_color: "#4A2E1F", button_color: "#B8896B", button_text_color: "#FFFFFF", header_bg_color: "#FAF3EE", header_text_color: "#4A2E1F", footer_bg_color: "#E8C7A0", footer_text_color: "#4A2E1F", card_color: "#FFFFFF" },
  { id: "ocean-blue", name: "Ocean Blue", style: "Tecnologia", primary_color: "#0EA5E9", secondary_color: "#0369A1", accent_color: "#06B6D4", bg_color: "#F0F9FF", text_color: "#0C1E2E", button_color: "#0EA5E9", button_text_color: "#FFFFFF", header_bg_color: "#0C1E2E", header_text_color: "#FFFFFF", footer_bg_color: "#0C1E2E", footer_text_color: "#F0F9FF", card_color: "#FFFFFF" },
  { id: "fresh-green", name: "Fresh Green", style: "Natural / Alimentos", primary_color: "#16A34A", secondary_color: "#166534", accent_color: "#F59E0B", bg_color: "#F0FDF4", text_color: "#14532D", button_color: "#16A34A", button_text_color: "#FFFFFF", header_bg_color: "#FFFFFF", header_text_color: "#14532D", footer_bg_color: "#14532D", footer_text_color: "#F0FDF4", card_color: "#FFFFFF" },
  { id: "fashion-pink", name: "Fashion Pink", style: "Moda feminina", primary_color: "#EC4899", secondary_color: "#F472B6", accent_color: "#A855F7", bg_color: "#FFF7FB", text_color: "#500724", button_color: "#EC4899", button_text_color: "#FFFFFF", header_bg_color: "#FFFFFF", header_text_color: "#500724", footer_bg_color: "#FBCFE8", footer_text_color: "#500724", card_color: "#FFFFFF" },
  { id: "luxury-purple", name: "Luxury Purple", style: "Premium", primary_color: "#7E22CE", secondary_color: "#A855F7", accent_color: "#D4AF37", bg_color: "#FAF5FF", text_color: "#2E1065", button_color: "#7E22CE", button_text_color: "#FFFFFF", header_bg_color: "#2E1065", header_text_color: "#FFFFFF", footer_bg_color: "#2E1065", footer_text_color: "#FAF5FF", card_color: "#FFFFFF" },
  { id: "modern-gray", name: "Modern Gray", style: "Minimalista", primary_color: "#374151", secondary_color: "#6B7280", accent_color: "#EF4444", bg_color: "#F9FAFB", text_color: "#111827", button_color: "#111827", button_text_color: "#FFFFFF", header_bg_color: "#FFFFFF", header_text_color: "#111827", footer_bg_color: "#111827", footer_text_color: "#F9FAFB", card_color: "#FFFFFF" },
  { id: "sunset-orange", name: "Sunset Orange", style: "Promoções", primary_color: "#F97316", secondary_color: "#EA580C", accent_color: "#FDE047", bg_color: "#FFF7ED", text_color: "#7C2D12", button_color: "#F97316", button_text_color: "#FFFFFF", header_bg_color: "#7C2D12", header_text_color: "#FFF7ED", footer_bg_color: "#7C2D12", footer_text_color: "#FFF7ED", card_color: "#FFFFFF" },
  { id: "coffee-brown", name: "Coffee Brown", style: "Cafés / Artesanais", primary_color: "#6B4226", secondary_color: "#8B5A3C", accent_color: "#D4AF37", bg_color: "#FAF6F1", text_color: "#3E2723", button_color: "#6B4226", button_text_color: "#FFFFFF", header_bg_color: "#3E2723", header_text_color: "#FAF6F1", footer_bg_color: "#3E2723", footer_text_color: "#FAF6F1", card_color: "#FFFFFF" },
  { id: "baby-blue", name: "Baby Blue", style: "Leve", primary_color: "#60A5FA", secondary_color: "#93C5FD", accent_color: "#F472B6", bg_color: "#F0F9FF", text_color: "#1E3A8A", button_color: "#60A5FA", button_text_color: "#FFFFFF", header_bg_color: "#FFFFFF", header_text_color: "#1E3A8A", footer_bg_color: "#DBEAFE", footer_text_color: "#1E3A8A", card_color: "#FFFFFF" },
  { id: "wine-red", name: "Wine Red", style: "Sofisticado", primary_color: "#7F1D1D", secondary_color: "#991B1B", accent_color: "#D4AF37", bg_color: "#FEF2F2", text_color: "#450A0A", button_color: "#7F1D1D", button_text_color: "#FFFFFF", header_bg_color: "#450A0A", header_text_color: "#FEF2F2", footer_bg_color: "#450A0A", footer_text_color: "#FEF2F2", card_color: "#FFFFFF" },
  { id: "dark-premium", name: "Dark Premium", style: "Alto padrão", primary_color: "#F59E0B", secondary_color: "#78716C", accent_color: "#F59E0B", bg_color: "#0A0A0A", text_color: "#FAFAFA", button_color: "#F59E0B", button_text_color: "#0A0A0A", header_bg_color: "#0A0A0A", header_text_color: "#FAFAFA", footer_bg_color: "#0A0A0A", footer_text_color: "#FAFAFA", card_color: "#171717" },
  { id: "marketplace-blue", name: "Marketplace Blue", style: "Grandes marketplaces", primary_color: "#2874F0", secondary_color: "#FB8C00", accent_color: "#FFE500", bg_color: "#F1F3F6", text_color: "#212121", button_color: "#FB641B", button_text_color: "#FFFFFF", header_bg_color: "#2874F0", header_text_color: "#FFFFFF", footer_bg_color: "#172337", footer_text_color: "#FFFFFF", card_color: "#FFFFFF" },
  { id: "nature-earth", name: "Nature Earth", style: "Orgânico", primary_color: "#65A30D", secondary_color: "#84CC16", accent_color: "#A16207", bg_color: "#FEFCE8", text_color: "#3F3F0F", button_color: "#65A30D", button_text_color: "#FFFFFF", header_bg_color: "#3F3F0F", header_text_color: "#FEFCE8", footer_bg_color: "#3F3F0F", footer_text_color: "#FEFCE8", card_color: "#FFFFFF" },
  { id: "tech-neon", name: "Tech Neon", style: "Tecnologia", primary_color: "#00FF88", secondary_color: "#00D9FF", accent_color: "#FF00E5", bg_color: "#0A0A1F", text_color: "#E0E0FF", button_color: "#00FF88", button_text_color: "#0A0A1F", header_bg_color: "#0A0A1F", header_text_color: "#00FF88", footer_bg_color: "#0A0A1F", footer_text_color: "#00D9FF", card_color: "#141433" },
  { id: "luxury-beige", name: "Luxury Beige", style: "Moda", primary_color: "#A8896A", secondary_color: "#C8A17A", accent_color: "#1A1A1A", bg_color: "#F5EFE6", text_color: "#3D2E1F", button_color: "#1A1A1A", button_text_color: "#F5EFE6", header_bg_color: "#F5EFE6", header_text_color: "#3D2E1F", footer_bg_color: "#3D2E1F", footer_text_color: "#F5EFE6", card_color: "#FFFFFF" },
  { id: "candy-colors", name: "Candy Colors", style: "Infantil", primary_color: "#F472B6", secondary_color: "#60A5FA", accent_color: "#FDE047", bg_color: "#FFFBEB", text_color: "#4C1D95", button_color: "#F472B6", button_text_color: "#FFFFFF", header_bg_color: "#FFFFFF", header_text_color: "#4C1D95", footer_bg_color: "#4C1D95", footer_text_color: "#FFFBEB", card_color: "#FFFFFF" },
  { id: "corporate-professional", name: "Corporate Professional", style: "Empresas", primary_color: "#1E3A8A", secondary_color: "#475569", accent_color: "#0EA5E9", bg_color: "#F8FAFC", text_color: "#0F172A", button_color: "#1E3A8A", button_text_color: "#FFFFFF", header_bg_color: "#1E3A8A", header_text_color: "#FFFFFF", footer_bg_color: "#0F172A", footer_text_color: "#F8FAFC", card_color: "#FFFFFF" },
];

export const CATALOG_FONTS = [
  { id: "Inter", name: "Inter", style: "Moderno / Tecnologia", css: "'Inter', sans-serif" },
  { id: "Poppins", name: "Poppins", style: "Lojas modernas", css: "'Poppins', sans-serif" },
  { id: "Montserrat", name: "Montserrat", style: "Premium", css: "'Montserrat', sans-serif" },
  { id: "Playfair Display", name: "Playfair Display", style: "Luxo / Moda", css: "'Playfair Display', serif" },
  { id: "Lato", name: "Lato", style: "Limpo / Profissional", css: "'Lato', sans-serif" },
];

export function paletteToAppearanceFields(p: Palette) {
  return {
    selected_palette: p.id,
    primary_color: p.primary_color,
    secondary_color: p.secondary_color,
    accent_color: p.accent_color,
    bg_color: p.bg_color,
    text_color: p.text_color,
    button_color: p.button_color,
    button_text_color: p.button_text_color,
    header_bg_color: p.header_bg_color,
    header_text_color: p.header_text_color,
    footer_bg_color: p.footer_bg_color,
    footer_text_color: p.footer_text_color,
  };
}

export function applyThemeVars(el: HTMLElement, a: Record<string, any> | null | undefined) {
  if (!a) return;
  const set = (k: string, v: string | null | undefined, fallback: string) => {
    el.style.setProperty(k, (v ?? fallback));
  };
  set("--brand-primary", a.primary_color, "#111827");
  set("--brand-secondary", a.secondary_color, "#6b7280");
  set("--brand-accent", a.accent_color, "#f59e0b");
  set("--brand-bg", a.bg_color, "#ffffff");
  set("--brand-text", a.text_color, "#111827");
  set("--brand-button", a.button_color ?? a.primary_color, "#111827");
  set("--brand-button-text", a.button_text_color, "#ffffff");
  set("--brand-header-bg", a.header_bg_color ?? a.bg_color, "#ffffff");
  set("--brand-header-text", a.header_text_color ?? a.text_color, "#111827");
  set("--brand-footer-bg", a.footer_bg_color, "#111827");
  set("--brand-footer-text", a.footer_text_color, "#ffffff");
  set("--brand-card", a.card_color ?? "#ffffff", "#ffffff");
  set("--brand-whatsapp", a.whatsapp_color, "#25D366");
  set("--brand-radius", (a.border_radius ?? 8) + "px", "8px");
  if (a.font_family) {
    el.style.setProperty("--brand-font", `'${a.font_family}', system-ui, sans-serif`);
  }
}
