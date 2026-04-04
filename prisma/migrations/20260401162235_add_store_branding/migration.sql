-- Migration: add_store_branding
-- Adds per-tenant branding fields to the Store model.
-- All fields are nullable to preserve backward compatibility with existing tenants.

ALTER TABLE "Store" ADD COLUMN IF NOT EXISTS "logoUrl"       TEXT;
ALTER TABLE "Store" ADD COLUMN IF NOT EXISTS "coverImageUrl" TEXT;
ALTER TABLE "Store" ADD COLUMN IF NOT EXISTS "phone"         TEXT;
ALTER TABLE "Store" ADD COLUMN IF NOT EXISTS "city"          TEXT;
ALTER TABLE "Store" ADD COLUMN IF NOT EXISTS "tagline"       TEXT;
