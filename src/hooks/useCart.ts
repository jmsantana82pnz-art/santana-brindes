import { useEffect, useState, useCallback } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getCart, addToCart, updateCartItem, removeCartItem } from "@/lib/orders.functions";

const KEY = "cart_session_id";

export function getSessionId(): string {
  if (typeof window === "undefined") return "";
  let id = window.localStorage.getItem(KEY);
  if (!id) {
    id = crypto.randomUUID();
    window.localStorage.setItem(KEY, id);
  }
  return id;
}

export function useCart() {
  const [sessionId, setSessionId] = useState("");
  useEffect(() => setSessionId(getSessionId()), []);

  const getCartFn = useServerFn(getCart);
  const addFn = useServerFn(addToCart);
  const updateFn = useServerFn(updateCartItem);
  const removeFn = useServerFn(removeCartItem);
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["cart", sessionId],
    queryFn: () => getCartFn({ data: { sessionId } }),
    enabled: !!sessionId,
  });

  const invalidate = (sid = sessionId) => qc.invalidateQueries({ queryKey: ["cart", sid] });

  const add = useCallback(
    async (productId: string, qty = 1) => {
      const sid = sessionId || getSessionId();
      if (!sessionId) setSessionId(sid);
      await addFn({ data: { sessionId: sid, productId, qty } });
      invalidate(sid);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sessionId, addFn],
  );

  const update = useCallback(
    async (itemId: string, qty: number) => {
      const sid = sessionId || getSessionId();
      if (!sessionId) setSessionId(sid);
      await updateFn({ data: { sessionId: sid, itemId, qty } });
      invalidate(sid);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [updateFn],
  );

  const remove = useCallback(
    async (itemId: string) => {
      const sid = sessionId || getSessionId();
      if (!sessionId) setSessionId(sid);
      await removeFn({ data: { sessionId: sid, itemId } });
      invalidate(sid);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [removeFn],
  );

  const items = (query.data?.items ?? []) as any[];
  const total = items.reduce((s, i) => s + i.qty * i.unit_price_cents, 0);
  const count = items.reduce((s, i) => s + i.qty, 0);

  return { sessionId, items, total, count, isLoading: query.isLoading, add, update, remove, refetch: query.refetch };
}
