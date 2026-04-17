import { useEffect, useRef } from "react";

export const POS_REALTIME_EVENT = "pos-realtime";

export type PosRealtimeScope =
  | "orders"
  | "tables"
  | "menu"
  | "floors"
  | "deliveries"
  | "dashboard"
  | "inventory"
  | "expenses"
  | "hr"
  | "users"
  | "permissions"
  | "giftcards"
  | "loyalty"
  | "settings"
  | "fbr"
  | "mobile"
  | "all";

/** Refetch local UI when another workstation changes data (via {@link POS_REALTIME_EVENT}). */
export function usePosRealtimeScopes(wanted: PosRealtimeScope[], onMatch: () => void) {
  const cbRef = useRef(onMatch);
  cbRef.current = onMatch;
  const wantedRef = useRef(wanted);
  wantedRef.current = wanted;

  useEffect(() => {
    const handler = (ev: Event) => {
      const ce = ev as CustomEvent<{ scopes?: string[] }>;
      const scopes = ce.detail?.scopes ?? [];
      if (!scopes.length) return;
      const want = wantedRef.current;
      const hit =
        scopes.includes("all") ||
        want.some((w) => w === "all" || scopes.includes(w));
      if (hit) cbRef.current();
    };
    window.addEventListener(POS_REALTIME_EVENT, handler);
    return () => window.removeEventListener(POS_REALTIME_EVENT, handler);
  }, []);
}
