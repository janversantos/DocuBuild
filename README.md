# DocuBuild

A document management and approval system built with Next.js and Supabase.

## Features

- **Authentication** - Secure user authentication with role-based access control
- **Project Management** - Create and manage projects with multiple status states
- **Document Management** - Upload, organize, and manage documents with custom naming
- **Approval Workflow** - Request and track document approvals with comprehensive timeline
- **Audit Trail** - Complete audit history of document and project activities
- **Mobile Responsive** - Fully responsive design for desktop and mobile devices
- **Image Viewer** - Built-in lightbox for document preview

## Tech Stack

- **Framework**: Next.js 15.5.4 with React 19
- **Styling**: Tailwind CSS 4
- **Database & Auth**: Supabase
- **Icons**: Lucide React
- **File Upload**: React Dropzone
- **Date Handling**: date-fns

## Getting Started

### Prerequisites

- Node.js 20 or higher
- A Supabase account and project

### Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

3. Set up environment variables (create a `.env.local` file):

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

4. Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Available Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build production application
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## Project Structure

- `/app` - Next.js app directory with routes and pages
- `/components` - Reusable React components
- `/lib` - Utility functions and Supabase client
- `/types` - TypeScript type definitions

## License

Private project
