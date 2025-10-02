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
    mango: { harvest: 120, revenue: 20000 }, // example
    fishpond: { stock: 500, revenue: 15000 }, // example
    rental: { monthlyIncome: 40000 },
  }

  // Active check
  const isCoprasActive = coprasStats.totalSales > 0
  const isMangoActive = (stats.mango.harvest || 0) > 0
  const isFishActive = (stats.fishpond.stock || 0) > 0

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 flex flex-col">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white shadow-sm">
        <div className="flex items-center space-x-2">
          <div className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center shadow-md">
            <BarChart3 className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-wide text-gray-800 relative">
            <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Lim Cruz
            </span>{" "}
            Records
            <span className="absolute left-0 -bottom-1 w-full h-1 bg-gradient-to-r from-indigo-400 to-purple-400 rounded-full"></span>
          </h1>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 px-4 py-6">
        <h2 className="text-xl font-bold mb-5 text-gray-800 text-center">
          Dashboard
        </h2>

        {/* Dashboard Cards */}
        <div className="grid gap-2 grid-cols-2 sm:grid-cols-2 md:grid-cols-4 justify-items-center">
          
          {/* Copras Card */}
          <Link
            href="/copras-records"
            className={`relative flex flex-col justify-center items-center p-4 rounded-xl border shadow-md hover:shadow-lg transition h-40 w-40 sm:h-44 sm:w-44 text-center 
              ${isCoprasActive ? "bg-green-50 border-green-400" : "bg-white border-gray-200"}`}
          >
            {isCoprasActive && (
              <span className="absolute top-2 right-2 text-[10px] px-2 py-0.5 bg-green-600 text-white rounded-full shadow">
                No ongoing harvest
              </span>
            )}
            <BarChart3 className="w-8 h-8 text-green-600 mb-2" />
            <h3 className="font-semibold text-green-700 text-base mb-1">Copras</h3>
            <p className="text-sm text-gray-600">{formatCurrency(coprasStats.totalSales)}</p>
            <p className="text-sm text-gray-600">{formatCurrency(coprasStats.netIncome)}</p>
          </Link>

          {/* Mango Farm Card */}
          <Link
            href="/mango-farm"
            className={`relative flex flex-col justify-center items-center p-4 rounded-xl border shadow-md hover:shadow-lg transition h-40 w-40 sm:h-44 sm:w-44 text-center 
              ${isMangoActive ? "bg-yellow-50 border-yellow-400" : "bg-white border-gray-200"}`}
          >
            {isMangoActive && (
              <span className="absolute top-2 right-2 text-[10px] px-2 py-0.5 bg-yellow-600 text-white rounded-full shadow">
               Not Active Croppings
              </span>
            )}
            <TreePine className="w-8 h-8 text-yellow-600 mb-2" />
            <h3 className="font-semibold text-yellow-700 text-base mb-1">Mango Farm</h3>
            <p className="text-sm text-gray-600">{stats.mango.harvest} kg</p>
          </Link>

          {/* Fishpond Card */}
          <Link
            href="/fishpond"
            className={`relative flex flex-col justify-center items-center p-4 rounded-xl border shadow-md hover:shadow-lg transition h-40 w-40 sm:h-44 sm:w-44 text-center 
              ${isFishActive ? "bg-teal-50 border-teal-400" : "bg-white border-gray-200"}`}
          >
            {isFishActive && (
              <span className="absolute top-2 right-2 text-[10px] px-2 py-0.5 bg-teal-600 text-white rounded-full shadow">
                Active
              </span>
            )}
            <Fish className="w-8 h-8 text-teal-600 mb-2" />
            <h3 className="font-semibold text-teal-700 text-base mb-1">Fishpond</h3>
            <p className="text-sm text-gray-600">{stats.fishpond.stock} pcs</p>
          </Link>

          {/* Rental Card (no active state for now) */}
          <Link
            href="/rental"
            className="flex flex-col justify-center items-center p-4 bg-white rounded-xl border border-gray-200 shadow-md hover:shadow-lg transition h-40 w-40 sm:h-44 sm:w-44 text-center"
          >
            <Building2 className="w-8 h-8 text-purple-600 mb-2" />
            <h3 className="font-semibold text-purple-700 text-base mb-1">Rental</h3>
            <p className="text-sm text-gray-600">
              {formatCurrency(stats.rental.monthlyIncome)}
            </p>
          </Link>
        </div>
      </main>
    </div>
  )
}
