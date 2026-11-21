#!/usr/bin/env node

/*
 * Safe test-data seeder for Halo Salon.
 *
 * Defaults to a dry run. A write requires both --write and an explicit
 * SEED_CONFIRM value. It only creates records with the seed namespace and
 * never truncates or deletes data.
 */
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const bcrypt = require("bcrypt");
const { Pool } = require("pg");

const ROOT = path.resolve(__dirname, "..");
const CONFIRMATION = "SEED_HALO_DUMMY_DATA";
const SEED_PREFIX = "seed-hyd-";

function loadEnvFile(file) {
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!match || process.env[match[1]] !== undefined) continue;
    let value = match[2].trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    process.env[match[1]] = value;
  }
}

loadEnvFile(path.join(ROOT, ".env"));
loadEnvFile(path.resolve(ROOT, "..", ".env"));

function arg(name) {
  const prefix = `--${name}=`;
  const found = process.argv.find((value) => value.startsWith(prefix));
  return found ? found.slice(prefix.length) : null;
}

function hasFlag(name) {
  return process.argv.includes(`--${name}`);
}

function numberSetting(name, fallback) {
  const value = Number(process.env[`SEED_${name}`] ?? fallback);
  if (!Number.isInteger(value) || value < 0) throw new Error(`SEED_${name} must be a non-negative integer`);
  return value;
}

const target = arg("target") || process.env.SEED_TARGET || "local";
const write = hasFlag("write");
const cleanup = hasFlag("cleanup");
const counts = {
  salons: numberSetting("SALONS", 10),
  customers: numberSetting("CUSTOMERS", 100),
  appointments: numberSetting("APPOINTMENTS", 200),
  reviews: numberSetting("REVIEWS", 100),
  notifications: numberSetting("NOTIFICATIONS", 100),
  payments: numberSetting("PAYMENTS", 100),
};

if (!new Set(["local", "render-staging"]).has(target)) {
  throw new Error("SEED_TARGET must be local or render-staging");
}
if (cleanup && !write) throw new Error("Cleanup requires --write");
if (write && process.env.SEED_CONFIRM !== CONFIRMATION) {
  throw new Error(`Refusing to write. Set SEED_CONFIRM=${CONFIRMATION} explicitly.`);
}
if (target === "render-staging" && process.env.SEED_CONFIRM_TARGET !== "RENDER_STAGING") {
  throw new Error("Render writes also require SEED_CONFIRM_TARGET=RENDER_STAGING");
}
if (process.env.NODE_ENV === "production" && process.env.SEED_ALLOW_PRODUCTION !== "true") {
  throw new Error("Refusing to run with NODE_ENV=production. Use a staging database.");
}
if (write && process.env.DATABASE_URL) {
  let databaseHost = "";
  try {
    databaseHost = new URL(process.env.DATABASE_URL).hostname;
  } catch {
    throw new Error("DATABASE_URL is not a valid PostgreSQL URL");
  }
  const isRenderDatabase = /(^|\.)render\.com$|\.render\.internal$/.test(databaseHost);
  if (target === "local" && isRenderDatabase) {
    throw new Error("A Render database URL was detected. Use SEED_TARGET=render-staging explicitly.");
  }
  if (target === "render-staging" && !isRenderDatabase) {
    throw new Error("render-staging requires a Render PostgreSQL URL");
  }
}

