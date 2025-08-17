import { useState } from 'react'
import { Reorder, motion, AnimatePresence, useDragControls } from 'framer-motion'
import { FiMenu, FiCheck, FiFileText, FiCalendar, FiEdit2, FiX, FiSave } from 'react-icons/fi'
import ColorPicker from './ColorPicker'

export type Todo = {
  id: string
  text: string
  done: boolean
  completedAt?: number
  notes?: string
  dueDate?: string
  color?: string
}

interface Props {
  todo: Todo
  sectionId: string
  toggleTodo: (sid: string, tid: string) => void
  deleteTodo: (sid: string, tid: string) => void
  formatTime: (ms: number) => string
  updateTodoDetails: (sid: string, tid: string, details: { notes?: string; dueDate?: string; color?: string }) => void
  colors: string[]
}

export default function TodoItem({ todo, sectionId, toggleTodo, deleteTodo, formatTime, updateTodoDetails, colors }: Props) {
  const dragControls = useDragControls()
  const [isEditing, setIsEditing] = useState(false)
  const [notes, setNotes] = useState(todo.notes || '')
  const [dueDate, setDueDate] = useState(todo.dueDate || '')
  const [color, setColor] = useState(todo.color || '')

  const handleSave = () => {
    updateTodoDetails(sectionId, todo.id, { notes, dueDate, color })
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
          onClick={() => toggleTodo(sectionId, todo.id)}
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
              if (h <= 2) return 'text-neutral-100'
              if (h <= 4) return 'text-emerald-400'
              if (h <= 6) return 'text-orange-400'
              return 'text-red-400'
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
          onClick={() => deleteTodo(sectionId, todo.id)}
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
              <ColorPicker colors={colors} selectedColor={color} onChange={setColor} />
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
}
