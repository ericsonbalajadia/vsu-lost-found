// src/components/ui/StatusRibbon.tsx
import type { ItemStatus, ItemType } from '../../types/database'

interface StatusRibbonProps {
  type: ItemType
  status: ItemStatus
}

const config: Record<string, { label: string; bg: string; text: string; bar: string }> = {
  'found-active':       { label: 'FOUND',      bg: 'bg-primary/90',          text: 'text-white', bar: 'bg-primary' },
  'lost-active':        { label: 'LOST',       bg: 'bg-error/90',            text: 'text-white', bar: 'bg-error' },
  'found-negotiation': { label: 'IN NEGOTIATION', bg: 'bg-secondary', text: 'text-white', bar: 'bg-secondary' },
  'found-resolved':     { label: 'RESOLVED',   bg: 'bg-on-surface-variant/80', text: 'text-white', bar: 'bg-outline-variant' },
}

export default function StatusRibbon({ type, status }: StatusRibbonProps) {
  const key = `${type}-${status}`
  const c = config[key] ?? config['found-active']

  return (
    <div className="absolute top-4 left-0 z-10 flex items-center">
      <div className={`w-1.5 h-10 ${c.bar}`} />
      <div className={`${c.bg} backdrop-blur px-4 py-1.5 text-[11px] font-bold tracking-widest ${c.text} uppercase rounded-r-md`}>
        {c.label}
      </div>
    </div>
  )
}