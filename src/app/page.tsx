"use client"

import Link from "next/link"

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
     
      {/* Main Content */}
      <main className="flex flex-1 items-center justify-center px-6">
        <div className="max-w-2xl w-full text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Welcome to Lim Cruz Business Record
          </h2>
          <p className="text-gray-600 mb-8">
            Manage your farm and property operations efficiently. Choose a section to get started:
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            {/* Copras Card */}
            <Link
              href="/copras-records"
              className="p-6 bg-white rounded-xl border border-gray-200 shadow hover:shadow-md hover:border-green-400 transition"
            >
              <h3 className="text-lg font-semibold text-green-600 mb-2">
                Copras Records
              </h3>
              <p className="text-sm text-gray-500">
                Track sales, expenses, and yields.
              </p>
            </Link>

            {/* Mango Farm Card */}
            <Link
              href="/mango-farm"
              className="p-6 bg-white rounded-xl border border-gray-200 shadow hover:shadow-md hover:border-yellow-400 transition"
            >
              <h3 className="text-lg font-semibold text-yellow-600 mb-2">
                Mango Farm
              </h3>
              <p className="text-sm text-gray-500">
                Manage your mango plantation records.
              </p>
            </Link>

            {/* Fishpond Card */}
            <Link
              href="/fishpond"
              className="p-6 bg-white rounded-xl border border-gray-200 shadow hover:shadow-md hover:border-teal-400 transition"
            >
              <h3 className="text-lg font-semibold text-teal-600 mb-2">
                Fishpond
              </h3>
              <p className="text-sm text-gray-500">
                Monitor fishpond stocks and harvests.
              </p>
            </Link>

            {/* Rental Card */}
            <Link
              href="/rental"
              className="p-6 bg-white rounded-xl border border-gray-200 shadow hover:shadow-md hover:border-purple-400 transition"
            >
              <h3 className="text-lg font-semibold text-purple-600 mb-2">
                Rental
              </h3>
              <p className="text-sm text-gray-500">
                Manage rental income from properties.
              </p>
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
