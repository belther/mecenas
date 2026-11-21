import { queryGeneric } from "convex/server";

// Public operational signal only. No user data or deployment secrets.
export const check = queryGeneric({
  args: {},
  handler: async () => ({ status: "ok" as const }),
});
