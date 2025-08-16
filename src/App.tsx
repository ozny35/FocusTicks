import { useEffect, useMemo, useState, useRef, useCallback, memo, lazy, Suspense } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence, useDragControls } from 'framer-motion'
import { FiPlus, FiCheck, FiChevronDown, FiList, FiFolderPlus, FiX, FiPlay, FiPause, FiRotateCcw, FiMenu, FiEdit2, FiSave, FiCalendar, FiFileText } from 'react-icons/fi'

// Lazy-load heavy emoji picker for better initial performance
const EmojiPickerLazy = lazy(() => import('emoji-picker-react').then(m => ({ default: m.default })))

import type { EmojiClickData } from 'emoji-picker-react'
import { Reorder } from 'framer-motion'
import Modal from './components/Modal'
import ColorPicker from './components/ColorPicker'

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#ef4444']

// Types
type Todo = {
  id: string
  text: string
  done: boolean
  completedAt?: number // elapsed ms of the list stopwatch when marked done
  notes?: string
  dueDate?: string
  color?: string
}

type Section = {
  id: string
  title: string
  todos: Todo[]
  stopwatch?: { elapsed: number; running: boolean; startedAt: number | null }
  color?: string
  categoryId?: string
}

type Category = {
  id: string
  title: string
  emoji: string
  color?: string
}

const makeId = () => crypto.randomUUID()

const useStoredState = <T,>(key: string, initial: T) => {
  const [state, setState] = useState<T>(() => {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : initial
  })
  useEffect(() => {
    // Debounce writes to avoid spamming localStorage during rapid updates
    const id = window.setTimeout(() => {
      try {
        localStorage.setItem(key, JSON.stringify(state))
      } catch {}
    }, 250)
    return () => window.clearTimeout(id)
  }, [key, state])
  return [state, setState] as const
}

