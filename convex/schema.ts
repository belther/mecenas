import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// Illustration-only demonstration. Actor ownership is checked in backend functions.
export default defineSchema({
  users: defineTable({}),
  profiles: defineTable({
    userId: v.id("users"),
    displayName: v.string(),
    role: v.union(v.literal("artist"), v.literal("client")),
    bio: v.optional(v.string()),
    portfolioStorageIds: v.array(v.id("_storage")),
    portfolioUploadIds: v.array(v.id("uploads")),
  }).index("by_user", ["userId"]),
  uploads: defineTable({
    userId: v.id("users"), storageId: v.id("_storage"),
    purpose: v.union(v.literal("portfolio"), v.literal("reference")),
    contentType: v.string(), size: v.number(),
  }).index("by_user", ["userId"]),
  requests: defineTable({
    clientId: v.id("profiles"),
    title: v.string(),
    description: v.string(),
    artType: v.literal("illustration"),
    pricePerArtistCents: v.number(),
    artistSlots: v.number(),
    exampleStorageIds: v.array(v.id("_storage")),
    exampleUploadIds: v.array(v.id("uploads")),
    status: v.union(v.literal("draft"), v.literal("open"), v.literal("closed")),
  }).index("by_client", ["clientId"]).index("by_status", ["status"]),
  applications: defineTable({
    requestId: v.id("requests"),
    artistId: v.id("profiles"),
  }).index("by_request_artist", ["requestId", "artistId"])
    .index("by_artist", ["artistId"]),
  selections: defineTable({
    requestId: v.id("requests"),
    revision: v.number(),
    queue: v.array(v.id("applications")),
  }).index("by_request", ["requestId"]),
  offers: defineTable({
    applicationId: v.id("applications"),
    requestId: v.id("requests"),
    slot: v.number(),
    pricePerArtistCents: v.number(),
    status: v.union(v.literal("pending"), v.literal("accepted"), v.literal("declined")),
  }).index("by_application", ["applicationId"])
    .index("by_request_status", ["requestId", "status"]),
});
