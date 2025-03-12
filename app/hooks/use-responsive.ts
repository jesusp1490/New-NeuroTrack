"use client"

import { useEffect, useState } from "react"

export function useResponsive() {
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== "undefined" ? window.innerWidth : 0,
    height: typeof window !== "undefined" ? window.innerHeight : 0,
  })

  const [isMobile, setIsMobile] = useState(false)
  const [isTablet, setIsTablet] = useState(false)
  const [isDesktop, setIsDesktop] = useState(false)

  useEffect(() => {
    // Only run on client side
    if (typeof window === "undefined") return

    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      })
    }

    window.addEventListener("resize", handleResize)
    handleResize() // Initial call

    return () => window.removeEventListener("resize", handleResize)
  }, [])

  useEffect(() => {
    setIsMobile(windowSize.width < 640)
    setIsTablet(windowSize.width >= 640 && windowSize.width < 1024)
    setIsDesktop(windowSize.width >= 1024)
  }, [windowSize])

  return {
    windowSize,
    isMobile,
    isTablet,
    isDesktop,
    breakpoints: {
      sm: windowSize.width >= 640,
      md: windowSize.width >= 768,
      lg: windowSize.width >= 1024,
      xl: windowSize.width >= 1280,
      "2xl": windowSize.width >= 1536,
    },
  }
}

