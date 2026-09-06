-- Add new roles to the Role enum (additive — existing 'user'/'admin' unchanged)
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'staff';
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'superadmin';