const TodoItem = memo(({
  todo,
  section,
  toggleTodo,
  deleteTodo,
  formatTime,
  updateTodoDetails,
}: {
  todo: Todo
  section: Section
  toggleTodo: (sid: string, tid: string) => void
  deleteTodo: (sid: string, tid: string) => void
  formatTime: (ms: number) => string
  updateTodoDetails: (sid: string, tid: string, details: { notes?: string; dueDate?: string; color?: string }) => void
}) => {
  const dragControls = useDragControls()
  const [isEditing, setIsEditing] = useState(false)
  const [notes, setNotes] = useState(todo.notes || '')
  const [dueDate, setDueDate] = useState(todo.dueDate || '')
  const [color, setColor] = useState(todo.color || '')

  const handleSave = () => {
    updateTodoDetails(section.id, todo.id, { notes, dueDate, color })
    setIsEditing(false)
  }

  return (
    <Reorder.Item
      key={todo.id}
      value={todo}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      dragListener={false}
      dragControls={dragControls}
      className="bg-neutral-900/50 rounded-xl p-3 border-l-4"
      style={{ borderColor: todo.color || 'transparent' }}
    >
      <div className="group flex items-start gap-3">
        <div
          onPointerDown={e => dragControls.start(e)}
          className="cursor-grab p-2 pt-1"
          style={{ touchAction: 'none', WebkitUserSelect: 'none', userSelect: 'none' }}
        >
          <FiMenu className="text-neutral-500" />
        </div>
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={() => toggleTodo(section.id, todo.id)}
          className={`relative mt-1 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border ${
            todo.done
              ? 'border-[color:var(--muted-orange,#b86b2b)] bg-[color:var(--muted-orange,#b86b2b)]/15'
              : 'border-neutral-700 bg-neutral-950'
          }`}
          aria-label={todo.done ? 'Mark as incomplete' : 'Complete'}
          title={todo.done ? 'Undo' : 'Complete'}
        >
          {todo.done && <FiCheck className="text-[color:var(--muted-orange,#b86b2b)]" size={16} />}
        </motion.button>
        <div className="flex-1">
          <span
            className={`text-lg ${
              todo.done ? 'line-through decoration-2 decoration-[color:var(--muted-orange,#b86b2b)] text-neutral-400' : 'text-neutral-100'
            }`}
          >
            {todo.text}
          </span>
          {!isEditing && (todo.notes || todo.dueDate) && (
            <motion.div layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-2 flex flex-col gap-2 border-t border-neutral-800/50 pt-2 text-sm">
              {todo.notes && <p className="text-neutral-300 whitespace-pre-wrap flex items-start gap-2"><FiFileText className="mt-1 shrink-0"/><span>{todo.notes}</span></p>}
              {todo.dueDate && <p className="text-neutral-300 flex items-center gap-2"><FiCalendar className="shrink-0"/><span>{todo.dueDate}</span></p>}
            </motion.div>
          )}
        </div>
        {todo.done && typeof todo.completedAt === 'number' && (
          <span
            className={`ml-3 self-start mt-1 rounded-full px-2.5 py-1 text-sm font-medium ${(() => {
              const h = Math.floor((todo.completedAt || 0) / 3600000)
              if (h <= 2) return 'text-neutral-100'   // <= 2 hours
              if (h <= 4) return 'text-emerald-400' // 2-4 hours
              if (h <= 6) return 'text-orange-400'  // 4-6 hours
              return 'text-red-400'               // > 6 hours
            })()}`}
            title="Captured stopwatch time"
          >
            {formatTime(todo.completedAt || 0)}
          </span>
        )}
        <motion.button
          whileTap={{ scale: 0.94 }}
          onClick={() => setIsEditing(!isEditing)}
          className="ml-auto inline-flex items-center justify-center rounded-xl border border-neutral-800 bg-neutral-900 p-2 text-neutral-300 opacity-0 shadow-subtle hover:bg-neutral-800 transition-opacity duration-200 ease-out group-hover:opacity-100"
          title="Edit Details"
        >
          <FiEdit2 />
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.94 }}
          onClick={() => deleteTodo(section.id, todo.id)}
          className="inline-flex items-center justify-center rounded-xl border border-neutral-800 bg-neutral-900 p-2 text-neutral-300 opacity-0 shadow-subtle hover:bg-neutral-800 transition-opacity duration-200 ease-out group-hover:opacity-100"
          title="Delete"
          aria-label="Delete"
        >
          <FiX />
        </motion.button>
      </div>
      <AnimatePresence>
        {isEditing && (
          <motion.div
            layout
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: 'auto', marginTop: '16px' }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            className="overflow-hidden"
          >
            <div className="flex flex-col gap-4 border-t border-neutral-800 pt-4 pl-12">
              <div className="flex flex-col gap-2">
                <label className="text-sm text-neutral-400 flex items-center gap-2"><FiFileText /> Notes</label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Add some notes..."
                  className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-base outline-none placeholder:text-neutral-500 focus:ring-1 focus:ring-[color:var(--muted-orange,#b86b2b)]"
                  rows={3}
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm text-neutral-400 flex items-center gap-2"><FiCalendar /> Due Date</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={e => setDueDate(e.target.value)}
                  className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-base outline-none placeholder:text-neutral-500 focus:ring-1 focus:ring-[color:var(--muted-orange,#b86b2b)]"
                />
              </div>
              <ColorPicker colors={COLORS} selectedColor={color} onChange={setColor} />
              <div className="flex justify-end gap-3">
                <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.98 }} onClick={() => setIsEditing(false)} className="rounded-full px-4 py-2 text-neutral-300 hover:bg-neutral-800">
                  Cancel
                </motion.button>
                <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.98 }} onClick={handleSave} className="flex items-center gap-2 rounded-full bg-orange-500/20 px-4 py-2 text-orange-200 hover:bg-orange-500/30">
                  <FiSave /> Save
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Reorder.Item>
  )
});

