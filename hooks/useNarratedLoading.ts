import { useCallback, useEffect, useRef, useState } from "react"

const defaultMessages = [
  "Analisando seu material…",
  "Estruturando as ideias…",
  "Finalizando…",
] as const

export function useNarratedLoading(
  steps: readonly string[] = defaultMessages,
  interval = 2000
) {
  const timerRef = useRef<number | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [running, setRunning] = useState(false)
  const messagesRef = useRef(steps)
  const indexRef = useRef(0)

  const stop = useCallback(() => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current)
      timerRef.current = null
    }
    indexRef.current = 0
    setRunning(false)
    setMessage(null)
  }, [])

  const tick = useCallback(() => {
    const currentMessages = messagesRef.current
    setMessage(currentMessages[indexRef.current])
    indexRef.current = (indexRef.current + 1) % currentMessages.length
    timerRef.current = window.setTimeout(tick, interval)
  }, [interval])

  const start = useCallback(
    (customMessages?: readonly string[]) => {
      stop()
      messagesRef.current = customMessages?.length ? customMessages : steps
      setRunning(true)
      tick()
    },
    [steps, stop, tick]
  )

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current)
      }
    }
  }, [])

  return { message, running, start, stop }
}
