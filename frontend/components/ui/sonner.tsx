"use client"

import { Toaster as Sonner } from "sonner"

export function Toaster() {
  return (
    <Sonner
      closeButton
      richColors
      position="top-right"
      toastOptions={{ className: "font-sans" }}
    />
  )
}
