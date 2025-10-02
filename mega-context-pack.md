# DocuBuild - Mega Context Pack

**Last Updated:** October 3, 2025
**Project Status:** MVP 100% Complete - Ready for Client Trial
**Developer:** Jan Oliver Santos
**Client:** Small Philippine Construction Company (~20 users)

---

## <¯ Project Overview

### What is DocuBuild?
DocuBuild is a cloud-based construction document management system designed specifically for small to medium Philippine construction companies transitioning from paper to digital workflows.

### Target Client
- **Industry:** Construction (residential, commercial, government contracts)
- **Size:** ~20 users (admin, approvers, staff, viewers)
- **Location:** Philippines
- **Pain Points:**
  - Paper-based document management
  - Lost documents and version control issues
  - No audit trail for government compliance
  - Difficulty tracking document approvals
  - Need for secure cloud storage

### Business Model
**Pricing Strategy (Hybrid Model):**
- Setup Fee: ±133,000 (one-time)
- Monthly Subscription: ±24,000/month for 20 users (±1,200/user/month)
- Total Year 1: ±421,000

**Trial Period:**
- 1-week free trial (extendable to 14 days)
- No credit card required
- Full feature access

---

## =à Technical Stack

### Frontend
- **Framework:** Next.js 15.5.4 with App Router
- **Language:** TypeScript 5.x
- **Styling:** Tailwind CSS 4.x
- **UI Components:** Custom components with Lucide React icons
- **File Upload:** react-dropzone 14.3.8
- **Date Formatting:** date-fns 4.1.0

### Backend
- **Database:** Supabase PostgreSQL (Singapore region)
- **Authentication:** Supabase Auth with JWT tokens
- **Storage:** Supabase Storage with signed URLs
- **API:** Supabase JS Client (@supabase/supabase-js 2.58.0)

### DevOps
- **Hosting:** Vercel (auto-deploy from GitHub)
- **Version Control:** GitHub
- **Environment:** Node.js 20.x
- **Package Manager:** npm

### Security
- Row Level Security (RLS) policies on all tables
- JWT-based authentication
- Role-based access control (RBAC)
- Signed URLs for temporary file access (1 hour expiry)
- Audit logging for compliance

---

##  Completed Features (100%)

### 1. Authentication & User Management
- **User Signup/Login:** Email and password authentication
- **Roles:** Admin, Approver, Staff, Viewer
- **Profile Management:** Auto-created profiles with role assignment
- **Protected Routes:** Redirect unauthenticated users to login
- **Session Management:** Persistent login with JWT tokens

### 2. Document Management
- **File Upload:**
  - Drag-and-drop interface with react-dropzone
  - **Editable file names before upload** (NEW!)
  - Shows preview with customizable document names
  - Removes file extension from default name
  - Supports: PDF, Word, Excel, Images (Max 50MB)
  - Project and category assignment

- **Document List:**
  - Search by document name
  - Filter by project and category
  - Display metadata: file size, upload date, uploader, status
  - Status badges (draft, pending, approved, rejected)
  - Mobile-responsive layout with proper stacking

- **Document Actions:**
  - **View Button:** Opens images in lightbox, PDFs in new tab (NEW!)
  - **Download Button:** Force downloads file
  - **Delete Button:** Admin and uploader only
  - **Request Approval Button:** For draft documents

- **Image Lightbox Viewer** (NEW!)
  - Fullscreen modal for image viewing
  - Black overlay background
  - Close button and click-outside-to-close
  - Download button in viewer
  - Smooth user experience for site photos

### 3. Document Approval Workflow
- **Request Approval:**
  - Select approver from list (approvers and admins)
  - Add optional comments
  - Updates document status to "pending"
  - Sends to approver's queue

- **Approval Page** (/dashboard/approvals):
  - Only accessible to approvers and admins
  - Pending approvals section with count
  - Completed approvals section
  - Approve/Reject buttons with response comments
  - Mobile-responsive with stacked layout
  - Shows requester info and request date