const names = ["Ananya Rao", "Meera Nair", "Riya Sharma", "Kavya Reddy", "Priya Menon", "Ishita Kapoor", "Sneha Iyer", "Nandini Das", "Aarohi Singh", "Divya Patel"];
const locations = ["Madhapur", "Gachibowli", "Kukatpally", "Kondapur", "Miyapur", "Hitech City", "Banjara Hills", "Jubilee Hills", "Manikonda", "Begumpet"];
const salonNames = ["Aura & Arch Salon", "The Halo Studio", "Glow Theory", "Velvet Scissors", "Mane Street", "Blush & Bloom", "The Style Edit", "Crown & Curl", "Luxe Locks", "Urban Tress"];
const serviceCatalog = [
  ["Haircut", "Haircut", 45, 699], ["Hair Styling", "Hair Styling", 60, 999],
  ["Hair Colour", "Hair Colour", 120, 1999], ["Hair Spa", "Hair Spa", 60, 1499],
  ["Facial", "Skin Care", 60, 1299], ["Bridal Makeup", "Makeup", 180, 7999],
  ["Beard Styling", "Grooming", 30, 499], ["Manicure", "Nails", 45, 799],
  ["Pedicure", "Nails", 60, 999], ["Keratin Treatment", "Hair Treatment", 180, 4999],
];
const stylists = ["Meera Nair", "Arjun Varma", "Sana Khan", "Kiran Reddy", "Neha Kapoor"];
// These are public demo images so seeded mobile/web cards render immediately.
// Replace them with Cloudinary URLs for a production-like staging environment.
const salonImages = [
  "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1200&q=80",
  "https://images.unsplash.com/photo-1521590832167-7bcbda2c0ab3?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=1200&q=80",
  "https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?w=1200&q=80",
];
const serviceImages = [
  "https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1521590832167-7bcbda2c0ab3?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1605497788044-5a32c7078486?w=900&q=80",
  "https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=900&q=80",
  "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=900&q=80",
];
const stylistImages = [
  "https://images.unsplash.com/photo-1580618672591-eb180b1a973f?w=500&q=80",
  "https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=500&q=80",
  "https://images.unsplash.com/photo-1600334129128-685c5582fd35?w=500&q=80",
  "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=500&q=80",
  "https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=500&q=80",
];

