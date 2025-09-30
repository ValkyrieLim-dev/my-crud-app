"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { BarChart3, TreePine, Fish, Building2 } from "lucide-react"
import { supabase } from "./lib/supabaseClient"

interface CoprasRecord {
  sales?: number
  expenses?: number
}

export default function HomePage() {
  const [coprasStats, setCoprasStats] = useState({ totalSales: 0, netIncome: 0 })

  const fetchCoprasStats = async () => {
    const { data, error } = await supabase.from("copras_records").select("*")
    if (!error && data) {
      const totalSales = data.reduce((sum: number, r: CoprasRecord) => sum + (r.sales || 0), 0)
      const totalExpenses = data.reduce((sum: number, r: CoprasRecord) => sum + (r.expenses || 0), 0)
      const netIncome = (totalSales - totalExpenses) / 2
      setCoprasStats({ totalSales, netIncome })
    }
  }

  useEffect(() => {
    fetchCoprasStats()
  }, [])

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
      minimumFractionDigits: 2,
    }).format(value || 0)

  // Dummy stats for other modules
  const stats = {
    mango: { harvest: Number, revenue: Number },
    fishpond: { stock: Number, revenue: Number },
    rental: { monthlyIncome: 40000 },
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 flex flex-col">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-4 py-2 border-b border-gray-200 bg-white">
        <h1 className="text-lg font-semibold">Lim Cruz Records</h1>
      </nav>

      {/* Main Content */}
      <main className="flex-1 px-4 py-6">
        <h2 className="text-xl font-bold mb-4 text-gray-800 text-center">
          Dashboard
        </h2>

        {/* Dashboard Cards */}
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-2 md:grid-cols-4">
  {/* Copras Card */}
  <Link
    href="/copras-records"
    className="flex flex-col justify-center items-center p-3 bg-white rounded-xl border border-gray-200 shadow hover:shadow-md transition h-28 w-28 sm:h-32 sm:w-32 md:h-36 md:w-36 text-center"
  >
    <BarChart3 className="w-6 h-6 text-green-600 mb-1" />
    <h3 className="font-semibold text-green-600 text-sm mb-1">Copras</h3>
    <p className="text-xs text-gray-600">
      {formatCurrency(coprasStats.totalSales)}
    </p>
    <p className="text-xs text-gray-600">
      {formatCurrency(coprasStats.netIncome)}
    </p>
  </Link>

  {/* Mango Farm Card */}
  <Link
    href="/mango-farm"
    className="flex flex-col justify-center items-center p-3 bg-white rounded-xl border border-gray-200 shadow hover:shadow-md transition h-28 w-28 sm:h-32 sm:w-32 md:h-36 md:w-36 text-center"
  >
    <TreePine className="w-6 h-6 text-yellow-600 mb-1" />
    <h3 className="font-semibold text-yellow-600 text-sm mb-1">Mango Farm</h3>
    <p className="text-xs text-gray-600"> kg</p>
    <p className="text-xs text-gray-600"></p>
  </Link>

  {/* Fishpond Card */}
  <Link
    href="/fishpond"
    className="flex flex-col justify-center items-center p-3 bg-white rounded-xl border border-gray-200 shadow hover:shadow-md transition h-28 w-28 sm:h-32 sm:w-32 md:h-36 md:w-36 text-center"
  >
    <Fish className="w-6 h-6 text-teal-600 mb-1" />
    <h3 className="font-semibold text-teal-600 text-sm mb-1">Fishpond</h3>
    <p className="text-xs text-gray-600">pcs</p>
    <p className="text-xs text-gray-600"></p>
  </Link>

  {/* Rental Card */}
  <Link
    href="/rental"
    className="flex flex-col justify-center items-center p-3 bg-white rounded-xl border border-gray-200 shadow hover:shadow-md transition h-28 w-28 sm:h-32 sm:w-32 md:h-36 md:w-36 text-center"
  >
    <Building2 className="w-6 h-6 text-purple-600 mb-1" />
    <h3 className="font-semibold text-purple-600 text-sm mb-1">Rental</h3>
    <p className="text-xs text-gray-600">{formatCurrency(stats.rental.monthlyIncome)}</p>
  </Link>
</div>

      </main>
    </div>
  )
}
