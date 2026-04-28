import React, { useEffect, useRef } from 'react'

export default function BiasChart({ groupRates, attributeName }) {
  const canvasRef = useRef()
  const chartRef = useRef()

  useEffect(() => {
    if (!groupRates || !window.Chart) return

    const labels = Object.keys(groupRates)
    const data = Object.values(groupRates).map(v => Math.round(v * 100))
    const maxRate = Math.max(...data)

    const backgroundColors = data.map(v =>
      v < maxRate * 0.8 ? 'rgba(220,38,38,0.75)' : 'rgba(22,163,74,0.75)'
    )
    const borderColors = data.map(v =>
      v < maxRate * 0.8 ? 'rgb(220,38,38)' : 'rgb(22,163,74)'
    )

    if (chartRef.current) chartRef.current.destroy()

    chartRef.current = new window.Chart(canvasRef.current, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Positive outcome rate (%)',
          data,
          backgroundColor: backgroundColors,
          borderColor: borderColors,
          borderWidth: 2,
          borderRadius: 8,
        }],
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: ctx => ` ${ctx.parsed.x}% outcome rate`,
            },
          },
        },
        scales: {
          x: {
            min: 0, max: 100,
            ticks: { callback: v => `${v}%`, font: { family: 'DM Sans' } },
            grid: { color: 'rgba(0,0,0,0.05)' },
          },
          y: { ticks: { font: { family: 'DM Sans', weight: '500' } } },
        },
      },
    })

    return () => { if (chartRef.current) chartRef.current.destroy() }
  }, [groupRates])

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6">
      <h3 className="font-bold text-slate-900 text-lg mb-1">
        Outcome rates by group
      </h3>
      <p className="text-sm text-slate-500 mb-4">
        Attribute: <span className="font-semibold text-brand">{attributeName}</span> ·
        <span className="text-red-500 font-medium"> Red = below 80% threshold</span> ·
        <span className="text-green-600 font-medium"> Green = reference group</span>
      </p>
      <div style={{ height: `${Math.max(120, Object.keys(groupRates || {}).length * 52)}px` }}>
        <canvas ref={canvasRef} />
      </div>
    </div>
  )
}
