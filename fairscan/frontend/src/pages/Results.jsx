import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useResults } from '../App.jsx'
import { MetricCard, ExplanationBox, FixCard, FeatureBar } from '../components/MetricCard.jsx'
import BiasChart from '../components/BiasChart.jsx'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const SEV_STYLE = {
  HIGH:   'bg-red-600 text-white',
  MEDIUM: 'bg-orange-500 text-white',
  LOW:    'bg-green-600 text-white',
}

export default function Results() {
  const { results } = useResults()
  const navigate = useNavigate()
  const [downloading, setDownloading] = useState(false)
  const [question, setQuestion] = useState("")
  const [chat, setChat] = useState([])
  const [asking, setAsking] = useState(false)

  if (!results) {
    return (
      <div className="pt-14 min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center fade-in">
          <div className="text-6xl mb-4">📭</div>
          <h2 className="text-2xl font-bold text-slate-800 mb-3">No results yet</h2>
          <p className="text-slate-500 mb-6">Run an analysis first to see your bias audit results.</p>
          <Link to="/analyze" className="bg-brand text-white px-6 py-3 rounded-xl font-semibold hover:bg-brand-dark transition-all">
            Start analysis →
          </Link>
        </div>
      </div>
    )
  }

  const {
  overall_severity,
  bias_score, 
  root_causes, 
  protected_attributes,
  outcome_column,
  total_rows,
  outcome_positive_rate,
  metrics,
  feature_importance,
  explanation,
  recommendations 
  } = results
// 🛡️ Safety check for empty metrics
  if (!metrics || Object.keys(metrics).length === 0) {
    return (
      <div className="pt-14 min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <h2 className="text-xl font-bold text-slate-800 mb-2">
            No valid bias metrics found
          </h2>
          <p className="text-slate-500">
            Try a different dataset or check your outcome column.
          </p>
        </div>
      </div>
    )
  }
  // Pick most biased attribute for chart
  let worstAttr = protected_attributes?.[0]
  let worstDI = 1
  for (const [attr, m] of Object.entries(metrics || {})) {
    if (m.disparate_impact_ratio < worstDI) { worstDI = m.disparate_impact_ratio; worstAttr = attr }
  }
  const worstMetric = metrics?.[worstAttr]
  const protectedSet = new Set((protected_attributes || []).map(a => a.toLowerCase()))

  async function downloadPDF() {
    setDownloading(true)
    try {
      const res = await fetch(`${API}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(results),
      })
      if (!res.ok) throw new Error('PDF generation failed')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = 'fairscan_audit_report.pdf'
      a.click(); URL.revokeObjectURL(url)
    } catch (e) {
      alert('PDF download failed: ' + e.message)
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="pt-14 min-h-screen bg-slate-50">
      {/* Top bar */}
      <div className="bg-white border-b border-slate-200 sticky top-14 z-30">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="font-bold text-lg text-slate-900">FairScan Audit Results</h1>
            <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${SEV_STYLE[overall_severity] || 'bg-gray-500 text-white'}`}>
              {overall_severity} SEVERITY
            </span>
          </div>
          <Link to="/analyze" className="text-sm text-brand font-medium hover:underline">
            ← Run new analysis
          </Link>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-10 space-y-8 fade-in">
      {/* 🔥 BIAS SCORE HERO */}
      {bias_score !== undefined && (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center shadow-sm">
          <h2 className="text-xl font-bold text-slate-800 mb-2">Bias Risk Score</h2>

          <div className={`text-6xl font-extrabold ${
            bias_score < 30 ? 'text-green-500' :
            bias_score < 70 ? 'text-orange-500' :
            'text-red-500'
          }`}>
            {bias_score}
          </div>

          <p className="mt-2 text-slate-600">
            Severity: <span className="font-bold">{overall_severity}</span>
          </p>

          {bias_score > 70 && (
            <p className="text-red-500 mt-3 font-medium">
              ⚠️ High risk of unfair outcomes detected
            </p>
          )}
        </div>
      )}
        {/* Dataset summary strip */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-wrap gap-6 text-sm">
          {[
            ['Total rows', total_rows],
            ['Outcome column', outcome_column],
            ['Positive rate', `${Math.round(outcome_positive_rate * 100)}%`],
            ['Protected attributes', protected_attributes?.join(', ')],
          ].map(([k, v]) => (
            <div key={k}>
              <div className="text-slate-400 text-xs uppercase tracking-wide mb-0.5">{k}</div>
              <div className="font-semibold text-slate-800">{v}</div>
            </div>
          ))}
        </div>

        {/* Metric cards per attribute */}
        {Object.entries(metrics || {}).map(([attr, m]) => (
          <div key={attr}>
            <h2 className="text-lg font-bold text-slate-700 mb-3 flex items-center gap-2">
              <span className="bg-brand text-white text-xs px-2.5 py-1 rounded-full uppercase">
                {attr}
              </span>
              Protected attribute analysis
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <MetricCard
                title="Disparate Impact Ratio"
                value={m.disparate_impact_ratio}
                severity={m.disparate_impact_severity}
                description={`${m.privileged_group} vs ${m.unprivileged_group}. Legal threshold ≥ 0.80 (80% rule).`}
                passFail={m.disparate_impact_ratio >= 0.8 ? 'PASS' : 'FAIL'}
              />
              <MetricCard
                title="Demographic Parity Diff"
                value={`${Math.round(m.demographic_parity_difference * 100)}%`}
                severity={m.demographic_parity_severity}
                description={`${m.privileged_group} outcome rate: ${Math.round(m.group_rates[m.privileged_group]*100)}% vs ${m.unprivileged_group}: ${Math.round(m.group_rates[m.unprivileged_group]*100)}%`}
                passFail={m.demographic_parity_difference <= 0.1 ? 'PASS' : 'FAIL'}
              />
              <MetricCard
                title="Statistical Significance"
                value={`p = ${m.chi_square_p_value}`}
                severity={m.statistically_significant ? 'HIGH' : 'LOW'}
                description={m.statistically_significant
                  ? 'The bias is statistically significant (p < 0.05). Unlikely to be random chance.'
                  : 'Not statistically significant. May be due to sample size.'}
              />
            </div>
          </div>
        ))}

        {/* Chart */}
        {worstMetric && (
          <BiasChart groupRates={worstMetric.group_rates} attributeName={worstAttr} />
        )}

        {/* Gemini explanation */}
        {explanation?.explanation && (
          <ExplanationBox explanation={explanation.explanation} />
        )}
        {/* 🧠 ROOT CAUSES */}
        {root_causes?.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <h3 className="font-bold text-slate-900 text-lg mb-2">
              Potential Bias Sources
            </h3>

            <div className="space-y-2 text-sm text-slate-700">
              {root_causes.map((c, i) => (
                <div key={i}>
                  ⚠️ <b>{c.feature}</b> contributes significantly to decisions
                </div>
              ))}
            </div>
          </div>
        )}
        {/* Feature importance */}
        {feature_importance?.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <h3 className="font-bold text-slate-900 text-lg mb-1">Top bias drivers</h3>
            <p className="text-sm text-slate-500 mb-5">
              Features most responsible for outcome differences ·
              <span className="text-red-500 font-medium"> Red = protected attribute</span>
            </p>
            <div className="space-y-4">
              {feature_importance.map(({ feature, importance }) => (
                <FeatureBar
                  key={feature}
                  feature={feature}
                  importance={importance}
                  isProtected={protectedSet.has(feature.toLowerCase())}
                />
              ))}
            </div>
          </div>
        )}

        {/* Fix recommendations */}
        {recommendations?.length > 0 && (
          <div>
            <h3 className="font-bold text-slate-900 text-xl mb-2">How to fix this</h3>
            <p className="text-slate-500 text-sm mb-4">Concrete steps to reduce bias in your system</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {recommendations.map((rec, i) => (
                <FixCard key={i} number={i + 1} text={rec} />
              ))}
            </div>
          </div>
        )}
        {/* 🤖 AI ADVISOR */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h3 className="font-bold text-slate-900 text-lg mb-3">
            AI Advisor
          </h3>

          <div className="h-40 overflow-y-auto border p-3 rounded mb-3 bg-slate-50 text-sm">
            {chat.length === 0 && (
              <p className="text-slate-400">
                Ask questions like “Why is this biased?” or “How can I fix it?”
              </p>
            )}

            {chat.map((msg, i) => (
              <div key={i} className="mb-2">
                <b>{msg.role === "user" ? "You" : "AI"}:</b> {msg.text}
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className="border p-2 flex-1 rounded"
              placeholder="Ask about bias..."
            />
            <button
              onClick={async () => {
                if (!question.trim()) return
                setAsking(true)

                try {
                  const res = await fetch(`${API}/ask`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      question,
                      context: results
                    })
                  })

                  const data = await res.json()

                  setChat(prev => [
                    ...prev,
                    { role: "user", text: question },
                    { role: "ai", text: data.answer }
                  ])

                  setQuestion("")
                } catch (err) {
                  console.error(err)
                } finally {
                  setAsking(false)
                }
              }}
              className="bg-brand text-white px-4 rounded"
            >
              {asking ? "..." : "Ask"}
            </button>
          </div>
        </div>
        {/* Download PDF */}
        <div className="bg-slate-900 rounded-2xl p-8 text-center">
          <h3 className="text-white font-bold text-2xl mb-2">Download Audit Report</h3>
          <p className="text-slate-400 mb-6">
            Professional PDF report with all metrics, charts, and recommendations —
            ready to share with your legal or compliance team.
          </p>
          <button
            onClick={downloadPDF}
            disabled={downloading}
            className="bg-brand hover:bg-brand-dark disabled:opacity-50 text-white font-bold px-10 py-4 rounded-2xl text-lg transition-all shadow-lg shadow-indigo-900/30"
          >
            {downloading ? '⏳ Generating PDF...' : '📄 Download Audit Report PDF'}
          </button>
        </div>

      </div>
    </div>
  )
}
