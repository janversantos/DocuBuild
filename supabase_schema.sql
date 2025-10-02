-- DocuBuild Database Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User Roles Enum
CREATE TYPE user_role AS ENUM ('admin', 'approver', 'staff', 'viewer');

-- Document Status Enum
CREATE TYPE document_status AS ENUM ('pending', 'approved', 'rejected', 'draft');

-- 1. Profiles Table (extends Supabase auth.users)
CREATE TABLE profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    role user_role DEFAULT 'staff',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Projects Table
CREATE TABLE projects (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    project_code TEXT UNIQUE,
    status TEXT DEFAULT 'active',
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Categories Table
CREATE TABLE categories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Documents Table
CREATE TABLE documents (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size BIGINT,
    file_type TEXT,
    version INTEGER DEFAULT 1,
    parent_document_id UUID REFERENCES documents(id), -- for versioning
    project_id UUID REFERENCES projects(id),
    category_id UUID REFERENCES categories(id),
    status document_status DEFAULT 'draft',
    tags TEXT[], -- array of tags
    uploaded_by UUID REFERENCES profiles(id),
    approved_by UUID REFERENCES profiles(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Audit Trail Table
CREATE TABLE audit_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id),
    action TEXT NOT NULL, -- 'upload', 'download', 'approve', 'reject', 'delete', 'view'
    entity_type TEXT NOT NULL, -- 'document', 'project', 'user'
    entity_id UUID,
    details JSONB, -- flexible metadata
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Approval Requests Table
CREATE TABLE approval_requests (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    requested_by UUID REFERENCES profiles(id),
    approver_id UUID REFERENCES profiles(id),
    status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    comments TEXT,
    responded_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_documents_project ON documents(project_id);
CREATE INDEX idx_documents_category ON documents(category_id);
CREATE INDEX idx_documents_uploaded_by ON documents(uploaded_by);
CREATE INDEX idx_documents_status ON documents(status);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at DESC);
CREATE INDEX idx_approval_requests_document ON approval_requests(document_id);
CREATE INDEX idx_approval_requests_approver ON approval_requests(approver_id);

-- Row Level Security (RLS) Policies

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_requests ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can read all profiles, but only update their own
CREATE POLICY "Public profiles are viewable by everyone"
    ON profiles FOR SELECT
    USING (true);

CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id);

-- Projects: Everyone can view, only admins can create/update/delete
CREATE POLICY "Projects are viewable by authenticated users"
    ON projects FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Admins can insert projects"
    ON projects FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can update projects"
    ON projects FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Categories: Everyone can view, only admins can modify
CREATE POLICY "Categories are viewable by authenticated users"
    ON categories FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Admins can manage categories"
    ON categories FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Documents: Everyone can view, staff+ can upload, approvers+ can approve
CREATE POLICY "Documents are viewable by authenticated users"
    ON documents FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Staff and above can upload documents"
    ON documents FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role IN ('staff', 'approver', 'admin')
        )
    );

CREATE POLICY "Users can update own documents (draft status)"
    ON documents FOR UPDATE
    TO authenticated
    USING (
        uploaded_by = auth.uid() AND status = 'draft'
    );

CREATE POLICY "Approvers can update document status"
    ON documents FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role IN ('approver', 'admin')
        )
    );

-- Audit Logs: Everyone can insert (for tracking), only admins can view all
CREATE POLICY "Users can insert audit logs"
    ON audit_logs FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Users can view own audit logs"
    ON audit_logs FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Admins can view all audit logs"
    ON audit_logs FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Approval Requests: Requesters and approvers can view, approvers can update
CREATE POLICY "Users can view approval requests they're involved in"
    ON approval_requests FOR SELECT
    TO authenticated
    USING (
        requested_by = auth.uid() OR
        approver_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Staff can create approval requests"
    ON approval_requests FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role IN ('staff', 'approver', 'admin')
        )
    );

CREATE POLICY "Approvers can update approval requests"
    ON approval_requests FOR UPDATE
    TO authenticated
    USING (
        approver_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Function to automatically create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
        COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'staff')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default categories
INSERT INTO categories (name, description) VALUES
    ('Payment Vouchers', 'Payment requests and vouchers'),
    ('Site Reports', 'Daily site reports and progress updates'),
    ('Contracts', 'Contract documents and agreements'),
    ('Invoices', 'Invoices and billing documents'),
    ('Permits', 'Government permits and certifications'),
    ('Drawings', 'CAD drawings and blueprints'),
    ('Photos', 'Site photos and documentation'),
    ('Correspondence', 'Letters and official communication');

-- Create Storage Bucket (run separately in Storage section)
-- Bucket name: documents
-- Public: false
-- File size limit: 50MB
-- Allowed MIME types: application/pdf, image/*, application/msword, application/vnd.openxmlformats-officedocument.*
