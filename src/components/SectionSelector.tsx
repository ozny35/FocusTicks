import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion } from 'framer-motion'
import { FiChevronDown, FiX } from 'react-icons/fi'

type Todo = {
  id: string
  text: string
  done: boolean
  completedAt?: number
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

interface Grouped {
  category: Category
  sections: Section[]
}

interface SectionSelectorProps {
  groupedSections: Grouped[]
  active?: Section
  onSelectSection: (id: string) => void
  onDeleteSection: (id: string) => void
  onDeleteCategory: (id: string) => void
}

export default function SectionSelector({ groupedSections, active, onSelectSection, onDeleteSection, onDeleteCategory }: SectionSelectorProps) {
  const [open, setOpen] = useState(false)
  const btnRef = useRef<HTMLButtonElement | null>(null)
  const menuRef = useRef<HTMLUListElement | null>(null)
  const [pos, setPos] = useState<{ top: number; left: number; width: number }>({ top: 0, left: 0, width: 0 })

  const updatePos = () => {
    const el = btnRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    setPos({ top: r.bottom + 8, left: r.left, width: r.width })
  }

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node
      const insideTrigger = btnRef.current?.contains(t)
      const insideMenu = menuRef.current?.contains(t)
      if (!insideTrigger && !insideMenu) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [])

  useEffect(() => {
    if (!open) return
    updatePos()
    const onResize = () => updatePos()
    const onScroll = () => updatePos()
    window.addEventListener('resize', onResize)
    window.addEventListener('scroll', onScroll, true)
    return () => {
      window.removeEventListener('resize', onResize)
      window.removeEventListener('scroll', onScroll, true)
    }
  }, [open])

  return (
    <motion.div layout className="card mb-4 p-4 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-neutral-400">List</span>
          <FiChevronDown className="text-neutral-500" />
        </div>
        <div className="relative ml-0 sm:ml-2 inline-flex items-center w-full sm:w-auto">
          <button
            type="button"
            aria-haspopup="listbox"
            aria-expanded={open}
            onClick={() => {
              updatePos()
              setOpen(o => !o)
            }}
            ref={btnRef}
            className="inline-flex w-full sm:w-auto min-w-0 sm:min-w-[160px] items-center justify-between rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-2 text-sm text-neutral-100 shadow-subtle hover:bg-neutral-900 focus:outline-none"
            title="Select list"
          >
            <span className="truncate pr-3">{active?.title ?? 'Select list'}</span>
            <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
              <FiChevronDown className="text-neutral-400" />
            </motion.span>
          </button>
          {open && createPortal(
            (
              <div className="fixed inset-0 z-[2147483000] pointer-events-none">
                <ul
                  ref={menuRef}
                  role="listbox"
                  style={{
                    position: 'fixed',
                    top: pos.top,
                    left: (() => {
                      const vw = window.innerWidth || 0
                      const w = Math.min(Math.max(256, pos.width), Math.max(280, vw - 16))
                      return Math.max(8, Math.min(pos.left, vw - w - 8))
                    })(),
                    width: (() => {
                      const vw = window.innerWidth || 0
                      return Math.min(Math.max(256, pos.width), Math.max(280, vw - 16))
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
                            onClick={() => onDeleteCategory(g.category.id)}
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
                              onSelectSection(s.id)
                              setOpen(false)
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
                                onDeleteSection(s.id)
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
  )
}
