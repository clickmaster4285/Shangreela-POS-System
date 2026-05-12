import { useEffect, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/auth/AuthContext";
import { POS_REALTIME_EVENT } from "@/hooks/pos/use-pos-realtime";
import socket from "@/lib/socket/socket";

function invalidateForScopes(
  qc: ReturnType<typeof useQueryClient>,
  scopes: string[]
) {
  const s = new Set(scopes);
  const hit = (x: string) => s.has("all") || s.has(x);

  if (
    hit("orders") ||
    hit("tables") ||
    hit("deliveries") ||
    hit("menu") ||
    hit("floors") ||
    hit("inventory") ||
    hit("expenses") ||
    hit("hr")
  ) {
    qc.invalidateQueries({ queryKey: ["dashboard-overview"] });
    qc.invalidateQueries({ queryKey: ["reports-dashboard"] });
    qc.invalidateQueries({ queryKey: ["analytics-dashboard"] });
  }

  if (hit("orders") || hit("deliveries")) {
    qc.invalidateQueries({ queryKey: ["deliveries"] });
    qc.invalidateQueries({ queryKey: ["orders-management"] });
  }

  if (hit("orders") || hit("tables")) {
    qc.invalidateQueries({ queryKey: ["pos-tables"] });
    qc.invalidateQueries({ queryKey: ["pos-init-data"] });
    qc.invalidateQueries({ queryKey: ["orders-init-data"] });
    qc.invalidateQueries({ queryKey: ["order-mgmt-init"] });
  }

  if (hit("menu")) {
    qc.invalidateQueries({ queryKey: ["pos-menu-items"] });
    qc.invalidateQueries({ queryKey: ["pos-init-data"] });
    qc.invalidateQueries({ queryKey: ["orders-init-data"] });
    qc.invalidateQueries({ queryKey: ["order-mgmt-init"] });
  }

  if (hit("floors") || hit("tables")) {
    qc.invalidateQueries({ queryKey: ["floors-list"] });
    qc.invalidateQueries({ queryKey: ["pos-floors"] });
    qc.invalidateQueries({ queryKey: ["pos-init-data"] });
    qc.invalidateQueries({ queryKey: ["orders-init-data"] });
    qc.invalidateQueries({ queryKey: ["order-mgmt-init"] });
  }

  if (hit("users")) {
    qc.invalidateQueries({ queryKey: ["orders-init-data"] });
    qc.invalidateQueries({ queryKey: ["order-mgmt-init"] });
  }
}

function dispatchLocal(scopes: string[]) {
  window.dispatchEvent(new CustomEvent(POS_REALTIME_EVENT, { detail: { scopes } }));
}

/** Subscribes to backend Socket.IO and syncs TanStack Query + a window event for non-Query screens. */
export function PosRealtimeProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient();
  const { user } = useAuth();
  const uid = user?.id;

  useEffect(() => {
    const handlePosSocket = (eventName: string, ...args: unknown[]) => {
      if (!eventName.startsWith("pos_") || !eventName.endsWith("_changed")) return;
      const payload = args[0] as { scopes?: string[] } | undefined;
      const scopes = payload?.scopes ?? [];
      if (!scopes.length) return;
      invalidateForScopes(qc, scopes);
      dispatchLocal(scopes);
    };

    if (!uid) {
      socket.offAny(handlePosSocket);
      if (socket.connected) socket.disconnect();
      return;
    }

    socket.connect();
    socket.onAny(handlePosSocket);

    return () => {
      socket.offAny(handlePosSocket);
      socket.disconnect();
    };
  }, [uid, qc]);

  return <>{children}</>;
}

