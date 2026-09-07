import { useState } from 'react'
import { cn } from '../../lib/utils'
import { useCountUp, useInViewOnce } from './chart-kit'

export interface OrbitNode {
  key: string
  label: string
  value: number
  description: string
  next: string
  color: string
  angle: number
  href?: string
}

/**
 * The signature visual: the academy as one system.
 * Everything orbits a single centre — teams, games, practices, signups —
 * which is the point the whole product is making.
 */
export function ActivityOrbit({
  nodes, centerValue, centerLabel = 'Players', onNodeClick, size = 380,
}: { nodes: OrbitNode[]; centerValue: number; centerLabel?: string; onNodeClick?: (key: string) => void; size?: number }) {
  const [ref, seen] = useInViewOnce<HTMLDivElement>()
  const [active, setActive] = useState<string | null>(null)
  const count = useCountUp(centerValue, seen, 1200)

  const cx = size / 2, cy = size / 2
  const orbitR = size * 0.345
  const node = nodes.find((n) => n.key === active)

  const pos = (angle: number) => ({
    x: cx + orbitR * Math.cos((angle - 90) * (Math.PI / 180)),
    y: cy + orbitR * Math.sin((angle - 90) * (Math.PI / 180)),
  })

  return (
    <div ref={ref} className="relative mx-auto" style={{ width: size, height: size, maxWidth: '100%' }}>
      <svg viewBox={`0 0 ${size} ${size}`} className="absolute inset-0 h-full w-full" aria-hidden="true">
        <defs>
          <radialGradient id="orbit-core" cx="50%" cy="38%" r="66%">
            <stop offset="0%" stopColor="#122C5C" />
            <stop offset="70%" stopColor="#0B1F45" />
            <stop offset="100%" stopColor="#080D18" />
          </radialGradient>
        </defs>

        {/* court geometry watermark */}
        <g opacity="0.055" stroke="#0B1F45" fill="none" strokeWidth="1">
          <circle cx={cx} cy={cy} r={orbitR + 34} />
          <circle cx={cx} cy={cy} r={orbitR - 40} />
          <line x1={cx - orbitR - 40} y1={cy} x2={cx + orbitR + 40} y2={cy} />
          <line x1={cx} y1={cy - orbitR - 40} x2={cx} y2={cy + orbitR + 40} />
        </g>

        {/* slow decorative orbit ring */}
        <circle
          cx={cx} cy={cy} r={orbitR} fill="none" stroke="#0B1F45" strokeOpacity="0.10"
          strokeWidth="1" strokeDasharray="2 8" strokeLinecap="round"
          style={{ transformOrigin: `${cx}px ${cy}px`, animation: 'spin 72s linear infinite' }}
        />

        {/* connectors */}
        {nodes.map((n, i) => {
          const p = pos(n.angle)
          const on = active === null || active === n.key
          return (
            <line
              key={n.key}
              x1={cx} y1={cy} x2={p.x} y2={p.y}
              stroke={n.color} strokeWidth={active === n.key ? 1.6 : 1}
              strokeOpacity={on ? (active === n.key ? 0.5 : 0.2) : 0.07}
              style={{
                strokeDasharray: 200, strokeDashoffset: seen ? 0 : 200,
                transition: `stroke-dashoffset 800ms cubic-bezier(0.22,1,0.36,1) ${180 + i * 90}ms, stroke-opacity 180ms`,
              }}
            />
          )
        })}

        {/* core */}
        <circle cx={cx} cy={cy} r={size * 0.152} fill="url(#orbit-core)" />
        <circle cx={cx} cy={cy} r={size * 0.152} fill="none" stroke="#F05A1A" strokeOpacity="0.30" strokeWidth="1" />
        <path
          d={`M ${cx - size * 0.152} ${cy} a ${size * 0.152} ${size * 0.152} 0 0 0 ${size * 0.304} 0`}
          fill="none" stroke="#ffffff" strokeOpacity="0.08" strokeWidth="1"
        />
      </svg>

      {/* Centre readout */}
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="font-display text-[12px] font-semibold uppercase tracking-[0.22em] text-orange">Cavs</span>
        <span className="stat mt-0.5 text-[34px] leading-none text-white">{Math.round(count)}</span>
        <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/45">{centerLabel}</span>
      </div>

      {/* Orbiting nodes */}
      {nodes.map((n, i) => {
        const p = pos(n.angle)
        const on = active === null || active === n.key
        return (
          <button
            key={n.key}
            onMouseEnter={() => setActive(n.key)}
            onMouseLeave={() => setActive(null)}
            onFocus={() => setActive(n.key)}
            onBlur={() => setActive(null)}
            onClick={() => onNodeClick?.(n.key)}
            className={cn(
              'absolute flex flex-col items-center rounded-xl border bg-white px-3 py-2 transition-all duration-200 ease-premium',
              active === n.key ? 'border-[#D9DDE5] shadow-lift' : 'border-line shadow-card'
            )}
            style={{
              left: p.x, top: p.y,
              transitionDelay: seen ? '0ms' : `${240 + i * 90}ms`,
              transform: `translate(-50%, calc(-50% - ${active === n.key ? 2 : 0}px)) scale(${seen ? 1 : 0.85})`,
              opacity: seen ? (on ? 1 : 0.35) : 0,
            }}
          >
            <span className="stat text-[20px] leading-none" style={{ color: n.color }}>{n.value}</span>
            <span className="mt-0.5 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-ink-3">{n.label}</span>
          </button>
        )
      })}

      {/* Detail readout — replaces a tooltip so it never covers the orbit */}
      <div className="absolute inset-x-0 -bottom-1 flex justify-center px-4">
        <div className={cn(
          'rounded-xl border border-line bg-white px-3.5 py-2 text-center shadow-card transition-all duration-200',
          node ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1 pointer-events-none'
        )}>
          <p className="text-[12.5px] font-medium text-ink">{node?.description}</p>
          <p className="mt-0.5 text-[11.5px] text-ink-3">{node?.next}</p>
        </div>
      </div>
    </div>
  )
}
