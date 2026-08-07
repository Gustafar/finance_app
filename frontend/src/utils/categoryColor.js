export const COLOR_PALETTE = {
  indigo: { bg: '#c7d2fe', text: '#4338ca' },
  emerald: { bg: '#a7f3d0', text: '#047857' },
  orange: { bg: '#fed7aa', text: '#c2410c' },
  pink: { bg: '#fbcfe8', text: '#be185d' },
  sky: { bg: '#bae6fd', text: '#0369a1' },
  amber: { bg: '#fde68a', text: '#a16207' },
  violet: { bg: '#ddd6fe', text: '#6d28d9' },
  lime: { bg: '#bbf7d0', text: '#15803d' },
  slate: { bg: '#cbd5e1', text: '#475569' },
}

export const COLOR_KEYS = Object.keys(COLOR_PALETTE)

export function paletteColor(colorKey) {
  return COLOR_PALETTE[colorKey] ?? COLOR_PALETTE.slate
}
