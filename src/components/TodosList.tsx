import { motion, AnimatePresence, Reorder } from 'framer-motion'
import { FiPlus } from 'react-icons/fi'
import TodoItem from './TodoItem'
import type { Todo } from './TodoItem'

export type Section = {
  id: string
  title: string
  todos: Todo[]
  stopwatch?: { elapsed: number; running: boolean; startedAt: number | null }
  color?: string
  categoryId?: string
}

interface Props {
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
  colors: string[]
}

export default function TodosList({
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
  colors,
}: Props) {
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
              sectionId={active.id}
              toggleTodo={toggleTodo}
              deleteTodo={deleteTodo}
              updateTodoDetails={updateTodoDetails}
              formatTime={formatTime}
              colors={colors}
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
