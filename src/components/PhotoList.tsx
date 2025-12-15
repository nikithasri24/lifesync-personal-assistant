import React, { useState } from 'react'

interface PhotoListProps {
  items: string[]
  onChange: (next: string[]) => void
}

function PhotoList({ items, onChange }: PhotoListProps) {
  const [value, setValue] = useState('')
  const add = (): void => {
    const v = value.trim()
    if (!v) return
    onChange([...(items ?? []), v])
    setValue('')
  }
  const remove = (idx: number): void => {
    const next = [...items]
    next.splice(idx, 1)
    onChange(next)
  }
  return (
    <div>
      <div className="flex items-center space-x-2 mb-2">
        <input className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="https://..." value={value} onChange={(e) => setValue(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add() } }} />
        <button className="px-2 py-1 text-xs rounded bg-blue-600 text-white hover:bg-blue-700" onClick={add}>Add</button>
      </div>
      <ul className="space-y-1">
        {(items ?? []).map((url, idx) => (
          <li key={idx} className="flex items-center justify-between text-xs text-gray-700 bg-gray-50 border border-gray-200 rounded px-2 py-1">
            <a href={url} target="_blank" rel="noreferrer" className="truncate max-w-[220px] hover:underline">{url}</a>
            <button className="text-red-600 hover:text-red-700 ml-2" onClick={() => remove(idx)}>Remove</button>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default PhotoList
