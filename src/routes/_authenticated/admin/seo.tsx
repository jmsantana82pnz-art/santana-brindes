import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderModule } from "@/components/admin/PlaceholderModule";

export const Route = createFileRoute("/_authenticated/admin/seo")({
  component: () => (
    <PlaceholderModule
      title="SEO"
      description="Metadados globais, Open Graph, sitemap e robots."
      items={["Meta tags", "Open Graph", "Sitemap", "Robots"]}
    />
  ),
});
