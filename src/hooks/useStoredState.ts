import { useEffect, useRef, useState } from 'react'
import { compressToUTF16, decompressFromUTF16 } from 'lz-string'

export default function useStoredState<T>(key: string, initial: T) {
  // Read once from localStorage with backward compatibility:
  // - New format: 'lz:' + compressToUTF16(JSON.stringify(state))
  // - Old format: plain JSON string
  const [state, setState] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key)
      if (!raw) return initial
      if (raw.startsWith('lz:')) {
        const decompressed = decompressFromUTF16(raw.slice(3))
        if (decompressed == null) return initial
        return JSON.parse(decompressed) as T
      }
      // Fallback to legacy plain JSON
      return JSON.parse(raw) as T
    } catch {
      return initial
    }
  })

  // Avoid redundant writes if nothing changed after stringify+compress
  const lastSavedRef = useRef<string | null>(null)

  useEffect(() => {
    const id = window.setTimeout(() => {
      try {
        const json = JSON.stringify(state)
        const payload = `lz:${compressToUTF16(json)}`
        if (payload !== lastSavedRef.current) {
          localStorage.setItem(key, payload)
          lastSavedRef.current = payload
        }
      } catch {
        console.error('Failed to save state to localStorage')
      }
    }, 250)
    return () => window.clearTimeout(id)
  }, [key, state])

  return [state, setState] as const
}
