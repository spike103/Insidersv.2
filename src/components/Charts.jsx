import React from 'react'

export function ROICurve({ data, width = 330, height = 120, color = '#22c55e' }) {
  if (!data || data.length < 2) {
    return <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--fg-3)', fontSize: 12 }}>Pas assez de données</div>
  }
  const W = width, H = height
  const pad = { t: 10, b: 10 }
  const min = Math.min(...data, 0), max = Math.max(...data, 0)
  const range = (max - min) || 1
  const step = W / (data.length - 1)
  const y = v => H - pad.b - ((v - min) / range) * (H - pad.t - pad.b)
  const pts = data.map((v, i) => [i * step, y(v)])
  const zeroY = y(0)
  const path = pts.map((p, i) => (i === 0 ? 'M' : 'L') + p[0] + ',' + p[1]).join(' ')
  const areaPath = path + ` L ${pts[pts.length - 1][0]},${H} L ${pts[0][0]},${H} Z`
  const id = `g${Math.random().toString(36).slice(2, 7)}`
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: 'block' }} preserveAspectRatio="none">
      <defs>
        <linearGradient id={id} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <line x1="0" y1={zeroY} x2={W} y2={zeroY} stroke="rgba(255,255,255,0.08)" strokeDasharray="2 4" />
      <path d={areaPath} fill={`url(#${id})`} />
      <path d={path} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="5" fill={color} />
      <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="9" fill={color} opacity="0.25" />
    </svg>
  )
}

export function Ring({ value, max = 100, size = 80, stroke = 8, color = '#2962ff', track = 'var(--ink-600)', children }) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const pct = Math.max(0, Math.min(1, value / max))
  const offset = c * (1 - pct)
  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeLinecap="round" strokeDasharray={c} strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 700ms cubic-bezier(0.22, 1, 0.36, 1)' }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
        {children}
      </div>
    </div>
  )
}

export function Radar({ data, size = 200, color = '#2962ff' }) {
  if (!data || data.length === 0) return null
  const cx = size / 2, cy = size / 2, r = size / 2 - 28
  const n = data.length
  const angle = i => -Math.PI / 2 + (i / n) * Math.PI * 2
  const point = (i, v) => {
    const a = angle(i); const rr = r * (v / 100)
    return [cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]
  }
  const poly = data.map((d, i) => point(i, d.value)).map(p => p.join(',')).join(' ')
  return (
    <svg width={size} height={size} style={{ display: 'block' }}>
      {[0.25, 0.5, 0.75, 1].map((f, i) => (
        <circle key={i} cx={cx} cy={cy} r={r * f} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
      ))}
      {data.map((_, i) => {
        const [x, y] = point(i, 100)
        return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="rgba(255,255,255,0.06)" />
      })}
      <polygon points={poly} fill={color} fillOpacity="0.25" stroke={color} strokeWidth="2" strokeLinejoin="round" />
      {data.map((d, i) => {
        const a = angle(i)
        const tx = cx + Math.cos(a) * (r + 16)
        const ty = cy + Math.sin(a) * (r + 16)
        return (
          <text key={d.label} x={tx} y={ty} textAnchor="middle" dominantBaseline="middle"
            fontSize="10" fontWeight="600" fill="var(--fg-2)" fontFamily="Poppins">{d.label}</text>
        )
      })}
      {data.map((d, i) => {
        const [x, y] = point(i, d.value)
        return <circle key={i} cx={x} cy={y} r="3.5" fill={color} stroke="var(--ink-900)" strokeWidth="1.5" />
      })}
    </svg>
  )
}

export function Heatmap({ data, accent = '#2962ff' }) {
  if (!data || data.length === 0) return null
  const max = Math.max(...data.flat(), 1)
  const days = ['L', 'M', 'M', 'J', 'V', 'S', 'D']
  return (
    <div style={{ display: 'flex', gap: 6, alignItems: 'flex-start' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, paddingTop: 2 }}>
        {days.map((d, i) => (
          <div key={i} style={{ height: 12, fontSize: 9, color: 'var(--fg-3)', fontWeight: 600, width: 10 }}>{d}</div>
        ))}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(24, 1fr)', gap: 2 }}>
          {data.flatMap((row, di) =>
            row.map((v, hi) => {
              const a = v === 0 ? 0.05 : 0.15 + (v / max) * 0.85
              return (
                <div key={`${di}-${hi}`} style={{
                  aspectRatio: '1', borderRadius: 2,
                  background: v === 0 ? 'var(--ink-700)' : accent,
                  opacity: v === 0 ? 0.25 : a,
                }} />
              )
            })
          )}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: 'var(--fg-3)', marginTop: 4 }}>
          <span>00h</span><span>06h</span><span>12h</span><span>18h</span><span>24h</span>
        </div>
      </div>
    </div>
  )
}

export function SurfaceBar({ label, roi, bets, win, max = 25 }) {
  const pct = Math.min(1, Math.abs(roi) / max)
  const positive = roi >= 0
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, alignItems: 'baseline' }}>
        <span style={{ fontWeight: 600, fontSize: 14 }}>{label}</span>
        <span style={{ fontSize: 11, color: 'var(--fg-3)' }}>{bets} paris · {win}% réussis</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ flex: 1, height: 10, background: 'var(--ink-700)', borderRadius: 999, position: 'relative', overflow: 'hidden' }}>
          <div style={{
            position: 'absolute', top: 0, bottom: 0,
            left: positive ? '50%' : `${50 - pct * 50}%`,
            width: `${pct * 50}%`,
            background: positive ? 'var(--win-500)' : 'var(--loss-500)',
            borderRadius: 999,
          }} />
          <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: 1, background: 'rgba(255,255,255,0.15)' }} />
        </div>
        <span style={{ fontWeight: 700, fontSize: 14, width: 56, textAlign: 'right', color: positive ? 'var(--win-500)' : 'var(--loss-500)' }}>
          {positive ? '+' : ''}{roi.toFixed(1)}%
        </span>
      </div>
    </div>
  )
}

export function BarChart({ data, width = 330, height = 110 }) {
  if (!data || data.length === 0) return null
  const W = width, H = height
  const pad = { t: 8, b: 22 }
  const max = Math.max(...data.map(d => Math.abs(d.v))) || 1
  const barW = (W / data.length) * 0.58
  const gap = (W / data.length)
  const zeroY = pad.t + (H - pad.t - pad.b) * 0.5
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: 'block' }} preserveAspectRatio="none">
      <line x1="0" y1={zeroY} x2={W} y2={zeroY} stroke="rgba(255,255,255,0.08)" strokeDasharray="2 4" />
      {data.map((d, i) => {
        const h = (Math.abs(d.v) / max) * ((H - pad.t - pad.b) * 0.45)
        const x = i * gap + gap / 2 - barW / 2
        const y = d.v >= 0 ? zeroY - h : zeroY
        return (
          <g key={i}>
            <rect x={x} y={y} width={barW} height={h} rx="3" fill={d.v >= 0 ? '#22c55e' : '#ef4444'} />
            <text x={x + barW / 2} y={H - 6} textAnchor="middle" fontSize="10" fill="var(--fg-3)" fontFamily="Poppins">{d.m}</text>
          </g>
        )
      })}
    </svg>
  )
}
