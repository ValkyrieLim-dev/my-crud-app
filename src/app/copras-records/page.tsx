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
  const [showModal, setShowModal] = useState(false)

  // Format currency (₱)
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
    setShowModal(false)
    fetchRecords()
  }

  const deleteRecord = async (id: string) => {
    if (!confirm("Delete this record?")) return
    await supabase.from("copras_records").delete().eq("id", id)
    fetchRecords()
  }

  return (
    <div className="p-4 max-w-6xl mx-auto bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen text-gray-900">
      <h1 className="text-3xl font-bold mb-6 text-center text-blue-700">
        Copras Records
      </h1>

      {/* Add Record Button */}
      <div className="mb-6 flex justify-end">
        <button
          onClick={() => {
            setForm({})
            setEditingId(null)
            setShowModal(true)
          }}
          className="btn-primary"
        >
          Add Record
        </button>
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
                  "Actions",
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
                  <td className="px-3 py-2">{formatCurrency(r.net_income)}</td>
                  <td className="px-3 py-2">{r.weight}</td>
                  <td className="px-3 py-2">
                    {formatCurrency(r.price_per_kilo)}
                  </td>
                  <td className="px-3 py-2 flex flex-wrap gap-2">
                    <button
                      onClick={() => {
                        setForm(r)
                        setEditingId(r.id)
                        setShowModal(true)
                      }}
                      className="btn-warning"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteRecord(r.id)}
                      className="btn-danger"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {showModal && (
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

            <div className="mt-4 flex justify-end gap-3">
              <button onClick={saveRecord} className="btn-primary">
                {editingId ? "Update" : "Add Record"}
              </button>
              <button
                onClick={() => {
                  setForm({})
                  setEditingId(null)
                  setShowModal(false)
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
