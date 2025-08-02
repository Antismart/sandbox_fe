"use client"

import * as React from "react"

import { useMediaQuery } from "@/hooks/use-mobile"

export function useIsMobile() {
  const isMobile = useMediaQuery("(max-width: 768px)")
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  return mounted ? isMobile : false
}
