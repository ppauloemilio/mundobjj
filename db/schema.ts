import {
  boolean,
  date,
  index,
  integer,
  numeric,
  pgEnum,
  pgTable,
  primaryKey,
  smallint,
  text,
  time,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const beltEnum = pgEnum("belt", [
  "white",
  "blue",
  "purple",
  "brown",
  "black",
  "gray",
  "yellow",
  "orange",
  "green",
]);

export const trainingStyleEnum = pgEnum("training_style", [
  "gi",
  "nogi",
  "both",
]);

export const membershipStatusEnum = pgEnum("membership_status", [
  "active",
  "pending",
  "left",
]);

export const classKindEnum = pgEnum("class_kind", [
  "fundamentals",
  "gi",
  "nogi",
  "competition",
  "kids",
  "open_mat",
]);

export const supportStatusEnum = pgEnum("support_status", ["pending", "paid"]);

export const sponsorPlacementEnum = pgEnum("sponsor_placement", [
  "home",
  "city",
  "academy",
  "vitrine",
]);

export const userRoleEnum = pgEnum("user_role", ["user", "admin"]);

export const accountTypeEnum = pgEnum("account_type", [
  "athlete",
  "academy",
  "professor",
  "admin",
]);

export const suggestionStatusEnum = pgEnum("suggestion_status", [
  "pending",
  "approved",
  "rejected",
]);

export const locationKindEnum = pgEnum("location_kind", [
  "country",
  "state",
  "city",
]);

export const users = pgTable("user", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").unique(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: text("image"),
  passwordHash: text("password_hash"),
  role: userRoleEnum("role").notNull().default("user"),
  accountType: accountTypeEnum("account_type").notNull().default("athlete"),
  blockedAt: timestamp("blocked_at", { mode: "date" }),
});

export const accounts = pgTable(
  "account",
  {
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => [
    primaryKey({ columns: [account.provider, account.providerAccountId] }),
  ],
);

export const sessions = pgTable("session", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
  "verificationToken",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (verificationToken) => [
    primaryKey({
      columns: [verificationToken.identifier, verificationToken.token],
    }),
  ],
);

export const countries = pgTable("countries", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  iso2: text("iso2").notNull().unique(),
});

export const states = pgTable(
  "states",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    countryId: uuid("country_id")
      .notNull()
      .references(() => countries.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    code: text("code").notNull(),
  },
  (table) => [
    uniqueIndex("states_country_code_idx").on(table.countryId, table.code),
  ],
);

export const cities = pgTable(
  "cities",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    stateId: uuid("state_id")
      .notNull()
      .references(() => states.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
  },
  (table) => [
    uniqueIndex("cities_state_name_idx").on(table.stateId, table.name),
  ],
);

export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  cityId: uuid("city_id").references(() => cities.id),
  belt: beltEnum("belt").notNull().default("white"),
  stripes: smallint("stripes").notNull().default(0),
  weightKg: numeric("weight_kg", { precision: 5, scale: 2 }),
  style: trainingStyleEnum("style").notNull().default("both"),
  competitor: boolean("competitor").notNull().default(false),
  bio: text("bio"),
  startedAt: date("started_at"),
  whatsapp: text("whatsapp"),
  contactEmail: text("contact_email"),
  showWhatsapp: boolean("show_whatsapp").notNull().default(false),
  showEmail: boolean("show_email").notNull().default(false),
  supporterUntil: date("supporter_until"),
  showInSupportersList: boolean("show_in_supporters_list")
    .notNull()
    .default(false),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  onboardingCompletedAt: timestamp("onboarding_completed_at", { mode: "date" }),
});

export const academies = pgTable(
  "academies",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull().unique(),
    name: text("name").notNull(),
    affiliation: text("affiliation"),
    professorName: text("professor_name"),
    whatsapp: text("whatsapp"),
    address: text("address"),
    postalCode: text("postal_code"),
    street: text("street"),
    streetNumber: text("street_number"),
    complement: text("complement"),
    neighborhood: text("neighborhood"),
    cityId: uuid("city_id").references(() => cities.id),
    lat: numeric("lat", { precision: 9, scale: 6 }),
    lng: numeric("lng", { precision: 9, scale: 6 }),
    acceptsVisitor: boolean("accepts_visitor").notNull().default(false),
    dropInPrice: numeric("drop_in_price", { precision: 10, scale: 2 }),
    visitorNotes: text("visitor_notes"),
    ownerId: text("owner_id").references(() => users.id),
    claimToken: text("claim_token").unique(),
    claimedAt: timestamp("claimed_at", { mode: "date" }),
    blockedAt: timestamp("blocked_at", { mode: "date" }),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => [
    index("academies_city_idx").on(table.cityId),
    index("academies_lat_lng_idx").on(table.lat, table.lng),
  ],
);

