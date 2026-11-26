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
    // Set only by the synthetic demo seed (iteration 007) so it can remove its own rows.
    demo: v.optional(v.literal(true)),
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
    status: v.union(v.literal("pending"), v.literal("accepted"), v.literal("declined"), v.literal("expired")),
    respondBy: v.optional(v.number()),
  }).index("by_application", ["applicationId"])
    .index("by_response_deadline", ["status", "respondBy"])
    .index("by_request_status", ["requestId", "status"]),
  paymentIdentities: defineTable({
    clientId: v.id("profiles"),
    hash: v.string(),
  }).index("by_client", ["clientId"]).index("by_hash", ["hash"]),
  paymentAttempts: defineTable({
    offerId: v.id("offers"),
    reference: v.string(),
    amountCents: v.number(),
    phase: v.union(v.literal("checking"), v.literal("awaitingPix"), v.literal("replaceable"), v.literal("funded")),
    providerId: v.optional(v.string()),
    pixCode: v.optional(v.string()),
    qrImage: v.optional(v.string()),
    expiresAt: v.optional(v.number()),
    // A seeded demo payment: no provider charge exists and no provider call is made.
    demo: v.optional(v.literal(true)),
  }).index("by_offer", ["offerId"]).index("by_offer_phase", ["offerId", "phase"])
    .index("by_reference", ["reference"]).index("by_provider", ["providerId"]),
  paymentEvents: defineTable({
    eventId: v.string(),
    attemptId: v.id("paymentAttempts"),
    result: v.union(v.literal("funded"), v.literal("duplicate"), v.literal("conflict")),
  }).index("by_event", ["eventId"]),
  deliveryUploads: defineTable({
    offerId: v.id("offers"),
    artistId: v.id("profiles"),
    expectedVersion: v.number(),
    kind: v.union(v.literal("original"), v.literal("process")),
    storageId: v.id("_storage"),
    previewStorageId: v.optional(v.id("_storage")),
    contentType: v.string(),
    used: v.boolean(),
  }),
  deliveries: defineTable({
    offerId: v.id("offers"),
    version: v.number(),
    phase: v.union(v.literal("review"), v.literal("revision"), v.literal("approved"), v.literal("disputed"), v.literal("rejected")),
    licence: v.string(),
    reviewBy: v.optional(v.number()),
    revisions: v.array(v.object({ version: v.number(), note: v.string() })),
  }).index("by_offer", ["offerId"]).index("by_review_deadline", ["phase", "reviewBy"]),
  disputes: defineTable({
    offerId: v.id("offers"),
    paymentAttemptId: v.id("paymentAttempts"),
    version: v.number(),
    artistId: v.id("profiles"),
    clientId: v.id("profiles"),
    reason: v.string(),
    status: v.union(v.literal("open"), v.literal("dismissed"), v.literal("refundPending"), v.literal("refunded")),
    decisionNote: v.optional(v.string()),
    reviewer: v.optional(v.id("users")),
    decidedAt: v.optional(v.number()),
    refundRun: v.optional(v.number()),
    startedRun: v.optional(v.number()),
    refundSubmitted: v.optional(v.boolean()),
    refundJob: v.optional(v.id('_scheduled_functions')),
  }).index("by_offer", ["offerId"]).index("by_status", ["status"]),
  deliveryVersions: defineTable({
    offerId: v.id("offers"),
    version: v.number(),
    originalId: v.id("deliveryUploads"),
    processIds: v.array(v.id("deliveryUploads")),
  }).index("by_offer_version", ["offerId", "version"]),
  deliveryReleases: defineTable({
    offerId: v.id("offers"),
    version: v.number(),
    paymentAttemptId: v.id("paymentAttempts"),
    amountCents: v.number(),
    currency: v.literal("BRL"),
    reason: v.optional(v.union(v.literal("manual"), v.literal("deadline"), v.literal("dismissed"))),
    licence: v.string(),
  }).index("by_offer", ["offerId"]),
});
