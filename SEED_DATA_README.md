# Seed Data Instructions

There are **two ways** to populate sample data for the DocuBuild trial:

---

## Option 1: TypeScript Seed Script (Recommended)

### Prerequisites
```bash
npm install -D tsx
```

### Steps

1. **Make sure you have an admin user**
   - Sign up at least one user
   - Go to Supabase → Table Editor → `profiles`
   - Update their `role` to `'admin'`

2. **Run the seed script**
   ```bash
   npx tsx scripts/seed.ts
   ```

3. **What it creates:**
   - ✅ 4 demo users (admin, approver, staff, viewer)
   - ✅ 4 sample projects
   - ✅ 20 sample document records
   - ✅ Audit logs for all actions

4. **Demo Login Credentials:**
   ```
   Admin:    admin@docubuild-demo.com / demo123456
   Approver: approver@docubuild-demo.com / demo123456
   Staff:    staff@docubuild-demo.com / demo123456
   Viewer:   viewer@docubuild-demo.com / demo123456
   ```

### ⚠️ Important Notes

- **Actual files are NOT uploaded** - only database records are created
- Document metadata points to `demo/filename.pdf` paths that don't exist
- **To complete the demo:** Upload real PDF files through the UI
- **Or:** Manually upload files to Supabase Storage at the paths referenced

---

## Option 2: SQL Seed Script (Manual)

### Steps

1. **Create projects**
   - Open Supabase → SQL Editor
   - Open `scripts/seed-simple.sql`
   - Replace `YOUR_USER_ID_HERE` with your actual user ID
   - Run the SQL

2. **Get IDs**
   ```sql
   SELECT id, name FROM projects ORDER BY created_at DESC LIMIT 4;
   SELECT id, name FROM categories;
   ```

3. **Insert documents**
   - Use the IDs from step 2
   - Insert document records manually

---

## Quick Demo Setup (5 minutes)

**For client trial, here's the fastest way:**

1. **Run seed script:** `npx tsx scripts/seed.ts`
2. **Login as admin:** admin@docubuild-demo.com / demo123456
3. **Upload 5-10 real PDFs** through the Documents page
4. **Create 1-2 additional projects** through the Projects page
5. **Done!** App looks populated and realistic

---

## What Gets Created

### Users (4)
- Admin User (admin role) - can do everything
- Maria Santos (approver role) - can approve documents
- Juan dela Cruz (staff role) - can upload documents
- Pedro Reyes (viewer role) - can only view

### Projects (4)
- Main Office Building Construction (PROJ-2025-001)
- Highway Expansion Project (PROJ-2025-002)
- Residential Complex - Phase 1 (PROJ-2025-003)
- Bridge Rehabilitation (PROJ-2024-087)

### Document Records (20)
- Payment vouchers, site reports, contracts
- Permits, drawings, photos, invoices
- Distributed across all 4 projects
- All categories represented

### Categories (8 - already in schema)
- Payment Vouchers
- Site Reports
- Contracts
- Invoices
- Permits
- Drawings
- Photos
- Correspondence

---

## Troubleshooting

**Error: "No admin user found"**
- Create a user through signup
- Update their role to 'admin' in Supabase dashboard

**Error: "User might already exist"**
- Demo users already created, this is fine
- Script continues with projects/documents

**Error: "Missing Supabase credentials"**
- Check `.env.local` has correct values
- Make sure you're running from project root

---

## Clean Up Demo Data

**To remove all seed data:**

```sql
-- Delete demo documents
DELETE FROM documents WHERE file_path LIKE 'demo/%';

-- Delete demo projects
DELETE FROM projects WHERE project_code LIKE 'PROJ-%';

-- Delete demo users (in Supabase Dashboard → Authentication → Users)
-- Search for @docubuild-demo.com and delete manually
```

---

## For Production Trial

**Before sending to client:**

1. Run seed script to populate data
2. Upload 10-20 real construction PDFs
3. Test all workflows (upload, download, approve, etc.)
4. Create client admin account
5. Share login credentials securely
6. Schedule demo call to walk them through

---

**Questions?** Check the main README or contact support.
