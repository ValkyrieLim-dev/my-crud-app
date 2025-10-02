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

  // NEW: state for area modal
  const [selectedArea, setSelectedArea] = useState<Area | null>(null)
  const [isAreaModalOpen, setIsAreaModalOpen] = useState(false)

  const formatDate = (dateString: string) => {
    if (!dateString) return ""
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

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

  // --- Area Harvest Stats ---
  const areaHarvests = areas.map((area) => {
    const areaRecs = records.filter((r) => r.area_id === area.id)

    if (areaRecs.length === 0) {
      return {
        id: area.id,
        name: area.area_name,
        lastHarvest: null,
        nextHarvest: null,
      }
    }

    const latest = areaRecs.reduce((latest, r) => {
      return new Date(r.date) > new Date(latest.date) ? r : latest
    })

    const lastHarvestDate = new Date(latest.date)
    const nextHarvestDate = new Date(lastHarvestDate)
    nextHarvestDate.setMonth(nextHarvestDate.getMonth() + 4)

    return {
      id: area.id,
      name: area.area_name,
      lastHarvest: formatDate(lastHarvestDate.toISOString()),
      nextHarvest: formatDate(nextHarvestDate.toISOString()),
    }
  })

  return (
    <div className="p-4 max-w-6xl mx-auto bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen text-gray-900">
      <BackButton />
      <div className="text-center mb-6">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 inline-block relative">
          Copras Records
          <span className="absolute left-0 -bottom-2 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"></span>
        </h1>
      </div>

      {/* Add Record Button */}
      <div className="mb-6 flex justify-end">
        <button
          onClick={() => setIsModalOpen(true)}
          className="btn-primary px-4 py-2"
        >
          + Add Record
        </button>
      </div>

      {/* Area Harvest Cards */}
      <div className="grid gap-3 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 mb-6">
        {areaHarvests.map((a) => (
          <div
            key={a.id}
            onClick={() => {
              const area = areas.find((ar) => ar.id === a.id)
              setSelectedArea(area || null)
              setIsAreaModalOpen(true)
            }}
            className="cursor-pointer bg-white rounded-xl shadow-md border border-gray-200 p-4 hover:shadow-lg transition"
          >
            <h3 className="text-lg font-bold text-blue-700 mb-2">{a.name}</h3>
            <p className="text-sm text-gray-600">
              <span className="font-semibold">Last Harvest:</span>{" "}
              {a.lastHarvest || "No records"}
            </p>
            <p className="text-sm text-gray-600">
              <span className="font-semibold">Next Harvest:</span>{" "}
              {a.nextHarvest || "—"}
            </p>
          </div>
        ))}
      </div>

      {/* Dashboard Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="flex flex-col items-center justify-center p-3 bg-white border rounded-xl shadow-sm">
          <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Year</h3>
          <p className="text-lg font-bold text-gray-800">2025</p>
        </div>
        <div className="flex flex-col items-center justify-center p-3 bg-white border rounded-xl shadow-sm">
          <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Total Sales</h3>
          <p className="text-lg font-bold text-green-600">{formatCurrency(totalSales)}</p>
        </div>
        <div className="flex flex-col items-center justify-center p-3 bg-white border rounded-xl shadow-sm">
          <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Expenses</h3>
          <p className="text-lg font-bold text-red-600">{formatCurrency(totalExpenses)}</p>
        </div>
        <div className="flex flex-col items-center justify-center p-3 bg-white border rounded-xl shadow-sm">
          <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Net Income</h3>
          <p className="text-[11px] text-gray-500 italic mb-1">Divided by 2</p>
          <p className="text-lg font-bold text-blue-600">{formatCurrency(totalNetSales)}</p>
        </div>
      </div>

      
     
{/* Add/Edit Record Modal */}
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
          onChange={(e) => setForm({ ...form, sales: Number(e.target.value) })}
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

      {/* Area Records Modal */}
      {isAreaModalOpen && selectedArea && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4 text-blue-700">
              Records for {selectedArea.area_name}
            </h2>

            {records.filter((r) => r.area_id === selectedArea.id).length === 0 ? (
              <p className="text-gray-600">No records found.</p>
            ) : (
              <div className="space-y-3">
                {records
                  .filter((r) => r.area_id === selectedArea.id)
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) // sort latest first
                  .map((r) => (
                    <div key={r.id} className="bg-gray-50 border rounded-lg p-3 shadow-sm">
                      <p className="text-sm text-gray-700">
                        <span className="font-semibold">Date:</span> {formatDate(r.date)}
                      </p>
                      <p className="text-sm text-gray-700">
                        <span className="font-semibold">Farmer:</span> {r.farmer}
                      </p>
                      <p className="text-sm text-green-600 font-bold">
                        Sales: {formatCurrency(r.sales)}
                      </p>
                      <p className="text-sm text-red-600 font-bold">
                        Expenses: {formatCurrency(r.expenses)}
                      </p>
                      <p className="text-sm text-blue-600 font-bold">
                        Net Income: {formatCurrency(((r.sales || 0) - (r.expenses || 0)) / 2)}
                      </p>
                      <p className="text-sm text-gray-600">Weight: {r.weight} kg</p>
                    </div>
                  ))}
              </div>
            )}

            <div className="mt-4 flex justify-end">
              <button
                onClick={() => {
                  setSelectedArea(null)
                  setIsAreaModalOpen(false)
                }}
                className="btn-secondary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    
  )
}