function uuid(key) {
  const hex = crypto.createHash("sha256").update(`halo-seed:${key}`).digest("hex").slice(0, 32);
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-${((parseInt(hex.slice(16, 18), 16) & 0x3f) | 0x80).toString(16)}${hex.slice(18, 20)}-${hex.slice(20)}`;
}
function dateOffset(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}
function phone(index) { return `+919900${String(100000 + index).slice(-6)}`; }
function email(kind, index) { return `seed.${kind}.${String(index).padStart(3, "0")}@halo.test`; }
function pick(list, index) { return list[index % list.length]; }
function json(value) { return JSON.stringify(value); }

async function insert(client, table, columns, values) {
  const placeholders = values.map((_, index) => `$${index + 1}`).join(", ");
  const quotedColumns = columns.map((column) => `"${column}"`);
  const updates = columns
    .filter((column) => column !== "id")
    .map((column) => `"${column}" = EXCLUDED."${column}"`)
    .join(", ");
  const sql = `INSERT INTO "${table}" (${quotedColumns.join(", ")}) VALUES (${placeholders}) ON CONFLICT ("id") DO UPDATE SET ${updates}`;
  const result = await client.query(sql, values);
  return result.rowCount || 0;
}

function printPlan() {
  console.log("Halo Salon dummy-data seeder (dry run)");
  console.log(JSON.stringify({ target, counts, cleanup, write: false }, null, 2));
  console.log("No database connection was opened. Add --write with the required confirmation to apply it.");
}

async function cleanupSeed(client) {
  const tables = [
    ["ai_usage_logs", '"ownerEmail" LIKE \'seed.%@halo.test\''],
    ["ai_generation_jobs", '"ownerEmail" LIKE \'seed.%@halo.test\''],
    ["ai_style_recommendations", '"sessionId" IN (SELECT id FROM ai_style_sessions WHERE "ownerEmail" LIKE \'seed.%@halo.test\')'],
    ["ai_style_sessions", '"ownerEmail" LIKE \'seed.%@halo.test\''],
    ["membership_usages", '"membershipId" IN (SELECT id FROM memberships WHERE "guestEmail" LIKE \'seed.%@halo.test\')'],
    ["memberships", '"guestEmail" LIKE \'seed.%@halo.test\''],
    ["membership_plans", `"salonId" IN (SELECT id FROM salons WHERE "tenantCode" LIKE '${SEED_PREFIX}%')`],
    ["salon_wishlists", `"salonId" IN (SELECT id FROM salons WHERE "tenantCode" LIKE '${SEED_PREFIX}%')`],
    ["user_notifications", '"recipientUserId" IN (SELECT id FROM users WHERE email LIKE \'seed.%@halo.test\')'],
    ["device_push_tokens", '"userId" IN (SELECT id FROM users WHERE email LIKE \'seed.%@halo.test\')'],
    ["notifications", `"salonId" IN (SELECT id FROM salons WHERE "tenantCode" LIKE '${SEED_PREFIX}%')`],
    ["payments", `"salonId" IN (SELECT id FROM salons WHERE "tenantCode" LIKE '${SEED_PREFIX}%')`],
    ["reviews", `"salonId" IN (SELECT id FROM salons WHERE "tenantCode" LIKE '${SEED_PREFIX}%')`],
    ["appointments", `"salonId" IN (SELECT id FROM salons WHERE "tenantCode" LIKE '${SEED_PREFIX}%')`],
    ["audit_logs", `"salonId" IN (SELECT id FROM salons WHERE "tenantCode" LIKE '${SEED_PREFIX}%')`],
    ["passports", '"ownerEmail" LIKE \'seed.%@halo.test\''],
    ["referrals", '"code" LIKE \'SEED-%\''],
    ["coupons", 'code LIKE \'SEED-%\''],
    ["banners", `"salonId" IN (SELECT id FROM salons WHERE "tenantCode" LIKE '${SEED_PREFIX}%')`],
    ["consultations", `"salonId" IN (SELECT id FROM salons WHERE "tenantCode" LIKE '${SEED_PREFIX}%')`],
    ["users", 'email LIKE \'seed.%@halo.test\''],
    ["salons", `"tenantCode" LIKE '${SEED_PREFIX}%'`],
  ];
  const summary = {};
  for (const [table, where] of tables) {
    const result = await client.query(`DELETE FROM "${table}" WHERE ${where}`);
    summary[table] = result.rowCount || 0;
  }
  return summary;
}

async function seed(client) {
  const summary = {};
  const add = (table, count) => { summary[table] = (summary[table] || 0) + count; };
  const passwordHash = await bcrypt.hash(process.env.SEED_PASSWORD || "HaloTest@2026", 12);

  const platformId = uuid("platform-admin");
  add("users", await insert(client, "users", ["id", "name", "email", "passwordHash", "role", "adminApprovalStatus", "salonId", "phone", "location", "notificationPreferences", "emailVerified", "active"], [platformId, "Halo Platform Admin", email("platform.admin", 1), passwordHash, "platform_admin", "approved", null, "+919900000001", "Hyderabad", json({ email: true, push: true, whatsapp: true, appointmentReminders: true }), true, true]));

  const salonRows = [];
  for (let i = 0; i < counts.salons; i += 1) {
    const number = i + 1;
    const salonId = uuid(`salon-${number}`);
    const adminId = uuid(`admin-${number}`);
    const branchId = uuid(`branch-${number}`);
    const salonServices = serviceCatalog.map(([name]) => name);
    const details = serviceCatalog.map(([name, category, durationMinutes, price], serviceIndex) => ({ name, category, durationMinutes, price: price + i * 25, discountPercent: serviceIndex % 3 === 0 ? 10 : 0, discountPrice: serviceIndex % 3 === 0 ? Math.round((price + i * 25) * 0.9) : price + i * 25, offerText: serviceIndex % 3 === 0 ? "10% off this month" : undefined, imageUrl: pick(serviceImages, serviceIndex), active: true }));
    const branch = { id: branchId, name: "Main Branch", location: `${locations[i % locations.length]}, Hyderabad`, contact: phone(500 + i), active: true, latitude: 17.385 + (i * 0.008), longitude: 78.486 + (i * 0.007), openingHours: { open: "09:00", close: "20:00" }, closedDays: ["Sunday"], services: salonServices, stylists };
    const profiles = Object.fromEntries(stylists.map((stylist, stylistIndex) => [stylist, { bio: `${stylist} specialises in modern salon services.`, imageUrl: pick(stylistImages, stylistIndex) }]));
    const schedules = Object.fromEntries(stylists.map((stylist) => [stylist, { workingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"], leaveDates: [] }]));
    salonRows.push({ salonId, adminId, branchId, services: salonServices, details });
    add("salons", await insert(client, "salons", ["id", "tenantCode", "ownerId", "active", "referralRewardAmount", "name", "location", "services", "stylists", "serviceDetails", "products", "stylistSchedules", "stylistProfiles", "branches", "openingHours", "closedDays", "theme"], [salonId, `${SEED_PREFIX}${String(number).padStart(2, "0")}`, null, true, 150, salonNames[i % salonNames.length], `${locations[i % locations.length]}, Hyderabad`, json(salonServices), json(stylists), json(details), json([{ id: `product-${number}-1`, name: "Professional Hair Serum", description: "Salon-recommended aftercare", imageUrl: pick(serviceImages, i + 2), active: true }]), json(schedules), json(profiles), json([branch]), json({ open: "09:00", close: "20:00" }), json(["Sunday"]), json({ brandName: "halo", logoMark: "h", logoUrl: "", primary: "#b9533a", sidebar: "#20352d", surface: "#f7f5f0", ink: "#25372f" })]));
    add("users", await insert(client, "users", ["id", "name", "email", "passwordHash", "role", "adminApprovalStatus", "salonId", "phone", "location", "notificationPreferences", "emailVerified", "active"], [adminId, `${pick(names, i)} (Salon Admin)`, email("admin", number), passwordHash, "admin", "approved", salonId, phone(100 + i), `${locations[i % locations.length]}, Hyderabad`, json({ email: true, push: true, whatsapp: true, appointmentReminders: true }), true, true]));
    add("salons", (await client.query('UPDATE "salons" SET "ownerId" = $1 WHERE id = $2 AND "ownerId" IS NULL', [adminId, salonId])).rowCount || 0);
    add("audit_logs", await insert(client, "audit_logs", ["id", "actorEmail", "actorRole", "salonId", "action", "method", "path", "metadata"], [uuid(`audit-salon-${number}`), email("admin", number), "admin", salonId, "seeded_salon_setup", "POST", "/seed/dummy", json({ seed: true, tenantCode: `${SEED_PREFIX}${String(number).padStart(2, "0")}` })]));
  }

  // Keep one pending request so the platform-admin approval screen has a
  // realistic record. It is not an owner and cannot log in as an approved admin.
  add("users", await insert(client, "users", ["id", "name", "email", "passwordHash", "role", "adminApprovalStatus", "salonId", "phone", "location", "notificationPreferences", "emailVerified", "active"], [uuid("pending-admin"), "Pending Salon Applicant", email("admin.pending", 1), passwordHash, "admin", "pending", salonRows[0]?.salonId || null, phone(900), "Hyderabad", json({ email: true, push: true, whatsapp: true, appointmentReminders: true }), false, true]));

  const customers = [];
  for (let i = 0; i < counts.customers; i += 1) {
    const number = i + 1;
    const customerId = uuid(`customer-${number}`);
    const customerName = pick(names, i + 2);
    const customerEmail = email("customer", number);
    const customerSalon = salonRows[i % salonRows.length];
    customers.push({ id: customerId, name: customerName, email: customerEmail, phone: phone(1000 + i), salonId: customerSalon.salonId });
    add("users", await insert(client, "users", ["id", "name", "email", "passwordHash", "role", "adminApprovalStatus", "salonId", "phone", "location", "texture", "length", "preferredStylist", "notificationPreferences", "emailVerified", "active", "referralCredits"], [customerId, customerName, customerEmail, passwordHash, "user", "not_required", customerSalon.salonId, phone(1000 + i), `${pick(locations, i)}, Hyderabad`, pick(["Straight", "Wavy", "Curly"], i), pick(["Short", "Shoulder length", "Long"], i), pick(stylists, i), json({ email: true, push: true, whatsapp: true, appointmentReminders: true }), true, true, i % 4 === 0 ? 100 : 0]));
    add("passports", await insert(client, "passports", ["id", "salonId", "ownerEmail", "guestName", "location", "texture", "length", "preferredStylist", "preferences", "notes", "styles", "history", "beforeImage", "afterImage"], [uuid(`passport-${number}`), salonRows[i % salonRows.length].salonId, customerEmail, customerName, `${pick(locations, i)}, Hyderabad`, pick(["Straight", "Wavy", "Curly"], i), pick(["Short", "Shoulder length", "Long"], i), pick(stylists, i), json(["Low maintenance", "Natural finish"]), "Seeded customer profile", json([{ style: "Layered cut", date: dateOffset(-30) }]), json([{ service: "Haircut", date: dateOffset(-30) }]), "/images/hair-before.svg", "/images/hair-lob.svg"]));
  }

  for (let i = 0; i < counts.salons; i += 1) {
    const salon = salonRows[i];
    add("coupons", await insert(client, "coupons", ["id", "salonId", "code", "discountType", "discountValue", "maxUses", "usedCount", "active", "startsAt", "endsAt"], [uuid(`coupon-${i + 1}`), salon.salonId, `SEED-${String(i + 1).padStart(2, "0")}-WELCOME`, "percent", 15, 100, 3, true, new Date(), new Date(Date.now() + 90 * 86400000)]));
    add("banners", await insert(client, "banners", ["id", "salonId", "title", "message", "imageUrl", "actionLabel", "actionUrl", "active", "audience", "startsAt", "endsAt"], [uuid(`banner-${i + 1}`), salon.salonId, "New customer offer", "Enjoy 15% off your first salon visit.", pick(salonImages, i), "Book now", "/bookings", true, "guest", new Date(), new Date(Date.now() + 30 * 86400000)]));
    add("membership_plans", await insert(client, "membership_plans", ["id", "salonId", "name", "price", "sessionCount", "validityDays", "eligibleServices", "active"], [uuid(`plan-${i + 1}`), salon.salonId, "Glow Monthly", 2499, 3, 60, json(["Haircut", "Hair Spa", "Facial"]), true]));
  }

  const appointments = [];
  const appointmentStatuses = ["Requested", "Confirmed", "Cancelled"];
  for (let i = 0; i < counts.appointments; i += 1) {
    const customer = customers[i % customers.length];
    const salon = salonRows[i % salonRows.length];
    const service = pick(salon.details, i);
    const appointmentId = uuid(`appointment-${i + 1}`);
    // Booking concurrency enforces uniqueness across date, time, stylist,
    // and branch for Requested/Confirmed appointments. Give every generated
    // appointment its own date so changing counts can never collide.
    const date = i % 2 === 0 ? dateOffset(-(i / 2) - 1) : dateOffset((i + 1) / 2);
    const status = appointmentStatuses[i % appointmentStatuses.length];
    appointments.push({ id: appointmentId, customer, salon, service });
    add("appointments", await insert(client, "appointments", ["id", "salonId", "guestName", "guestEmail", "guestPhone", "customerId", "service", "branchId", "date", "time", "durationMinutes", "price", "couponCode", "stylist", "notes", "status"], [appointmentId, salon.salonId, customer.name, customer.email, customer.phone, customer.id, service.name, salon.branchId, date, `${String(9 + (i % 9)).padStart(2, "0")}:00`, service.durationMinutes, service.discountPrice || service.price, i % 5 === 0 ? `SEED-${String((i % counts.salons) + 1).padStart(2, "0")}-WELCOME` : null, pick(stylists, i), "Seed appointment for testing", status]));
  }

  for (let i = 0; i < Math.min(counts.customers, 30); i += 1) {
    const customer = customers[i];
    const salon = salonRows[i % salonRows.length];
    const completed = i % 3 !== 0;
    add("consultations", await insert(client, "consultations", ["id", "salonId", "guestName", "phone", "stylist", "goal", "length", "texture", "capturedViews", "report", "beforeImage", "afterImage", "selectedStyle", "selectedServices", "status"], [uuid(`consultation-${i + 1}`), salon.salonId, customer.name, customer.phone, pick(stylists, i), "A polished style for everyday wear", pick(["Short", "Shoulder length", "Long"], i), pick(["Straight", "Wavy", "Curly"], i), "front,left,right", completed ? json({ faceShape: "Soft oval", density: "Medium-full", recommendations: [{ name: "Soft textured lob", score: 92, tag: "Best match" }] }) : null, completed ? "/images/hair-before.svg" : null, completed ? "/images/hair-lob.svg" : null, completed ? "Soft textured lob" : "", completed ? json(["Signature cut", "Conditioning finish"]) : json([]), completed ? "complete" : "draft"]));
  }

  for (let i = 0; i < counts.reviews; i += 1) {
    const appointment = appointments[i % appointments.length];
    add("reviews", await insert(client, "reviews", ["id", "salonId", "guestEmail", "guestName", "appointmentId", "rating", "comment", "status"], [uuid(`review-${i + 1}`), appointment.salon.salonId, appointment.customer.email, appointment.customer.name, appointment.id, 3 + (i % 3), pick(["Great service and friendly staff.", "Clean salon and excellent styling.", "Loved the experience and the result."], i), i % 5 === 0 ? "Pending" : "Published"]));
  }

  for (let i = 0; i < Math.min(counts.customers, counts.salons * 3); i += 1) {
    add("salon_wishlists", await insert(client, "salon_wishlists", ["id", "userId", "salonId"], [uuid(`wishlist-${i + 1}`), customers[i].id, salonRows[i % salonRows.length].salonId]));
  }

  for (let i = 0; i < counts.payments; i += 1) {
    const appointment = appointments[i % appointments.length];
    const total = appointment.service.discountPrice || appointment.service.price;
    const status = ["Paid", "Pending", "Failed", "Refunded"][i % 4];
    add("payments", await insert(client, "payments", ["id", "salonId", "appointmentId", "guestEmail", "provider", "paymentMethod", "providerPaymentId", "idempotencyKey", "currency", "subtotal", "discount", "tax", "total", "status", "invoiceNumber", "paidAt", "refundedAt"], [uuid(`payment-${i + 1}`), appointment.salon.salonId, appointment.id, appointment.customer.email, "seed", "PAY_AT_SALON", null, `seed-payment-${i + 1}`, "INR", total, 0, 0, total, status, `SEED-INV-${String(i + 1).padStart(4, "0")}`, status === "Paid" ? new Date() : null, status === "Refunded" ? new Date() : null]));
  }

  for (let i = 0; i < counts.notifications; i += 1) {
    const appointment = appointments[i % appointments.length];
    const event = ["appointment_created", "appointment_confirmed", "appointment_reminder", "offer_available"][i % 4];
    add("notifications", await insert(client, "notifications", ["id", "salonId", "appointmentId", "recipientEmail", "recipientPhone", "channel", "event", "status", "attempts", "maxAttempts", "providerMessageId", "payload", "scheduledAt", "sentAt"], [uuid(`notification-${i + 1}`), appointment.salon.salonId, appointment.id, appointment.customer.email, appointment.customer.phone, i % 2 === 0 ? "email" : "whatsapp", event, "Sent", 1, 3, "seed-history", json({ seed: true, salonId: appointment.salon.salonId, appointmentId: appointment.id }), new Date(), new Date()]));
    add("user_notifications", await insert(client, "user_notifications", ["id", "recipientUserId", "salonId", "notificationType", "title", "message", "payload", "relatedEntityId", "isRead", "sentAt"], [uuid(`user-notification-${i + 1}`), appointment.customer.id, appointment.salon.salonId, event, "Salon update", `Your ${appointment.service.name} appointment has a test notification.`, json({ seed: true }), appointment.id, i % 3 === 0, new Date()]));
  }

  for (let i = 0; i < Math.min(counts.customers, 20); i += 1) {
    const customer = customers[i];
    const sessionId = uuid(`ai-session-${i + 1}`);
    const recommendationId = uuid(`ai-recommendation-${i + 1}`);
    add("ai_style_sessions", await insert(client, "ai_style_sessions", ["id", "ownerEmail", "photoAssetId", "consentGiven", "status", "profile", "preferences"], [sessionId, customer.email, uuid(`photo-${i + 1}`), true, "completed", json({ faceShape: "oval", texture: "wavy" }), json({ occasion: "everyday", length: "medium" })]));
    add("ai_style_recommendations", await insert(client, "ai_style_recommendations", ["id", "sessionId", "styleId", "name", "description", "reason", "maintenance", "serviceCategory", "rank", "matchReasons"], [recommendationId, sessionId, "layered-lob", "Layered Lob", "A polished layered look with natural movement.", "Works well with the customer profile.", "medium", "Haircut", 1, json(["Suits wavy texture", "Easy daily styling"])]));
    add("ai_generation_jobs", await insert(client, "ai_generation_jobs", ["id", "ownerEmail", "sessionId", "recommendationId", "idempotencyKey", "status", "provider", "model", "outputAssetId", "errorMessage"], [uuid(`ai-job-${i + 1}`), customer.email, sessionId, recommendationId, `seed-ai-job-${i + 1}`, "completed", "seed", "test-model", null, null]));
    add("ai_usage_logs", await insert(client, "ai_usage_logs", ["id", "ownerEmail", "sessionId", "action", "provider", "model", "success", "errorMessage"], [uuid(`ai-log-${i + 1}`), customer.email, sessionId, "style_recommendation", "seed", "test-model", true, null]));
  }

  const memberships = [];
  for (let i = 0; i < Math.min(counts.customers, counts.salons); i += 1) {
    const customer = customers[i];
    const salon = salonRows[i];
    const membershipId = uuid(`membership-${i + 1}`);
    memberships.push({ id: membershipId, customer, salon });
    add("memberships", await insert(client, "memberships", ["id", "salonId", "customerId", "guestEmail", "planId", "amountPaid", "totalSessions", "remainingSessions", "startsAt", "expiresAt", "status"], [membershipId, salon.salonId, customer.id, customer.email, uuid(`plan-${i + 1}`), 2499, 3, 2, dateOffset(-5), dateOffset(55), "active"]));
    add("membership_usages", await insert(client, "membership_usages", ["id", "membershipId", "salonId", "appointmentId", "service", "sessionsUsed", "serviceCost", "usedByEmail"], [uuid(`membership-usage-${i + 1}`), membershipId, salon.salonId, appointments[i % appointments.length].id, "Haircut", 1, 699, email("admin", i + 1)]));
    add("referrals", await insert(client, "referrals", ["id", "code", "referrerId", "salonId", "referredId", "status", "rewardAmount", "completedAt"], [uuid(`referral-${i + 1}`), `SEED-REF-${String(i + 1).padStart(3, "0")}`, customer.id, salon.salonId, customers[(i + 1) % customers.length].id, "completed", 100, new Date()]));
  }

  // Admin notification history is separate from customer history.
  for (let i = 0; i < salonRows.length; i += 1) {
    const adminId = uuid(`admin-${i + 1}`);
    add("user_notifications", await insert(client, "user_notifications", ["id", "recipientUserId", "salonId", "notificationType", "title", "message", "payload", "relatedEntityId", "isRead", "sentAt"], [uuid(`admin-notification-${i + 1}`), adminId, salonRows[i].salonId, "daily_summary", "Seeded salon activity", "Your salon has new test bookings and customer activity.", json({ seed: true }), null, i % 2 === 0, new Date()]));
  }
  return summary;
}

async function main() {
  if (!write) return printPlan();
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required for a write");
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: process.env.DATABASE_URL.includes("render.com") ? { rejectUnauthorized: false } : undefined });
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = cleanup ? await cleanupSeed(client) : await seed(client);
    await client.query("COMMIT");
    console.log(JSON.stringify({ target, operation: cleanup ? "cleanup" : "seed", counts: result }, null, 2));
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((error) => { console.error(`Seeder stopped: ${error.message}`); process.exitCode = 1; });