- **Status Tracking:**
  - Draft ’ Pending ’ Approved/Rejected
  - Color-coded status badges
  - Audit trail logging for all actions

### 4. Project & Category Management
- **Projects:**
  - Create, Read, Update, Delete (CRUD)
  - Project code assignment
  - Associate documents with projects
  - Filter documents by project

- **Categories:**
  - 8 pre-defined categories:
    - Payment Vouchers
    - Site Reports
    - Contracts
    - Invoices
    - Permits
    - Drawings
    - Photos
    - Correspondence
  - Admin can manage categories
  - Filter documents by category

### 5. Dashboard
- **Statistics Cards:**
  - Total documents count
  - Total projects count
  - Documents uploaded this month
  - Storage used (MB)
  - Real-time data from Supabase

- **Recent Activity:**
  - Shows recent uploads
  - Quick access to documents and projects

### 6. Audit Trail
- **Audit Trail Page** (/dashboard/audit-trail):
  - Admin-only access
  - Complete activity log (last 500 entries)
  - Filters: Search, Action, Entity Type, User
  - Export to CSV for compliance reporting
  - Color-coded action badges
  - Timestamps and user details
  - Entity details (file names, comments, projects)

- **Logged Actions:**
  - upload, download, delete
  - approve, reject, request_approval
  - create, update (projects)

### 7. Mobile Responsiveness
- **Documents Page:** Vertical stacking, truncated filenames, wrapped badges
- **Approvals Page:** Full-width buttons, stacked layout, proper spacing
- **Dashboard:** Responsive grid layout
- **Projects Page:** Mobile-friendly forms and lists
- **Navigation:** Collapsible mobile menu
- **Upload Component:** Touch-friendly drag-and-drop

### 8. Deployment & Infrastructure
- **Live Production URL:** https://docubuild-seven.vercel.app
- **Auto-deployment:** Push to GitHub ’ Vercel deploys
- **Environment Variables:** Configured in Vercel
- **Database:** Supabase PostgreSQL (500MB free tier)
- **Storage:** Supabase Storage (1GB free tier)
- **Region:** Singapore (closest to Philippines)

---

## =Á Database Schema

### Tables

**1. profiles**
- User profile linked to auth.users
- Fields: id, email, full_name, role, created_at, updated_at
- Auto-created via trigger on user signup

**2. projects**
- Construction projects
- Fields: id, name, description, project_code, status, created_by, created_at, updated_at

**3. categories**
- Document categories (pre-seeded with 8 types)
- Fields: id, name, description, created_at, updated_at

**4. documents**
- Core document records
- Fields: id, title, file_name, file_path, file_size, file_type, project_id, category_id, status, uploaded_by, created_at, updated_at
- Status: draft, pending, approved, rejected

**5. audit_logs**
- Complete activity trail
- Fields: id, user_id, action, entity_type, entity_id, details (jsonb), created_at

**6. approval_requests**
- Document approval workflow
- Fields: id, document_id, requested_by, approver_id, status, comments, responded_at, created_at

### Row Level Security (RLS)
All tables have RLS policies:
- **Profiles:** Public read, users can update own profile
- **Projects:** All authenticated users can view, admins can modify
- **Categories:** All authenticated users can view, admins can modify
- **Documents:** All authenticated users can view, staff+ can upload, approvers+ can approve
- **Audit Logs:** All authenticated users can view own logs, admins can view all
- **Approval Requests:** Requesters and approvers can view their own, approvers can update

---

## = User Roles & Permissions

### Admin
- Full access to all features
- Manage users, projects, categories
- View all audit trails
- Approve/reject documents
- Upload/download/delete any document

### Approver
- Approve/reject documents
- View approval queue
- Upload/download documents
- View own audit logs
- Cannot manage projects/categories

