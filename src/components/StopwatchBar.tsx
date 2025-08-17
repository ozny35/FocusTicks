import { useState } from 'react'
import { motion } from 'framer-motion'
import { FiPlay, FiPause, FiRotateCcw } from 'react-icons/fi'

interface StopwatchBarProps {
  elapsed: number
  running: boolean
  onStart: () => void
  onStop: () => void
  onReset: () => void
  formatTime: (ms: number) => string
}

export default function StopwatchBar({ elapsed, running, onStart, onStop, onReset, formatTime }: StopwatchBarProps) {
  const [pressFx, setPressFx] = useState({ start: 0, stop: 0, reset: 0 })

  return (
    <motion.div
      layout
      className="mb-3 flex items-center justify-between rounded-2xl border border-neutral-800 bg-neutral-900 px-3 py-2 text-white"
    >
      <div className="font-mono text-lg tabular-nums tracking-tight">{formatTime(elapsed)}</div>
      <div className="flex items-center gap-2">
        {/* Start */}
        <motion.button
          onClick={() => {
            setPressFx(f => ({ ...f, start: f.start + 1 }))
            onStart()
          }}
          disabled={running}
          whileHover={running ? undefined : { scale: 1.06, opacity: 1 }}
          whileTap={{ scale: 0.95 }}
          className="relative inline-flex items-center justify-center rounded-full border border-neutral-700 bg-neutral-900 p-2 text-neutral-200 hover:bg-neutral-800 disabled:text-neutral-500 disabled:border-neutral-800 disabled:hover:bg-neutral-900 disabled:cursor-not-allowed overflow-hidden"
          title="Start"
          aria-label="Start"
        >
          {pressFx.start > 0 && (
            <motion.span
              key={pressFx.start}
              className="pointer-events-none absolute inset-0"
              initial={{ opacity: 0.35, scale: 0 }}
              animate={{ opacity: 0, scale: 1.8 }}
              transition={{ duration: 0.45, ease: 'easeOut' }}
              style={{
                background: 'radial-gradient(circle, rgba(255,255,255,0.65) 0%, rgba(255,255,255,0.25) 35%, rgba(255,255,255,0) 70%)'
              }}
              aria-hidden
            />
          )}
          <FiPlay />
        </motion.button>
        {/* Stop */}
        <motion.button
          onClick={() => {
            setPressFx(f => ({ ...f, stop: f.stop + 1 }))
            onStop()
          }}
          disabled={!running}
          whileHover={!running ? undefined : { scale: 1.06, opacity: 1 }}
          whileTap={{ scale: 0.95 }}
          className="relative inline-flex items-center justify-center rounded-full border border-neutral-700 bg-neutral-900 p-2 text-neutral-200 hover:bg-neutral-800 disabled:text-neutral-500 disabled:border-neutral-800 disabled:hover:bg-neutral-900 disabled:cursor-not-allowed overflow-hidden"
          title="Stop"
          aria-label="Stop"
        >
          {pressFx.stop > 0 && (
            <motion.span
              key={pressFx.stop}
              className="pointer-events-none absolute inset-0"
              initial={{ opacity: 0.35, scale: 0 }}
              animate={{ opacity: 0, scale: 1.8 }}
              transition={{ duration: 0.45, ease: 'easeOut' }}
              style={{
                background: 'radial-gradient(circle, rgba(255,255,255,0.65) 0%, rgba(255,255,255,0.25) 35%, rgba(255,255,255,0) 70%)'
              }}
              aria-hidden
            />
          )}
          <FiPause />
        </motion.button>
        {/* Reset */}
        <motion.button
          onClick={() => {
            setPressFx(f => ({ ...f, reset: f.reset + 1 }))
            onReset()
          }}
          disabled={elapsed === 0}
          whileHover={elapsed === 0 ? undefined : { scale: 1.06, opacity: 1 }}
          whileTap={{ scale: 0.95 }}
          className="relative inline-flex items-center justify-center rounded-full border border-neutral-700 bg-neutral-900 p-2 text-neutral-200 hover:bg-neutral-800 disabled:text-neutral-500 disabled:border-neutral-800 disabled:hover:bg-neutral-900 disabled:cursor-not-allowed overflow-hidden"
          title="Reset"
          aria-label="Reset"
        >
          {pressFx.reset > 0 && (
            <motion.span
              key={pressFx.reset}
              className="pointer-events-none absolute inset-0"
              initial={{ opacity: 0.35, scale: 0 }}
              animate={{ opacity: 0, scale: 1.8 }}
              transition={{ duration: 0.45, ease: 'easeOut' }}
              style={{
                background: 'radial-gradient(circle, rgba(255,255,255,0.65) 0%, rgba(255,255,255,0.25) 35%, rgba(255,255,255,0) 70%)'
              }}
              aria-hidden
            />
          )}
          <FiRotateCcw />
        </motion.button>
      </div>
    </motion.div>
  )
}
