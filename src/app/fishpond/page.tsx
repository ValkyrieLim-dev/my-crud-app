"use client"

import { useEffect, useState } from "react"
import { supabase } from "../lib/supabaseClient"
import BackButton from "../components/BackButton"

// Type definitions
interface Expense {
  name: string
  amount: number
  date: string
}

interface Sale {
  fishType: string
  kilos: number
  pricePerKilo: number
  total: number
  date: string
}

interface Cropping {
  id: number
  start_date: string | null
  expenses?: Expense[] | null
  sales?: Sale[] | null
  completed?: boolean
  completed_date?: string | null
}

export default function FishpondPage() {
  const [croppings, setCroppings] = useState<Cropping[]>([])
  const [loading, setLoading] = useState(false)

  // Modals state
  const [showExpenseModal, setShowExpenseModal] = useState(false)
  const [showSaleModal, setShowSaleModal] = useState(false)
  const [selectedCropping, setSelectedCropping] = useState<number | null>(null)

  // Expense input
  const [expenseName, setExpenseName] = useState("")
  const [expenseAmount, setExpenseAmount] = useState("")

  // Sale input
  const [fishType, setFishType] = useState("")
  const [kilos, setKilos] = useState("")
  const [pricePerKilo, setPricePerKilo] = useState("")

  // New cropping modal
  const [showCroppingModal, setShowCroppingModal] = useState(false)
  const [newCroppingDate, setNewCroppingDate] = useState("")
  // inside your Cropping Modal: replace the existing onClick handler with this function
const createCropping = async () => {
  try {
    // disable the UI while saving (you can use a state like `saving`)
    const start = newCroppingDate || new Date().toISOString().split("T")[0]

    // Insert only fields you are sure exist in the DB. If your table does NOT
    // already have expenses/sales/completed columns, do NOT include them here.
    // For safety, we insert only start_date and return the inserted row.
    const { data, error } = await supabase
      .from("fishpond_croppings")
      .insert([{ start_date: start }])
      .select()
      .single()

    if (error) {
      // show more useful debug info
      console.error("create cropping error (detailed):", JSON.stringify(error, null, 2))
      alert("Failed to create cropping: " + (error.message || JSON.stringify(error)))
      return
    }

    // success -> refresh and close modal
    await fetchCroppings()
    setNewCroppingDate("")
    setShowCroppingModal(false)
  } catch (err) {
    console.error("unexpected error creating cropping:", err)
    alert("Unexpected error: " + String(err))
  } finally {
    // clear any saving flags here
  }
}

  useEffect(() => {
    fetchCroppings()
  }, [])

  const fetchCroppings = async () => {
    setLoading(true)
    // select all columns including completed/completed_date if present
    const { data, error } = await supabase.from("fishpond_croppings").select("*").order("id", { ascending: false })
    if (!error && data) {
      setCroppings(data as Cropping[])
    } else {
      console.error("fetchCroppings error", error)
    }
    setLoading(false)
  }

  const addExpense = async () => {
    if (!selectedCropping) return

    const newExpense: Expense = {
      name: expenseName,
      amount: parseFloat(expenseAmount) || 0,
      date: new Date().toISOString().split("T")[0],
    }

    const cropping = croppings.find((c) => c.id === selectedCropping)
    if (!cropping) return

    const updatedExpenses = [...(cropping.expenses || []), newExpense]

    const { error } = await supabase
      .from("fishpond_croppings")
      .update({ expenses: updatedExpenses })
      .eq("id", selectedCropping)

    if (!error) {
      await fetchCroppings()
      setExpenseName("")
      setExpenseAmount("")
      setShowExpenseModal(false)
      setSelectedCropping(null)
    } else {
      console.error("addExpense error", error)
    }
  }

  const addSale = async () => {
    if (!selectedCropping) return

    const total = (parseFloat(kilos) || 0) * (parseFloat(pricePerKilo) || 0)
    const newSale: Sale = {
      fishType,
      kilos: parseFloat(kilos) || 0,
      pricePerKilo: parseFloat(pricePerKilo) || 0,
      total,
      date: new Date().toISOString().split("T")[0],
    }

    const cropping = croppings.find((c) => c.id === selectedCropping)
    if (!cropping) return

    const updatedSales = [...(cropping.sales || []), newSale]

    const { error } = await supabase
      .from("fishpond_croppings")
      .update({ sales: updatedSales })
      .eq("id", selectedCropping)

    if (!error) {
      await fetchCroppings()
      setFishType("")
      setKilos("")
      setPricePerKilo("")
      setShowSaleModal(false)
      setSelectedCropping(null)
    } else {
      console.error("addSale error", error)
    }
  }

  const completeCropping = async (id: number) => {
    // optional confirmation
    const ok = window.confirm("Mark this cropping as COMPLETE? This will archive the cropping and store completion date.")
    if (!ok) return

    const completed_date = new Date().toISOString().split("T")[0]
    const { error } = await supabase
      .from("fishpond_croppings")
      .update({ completed: true, completed_date })
      .eq("id", id)

    if (!error) {
      await fetchCroppings()
    } else {
      console.error("completeCropping error", error)
    }
  }

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
      minimumFractionDigits: 2,
    }).format(value)

  const daysSince = (dateString?: string | null) => {
    if (!dateString) return "Start date not set"
    const start = new Date(dateString)
    if (isNaN(start.getTime())) return "Invalid start date"
    const diffMs = Date.now() - start.getTime()
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    return `Day ${Math.max(0, days)} since Buhi – ${start.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    })}`
  }

  // Separate lists
  const activeCroppings = croppings.filter((c) => !c.completed)
  const completedCroppings = croppings.filter((c) => c.completed)

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <BackButton />
      <div className="mb-4 flex justify-center">
        <button
          onClick={() => setShowCroppingModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md"
        >
          + Add New Cropping
        </button>
      </div>

      <h1 className="text-2xl font-bold text-center text-blue-700 mb-6">
        Fishpond Croppings
      </h1>

      {loading && <p className="text-gray-600 text-center">Loading...</p>}

      <h3 className="text-lg font-semibold mb-2">Active Croppings</h3>
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 mb-6">
        {activeCroppings.length === 0 && <p className="text-gray-500">No active croppings</p>}
        {activeCroppings.map((c) => {
          const expensesArr = c.expenses || []
          const salesArr = c.sales || []
          const totalExpenses = expensesArr.reduce((sum, e) => sum + (e.amount || 0), 0)
          const totalSales = salesArr.reduce((sum, s) => sum + (s.total || 0), 0)
          const netIncome = totalSales - totalExpenses

          return (
            <div
              key={c.id}
              className="bg-white rounded-xl shadow-md p-4 border border-gray-200"
            >
              <p className="text-sm italic text-gray-500">{daysSince(c.start_date)}</p>

              <div className="mt-2">
  <h2 className="font-semibold text-gray-800">Expenses</h2>
  {expensesArr.length > 0 ? (
    <table className="w-full border-collapse border text-sm text-gray-700">
      <thead>
        <tr className="bg-gray-100">
          <th className="border px-2 py-1 text-left">Name</th>
          <th className="border px-2 py-1 text-right">Amount</th>
          <th className="border px-2 py-1">Date</th>
        </tr>
      </thead>
      <tbody>
        {expensesArr.map((e, idx) => (
          <tr key={idx}>
            <td className="border px-2 py-1">{e.name}</td>
            <td className="border px-2 py-1 text-right">{formatCurrency(e.amount || 0)}</td>
            <td className="border px-2 py-1 text-center">{e.date}</td>
          </tr>
        ))}
      </tbody>
    </table>
  ) : (
    <p className="text-gray-400 text-sm">No expenses yet</p>
  )}
</div>

<div className="mt-4">
  <h2 className="font-semibold text-gray-800">Sales</h2>
  {salesArr.length > 0 ? (
    <table className="w-full border-collapse border text-sm text-gray-700">
      <thead>
        <tr className="bg-gray-100">
          <th className="border px-2 py-1">Fish Type</th>
          <th className="border px-2 py-1 text-right">Kilos</th>
          <th className="border px-2 py-1 text-right">Price/Kilo</th>
          <th className="border px-2 py-1 text-right">Total</th>
          <th className="border px-2 py-1">Date</th>
        </tr>
      </thead>
      <tbody>
        {salesArr.map((s, idx) => (
          <tr key={idx}>
            <td className="border px-2 py-1">{s.fishType}</td>
            <td className="border px-2 py-1 text-right">{s.kilos}</td>
            <td className="border px-2 py-1 text-right">{formatCurrency(s.pricePerKilo)}</td>
            <td className="border px-2 py-1 text-right">{formatCurrency(s.total)}</td>
            <td className="border px-2 py-1 text-center">{s.date}</td>
          </tr>
        ))}
      </tbody>
    </table>
  ) : (
    <p className="text-gray-400 text-sm">No sales yet</p>
  )}


                <div className="mt-4 flex justify-between">
                  <button
                    onClick={() => {
                      setSelectedCropping(c.id)
                      setShowExpenseModal(true)
                    }}
                    className="text-gray-700 text-sm px-2 py-1 rounded hover:bg-gray-200 transition"
                  >
                    + Expense
                  </button>

                  <button
                    onClick={() => {
                      setSelectedCropping(c.id)
                      setShowSaleModal(true)
                    }}
                    className="text-gray-700 text-sm px-2 py-1 rounded hover:bg-gray-200 transition"
                  >
                    + Sale
                  </button>

                  <button
                    onClick={() => completeCropping(c.id)}
                    className="text-white text-sm px-3 py-1 rounded bg-green-600 hover:bg-green-700 transition"
                  >
                    Complete
                  </button>
                </div>
              </div>

              <div className="mt-4 text-sm">
                <p className="font-semibold text-gray-700">
                  Total Expenses: {formatCurrency(totalExpenses)}
                </p>
                <p className="font-semibold text-gray-700">
                  Total Sales: {formatCurrency(totalSales)}
                </p>
                <p className="font-semibold text-gray-800">
                  Net Income: {formatCurrency(netIncome)}
                </p>
              </div>
            </div>
          )
        })}
      </div>

      <h3 className="text-lg font-semibold mb-2">Completed Croppings</h3>
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
        {completedCroppings.length === 0 && <p className="text-gray-500">No completed croppings yet</p>}
        {completedCroppings.map((c) => {
          const expensesArr = c.expenses || []
          const salesArr = c.sales || []
          const totalExpenses = expensesArr.reduce((sum, e) => sum + (e.amount || 0), 0)
          const totalSales = salesArr.reduce((sum, s) => sum + (s.total || 0), 0)
          const netIncome = totalSales - totalExpenses

          const completedText = c.completed_date
            ? `Completed on ${new Date(c.completed_date).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}`
            : "Completed"

          return (
            <div
              key={c.id}
              className="bg-white rounded-xl shadow-md p-4 border border-gray-200 opacity-90"
            >
              <p className="text-sm italic text-gray-500">{completedText}</p>
              <p className="text-sm italic text-gray-500">{daysSince(c.start_date)}</p>

              <div className="mt-2">
  <h2 className="font-semibold text-gray-800">Expenses</h2>
  {expensesArr.length > 0 ? (
    <table className="w-full border-collapse border text-sm text-gray-700">
      <thead>
        <tr className="bg-gray-100">
          <th className="border px-2 py-1 text-left">Name</th>
          <th className="border px-2 py-1 text-right">Amount</th>
          <th className="border px-2 py-1">Date</th>
        </tr>
      </thead>
      <tbody>
        {expensesArr.map((e, idx) => (
          <tr key={idx}>
            <td className="border px-2 py-1">{e.name}</td>
            <td className="border px-2 py-1 text-right">
              {formatCurrency(e.amount || 0)}
            </td>
            <td className="border px-2 py-1 text-center">{e.date}</td>
          </tr>
        ))}
      </tbody>
    </table>
  ) : (
    <p className="text-gray-400 text-sm">No expenses yet</p>
  )}
</div>


              <div className="mt-4">
  <h2 className="font-semibold text-gray-800">Sales</h2>
  {salesArr.length > 0 ? (
    <table className="w-full border-collapse border text-sm text-gray-700">
      <thead>
        <tr className="bg-gray-100">
          <th className="border px-2 py-1">Fish Type</th>
          <th className="border px-2 py-1 text-right">Kilos</th>
          <th className="border px-2 py-1 text-right">Price/Kilo</th>
          <th className="border px-2 py-1 text-right">Total</th>
          <th className="border px-2 py-1">Date</th>
        </tr>
      </thead>
      <tbody>
        {salesArr.map((s, idx) => (
          <tr key={idx}>
            <td className="border px-2 py-1">{s.fishType}</td>
            <td className="border px-2 py-1 text-right">{s.kilos}</td>
            <td className="border px-2 py-1 text-right">{formatCurrency(s.pricePerKilo)}</td>
            <td className="border px-2 py-1 text-right">{formatCurrency(s.total)}</td>
            <td className="border px-2 py-1 text-center">{s.date}</td>
          </tr>
        ))}
      </tbody>
    </table>
  ) : (
    <p className="text-gray-400 text-sm">No sales yet</p>
  )}
</div>


              <div className="mt-4 text-sm">
                <p className="font-semibold text-gray-700">
                  Total Expenses: {formatCurrency(totalExpenses)}
                </p>
                <p className="font-semibold text-gray-700">
                  Total Sales: {formatCurrency(totalSales)}
                </p>
                <p className="font-semibold text-gray-800">
                  Net Income: {formatCurrency(netIncome)}
                </p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Expense Modal */}
      {showExpenseModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-sm">
            <h2 className="text-lg font-bold mb-4">Add Expense</h2>
            <input
              type="text"
              placeholder="Expense Name"
              value={expenseName}
              onChange={(e) => setExpenseName(e.target.value)}
              className="w-full border p-2 rounded mb-2"
            />
            <input
              type="number"
              placeholder="Amount"
              value={expenseAmount}
              onChange={(e) => setExpenseAmount(e.target.value)}
              className="w-full border p-2 rounded mb-2"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowExpenseModal(false)
                  setSelectedCropping(null)
                }}
                className="px-4 py-2 bg-gray-300 rounded"
              >
                Cancel
              </button>
              <button
                onClick={addExpense}
                className="px-4 py-2 bg-red-500 text-white rounded"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cropping Modal */}
      {showCroppingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-sm">
            <h2 className="text-lg font-bold mb-4">Add New Cropping</h2>
            <label className="block mb-2">
              Start Date
              <input
                type="date"
                value={newCroppingDate}
                onChange={(e) => setNewCroppingDate(e.target.value)}
                className="w-full border p-2 rounded mt-1"
              />
            </label>
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setShowCroppingModal(false)}
                className="px-4 py-2 bg-gray-300 rounded"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  const start = newCroppingDate || new Date().toISOString().split("T")[0]
                  const { error } = await supabase
                    .from("fishpond_croppings")
                    .insert([{ start_date: start, expenses: [], sales: [], completed: false }])
                  if (!error) {
                    await fetchCroppings()
                    setNewCroppingDate("")
                    setShowCroppingModal(false)
                  } else {
                    console.error("create cropping error", error)
                  }
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sale Modal */}
      {showSaleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-sm">
            <h2 className="text-lg font-bold mb-4">Add Sale</h2>
            <input
              type="text"
              placeholder="Fish Type"
              value={fishType}
              onChange={(e) => setFishType(e.target.value)}
              className="w-full border p-2 rounded mb-2"
            />
            <input
              type="number"
              placeholder="Kilos"
              value={kilos}
              onChange={(e) => setKilos(e.target.value)}
              className="w-full border p-2 rounded mb-2"
            />
            <input
              type="number"
              placeholder="Price per Kilo"
              value={pricePerKilo}
              onChange={(e) => setPricePerKilo(e.target.value)}
              className="w-full border p-2 rounded mb-2"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowSaleModal(false)
                  setSelectedCropping(null)
                }}
                className="px-4 py-2 bg-gray-300 rounded"
              >
                Cancel
              </button>
              <button
                onClick={addSale}
                className="px-4 py-2 bg-green-500 text-white rounded"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
