"use client"

import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default function BackButton() {
  return (
    <Link
      href="/"
      className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition"
    >
      <ArrowLeft className="w-4 h-4 mr-2" />
      Back to Homepage
    </Link>
  )
}