### Staff
- Upload documents
- Request approvals
- Download documents
- View own audit logs
- Cannot approve or manage settings

### Viewer
- View documents only
- Download documents
- View own audit logs
- No upload or approval permissions

---

## =€ Demo Data (Seed Script)

### Sample Users (scripts/seed.ts)
```
Admin:    admin@docubuild-demo.com / demo123456
Approver: approver@docubuild-demo.com / demo123456
Staff:    staff@docubuild-demo.com / demo123456
Viewer:   viewer@docubuild-demo.com / demo123456
```

### Sample Projects
1. Main Office Building Construction (PROJ-2025-001)
2. Highway Expansion Project (PROJ-2025-002)
3. Residential Complex - Phase 1 (PROJ-2025-003)
4. Bridge Rehabilitation (PROJ-2024-087)

### Sample Documents (20)
- Payment vouchers, site reports, contracts
- Permits, drawings, photos, invoices
- Distributed across all 4 projects
- All 8 categories represented

**Run Seed Script:**
```bash
npx tsx scripts/seed.ts
```

---

## =ñ Key Features Highlight

### <¨ **Editable File Names (NEW - Oct 3)**
**Problem:** Construction workers upload files with names like "IMG_20250103_143022.jpg"

**Solution:**
- After selecting files, show preview with editable name input
- Default name = filename without extension
- User can rename: "Foundation Work - Site A - Jan 3"
- Shows original filename and size below input
- Click "Upload All" to confirm

**Benefits:**
- Professional, searchable document names
- Better organization from day 1
- Construction-friendly naming conventions

### =¼ **Image Lightbox Viewer (NEW - Oct 3)**
**Problem:** Construction teams upload hundreds of site photos, opening each in new tab is annoying

**Solution:**
- Two buttons for each document:
  - **View (=A):** Opens images in fullscreen lightbox, PDFs in new tab
  - **Download ():** Force downloads file
- Lightbox features:
  - Fullscreen black overlay
  - Centered image display
  - Close button and click-outside-to-close
  - Download button in viewer
  - Smooth UX for quick photo review

**Benefits:**
- Quick photo review without leaving app
- No tab clutter
- Better workflow for site inspections

### =ñ **Mobile-First Design**
- Vertical stacking of content on small screens
- Full-width buttons for easy tapping
- Truncated long filenames with ellipsis
- Touch-friendly drag-and-drop
- Responsive navigation with collapsible menu

### = **Powerful Search & Filters**
- Search documents by name
- Filter by project and category
- Filter approvals by status
- Filter audit logs by action, entity, user
- Export audit trail to CSV

###  **Compliance Ready**
- Complete audit trail with timestamps
- Export to CSV for government reporting
- Role-based access control
- Document approval workflow
- Immutable audit logs

---

## =Ý Documentation Files

### Business Documents
- **PROPOSAL.md** - Business proposal with pricing options
- **TRIAL_AGREEMENT.md** - Legal terms for 1-week free trial
- **PRIVACY_SECURITY_ADDENDUM.md** - Security and privacy policies
- **TRIAL_ONBOARDING_EMAIL.md** - Client welcome email template
- **CLIENT_TIMELINE_EMAIL.md** - Timeline confirmation email

### Technical Documents
- **supabase_schema.sql** - Complete database schema with RLS
- **scripts/seed.ts** - Demo data population script
- **SEED_DATA_README.md** - Instructions for seed script
- **PROJECT_STATUS.md** - Detailed project progress tracker
- **.env.local** - Environment variables (not in git)

---

## = Known Issues

### Fixed (Oct 3, 2025)
-  Mobile layout breaking on long filenames ’ Fixed with truncate
-  Approvals page not responsive ’ Fixed with stacked layout
-  Documents page not responsive ’ Fixed earlier

### To Fix Later (Non-blocking)
- ESLint errors suppressed in build (unescaped entities, unused vars)
- TypeScript strict mode errors suppressed
- No pagination on documents list (will slow down with 1000+ docs)

