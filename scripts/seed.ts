/**
 * DocuBuild Seed Data Script
 *
 * Populates the database with sample data for trial/demo purposes
 *
 * Run with: npx tsx scripts/seed.ts
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' })

// Get Supabase credentials from environment
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// Sample user data (these will need to be created via signup or admin)
const sampleUsers = [
  {
    email: 'admin@docubuild-demo.com',
    full_name: 'Admin User',
    role: 'admin',
    password: 'demo123456',
  },
  {
    email: 'approver@docubuild-demo.com',
    full_name: 'Maria Santos',
    role: 'approver',
    password: 'demo123456',
  },
  {
    email: 'staff@docubuild-demo.com',
    full_name: 'Juan dela Cruz',
    role: 'staff',
    password: 'demo123456',
  },
  {
    email: 'viewer@docubuild-demo.com',
    full_name: 'Pedro Reyes',
    role: 'viewer',
    password: 'demo123456',
  },
]

// Sample projects
const sampleProjects = [
  {
    name: 'Main Office Building Construction',
    description: 'Construction of new 5-story office building in Makati',
    project_code: 'PROJ-2025-001',
    status: 'active',
  },
  {
    name: 'Highway Expansion Project',
    description: 'Government contract for highway widening in Metro Manila',
    project_code: 'PROJ-2025-002',
    status: 'active',
  },
  {
    name: 'Residential Complex - Phase 1',
    description: '50-unit residential development in Quezon City',
    project_code: 'PROJ-2025-003',
    status: 'active',
  },
  {
    name: 'Bridge Rehabilitation',
    description: 'Repair and strengthening of existing bridge structure',
    project_code: 'PROJ-2024-087',
    status: 'active',
  },
]

// Sample documents (metadata only - actual files would need to be uploaded)
const sampleDocuments = [
  // Main Office Building docs
  { title: 'Payment Voucher - January 2025', category: 'Payment Vouchers', project: 0 },
  { title: 'Site Progress Report - Week 1', category: 'Site Reports', project: 0 },
  { title: 'Construction Contract Agreement', category: 'Contracts', project: 0 },
  { title: 'Building Permit', category: 'Permits', project: 0 },
  { title: 'Architectural Drawing - Floor Plan', category: 'Drawings', project: 0 },
  { title: 'Site Photo - Foundation Work', category: 'Photos', project: 0 },

  // Highway Expansion docs
  { title: 'Government Contract - Signed', category: 'Contracts', project: 1 },
  { title: 'Payment Request - Milestone 1', category: 'Payment Vouchers', project: 1 },
  { title: 'Environmental Compliance Certificate', category: 'Permits', project: 1 },
  { title: 'Weekly Progress Report - Jan 2025', category: 'Site Reports', project: 1 },
  { title: 'Engineer Inspection Report', category: 'Site Reports', project: 1 },

  // Residential Complex docs
  { title: 'Development Permit', category: 'Permits', project: 2 },
  { title: 'Site Plan - Approved', category: 'Drawings', project: 2 },
  { title: 'Material Invoice - Concrete', category: 'Invoices', project: 2 },
  { title: 'Labor Payment Voucher', category: 'Payment Vouchers', project: 2 },
  { title: 'Safety Inspection Report', category: 'Site Reports', project: 2 },

  // Bridge Rehabilitation docs
  { title: 'Structural Assessment Report', category: 'Site Reports', project: 3 },
  { title: 'Repair Contract', category: 'Contracts', project: 3 },
  { title: 'Engineering Plans - Revised', category: 'Drawings', project: 3 },
  { title: 'Material Procurement Invoice', category: 'Invoices', project: 3 },
]

async function createUsers() {
  console.log('📝 Creating sample users...')

  for (const user of sampleUsers) {
    try {
      // Sign up user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: user.email,
        password: user.password,
        options: {
          data: {
            full_name: user.full_name,
            role: user.role,
          },
        },
      })

      if (authError) {
        console.log(`⚠️  User ${user.email} might already exist, skipping...`)
        continue
      }

      console.log(`✅ Created user: ${user.email} (${user.role})`)
    } catch (error) {
      console.error(`❌ Error creating user ${user.email}:`, error)
    }
  }
}

async function createProjects(adminUserId: string) {
  console.log('\n📁 Creating sample projects...')

  const projectIds: string[] = []

  for (const project of sampleProjects) {
    try {
      const { data, error } = await supabase
        .from('projects')
        .insert({
          ...project,
          created_by: adminUserId,
        })
        .select()
        .single()

      if (error) throw error

      projectIds.push(data.id)
      console.log(`✅ Created project: ${project.name}`)
    } catch (error) {
      console.error(`❌ Error creating project:`, error)
    }
  }

  return projectIds
}

async function createDocuments(
  userId: string,
  projectIds: string[],
  categoryMap: Record<string, string>
) {
  console.log('\n📄 Creating sample document records...')

  for (const doc of sampleDocuments) {
    try {
      const projectId = projectIds[doc.project]
      const categoryId = categoryMap[doc.category]

      const { error } = await supabase.from('documents').insert({
        title: doc.title,
        file_name: `${doc.title.toLowerCase().replace(/\s+/g, '-')}.pdf`,
        file_path: `demo/${doc.title.toLowerCase().replace(/\s+/g, '-')}.pdf`,
        file_size: Math.floor(Math.random() * 5000000) + 500000, // Random size 500KB-5MB
        file_type: 'application/pdf',
        project_id: projectId,
        category_id: categoryId,
        status: 'draft',
        uploaded_by: userId,
      })

      if (error) throw error

      console.log(`✅ Created document: ${doc.title}`)
    } catch (error) {
      console.error(`❌ Error creating document:`, error)
    }
  }
}

async function getCategoryMap() {
  console.log('\n📂 Fetching categories...')

  const { data: categories } = await supabase
    .from('categories')
    .select('id, name')

  const categoryMap: Record<string, string> = {}
  categories?.forEach((cat) => {
    categoryMap[cat.name] = cat.id
  })

  console.log(`✅ Found ${categories?.length} categories`)
  return categoryMap
}

async function main() {
  console.log('🌱 Starting DocuBuild seed data script...\n')

  try {
    // Step 1: Create users
    await createUsers()

    // Wait a bit for profile creation triggers to complete
    await new Promise((resolve) => setTimeout(resolve, 2000))

    // Step 2: Get admin user ID
    console.log('\n🔍 Finding admin user...')
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, email, role')
      .eq('role', 'admin')
      .limit(1)

    if (!profiles || profiles.length === 0) {
      console.error('❌ No admin user found. Please create an admin user first.')
      console.log('💡 You can manually update a user role to admin in Supabase dashboard')
      return
    }

    const adminUserId = profiles[0].id
    console.log(`✅ Using admin user: ${profiles[0].email}`)

    // Step 3: Get category mappings
    const categoryMap = await getCategoryMap()

    // Step 4: Create projects
    const projectIds = await createProjects(adminUserId)

    // Step 5: Create document records
    await createDocuments(adminUserId, projectIds, categoryMap)

    console.log('\n✨ Seed data complete!\n')
    console.log('📊 Summary:')
    console.log(`   - ${sampleUsers.length} users created`)
    console.log(`   - ${sampleProjects.length} projects created`)
    console.log(`   - ${sampleDocuments.length} document records created`)
    console.log('\n⚠️  Note: Actual document files are not uploaded (only metadata)')
    console.log('💡 Tip: Upload real PDF files through the UI to complete the demo\n')

    console.log('🔐 Demo Login Credentials:')
    console.log('   Admin:    admin@docubuild-demo.com / demo123456')
    console.log('   Approver: approver@docubuild-demo.com / demo123456')
    console.log('   Staff:    staff@docubuild-demo.com / demo123456')
    console.log('   Viewer:   viewer@docubuild-demo.com / demo123456')

  } catch (error) {
    console.error('\n❌ Seed script failed:', error)
    process.exit(1)
  }
}

// Run the script
main()
