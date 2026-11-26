/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as applications from "../applications.js";
import type * as auth from "../auth.js";
import type * as deadlines from "../deadlines.js";
import type * as deliveries from "../deliveries.js";
import type * as deliveryFileRecords from "../deliveryFileRecords.js";
import type * as deliveryFiles from "../deliveryFiles.js";
import type * as disputes from "../disputes.js";
import type * as refunds from "../refunds.js";
import type * as reputation from "../reputation.js";
import type * as health from "../health.js";
import type * as http from "../http.js";
import type * as lib_access from "../lib/access.js";
import type * as lib_delivery from "../lib/delivery.js";
import type * as payments from "../payments.js";
import type * as pix from "../pix.js";
import type * as profiles from "../profiles.js";
import type * as requests from "../requests.js";
import type * as uploadRecords from "../uploadRecords.js";
import type * as uploads from "../uploads.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  applications: typeof applications;
  auth: typeof auth;
  deadlines: typeof deadlines;
  deliveries: typeof deliveries;
  deliveryFileRecords: typeof deliveryFileRecords;
  deliveryFiles: typeof deliveryFiles;
  disputes: typeof disputes;
  refunds: typeof refunds;
  reputation: typeof reputation;
  health: typeof health;
  http: typeof http;
  "lib/access": typeof lib_access;
  "lib/delivery": typeof lib_delivery;
  payments: typeof payments;
  pix: typeof pix;
  profiles: typeof profiles;
  requests: typeof requests;
  uploadRecords: typeof uploadRecords;
  uploads: typeof uploads;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {
  auth: import("@convex-dev/auth/_generated/component.js").ComponentApi<"auth">;
  authPassword: import("@convex-dev/auth/components/password/_generated/component.js").ComponentApi<"authPassword">;
  authUsername: import("@convex-dev/auth/components/username/_generated/component.js").ComponentApi<"authUsername">;
};