### Future Enhancements (Post-Trial)
- Email notifications for approvals
- Document versioning
- Comments on documents
- Document tags/labels
- Advanced search with full-text
- Batch document upload
- PDF preview (currently opens in new tab)
- Thumbnail generation for images

---

## <¯ Success Metrics

### MVP Success (100% Complete )
- [x] User can sign up and log in
- [x] User can upload documents with custom names
- [x] User can view images in lightbox
- [x] User can download documents
- [x] User can view dashboard with stats
- [x] User can manage projects
- [x] User can request document approval
- [x] Approvers can approve/reject documents
- [x] Admins can view audit trail
- [x] All actions are audit logged
- [x] App is deployed and accessible online
- [x] Mobile responsive design

### Trial Success Criteria
- Client tests with real construction data
- Client provides positive feedback on core features
- No critical bugs or security issues
- Client agrees to move forward with paid contract

### Business Success
- Client signs contract (±133k setup + ±24k/month)
- Successful implementation and onboarding
- Client uses system as primary DMS
- Referrals to other construction companies

---

## =€ Deployment Information

### URLs
- **Production:** https://docubuild-seven.vercel.app
- **GitHub:** https://github.com/janversantos/DocuBuild.git
- **Supabase:** https://supabase.com/dashboard/project/tfavogvkmbdolgqpunxv

### Environment Variables (Vercel)
```
NEXT_PUBLIC_SUPABASE_URL=https://tfavogvkmbdolgqpunxv.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[JWT token in Vercel settings]
```

### Deployment Process
1. Push code to GitHub main branch
2. Vercel automatically detects changes
3. Builds with Next.js Turbopack
4. Deploys to production (~2 minutes)
5. Live URL updated automatically

---

## =Ë Next Steps (Ready to Launch Trial)

### Before Client Trial
- [ ] Run seed script on production: `npx tsx scripts/seed.ts`
- [ ] Upload 10-20 sample construction PDFs through UI
- [ ] Test all workflows end-to-end one final time
- [ ] Send TRIAL_ONBOARDING_EMAIL.md to client
- [ ] Schedule demo walkthrough call

### During Trial (7 days)
- [ ] Monitor Vercel logs for errors
- [ ] Respond to client questions within 24 hours
- [ ] Gather feedback via email/call
- [ ] Document feature requests
- [ ] Fix any critical bugs immediately

### Post-Trial
- [ ] Send follow-up survey
- [ ] Present final contract proposal
- [ ] Negotiate pricing and timeline
- [ ] Plan Phase 2 features based on feedback

---

## =¡ Key Insights & Lessons

### What Worked Well
1. **Supabase RLS** - Security handled at database level
2. **Next.js App Router** - Fast, modern React framework
3. **Vercel Deployment** - Seamless auto-deploy from GitHub
4. **Custom File Names** - Client-requested feature, big UX improvement
5. **Image Lightbox** - Game-changer for construction photo workflows
6. **Mobile-First** - Caught responsive issues early through testing

### Technical Decisions
- **Cloud-only approach** - Client has no on-prem infrastructure
- **Singapore region** - Closest to Philippines for low latency
- **Free tier start** - Allows trial without upfront costs
- **Role-based access** - Essential for construction hierarchies
- **Audit logging** - Required for government contract compliance

### Time Investment
- Week 1: Project setup, auth, database (15 hours)
- Week 2: Document management, projects, dashboard (18 hours)
- Week 3: Approval workflow, audit trail, mobile fixes, new features (20 hours)
- **Total:** ~53 hours over 3 weeks

---

## =Þ Support & Contact

**Developer:** Jan Oliver Santos
**Client:** [Client Company Name]
**Trial Start:** [To be scheduled]
**Trial End:** [7 days after start]

---

**Document Version:** 2.0
**Status:** Production Ready
**Last Updated:** October 3, 2025
