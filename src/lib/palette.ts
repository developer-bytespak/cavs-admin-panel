/**
 * Chart palette.
 * Categorical slots are assigned in fixed order and follow the entity, never its rank —
 * filtering a team out never repaints the survivors.
 * Both sets were machine-validated (lightness band, chroma floor, CVD separation,
 * normal-vision floor, contrast) against their own surface.
 */
export const SERIES = ['#1746C7', '#F05A1A', '#0E9F8E', '#7C5CE0', '#B77900', '#D9457F'] as const
export const SERIES_ARENA = ['#4F7DF5', '#E85E24', '#0FA694', '#9276E8', '#BE8410', '#DE4E88'] as const

/** Sequential ramp — one hue, light → dark. Magnitude only. */
export const RAMP_BLUE = ['#EEF3FE', '#D8E3FC', '#B6C9F7', '#8BA7EF', '#5D82E3', '#3159CE', '#1C3C96'] as const

/** Status colours are reserved. They never stand in for "series 4". */
export const STATUS = {
  good: '#0E8F63',
  warn: '#B77900',
  bad: '#C93A45',
  neutral: '#9BA1AC',
} as const

export const INK = { primary: '#111318', secondary: '#737984', muted: '#9BA1AC', grid: '#EEF0F4' }
export const INK_ARENA = { primary: '#FFFFFF', secondary: 'rgba(255,255,255,0.62)', muted: 'rgba(255,255,255,0.40)', grid: 'rgba(255,255,255,0.07)' }

/** Pick a ramp step for a 0–1 magnitude. */
export function rampStep(t: number) {
  const i = Math.min(RAMP_BLUE.length - 1, Math.max(0, Math.round(t * (RAMP_BLUE.length - 1))))
  return RAMP_BLUE[i]
}

export const teamColor = (id: string, teams: { id: string }[]) => {
  const i = teams.findIndex((t) => t.id === id)
  return SERIES[(i < 0 ? 0 : i) % SERIES.length]
}
