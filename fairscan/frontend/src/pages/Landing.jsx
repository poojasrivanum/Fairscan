import React from 'react'
import { Link } from 'react-router-dom'

const stats = [
  { value: '67%', label: 'of hiring algorithms show measurable gender bias' },
  { value: '2.3×', label: 'higher loan denial rates for minority applicants' },
  { value: '39%', label: 'of healthcare AI under-treats Black patients' },
]

const steps = [
  { icon: '📤', title: 'Upload your data', desc: 'Drop any CSV file with decision outcomes like hiring, loans, healthcare. Or try our built-in demo instantly.' },
  { icon: '🔬', title: 'Automatic analysis', desc: 'FairScan runs 3 fairness metrics simultaneously disparate impact, demographic parity, and statistical significance.' },
  { icon: '✦', title: 'AI-powered explanation', desc: 'Gemini translates raw numbers into plain English so any manager not just data scientists can understand and act.' },
]

export default function Landing() {
  return (
    <div className="pt-14">
      {/* Hero */}
      <section className="min-h-[90vh] flex flex-col items-center justify-center text-center px-4 relative overflow-hidden">
        {/* Background blobs */}
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-indigo-100 rounded-full blur-3xl opacity-50 pointer-events-none" />
        <div className="absolute bottom-20 right-1/4 w-80 h-80 bg-purple-100 rounded-full blur-3xl opacity-40 pointer-events-none" />

        <div className="relative z-10 max-w-4xl fade-in">
          <div className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-200 text-indigo-700 text-sm font-medium px-4 py-1.5 rounded-full mb-6">
            <span>🏆</span> Google Solution Challenge 2025
          </div>

          <h1 className="text-5xl sm:text-7xl font-extrabold leading-tight mb-6">
            Is your AI treating<br />
            <span className="gradient-text">everyone fairly?</span>
          </h1>

          <p className="text-xl text-slate-500 max-w-2xl mx-auto mb-10 leading-relaxed">
            FairScan detects hidden bias in hiring, loans, and healthcare decisions —
            and tells you exactly how to fix it, in plain English.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/analyze"
              className="bg-brand hover:bg-brand-dark text-white font-semibold px-8 py-4 rounded-2xl text-lg transition-all shadow-lg shadow-indigo-200 hover:shadow-indigo-300 hover:-translate-y-0.5"
            >
              Try free demo ⚡
            </Link>
            <Link
              to="/analyze"
              className="bg-white hover:bg-slate-50 text-slate-800 font-semibold px-8 py-4 rounded-2xl text-lg transition-all border border-slate-200 hover:border-slate-300"
            >
              Upload your data →
            </Link>
          </div>

          <p className="mt-6 text-sm text-slate-400">No account needed · Works with any CSV · Free forever</p>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-slate-900 py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <p className="text-center text-slate-400 text-sm font-medium uppercase tracking-widest mb-10">The scale of the problem</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {stats.map((s, i) => (
              <div key={i} className="text-center p-8 rounded-2xl bg-slate-800 border border-slate-700">
                <div className="text-5xl font-extrabold text-brand-light mb-3">{s.value}</div>
                <div className="text-slate-300 leading-relaxed">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-2">How it works</h2>
          <p className="text-slate-500 text-center mb-12">Three steps from data to actionable insight</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {steps.map((s, i) => (
              <div key={i} className="card-hover p-8 rounded-2xl border border-slate-100 bg-slate-50">
                <div className="text-4xl mb-4">{s.icon}</div>
                <div className="text-xs font-bold text-brand uppercase tracking-wider mb-2">Step {i + 1}</div>
                <h3 className="text-xl font-bold mb-3 text-slate-900">{s.title}</h3>
                <p className="text-slate-500 leading-relaxed text-sm">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SDGs */}
      <section className="py-16 px-4 bg-slate-50">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-slate-500 text-sm mb-6 uppercase tracking-widest font-medium">UN Sustainable Development Goals</p>
          <div className="flex flex-wrap justify-center gap-4">
            <span className="bg-orange-100 text-orange-800 border border-orange-200 px-5 py-2.5 rounded-full font-semibold">
              🌍 SDG 10 — Reduced Inequalities
            </span>
            <span className="bg-blue-100 text-blue-800 border border-blue-200 px-5 py-2.5 rounded-full font-semibold">
              ⚖️ SDG 16 — Justice & Strong Institutions
            </span>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-brand">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-4">Start your bias audit today</h2>
          <p className="text-indigo-200 mb-8 text-lg">Upload your data or try our hiring demo — results in under 30 seconds.</p>
          <Link
            to="/analyze"
            className="bg-white text-brand font-bold px-10 py-4 rounded-2xl text-lg hover:bg-indigo-50 transition-all inline-block shadow-xl"
          >
            Analyze for bias →
          </Link>
        </div>
      </section>

      <footer className="bg-slate-900 text-slate-500 text-center py-6 text-sm">
        Built for Google Solution Challenge 2025 · FairScan ⚖️
      </footer>
    </div>
  )
}
