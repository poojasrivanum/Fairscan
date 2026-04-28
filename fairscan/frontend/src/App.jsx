import React, { createContext, useContext, useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Landing from './pages/Landing.jsx'
import Analyze from './pages/Analyze.jsx'
import Results from './pages/Results.jsx'
import Navbar from './components/Navbar.jsx'

// Global context to pass results from Analyze → Results
export const ResultsContext = createContext(null)

export function useResults() {
  return useContext(ResultsContext)
}

export default function App() {
  const [results, setResults] = useState(null)

  return (
    <ResultsContext.Provider value={{ results, setResults }}>
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/analyze" element={<Analyze />} />
          <Route path="/results" element={<Results />} />
        </Routes>
      </BrowserRouter>
    </ResultsContext.Provider>
  )
}
