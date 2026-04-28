import React from 'react'
import { Link, useLocation } from 'react-router-dom'

export default function Navbar() {
  const { pathname } = useLocation()

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
        <Link to="/" className="flex items-center gap-2">
          <span className="text-2xl">⚖️</span>
          <span className="font-bold text-lg text-slate-900">
            Fair<span className="text-brand">Scan</span>
          </span>
        </Link>
        <div className="flex items-center gap-1">
          {[['/', 'Home'], ['/analyze', 'Analyze'], ['/results', 'Results']].map(([path, label]) => (
            <Link
              key={path}
              to={path}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                pathname === path
                  ? 'bg-brand text-white'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  )
}
