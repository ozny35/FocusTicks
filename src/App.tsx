import { useEffect, useMemo, useState, useCallback, lazy, Suspense } from 'react'
import { motion } from 'framer-motion'
import { FiPlus, FiList, FiFolderPlus, FiDatabase } from 'react-icons/fi'

// Lazy-load heavy emoji picker for better initial performance
const EmojiPickerLazy = lazy(() => import('emoji-picker-react').then(m => ({ default: m.default })))

import type { EmojiClickData } from 'emoji-picker-react'
import Modal from './components/Modal'
import ColorPicker from './components/ColorPicker'

import useStoredState from './hooks/useStoredState'
import { formatTime } from './utils/time'
import StopwatchBar from './components/StopwatchBar'
import SectionSelector from './components/SectionSelector'
import TodosList from './components/TodosList'
import DataManager from './components/DataManager'

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

  

export default function App() {
  const [sections, setSections] = useStoredState<Section[]>(
    'focusticks:sections',
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
  const [categories, setCategories] = useStoredState<Category[]>('focusticks:categories', [
    { id: makeId(), title: 'Personal', emoji: '👤' },
    { id: makeId(), title: 'Work', emoji: '💼' },
  ])
  const [activeId, setActiveId] = useStoredState<string>('focusticks:active', sections[0]?.id || '')
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
  const [isDataOpen, setIsDataOpen] = useState(false)
  const active = useMemo(() => sections.find(s => s.id === activeId) ?? sections[0], [sections, activeId])

  // Reset modal sub-state when modal closes (avoid overriding user action on open)
  useEffect(() => {
    if (!isModalOpen) {
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
            onClick={() => setIsDataOpen(true)}
            className="sm:ml-auto inline-flex items-center justify-center rounded-full border border-neutral-800 bg-neutral-900 px-5 py-3 text-lg text-neutral-100 shadow-subtle hover:bg-neutral-800 w-full sm:w-auto mt-2 sm:mt-0"
            title="Export / Import Data"
          >
            <FiDatabase />
          </motion.button>
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
            className="inline-flex items-center gap-2 rounded-full border border-neutral-800 bg-neutral-900 px-5 py-3 text-lg text-neutral-100 shadow-subtle hover:bg-neutral-800 w-full sm:w-auto mt-2 sm:mt-0"
            title="Add New List"
          >
            <FiFolderPlus /> New List
          </motion.button>
        </motion.div>

        {/* Stopwatch Bar */}
        <StopwatchBar
          elapsed={currentElapsed(active)}
          running={!!active?.stopwatch?.running}
          onStart={() => active && startStopwatch(active.id)}
          onStop={() => active && stopStopwatch(active.id)}
          onReset={() => active && resetStopwatch(active.id)}
          formatTime={formatTime}
        />
        {/* Animated underline under header */}
        <motion.div
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: '100%', opacity: 1 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="mb-6 h-[2px] rounded-full bg-gradient-to-r from-[color:var(--muted-orange,#b86b2b)]/60 via-white/10 to-transparent"
        />

        {/* Section Selector (Custom Combobox) */}
        <SectionSelector
          groupedSections={groupedSections}
          active={active}
          onSelectSection={setActiveId}
          onDeleteSection={deleteSection}
          onDeleteCategory={deleteCategory}
        />

        {/* Main Content: Todos list */}
        {active ? (
          <TodosList
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
            colors={COLORS}
          />
        ) : (
          <div className="p-10 text-neutral-400">No list selected</div>
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

    {/* Data Manager */}
    <DataManager
      open={isDataOpen}
      onClose={() => setIsDataOpen(false)}
      buildExport={useCallback(() => ({
        app: 'FocusTicks',
        version: 1 as const,
        exportedAt: new Date().toISOString(),
        categories,
        sections,
        activeId,
      }), [categories, sections, activeId])}
      onImport={useCallback((data) => {
        setCategories(data.categories)
        setSections(data.sections)
        setActiveId(data.activeId || data.sections[0]?.id || '')
      }, [setCategories, setSections, setActiveId])}
    />

    {/* Add New List Modal */}
    <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)} title={isCreatingCategory ? 'Create New Category' : 'Create New List'}>
      {isCreatingCategory ? (
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
            <button
              onClick={() => setIsCreatingCategory(false)}
              className="rounded-full px-5 py-2 text-neutral-300 hover:bg-neutral-800"
            >
              Back
            </button>
            <button
              onClick={addCategory}
              className="rounded-full border border-orange-500/50 bg-orange-500/20 px-5 py-2 text-orange-200 shadow-subtle hover:bg-orange-500/30 btn-glow"
            >
              Create Category
            </button>
          </div>
        </div>
      ) : (
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
              <button onClick={() => setIsCreatingCategory(true)} className="p-3 rounded-xl border border-neutral-800 bg-neutral-950 hover:bg-neutral-900">
                <FiPlus />
              </button>
            </div>
          </div>

          <div className="mt-2 flex justify-end gap-3">
            <button
              onClick={() => setIsModalOpen(false)}
              className="rounded-full border border-neutral-700 bg-neutral-800 px-5 py-2 text-neutral-100 shadow-subtle hover:bg-neutral-700"
            >
              Cancel
            </button>
            <button
              onClick={addSection}
              className="rounded-full border border-orange-500/50 bg-orange-500/20 px-5 py-2 text-orange-200 shadow-subtle hover:bg-orange-500/30 btn-glow"
            >
              Create List
            </button>
          </div>
        </div>
      )}
    </Modal>
  </motion.div>
)
}

