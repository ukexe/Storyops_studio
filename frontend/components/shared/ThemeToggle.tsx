"use client"

import { Moon, Sun } from "lucide-react"
import { useEffect } from "react"

import { Button } from "@/components/ui/button"

export function ThemeToggle() {
  useEffect(() => {
    const stored = localStorage.getItem("storyops-theme")
    const dark =
      stored === "dark" ||
      (!stored && window.matchMedia("(prefers-color-scheme: dark)").matches)
    document.documentElement.classList.toggle("dark", dark)
  }, [])

  function toggleTheme() {
    const dark = !document.documentElement.classList.contains("dark")
    document.documentElement.classList.toggle("dark", dark)
    localStorage.setItem("storyops-theme", dark ? "dark" : "light")
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      onClick={toggleTheme}
      aria-label="Toggle dark mode"
      title="Toggle dark mode"
    >
      <Moon className="dark:hidden" />
      <Sun className="hidden dark:block" />
    </Button>
  )
}
