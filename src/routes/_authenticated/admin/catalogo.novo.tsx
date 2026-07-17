import { createFileRoute } from "@tanstack/react-router";
import { ProductEditor } from "@/components/admin/ProductEditor";

export const Route = createFileRoute("/_authenticated/admin/catalogo/novo")({
  component: () => <ProductEditor />,
});
