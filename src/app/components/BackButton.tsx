"use client"

import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default function BackButton() {
  return (
    <Link
      href="/"
      className="inline-flex items-center px-2 py-1 text-xs font-medium text-white bg-green-600 rounded hover:bg-green-700 transition"
    >
      <ArrowLeft className="w-3 h-3 mr-1" />
      Back
    </Link>
  )
}