export default function App() {
  const [sections, setSections] = useStoredState<Section[]>(
    'simpletodo:sections',
    [
      {
        id: makeId(),
        title: 'School',
        color: '#3b82f6',
        todos: [
          { id: makeId(), text: 'Math', done: false },
          { id: makeId(), text: 'Language', done: false },
        ],
      },
    ]
  )
  const [categories, setCategories] = useStoredState<Category[]>('simpletodo:categories', [
    { id: makeId(), title: 'Personal', emoji: '👤' },
    { id: makeId(), title: 'Work', emoji: '💼' },
  ])
  const [activeId, setActiveId] = useStoredState<string>('simpletodo:active', sections[0]?.id || '')
  const [input, setInput] = useState('')

  // New List Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newColor, setNewColor] = useState(COLORS[0])
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('')
  const [isCreatingCategory, setIsCreatingCategory] = useState(false)
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newCategoryEmoji, setNewCategoryEmoji] = useState('✨')
  const [newCategoryColor, setNewCategoryColor] = useState(COLORS[0])
  const active = useMemo(() => sections.find(s => s.id === activeId) ?? sections[0], [sections, activeId])

  // Ensure modal opens in a consistent state to avoid blank renders
  useEffect(() => {
    if (isModalOpen) {
      setIsCreatingCategory(false)
      setIsEmojiPickerOpen(false)
    }
  }, [isModalOpen])

  const groupedSections = useMemo(() => {
    const categorized = sections.filter(s => s.categoryId)
    const uncategorized = sections.filter(s => !s.categoryId)

    const grouped = categories
      .map(c => ({
        category: c,
        sections: categorized.filter(s => s.categoryId === c.id),
      }))
      .filter(g => g.sections.length > 0)

    if (uncategorized.length > 0) {
      grouped.push({
        category: { id: 'uncategorized', title: 'Uncategorized', emoji: '📂' },
        sections: uncategorized,
      })
    }

    return grouped
  }, [sections, categories])
    const [tick, setTick] = useState(0) // re-render timer while any stopwatch runs
  // Read tick once to satisfy TS "is never read" warning (it's used to force rerenders)
  void tick
  // Small click ripple counters for stopwatch buttons
  const [pressFx, setPressFx] = useState({ start: 0, stop: 0, reset: 0 })
  // Custom combobox open state & outside click handling
  const [comboOpen, setComboOpen] = useState(false)
  const comboRef = useRef<HTMLDivElement | null>(null)
  const comboBtnRef = useRef<HTMLButtonElement | null>(null)
  const comboMenuRef = useRef<HTMLUListElement | null>(null)
  const [comboPos, setComboPos] = useState<{ top: number; left: number; width: number }>({ top: 0, left: 0, width: 0 })
  const updateComboPos = () => {
    const el = comboBtnRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const top = r.bottom + 8
    setComboPos({ top, left: r.left, width: r.width })
  }
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node
      const insideTrigger = comboRef.current?.contains(t)
      const insideMenu = comboMenuRef.current?.contains(t)
      if (!insideTrigger && !insideMenu) setComboOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setComboOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [])

  // Keep combobox menu positioned on open/resize/scroll
  useEffect(() => {
    if (!comboOpen) return
    updateComboPos()
    const onResize = () => updateComboPos()
    const onScroll = () => updateComboPos()
    window.addEventListener('resize', onResize)
    window.addEventListener('scroll', onScroll, true)
    return () => {
      window.removeEventListener('resize', onResize)
      window.removeEventListener('scroll', onScroll, true)
    }
  }, [comboOpen])

  // Keep UI time fresh even when tab is backgrounded. Timing is based on Date.now(),
  // so even if intervals are throttled, elapsed stays accurate on next paint.
  useEffect(() => {
    const onVisOrFocus = () => setTick(t => t + 1)
    document.addEventListener('visibilitychange', onVisOrFocus)
    window.addEventListener('focus', onVisOrFocus)
    const id = window.setInterval(() => setTick(t => t + 1), 1000)
    return () => {
      window.clearInterval(id)
      document.removeEventListener('visibilitychange', onVisOrFocus)
      window.removeEventListener('focus', onVisOrFocus)
    }
  }, [])

  useEffect(() => {
    if (!sections.some(s => s.id === activeId) && sections[0]) {
      setActiveId(sections[0].id)
    }
  }, [sections, activeId, setActiveId])

  // Ensure all sections have a stopwatch (migration for old data)
  useEffect(() => {
    setSections(prev =>
      prev.map(s => (s.stopwatch ? s : { ...s, stopwatch: { elapsed: 0, running: false, startedAt: null } }))
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Global ticking while any stopwatch is running
  useEffect(() => {
    const anyRunning = sections.some(s => s.stopwatch?.running)
    if (!anyRunning) return
    const id = window.setInterval(() => setTick(t => t + 1), 500)
    return () => window.clearInterval(id)
  }, [sections])

  const formatTime = (ms: number) => {
    const total = Math.max(0, Math.floor(ms / 1000))
    const h = Math.floor(total / 3600)
    const m = Math.floor((total % 3600) / 60)
    const s = total % 60
    const pad = (n: number) => n.toString().padStart(2, '0')
    return `${pad(h)}:${pad(m)}:${pad(s)}`
  }

  const currentElapsed = (sec?: Section) => {
    if (!sec) return 0
    const sw = sec.stopwatch ?? { elapsed: 0, running: false, startedAt: null }
    return sw.elapsed + (sw.running && sw.startedAt ? Date.now() - sw.startedAt : 0)
  }

  const startStopwatch = useCallback((sid: string) => {
    setSections(prev =>
      prev.map(s =>
        s.id === sid
          ? {
              ...s,
              stopwatch: {
                elapsed: s.stopwatch?.elapsed ?? 0,
                running: true,
                startedAt: Date.now(),
              },
            }
          : s
      )
    )
  }, [setSections])

  const stopStopwatch = useCallback((sid: string) => {
    setSections(prev =>
      prev.map(s => {
        if (s.id !== sid) return s
        const sw = s.stopwatch ?? { elapsed: 0, running: false, startedAt: null }
        if (!sw.running || !sw.startedAt) return { ...s, stopwatch: { ...sw, running: false, startedAt: null } }
        const add = Date.now() - sw.startedAt
        return { ...s, stopwatch: { elapsed: sw.elapsed + add, running: false, startedAt: null } }
      })
    )
  }, [setSections])

  const resetStopwatch = useCallback((sid: string) => {
    setSections(prev => prev.map(s => (s.id === sid ? { ...s, stopwatch: { elapsed: 0, running: false, startedAt: null } } : s)))
  }, [setSections])

  const addTodo = useCallback(() => {
    const text = input.trim()
    if (!text || !active) return
    const newTodo: Todo = { id: makeId(), text, done: false }
    setSections(prev =>
      prev.map(s => (s.id === active.id ? { ...s, todos: [newTodo, ...s.todos] } : s))
    )
    setInput('')
  }, [input, active, setSections, setInput])

  const toggleTodo = useCallback((sid: string, tid: string) => {
    setSections(prev =>
      prev.map(s =>
        s.id === sid
          ? {
              ...s,
              todos: s.todos.map(t =>
                t.id === tid
                  ? {
                      ...t,
                      done: !t.done,
                      completedAt: !t.done ? currentElapsed(s) : undefined,
                    }
                  : t
              ),
            }
          : s
      )
    )
  }, [setSections])

  const addCategory = useCallback(() => {
    const title = newCategoryName.trim()
    if (!title) return
    const newCat: Category = { id: makeId(), title, emoji: newCategoryEmoji || '✨', color: newCategoryColor }
    setCategories(prev => [...prev, newCat])
    setSelectedCategoryId(newCat.id)
    // Reset modal state
    setNewCategoryName('')
    setNewCategoryEmoji('✨')
    setNewCategoryColor(COLORS[0])
    setIsCreatingCategory(false)
  }, [newCategoryName, newCategoryEmoji, newCategoryColor, setCategories])

  const addSection = useCallback(() => {
    const title = newTitle.trim()
    if (!title) return
    const newSec: Section = {
      id: makeId(),
      title,
      todos: [],
      categoryId: selectedCategoryId || undefined,
      color: newColor,
      stopwatch: { elapsed: 0, running: false, startedAt: null },
    }
    setSections(prev => [newSec, ...prev])
    setActiveId(newSec.id)
    // Reset modal state
    setNewTitle('')
    setNewColor(COLORS[0])
    setSelectedCategoryId('')
    setIsModalOpen(false)
  }, [newTitle, selectedCategoryId, newColor, setSections, setActiveId])

  const updateTodoDetails = useCallback((sid: string, tid: string, details: { notes?: string; dueDate?: string; color?: string }) => {
    setSections(prev =>
      prev.map(s =>
        s.id === sid
          ? {
              ...s,
              todos: s.todos.map(t =>
                t.id === tid
                  ? {
                      ...t,
                      notes: details.notes,
                      dueDate: details.dueDate,
                      color: details.color,
                    }
                  : t
              ),
            }
          : s
      )
    )
  }, [setSections])

  const deleteTodo = useCallback((sid: string, tid: string) => {
    setSections(prev => prev.map(s => (s.id === sid ? { ...s, todos: s.todos.filter(t => t.id !== tid) } : s)))
  }, [setSections])

  const deleteSection = (sid: string) => {
    setSections(prev => prev.filter(s => s.id !== sid))
  }

  const deleteCategory = (cid: string) => {
    // 1. Remove the category
    setCategories(prev => prev.filter(c => c.id !== cid))
    // 2. Re-assign lists under this category to be uncategorized
    setSections(prev =>
      prev.map(s => (s.categoryId === cid ? { ...s, categoryId: undefined } : s))
    )
  }

  const clearCompleted = useCallback((sid: string) => {
    setSections(prev => prev.map(s => (s.id === sid ? { ...s, todos: s.todos.filter(t => !t.done) } : s)))
  }, [setSections])

  const uncheckCompleted = useCallback((sid: string) => {
    setSections(prev =>
      prev.map(s =>
        s.id === sid
          ? { ...s, todos: s.todos.map(t => (t.done ? { ...t, done: false, completedAt: undefined } : t)) }
          : s
      )
    )
  }, [setSections])


  return (
    <motion.div
      className="min-h-full p-7 sm:p-12"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <motion.div layout className="mb-8 flex items-center gap-4 flex-col sm:flex-row">
          <div className="flex items-center gap-4">
            <FiList className="text-neutral-300" size={28} />
            <h1 className="text-3xl md:text-4xl font-semibold tracking-tight leading-tight text-neutral-100">FocusTicks</h1>
          </div>
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              // Reset defaults and open modal
              setNewTitle('')
              setNewColor(COLORS[0])
              setSelectedCategoryId('')
              setIsCreatingCategory(false)
              setIsEmojiPickerOpen(false)
              setIsModalOpen(true)
            }}
            className="sm:ml-auto inline-flex items-center gap-2 rounded-full border border-neutral-800 bg-neutral-900 px-5 py-3 text-lg text-neutral-100 shadow-subtle hover:bg-neutral-800 btn-glow w-full sm:w-auto mt-2 sm:mt-0"
            title="Add New List"
          >
            <FiFolderPlus /> New List
          </motion.button>
        </motion.div>

        {/* Stopwatch Bar */}
        <motion.div
          layout
          className="mb-3 flex items-center justify-between rounded-2xl border border-neutral-800 bg-neutral-900 px-3 py-2 text-white"
        >
          <div className="font-mono text-lg tabular-nums tracking-tight">{formatTime(currentElapsed(active))}</div>
          <div className="flex items-center gap-2">
            {/* Start */}
            <motion.button
              onClick={() => {
                if (active) {
                  setPressFx(f => ({ ...f, start: f.start + 1 }))
                  startStopwatch(active.id)
                }
              }}
              disabled={!active || !!active?.stopwatch?.running}
              whileHover={!active || !!active?.stopwatch?.running ? undefined : { scale: 1.06, opacity: 1 }}
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
                if (active) {
                  setPressFx(f => ({ ...f, stop: f.stop + 1 }))
                  stopStopwatch(active.id)
                }
              }}
              disabled={!active || !active?.stopwatch?.running}
              whileHover={!active || !active?.stopwatch?.running ? undefined : { scale: 1.06, opacity: 1 }}
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
                if (active) {
                  setPressFx(f => ({ ...f, reset: f.reset + 1 }))
                  resetStopwatch(active.id)
                }
              }}
              disabled={!active || currentElapsed(active) === 0}
              whileHover={!active || currentElapsed(active) === 0 ? undefined : { scale: 1.06, opacity: 1 }}
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
        {/* Animated underline under header */}
        <motion.div
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: '100%', opacity: 1 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="mb-6 h-[2px] rounded-full bg-gradient-to-r from-[color:var(--muted-orange,#b86b2b)]/60 via-white/10 to-transparent"
        />

        {/* Section Selector (Custom Combobox) */}
        <motion.div layout className="card mb-4 p-4 sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm text-neutral-400">List</span>
              <FiChevronDown className="text-neutral-500" />
            </div>
            <div ref={comboRef} className="relative ml-0 sm:ml-2 inline-flex items-center w-full sm:w-auto">
              <button
                type="button"
                aria-haspopup="listbox"
                aria-expanded={comboOpen}
                onClick={() => {
                  updateComboPos()
                  setComboOpen(o => !o)
                }}
                ref={comboBtnRef}
                className="inline-flex w-full sm:w-auto min-w-0 sm:min-w-[160px] items-center justify-between rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-2 text-sm text-neutral-100 shadow-subtle hover:bg-neutral-900 focus:outline-none"
                title="Select list"
              >
                <span className="truncate pr-3">{active?.title ?? 'Select list'}</span>
                <motion.span animate={{ rotate: comboOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                  <FiChevronDown className="text-neutral-400" />
                </motion.span>
              </button>
              {comboOpen &&
                createPortal(
                  (
                    <div className="fixed inset-0 z-[2147483000] pointer-events-none">
                      <ul
                        ref={comboMenuRef}
                        role="listbox"
                        style={{
                          position: 'fixed',
                          top: comboPos.top,
                          left: (() => {
                            const vw = window.innerWidth || 0
                            const w = Math.min(Math.max(256, comboPos.width), Math.max(280, vw - 16))
                            return Math.max(8, Math.min(comboPos.left, vw - w - 8))
                          })(),
                          width: (() => {
                            const vw = window.innerWidth || 0
                            return Math.min(Math.max(256, comboPos.width), Math.max(280, vw - 16))
                          })(),
                          pointerEvents: 'auto'
                        }}
                        className="z-[2147483647] max-h-[60vh] overflow-auto rounded-xl border border-orange-500/70 bg-neutral-900 text-neutral-100 p-1 shadow-2xl ring-1 ring-orange-500/30"
                      >
                        {groupedSections.map(g => (
                          <li key={g.category.id || 'uncategorized'}>
                            <div className="group px-3 py-2 text-sm text-neutral-400 flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full" style={{ backgroundColor: g.category.color }} />
                                <span>{g.category.emoji} {g.category.title}</span>
                              </div>
                              {g.category.id !== 'uncategorized' && (
                                <button
                                  onClick={() => deleteCategory(g.category.id)}
                                  className="p-1 rounded-full text-neutral-500 hover:text-red-400 hover:bg-neutral-700 opacity-0 group-hover:opacity-100 transition-opacity"
                                  title={`Delete "${g.category.title}" category`}
                                >
                                  <FiX />
                                </button>
                              )}
                            </div>
                            <ul>
                              {g.sections.map(s => (
                                <li
                                  key={s.id}
                                  role="option"
                                  aria-selected={s.id === active?.id}
                                  onClick={() => {
                                    setActiveId(s.id)
                                    setComboOpen(false)
                                  }}
                                  className={`group flex items-center justify-between pr-2 rounded-md transition-colors cursor-pointer ${s.id === active?.id ? 'bg-neutral-800' : 'hover:bg-neutral-800'}`}
                                >
                                  <div className="flex items-center gap-2">
                                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: s.color }} />
                                    <span>{s.title}</span>
                                  </div>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      deleteSection(s.id)
                                    }}
                                    className="p-1 rounded-full text-neutral-500 hover:text-red-400 hover:bg-neutral-700 opacity-0 group-hover:opacity-100 transition-opacity"
                                    title={`Delete "${s.title}" list`}
                                  >
                                    <FiX />
                                  </button>
                                </li>
                              ))}
                            </ul>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ),
                  document.body
                )}
            </div>
          </div>
        </motion.div>

        {/* Main Content: Todos list */}
        {active ? (
          <AppBody
            active={active}
            setSections={setSections}
            addTodo={addTodo}
            toggleTodo={toggleTodo}
            deleteTodo={deleteTodo}
            clearCompleted={clearCompleted}
            uncheckCompleted={uncheckCompleted}
            updateTodoDetails={updateTodoDetails}
            input={input}
            setInput={setInput}
            formatTime={formatTime}
          />
        ) : (
          <div className="text-center py-12">
            <p className="text-lg text-neutral-400">No lists found. Create one to get started!</p>
          </div>
        )}


        {/* Footer hint */}
        <p className="mt-6 text-center text-sm text-neutral-500">
        Plan tasks, track time, stay focused.
        </p>
        <p className="mt-2 text-center text-sm">
          <a
            href="https://github.com/ozny35/FocusTicks"
            target="_blank"
            rel="noopener noreferrer"
            className="text-neutral-500 hover:text-orange-400 underline transition-colors"
          >GitHub</a>
        </p>

      </div>

    {/* Add New List Modal */}
    <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)} title={isCreatingCategory ? 'Create New Category' : 'Create New List'}>
      <AnimatePresence mode="wait">
        {isCreatingCategory ? (
          <motion.div
            key="create-category"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <input
                  value={newCategoryName}
                  onChange={e => setNewCategoryName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addCategory()}
                  placeholder="Category Name"
                  className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-3 text-lg outline-none placeholder:text-neutral-500 focus:ring-2 focus:ring-[color:var(--muted-orange,#b86b2b)]"
                />
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsEmojiPickerOpen(prev => !prev)}
                    className="text-3xl p-2 rounded-full hover:bg-neutral-800 transition-colors"
                  >
                    {newCategoryEmoji}
                  </button>
                  {isEmojiPickerOpen && (
                    <div className="absolute z-20 right-0 mt-2">
                     <Suspense fallback={<div className="p-3 text-sm text-neutral-400">Loading…</div>}>
                        <EmojiPickerLazy
                          onEmojiClick={(emojiData: EmojiClickData) => {
                            setNewCategoryEmoji(emojiData.emoji)
                            setIsEmojiPickerOpen(false)
                          }}
                          emojiStyle={"native" as any}
                          theme={"dark" as any}
                        />
                      </Suspense>
                    </div>
                  )}
                </div>
              </div>
              <ColorPicker colors={COLORS} selectedColor={newCategoryColor} onChange={setNewCategoryColor} />
              <div className="flex items-center justify-between">
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setIsCreatingCategory(false)}
                  className="rounded-full px-5 py-2 text-neutral-300 hover:bg-neutral-800"
                >
                  Back
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={addCategory}
                  className="rounded-full border border-orange-500/50 bg-orange-500/20 px-5 py-2 text-orange-200 shadow-subtle hover:bg-orange-500/30 btn-glow"
                >
                  Create Category
                </motion.button>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="create-list"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex flex-col gap-4">
              <input
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addSection()}
                placeholder="List Name"
                className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-3 text-lg outline-none placeholder:text-neutral-500 focus:ring-2 focus:ring-[color:var(--muted-orange,#b86b2b)]"
              />
              
              <ColorPicker colors={COLORS} selectedColor={newColor} onChange={setNewColor} />

              <div className="flex flex-col gap-2">
                <label htmlFor="category-select" className="text-neutral-400">Category</label>
                <div className="flex gap-2">
                  <select 
                    id="category-select"
                    value={selectedCategoryId}
                    onChange={e => setSelectedCategoryId(e.target.value)}
                    className="flex-1 w-full rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-3 text-lg outline-none placeholder:text-neutral-500 focus:ring-2 focus:ring-[color:var(--muted-orange,#b86b2b)]"
                  >
                    <option value="">No Category</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.emoji} {c.title}</option>
                    ))}
                  </select>
                  <motion.button whileTap={{scale: 0.95}} onClick={() => setIsCreatingCategory(true)} className="p-3 rounded-xl border border-neutral-800 bg-neutral-950 hover:bg-neutral-900">
                    <FiPlus />
                  </motion.button>
                </div>
              </div>

              <div className="mt-2 flex justify-end gap-3">
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-full border border-neutral-700 bg-neutral-800 px-5 py-2 text-neutral-100 shadow-subtle hover:bg-neutral-700"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={addSection}
                  className="rounded-full border border-orange-500/50 bg-orange-500/20 px-5 py-2 text-orange-200 shadow-subtle hover:bg-orange-500/30 btn-glow"
                >
                  Create List
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Modal>
  </motion.div>
)
}

