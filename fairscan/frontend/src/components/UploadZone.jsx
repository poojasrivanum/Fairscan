import React, { useRef, useState } from 'react'

export default function UploadZone({ onFileSelect }) {
  const [dragging, setDragging] = useState(false)
  const [selected, setSelected] = useState(null)
  const inputRef = useRef()

  function handleDrop(e) {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file && file.name.endsWith('.csv')) {
      setSelected(file)
      onFileSelect(file)
    }
  }

  function handleChange(e) {
    const file = e.target.files[0]
    if (file) { setSelected(file); onFileSelect(file) }
  }

  return (
    <div
      onDragOver={e => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current.click()}
      className={`cursor-pointer border-2 border-dashed rounded-2xl p-10 text-center transition-all ${
        dragging ? 'drop-zone-active' : 'border-slate-300 hover:border-brand hover:bg-indigo-50/50'
      }`}
    >
      <input ref={inputRef} type="file" accept=".csv" className="hidden" onChange={handleChange} />
      {selected ? (
        <div className="fade-in">
          <div className="text-4xl mb-3">✅</div>
          <p className="font-semibold text-slate-800">{selected.name}</p>
          <p className="text-sm text-slate-500 mt-1">{(selected.size / 1024).toFixed(1)} KB · Click to change</p>
        </div>
      ) : (
        <>
          <div className="text-5xl mb-4">📂</div>
          <p className="font-semibold text-slate-700 text-lg">Drag and drop your CSV file here</p>
          <p className="text-slate-400 mt-2">or click to browse</p>
          <p className="text-xs text-slate-400 mt-3">CSV files only · max 10MB</p>
        </>
      )}
    </div>
  )
}
