import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { FiClipboard, FiCheck, FiDownload, FiUpload } from 'react-icons/fi'
import Modal from './Modal'

export type ExportPayload = {
  app: 'FocusTicks'
  version: 1
  exportedAt: string
  categories: Array<{ id: string; title: string; emoji: string; color?: string }>
  sections: Array<{
    id: string
    title: string
    color?: string
    categoryId?: string
    stopwatch?: { elapsed: number; running: boolean; startedAt: number | null }
    todos: Array<{
      id: string
      text: string
      done: boolean
      completedAt?: number
      notes?: string
      dueDate?: string
      color?: string
    }>
  }>
  activeId?: string
}

interface Props {
  open: boolean
  onClose: () => void
  buildExport: () => ExportPayload
  onImport: (data: ExportPayload) => void
}

export default function DataManager({ open, onClose, buildExport, onImport }: Props) {
  const [tab, setTab] = useState<'export' | 'import'>('export')
  const [exportText, setExportText] = useState('')
  const [importText, setImportText] = useState('')
  const [error, setError] = useState<string>('')
  const [copied, setCopied] = useState(false)
  const [downloaded, setDownloaded] = useState(false)
  const [imported, setImported] = useState(false)

  useEffect(() => {
    if (!open) return
    try {
      const payload = buildExport()
      setExportText(JSON.stringify(payload, null, 2))
      setError('')
      setTab('export')
      setImportText('')
    } catch (e) {
      setError('Failed to prepare export data')
    }
  }, [open, buildExport])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(exportText)
      setCopied(true)
      setTimeout(() => setCopied(false), 1400)
    } catch {}
  }

  const handleDownload = () => {
    try {
      const blob = new Blob([exportText], { type: 'application/json;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `focusticks-export-${new Date().toISOString().replace(/[:.]/g, '-')}.json`
      a.click()
      URL.revokeObjectURL(url)
      setDownloaded(true)
      setTimeout(() => setDownloaded(false), 1400)
    } catch {}
  }

  const handleImport = () => {
    setError('')
    try {
      const parsed = JSON.parse(importText) as ExportPayload
      // Minimal validation
      if (parsed.app !== 'FocusTicks' || parsed.version !== 1) {
        throw new Error('Invalid file: unsupported app or version')
      }
      if (!Array.isArray(parsed.sections) || !Array.isArray(parsed.categories)) {
        throw new Error('Invalid structure')
      }
      onImport(parsed)
      setImported(true)
      setTimeout(() => setImported(false), 1400)
      onClose()
    } catch (e: any) {
      setError(e?.message || 'Failed to import data')
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Data Management">
      <div className="flex flex-col gap-4">
        <div className="flex gap-2">
          <button
            className={`px-4 py-2 rounded-lg border ${tab==='export' ? 'bg-neutral-800 border-neutral-700 text-neutral-100' : 'bg-neutral-900 border-neutral-800 text-neutral-300'}`}
            onClick={() => setTab('export')}
          >Export</button>
          <button
            className={`px-4 py-2 rounded-lg border ${tab==='import' ? 'bg-neutral-800 border-neutral-700 text-neutral-100' : 'bg-neutral-900 border-neutral-800 text-neutral-300'}`}
            onClick={() => setTab('import')}
          >Import</button>
        </div>

        {tab === 'export' ? (
          <div className="flex flex-col gap-3">
            <textarea
              value={exportText}
              readOnly
              className="min-h-[260px] w-full rounded-xl border border-neutral-800 bg-neutral-950 p-3 font-mono text-sm text-neutral-200"
            />
            <div className="flex gap-3 justify-end">
              <motion.button
                whileTap={{scale:0.98}}
                onClick={handleCopy}
                className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 transition-colors ${copied ? 'border-green-500/60 bg-green-500/20 text-green-200' : 'border-neutral-700 bg-neutral-800 text-neutral-200 hover:bg-neutral-700'}`}
                title="Copy JSON"
              >
                {copied ? <FiCheck /> : <FiClipboard />} {copied ? 'Copied' : 'Copy'}
              </motion.button>
              <motion.button
                whileTap={{scale:0.98}}
                onClick={handleDownload}
                className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 transition-colors ${downloaded ? 'border-green-500/60 bg-green-500/20 text-green-200' : 'border-orange-500/50 bg-orange-500/20 text-orange-200 hover:bg-orange-500/30'}`}
                title="Download JSON"
              >
                {downloaded ? <FiCheck /> : <FiDownload />} {downloaded ? 'Downloaded' : 'Download'}
              </motion.button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <textarea
              value={importText}
              onChange={e => setImportText(e.target.value)}
              placeholder="Paste JSON here..."
              className="min-h-[260px] w-full rounded-xl border border-neutral-800 bg-neutral-950 p-3 font-mono text-sm text-neutral-200"
            />
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <div className="flex gap-3 justify-end">
              <motion.button
                whileTap={{scale:0.98}}
                onClick={handleImport}
                className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 transition-colors ${imported ? 'border-green-500/60 bg-green-500/20 text-green-200' : 'border-orange-500/50 bg-orange-500/20 text-orange-200 hover:bg-orange-500/30'}`}
                title="Import JSON"
              >
                {imported ? <FiCheck /> : <FiUpload />} {imported ? 'Imported' : 'Import'}
              </motion.button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}
