// MetricCard.jsx
import React from 'react'

const SEV = {
  HIGH:   { bg: 'bg-red-50',    border: 'border-red-400',    badge: 'bg-red-100 text-red-700',    dot: 'bg-red-500' },
  MEDIUM: { bg: 'bg-orange-50', border: 'border-orange-400', badge: 'bg-orange-100 text-orange-700', dot: 'bg-orange-500' },
  LOW:    { bg: 'bg-green-50',  border: 'border-green-400',  badge: 'bg-green-100 text-green-700',  dot: 'bg-green-500' },
}

export function MetricCard({ title, value, severity, description, passFail }) {
  const s = SEV[severity] || SEV.LOW
  return (
    <div className={`${s.bg} border-l-4 ${s.border} rounded-2xl p-6 card-hover`}>
      <div className="flex items-start justify-between mb-3">
        <p className="text-sm font-semibold text-slate-600 uppercase tracking-wide">{title}</p>
        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${s.badge}`}>{severity}</span>
      </div>
      <div className="text-4xl font-extrabold text-slate-900 mb-2">{value}</div>
      <p className="text-sm text-slate-500 leading-relaxed">{description}</p>
      {passFail && (
        <div className={`mt-3 text-xs font-bold ${passFail === 'PASS' ? 'text-green-600' : 'text-red-600'}`}>
          {passFail === 'PASS' ? '✓ PASS' : '✗ FAIL'} — legal threshold
        </div>
      )}
    </div>
  )
}

// ExplanationBox.jsx
export function ExplanationBox({ explanation }) {
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xl">✦</span>
        <h3 className="font-bold text-amber-900 text-lg">What this means</h3>
        <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full ml-auto">Powered by Gemini</span>
      </div>
      <p className="text-amber-900 leading-relaxed">{explanation}</p>
    </div>
  )
}

// FixCard.jsx
export function FixCard({ number, text }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden card-hover">
      <div className="bg-green-500 text-white font-bold text-xl w-full py-3 text-center">
        Fix {number}
      </div>
      <div className="p-5">
        <p className="text-slate-700 leading-relaxed text-sm">{text}</p>
      </div>
    </div>
  )
}

// FeatureBar.jsx
export function FeatureBar({ feature, importance, isProtected }) {
  const pct = Math.round(importance * 100)
  return (
    <div className="flex items-center gap-3">
      <div className="w-28 text-right text-sm font-medium text-slate-700 truncate">{feature}</div>
      <div className="flex-1 bg-slate-100 rounded-full h-3 overflow-hidden">
        <div
          className={`h-3 rounded-full transition-all duration-700 ${isProtected ? 'bg-red-400' : 'bg-brand'}`}
          style={{ width: `${Math.max(pct, 2)}%` }}
        />
      </div>
      <div className={`text-xs font-bold w-10 text-right ${isProtected ? 'text-red-500' : 'text-brand'}`}>
        {pct}%
      </div>
      {isProtected && (
        <span className="text-xs bg-red-50 text-red-600 border border-red-200 px-1.5 py-0.5 rounded-full whitespace-nowrap">
          protected
        </span>
      )}
    </div>
  )
}
