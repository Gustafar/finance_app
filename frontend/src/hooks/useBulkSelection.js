import { useState } from 'react'

export function useBulkSelection() {
  const [isSelecting, setIsSelecting] = useState(false)
  const [selectedIds, setSelectedIds] = useState(() => new Set())

  const toggleSelecting = () => {
    setIsSelecting((prev) => !prev)
    setSelectedIds(new Set())
  }

  const toggleId = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return { isSelecting, selectedIds, toggleSelecting, toggleId }
}
