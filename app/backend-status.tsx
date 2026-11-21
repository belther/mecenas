"use client";

import { useState } from "react";
import { ConvexProvider, ConvexReactClient, useQuery } from "convex/react";
import { makeFunctionReference } from "convex/server";

const health = makeFunctionReference<"query", Record<string, never>, { status: string }>("health:check");

function ConnectedStatus() {
  const result = useQuery(health, {});
  return <span role="status">{result?.status === "ok" ? "Convex conectado" : "Conectando ao Convex…"}</span>;
}

export function BackendStatus() {
  const [client] = useState(() => process.env.NEXT_PUBLIC_CONVEX_URL
    ? new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL) : null);
  if (!client) return <span>Demo local · backend ainda não configurado</span>;
  return <ConvexProvider client={client}><ConnectedStatus /></ConvexProvider>;
}
