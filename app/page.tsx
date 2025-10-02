import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h1 className="text-5xl font-extrabold text-gray-900 mb-6">
            DocuBuild
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Professional Document Management for Construction Companies
          </p>
          <p className="text-lg text-gray-500 mb-12 max-w-2xl mx-auto">
            Go paperless with secure document storage, approval workflows, and
            complete audit trails designed specifically for construction projects.
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/login"
              className="px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 md:py-4 md:text-lg md:px-10"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="px-8 py-3 border border-blue-600 text-base font-medium rounded-md text-blue-600 bg-white hover:bg-blue-50 md:py-4 md:text-lg md:px-10"
            >
              Sign Up
            </Link>
          </div>
        </div>

        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-2">Secure Storage</h3>
            <p className="text-gray-600">
              Bank-level encryption for all your construction documents and files.
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-2">Approval Workflows</h3>
            <p className="text-gray-600">
              Streamlined approval processes for payment vouchers and site reports.
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-2">Audit Trail</h3>
            <p className="text-gray-600">
              Complete activity history for government compliance and accountability.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
