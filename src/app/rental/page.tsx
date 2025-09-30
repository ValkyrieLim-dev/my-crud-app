"use client"

export default function RentalPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto bg-white p-6 rounded-xl shadow border border-gray-200">
        <h1 className="text-2xl font-bold text-purple-600 mb-4">
          Rental Records
        </h1>
        <p className="text-gray-600 mb-6">
          Here you can track your rental income and tenant information.
        </p>

        {/* Placeholder for rental data */}
        <div className="p-4 border border-dashed border-gray-300 rounded-lg text-gray-500">
          Rental records will be displayed here.
        </div>
      </div>
    </div>
  )
}
