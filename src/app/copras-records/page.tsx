"use client"

import { useEffect, useState } from "react"
import { supabase } from "../lib/supabaseClient"
import type { CoprasRecord, Area } from "../types/database"

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
  const totalNetIncome = totalSales - totalExpenses

  const areaStats = records.reduce((acc, r) => {
    if (!r.area_id) return acc
    if (!acc[r.area_id]) {
      acc[r.area_id] = { sales: 0, net: 0, name: r.areas?.area_name || "" }
    }
    acc[r.area_id].sales += r.sales || 0
    acc[r.area_id].net += (r.sales || 0) - (r.expenses || 0)
    return acc
  }, {} as Record<string, { sales: number; net: number; name: string }>)

  const topSalesArea = Object.values(areaStats).sort(
    (a, b) => b.sales - a.sales
  )[0]
  const topNetArea = Object.values(areaStats).sort((a, b) => b.net - a.net)[0]

  return (
    <div className="p-4 max-w-6xl mx-auto bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen text-gray-900">
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white shadow-md rounded-xl p-4 border border-gray-200">
          <h3 className="text-sm font-semibold text-gray-600">Total Sales</h3>
          <p className="text-xl font-bold text-green-600">
            {formatCurrency(totalSales)}
          </p>
        </div>
        <div className="bg-white shadow-md rounded-xl p-4 border border-gray-200">
          <h3 className="text-sm font-semibold text-gray-600">
            Total Expenses
          </h3>
          <p className="text-xl font-bold text-red-600">
            {formatCurrency(totalExpenses)}
          </p>
        </div>
        <div className="bg-white shadow-md rounded-xl p-4 border border-gray-200">
          <h3 className="text-sm font-semibold text-gray-600">
            Total Net Income
          </h3>
          <p className="text-xl font-bold text-blue-600">
            {formatCurrency(totalNetIncome)}
          </p>
        </div>
        <div className="bg-white shadow-md rounded-xl p-4 border border-gray-200">
          <h3 className="text-sm font-semibold text-gray-600">
            Best Area (Sales)
          </h3>
          <p className="text-base font-medium text-gray-800">
            {topSalesArea ? topSalesArea.name : "N/A"}
          </p>
          <p className="text-sm text-green-600">
            {topSalesArea ? formatCurrency(topSalesArea.sales) : ""}
          </p>
        </div>
        <div className="bg-white shadow-md rounded-xl p-4 border border-gray-200">
          <h3 className="text-sm font-semibold text-gray-600">
            Best Area (Net Income)
          </h3>
          <p className="text-base font-medium text-gray-800">
            {topNetArea ? topNetArea.name : "N/A"}
          </p>
          <p className="text-sm text-blue-600">
            {topNetArea ? formatCurrency(topNetArea.net) : ""}
          </p>
        </div>
      </div>

      {/* Records Table */}
      {loading ? (
        <p className="text-gray-600 text-center">Loading...</p>
      ) : records.length === 0 ? (
        <p className="text-gray-600 text-center">No records found.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl shadow-md border border-gray-200 bg-white">
          <table className="min-w-full text-sm text-gray-900">
            <thead className="bg-blue-100 text-blue-700">
              <tr>
                {[
                  "Date",
                  "Area",
                  "Farmer",
                  "Sales",
                  "Expenses",
                  "Net Income",
                  "Weight",
                  "Price/Kilo",
                ].map((h) => (
                  <th
                    key={h}
                    className="px-3 py-2 text-left font-semibold whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {records.map((r) => (
                <tr
                  key={r.id}
                  className="hover:bg-blue-50 transition-colors duration-200"
                >
                  <td className="px-3 py-2">{r.date}</td>
                  <td className="px-3 py-2">{r.areas?.area_name}</td>
                  <td className="px-3 py-2">{r.farmer}</td>
                  <td className="px-3 py-2">{formatCurrency(r.sales)}</td>
                  <td className="px-3 py-2">{formatCurrency(r.expenses)}</td>
                  <td className="px-3 py-2">
                    {formatCurrency((r.sales || 0) - (r.expenses || 0))}
                  </td>
                  <td className="px-3 py-2">{r.weight}</td>
                  <td className="px-3 py-2">
                    {formatCurrency(r.price_per_kilo)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
