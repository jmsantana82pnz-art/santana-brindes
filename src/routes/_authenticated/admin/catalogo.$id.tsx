import { createFileRoute } from "@tanstack/react-router";
import { ProductEditor } from "@/components/admin/ProductEditor";

export const Route = createFileRoute("/_authenticated/admin/catalogo/$id")({
  component: EditProduct,
});

function EditProduct() {
  const { id } = Route.useParams();
  return <ProductEditor productId={id} />;
}
