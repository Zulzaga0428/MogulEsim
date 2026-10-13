import { pgTable, text, serial, timestamp, integer, boolean } from "drizzle-orm/pg-core";

export const heroSlidesTable = pgTable("hero_slides", {
  id: serial("id").primaryKey(),
  cloudflareId: text("cloudflare_id").notNull(),
  url: text("url").notNull(),
  altText: text("alt_text").notNull().default(""),
  sortOrder: integer("sort_order").notNull().default(0),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type HeroSlide = typeof heroSlidesTable.$inferSelect;
