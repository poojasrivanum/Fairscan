import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useResults } from '../App.jsx'
import UploadZone from '../components/UploadZone.jsx'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export default function Analyze() {
  const { setResults } = useResults()
  const navigate = useNavigate()
  const [file, setFile] = useState(null)
  const [outcomeCol, setOutcomeCol] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingMsg, setLoadingMsg] = useState('')
  const [error, setError] = useState(null)

  async function runDemo() {
    setError(null)
    setLoading(true)
    setLoadingMsg('Loading hiring dataset...')
    try {
      setLoadingMsg('Running 3 fairness metrics...')
      const res = await fetch(`${API}/sample`)
      if (!res.ok) throw new Error((await res.json()).detail || 'Server error')
      setLoadingMsg('Generating AI explanation...')
      const data = await res.json()
      setResults(data)
      navigate('/results')
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  async function runUpload() {
    if (!file) { setError('Please select a CSV file first.'); return }
    setError(null)
    setLoading(true)
    setLoadingMsg('Uploading your dataset...')
    try {
      const form = new FormData()
      form.append('file', file)
      form.append('outcome_col', outcomeCol || 'hired')
      setLoadingMsg('Running fairness metrics...')
      const res = await fetch(`${API}/analyze`, { method: 'POST', body: form })
      if (!res.ok) throw new Error((await res.json()).detail || 'Analysis failed')
      setLoadingMsg('Generating AI explanation...')
      const data = await res.json()
      setResults(data)
      navigate('/results')
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="pt-14 min-h-screen bg-slate-50">
      {/* Loading overlay */}
      {loading && (
        <div className="fixed inset-0 bg-white/90 backdrop-blur-sm z-50 flex flex-col items-center justify-center gap-6 fade-in">
          <div className="spinner" />
          <div className="text-center">
            <p className="text-xl font-semibold text-slate-800">{loadingMsg}</p>
            <p className="text-slate-400 mt-2 text-sm">Running 3 fairness metrics + AI explanation</p>
          </div>
          <div className="flex gap-2">
            {['Disparate Impact', 'Demographic Parity', 'Statistical Test'].map(m => (
              <span key={m} className="bg-indigo-50 text-indigo-600 text-xs px-3 py-1.5 rounded-full font-medium">{m}</span>
            ))}
          </div>
        </div>
      )}

      <div className="max-w-3xl mx-auto px-4 py-16">
        <div className="text-center mb-10 fade-in">
          <h1 className="text-4xl font-extrabold text-slate-900 mb-3">Analyze your dataset</h1>
          <p className="text-slate-500 text-lg">Upload a CSV with decision data, or try our built-in demo instantly.</p>
        </div>

        {/* Demo button — prominent */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-0.5 mb-6 fade-in">
          <button
            onClick={runDemo}
            disabled={loading}
            className="w-full bg-white rounded-2xl px-6 py-5 flex items-center justify-between group hover:bg-indigo-50 transition-all"
          >
            <div className="text-left">
              <div className="font-bold text-slate-900 text-lg">⚡ Try hiring dataset demo</div>
              <div className="text-slate-500 text-sm mt-0.5">Pre-loaded 300-row dataset with real bias baked in — no upload needed</div>
            </div>
            <span className="text-2xl group-hover:translate-x-1 transition-transform">→</span>
          </button>
        </div>

        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-slate-200" />
          <span className="text-slate-400 text-sm">or upload your own</span>
          <div className="flex-1 h-px bg-slate-200" />
        </div>

        {/* Upload zone */}
        <div className="fade-in">
          <UploadZone onFileSelect={setFile} />

          <div className="mt-4">
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Outcome column name <span className="text-slate-400 font-normal">(the column that holds the decision)</span>
            </label>
            <input
              value={outcomeCol}
              onChange={e => setOutcomeCol(e.target.value)}
              placeholder="e.g. hired, approved, diagnosed"
              className="w-full border border-slate-300 rounded-xl px-4 py-3 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
            />
          </div>

          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm fade-in">
              <strong>Error:</strong> {error}
              <button onClick={() => setError(null)} className="ml-3 underline">Dismiss</button>
            </div>
          )}

          <button
            onClick={runUpload}
            disabled={loading || !file}
            className="mt-5 w-full bg-brand hover:bg-brand-dark disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-4 rounded-2xl transition-all text-lg shadow-md shadow-indigo-100"
          >
            Analyze for bias →
          </button>
        </div>

        {/* What we check */}
        <div className="mt-10 grid grid-cols-3 gap-4 text-center fade-in">
          {[
            { icon: '📊', label: 'Disparate Impact Ratio', sub: '80% legal rule' },
            { icon: '⚖️', label: 'Demographic Parity', sub: 'Group outcome rates' },
            { icon: '📈', label: 'Chi-Square Test', sub: 'Statistical significance' },
          ].map(c => (
            <div key={c.label} className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="text-2xl mb-1">{c.icon}</div>
              <div className="text-xs font-semibold text-slate-700">{c.label}</div>
              <div className="text-xs text-slate-400 mt-0.5">{c.sub}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
