export function formatRM(n) {
  const sign = n < 0 ? '-' : ''
  const abs = Math.abs(n).toLocaleString('en-MY', {
    minimumFractionDigits: 2, maximumFractionDigits: 2,
  })
  return `${sign}RM ${abs}`
}

export function formatPct(fraction) {
  return `${(fraction * 100).toFixed(1)}%`
}
