-- Migration: 0002_add_photo_url.sql
-- Description: Add photo_url column to players table for player cards

ALTER TABLE public.players ADD COLUMN IF NOT EXISTS photo_url text;
