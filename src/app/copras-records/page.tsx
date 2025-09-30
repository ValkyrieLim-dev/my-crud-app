"use client"

import { useEffect, useState } from "react"
import { supabase } from "../lib/supabaseClient"
import type { CoprasRecord, Area } from "../types/database"
import BackButton from "../components/BackButton"


export default function CoprasRecordsPage() {
  const [records, setRecords] = useState<CoprasRecord[]>([])
  const [areas, setAreas] = useState<Area[]>([])
  const [form, setForm] = useState<Partial<CoprasRecord>>({})
  const [editingId, setEditingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
      minimumFractionDigits: 2,
    }).format(value || 0)

  const fetchAreas = async () => {
    const { data, error } = await supabase.from("areas").select("*")
    if (!error && data) setAreas(data as Area[])
  }

  const fetchRecords = async () => {
    setLoading(true)
    const { data } = await supabase.from("copras_records").select("*, areas(*)")
    if (data) setRecords(data as CoprasRecord[])
    setLoading(false)
  }

  useEffect(() => {
    fetchAreas()
    fetchRecords()
  }, [])

  const saveRecord = async () => {
    if (!form.date || !form.area_id || !form.farmer) {
      alert("Date, Area, and Farmer are required!")
      return
    }

    if (editingId) {
      await supabase
        .from("copras_records")
        .update({
          date: form.date,
          area_id: form.area_id,
          farmer: form.farmer,
          sales: Number(form.sales) || 0,
          expenses: Number(form.expenses) || 0,
          weight: Number(form.weight) || 0,
        })
        .eq("id", editingId)
    } else {
      await supabase.from("copras_records").insert([
        {
          date: form.date,
          area_id: form.area_id,
          farmer: form.farmer,
          sales: Number(form.sales) || 0,
          expenses: Number(form.expenses) || 0,
          weight: Number(form.weight) || 0,
        },
      ])
    }

    setForm({})
    setEditingId(null)
    setIsModalOpen(false)
    fetchRecords()
  }

  // --- Summary Calculations ---
  const totalSales = records.reduce((sum, r) => sum + (r.sales || 0), 0)
  const totalExpenses = records.reduce((sum, r) => sum + (r.expenses || 0), 0)
  const totalNetSales = (totalSales - totalExpenses) / 2


  const areaStats = records.reduce((acc, r) => {
    if (!r.area_id) return acc
    if (!acc[r.area_id]) {
      acc[r.area_id] = { sales: 0, net: 0, name: r.areas?.area_name || "" }
    }
    acc[r.area_id].sales += r.sales || 0
    acc[r.area_id].net += ((r.sales || 0) - (r.expenses || 0)) / 2

    return acc
  }, {} as Record<string, { sales: number; net: number; name: string }>)

  const topSalesArea = Object.values(areaStats).sort(
    (a, b) => b.sales - a.sales
  )[0]
  const topNetArea = Object.values(areaStats).sort((a, b) => b.net - a.net)[0]

  return (
    <div className="p-4 max-w-6xl mx-auto bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen text-gray-900">
      {/* Back button here */}
        <BackButton />
      <h1 className="text-3xl font-bold mb-6 text-center text-blue-700">
        Copras Records
      </h1>

      {/* Add Record Button */}
      <div className="mb-6 flex justify-end">
        <button
          onClick={() => setIsModalOpen(true)}
          className="btn-primary px-4 py-2"
        >
          + Add Record
        </button>
      </div>

     
      {/* Dashboard Cards */}
          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-2 flex overflow-x-auto gap-3 text-gray-800">
            {/* Year */}
            <div className="flex flex-col items-center justify-center p-2 border border-gray-100 rounded min-w-[90px]">
              <h3 className="text-[10px] font-semibold text-gray-600">Year</h3>
              <p className="text-sm font-bold text-gray-800">2025</p>
            </div>

            {/* Total Sales */}
            <div className="flex flesx-col items-center justify-center p-2 border border-gray-100 rounded min-w-[90px]">
              <h3 className="text-[10px] font-semibold text-gray-600">Total Sales</h3>
              <p className="text-sm font-bold text-green-600">{formatCurrency(totalSales)}</p>
            </div>

            {/* Total Expenses */}
            <div className="flex flex-col items-center justify-center p-2 border border-gray-100 rounded min-w-[90px]">
              <h3 className="text-[10px] font-semibold text-gray-600">Total Expenses</h3>
              <p className="text-sm font-bold text-red-600">{formatCurrency(totalExpenses)}</p>
            </div>

            {/* Net Income */}
            <div className="flex flex-col items-center justify-center p-2 border border-gray-100 rounded min-w-[90px]">
              <h3 className="text-[10px] font-semibold text-gray-600">Net Income</h3>
              <p className="text-[10px] text-gray-500 italic mb-1">Divided by 2</p>
              <p className="text-sm font-bold text-blue-600">{formatCurrency(totalNetSales)}</p>
            </div>


          </div>



      {/* Records Cards */}
{loading ? (
  <p className="text-gray-600 text-center">Loading...</p>
) : records.length === 0 ? (
  <p className="text-gray-600 text-center">No records found.</p>
) : (
  <div className="grid gap-3 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
    {records.map((r) => (
      <div
        key={r.id}
        className="bg-white rounded-xl shadow-md border border-gray-200 p-4 flex flex-col gap-1 hover:shadow-lg transition"
      >
        <div className="flex justify-between text-sm text-gray-500">
          <span className="font-semibold">Date:</span>
          <span>{r.date}</span>
        </div>
        <div className="flex justify-between text-sm text-gray-500">
          <span className="font-semibold">Area:</span>
          <span>{r.areas?.area_name}</span>
        </div>
        <div className="flex justify-between text-sm text-gray-500">
          <span className="font-semibold">Farmer:</span>
          <span>{r.farmer}</span>
        </div>
        <div className="flex justify-between text-sm text-green-600 font-bold">
          <span>Sales:</span>
          <span>{formatCurrency(r.sales)}</span>
        </div>
        <div className="flex justify-between text-sm text-red-600 font-bold">
          <span>Expenses:</span>
          <span>{formatCurrency(r.expenses)}</span>
        </div>
        <div className="flex justify-between text-sm text-blue-600 font-bold">
          <span>Net Income:</span>
          <span>{formatCurrency(((r.sales || 0) - (r.expenses || 0)) / 2)}</span>
        </div>
        <div className="flex justify-between text-sm text-gray-700">
          <span>Weight:</span>
          <span>{r.weight} kg</span>
        </div>
        <div className="flex justify-between text-sm text-gray-700">
          <span>Price/Kilo:</span>
          <span>{formatCurrency(r.price_per_kilo)}</span>
        </div>
      </div>
    ))}
  </div>
)}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-lg">
            <h2 className="text-lg font-semibold mb-4 text-gray-700">
              {editingId ? "Edit Record" : "Add New Record"}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="date"
                value={form.date || ""}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="input"
              />
              <select
                value={form.area_id || ""}
                onChange={(e) => setForm({ ...form, area_id: e.target.value })}
                className="input"
              >
                <option value="">Select Area</option>
                {areas.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.area_name}
                  </option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Farmer"
                value={form.farmer || ""}
                onChange={(e) => setForm({ ...form, farmer: e.target.value })}
                className="input"
              />
              <input
                type="number"
                placeholder="Sales"
                value={form.sales || ""}
                onChange={(e) =>
                  setForm({ ...form, sales: Number(e.target.value) })
                }
                className="input"
              />
              <input
                type="number"
                placeholder="Expenses"
                value={form.expenses || ""}
                onChange={(e) =>
                  setForm({ ...form, expenses: Number(e.target.value) })
                }
                className="input"
              />
              <input
                type="number"
                placeholder="Weight"
                value={form.weight || ""}
                onChange={(e) =>
                  setForm({ ...form, weight: Number(e.target.value) })
                }
                className="input"
              />
            </div>

            <div className="mt-4 flex gap-3 justify-end">
              <button onClick={saveRecord} className="btn-primary">
                {editingId ? "Update" : "Add Record"}
              </button>
              <button
                onClick={() => {
                  setForm({})
                  setEditingId(null)
                  setIsModalOpen(false)
                }}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