const AppBody = ({
  active,
  setSections,
  addTodo,
  toggleTodo,
  deleteTodo,
  clearCompleted,
  uncheckCompleted,
  updateTodoDetails,
  input,
  setInput,
  formatTime,
}: {
  active: Section
  setSections: React.Dispatch<React.SetStateAction<Section[]>>
  addTodo: () => void
  toggleTodo: (sid: string, tid: string) => void
  deleteTodo: (sid: string, tid: string) => void
  clearCompleted: (sid: string) => void
  uncheckCompleted: (sid: string) => void
  updateTodoDetails: (sid: string, tid: string, details: { notes?: string; dueDate?: string; color?: string }) => void
  input: string
  setInput: React.Dispatch<React.SetStateAction<string>>
  formatTime: (ms: number) => string
}) => {
  return (
    <motion.div key={active.id}>
      {/* Add new todo form */}
      <form
        onSubmit={e => {
          e.preventDefault()
          addTodo()
        }}
        className="mb-6 flex items-center gap-3"
      >
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Add a new task..."
          className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-3 text-lg outline-none placeholder:text-neutral-500 focus:ring-2 focus:ring-[color:var(--muted-orange,#b86b2b)]"
        />
        <motion.button
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.98 }}
          type="submit"
          className="rounded-full border border-orange-500/50 bg-orange-500/20 p-4 text-orange-200 shadow-subtle hover:bg-orange-500/30 btn-glow"
        >
          <FiPlus />
        </motion.button>
      </form>

      {/* Todo List */}
      <Reorder.Group
        axis="y"
        values={active.todos}
        onReorder={newOrder => {
          setSections(prev => prev.map(s => (s.id === active.id ? { ...s, todos: newOrder } : s)))
        }}
        className="mt-6 space-y-3"
      >
        <AnimatePresence initial={false}>
          {active.todos.map(todo => (
            <TodoItem
              key={todo.id}
              todo={todo}
              section={active}
              toggleTodo={toggleTodo}
              deleteTodo={deleteTodo}
              updateTodoDetails={updateTodoDetails}
              formatTime={formatTime}
            />
          ))}
        </AnimatePresence>
      </Reorder.Group>

      {/* Action buttons at bottom */}
      {active.todos.some(t => t.done) && (
        <motion.div
          layout
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 flex items-center justify-end gap-3"
        >
          <motion.button
            whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.98 }}
            onClick={() => uncheckCompleted(active.id)}
            className="rounded-full px-4 py-2 text-neutral-300 hover:bg-neutral-800"
          >
            Uncheck All
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.98 }}
            onClick={() => clearCompleted(active.id)}
            className="rounded-full bg-red-500/20 px-4 py-2 text-red-200 hover:bg-red-500/30"
          >
            Clear Completed
          </motion.button>
        </motion.div>
      )}
    </motion.div>
  )
}
