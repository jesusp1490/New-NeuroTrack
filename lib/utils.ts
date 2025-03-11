import { ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...classes: (string | undefined | boolean)[]) {
  return classes.filter(Boolean).join(" ")
}