export const classSchedules = pgTable(
  "class_schedules",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    academyId: uuid("academy_id")
      .notNull()
      .references(() => academies.id, { onDelete: "cascade" }),
    weekday: smallint("weekday").notNull(),
    startsAt: time("starts_at").notNull(),
    endsAt: time("ends_at").notNull(),
    kind: classKindEnum("kind").notNull(),
    level: text("level"),
    professorName: text("professor_name"),
    professorProfileId: uuid("professor_profile_id").references(
      () => profiles.id,
      { onDelete: "set null" },
    ),
  },
  (table) => [index("class_schedules_academy_idx").on(table.academyId)],
);

export const academyProfessors = pgTable(
  "academy_professors",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    academyId: uuid("academy_id")
      .notNull()
      .references(() => academies.id, { onDelete: "cascade" }),
    professorProfileId: uuid("professor_profile_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    status: membershipStatusEnum("status").notNull().default("pending"),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("academy_professors_academy_professor_idx").on(
      table.academyId,
      table.professorProfileId,
    ),
    index("academy_professors_academy_idx").on(table.academyId),
  ],
);

export const athleteProfessors = pgTable(
  "athlete_professors",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    profileId: uuid("profile_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    professorProfileId: uuid("professor_profile_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    academyId: uuid("academy_id")
      .notNull()
      .references(() => academies.id, { onDelete: "cascade" }),
    status: membershipStatusEnum("status").notNull().default("active"),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("athlete_professors_profile_academy_idx").on(
      table.profileId,
      table.academyId,
    ),
    index("athlete_professors_profile_idx").on(table.profileId),
  ],
);

export const memberships = pgTable(
  "memberships",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    profileId: uuid("profile_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    academyId: uuid("academy_id")
      .notNull()
      .references(() => academies.id, { onDelete: "cascade" }),
    status: membershipStatusEnum("status").notNull().default("pending"),
    startedAt: date("started_at"),
    endedAt: date("ended_at"),
  },
  (table) => [
    index("memberships_profile_idx").on(table.profileId),
    index("memberships_academy_idx").on(table.academyId),
  ],
);

export const businessCategories = pgTable("business_categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  active: boolean("active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const businesses = pgTable(
  "businesses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull().unique(),
    name: text("name").notNull(),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => businessCategories.id),
    cityId: uuid("city_id").references(() => cities.id),
    address: text("address"),
    lat: numeric("lat", { precision: 9, scale: 6 }),
    lng: numeric("lng", { precision: 9, scale: 6 }),
    whatsapp: text("whatsapp"),
    link: text("link"),
    sponsored: boolean("sponsored").notNull().default(true),
    startsAt: date("starts_at"),
    endsAt: date("ends_at"),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => [
    index("businesses_category_idx").on(table.categoryId),
    index("businesses_city_idx").on(table.cityId),
    index("businesses_lat_lng_idx").on(table.lat, table.lng),
  ],
);

export const sponsors = pgTable("sponsors", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  logoUrl: text("logo_url"),
  link: text("link"),
  placement: sponsorPlacementEnum("placement").notNull(),
  categoryId: uuid("category_id").references(() => businessCategories.id),
  amount: numeric("amount", { precision: 10, scale: 2 }),
  startsAt: date("starts_at"),
  endsAt: date("ends_at"),
  active: boolean("active").notNull().default(true),
});

export const supportPayments = pgTable("support_payments", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  status: supportStatusEnum("status").notNull().default("pending"),
  providerChargeId: text("provider_charge_id"),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  paidAt: timestamp("paid_at", { mode: "date" }),
});

export const locationSuggestions = pgTable("location_suggestions", {
  id: uuid("id").primaryKey().defaultRandom(),
  kind: locationKindEnum("kind").notNull(),
  name: text("name").notNull(),
  countryIso2: text("country_iso2"),
  countryName: text("country_name"),
  stateId: uuid("state_id").references(() => states.id),
  stateName: text("state_name"),
  suggestedByUserId: text("suggested_by_user_id").references(() => users.id, {
    onDelete: "set null",
  }),
  status: suggestionStatusEnum("status").notNull().default("pending"),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
});

export const academySuggestions = pgTable("academy_suggestions", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  cityText: text("city_text"),
  contact: text("contact"),
  notes: text("notes"),
  suggestedByUserId: text("suggested_by_user_id").references(() => users.id, {
    onDelete: "set null",
  }),
  status: suggestionStatusEnum("status").notNull().default("pending"),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
});

export const professorSuggestions = pgTable("professor_suggestions", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  academyId: uuid("academy_id").references(() => academies.id, {
    onDelete: "set null",
  }),
  academyName: text("academy_name"),
  contact: text("contact"),
  notes: text("notes"),
  suggestedByUserId: text("suggested_by_user_id").references(() => users.id, {
    onDelete: "set null",
  }),
  status: suggestionStatusEnum("status").notNull().default("pending"),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
});

export const academyAccessRequests = pgTable(
  "academy_access_requests",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    academyId: uuid("academy_id")
      .notNull()
      .references(() => academies.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    email: text("email").notNull(),
    whatsapp: text("whatsapp"),
    message: text("message"),
    status: suggestionStatusEnum("status").notNull().default("pending"),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => [index("academy_access_requests_academy_idx").on(table.academyId)],
);
