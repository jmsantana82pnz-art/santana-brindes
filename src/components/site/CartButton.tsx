import { Link } from "@tanstack/react-router";
import { ShoppingCart } from "lucide-react";
import { useCart } from "@/hooks/useCart";

export function CartButton({ className }: { className?: string }) {
  const { count } = useCart();
  return (
    <Link
      to="/carrinho"
      className={
        "relative inline-flex items-center justify-center h-10 w-10 rounded-full hover:bg-muted transition " +
        (className ?? "")
      }
      aria-label="Carrinho"
    >
      <ShoppingCart className="h-5 w-5" />
      {count > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-bold rounded-full h-5 min-w-5 flex items-center justify-center px-1">
          {count}
        </span>
      )}
    </Link>
  );
}
