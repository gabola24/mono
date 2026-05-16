export function renderScope(analyser: AnalyserNode, width: number, height: number): string[] {
  const buf = new Float32Array(analyser.fftSize)
  analyser.getFloatTimeDomainData(buf)

  const center = Math.floor(height / 2)
  const grid: string[][] = Array.from({ length: height }, (_, i) =>
    Array(width).fill(i === center ? '·' : ' ')
  )

  const prevRow: number[] = []
  for (let x = 0; x < width; x++) {
    const idx = Math.floor((x * analyser.fftSize) / width)
    const v = buf[idx]
    const row = Math.max(0, Math.min(height - 1, Math.round(((1 - v) / 2) * (height - 1))))
    grid[row][x] = '━'

    // Connect vertically to previous column when the jump is > 1 row
    if (x > 0 && Math.abs(row - prevRow[x - 1]) > 1) {
      const lo = Math.min(row, prevRow[x - 1]) + 1
      const hi = Math.max(row, prevRow[x - 1]) - 1
      for (let r = lo; r <= hi; r++) {
        if (grid[r][x] === ' ' || grid[r][x] === '·') grid[r][x] = '│'
      }
    }
    prevRow[x] = row
  }

  return grid.map((row) => row.join(''))
}
