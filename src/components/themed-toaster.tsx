"use client"

import { Toaster } from "sonner"
import { useTheme } from "@/components/theme-provider"

export function ThemedToaster() {
  const { resolvedTheme } = useTheme()

  return (
    <Toaster
      theme={resolvedTheme as "light" | "dark"}
      position="bottom-right"
      toastOptions={{
        className: "font-sans",
        style: {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--success-bg": "var(--popover)",
          "--success-text": "var(--popover-foreground)",
          "--success-border": "var(--border)",
          "--error-bg": "var(--popover)",
          "--error-text": "var(--destructive)",
          "--error-border": "var(--border)",
        } as React.CSSProperties,
      }}
    />
  )
}
