import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// Day-2 foundation only. No public reads/writes before authentication is ready.
export default defineSchema({
  profiles: defineTable({
    tokenIdentifier: v.string(),
    displayName: v.string(),
    role: v.union(v.literal("artist"), v.literal("client")),
    bio: v.optional(v.string()),
    portfolioStorageIds: v.array(v.id("_storage")),
  }).index("by_identity", ["tokenIdentifier"]),
  requests: defineTable({
    clientId: v.id("profiles"),
    title: v.string(),
    description: v.string(),
    artType: v.literal("illustration"),
    pricePerArtistCents: v.int64(),
    artistSlots: v.number(),
    exampleStorageIds: v.array(v.id("_storage")),
    status: v.union(v.literal("draft"), v.literal("open"), v.literal("closed")),
  }).index("by_client", ["clientId"]),
});
