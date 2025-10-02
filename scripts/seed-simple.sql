-- Simple SQL Seed Data Script
-- Run this in Supabase SQL Editor if you prefer SQL over TypeScript

-- Note: Users must be created through auth.users (signup flow)
-- This script only creates projects and document metadata

-- Insert sample projects (replace YOUR_USER_ID with your actual user ID)
INSERT INTO projects (name, description, project_code, status, created_by) VALUES
(
  'Main Office Building Construction',
  'Construction of new 5-story office building in Makati',
  'PROJ-2025-001',
  'active',
  'YOUR_USER_ID_HERE'
),
(
  'Highway Expansion Project',
  'Government contract for highway widening in Metro Manila',
  'PROJ-2025-002',
  'active',
  'YOUR_USER_ID_HERE'
),
(
  'Residential Complex - Phase 1',
  '50-unit residential development in Quezon City',
  'PROJ-2025-003',
  'active',
  'YOUR_USER_ID_HERE'
),
(
  'Bridge Rehabilitation',
  'Repair and strengthening of existing bridge structure',
  'PROJ-2024-087',
  'active',
  'YOUR_USER_ID_HERE'
);

-- Get project and category IDs for document insertion
-- First, check your project IDs:
-- SELECT id, name FROM projects ORDER BY created_at DESC LIMIT 4;

-- Get category IDs:
-- SELECT id, name FROM categories;

-- Then insert sample documents (replace IDs below)
-- Example format:
/*
INSERT INTO documents (
  title,
  file_name,
  file_path,
  file_size,
  file_type,
  project_id,
  category_id,
  status,
  uploaded_by
) VALUES
(
  'Payment Voucher - January 2025',
  'payment-voucher-january-2025.pdf',
  'demo/payment-voucher-january-2025.pdf',
  2500000,
  'application/pdf',
  'PROJECT_ID_HERE',
  'PAYMENT_VOUCHER_CATEGORY_ID_HERE',
  'draft',
  'YOUR_USER_ID_HERE'
);
*/

-- Repeat for multiple documents...
