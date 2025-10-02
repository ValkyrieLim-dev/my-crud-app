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
  start_date: string
  expenses: Expense[]
  sales: Sale[]
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

  useEffect(() => {
    fetchCroppings()
  }, [])

  const fetchCroppings = async () => {
    setLoading(true)
    const { data, error } = await supabase.from("fishpond_croppings").select("*")
    if (!error && data) {
      setCroppings(data as Cropping[])
    }
    setLoading(false)
  }

  const addExpense = async () => {
    if (!selectedCropping) return

    const newExpense: Expense = {
      name: expenseName,
      amount: parseFloat(expenseAmount),
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
      fetchCroppings()
      setExpenseName("")
      setExpenseAmount("")
      setShowExpenseModal(false)
    }
  }

  const addSale = async () => {
    if (!selectedCropping) return

    const total = parseFloat(kilos) * parseFloat(pricePerKilo)
    const newSale: Sale = {
      fishType,
      kilos: parseFloat(kilos),
      pricePerKilo: parseFloat(pricePerKilo),
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
      fetchCroppings()
      setFishType("")
      setKilos("")
      setPricePerKilo("")
      setShowSaleModal(false)
    }
  }

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
      minimumFractionDigits: 2,
    }).format(value)

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <BackButton />
      <h1 className="text-2xl font-bold text-center text-blue-700 mb-6">
        Fishpond Croppings
      </h1>

      {loading && <p className="text-gray-600 text-center">Loading...</p>}

      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
        {croppings.map((c) => {
          const totalExpenses = c.expenses?.reduce((sum, e) => sum + e.amount, 0) || 0
          const totalSales = c.sales?.reduce((sum, s) => sum + s.total, 0) || 0
          const netIncome = totalSales - totalExpenses

          const day0Text = `Day 0 since Buhi – ${new Date(c.start_date).toLocaleDateString(
            "en-US",
            { month: "long", day: "numeric", year: "numeric" }
          )}`

          return (
            <div
              key={c.id}
              className="bg-white rounded-xl shadow-md p-4 border border-gray-200"
            >
              <p className="text-sm italic text-gray-500">{day0Text}</p>

              <div className="mt-2">
                <h2 className="font-semibold text-gray-800">Expenses</h2>
                {c.expenses.length > 0 ? (
                  <ul className="list-disc pl-5 text-sm text-gray-700">
                    {c.expenses.map((e, idx) => (
                      <li key={idx}>
                        {e.name}: {formatCurrency(e.amount)} ({e.date})
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-400 text-sm">No expenses yet</p>
                )}

                <button
                  onClick={() => {
                    setSelectedCropping(c.id)
                    setShowExpenseModal(true)
                  }}
                  className="mt-2 w-full bg-red-500 text-white px-3 py-1 rounded-md text-sm"
                >
                  + Add Expense
                </button>
              </div>

              <div className="mt-4">
                <h2 className="font-semibold text-gray-800">Sales</h2>
                {c.sales.length > 0 ? (
                  <ul className="list-disc pl-5 text-sm text-gray-700">
                    {c.sales.map((s, idx) => (
                      <li key={idx}>
                        {s.fishType} – {s.kilos}kg @ {formatCurrency(s.pricePerKilo)} ={" "}
                        {formatCurrency(s.total)} ({s.date})
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-400 text-sm">No sales yet</p>
                )}

                <button
                  onClick={() => {
                    setSelectedCropping(c.id)
                    setShowSaleModal(true)
                  }}
                  className="mt-2 w-full bg-green-500 text-white px-3 py-1 rounded-md text-sm"
                >
                  + Add Sale
                </button>
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
                onClick={() => setShowExpenseModal(false)}
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
                onClick={() => setShowSaleModal(false)}
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
