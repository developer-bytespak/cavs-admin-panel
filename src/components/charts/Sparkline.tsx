import { useMemo } from 'react'
import { smoothPath, useInViewOnce } from './chart-kit'

export function Sparkline({
  values, color = '#1746C7', width = 96, height = 30, area = true, id,
}: { values: number[]; color?: string; width?: number; height?: number; area?: boolean; id: string }) {
  const [ref, seen] = useInViewOnce<HTMLSpanElement>('0px')
  const { line, fill } = useMemo(() => {
    const min = Math.min(...values), max = Math.max(...values)
    const pts = values.map((v, i) => ({
      x: (i / (values.length - 1 || 1)) * (width - 3) + 1.5,
      y: height - 3 - ((v - min) / (max - min || 1)) * (height - 6),
    }))
    const l = smoothPath(pts)
    return { line: l, fill: `${l} L ${pts[pts.length - 1].x} ${height} L ${pts[0].x} ${height} Z` }
  }, [values, width, height])

  return (
    <span ref={ref} className="inline-block align-middle">
      <svg width={width} height={height} className="block" aria-hidden="true">
        <defs>
          <linearGradient id={`spark-${id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.20" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        {area && <path d={fill} fill={`url(#spark-${id})`} style={{ opacity: seen ? 1 : 0, transition: 'opacity 600ms 300ms' }} />}
        <path d={line} fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round"
          className={seen ? 'draw-line' : undefined} style={{ ['--len' as string]: '400' }} />
      </svg>
    </span>
  )
}
