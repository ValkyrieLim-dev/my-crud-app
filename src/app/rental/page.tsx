"use client"

import { useState, useEffect } from "react"
import { supabase } from "../lib/supabaseClient"
import BackButton from "../components/BackButton"

type Tenant = {
  id: string
  name: string
  tax: number
}

type TransactionRow = {
  tenant_id: string
  tenant_name: string
  tax_amount: number
  status: string
}

type RentalRecord = {
  id: string
  tenant_name: string
  tax_amount: number
  month: string
  year: number
  status: string
  transaction_id: string // unique per transaction
}

export default function RentalPage() {
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [loadingTenants, setLoadingTenants] = useState(true)

  const [showTransaction, setShowTransaction] = useState(false)
  const [transactionRows, setTransactionRows] = useState<TransactionRow[]>([])
  const [month, setMonth] = useState("")
  const [year, setYear] = useState<number | "">("")
  const [monthlyIncome, setMonthlyIncome] = useState(0)

  const [rentalRecords, setRentalRecords] = useState<RentalRecord[]>([])
  const [loadingRecords, setLoadingRecords] = useState(true)

  const months = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December"
  ]

  useEffect(() => {
    async function fetchTenants() {
      const { data, error } = await supabase.from("tenants").select("*")
      if (error) {
        console.error(error)
      } else {
        setTenants(data || [])
      }
      setLoadingTenants(false)
    }
    fetchTenants()
    fetchTransactions()
  }, [])

  async function fetchTransactions() {
    setLoadingRecords(true)
    const { data, error } = await supabase
      .from("rental_records")
      .select("*")
      .order("id", { ascending: true })
    if (error) {
      console.error(error)
    } else {
      setRentalRecords(data || [])
    }
    setLoadingRecords(false)
  }

  function startTransaction() {
    if (!month || !year) {
      alert("Please select month and year first.")
      return
    }

    if (tenants.length === 0) {
      alert("No tenants available.")
      return
    }

    const rows = tenants.map((t) => ({
      tenant_id: t.id,
      tenant_name: t.name,
      tax_amount: t.tax,
      status: "unpaid",
    }))
    setTransactionRows(rows)
    setMonthlyIncome(0)
    setShowTransaction(true)
  }

  function handleStatusChange(index: number, newStatus: string) {
    setTransactionRows((prev) => {
      const updated = [...prev]
      updated[index].status = newStatus
      const income = updated.reduce(
        (sum, row) => sum + (row.status === "paid" ? row.tax_amount : 0),
        0
      )
      setMonthlyIncome(income)
      return updated
    })
  }

  async function saveTransaction() {
    if (transactionRows.length === 0) return

    // Unique transaction id
    const transactionId = crypto.randomUUID()

    const { error } = await supabase.from("rental_records").insert(
      transactionRows.map((row) => ({
        tenant_name: row.tenant_name,
        tax_amount: row.tax_amount,
        month,
        year,
        status: row.status,
        transaction_id: transactionId
      }))
    )

    if (error) {
      console.error(error)
    } else {
      alert("Transaction saved successfully!")
      setShowTransaction(false)
      fetchTransactions()
    }
  }

  // Group records by transaction_id to make each card separate
  const transactionGroups = rentalRecords.reduce((acc: { [key: string]: RentalRecord[] }, record) => {
    if (!acc[record.transaction_id]) acc[record.transaction_id] = []
    acc[record.transaction_id].push(record)
    return acc
  }, {})

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto bg-white rounded shadow border border-gray-200 p-4 text-gray-800 text-sm">
        <BackButton />

        <h1 className="text-xl font-semibold mb-3">Rental Transactions</h1>

        {/* Month & Year selection */}
        <div className="flex gap-2 mb-3 items-center">
          <select
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="border px-2 py-1 rounded focus:ring-1 focus:ring-gray-400 text-gray-800"
          >
            <option value="">Select Month</option>
            {months.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
          <input
            type="number"
            placeholder="Year"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="border px-2 py-1 rounded focus:ring-1 focus:ring-gray-400 text-gray-800 w-20"
          />
          <button
            onClick={startTransaction}
            disabled={loadingTenants || tenants.length === 0}
            className={`bg-gray-700 text-white px-3 py-1 rounded hover:bg-gray-800 ${
              loadingTenants || tenants.length === 0 ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {loadingTenants ? "Loading Tenants..." : "Add Transaction"}
          </button>
        </div>

        {/* Ongoing Transaction Table */}
        {showTransaction && (
          <div className="mt-3 border p-3 rounded bg-gray-100">
            <h2 className="font-semibold mb-2">
              For month of <span className="font-normal">{month} {year}</span>
            </h2>
            <div className="overflow-x-auto rounded border border-gray-300">
              <table className="min-w-full text-sm text-gray-800">
                <thead className="bg-gray-200">
                  <tr>
                    <th className="px-2 py-1 border">Tenant</th>
                    <th className="px-2 py-1 border">Tax Amount</th>
                    <th className="px-2 py-1 border">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {transactionRows.map((row, index) => (
                    <tr
                      key={row.tenant_id}
                      className={`text-center ${index % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-gray-200 transition`}
                    >
                      <td className="px-2 py-1 border">{row.tenant_name}</td>
                      <td className="px-2 py-1 border font-medium">₱{row.tax_amount.toLocaleString()}</td>
                      <td className="px-2 py-1 border">
                        <select
                          value={row.status}
                          onChange={(e) => handleStatusChange(index, e.target.value)}
                          className="w-full border rounded px-1 py-0.5 text-gray-800"
                        >
                          <option value="unpaid">Unpaid</option>
                          <option value="paid">Paid</option>
                          <option value="exempted">Exempted</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-2 font-semibold">Total Income: ₱{monthlyIncome.toLocaleString()}</div>

            <div className="flex justify-end gap-2 mt-2">
              <button
                onClick={() => setShowTransaction(false)}
                className="px-3 py-1 bg-gray-400 text-white rounded hover:bg-gray-500 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={saveTransaction}
                className="px-3 py-1 bg-gray-700 text-white rounded hover:bg-gray-800 text-sm"
              >
                Save
              </button>
            </div>
          </div>
        )}

        {/* Saved Transactions Cards */}
        <div className="mt-4 space-y-3">
          {loadingRecords ? (
            <p>Loading saved transactions...</p>
          ) : (
            Object.values(transactionGroups).map((transaction, idx) => {
              const totalIncome = transaction.reduce(
                (sum, row) => sum + (row.status === "paid" ? row.tax_amount : 0),
                0
              )
              const { month, year } = transaction[0]
              return (
                <div key={idx} className="border rounded p-3 bg-gray-50 shadow-sm">
                  <h3 className="font-semibold mb-2">
                    For month of <span className="font-normal">{month} {year}</span>
                  </h3>
                  <div className="overflow-x-auto rounded border border-gray-300">
                    <table className="min-w-full text-sm text-gray-800">
                      <thead className="bg-gray-200">
                        <tr>
                          <th className="px-2 py-1 border">Tenant</th>
                          <th className="px-2 py-1 border">Tax Amount</th>
                          <th className="px-2 py-1 border">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {transaction.map((record) => (
                          <tr key={record.id} className="text-center bg-white hover:bg-gray-100">
                            <td className="px-2 py-1 border">{record.tenant_name}</td>
                            <td className="px-2 py-1 border">₱{record.tax_amount.toLocaleString()}</td>
                            <td className="px-2 py-1 border">{record.status.charAt(0).toUpperCase() + record.status.slice(1)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="mt-1 font-semibold text-gray-800">Total Collected: ₱{totalIncome.toLocaleString()}</div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
